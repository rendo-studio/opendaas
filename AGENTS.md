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
