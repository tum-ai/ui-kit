# Releases and hosting

## npm

Package target: `@tum.ai/ui-kit`, public, ESM, Next 16 / React 19 / Tailwind 4. Start at 0.1.0. Public API, visual, token and accessibility changes need a Changeset. Before 1.0, breaking changes increment minor versions and require migration notes; compatible fixes increment patch.

Run `bun run version:packages`, review the changelog/version, run `bun run verify`, and inspect the tarball list in `artifacts/consumer.json`. `npm pack --ignore-scripts --dry-run` may inspect a build without publishing. Only dist, approved assets and notices are distributed.

The owner confirmed the npm organization is `tum.ai` (the GitHub organization remains `tum-ai`). Verify the authenticated account has publish access before the first publication. The initial setup verified `justiiiin` as a developer in `tum.ai`; account permissions must be checked again at publication. A maintainer performs the initial authenticated publication if needed, then configures npm trusted publishing for GitHub owner `tum-ai`, repository `ui-kit`, workflow `publish.yml`, environment `npm-publish`, and enable its direct `npm publish` permission. The GitHub `npm-publish` environment is configured for protected branches and requires review by `jaylann`. The manual workflow runs full verification on main and uses Node 24's npm CLI for OIDC/provenance. Bun continues to install/build/test; it is not used as the OIDC publisher.

No push, merge or automatic dependency update publishes a package. Never overwrite a version. Revert a bad change and release a new patch; deprecate a faulty published version when appropriate. Retain the previous version for consumer rollback.

## Vercel (owner-managed connection)

The owner will connect the repository later. Do not inspect or modify the personal Vercel organization. `vercel.json` contains the complete static build configuration: frozen Bun install, package + Storybook + manifests build, `storybook-static` output. No CMS credentials or runtime environment variables are required.

When connecting, choose the correct organization, set main as the production branch, and enable PR previews. Review the deployed explorer and its fonts/assets before promoting it. Do not commit `.vercel` state. Configure a custom domain only when the owner supplies one.

## Source reconciliation

`extraction.json` and `extraction-inventory.json` record provenance and ownership. Before eventual website adoption, compare the recorded source against the actual merged redesign, explicitly port relevant fixes, and install a fixed kit version in a separate website PR. Do not maintain an automatic bidirectional file sync.
