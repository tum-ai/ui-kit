import { expect, test } from "vitest";

// Node build scripts share their TypeScript compiler-based inventory with this fitness check.
// @ts-expect-error The build helper is deliberately plain ESM.
import { nonvisual, publicApi, storyMetadata } from "../scripts/catalog.mjs";
test("every public runtime export has a story or documented nonvisual coverage", () => {
  const covered = new Set(storyMetadata().flatMap((s: { exports: string[] }) => s.exports));
  expect(
    publicApi().filter(
      (x: { name: string; runtime: boolean }) =>
        x.runtime && !covered.has(x.name) && !(x.name in nonvisual),
    ),
  ).toEqual([]);
});
