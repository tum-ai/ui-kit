import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwind from "@tailwindcss/vite";
const config: StorybookConfig = {
  core: { disableTelemetry: true },
  stories: [
    "../src/**/*.stories.@(ts|tsx)",
    "../stories/**/*.stories.@(ts|tsx)",
    "../docs/**/*.mdx",
  ],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: "@storybook/nextjs-vite",
  staticDirs: [{ from: "../assets", to: "/assets" }],
  typescript: { reactDocgen: "react-docgen-typescript" },
  viteFinal: (config) => ({ ...config, plugins: [...(config.plugins ?? []), tailwind()] }),
};
export default config;
