---
name: Docs Site
description: How the local docs site works and what it is expected to show.
---

# Docs Site

## Purpose

The docs site is the default local collaboration surface for OpenDaaS.

It exists so a human can inspect:

- the authored docs package
- the current control-plane state
- the live console views derived from `.opendaas/`

## Runtime Commands

Open the local site:

```bash
opendaas site open
```

Stop the runtime without deleting it:

```bash
opendaas site stop
```

Run a production build check:

```bash
opendaas site build
```

Remove the staged runtime:

```bash
opendaas site clean
```

## Source Path

The docs site reads from the configured docs package root in:

`.opendaas/config/workspace.yaml`

Relevant fields:

- `docsSite.sourcePath`
- `docsSite.preferredPort`

## What The Site Should Not Depend On

The docs site should not depend on:

- a fixed `docs/` root if the workspace config points somewhere else
- hardcoded `project/changes` style conventions
- implicit version or decision directories

It should render authored docs from the configured package root and structured runtime state from `.opendaas`.
