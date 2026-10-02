---
paths:
  - "docs/**"
  - "*.md"
  - ".github/**/*.md"
---

Docs are public. Write neutrally for outside readers. Use "maintainers" instead of personal names or account handles, no dated status claims ("verified on…", "pending"), and no references to internal tools or agent sessions. Link pull requests in full. Never hand-edit `docs/api.md`; edit TSDoc and run `bun run manifests`. Docs rendered in Storybook come in through `docs/*.mdx` wrappers, so keep their titles in sync.
