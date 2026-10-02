import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { CountUp } from "./count-up";
import { formatFigure, parseFigure } from "./figure";

const meta = {
  title: "Motion/CountUp",
  component: CountUp,
  parameters: {
    kit: {
      exports: ["CountUp", "parseFigure", "formatFigure"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: { value: "1.2M+" },
  render: (args) => (
    <div>
      <p className="mb-5 text-small text-fg-muted">
        An example figure, shown in its final form when it starts in view.
      </p>
      <div className="text-stat-lg text-fg">
        <CountUp {...args} />
      </div>
    </div>
  ),
} satisfies Meta<typeof CountUp>;
export default meta;
type Story = StoryObj<typeof meta>;

export const CopyFigure: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("1.2M+", { selector: ".sr-only" })).toBeInTheDocument();
    await expect(canvas.getByText("1.2M+", { selector: '[aria-hidden="true"]' })).toBeVisible();
  },
};
export const NumericFigure: Story = { args: { value: 2100, prefix: "~", suffix: "+" } };
export const DecimalPercentage: Story = { args: { value: 2.3, decimals: 1, suffix: "%" } };
export const Ungrouped: Story = { args: { value: 2000, grouping: false } };
export const StaticCopy: Story = { args: { value: "24/7" } };
export const OnScroll: Story = {
  render: (args) => (
    <div>
      <p className="text-small text-fg-muted">
        The figure begins below the viewport and counts once as it enters view.
      </p>
      <div style={{ height: "110vh" }} aria-hidden="true" />
      <div data-testid="scroll-figure" className="pb-16 text-stat-lg text-fg">
        <CountUp {...args} duration={0.3} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByTestId("scroll-figure").scrollIntoView();
    await expect(canvas.getByText("1.2M+", { selector: ".sr-only" })).toBeInTheDocument();
    await waitFor(() =>
      expect(canvas.getByText("1.2M+", { selector: '[aria-hidden="true"]' })).toBeVisible(),
    );
  },
};
export const ServerSafeHelpers: Story = {
  render: () => {
    const figure = parseFigure("€12,345.60M+");
    if (!figure) return <p>Figure unavailable</p>;
    return (
      <div className="max-w-xl">
        <h2 className="mb-5 text-heading-md text-fg">One shape, several values</h2>
        <p className="mb-6 text-body text-fg-muted">
          The parsing and formatting helpers can run in server code. A copy figure preserves its
          prefix, precision, grouping and suffix.
        </p>
        <dl className="space-y-4 text-fg">
          <div>
            <dt className="text-small">Source</dt>
            <dd className="text-stat-sm">{formatFigure(figure.value, figure)}</dd>
          </div>
          <div>
            <dt className="text-small">Half the numeric value</dt>
            <dd className="text-stat-sm">{formatFigure(figure.value / 2, figure)}</dd>
          </div>
        </dl>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("€12,345.60M+")).toBeVisible();
    await expect(canvas.getByText("€6,172.80M+")).toBeVisible();
  },
};
