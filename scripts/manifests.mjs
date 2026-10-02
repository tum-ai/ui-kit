import { readFile, writeFile, mkdir } from "node:fs/promises";
import "./generate-api.mjs";
import postcss from "postcss";
import { publicApi, storyMetadata, nonvisual } from "./catalog.mjs";
const provenance = JSON.parse(await readFile("extraction.json", "utf8"));
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const index = JSON.parse(await readFile("storybook-static/index.json", "utf8"));
const stories = storyMetadata();
const api = publicApi();
const covered = new Set(stories.flatMap((s) => s.exports));
const missing = api.filter((x) => x.runtime && !covered.has(x.name) && !nonvisual[x.name]);
if (missing.length)
  throw new Error(`Undocumented exports: ${missing.map((x) => x.name).join(", ")}`);
const tokens = [];
const css = postcss.parse(await readFile("src/styles/tailwind.css", "utf8"));
css.walkDecls(/^--/, (d) => {
  tokens.push({
    name: d.prop,
    value: d.value,
    aliases: [...d.value.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]),
    scope: d.parent.selector ?? `@${d.parent.name}${d.parent.params ? ` ${d.parent.params}` : ""}`,
  });
});
const figmaLinks = JSON.parse(await readFile("design/figma-links.json", "utf8"));
const baseUrl = (process.env.STORYBOOK_BASE_URL ?? "http://localhost:6006").replace(/\/$/, "");
const viewportWidths = { narrow: 320, phone: 390, tablet: 768, desktop: 1440 };
const renderStories = (s) =>
  Object.values(index.entries)
    .filter((e) => e.type === "story" && e.title === s.title)
    .map((e) => ({
      id: e.id,
      name: e.name,
      exportName: e.exportName,
      renderUrl: `${baseUrl}/iframe.html?id=${e.id}&viewMode=story`,
      tones: s.tones,
      widths: [
        viewportWidths[
          (s.stories.find((story) => story.exportName === e.exportName)?.globals ?? s.meta?.globals)
            ?.viewport?.value
        ],
      ].filter(Boolean),
      args: {
        ...s.meta?.args,
        ...s.stories.find((story) => story.exportName === e.exportName)?.args,
      },
      figma: figmaLinks.stories[e.id] ?? null,
    }));
const entries = api.map((item) => ({
  identity: `${item.entry}#${item.name}`,
  ...item,
  stories: stories.filter((s) => s.exports.includes(item.name)).flatMap(renderStories),
  figma: figmaLinks.exports[`${item.entry}#${item.name}`] ?? null,
  ...(nonvisual[item.name] ? { nonvisual: nonvisual[item.name] } : {}),
}));
const withoutRenders = entries.filter(
  (entry) => entry.runtime && !entry.nonvisual && !entry.stories.length,
);
if (withoutRenders.length)
  throw new Error(
    `Export stories missing from built explorer: ${withoutRenders.map((entry) => entry.name).join(", ")}`,
  );
await mkdir("storybook-static/design", { recursive: true });
await writeFile(
  "storybook-static/design/manifest.json",
  JSON.stringify(
    {
      schemaVersion: 1,
      package: pkg.name,
      version: pkg.version,
      source: provenance,
      referenceWidths: [320, 390, 768, 1440],
      tokens: "./tokens.json",
      baseUrl,
      entries,
      pages: stories.filter((s) => !s.exports.length).flatMap(renderStories),
    },
    null,
    2,
  ),
);
await writeFile(
  "storybook-static/design/tokens.json",
  JSON.stringify({ schemaVersion: 1, source: "src/styles/tailwind.css", tokens }, null, 2),
);
console.log(`Documented ${api.length} exports, ${tokens.length} token declarations.`);
