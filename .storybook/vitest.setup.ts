import * as a11y from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/nextjs-vite";

import * as preview from "./preview";
setProjectAnnotations([a11y, preview]);
