import { ButtonLink, Container, Heading } from "@tum-ai/ui-kit";
export default function About() {
  return (
    <Container as="main" id="main-content" tabIndex={-1}>
      <Heading as="h1">Second route</Heading>
      <ButtonLink href="/">Back to consumer</ButtonLink>
    </Container>
  );
}
