---
name: OpenDaaS Goal
description: Shared statement of the long-term outcome OpenDaaS is trying to reach.
---

# OpenDaaS Goal

## Long-Term Goal

Ship OpenDaaS as a stable public framework for agent-first project context control.

That means external developers should be able to adopt OpenDaaS in a real repository, understand the model quickly, and operate it without inheriting hidden assumptions from this repository's internal history.

## Success Criteria

OpenDaaS is successful when all of the following are true:

- the workspace model is neutral and does not depend on a specific docs package layout
- the CLI and docs site behave correctly from explicit control-plane references
- `init` is safe for both new and existing repositories
- public documentation is complete enough for external developers to use the framework without reading internal maintainer notes
- internal maintainer guidance is clearly separated from public usage docs
- the repository can dogfood OpenDaaS without carrying legacy coupling or stale control-plane semantics

## Non-Goals

OpenDaaS is not trying to become:

- a hosted documentation product
- a cloud-synced control plane
- a general project management suite
- an issue tracker replacement
- an opaque agent runtime

## Current Focus

The current focus is to re-integrate the OpenDaaS repository itself from a clean starting point and prove the public-facing usage model with a formal docs package, a clean workspace, and a working docs-site projection.
