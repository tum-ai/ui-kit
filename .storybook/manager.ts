import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";
addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "TUM.ai / UI kit",
    brandUrl: "https://github.com/tum-ai/ui-kit",
    colorPrimary: "#8052C2",
    colorSecondary: "#523573",
    fontBase: '"Manrope", sans-serif',
    appBg: "#F5EFFF",
    appContentBg: "#FFFFFF",
    textColor: "#1B0049",
  }),
});
