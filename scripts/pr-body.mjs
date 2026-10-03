// Pull request body check, run by .github/workflows/pr-body.yml.
//
// The template (.github/pull_request_template.md) is the contract: the
// required sections are filled in, every verification box is ticked or
// marked n/a with a reason, and a change to what the kit renders carries
// screenshots of the affected stories at phone and desktop width.
// `checkPullRequest` is pure so the rules are unit tested
// (test/pr-body.test.ts); the CLI below only wires it to CI.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const REQUIRED_SECTIONS = ["What changed", "Why", "Verification"];
export const MIN_SCREENSHOTS = 2;
export const NO_VISUAL_CHANGE_LABEL = "no-visual-change";

/** A file that can change what the kit renders: published source under src/ and the shipped assets/. */
export function isVisualFile(path) {
  return (
    /^(src|assets)\//.test(path) &&
    !/\.(test|stories)\.[cm]?[jt]sx?$/.test(path) &&
    !/(^|\/)testing\.ts$/.test(path)
  );
}

/** Splits a Markdown body into its `## ` sections, keyed by heading, comments removed. */
export function sections(body) {
  const out = new Map();
  let current = null;
  for (const line of body.replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/)) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      current = heading[1];
      out.set(current, "");
    } else if (current !== null) {
      out.set(current, `${out.get(current)}${line}\n`);
    }
  }
  return out;
}

function countImages(markdown) {
  return (markdown.match(/!\[[^\]]*\]\([^)]+\)|<img\s[^>]*src=/gi) ?? []).length;
}

/**
 * Returns the problems with a pull request's body, empty when it passes.
 * @param {{ body: string, files: string[], labels: string[] }} pr
 */
export function checkPullRequest({ body, files, labels }) {
  const problems = [];
  const parts = sections(body ?? "");

  for (const name of REQUIRED_SECTIONS) {
    if (!parts.has(name)) problems.push(`Missing the "## ${name}" section from the template.`);
    else if (parts.get(name).trim() === "") problems.push(`The "## ${name}" section is empty.`);
  }

  const unticked = (parts.get("Verification") ?? "")
    .split("\n")
    .filter((line) => /^\s*[-*]\s+\[ \]/.test(line) && !/\bn\/a\b/i.test(line));
  for (const line of unticked) {
    const item = line.replace(/^\s*[-*]\s+\[ \]\s*/, "");
    problems.push(`Unticked verification item: "${item}". Tick it or add "n/a" with a reason.`);
  }

  const visual = files.filter(isVisualFile);
  if (visual.length > 0 && !labels.includes(NO_VISUAL_CHANGE_LABEL)) {
    const images = countImages(parts.get("Screenshots") ?? "");
    if (images < MIN_SCREENSHOTS) {
      problems.push(
        `This pull request changes ${visual.length} visible file(s) (${visual.slice(0, 3).join(", ")}${visual.length > 3 ? ", ..." : ""}) ` +
          `but "## Screenshots" has ${images} image(s); add at least ${MIN_SCREENSHOTS} (phone and desktop), ` +
          `or label it "${NO_VISUAL_CHANGE_LABEL}" if nothing visible changed.`,
      );
    }
  }

  return problems;
}

// CLI: PR_BODY and PR_LABELS (a JSON array of names) from the environment,
// changed file paths on stdin, one per line.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = readFileSync(0, "utf8").split("\n").filter(Boolean);
  const labels = JSON.parse(process.env.PR_LABELS || "[]");
  const problems = checkPullRequest({ body: process.env.PR_BODY ?? "", files, labels });
  for (const problem of problems) console.log(`::error title=Pull request body::${problem}`);
  if (problems.length > 0) {
    console.log("See .github/pull_request_template.md for the expected format.");
    process.exit(1);
  }
  console.log(`Pull request body passed (${files.length} changed files).`);
}
