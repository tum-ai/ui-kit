/**
 * Finds the Tailwind class lists in a file and hands each one to a rule.
 *
 * A class list is everything one element's styling is built from: a
 * `className` attribute, or a top-level `cn(…)` / `cva(…)` / `clsx(…)` call
 * (including cva variants), or a `classNames={{ … }}` object. The strings
 * inside are gathered with their AST nodes, so rules can check one class
 * (`duration-300`) or the list as a whole (a transform gated by
 * `motion-reduce:transition-none` elsewhere in the same list). A `const`
 * identifier passed to a class helper is followed to its string.
 */

const CLASS_FUNCTIONS = new Set(["cn", "cva", "clsx", "cx"]);
const CLASS_ATTRIBUTES = new Set(["className", "classNames"]);

/**
 * Splits a class into its variants and utility, keeping brackets intact:
 * `md:hover:bg-[url(a:b)]` gives variants `["md", "hover"]` and utility
 * `bg-[url(a:b)]`. A leading or trailing `!` and the negative `-` stay on
 * the utility.
 *
 * @param {string} token
 */
export function parseClass(token) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of token) {
    if (char === "[" || char === "(") depth += 1;
    if (char === "]" || char === ")") depth -= 1;
    if (char === ":" && depth === 0) {
      parts.push(current);
      current = "";
    } else current += char;
  }
  return { variants: parts, utility: current.replace(/^!|!$/g, "") };
}

/**
 * @typedef {{ token: string, variants: string[], utility: string, node: import("estree").Node }} ClassEntry
 */

function isClassCall(node) {
  return (
    node?.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    CLASS_FUNCTIONS.has(node.callee.name)
  );
}

function isClassAttribute(node) {
  return (
    node?.type === "JSXAttribute" &&
    node.name.type === "JSXIdentifier" &&
    CLASS_ATTRIBUTES.has(node.name.name)
  );
}

/** True when `node` sits inside another class list (it is collected there). */
function insideClassList(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (isClassCall(parent) || isClassAttribute(parent)) return true;
  }
  return false;
}

/**
 * Collects the string pieces under a class-list root.
 *
 * @param {import("eslint").Rule.RuleContext} context
 * @param {import("estree").Node} root
 * @returns {ClassEntry[]}
 */
function collect(context, root) {
  /** @type {ClassEntry[]} */
  const entries = [];
  const seen = new Set();
  const add = (text, node) => {
    for (const token of text.split(/\s+/)) {
      if (!token) continue;
      entries.push({ token, ...parseClass(token), node });
    }
  };
  const visit = (node) => {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    switch (node.type) {
      case "Literal":
        if (typeof node.value === "string") add(node.value, node);
        return;
      case "TemplateLiteral":
        for (const quasi of node.quasis) add(quasi.value.cooked ?? "", quasi);
        for (const expression of node.expressions) visit(expression);
        return;
      case "Property":
        // Object keys name variants or slots (`primary:`, `frame:`), not classes.
        visit(node.value);
        return;
      case "Identifier": {
        const variable = context.sourceCode
          .getScope(node)
          .references.find((reference) => reference.identifier === node)?.resolved;
        const definition = variable?.defs[0];
        if (definition?.type === "Variable" && definition.parent.kind === "const") {
          visit(definition.node.init);
        }
        return;
      }
      case "MemberExpression":
        // `styles.base` and friends: skip, the object is linted where it is defined.
        return;
      case "JSXAttribute":
        visit(node.value);
        return;
      case "JSXExpressionContainer":
        visit(node.expression);
        return;
      case "CallExpression":
        if (isClassCall(node)) for (const argument of node.arguments) visit(argument);
        return;
      default:
        for (const [key, value] of Object.entries(node)) {
          if (key === "parent" || key === "loc" || key === "range") continue;
          if (Array.isArray(value)) value.forEach(visit);
          else if (value && typeof value.type === "string") visit(value);
        }
    }
  };
  visit(root);
  return entries;
}

/**
 * Calls `check(entries, root)` once per class list in the file.
 *
 * @param {import("eslint").Rule.RuleContext} context
 * @param {(entries: ClassEntry[], root: import("estree").Node) => void} check
 * @returns {import("eslint").Rule.RuleListener}
 */
export function forEachClassList(context, check) {
  const run = (root) => {
    if (insideClassList(root)) return;
    check(collect(context, root), root);
  };
  return {
    CallExpression(node) {
      if (isClassCall(node)) run(node);
    },
    JSXAttribute(node) {
      if (isClassAttribute(node)) run(node);
    },
  };
}
