---
name: Maintainer Workflow
description: Repository-specific workflow rules for maintaining APCC itself.
---

# Maintainer Workflow

## Scope

This page is for maintainers working on the APCC repository itself.

It is not part of the public usage model.

## Rules For This Repository

- use APCC in this repository
- keep `docs/public/` focused on external users of the framework
- keep repository-specific development details in `docs/internal/`
- update `.apcc/` before implementation drifts too far from the control plane
- treat `archive/` as historical reference only, not as an active truth source

## Change Workflow

When behavior changes:

1. update the relevant structured anchors in `.apcc/`
2. update public docs if external behavior changed
3. update internal docs if maintainer workflow or repository internals changed
4. run verification appropriate to the affected surface

## Minimum Verification

For normal control-plane or docs-site work, run:

```bash
npm run check
npm run test
npm run build
npm run dev -- site build
```

Add targeted runtime smoke checks when the change affects the site runtime, docs rendering, or CLI command behavior.

## Embedded Docs Runtime Package Manager

The embedded docs runtime stays on `npm` for now.

Reason:

- the runtime template already carries a `package-lock.json`
- `npm ci` gives deterministic installs for the embedded runtime
- switching to `pnpm` or `bun` would add extra runtime bootstrap branches, lockfile policy, and cross-platform verification surface without improving the core APCC workflow

Revisit this only if the embedded runtime shows a concrete install-performance or reliability problem that npm cannot handle cleanly.
