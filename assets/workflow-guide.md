---
name: OpenDaaS Workflow Guide
description: Canonical Agent-first workflow guidance for operating an OpenDaaS workspace.
---

# OpenDaaS Workflow Guide

Use this guide as the single operating protocol for an OpenDaaS workspace.

You can read the same content through `opendaas guide` or the generated `.agents/skills/opendaas-workflow/SKILL.md`.

OpenDaaS is a CLI-first project context control plane for development agents and the humans directing them.

The core rule is simple:

- prefer the cheapest safe action
- do not spend tokens re-reading state you still trust
- refresh the control plane when context is cold or possibly stale

## Operating States

Every turn is not a new round. Decide which state you are in first.

### Cold Round

You are in a cold round when one of these is true:

- this is a new thread or new agent session
- your working memory is gone or unreliable
- you just switched workspace, branch, or task context after a pause
- you cannot confidently explain the current goal, phase, next actions, and blockers

### Warm Continuation

You are in a warm continuation when all of these are true:

- you are still in the same thread or continuous session
- you still understand the current goal and task
- no human change is suspected
- no control-plane write or handoff boundary is happening right now

Warm continuation is the default for active implementation. Do not restart the whole protocol just because a new assistant turn began.

### Desync Suspicion

Treat the workspace as potentially desynced when one of these is true:

- a human may have changed code, docs, or `.opendaas`
- you are about to update `.opendaas`
- the plan, next action, or blocker picture feels uncertain
- you are preparing a handoff, version, or decision boundary
- the local docs-site view may no longer match the control plane

## Cold Round Start

Only cold rounds require the full round-start sequence.

Run, in order:

```bash
opendaas site open
opendaas status show
```

Then apply this rule:

- if `status show` already gives you the goal, phase, next actions, and blockers, start work
- inspect more files only if something is still unclear
- if a human may have changed files, inspect the touched workspace surface directly before continuing

If a human does not currently need the docs site, stop it explicitly:

```bash
opendaas site stop
```

## Warm Continuation

In a warm continuation:

- continue directly on the current task
- do not rerun `site open` or `status show` by default
- do not re-read `.opendaas` or `docs` just to satisfy ritual
- only re-sync when a real trigger appears

This is the main token-saving rule. OpenDaaS should reduce uncertainty, not create mechanical repetition.

## Re-Sync Triggers

Use the smallest re-sync that closes the uncertainty.

Run `opendaas status show` when:

- the current goal is unclear
- the current phase is unclear
- the next actions are unclear
- blockers may have changed
- you need to refresh your control-plane picture before editing `.opendaas`

Run `opendaas site open` when:

- you or the human need the docs-site or Console view
- you want to verify the projected docs/runtime state visually

Inspect touched files directly when:

- a human may have edited the repository
- you suspect local authored docs or code changed outside the control plane
- you need exact file-level change context

Do not promote these actions into mandatory every-turn overhead.

## Inspect Only If Needed

After `status show`, inspect the smallest surface that answers the remaining question.

Read `.opendaas/project/overview.yaml` only if:

- the project identity or summary is still unclear

Read `.opendaas/goals/end.yaml` only if:

- the long-lived end goal is unclear or may have changed

Read `.opendaas/plans/current.yaml` and `.opendaas/tasks/current.yaml` only if:

- the execution tree is unclear
- the next task boundary is unclear
- you need exact plan/task ids or parent relationships

Read the authored overview, goal, or internal docs only if:

- you need background
- you need constraints
- you need explanation
- you need handoff context

In repositories following the recommended docs package profile, this usually means:

- `docs/shared/overview.md`
- `docs/shared/goal.md`
- files under `docs/internal/`

Do not read both `.opendaas` state and authored docs for the same question unless there is a mismatch you are actively resolving.

## Non-Negotiable Write Rules

Treat `docs/` and `.opendaas/` as two separate surfaces with different purposes.

Write to `docs/` when changing:

- background
- constraints
- explanation
- handoff

Write to `.opendaas/` when changing:

- project overview
- end goal
- plans
- tasks
- decisions
- version records
- docs-site workspace config

Use the Console only as a view and editing surface over `.opendaas`. It is not a second truth source.

## Recommended Docs Package Profile

OpenDaaS recommends a minimal authored docs profile for general projects:

```text
docs/
  shared/
    overview.md
    goal.md
  public/
  internal/
```

Treat it as a best-practice reference, not a mandatory directory contract.

Use:

- `docs/shared/overview.md` for what the project is
- `docs/shared/goal.md` for where the project is trying to go
- `docs/public/` for external-facing authored docs
- `docs/internal/` for maintainer-facing authored docs

Important boundary:

- this profile is the official recommended docs package shape
- it is the current CLI scaffold default
- existing repositories do not need to be force-migrated just to satisfy the recommendation

## Refresh The Workspace First

When the plan changes, refresh the workspace before continuing implementation.

This means:

1. Update `.opendaas` immediately.
2. Make the next plan/task state explicit.
3. Re-read the derived status view when you need confirmation.
4. Re-open the docs site only if a human needs the refreshed projection.

Do not let code move ahead of the control plane. Humans should always be able to open the site and see what happens next.

## CLI Versus Direct Workspace Edits

Both are valid. Use each where it is strongest.

Use direct `.opendaas/` edits as the best practice when:

- you need to update multiple structured fields quickly
- you are refining plans and tasks in bulk
- you already understand the workspace schema

Use CLI as the best practice when:

- initializing a workspace in a new or existing repository
- validating and repairing the workspace
- starting, building, or cleaning the docs site
- making small targeted control-plane mutations
- discovering command arguments and examples through help

Important rules:

- `.opendaas` should persist explicit facts, not derived execution caches
- progress and plan execution status are derived at read time from the current task tree
- CLI mutations do not require a manual sync step to make derived views correct
- direct edits to `.opendaas/` are reflected automatically in `opendaas status show`, `opendaas plan show`, and the docs-site snapshot
- there is no manual sync ritual in the normal operating loop
- do not treat CLI as the only valid way to edit the control plane

## Command Discovery Protocol

When you do not fully understand a command, inspect help before acting.

Use:

```bash
opendaas --help
opendaas <group> --help
```

Examples:

```bash
opendaas project --help
opendaas plan --help
opendaas task --help
opendaas site --help
```

Treat help output as the authoritative quick reference for arguments, examples, and returned fields.

Default CLI output is Markdown for development agents. Add `--json` only when you explicitly need raw structured output for scripting or inspection.

## Bring A Workspace Under Control

Use `opendaas init` for both cases:

- empty directory: create a new OpenDaaS workspace
- existing repository: attach the OpenDaaS control plane safely

Bootstrap defaults to the current directory when `--target-path` is omitted.

Project overview and end goal can be provisional during bootstrap. If the project shape is still unclear, initialize first, then refine the anchors later with `opendaas project set` and `opendaas goal set`.

When `init` targets an existing repository, it must stay non-invasive:

- it can create missing OpenDaaS-managed anchors
- it must not rewrite existing authored docs at the same path
- it must not reshape the existing project just to match the recommended docs package

Examples:

```bash
opendaas init
opendaas init --project-name Example --project-summary "CLI-first project context control plane for Example." --end-goal-name "Ship Example" --end-goal-summary "Turn Example into a stable product with a clear delivery loop."
opendaas init --project-name Existing --project-summary "Existing repository brought under OpenDaaS control." --end-goal-name "Stabilize Existing Repo" --end-goal-summary "Bring the existing repository under a reliable OpenDaaS control plane."
```

Immediately after `init`, run:

```bash
opendaas site open
opendaas status show
```

Use `opendaas validate --repair` only when:

- the workspace looks incomplete or damaged
- managed files are missing
- schema/config metadata is stale
- you need to rehydrate the current managed files and config surface

## Set The Core Anchors

The project overview answers:

- what this project is
- why it exists
- which overview document is the canonical authored entry

Use:

```bash
opendaas project set --name OpenDaaS --summary "CLI-first project context control plane for development agents." --doc-path shared/overview.md
opendaas project show
```

The end goal is stable and project-wide. Do not use it for the current iteration title.

If bootstrap used a provisional goal anchor, replace it as soon as the long-lived outcome becomes clear.

Use:

```bash
opendaas goal set --name "Make OpenDaaS durable" --description "Turn OpenDaaS into a stable project context control plane for development agents and the humans directing them."
opendaas goal show
```

If the goal changes materially, record a decision before or alongside the change.

## Build Plans And Tasks

Use plans for current execution streams. Use tasks for concrete work items.

Examples:

```bash
opendaas plan add --name "Ship onboarding" --parent root --summary "Turn the first-hour onboarding path into a reliable default flow."
opendaas task add --name "Add workflow guide command" --parent root --plan ship-onboarding-1 --summary "Expose the canonical workflow guide through the CLI."
```

Important command rules:

- `plan add` and `task add` return ids
- `--parent root` is the explicit top-level marker for CLI tree mutations
- every plan must have a summary
- every task must have a summary
- the current focus comes from top-level plans plus the task tree
- do not reintroduce an `active goal` layer

Common follow-up mutations:

```bash
opendaas task update --id add-workflow-guide-command-1 --status in_progress
opendaas task update --id add-workflow-guide-command-1 --status done
opendaas plan delete --id old-plan-1
opendaas task delete --id obsolete-task-1
```

## Docs-Site Workspace Config

The docs site is a default collaboration surface, so keep its configuration in the workspace.

The persisted config lives in:

```text
.opendaas/config/workspace.yaml
```

Relevant fields:

```yaml
docsSite:
  enabled: true
  sourcePath: docs
  preferredPort: 4310
```

Rules:

- `sourcePath` is workspace-relative
- `preferredPort` is the preferred local port for `opendaas site open`
- when `site open` runs without `--path`, it uses this persisted configuration

## First-Hour Loop

The first-hour loop is a cold-start loop. It is not the right default for warm continuation.

1. Initialize the workspace.
2. Start the docs site with `opendaas site open`.
3. Run `opendaas validate`.
4. If validation exposes repairable issues, run `opendaas validate --repair`.
5. Read the current anchors with:

```bash
opendaas project show
opendaas goal show
opendaas plan show
opendaas task list
opendaas status show
```

6. Make the current work explicit in `.opendaas` before touching code.
7. Complete one small loop, then re-check the derived view:

```bash
opendaas status show
```

If you cannot explain the project overview, end goal, current plans, current tasks, and current docs-site URL, you are not ready to implement.

## Decision Triggers

Record a formal decision when one of these changes:

- end goal
- scope
- high-cost change direction
- architecture
- breaking-change policy
- versioning policy

Do not force a decision record for ordinary in-scope implementation, low-risk refactors, or routine fixes.

## Validation And Runtime

Use these guardrails regularly:

```bash
opendaas site open
opendaas site stop
opendaas site build
opendaas site clean
```

`site open` is the default hot-reloading local collaboration surface. `site stop` stops the local runtime without purging it. `site build` is the production build check. `site clean` removes the staged runtime and is the heavy reset path.

`validate --repair` is a repair command, not a mandatory every-round command. Use it when the workspace or managed files need recovery.

## Success Criteria For A Correct Agent Loop

A correct Agent loop means all of the following are true:

1. The Agent can tell whether it is in a cold round, warm continuation, or desync suspicion state.
2. The Agent spends tokens only on the smallest synchronization action that closes the uncertainty.
3. The docs site is reachable when needed, not reopened by ritual.
4. The project overview is explicit.
5. The long-lived end goal is explicit.
6. The current plans and tasks are explicit when needed.
7. One small task can move without losing context.
8. The workspace can be validated and handed back without undocumented assumptions.
