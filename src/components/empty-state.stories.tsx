import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";

import { Button } from "./button";
import { EmptyState } from "./empty-state";

const meta = {
  title: "Content/EmptyState",
  component: EmptyState,
  parameters: {
    kit: {
      exports: ["EmptyState"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: {
    icon: Search,
    title: "No results found",
    children: "Try another search or clear the filters to see every result.",
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongGuidance: Story = {
  args: {
    title: "No results match all of your selected topics",
    children:
      "Choose a broader topic or remove one filter. Your previous selections remain available, so you can explore several combinations without losing your place.",
  },
};
function RecoveryExample() {
  const [cleared, setCleared] = useState(false);
  return cleared ? (
    <p role="status" className="text-body text-fg">
      All results are visible.
    </p>
  ) : (
    <EmptyState
      icon={Search}
      title="No results found"
      action={<Button onClick={() => setCleared(true)}>Clear filters</Button>}
    >
      Try a broader topic.
    </EmptyState>
  );
}
export const RecoveryAction: Story = {
  render: () => <RecoveryExample />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("All results are visible.");
  },
};
