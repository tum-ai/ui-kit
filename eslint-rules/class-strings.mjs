/**
 * Finds the Tailwind class lists in a file and hands each one to a rule.
 *
 * A class list is everything one element's styling is built from: a
 * `className` attribute, or a top-level `cn(…)` / `cva(…)` / `clsx(…)` call
 * (including cva variants), or a `classNames={{ … }}` object. The strings
 * inside are gathered with their AST nodes, so rules can check one class
 * (`duration-300`) or the list as a whole (a transform gated by
 * `motion-reduce:transition-none` elsewhere in the same list).
 *
 * Each class also carries a `group`: `"base"` for classes that always apply
 * (a `cn` argument, a cva base), or the object property it sits under (a cva
 * variant value, a `classNames` slot). A rule that looks for a companion
 * class should only accept one from the same group or from `"base"`, because
 * two variants or two slots never style the same element together.
 *
 * `const` identifiers and `const` object maps (`tones.ink`, `tones[tone]`)
 * passed to a class helper are followed to their strings.
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
 * @typedef {{ token: string, variants: string[], utility: string, node: import("estree").Node, group: string }} ClassEntry
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

/**
 * True when `node` is collected as part of an enclosing class list. A call
 * to anything else in between (`cn(pick(cn(…)))`) ends the enclosing list,
 * so the inner one is checked as its own root.
 */
function insideClassList(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (isClassCall(parent) || isClassAttribute(parent)) return true;
    if (parent.type === "CallExpression") return false;
  }
  return false;
}

/** The `const` initializer an identifier refers to, if any. */
function constInit(context, identifier) {
  const variable = context.sourceCode
    .getScope(identifier)
    .references.find((reference) => reference.identifier === identifier)?.resolved;
  const definition = variable?.defs[0];
  return definition?.type === "Variable" && definition.parent.kind === "const"
    ? definition.node.init
    : null;
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
  const add = (text, node, group) => {
    for (const token of text.split(/\s+/)) {
      if (!token) continue;
      entries.push({ token, ...parseClass(token), node, group });
    }
  };
  const visit = (node, group) => {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    switch (node.type) {
      case "Literal":
        if (typeof node.value === "string") add(node.value, node, group);
        return;
      case "TemplateLiteral":
        for (const quasi of node.quasis) add(quasi.value.cooked ?? "", quasi, group);
        for (const expression of node.expressions) visit(expression, group);
        return;
      case "Property":
        // Keys name variants or slots (`primary:`, `frame:`), not classes; each
        // value styles its own element or state.
        visit(node.value, `property:${String(node.range)}`);
        return;
      case "Identifier": {
        const init = constInit(context, node);
        // A `const x = cn(…)` is already checked as its own class list.
        if (init && !isClassCall(init)) visit(init, group);
        return;
      }
      case "MemberExpression": {
        if (node.object.type !== "Identifier") return;
        const init = constInit(context, node.object);
        if (init?.type !== "ObjectExpression") return;
        const key =
          !node.computed && node.property.type === "Identifier" ? node.property.name : null;
        for (const property of init.properties) {
          if (property.type !== "Property") continue;
          const name =
            property.key.type === "Identifier" ? property.key.name : String(property.key.value);
          // The picked value styles this element, so it joins the current group.
          if (key === null || name === key) visit(property.value, group);
        }
        return;
      }
      case "JSXAttribute":
        visit(node.value, group);
        return;
      case "JSXExpressionContainer":
        visit(node.expression, group);
        return;
      case "CallExpression":
        if (isClassCall(node)) for (const argument of node.arguments) visit(argument, group);
        return;
      default:
        for (const [key, value] of Object.entries(node)) {
          if (key === "parent" || key === "loc" || key === "range") continue;
          if (Array.isArray(value)) for (const item of value) visit(item, group);
          else if (value && typeof value.type === "string") visit(value, group);
        }
    }
  };
  visit(root, "base");
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

/**
 * `context.report` that reports each problem once, even when a shared string
 * (a `const` or an object map) is reached from several class lists.
 *
 * @param {import("eslint").Rule.RuleContext} context
 * @returns {(descriptor: import("eslint").Rule.ReportDescriptor & { node: import("estree").Node }) => void}
 */
export function reportOnce(context) {
  const reported = new Set();
  return (descriptor) => {
    const key = `${String(descriptor.node.range)}:${String(descriptor.messageId)}:${JSON.stringify(descriptor.data ?? {})}`;
    if (reported.has(key)) return;
    reported.add(key);
    context.report(descriptor);
  };
}
