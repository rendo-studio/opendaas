## OpenDaaS

Use OpenDaaS in this repository.

Mandatory:

1. Run `opendaas guide` for the OpenDaaS Workflow Guide.
2. Read `.agents/skills/opendaas-workflow/SKILL.md`. It is identical to `opendaas guide`.
3. If this is a cold round or the workspace may be desynced, run `opendaas site open`, then `opendaas status show`.
4. If context is still warm and no external change is suspected, continue without rerunning the full round-start sequence.
5. When plans change, refresh the workspace before resuming code work.
6. If the project identity or long-lived end goal is unclear, clarify them before substantial implementation.
7. Treat `docs/` as authored context and `.opendaas/` as the structured control plane.
