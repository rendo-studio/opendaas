---
name: Maintainer Workflow
description: Repository-specific workflow rules for maintaining OpenDaaS itself.
---

# Maintainer Workflow

## Scope

This page is for maintainers working on the OpenDaaS repository itself.

It is not part of the public usage model.

## Rules For This Repository

- use OpenDaaS in this repository
- keep `docs/public/` focused on external users of the framework
- keep repository-specific development details in `docs/internal/`
- update `.opendaas/` before implementation drifts too far from the control plane
- treat `archive/` as historical reference only, not as an active truth source

## Change Workflow

When behavior changes:

1. update the relevant structured anchors in `.opendaas/`
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
