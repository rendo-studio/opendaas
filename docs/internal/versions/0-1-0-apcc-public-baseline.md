---
name: 0.1.0 APCC Public Baseline
description: Internal version note for the first APCC-named public baseline.
---

# 0.1.0 APCC Public Baseline

## Summary

This version establishes the first public APCC baseline as a clean project context framework release.

## Highlights

- establishes APCC as a CLI-first project context framework with a clean `.apcc` workspace root and public docs package
- clarifies that APCC is the framework, while the structured project context control plane is the role it gives a repository
- persists one primary docs language per workspace and scaffolds the shared docs anchors in that language

## Validation

- `npm run check`
- `npm run test`
- `npm run build`
- `npm run dev -- validate`
- `npm run dev -- site build`
