import ts from "typescript";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
export function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
}
function unwrap(node) {
  while (
    node &&
    (ts.isSatisfiesExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isParenthesizedExpression(node))
  )
    node = node.expression;
  return node;
}
function literal(node, values) {
  node = unwrap(node);
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node))
    return ts.isNumericLiteral(node) ? Number(node.text) : node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isIdentifier(node)) return values[node.text] ?? null;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((n) => literal(n, values));
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties
        .filter(ts.isPropertyAssignment)
        .map((p) => [p.name.getText().replace(/["']/g, ""), literal(p.initializer, values)]),
    );
  return null;
}
export function storyMetadata() {
  return files("src")
    .concat(files("stories"))
    .filter((p) => /\.stories\.tsx?$/.test(p))
    .map((file) => {
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      const values = {};
      let meta = null;
      const stories = [];
      for (const statement of source.statements) {
        if (ts.isVariableStatement(statement)) {
          for (const d of statement.declarationList.declarations) {
            values[d.name.getText(source)] = literal(d.initializer, values);
            if (statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
              stories.push({
                exportName: d.name.getText(source),
                ...literal(d.initializer, values),
              });
          }
        }
        if (ts.isExportAssignment(statement)) meta = literal(statement.expression, values);
      }
      return {
        file,
        title: meta?.title,
        id: meta?.id,
        exports: meta?.parameters?.kit?.exports ?? [],
        tones: meta?.parameters?.kit?.tones ?? [],
        stories,
        meta,
      };
    });
}
/**
 * Text of one TSDoc comment part. A `{@link X}` part has no text of its own,
 * so it names its target (`X`); `{@link X | label}` keeps its label, and a
 * `{@link https://…}` URL stays whole.
 */
function linkText(part, source) {
  if (!part.name) return part.text ?? "";
  const name = part.name.getText(source);
  const text = part.text ?? "";
  if (text.startsWith("://")) return `${name}${text}`;
  const label = text.replace(/^\s*\|?\s*/, "").trim();
  return label || `\`${name}\``;
}
export function publicApi() {
  return ["src/index.ts", "src/shell/index.ts"].flatMap((entry) => {
    const file = ts.createSourceFile(
      entry,
      readFileSync(entry, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    return file.statements.filter(ts.isExportDeclaration).flatMap((decl) => {
      if (!decl.exportClause || !ts.isNamedExports(decl.exportClause) || !decl.moduleSpecifier)
        throw new Error("Use explicit named barrel exports");
      const spec = decl.moduleSpecifier.text;
      const base = path.join(path.dirname(entry), spec);
      const sourcePath = [base + ".ts", base + ".tsx"].find((p) => {
        try {
          readFileSync(p);
          return true;
        } catch {
          return false;
        }
      });
      if (!sourcePath) throw new Error(`Missing export module: ${base}`);
      const source = ts.createSourceFile(
        sourcePath,
        readFileSync(sourcePath, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      return decl.exportClause.elements.map((item) => {
        const original = item.propertyName?.text ?? item.name.text;
        const definition = source.statements.find(
          (n) =>
            n.name?.text === original ||
            (ts.isVariableStatement(n) &&
              n.declarationList.declarations.some((d) => d.name.getText(source) === original)),
        );
        const description =
          definition?.jsDoc
            ?.map((doc) =>
              typeof doc.comment === "string"
                ? doc.comment
                : doc.comment?.map((p) => linkText(p, source)).join(""),
            )
            .join(" ") ?? "";
        return {
          name: item.name.text,
          entry: entry.includes("shell") ? "@tum.ai/ui-kit/shell" : "@tum.ai/ui-kit",
          runtime: !decl.isTypeOnly && !item.isTypeOnly,
          source: sourcePath,
          description,
        };
      });
    });
  });
}
export const nonvisual = {
  MotionProvider: "Provider installed around motion stories; see Motion guidelines.",
  parseFigure: "Pure parser; covered by figure tests.",
  formatFigure: "Pure formatter; covered by figure tests.",
  buttonStyles: "cva style composition function; demonstrated by Button stories.",
};
