"use client";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  FallbackImage,
} from "@tum.ai/ui-kit";
import { useState } from "react";
export function Controls() {
  const [count, setCount] = useState(0);
  return (
    <>
      <Button onClick={() => setCount((n) => n + 1)}>Clicked {count} times</Button>
      <div aria-label="Button variants">
        {(["primary", "secondary", "outline", "ghost", "inverse", "link"] as const).map(
          (variant) => (
            <Button key={variant} variant={variant} data-testid={`variant-${variant}`}>
              {variant}
            </Button>
          ),
        )}
      </div>
      <Dialog>
        <DialogTrigger render={<Button />}>Open package dialog</DialogTrigger>
        <DialogContent>
          <div className="p-8">
            <DialogTitle>Package dialog</DialogTitle>
            <DialogDescription>The portal lives outside the application root.</DialogDescription>
            <DialogClose render={<Button />}>Close package dialog</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
      <Accordion>
        <AccordionItem value="question">
          <AccordionTrigger>Does the package hydrate?</AccordionTrigger>
          <AccordionPanel>Yes, interactive primitives work from the tarball.</AccordionPanel>
        </AccordionItem>
      </Accordion>
      <FallbackImage
        src="/missing-image.png"
        alt="Unavailable portrait"
        width={120}
        height={120}
        unoptimized
        fallback={<p>Image fallback is visible.</p>}
      />
    </>
  );
}
