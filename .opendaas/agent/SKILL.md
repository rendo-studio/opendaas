---
name: opendaas-workspace-agent
description: Minimum OpenDaaS workspace operating guide for development agents.
---

# OpenDaaS Workspace Agent

## Purpose

Use this guide when operating inside an OpenDaaS workspace.

Current goal: **OpenDaaS public release baseline**

Current phase: **Completed**

Current progress: **100%**

Current active change: **release-readiness-iteration-1**

## Mandatory Round Start

1. Read `docs/project/goal.md`, `docs/project/status.md`, and `docs/project/current-work.md`
2. Run `opendaas diff check`
3. Absorb pending shared-doc diffs before changing code, docs, or control-plane state
4. Re-check whether the current work is still inside the approved goal and current change boundary

## Write Rules

- Treat `docs/` as the shared project reality for humans and agents
- Treat `.opendaas/` as the internal control plane
- For high-frequency plan/task maintenance, prefer direct edits to `.opendaas/goals/current.yaml`, `.opendaas/plans/current.yaml`, `.opendaas/tasks/current.yaml`, and related state files when that is clearer and faster than issuing many CLI mutations
- Use CLI as the primary guardrail for initialization, adoption, validation, diff handling, docs projection, site runtime, and agent artifact sync
- Treat `plan` and `task` CLI mutations as auxiliary entry points, not the only valid editing path

## Decision Trigger Rules

- Record a formal decision when proposing a new goal, materially expanding scope, starting a new high-cost change, changing architecture, or making an irreversible high-impact decision
- Do not force a formal decision entry for ordinary in-scope implementation, UI polish, routine refactors, or low-risk optimization inside the current approved goal

## Recommended Commands

- `opendaas validate`
- `opendaas diff check`
- `opendaas diff ack`
- `opendaas status sync`
- `opendaas site dev --path <project-or-docs-path>`
- `opendaas agent sync`
