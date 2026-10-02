import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ButtonLink,
  Container,
  CtaBand,
  FaqSection,
  MotionProvider,
  PageHero,
  Photo,
  Section,
  SectionHeader,
  StatGrid,
} from "../src";
import { Footer, Header, SkipLink } from "../src/shell";
const logo = {
  src: "/assets/tum_ai_logo_new.svg",
  width: 128,
  height: 40,
  alt: "TUM.ai",
  unoptimized: true,
};
function CompletePage() {
  return (
    <MotionProvider>
      <SkipLink />
      <Header
        logo={logo}
        navigation={[
          { href: "/", label: "Home" },
          { href: "#work", label: "Our work" },
          { href: "#questions", label: "Questions" },
        ]}
        cta={{ href: "#join", label: "Get involved" }}
      />
      <main id="main-content" tabIndex={-1}>
        <PageHero
          title="Ideas become possibilities"
          eyebrow="TUM.ai / Component patterns"
          lead="A representative page built from the shared library, using deterministic example content."
          media={
            <Photo
              src="/assets/placeholder.svg"
              alt="Abstract violet architectural shapes"
              unoptimized
            />
          }
          actions={
            <ButtonLink href="#work" arrow>
              Explore our work
            </ButtonLink>
          }
        />
        <Section id="work" tone="paper">
          <Container>
            <SectionHeader
              title="Built together"
              lead="Compose a small set of shared elements into a clear, consistent page."
            />
            <StatGrid
              items={[
                { label: "Example projects", value: "24" },
                { label: "Example teams", value: "12" },
                { label: "Example disciplines", value: "8" },
              ]}
              columns={3}
            />
          </Container>
        </Section>
        <FaqSection
          id="questions"
          title="Good questions start here"
          items={[
            {
              id: "join-answer",
              question: "How do I get involved?",
              answer: "Bring a question and a willingness to learn with others.",
            },
            {
              question: "Where does this content come from?",
              answer:
                "This page uses local, synthetic fixtures. Your application owns its content.",
            },
          ]}
        />
        <CtaBand
          id="join"
          title="Make the next idea real"
          lead="A closing invitation with one clear next step."
          actions={
            <ButtonLink href="mailto:hello@example.com" arrow="external">
              Start a conversation
            </ButtonLink>
          }
        />
      </main>
      <Footer
        logo={logo}
        tagline="Exploring artificial intelligence together."
        columns={[
          {
            id: "discover",
            title: "Discover",
            links: [
              { href: "#work", label: "Our work" },
              { href: "#questions", label: "Questions" },
            ],
          },
        ]}
        bottomLine="TUM.ai · Example composition"
      />
    </MotionProvider>
  );
}
const meta = {
  title: "Patterns/Complete page",
  component: CompletePage,
  parameters: {
    layout: "fullscreen",
    kit: { exports: [], tones: ["ink", "paper", "lavender"], shell: true },
  },
} satisfies Meta<typeof CompletePage>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
