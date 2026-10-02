import {
  ButtonLink,
  Container,
  CountUp,
  Heading,
  Photo,
  Reveal,
  Section,
  TextLink,
} from "@tum.ai/ui-kit";

import { Controls } from "./controls";
export default function Page() {
  return (
    <main id="main-content" tabIndex={-1}>
      <Section tone="paper">
        <Container>
          <Heading as="h1">Package consumer</Heading>
          <p>Installed from a tarball without source aliases.</p>
          <ButtonLink href="/about">Visit the second route</ButtonLink>
          <TextLink href="https://example.com">External reference</TextLink>
          <Reveal data-testid="progressive-content">
            <p>This content is visible without JavaScript.</p>
          </Reveal>
          <span data-testid="count">
            <CountUp value="120+" />
          </span>
          <Controls />
          <Photo
            src="/placeholder.svg"
            alt="Local geometric illustration"
            caption="A packaged local asset."
            aspect="16/10"
          />
          <Photo
            src="https://fixture.invalid/artwork.svg"
            alt="Remote geometric illustration"
            aspect="4/3"
          />
        </Container>
      </Section>
    </main>
  );
}
