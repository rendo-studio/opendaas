---
name: 任务闭环
description: VibeCoding 的任务清单、闭环视图与历史入口页。
---

# 任务闭环

VibeCoding 的任务状态由 .opendaas 控制面驱动，这里负责展示完整任务树、已完成闭环与历史入口。

这里展示从 `.opendaas/tasks/current.yaml` 与 `.opendaas/tasks/archive.yaml` 投影出来的任务闭环信息。

## 当前任务树

- Self-hosting and control-plane foundation (task-foundation) [done]
  - Dogfood docs and .opendaas namespace boundaries (task-foundation-1) [done]
  - Ship diff and local site runtime control-plane baseline (task-foundation-2) [done]
- Workspace bootstrap and adoption (task-bootstrap) [done]
  - Implement init workspace generation (task-bootstrap-1) [done]
  - Implement adopt flow for existing projects (task-bootstrap-2) [done]
  - Add init and adopt tests plus baseline validation (task-bootstrap-3) [done]
- Agent adaptation minimum (task-agent) [done]
  - Generate minimum OpenDaaS agent adaptation artifact (task-agent-1) [done]
  - Validate first-time agent usage flow (task-agent-2) [done]
- Validation and migration hardening (task-hardening) [done]
  - Extend validate and update path for adopted workspaces (task-hardening-1) [done]
  - Implement generic decision control plane for high-value decisions (implement-decision-control-plane-for-high-valu-2) [done]
  - Implement structured release changelog control plane (implement-structured-release-changelog-control-p-3) [done]
- Data-driven project dashboard (task-dashboard) [done]
  - Implement dashboard data loaders for goal, task, plan, and progress control planes (task-dashboard-1) [done]
  - Replace markdown-only project overview sections with live dashboard cards (task-dashboard-2) [done]
  - Wire project entry routes and navigation to the live dashboard view (task-dashboard-3) [done]
- Full task closure page (task-task-loop) [done]
  - Project the current complete task tree into the docs site (task-task-loop-1) [done]
  - Define task archive and change-linked history shape for closed-loop views (task-task-loop-2) [done]
  - Render a full task closure page with current tree, recent completions, and history placeholder (task-task-loop-3) [done]
- Live docs site and editing-boundary spec (task-live-docs-spec) [done]
  - Specify site open, site dev, and site build semantics (task-live-docs-spec-1) [done]
  - Specify editable, projection, and hybrid page boundaries (task-live-docs-spec-2) [done]
  - Specify diff history and global runtime models for the live docs site (task-live-docs-spec-3) [done]
- Global site runtime and live sync refactor (task-site-runtime) [done]
  - Move site runtime out of the project root into a global workspace-scoped runtime (task-site-runtime-1) [done]
  - Implement watch-based sync for docs and core .opendaas state (task-site-runtime-2) [done]
  - Add live rebuild hooks so site dev refreshes from control-plane changes (task-site-runtime-3) [done]
- Editable docs UI and task visualization (task-editable-site) [done]
  - Add an editable site shell that honors page editability boundaries (task-editable-site-1) [done]
  - Build task visualization components for progress, tree, and history (task-editable-site-2) [done]
  - Surface a diff timeline with previous-versus-current comparison in the site UI (task-editable-site-3) [done]
- Docs information architecture cleanup (task-docs-ia) [done]
  - Split project reality and framework reference navigation clearly (task-docs-ia-1) [done]
  - Reduce root docs noise by regrouping specs and entry points (task-docs-ia-2) [done]
  - Update landing pages and internal entry points to match the cleaned IA (task-docs-ia-3) [done]

## 最近完成

- Surface a diff timeline with previous-versus-current comparison in the site UI
- Split project reality and framework reference navigation clearly
- Reduce root docs noise by regrouping specs and entry points
- Update landing pages and internal entry points to match the cleaned IA

## 历史闭环

- 暂无
