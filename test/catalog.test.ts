import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

// Node build scripts share their TypeScript compiler-based inventory with this fitness check.
// @ts-expect-error The build helper is deliberately plain ESM.
import { nonvisual, publicApi, storyMetadata } from "../scripts/catalog.mjs";

type Export = { name: string; runtime: boolean; source: string };
type StoryFile = { exports: string[]; meta: object | null; stories: object[] };

const api = publicApi() as Export[];
const stories = storyMetadata() as StoryFile[];

test("every public runtime export has a story or documented nonvisual coverage", () => {
  const covered = new Set(stories.flatMap((s) => s.exports));
  expect(api.filter((x) => x.runtime && !covered.has(x.name) && !(x.name in nonvisual))).toEqual(
    [],
  );
});

/**
 * A module is interactive when it builds on Base UI, renders a link or
 * button, or handles clicks. Its exports must be exercised by at least one
 * story `play` function, which runs in a real browser with axe on the
 * resulting state (keyboard focus, open overlays, pressed chips).
 */
const INTERACTIVE =
  /from "@base-ui\/react|from "\.\.?\/(components\/)?anchor"|<a\s|<button|onClick=/;

test("every interactive export is exercised by a story play function", () => {
  const unplayed = api
    .filter((x) => x.runtime && !(x.name in nonvisual))
    .filter((x) => INTERACTIVE.test(readFileSync(x.source, "utf8")))
    .filter(
      (x) =>
        !stories.some(
          (file) =>
            file.exports.includes(x.name) &&
            ((file.meta !== null && "play" in file.meta) ||
              file.stories.some((story) => "play" in story)),
        ),
    )
    .map((x) => x.name);
  expect(unplayed).toEqual([]);
});
