---
name: 0.1.0 APCC Public Baseline
description: Internal version note for the first APCC-named public baseline.
---

# 0.1.0 APCC Public Baseline

## Summary

This version establishes APCC as the public-facing name and positioning for the framework.

## Highlights

- renamed the framework, CLI, workspace root, and docs-site surfaces from OpenDaaS to APCC
- clarified that APCC is a project context framework, while the control plane is the architectural role inside a repository
- re-integrated the repository under the new `.apcc/` workspace root
- aligned the public docs package, workflow guide, and agent-facing guidance with the new positioning

## Validation

- `npm run check`
- `npm run test`
- `npm run build`
- `npm run dev -- validate`
- `npm run dev -- site build`
