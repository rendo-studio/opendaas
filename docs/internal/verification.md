---
name: Verification
description: Verification expectations for changes made inside the APCC repository.
---

# Verification

## Baseline

Every non-trivial change should verify at least:

- type safety
- tests
- production build

Commands:

```bash
npm run check
npm run test
npm run build
```

## Site Changes

If the change affects the docs site, also verify:

```bash
npm run dev -- site build
```

Add `site open` smoke checks when the runtime lifecycle, docs rendering, or console views changed.

## Control-Plane Changes

If the change affects workspace schema, bootstrap, or validation:

- inspect the generated `.apcc/` files
- inspect the generated docs package
- verify the relevant command output directly

## Public Docs Changes

If the change affects framework usage or command behavior:

- update `docs/public/`
- keep `docs/shared/` aligned with the new public truth
- do not bury public behavior changes only in internal docs
