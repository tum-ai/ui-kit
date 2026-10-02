import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";

import plugin from "./index.mjs";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});
const { rules } = plugin;

tester.run("motion-tokens", rules["motion-tokens"], {
  valid: [
    `<a className="transition-colors duration-hover ease-brand hover:text-fg" />`,
    `cva("transition-[opacity,translate] duration-surface", { variants: { open: { true: "duration-entrance" } } })`,
    `<i className="motion-safe:animate-rise motion-reduce:animate-none animate-none" />`,
    `<b className="motion-safe:hover:-translate-y-1" />`,
    `<b className={cn("group-hover/row:translate-x-2 transition-transform", "motion-reduce:transition-none")} />`,
    `const base = "transition-transform motion-reduce:transition-none"; cn(base, "group-hover/x:translate-x-1")`,
    // A transform at rest is layout, not motion.
    `<b className="-translate-x-1/2 scale-95" />`,
    `<b className="ease-initial" />`,
  ],
  invalid: [
    {
      code: `<a className="transition-colors duration-300 hover:text-fg" />`,
      output: `<a className="transition-colors duration-hover hover:text-fg" />`,
      errors: [{ messageId: "duration" }],
    },
    {
      code: `cn("data-[ending-style]:duration-500")`,
      output: `cn("data-[ending-style]:duration-surface")`,
      errors: [{ messageId: "duration" }],
    },
    { code: `<a className="duration-[250ms]" />`, errors: [{ messageId: "duration" }] },
    { code: `<a className="duration-200" />`, errors: [{ messageId: "duration" }] },
    { code: `<a className="ease-out" />`, errors: [{ messageId: "ease" }] },
    { code: `<a className="ease-[cubic-bezier(0,0,1,1)]" />`, errors: [{ messageId: "ease" }] },
    { code: `<a className="transition-all" />`, errors: [{ messageId: "transitionAll" }] },
    { code: `<a className="animate-pulse" />`, errors: [{ messageId: "animate" }] },
    { code: `<a className="md:animate-rise" />`, errors: [{ messageId: "animate" }] },
    {
      code: `<a className="hover:-translate-y-1 transition" />`,
      errors: [{ messageId: "transform" }],
    },
    {
      code: "<a className={`group-hover/menu:scale-105 ${x}`} />",
      errors: [{ messageId: "transform" }],
    },
  ],
});

tester.run("no-raw-color", rules["no-raw-color"], {
  valid: [
    `<a className="bg-canvas text-fg border-hairline bg-violet-600 text-ink-600 bg-white/85 bg-fg/[0.07]" />`,
    `<a className="shadow-[0_0_0_1px_var(--tone-hairline)]" />`,
    `<path fill="currentColor" />`,
    `<stop stopColor="var(--color-violet-500)" />`,
  ],
  invalid: [
    { code: `<a className="bg-gray-100" />`, errors: [{ messageId: "stock" }] },
    { code: `cn("hover:text-purple-600/50")`, errors: [{ messageId: "stock" }] },
    { code: `<a className="border-b-slate-200" />`, errors: [{ messageId: "stock" }] },
    { code: `<a className="bg-[#fff]" />`, errors: [{ messageId: "raw" }] },
    { code: `<a className="text-[rgb(0_0_0)]" />`, errors: [{ messageId: "raw" }] },
    { code: `<stop stopColor="#AC78FF" />`, errors: [{ messageId: "attribute" }] },
  ],
});

tester.run("no-filter-motion", rules["no-filter-motion"], {
  valid: [
    // A static frosted surface is fine; only animated filters are banned.
    `<header className="backdrop-blur transition-colors hover:bg-white" />`,
    `<img className="blur-sm" />`,
  ],
  invalid: [
    {
      code: `<img className="transition-[filter,opacity] hover:blur-sm" />`,
      errors: [{ messageId: "filter" }],
    },
    { code: `<img className="transition hover:grayscale" />`, errors: [{ messageId: "filter" }] },
  ],
});

tester.run("client-boundary", rules["client-boundary"], {
  valid: [
    `export function A() { return <div />; }`,
    `export function A() { const id = useId(); return <div id={id} />; }`,
    `"use client"; export function A() { const [a] = useState(0); return <div>{a}</div>; }`,
    `"use client"; export function A() { return <button onClick={() => {}} />; }`,
    `"use client"; export function A() { return <Toggle onValueChange={(v) => v} />; }`,
    // Forwarding a prop to a component does not need the client.
    `export function A({ onPick }) { return <List onPick={onPick} />; }`,
  ],
  invalid: [
    {
      code: `export function A() { const ref = useRef(null); return <div ref={ref} />; }`,
      errors: [{ messageId: "missing" }],
    },
    {
      code: `export function A() { return <button onClick={go} />; }`,
      errors: [{ messageId: "missing" }],
    },
    {
      code: `export function A() { return <Toggle onValueChange={() => {}} />; }`,
      errors: [{ messageId: "missing" }],
    },
    {
      code: `"use client"; export function A() { return <div />; }`,
      errors: [{ messageId: "unneeded" }],
    },
  ],
});
