import { cp, mkdir, readFile, readdir, writeFile, rm } from "node:fs/promises";
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
const source = process.env.SOURCE_WEBSITE_DIR;
if (!source) throw new Error("Set SOURCE_WEBSITE_DIR to the frozen website worktree");
const provenance = JSON.parse(await readFile("extraction.json", "utf8"));
const revision = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: source,
  encoding: "utf8",
}).trim();
if (revision !== provenance.revision)
  throw new Error(`Expected ${provenance.revision}, received ${revision}`);
const destination = "artifacts/parity";
await mkdir(`${destination}/reference/components`, { recursive: true });
await mkdir(`${destination}/reference/lib`, { recursive: true });
for (const name of await readdir(path.join(source, "src/components/ds"))) {
  if (!/\.(?:tsx|ts)$/.test(name) || name.includes(".test.") || name === "testing.ts") continue;
  const content = (await readFile(path.join(source, "src/components/ds", name), "utf8")).replaceAll(
    "@/lib/cn",
    "../lib/cn",
  );
  await writeFile(`${destination}/reference/components/${name}`, content);
}
await cp(path.join(source, "src/lib/cn.ts"), `${destination}/reference/lib/cn.ts`);
await mkdir(`${destination}/reference/styles`, { recursive: true });
for (const name of ["index.css", "partner-rotation.css"])
  await cp(path.join(source, "src/styles", name), `${destination}/reference/styles/${name}`);
await mkdir(".parity-storybook", { recursive: true });
await writeFile(
  ".parity-storybook/main.ts",
  `import tailwind from '@tailwindcss/vite';
export default {core:{disableTelemetry:true},stories:['../artifacts/parity/parity.stories.tsx'],framework:'@storybook/nextjs-vite',staticDirs:[{from:'../assets',to:'/assets'}],viteFinal:async config=>({...config,plugins:[...(config.plugins??[]),tailwind()]})};
`,
);
for (const name of ["preview.tsx", "preview.css"])
  await cp(`.storybook/${name}`, `.parity-storybook/${name}`);
const specimen = `function Specimen({ui}:{ui:typeof kit}){return <><ui.PageHero title="Ideas become possibilities" eyebrow="Extraction comparison" lead="The same component APIs, fixtures and viewport widths." actions={<ui.ButtonLink href="#content">Explore the work</ui.ButtonLink>} media={<ui.Photo src="/assets/placeholder.svg" alt="Abstract geometric illustration" eager unoptimized/>}/><ui.Section id="content" tone="paper"><ui.Container><ui.SectionHeader title="Built together" lead="A representative slice of the source design system."/><ui.Actions><ui.Button>Primary action</ui.Button><ui.Button variant="outline">Secondary action</ui.Button><ui.TextLink href="#faq">Questions</ui.TextLink></ui.Actions><div className="mt-12"><ui.StatGrid items={[{value:"24",label:"Projects"},{value:"12",label:"Teams"},{value:"8",label:"Disciplines"}]} columns={3}/></div><div className="mt-12"><ui.QuoteCard quote="The best ideas grow when we build together." name="Alex Example" byline="Research collaborator"/></div></ui.Container></ui.Section><ui.FaqSection items={[{question:"How do I get involved?",answer:"Bring a clear question and a willingness to learn."}]}/></>}`;
await writeFile(
  `${destination}/parity.stories.tsx`,
  `import * as kit from '../../src';
import * as source from './reference/components';
import referenceStyles from './reference/styles/index.css?inline';
${specimen}
export default {title:'Validation/Extraction',parameters:{layout:'fullscreen',kit:{shell:true}}};
export const Source={render:()=> <><style>{referenceStyles}</style><Specimen ui={source}/></>};
export const Kit={render:()=> <Specimen ui={kit}/>};
`,
);
let server, browser;
try {
  execFileSync(
    "bunx",
    [
      "storybook",
      "build",
      "--config-dir",
      ".parity-storybook",
      "--output-dir",
      `${destination}/explorer`,
    ],
    { stdio: "inherit", env: { ...process.env, STORYBOOK_DISABLE_TELEMETRY: "1" } },
  );
  server = spawn(process.execPath, ["scripts/serve.mjs", `${destination}/explorer`, "6014"], {
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    server.stdout.once("data", resolve);
    server.once("error", reject);
    server.once("exit", (code) => reject(new Error(`Parity server exited ${code}`)));
  });
  browser = await chromium.launch();
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const results = [];
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const renders = {};
    for (const version of ["source", "kit"]) {
      await page.goto(
        `http://127.0.0.1:6014/iframe.html?id=validation-extraction--${version}&viewMode=story`,
      );
      await expect(page.locator("body")).toHaveAttribute("data-kit-ready", "true");
      renders[version] = await page
        .locator("#storybook-root")
        .screenshot({ path: `${destination}/${version}-${width}.png`, animations: "disabled" });
    }
    results.push({
      width,
      identical: renders.source.equals(renders.kit),
      source: `source-${width}.png`,
      kit: `kit-${width}.png`,
    });
  }
  await writeFile(
    `${destination}/comparison.json`,
    JSON.stringify(
      {
        revision,
        components: [
          "PageHero",
          "Photo",
          "Section",
          "Container",
          "SectionHeader",
          "Actions",
          "Button",
          "ButtonLink",
          "TextLink",
          "StatGrid",
          "QuoteCard",
          "FaqSection",
        ],
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results));
} finally {
  await browser?.close();
  server?.kill();
  await rm(".parity-storybook", { recursive: true, force: true });
}
