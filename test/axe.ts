import axeCore, { type AxeResults, type Result, type RunOptions } from "axe-core";

/**
 * Rules that cannot work in jsdom. There is no layout engine, so colour
 * contrast is always inconclusive; components are rendered outside page
 * landmarks, so `region` would flag every fragment. Playwright + axe covers
 * both against the real page.
 */
const jsdomDisabledRules: RunOptions["rules"] = {
  "color-contrast": { enabled: false },
  region: { enabled: false },
};

/**
 * Runs axe-core against a rendered element (default: the whole document).
 *
 * ```tsx
 * const { container } = render(<Dialog open />);
 * expect(await axe(container)).toHaveNoViolations();
 * ```
 */
export function axe(
  target: Element = document.body,
  options: RunOptions = {},
): Promise<AxeResults> {
  return axeCore.run(target, {
    ...options,
    rules: { ...jsdomDisabledRules, ...options.rules },
  });
}

function formatViolation(violation: Result): string {
  const nodes = violation.nodes
    .map((node) => `    ${node.html}\n      ${node.failureSummary ?? ""}`)
    .join("\n");
  return `  ${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}\n    ${violation.helpUrl}\n${nodes}`;
}

/** `expect(results).toHaveNoViolations()`, registered in `vitest.setup.ts`. */
export function toHaveNoViolations(results: AxeResults) {
  const { violations } = results;
  return {
    pass: violations.length === 0,
    message: () =>
      violations.length === 0
        ? "Expected accessibility violations, but axe found none."
        : `Expected no accessibility violations, but axe found ${violations.length}:\n\n${violations.map(formatViolation).join("\n\n")}`,
  };
}

declare module "vitest" {
  // Type parameters must match Vitest's own `Matchers` declaration exactly.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- declaration merging needs an interface
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Must match Vitest declaration merging.
    T = unknown,
  > {
    /** Asserts that an `axe()` run found no accessibility violations. */
    toHaveNoViolations(): R;
  }
}
