import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { checkPullRequest, isVisualFile } from "../scripts/pr-body.mjs";

const template = readFileSync(join(process.cwd(), ".github/pull_request_template.md"), "utf8");
const row = "|             |                |";

function filled(screenshots = row) {
  return template
    .replace("## What changed\n", "## What changed\n\nAdds a compact size to Button.\n")
    .replace("## Why\n", "## Why\n\nDense toolbars need it.\n")
    .replaceAll("- [ ]", "- [x]")
    .replace(row, screenshots);
}

const twoImages =
  '| ![phone](https://github.com/user-attachments/assets/a) | <img src="https://github.com/user-attachments/assets/b" alt="desktop"> |';

describe("pull request body check", () => {
  it("passes a filled template for a change nobody sees", () => {
    expect(checkPullRequest({ body: filled(), files: ["docs/testing.md"], labels: [] })).toEqual(
      [],
    );
  });

  it("fails the empty template on every required section", () => {
    const problems = checkPullRequest({ body: template, files: [], labels: [] });
    expect(problems.filter((p) => p.includes("is empty"))).toHaveLength(2);
    expect(problems.filter((p) => p.startsWith("Unticked"))).toHaveLength(6);
  });

  it("fails a body without the template", () => {
    const problems = checkPullRequest({ body: "Small fix.", files: [], labels: [] });
    expect(problems).toHaveLength(3);
    expect(problems[0]).toContain('"## What changed"');
  });

  it("accepts an unticked box marked n/a", () => {
    const body = filled().replace(
      "- [x] Changeset added for public API, token, visual or accessibility changes",
      "- [ ] Changeset added for public API, token, visual or accessibility changes (n/a: docs only)",
    );
    expect(checkPullRequest({ body, files: [], labels: [] })).toEqual([]);
  });

  it("ignores boxes outside the verification section and inside comments", () => {
    const body = `${filled()}\n- [ ] a follow-up\n<!-- - [ ] hidden -->\n`;
    expect(checkPullRequest({ body, files: [], labels: [] })).toEqual([]);
  });

  it("requires screenshots when a visible file changes", () => {
    const problems = checkPullRequest({
      body: filled(),
      files: ["src/components/button.tsx", "src/styles/tokens.css"],
      labels: [],
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("2 visible file(s)");
    expect(problems[0]).toContain("has 0 image(s)");
  });

  it("does not count images outside the screenshots section", () => {
    const body = filled().replace("## Why\n", "## Why\n\n![before](x.png) ![after](y.png)\n");
    expect(checkPullRequest({ body, files: ["src/components/card.tsx"], labels: [] })).toHaveLength(
      1,
    );
  });

  it("passes a visible change with a phone and a desktop screenshot", () => {
    const body = filled(twoImages);
    expect(checkPullRequest({ body, files: ["src/components/card.tsx"], labels: [] })).toEqual([]);
  });

  it("skips the screenshots for the no-visual-change label", () => {
    expect(
      checkPullRequest({
        body: filled(),
        files: ["src/lib/format.ts"],
        labels: ["no-visual-change"],
      }),
    ).toEqual([]);
  });

  it("treats published source and assets as visible, tests, stories and tooling as not", () => {
    expect(isVisualFile("src/components/button.tsx")).toBe(true);
    expect(isVisualFile("src/styles/tokens.css")).toBe(true);
    expect(isVisualFile("assets/logo.svg")).toBe(true);
    expect(isVisualFile("src/components/button.test.tsx")).toBe(false);
    expect(isVisualFile("src/components/button.stories.tsx")).toBe(false);
    expect(isVisualFile("src/components/testing.ts")).toBe(false);
    expect(isVisualFile("scripts/build.mjs")).toBe(false);
    expect(isVisualFile("docs/design-system.md")).toBe(false);
  });
});
