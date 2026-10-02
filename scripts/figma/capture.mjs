import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { extractRenderedDom } from "./browser.mjs";
import { buildCaptureInventory } from "./inventory.mjs";
import { normalizeCapture, splitCss } from "./normalize.mjs";
import { capturePseudoBoxes } from "./pseudo.mjs";

/** Wait for the authored play state, fonts, image decoding and stable layout. */
export async function prepareStory(page, { story, baseUrl, height = 1000, timeout = 30000 }) {
  await page.setViewportSize({ width: story.width, height });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto(
    `${baseUrl.replace(/\/$/, "")}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`,
    { waitUntil: "load", timeout },
  );
  await page.locator('body[data-kit-ready="true"]').waitFor({ timeout });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const image of document.images) image.loading = "eager";
    await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
    window.scrollTo(0, 0);
    // Finish finite animations; freeze loops at their reduced-motion start.
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getComputedTiming().iterations === Infinity) {
        animation.pause();
        animation.currentTime = 0;
      } else {
        try {
          animation.finish();
        } catch {
          animation.cancel();
        }
      }
    }
    const style = document.createElement("style");
    style.dataset.figmaCapture = "true";
    style.textContent =
      "*, *::before, *::after { transition: none !important; caret-color: transparent !important; }";
    document.head.append(style);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForFunction(
    () => {
      const signature = [...document.querySelectorAll("#app-root, #app-root *, [role=dialog]")]
        .map((element) => {
          const r = element.getBoundingClientRect();
          return `${r.x},${r.y},${r.width},${r.height}`;
        })
        .join(";");
      const previous = window.__figmaLayoutSignature;
      window.__figmaLayoutSignature = signature;
      return previous === signature;
    },
    null,
    { polling: "raf", timeout },
  );
}

/**
 * Isolated browser-to-scene capture. Only same-origin assets are fetched unless
 * an explicit allowlist is supplied; their bytes and digest travel with export.
 */
export async function captureStory(
  page,
  { story, baseUrl, tokenNames = [], variableKeys, screenshotPath, allowAssetOrigins = [] },
) {
  const diagnostics = [];
  const allowed = new Set([new URL(baseUrl).origin, ...allowAssetOrigins]);
  const blockExternal = async (route) => {
    const url = route.request().url();
    if (/^(data|blob):/.test(url) || allowed.has(new URL(url).origin)) await route.continue();
    else {
      diagnostics.push({
        severity: "error",
        code: "EXTERNAL_ASSET",
        message: `Unpinned external request blocked: ${url}`,
        nodeKey: `story:${story.id}`,
      });
      await route.abort("blockedbyclient");
    }
  };
  await page.route("**/*", blockExternal);
  try {
    await prepareStory(page, { story, baseUrl });
    const pseudoBoxes = await capturePseudoBoxes(page);
    const raw = await page.evaluate(extractRenderedDom, {
      storyId: story.id,
      tokenNames,
      pseudoBoxes,
    });
    const assets = new Map();
    async function loadAsset(url, node, background = false) {
      const filter =
        !background &&
        /^(?:(?:grayscale|saturate|brightness|contrast|opacity|hue-rotate)\([\d.]+(?:deg)?\)\s*)+$/.test(
          node.style.filter,
        )
          ? node.style.filter
          : null;
      const assetKey = filter ? `${url}#css-filter:${filter}` : url;
      if (node.image && !background) node.image.assetKey = assetKey;
      if (!assets.has(assetKey)) {
        if (!background && (!node.image.naturalWidth || !node.image.naturalHeight)) {
          diagnostics.push({
            severity: "error",
            code: "IMAGE_DECODE_FAILED",
            message: `Visible image failed to decode: ${url}`,
            nodeKey: node.key,
          });
        } else if (/^data:/.test(url) || allowed.has(new URL(url).origin)) {
          let bytes, mimeType;
          if (url.startsWith("data:")) {
            const comma = url.indexOf(",");
            mimeType = url.slice(5, comma).split(";")[0];
            bytes = url.slice(5, comma).includes(";base64")
              ? Buffer.from(url.slice(comma + 1), "base64")
              : Buffer.from(
                  decodeURIComponent(url.slice(comma + 1).replace(/%(?![\da-f]{2})/gi, "%25")),
                );
          } else {
            const response = await page.request.get(url);
            if (!response.ok()) throw new Error(`Image request ${response.status()}: ${url}`);
            bytes = await response.body();
            mimeType =
              response.headers()["content-type"]?.split(";")[0] ?? "application/octet-stream";
          }
          const digest = createHash("sha256").update(bytes).digest("hex");
          // SVG image assets with filters (for example source grain textures)
          // are image media, not component snapshots. Decode only that original
          // asset at intrinsic resolution into Figma's supported PNG format.
          const rasterize =
            filter ||
            background ||
            mimeType === "image/webp" ||
            (mimeType === "image/svg+xml" &&
              /<(?:filter|image|foreignObject)\b/i.test(bytes.toString("utf8")));
          if (rasterize) {
            const decoded = await page.evaluate(
              async ({ url, filter }) => {
                const image = new Image();
                image.src = url;
                await image.decode();
                const canvas = document.createElement("canvas");
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                const context = canvas.getContext("2d");
                if (filter) context.filter = filter;
                context.drawImage(image, 0, 0);
                return {
                  bytesBase64: canvas.toDataURL("image/png").split(",")[1],
                  width: canvas.width,
                  height: canvas.height,
                };
              },
              { url, filter },
            );
            assets.set(assetKey, {
              ...decoded,
              mimeType: "image/png",
              digest,
              filterApplied: Boolean(filter),
            });
            diagnostics.push({
              severity: "warning",
              code: "IMAGE_ASSET_DECODED",
              nodeKey: node.key,
              message:
                "Original image media was decoded at intrinsic resolution into a native image fill; surrounding components remain editable.",
            });
          } else
            assets.set(
              assetKey,
              mimeType === "image/svg+xml"
                ? { svg: bytes.toString("utf8"), mimeType, digest }
                : { bytesBase64: bytes.toString("base64"), mimeType, digest },
            );
        }
      }
    }
    async function loadAssets(node) {
      if (node.image) await loadAsset(node.image.url, node);
      for (const paint of splitCss(node.style["background-image"] ?? "none")) {
        const match = paint.match(/^url\(["']?(.*?)["']?\)$/);
        if (match) await loadAsset(match[1], node, true);
      }
      for (const child of node.children ?? []) await loadAssets(child);
    }
    for (const node of raw.children) await loadAssets(node);
    if (screenshotPath)
      await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
    const normalized = normalizeCapture(raw, story, { assets, variableKeys });
    normalized.diagnostics.push(...diagnostics);
    const assetEvidence = [...assets]
      .map(([url, asset]) => ({
        url: url.startsWith("data:") ? `data:${asset.digest}` : new URL(url).pathname,
        digest: asset.digest,
        mimeType: asset.mimeType,
      }))
      .sort((a, b) => a.url.localeCompare(b.url));
    return {
      ...normalized,
      evidence: {
        storyId: story.id,
        width: story.width,
        assets: assetEvidence,
        fonts: raw.fontFaces,
        screenshot: screenshotPath ? path.basename(screenshotPath) : null,
      },
    };
  } finally {
    await page.unroute("**/*", blockExternal);
  }
}

/** Captures each authored visual story exactly once into deterministic scene pages. */
export async function captureManifest({
  manifest,
  baseUrl,
  release,
  tokenNames = [],
  variableKeys,
  storyIds,
  width = 1440,
  screenshotDirectory,
  onProgress = () => {},
  browser: suppliedBrowser,
}) {
  const inventory = buildCaptureInventory(manifest, { storyIds, width });
  if (!inventory.length) throw new Error("No visual stories selected for Figma capture.");
  if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true });
  const browser = suppliedBrowser ?? (await chromium.launch());
  const pages = new Map();
  const diagnostics = [];
  const captures = [];
  try {
    for (const [index, story] of inventory.entries()) {
      const context = await browser.newContext({
        reducedMotion: "reduce",
        locale: "en-US",
        timezoneId: "UTC",
        deviceScaleFactor: 1,
      });
      try {
        const page = await context.newPage();
        const captured = await captureStory(page, {
          story,
          baseUrl,
          tokenNames,
          variableKeys,
          screenshotPath: screenshotDirectory
            ? path.join(screenshotDirectory, `${story.id}.png`)
            : undefined,
        });
        const category = story.family.split("-")[0];
        if (!pages.has(category))
          pages.set(category, {
            key: `page:${category}`,
            name: category[0].toUpperCase() + category.slice(1),
            children: [],
          });
        const scenePage = pages.get(category);
        captured.node.y =
          scenePage.children.reduce((bottom, node) => Math.max(bottom, node.y + node.height), 80) +
          80;
        captured.node.x = 80;
        scenePage.children.push(captured.node);
        diagnostics.push(...captured.diagnostics);
        captures.push(captured.evidence);
      } catch (error) {
        diagnostics.push({
          severity: "error",
          code: "STORY_CAPTURE_FAILED",
          message: `${story.id}: ${error.message}`,
          nodeKey: `story:${story.id}`,
        });
      } finally {
        await context.close();
      }
      onProgress({ done: index + 1, total: inventory.length, storyId: story.id });
    }
  } finally {
    if (!suppliedBrowser) await browser.close();
  }
  return {
    schemaVersion: 1,
    package: manifest.package,
    release,
    collections: [],
    variables: [],
    textStyles: [],
    effectStyles: [],
    pages: [...pages.values()],
    diagnostics,
    source: {
      renderer: "storybook-dom-v1",
      browser: "chromium",
      canonicalWidth: width,
      runtime:
        "Storybook JavaScript with completed play functions; no-JavaScript rendering is not represented",
      inventory: inventory.map(({ id, family, kind, width, exports }) => ({
        id,
        family,
        kind,
        width,
        exports,
      })),
      captures,
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const option = (name, fallback) =>
    args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
  const output = option("--output", "artifacts/figma/capture.json");
  const manifest = JSON.parse(
    await readFile(option("--manifest", "storybook-static/design/manifest.json"), "utf8"),
  );
  const tokenManifest = JSON.parse(
    await readFile(option("--tokens", "storybook-static/design/tokens.json"), "utf8"),
  );
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  manifest.package = pkg.name;
  const storyIds = option("--stories", process.env.FIGMA_STORIES)?.split(",").filter(Boolean);
  const scene = await captureManifest({
    manifest,
    baseUrl: option("--base-url", process.env.STORYBOOK_BASE_URL ?? "http://127.0.0.1:6006"),
    release: {
      version: pkg.version,
      commit:
        process.env.FIGMA_SOURCE_COMMIT ??
        execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    },
    storyIds,
    tokenNames: [...new Set(tokenManifest.tokens.map((token) => token.name))],
    screenshotDirectory: path.join(path.dirname(output), "previews"),
    onProgress: ({ done, total, storyId }) => {
      if (done % 10 === 0 || done === total) console.log(`Captured ${done}/${total}: ${storyId}`);
    },
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(scene, null, 2)}\n`);
  const errors = scene.diagnostics.filter((diagnostic) => diagnostic.severity === "error");
  console.log(
    `Wrote ${scene.source.captures.length} editable story scenes to ${output}; ${errors.length} fidelity errors, ${scene.diagnostics.length - errors.length} warnings.`,
  );
  if (args.includes("--strict") && errors.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main();
