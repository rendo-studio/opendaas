# AGENTS.md

## APCC

Use APCC in this repository.

Mandatory:

1. Run `apcc guide` for the APCC Workflow Guide.
2. Read `.agents/skills/apcc-workflow/SKILL.md`. It is identical to `apcc guide`.
3. If this is a cold round or the workspace may be desynced, run `apcc site open`, then `apcc status show`.
4. If context is still warm and no external change is suspected, continue without rerunning the full round-start sequence.
5. When plans change, refresh the workspace before resuming code work.
6. If the project identity or long-lived end goal is unclear, clarify them before substantial implementation.
7. Treat `docs/` as authored context and `.apcc/` as the structured control plane.
8. When initializing or reinitializing APCC, prefer setting the primary docs language to match the current human conversation unless the repository already has an established docs language.
9. When a new task, plan change, or execution boundary is confirmed, update `.apcc` first and only then start implementation work.
