---
name: opendaas-workspace-agent
description: Minimum OpenDaaS workspace operating guide for development agents.
---

# OpenDaaS Workspace Agent

## Purpose

Use this guide when operating inside an OpenDaaS workspace.

End goal: **OpenDaaS long-term end goal**

End goal summary: 让 OpenDaaS 成为面向 Agent 编程的项目上下文控制面最佳实践框架，提供清晰稳定的人类开发者与开发端 Agent 协作标准，以及从项目介绍、最终目标、计划、任务、决策、工作流指南到验证和发布的完整闭环。

Current phase: **Next: Ship onboarding and workflow guidance**

Current progress: **25%**

Current active change: **onboarding-and-production-readiness-iteration-1**

## Mandatory Round Start

1. Read `docs/project/goal.md` and `docs/engineering/development.md`
2. Run `opendaas diff check`
3. Inspect `.opendaas/goals/end.yaml`, `.opendaas/plans/current.yaml`, and `.opendaas/tasks/current.yaml` or run `opendaas status show`
4. Absorb pending shared-doc diffs before changing code, docs, or control-plane state
5. Re-check whether the current work is still inside the approved end goal, current plans, and active change boundary

## Write Rules

- Treat `docs/` as the shared project reality for humans and agents
- Treat `.opendaas/` as the internal control plane
- For high-frequency plan/task maintenance, prefer direct edits to `.opendaas/goals/end.yaml`, `.opendaas/plans/current.yaml`, `.opendaas/tasks/current.yaml`, and related state files when that is clearer and faster than issuing many CLI mutations
- Use CLI as the primary guardrail for initialization, adoption, validation, diff handling, site runtime, and agent artifact sync
- Treat `plan` and `task` CLI mutations as auxiliary entry points, not the only valid editing path

## Decision Trigger Rules

- Record a formal decision when proposing a new end goal, materially expanding scope, starting a new high-cost change, changing architecture, or making an irreversible high-impact decision
- Do not force a formal decision entry for ordinary in-scope implementation, UI polish, routine refactors, or low-risk optimization inside the current approved end goal

## Recommended Commands

- `opendaas validate`
- `opendaas diff check`
- `opendaas diff ack`
- `opendaas status show`
- `opendaas site dev --path <project-or-docs-path>`
- `opendaas agent sync`
