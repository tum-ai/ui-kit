import "./preview.css";

import type { Preview } from "@storybook/nextjs-vite";

import shellStyles from "../src/styles/shell.css?inline";
const preview: Preview = {
  tags: ["autodocs"],
  globalTypes: {
    tone: {
      description: "Band tone",
      toolbar: {
        icon: "paintbrush",
        items: ["paper", "mist", "lavender", "ink", "night", "violet"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { tone: "paper" },
  parameters: {
    nextjs: { appDirectory: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: "body",
      options: {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      },
    },
    docs: { story: { inline: false } },
    viewport: {
      options: {
        phone: { name: "Phone", styles: { width: "390px", height: "844px" } },
        narrow: { name: "Narrow", styles: { width: "320px", height: "760px" } },
        tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" } },
        desktop: { name: "Desktop", styles: { width: "1440px", height: "1000px" } },
      },
    },
  },
  beforeEach: () => {
    document.body.dataset.kitReady = "false";
  },
  afterEach: async () => {
    await document.fonts.ready;
    // Captures and browser tests also need below-fold/hidden lazy fixtures loaded.
    for (const image of document.images) image.loading = "eager";
    await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
    document.body.dataset.kitReady = "true";
  },
  decorators: [
    (Story, context) => (
      <>
        {context.title.startsWith("Shell/") || context.parameters.kit?.shell ? (
          <style>{shellStyles}</style>
        ) : null}
        <div
          id="app-root"
          data-tone={context.globals.tone}
          style={{
            minHeight: "100vh",
            padding: context.parameters.layout === "fullscreen" ? 0 : 24,
          }}
        >
          <Story />
        </div>
      </>
    ),
  ],
};
export default preview;
