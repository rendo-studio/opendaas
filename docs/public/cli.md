---
name: CLI
description: The public command surface and the intended role of each command group.
---

# CLI

## Design Principle

The CLI is a control-plane tool, not the only valid editor for an APCC workspace.

Its job is to provide safe entrypoints, validation, and structured mutations where they are most useful.

## Public Command Groups

Current command groups:

- `guide`
- `init`
- `validate`
- `project`
- `goal`
- `plan`
- `task`
- `status`
- `decision`
- `version`
- `site`

## What Each Group Is For

`guide`

- print the canonical operating guide for development agents

`init`

- bring a new or existing repository under APCC control

`validate`

- check whether the workspace is complete and structurally consistent

`project`

- manage the structured project overview anchor

`goal`

- manage the long-lived end goal anchor

`plan`

- manage current execution streams

`task`

- manage concrete work items

`status`

- inspect the derived project status snapshot

`decision`

- record high-value decisions

`version`

- record low-frequency project-level versions

`site`

- open, stop, build, or clean the local docs site runtime

## Discovery Rule

If you do not fully understand a command, inspect help before acting:

```bash
apcc --help
apcc <group> --help
```

## Output Contract

Default CLI output is Markdown for development agents.

Use `--json` only when you need raw structured output for scripting or machine inspection.
