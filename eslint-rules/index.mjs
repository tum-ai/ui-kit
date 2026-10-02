/**
 * `tumai/*`: the kit's own lint rules. They turn the token and motion rules
 * from docs/design-system.md into errors, so a component can't drift from
 * the house style without a reviewer noticing. See docs/standards.md.
 */

import { forEachClassList } from "./class-strings.mjs";

/** Named durations from src/styles/tailwind.css, keyed by their milliseconds. */
const DURATION_TOKENS = {
  150: "press",
  300: "hover",
  500: "surface",
  700: "media",
  1000: "entrance",
};
const DURATION_NAMES = new Set(Object.values(DURATION_TOKENS));
const EASE_TOKENS = new Set(["brand", "snappy", "in-out-soft", "initial"]);

/** Variants that apply on interaction or state rather than at rest. */
const STATE_VARIANT =
  /^(hover|active|focus|focus-visible|focus-within|card-hover|open|checked|disabled|enabled|group-.+|peer-.+|data-.+|aria-.+|has-.+|in-.+)$/;
const TRANSFORM_UTILITY = /^-?(translate|scale|rotate|skew)(-|$)/;

/** Tailwind's stock palettes; the kit replaces `violet` and adds `ink`. */
const STOCK_PALETTE =
  /^-?(bg|text|border(-[trblxyse])?|ring|ring-offset|inset-ring|outline|fill|stroke|from|via|to|decoration|shadow|inset-shadow|accent|caret|divide|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|purple|fuchsia|pink|rose)-\d{2,3}(\/.*)?$/;
const RAW_COLOR = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/i;
const COLOR_ATTRIBUTES = new Set([
  "fill",
  "stroke",
  "stopColor",
  "color",
  "floodColor",
  "lightingColor",
]);

const docs = (description) => ({
  description,
  url: "https://github.com/tum-ai/ui-kit/blob/main/docs/standards.md",
});

/** @type {import("eslint").Rule.RuleModule} */
const motionTokens = {
  meta: {
    type: "problem",
    fixable: "code",
    docs: docs("Motion uses the duration scale, house easings and reduced-motion gates."),
    messages: {
      duration:
        "Use a duration token instead of `{{token}}`: duration-press (150ms), -hover (300ms), -surface (500ms), -media (700ms) or -entrance (1000ms).",
      ease: "Use `ease-brand`, `ease-snappy` or `ease-in-out-soft` instead of `{{token}}`.",
      transitionAll:
        "Name the properties instead of `transition-all` (`transition-colors`, `transition-[opacity,translate]`, …).",
      animate: "Prefix `{{token}}` with `motion-safe:` so it never runs under reduced motion.",
      transform:
        "`{{token}}` moves on interaction: prefix it with `motion-safe:`, or add `motion-reduce:transition-none` to the same class list.",
    },
    schema: [],
  },
  create(context) {
    return forEachClassList(context, (entries) => {
      const reducedGate = entries.some(
        (entry) => entry.variants.includes("motion-reduce") && entry.utility === "transition-none",
      );
      for (const entry of entries) {
        const { token, utility, variants, node } = entry;
        const report = (messageId, fix) =>
          context.report({ node, messageId, data: { token }, ...(fix ? { fix } : {}) });

        const duration = /^duration-(.+)$/.exec(utility);
        if (duration && !DURATION_NAMES.has(duration[1])) {
          const name = DURATION_TOKENS[duration[1]];
          report(
            "duration",
            name && node.type === "Literal"
              ? (fixer) => {
                  const raw = context.sourceCode.getText(node);
                  const fixed = raw.replace(
                    new RegExp(
                      `(^|[\\s"'\`:])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s"'\`]|$)`,
                    ),
                    (_, lead) => `${lead}${token.replace(/duration-\d+$/, `duration-${name}`)}`,
                  );
                  return fixer.replaceText(node, fixed);
                }
              : undefined,
          );
        }
        const ease = /^ease-(.+)$/.exec(utility);
        if (ease && !EASE_TOKENS.has(ease[1])) report("ease");
        if (utility === "transition-all") report("transitionAll");
        if (
          utility.startsWith("animate-") &&
          utility !== "animate-none" &&
          !variants.includes("motion-safe")
        ) {
          report("animate");
        }
        if (
          TRANSFORM_UTILITY.test(utility) &&
          variants.some((variant) => STATE_VARIANT.test(variant.replace(/\/.*$/, ""))) &&
          !variants.includes("motion-safe") &&
          !variants.includes("motion-reduce") &&
          !reducedGate
        ) {
          report("transform");
        }
      }
    });
  },
};

/** @type {import("eslint").Rule.RuleModule} */
const noRawColor = {
  meta: {
    type: "problem",
    docs: docs("Colors come from semantic tokens or the kit's violet and ink scales."),
    messages: {
      raw: "`{{token}}` is a raw color. Use a semantic token (`bg-canvas`, `text-fg`, `text-highlight`, …) or the violet or ink scale.",
      stock:
        "`{{token}}` is a stock Tailwind palette. Use a semantic token or the kit's violet or ink scale.",
      attribute: "`{{value}}` is a raw color. Use `currentColor` or a CSS variable from the theme.",
    },
    schema: [],
  },
  create(context) {
    const classLists = forEachClassList(context, (entries) => {
      for (const { token, utility, node } of entries) {
        if (/\[.*\]|\(.*\)/.test(utility) && RAW_COLOR.test(utility)) {
          context.report({ node, messageId: "raw", data: { token } });
        } else if (STOCK_PALETTE.test(utility)) {
          context.report({ node, messageId: "stock", data: { token } });
        }
      }
    });
    return {
      ...classLists,
      JSXAttribute(node) {
        classLists.JSXAttribute?.(node);
        if (node.name.type !== "JSXIdentifier" || !COLOR_ATTRIBUTES.has(node.name.name)) return;
        const value = node.value;
        if (
          value?.type === "Literal" &&
          typeof value.value === "string" &&
          RAW_COLOR.test(value.value)
        ) {
          context.report({ node: value, messageId: "attribute", data: { value: value.value } });
        }
      },
    };
  },
};

/** @type {import("eslint").Rule.RuleModule} */
const noFilterMotion = {
  meta: {
    type: "problem",
    docs: docs("No animated filters: Safari clips filtered boxes and large blurs stutter."),
    messages: {
      filter:
        "`{{token}}` animates or transitions a filter. Animate transform and opacity instead (docs/browser-quirks.md).",
    },
    schema: [],
  },
  create(context) {
    const FILTER =
      /^-?(blur|backdrop-blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia|drop-shadow|backdrop-[a-z-]+)(-|$)/;
    return forEachClassList(context, (entries) => {
      const filterTransition = entries.some(
        ({ utility }) =>
          utility === "transition" ||
          /^transition-\[[^\]]*(filter|backdrop)[^\]]*\]$/.test(utility),
      );
      if (!filterTransition) return;
      for (const { token, utility, variants, node } of entries) {
        if (FILTER.test(utility) && variants.some((variant) => STATE_VARIANT.test(variant))) {
          context.report({ node, messageId: "filter", data: { token } });
        }
      }
    });
  },
};

/**
 * Hooks that only exist on the client. React's server build also exports
 * `useId`, `useCallback`, `useMemo` and `use`, so those are left out.
 */
const CLIENT_HOOK =
  /^use(Pathname|Router|SearchParams|Params|State|Effect|LayoutEffect|InsertionEffect|Reducer|Ref|Transition|Optimistic|ActionState|SyncExternalStore|EffectEvent|ImperativeHandle|DeferredValue|Context)$|^use[A-Z]\w*Ref$/;

/** @type {import("eslint").Rule.RuleModule} */
const clientBoundary = {
  meta: {
    type: "problem",
    docs: docs('`"use client"` exactly where a module uses client-only React.'),
    messages: {
      missing: '`{{name}}` runs only on the client. Add "use client" at the top of this module.',
      unneeded:
        'This module uses no state, effects or event handlers. Remove "use client" so it stays a server component.',
    },
    schema: [],
  },
  create(context) {
    let directive = null;
    let firstClientUse = null;
    const note = (node, name) => {
      firstClientUse ??= { node, name };
    };
    return {
      Program(program) {
        const first = program.body[0];
        if (first?.type === "ExpressionStatement" && first.directive === "use client") {
          directive = first;
        }
      },
      CallExpression(node) {
        const callee = node.callee;
        const name =
          callee.type === "Identifier"
            ? callee.name
            : callee.type === "MemberExpression" && callee.property.type === "Identifier"
              ? callee.property.name
              : null;
        if (name && CLIENT_HOOK.test(name)) note(node, name);
      },
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || node.value?.type !== "JSXExpressionContainer") {
          return;
        }
        const name = node.name.name;
        const element = node.parent.name;
        const isDom = element.type === "JSXIdentifier" && /^[a-z]/.test(element.name);
        const expression = node.value.expression;
        // DOM event handlers run in the browser, and a function created here
        // can't be passed from a server component to a client one.
        if (
          (isDom && /^on[A-Z]/.test(name)) ||
          expression.type === "ArrowFunctionExpression" ||
          expression.type === "FunctionExpression"
        ) {
          note(node, name);
        }
      },
      "Program:exit"() {
        if (firstClientUse && !directive) {
          context.report({
            node: firstClientUse.node,
            messageId: "missing",
            data: { name: firstClientUse.name },
          });
        }
        if (directive && !firstClientUse) {
          context.report({ node: directive, messageId: "unneeded" });
        }
      },
    };
  },
};

export default {
  meta: { name: "eslint-plugin-tumai" },
  rules: {
    "motion-tokens": motionTokens,
    "no-raw-color": noRawColor,
    "no-filter-motion": noFilterMotion,
    "client-boundary": clientBoundary,
  },
};
