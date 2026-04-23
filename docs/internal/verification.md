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
npm run verify:site-lifecycle
```

## Site Changes

If the change affects the docs site, also verify:

```bash
npm run dev -- site build
npm run verify:site-lifecycle
```

Add `site open` smoke checks when the runtime lifecycle, docs rendering, or console views changed.

For lifecycle changes, verify the commands serially:

1. `npm run dev -- site stop`
2. `npm run dev -- site open`
3. `npm run dev -- site open`
4. `npm run dev -- site clean`

Expected result:

- the first open starts a runtime
- the second open reuses the same runtime
- stop preserves the runtime directory
- clean removes the runtime directory

CI should also run the same verification on Windows, Linux, and macOS.

The cross-platform CI smoke check can collapse the docs-site build and lifecycle validation into one run, as long as it still proves both:

- the runtime builds successfully
- the lifecycle sequence remains correct

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
