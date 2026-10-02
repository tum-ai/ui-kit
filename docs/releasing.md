# Releases and hosting

## npm

Package target: `@tum.ai/ui-kit`, public, ESM, Next 16 / React 19 / Tailwind 4. The first public release is [0.1.0](https://www.npmjs.com/package/@tum.ai/ui-kit/v/0.1.0). Public API, visual, token and accessibility changes need a Changeset. Before 1.0, breaking changes increment minor versions and require migration notes; compatible fixes increment patch.

Run `bun run version:packages`, review the changelog/version, run `bun run verify`, and inspect the tarball list in `artifacts/consumer.json`. `npm pack --ignore-scripts --dry-run` may inspect a build without publishing. Only dist, approved assets and notices are distributed.

The npm organization is `tum.ai`; the GitHub organization is `tum-ai`. The bootstrap release 0.1.0 was published on 2026-10-02 from [304d24a](https://github.com/tum-ai/ui-kit/commit/304d24a14b9aa2b2027de62c51094bb4082ce669), after main CI passed, using maintainer `justiiiin` and browser-based 2FA. Its 225-file tarball has SHA-1 `ebd9bed5f45a62872df754b7aee83560aec44d7a`. This initial local publication has no GitHub provenance attestation; subsequent releases use the workflow below.

### One-time trusted publisher

The connection must use GitHub owner `tum-ai`, repository `ui-kit`, workflow `publish.yml`, environment `npm-publish`, with direct publishing allowed. A maintainer with npm 11.15+ and package write access can register it with:

```sh
npm trust github @tum.ai/ui-kit --repository tum-ai/ui-kit --file publish.yml --environment npm-publish --allow-publish --yes
npm trust list @tum.ai/ui-kit
```

npm requires browser-based 2FA to authorize this connection. Follow the CLI link in any signed-in browser; no Codex access to that browser or saved npm token is required. The connection uses GitHub's short-lived OIDC identity on later releases. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

### Subsequent releases

1. Add Changesets with API, design-token or visual changes. Run `bun run version:packages`, review the version/changelog, and merge the release changes after CI passes.
2. In GitHub Actions, select [Publish npm package](https://github.com/tum-ai/ui-kit/actions/workflows/publish.yml), choose **Run workflow**, and select `main`.
3. Approve the `npm-publish` environment when GitHub requests it. It is restricted to protected branches and requires review by `jaylann`. Administrator merge bypass does not remove this release approval.
4. The workflow runs full verification and publishes with OIDC/provenance. Bun installs/builds/tests; Node 24's npm CLI publishes. Verify `npm view @tum.ai/ui-kit version` and install the exact new version in a consumer.
5. Create a stable GitHub release with tag `v<package version>` at the published commit to generate the matching Figma bundle. The installed Figma updater applies it while open or on its next launch; see [Figma generation](figma.md).

A new package can appear on npm's website and exact-version endpoint before the package index is ready for installation. Keep the successful publish receipt, retry the read/install check after propagation, and never attempt to republish that version. `npm trust list @tum.ai/ui-kit` checks the configured connection; it does not prove an OIDC publication has run successfully.

No push, merge or automatic dependency update publishes a package. Never overwrite a version. Revert a bad change and release a new patch; deprecate a faulty published version when appropriate. Retain the previous version for consumer rollback.

## Vercel (owner-managed connection)

The owner will connect the repository later. Do not inspect or modify the personal Vercel organization. `vercel.json` contains the complete static build configuration: frozen Bun install, package + Storybook + manifests build, `storybook-static` output. No CMS credentials or runtime environment variables are required.

When connecting, choose the correct organization, set main as the production branch, and enable PR previews. Review the deployed explorer and its fonts/assets before promoting it. Do not commit `.vercel` state. Configure a custom domain only when the owner supplies one.

## Source reconciliation

`extraction.json` and `extraction-inventory.json` record provenance and ownership. Before eventual website adoption, compare the recorded source against the actual merged redesign, explicitly port relevant fixes, and install a fixed kit version in a separate website PR. Do not maintain an automatic bidirectional file sync.
