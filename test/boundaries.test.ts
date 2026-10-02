import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import ts from "typescript";
import { expect, test } from "vitest";
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
}
test("published modules have no application, test or story imports", () => {
  const failures: string[] = [];
  for (const file of walk("src").filter((p) => /\.tsx?$/.test(p) && !/(test|stories)\./.test(p))) {
    const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    sf.forEachChild((node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const spec = node.moduleSpecifier.text;
        if (
          spec.startsWith("@/") ||
          spec.startsWith("@test") ||
          /features|sanity|stories|\.test/.test(spec)
        )
          failures.push(`${file}: ${spec}`);
      }
    });
  }
  expect(failures).toEqual([]);
});
