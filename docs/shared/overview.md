---
name: OpenDaaS Overview
description: Shared definition of what OpenDaaS is, what it manages, and where it fits.
---

# OpenDaaS

## What OpenDaaS Is

OpenDaaS is an agent-first project context control plane.

It gives a software project one shared operating surface for:

- authored documentation
- structured project state
- local collaboration views for humans and development agents

The goal is straightforward: remove ambiguity about what the project is, where it is going, what is being worked on now, and which decisions or versions matter.

## What OpenDaaS Manages

OpenDaaS manages two distinct surfaces.

`docs/`

- authored context for humans and development agents
- explanations, guides, constraints, and maintainership context

`.opendaas/`

- structured control-plane state
- project overview, end goal, plans, tasks, decisions, versions, and docs-site config

The framework is intentionally explicit about this split. Authored prose and structured state should not be mixed.

## What OpenDaaS Does Not Try To Be

OpenDaaS is not:

- a Git replacement
- an issue tracker
- a hosted SaaS control plane
- a multi-agent orchestration platform
- a hidden runtime that depends on background sync to stay correct

It is a local, repository-scoped framework for keeping project reality legible.

## When To Use It

Use OpenDaaS when a repository needs:

- a durable project overview and end goal
- explicit plans and tasks that humans and agents can both inspect
- authored docs that stay separate from execution state
- a local docs site that reflects the current control plane
- a repeatable operating model for agent-assisted development

## Core Operating Model

OpenDaaS works best when these rules are followed consistently:

- persist explicit facts in `.opendaas/`
- keep authored explanation in `docs/`
- derive execution views at read time instead of persisting stale computed state
- bind authored docs through explicit `docPath` fields instead of relying on fixed directory guesses
- treat the docs package shape as a recommendation, not a runtime contract
