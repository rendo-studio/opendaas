import path from "node:path";
import { existsSync } from "node:fs";

import { readYamlFile, writeText } from "./storage.js";
import { getStatusSnapshot } from "./status.js";
import type { WorkspaceState } from "./types.js";
import { getWorkspacePaths } from "./workspace.js";

function agentSkillPath(root = process.cwd()): string {
  return path.join(getWorkspacePaths(root).workspaceRoot, "agent", "SKILL.md");
}

function agentDocsPath(root = process.cwd()): string {
  return path.join(getWorkspacePaths(root).docsRoot, "engineering", "agent.md");
}

function renderAgentSkill(input: {
  endGoalName: string;
  endGoalSummary: string;
  phase: string;
  progress: number;
  activeChange: string | null;
}): string {
  const activeChange = input.activeChange ?? "none";

  return `---
name: opendaas-workspace-agent
description: Minimum OpenDaaS workspace operating guide for development agents.
---

# OpenDaaS Workspace Agent

## Purpose

Use this guide when operating inside an OpenDaaS workspace.

End goal: **${input.endGoalName}**

End goal summary: ${input.endGoalSummary}

Current phase: **${input.phase}**

Current progress: **${input.progress}%**

Current active change: **${activeChange}**

## Mandatory Round Start

1. Read \`docs/project/goal.md\` and \`docs/engineering/development.md\`
2. Run \`opendaas diff check\`
3. Inspect \`.opendaas/goals/end.yaml\`, \`.opendaas/plans/current.yaml\`, and \`.opendaas/tasks/current.yaml\` or run \`opendaas status show\`
4. Absorb pending shared-doc diffs before changing code, docs, or control-plane state
5. Re-check whether the current work is still inside the approved end goal, current plans, and active change boundary

## Write Rules

- Treat \`docs/\` as the shared project reality for humans and agents
- Treat \`.opendaas/\` as the internal control plane
- For high-frequency plan/task maintenance, prefer direct edits to \`.opendaas/goals/end.yaml\`, \`.opendaas/plans/current.yaml\`, \`.opendaas/tasks/current.yaml\`, and related state files when that is clearer and faster than issuing many CLI mutations
- Use CLI as the primary guardrail for initialization, adoption, validation, diff handling, site runtime, and agent artifact sync
- Treat \`plan\` and \`task\` CLI mutations as auxiliary entry points, not the only valid editing path

## Decision Trigger Rules

- Record a formal decision when proposing a new end goal, materially expanding scope, starting a new high-cost change, changing architecture, or making an irreversible high-impact decision
- Do not force a formal decision entry for ordinary in-scope implementation, UI polish, routine refactors, or low-risk optimization inside the current approved end goal

## Recommended Commands

- \`opendaas validate\`
- \`opendaas diff check\`
- \`opendaas diff ack\`
- \`opendaas status show\`
- \`opendaas site dev --path <project-or-docs-path>\`
- \`opendaas agent sync\`
`;
}

export async function inspectAgentArtifacts(root = process.cwd()) {
  return {
    skillPath: agentSkillPath(root),
    docsPath: agentDocsPath(root),
    skillExists: existsSync(agentSkillPath(root)),
    docsExists: existsSync(agentDocsPath(root))
  };
}

export async function syncAgentArtifacts(root = process.cwd()) {
  const paths = getWorkspacePaths(root);
  const [status, activeState] = await Promise.all([
    getStatusSnapshot(),
    readYamlFile<WorkspaceState>(paths.activeStateFile)
  ]);

  const payload = {
    endGoalName: status.endGoal.name,
    endGoalSummary: status.endGoal.summary,
    phase: status.phase,
    progress: status.progress.percent,
    activeChange: activeState.activeChange
  };

  const skillContent = renderAgentSkill(payload);

  const skillPath = agentSkillPath(root);

  await writeText(skillPath, skillContent);

  return {
    ...payload,
    skillPath,
    docsPath: agentDocsPath(root)
  };
}
