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

## Lifecycle Expectations

APCC treats the local docs site runtime as a managed local service.

Expected behavior:

- `apcc site open` starts the runtime if it is not running yet
- a second `apcc site open` reuses the healthy runtime instead of restarting it
- `apcc site stop` stops the local runtime but preserves the staged runtime for a faster next start
- `apcc site clean` stops the runtime and removes the staged runtime so the next start is cold

The lifecycle commands should not mutate a healthy running runtime just to decide whether it can be reused.

## Source Path

The docs site reads from the configured docs package root in:

`.apcc/config/workspace.yaml`

Relevant fields:

- `docsLanguage`
- `docsSite.sourcePath`
- `docsSite.preferredPort`

Within the docs package itself, `meta.json` can be used to make navigation order explicit. The default scaffold includes one at the package root to demonstrate a minimal top-level navigation configuration.

The docs site uses the workspace `docsLanguage` value as its default locale when opening `/docs` without an explicit language prefix.

## What The Site Should Not Depend On

The docs site should not depend on:

- a fixed `docs/` root if the workspace config points somewhere else
- hardcoded `project/changes` style conventions
- implicit version or decision directories

It should render authored docs from the configured package root and structured runtime state from `.apcc`.
