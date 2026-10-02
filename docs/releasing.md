# Releases and hosting

## npm package

`@tum.ai/ui-kit` is a public ESM package for Next.js 16, React 19 and Tailwind 4, published from the [`tum.ai` npm organization](https://www.npmjs.com/org/tum.ai). The tarball contains only `dist`, the approved `assets`, the license and the notices.

### Versioning

The package follows semantic versioning, with one adjustment before 1.0:

- Breaking changes increment the minor version and come with migration notes.
- Compatible fixes increment the patch version.

Every public API, visual, token or accessibility change needs a Changeset (`bun run changeset`).

Published versions are never overwritten. To fix a bad release, revert or fix the change and release a new patch. Deprecate the faulty version with `npm deprecate` when appropriate. Older versions stay available so consumers can roll back.

### Release steps

1. Merge the Changesets with their changes. When a release is due, run `bun run version:packages` on a branch. Review the version bump and changelog, then merge that pull request after CI passes.
2. In GitHub Actions, open [Publish npm package](https://github.com/tum-ai/ui-kit/actions/workflows/publish.yml), choose **Run workflow**, and select `main`.
3. Approve the `npm-publish` environment when GitHub asks. It is restricted to protected branches and requires a maintainer's review.
4. The workflow runs `bun run verify` and then publishes with npm provenance through GitHub's OIDC identity. No npm token is stored in the repository.
5. Check `npm view @tum.ai/ui-kit version` and install the exact new version in a consumer. Right after publishing, the registry index can lag behind the package page. Retry the install after a short wait, and never publish the same version again.
6. Create a stable GitHub release with the tag `v<package version>` at the published commit. This triggers the [Figma library generation](figma.md).

To inspect the package contents without publishing, run `bun run build`, then `npm pack --ignore-scripts --dry-run`. After `bun run test:consumer`, `artifacts/consumer.json` lists the tested tarball.

### Trusted publisher setup

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/). The trusted connection is configured once on npm with these values:

| Setting           | Value         |
| ----------------- | ------------- |
| GitHub owner      | `tum-ai`      |
| Repository        | `ui-kit`      |
| Workflow          | `publish.yml` |
| Environment       | `npm-publish` |
| Direct publishing | allowed       |

A maintainer with package write access and npm 11.15 or later can register or inspect it:

```sh
npm trust github @tum.ai/ui-kit --repository tum-ai/ui-kit --file publish.yml --environment npm-publish --allow-publish --yes
npm trust list @tum.ai/ui-kit
```

`npm trust list` shows the configured connection. It does not prove that an OIDC publication has succeeded.

## Hosting the explorer

The Storybook explorer is a static site and can be served by any static host. `vercel.json` provides a ready configuration with these settings:

- install: `bun install --frozen-lockfile`
- build: the package, Storybook and manifests
- output: `storybook-static`

No CMS credentials or runtime environment variables are needed.

When you connect a host, use `main` as the production branch and enable pull request previews. Before promoting a deployment, check its fonts and assets. Don't commit host-specific state such as `.vercel/`.
