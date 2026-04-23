---
name: Docs Site
description: How the local docs site works and what it is expected to show.
---

# Docs Site

## Purpose

The docs site is the default local collaboration surface for APCC.

It exists so a human can inspect:

- the authored docs package
- the current control-plane state
- the live console views derived from `.apcc/`

## Runtime Commands

Open the local site:

```bash
apcc site open
```

Stop the runtime without deleting it:

```bash
apcc site stop
```

Run a production build check:

```bash
apcc site build
```

Remove the staged runtime:

```bash
apcc site clean
```

## Source Path

The docs site reads from the configured docs package root in:

`.apcc/config/workspace.yaml`

Relevant fields:

- `docsSite.sourcePath`
- `docsSite.preferredPort`

Within the docs package itself, `meta.json` can be used to make navigation order explicit. The default scaffold includes one at the package root to demonstrate a minimal top-level navigation configuration.

## What The Site Should Not Depend On

The docs site should not depend on:

- a fixed `docs/` root if the workspace config points somewhere else
- hardcoded `project/changes` style conventions
- implicit version or decision directories

It should render authored docs from the configured package root and structured runtime state from `.apcc`.
