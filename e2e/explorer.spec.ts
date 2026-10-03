import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
async function story(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator("body")).toHaveAttribute("data-kit-ready", "true");
}
// Base UI intentionally exposes Safari focus guards for VoiceOver redirection.
// Narrow upstream exception: https://github.com/mui/base-ui/issues/5237
async function accessible(page: Page) {
  const result = await new AxeBuilder({ page })
    .exclude("[data-base-ui-focus-guard]")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
}
for (const id of [
  "layout-container--default",
  "foundations-tones--all-tones",
  "patterns-complete-page--default",
]) {
  test(`${id}: browser accessibility`, async ({ page }) => {
    await story(page, id);
    await accessible(page);
  });
}
for (const width of [320, 390, 768, 1440]) {
  test(`@visual foundations ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await story(page, "foundations-tones--all-tones");
    await expect(page.locator("#storybook-root")).toHaveScreenshot(`foundations-${width}.png`);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
  test(`@visual complete page ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await story(page, "patterns-complete-page--default");
    await expect(page.locator("#storybook-root")).toHaveScreenshot(`complete-page-${width}.png`);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}
test("nested dialog keeps background inert and restores focus", async ({ page }) => {
  await story(page, "interactions-dialog--nested");
  const outer = page.getByRole("dialog", { name: "Event details", exact: true });
  await expect(outer).toBeVisible();
  const trigger = page.getByRole("button", { name: "Review registration" });
  await trigger.click();
  const inner = page.getByRole("dialog", { name: "Confirm registration", exact: true });
  await expect(inner).toBeVisible();
  await accessible(page);
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    await expect.poll(() => inner.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(inner).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(
    await page.locator("#app-root").evaluate((el) => el instanceof HTMLElement && el.inert),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(outer).toBeHidden();
  expect(
    await page.locator("#app-root").evaluate((el) => el instanceof HTMLElement && el.inert),
  ).toBe(false);
  await expect(page.getByRole("button", { name: "Open event details" })).toBeFocused();
});
test("mobile header traps focus and restores interaction", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await story(page, "shell-header--solid");
  const trigger = page.getByRole("button", { name: "Open menu" });
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await expect(menu.locator("nav a").first()).toHaveCSS("opacity", "1");
  await accessible(page);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    await expect.poll(() => menu.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});
test("native skip link transfers keyboard focus", async ({ page }) => {
  await story(page, "shell-skiplink--default");
  const link = page.getByRole("link", { name: "Skip to content" });
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page).toHaveURL(/#main-content$/);
});
test("native FAQ fragment opens the linked answer", async ({ page }) => {
  await story(page, "compositions-faqlist--deep-link");
  const first = page.getByRole("button", { name: "How does this list work?" });
  await first.click();
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("link", { name: "Jump to the linking answer" }).click();
  await expect(page.getByRole("button", { name: "Can I link to an answer?" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/#kit-faq-link$/);
});
test("nested tone focus outlines meet non-text contrast", async ({ page }) => {
  await story(page, "foundations-focus--nested-tones");
  for (const tone of ["paper", "mist", "lavender", "ink", "night", "violet"]) {
    const button = page.getByTestId(`focus-${tone}`);
    await button.focus();
    const ratio = await button.evaluate((el) => {
      const style = getComputedStyle(el);
      const background = getComputedStyle(el.closest("section")!).backgroundColor;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      function light(color: string) {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const data = context.getImageData(0, 0, 1, 1).data;
        const linear = (channel = 0) => {
          const n = channel / 255;
          return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * linear(data[0]) + 0.7152 * linear(data[1]) + 0.0722 * linear(data[2]);
      }
      const a = light(style.outlineColor),
        b = light(background);
      return {
        ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        width: style.outlineWidth,
      };
    });
    expect(ratio.width).toBe("3px");
    expect(ratio.ratio, `${tone} focus contrast`).toBeGreaterThanOrEqual(3);
  }
});
test("focus outlines stay visible in forced colors", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Forced-colors emulation is Chromium-only.");
  await page.emulateMedia({ forcedColors: "active" });
  await story(page, "foundations-focus--nested-tones");
  for (const tone of ["paper", "mist", "lavender", "ink", "night", "violet"]) {
    const button = page.getByTestId(`focus-${tone}`);
    await button.focus();
    const outline = await button.evaluate((el) => {
      const style = getComputedStyle(el);
      const section = el.closest("section");
      return {
        style: style.outlineStyle,
        width: style.outlineWidth,
        color: style.outlineColor,
        background: section ? getComputedStyle(section).backgroundColor : "",
      };
    });
    expect(outline.style, `${tone} outline style`).not.toBe("none");
    expect(outline.width, `${tone} outline width`).toBe("3px");
    expect(outline.color, `${tone} outline color`).not.toBe(outline.background);
  }
});
test("reduced motion leaves revealed content visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await story(page, "patterns-complete-page--default");
  for (const element of await page.locator("[data-reveal]").all()) {
    await expect(element).toHaveCSS("opacity", "1");
    await expect(element).toHaveAttribute("data-reveal", "idle");
  }
});
