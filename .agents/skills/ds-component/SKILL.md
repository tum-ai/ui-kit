---
name: ds-component
description: TUM.ai UI-kit ds-component workflow.
---

# ds-component

Read docs/design-system.md and docs/portability.md. Check for an existing family/variant before adding one. Preserve as/headingAs, tone/emphasis, className/classNames and ref-as-prop conventions. Use Base UI, semantic tokens and TSDoc. Runtime imports must remain relative and app-independent.

Colocate meaningful tests and .stories.tsx with explicit title and parameters.kit.exports/tones. Show every named variant and important interaction state; include keyboard plays and axe without blanket skips. Add exports through the coordinator-owned barrel. Run targeted Vitest, lint and types; regenerate catalog/API with bun run manifests. Review visual and accessibility changes. Add a Changeset for public changes.
