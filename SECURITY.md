# Security policy

## Supported versions

Security fixes are released for the latest minor version of `@tum.ai/ui-kit`. Before 1.0, upgrade to the newest `0.x` release to receive fixes.

## Reporting a vulnerability

Please do not report security problems in public issues or pull requests. Instead, report them privately through [GitHub's private vulnerability reporting](https://github.com/tum-ai/ui-kit/security/advisories/new).

Include the affected version, a description of the problem and its impact, and steps or a minimal example to reproduce it. Maintainers will acknowledge the report, investigate and coordinate a fix and disclosure with you.

The kit is a client-side component library without network access or credentials of its own. Typical relevant issues are unsafe link or HTML handling, script injection through component props, and problems in the published package or release workflows.
