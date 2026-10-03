/**
 * Motion and micro-interaction gates for every story in the built explorer.
 *
 * - Reduced motion (the `chromium` project, which emulates `reduce`): while
 *   a story's first controls are hovered, tabbed to and (for disclosures,
 *   dialogs and menus) opened and closed, no animation or transition may move
 *   anything (transform, size, position, clip or background geometry). Colour
 *   and opacity fades may run. Shell and pattern stories run again at phone
 *   width, where the mobile header controls appear.
 * - Interaction states (the `motion` project, no preference): every visible
 *   link and button looks different on hover without counting movement, so
 *   the hover still reads under reduced motion, and `pressable` elements
 *   shrink while pressed. The micro-interaction contract in
 *   docs/design-system.md.
 *
 * A story opts an element out of the hover check with `data-static-hover`
 * (for example an unstyled `Anchor` that brings no styling of its own).
 */
import { readFileSync } from "node:fs";

import { expect, type Locator, type Page, test } from "@playwright/test";

type IndexEntry = { id: string; type: string; tags?: string[] };

const stories = Object.values(
  (
    JSON.parse(readFileSync("storybook-static/index.json", "utf8")) as {
      entries: Record<string, IndexEntry>;
    }
  ).entries,
).filter((entry) => entry.type === "story" && !entry.tags?.includes("!test"));

/** At most this many controls per story are hovered and tabbed through. */
const CONTROLS_PER_STORY = 16;
const CONTROLS = "a[href], button, [role='button'], [role='tab'], summary";
/** Controls that open something: their open and close are audited too. */
const OPENERS = "button[aria-expanded], button[aria-haspopup]";
/** Stories whose layout changes at phone width (the mobile header). */
const PHONE_STORIES = /^(shell|patterns)-/;

async function story(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator("body")).toHaveAttribute("data-kit-ready", "true");
}

/**
 * Hovers a control until `:hover` really applies: Chromium holds back hover
 * updates for a moment after a scroll, so the first move can land unnoticed.
 */
async function hover(control: Locator) {
  await expect(async () => {
    await control.hover({ force: true });
    expect(await control.evaluate((el) => el.matches(":hover"))).toBe(true);
  }).toPass({ timeout: 3000 });
}

/** Waits two frames, so transitions started by the last input have begun. */
async function settleFrame(page: Page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

/**
 * The story's controls, each tagged with a stable `data-audit` index: a
 * positional locator would shift as scrolling reveals or hides content.
 */
async function visibleControls(page: Page): Promise<Locator[]> {
  const count = await page.locator(CONTROLS).evaluateAll((elements, limit) => {
    let tagged = 0;
    for (const el of elements) {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const skip =
        el.closest("[data-static-hover], [data-base-ui-focus-guard], [inert], [hidden]") !== null ||
        (el as HTMLButtonElement).disabled ||
        el.getAttribute("aria-disabled") === "true" ||
        style.visibility === "hidden" ||
        box.width === 0 ||
        box.height === 0 ||
        // Parked off-screen until focused (the skip link): reached by the Tab pass instead.
        box.bottom <= 0 ||
        box.right <= 0;
      if (skip || tagged >= limit) continue;
      el.setAttribute("data-audit", String(tagged));
      tagged += 1;
    }
    return tagged;
  }, CONTROLS_PER_STORY);
  return Array.from({ length: count }, (_, index) => page.locator(`[data-audit="${index}"]`));
}

/** Running animations and transitions that move or resize something. */
async function movingAnimations(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const MOVING =
      /^(transform|translate|scale|rotate|width|height|inset.*|top|right|bottom|left|margin.*|padding.*|background-position.*|background-size|clip-path|stroke-dashoffset|offset.*)$/;
    const describe = (el: Element | null) =>
      el
        ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${[...el.classList].slice(0, 4).join(".")}`
        : "?";
    return document.getAnimations().flatMap((animation) => {
      const effect = animation.effect;
      if (!(effect instanceof KeyframeEffect) || animation.playState !== "running") return [];
      const duration = Number(effect.getComputedTiming().duration);
      if (!(duration > 0)) return [];
      const properties =
        animation instanceof CSSTransition
          ? [animation.transitionProperty]
          : effect
              .getKeyframes()
              .flatMap((frame) => Object.keys(frame))
              .filter((key) => !["offset", "easing", "composite", "computedOffset"].includes(key));
      return properties
        .filter((property) => MOVING.test(property))
        .map((property) => `${describe(effect.target)} ${property} ${duration}ms`);
    });
  });
}

/** Opens and closes each opener, sampling movement while it opens and closes. */
async function exerciseOpeners(page: Page, moving: Set<string>) {
  // Close what a story opens by default (a dialog shown open), so its trigger is reachable.
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await settleFrame(page);
  const openers = page.locator(OPENERS).filter({ visible: true });
  const count = Math.min(await openers.count(), 6);
  for (let index = 0; index < count; index++) {
    const opener = openers.nth(index);
    if (
      !(await opener.isVisible()) ||
      (await opener.isDisabled()) ||
      // Still open, or behind a modal: the story controls it.
      (await opener.evaluate((el) => el.closest("[inert]") !== null))
    ) {
      continue;
    }
    const label = await opener.evaluate((el) =>
      (el.getAttribute("aria-label") ?? el.textContent).trim().slice(0, 30),
    );
    await opener.click();
    await settleFrame(page);
    for (const item of await movingAnimations(page)) moving.add(`open "${label}" → ${item}`);
    await page.keyboard.press("Escape");
    await settleFrame(page);
    // A disclosure ignores Escape: close it the way it opened.
    if ((await opener.getAttribute("aria-expanded")) === "true" && (await opener.isVisible())) {
      await opener.click();
      await settleFrame(page);
    }
    for (const item of await movingAnimations(page)) moving.add(`close "${label}" → ${item}`);
  }
}

test.describe("reduced motion", () => {
  for (const entry of stories) {
    const widths = PHONE_STORIES.test(entry.id) ? [1280, 390] : [1280];
    for (const width of widths) {
      test(`${entry.id} at ${width}px: nothing moves under reduced motion`, async ({ page }) => {
        test.skip(
          test.info().project.name !== "chromium",
          "Runs once, in Chromium with reduced motion.",
        );
        await page.setViewportSize({ width, height: 900 });
        await story(page, entry.id);
        const moving = new Set(await movingAnimations(page));
        if (width > 390) {
          for (const control of await visibleControls(page)) {
            await hover(control);
            await settleFrame(page);
            for (const item of await movingAnimations(page)) moving.add(`hover → ${item}`);
          }
        }
        await page.mouse.move(0, 0);
        for (let step = 0; step < CONTROLS_PER_STORY; step++) {
          await page.keyboard.press("Tab");
          await settleFrame(page);
          for (const item of await movingAnimations(page)) moving.add(`focus → ${item}`);
        }
        await exerciseOpeners(page, moving);
        expect([...moving]).toEqual([]);
      });
    }
  }
});

/**
 * The computed styles that make a hover state visible. Movement (transform,
 * translate, scale, rotate) is left out on purpose: it disappears under
 * reduced motion, so a hover must also show as colour, tint or underline.
 */
async function appearance(control: Locator, hovered: boolean): Promise<string | null> {
  return control.evaluate((el, hovered) => {
    // Null when the pointer state is not the one asked for (a late scroll moved it).
    if (el.matches(":hover") !== hovered) return null;
    const PROPS = [
      "color",
      "background-color",
      "background-image",
      "background-size",
      "background-position",
      "border-color",
      "box-shadow",
      "outline-color",
      "text-decoration-line",
      "text-decoration-color",
      "text-decoration-thickness",
      "opacity",
      "filter",
    ];
    // A nav can answer for its links (the header pill glides along the whole nav).
    const scope = el.closest("nav") ?? el;
    const parts: Element[] = [scope, ...scope.querySelectorAll("*")].slice(0, 200);
    return parts
      .flatMap((part) =>
        [null, "::before", "::after"].map((pseudo) => {
          const style = getComputedStyle(part, pseudo);
          return PROPS.map((prop) => style.getPropertyValue(prop)).join("|");
        }),
      )
      .join("\n");
  }, hovered);
}

/** Takes an appearance snapshot in the given pointer state, retrying the pointer move. */
async function snapshot(page: Page, control: Locator, hovered: boolean): Promise<string> {
  const taken = { value: "" };
  await expect(async () => {
    if (hovered) await control.hover({ force: true });
    else await page.mouse.move(0, 0);
    await settleFrame(page);
    const result = await appearance(control, hovered);
    expect(result).not.toBeNull();
    taken.value = result ?? "";
  }).toPass({ timeout: 3000 });
  return taken.value;
}

test.describe("interaction states", () => {
  test.beforeEach(async ({ page }) => {
    if (test.info().project.name !== "motion") return;
    // Hover states are compared at their end values: skip the transitions, and
    // stop keyframe animations so an entrance can't pass for a hover state.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent =
          "*, *::before, *::after { transition-duration: 0s !important; transition-delay: 0s !important; animation: none !important; }";
        document.head.append(style);
      });
    });
  });

  for (const entry of stories) {
    test(`${entry.id}: every control answers hover and press`, async ({ page }) => {
      test.skip(test.info().project.name !== "motion", "Runs in the motion-enabled project.");
      await story(page, entry.id);
      const silent: string[] = [];
      for (const control of await visibleControls(page)) {
        await page.mouse.move(0, 0);
        await settleFrame(page);
        // Centre it, so a fixed header never sits between the pointer and the control.
        await control.evaluate((el) => {
          el.scrollIntoView({ block: "center", behavior: "instant" });
          // Rest means neither hovered nor focused: a story may leave a control
          // focused, and focus already shows the hover look (focus parity).
          (document.activeElement as HTMLElement | null)?.blur();
        });
        // A control shown only while focused (the skip link) has no hover to check.
        const parked = await control.evaluate((el) => {
          const box = el.getBoundingClientRect();
          return box.bottom <= 0 || box.right <= 0;
        });
        if (parked) continue;
        const rest = await snapshot(page, control, false);
        const hovered = await snapshot(page, control, true);
        if (rest === hovered) {
          silent.push(
            await control.evaluate(
              (el) =>
                `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") ?? el.textContent).trim().slice(0, 40)}"`,
            ),
          );
        }
        if (await control.evaluate((el) => el.closest(".pressable") === el)) {
          await page.mouse.down();
          await settleFrame(page);
          expect(await control.evaluate((el) => getComputedStyle(el).scale)).toBe("0.97");
          // Release away from the control, so the press never becomes a click.
          await page.mouse.move(0, 0);
          await page.mouse.up();
        }
      }
      expect(silent, "controls without a hover state").toEqual([]);
    });
  }
});
