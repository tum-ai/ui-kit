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
    // An explicit reduced-motion opt-out.
    `<b className="duration-hover motion-reduce:duration-0" />`,
    // A cva base gate covers every variant.
    `cva("transition-transform motion-reduce:transition-none", { variants: { a: { true: "hover:scale-105" } } })`,
    // Recipes with their transition properties listed.
    `<b className="pressable transition-[background-color,scale]" />`,
    `<b className="hover-lift transition-[translate,box-shadow]" />`,
    `<b className="pressable transition-transform" />`,
    // A size change at rest, or on hover without a size transition, doesn't move anything.
    `<b className="w-2/3 hover:w-full transition-colors" />`,
    `<b className="transition-[width] motion-safe:group-hover/x:w-full" />`,
  ],
  invalid: [
    {
      code: `<a className="duration-300! transition" />`,
      output: `<a className="duration-hover! transition" />`,
      errors: [{ messageId: "duration" }],
    },
    { code: `<a className="[transition-duration:250ms]" />`, errors: [{ messageId: "duration" }] },
    {
      code: `<b className="transition-[width] group-hover/menu:w-full" />`,
      errors: [{ messageId: "transform" }],
    },
    { code: `<b className="starting:translate-y-4" />`, errors: [{ messageId: "transform" }] },
    { code: `<b className="[&:hover]:translate-x-1" />`, errors: [{ messageId: "transform" }] },
    {
      // A gate in one variant does not cover another variant's transform.
      code: `cva("transition-transform", { variants: { a: { true: "motion-reduce:transition-none" }, b: { true: "hover:-translate-y-1" } } })`,
      errors: [{ messageId: "transform" }],
    },
    {
      // Nor does a gate in another classNames slot.
      code: `<Card classNames={{ root: "motion-reduce:transition-none", item: "transition hover:scale-105" }} />`,
      errors: [{ messageId: "transform" }],
    },
    {
      // Object maps are followed, and a shared string is reported once.
      code: `const tones = { a: "transition-all" }; cn(tones.a); cn(tones[x]);`,
      errors: [{ messageId: "transitionAll" }],
    },
    {
      // A class call nested in another helper is still checked.
      code: `cn(pick(cn("transition-all")))`,
      errors: [{ messageId: "transitionAll" }],
    },
    {
      // A const class list used elsewhere is reported once, where it is defined.
      code: `const c = cn("duration-200"); <b className={c} />`,
      errors: [{ messageId: "duration" }],
    },
    {
      code: `<b className="pressable transition-colors" />`,
      errors: [{ messageId: "recipe" }],
    },
    { code: `<b className="hover-lift" />`, errors: [{ messageId: "recipe" }] },
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
    { code: `<a className="text-shadow-gray-500" />`, errors: [{ messageId: "stock" }] },
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
    `"use client"; import { createContext } from "react"; export const C = createContext(null);`,
    `"use client"; import { useReducedMotion } from "framer-motion"; export function A() { const r = useReducedMotion(); return <div>{r}</div>; }`,
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
    {
      code: `function handle() {} export function A() { return <Toggle onPressedChange={handle} />; }`,
      errors: [{ messageId: "missing" }],
    },
    {
      code: `import { createContext } from "react"; export const C = createContext(null);`,
      errors: [{ messageId: "missing" }],
    },
    {
      code: `export function A() { return <C.Provider value={1} />; }`,
      errors: [{ messageId: "missing" }],
    },
  ],
});
