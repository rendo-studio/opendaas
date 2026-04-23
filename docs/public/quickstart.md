---
name: Quickstart
description: The shortest correct path to initialize and operate an APCC workspace.
---

# Quickstart

## Who This Is For

This page is for developers who want to start using APCC in a repository with the fewest moving parts.

## Minimum Flow

1. Initialize the repository:

```bash
apcc init
```

Use `init` for both new directories and existing repositories.

2. Review the two shared anchors:

- project overview
- end goal

Update them if the provisional values are not good enough:

```bash
apcc project set --name "My Project" --summary "One-line project definition." --doc-path shared/overview.md
apcc goal set --name "Ship My Project" --description "Long-lived project outcome." --doc-path shared/goal.md
```

3. Make the current execution tree explicit:

```bash
apcc plan add --name "First stream" --parent root --summary "Main execution stream."
apcc task add --name "First task" --parent root --plan first-stream-1 --summary "First concrete unit of work."
```

4. Open the local docs site and inspect the current state:

```bash
apcc site open
apcc status show
```

5. Start work only after the project overview, end goal, plans, and tasks are clear.

## What To Edit Directly

Use direct `.apcc/` edits when you already understand the schema and need to update multiple structured fields quickly.

Use the CLI when you need:

- initialization
- help discovery
- validation and repair
- docs-site runtime actions
- small targeted control-plane mutations

## What Not To Do

Do not:

- treat `docs/` as the structured truth source
- persist computed execution state by hand
- assume a fixed docs directory structure is required
- expect the docs site to infer business meaning from arbitrary paths without explicit references
