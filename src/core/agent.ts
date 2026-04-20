import path from "node:path";
import { existsSync } from "node:fs";

import { writeText } from "./storage.js";
import { getStatusSnapshot } from "./status.js";
import { getWorkspacePaths } from "./workspace.js";
import { loadWorkflowGuide } from "./workflow-guide.js";

function agentSkillPath(root = process.cwd()): string {
  return path.join(getWorkspacePaths(root).workspaceRoot, "agent", "SKILL.md");
}

function workflowSkillPath(root = process.cwd()): string {
  return path.join(getWorkspacePaths(root).root, ".agents", "skills", "opendaas-workflow", "SKILL.md");
}

function agentsMdPath(root = process.cwd()): string {
  return path.join(getWorkspacePaths(root).root, "AGENTS.md");
}

function agentDocsPath(root = process.cwd()): string {
  return path.join(getWorkspacePaths(root).docsRoot, "engineering", "agent.md");
}

function renderAgentsMd(): string {
 return `# AGENTS.md

Use OpenDaaS in this repository.

Mandatory:

1. Run \`opendaas guide\` for the OpenDaaS Workflow Guide.
2. Read \`.agents/skills/opendaas-workflow/SKILL.md\`. It is identical to \`opendaas guide\`.
3. If this is a cold round or the workspace may be desynced, run \`opendaas site open\`, then \`opendaas status show\`.
4. If context is still warm and no external change is suspected, continue without rerunning the full round-start sequence.
5. When plans change, refresh the workspace before resuming code work.
6. Treat \`docs/\` as authored context and \`.opendaas/\` as the structured control plane.
`;
}

export async function inspectAgentArtifacts(root = process.cwd()) {
  return {
    skillPath: agentSkillPath(root),
    workflowSkillPath: workflowSkillPath(root),
    agentsMdPath: agentsMdPath(root),
    docsPath: agentDocsPath(root),
    skillExists: existsSync(agentSkillPath(root)),
    workflowSkillExists: existsSync(workflowSkillPath(root)),
    agentsMdExists: existsSync(agentsMdPath(root)),
    docsExists: existsSync(agentDocsPath(root))
  };
}

export async function syncAgentArtifacts(root = process.cwd()) {
  const status = await getStatusSnapshot();
  const guide = await loadWorkflowGuide();
  const skillContent = guide.markdown;
  const workflowSkillContent = guide.markdown;
  const agentsContent = renderAgentsMd();

  const skillPath = agentSkillPath(root);
  const workflowPath = workflowSkillPath(root);
  const agentsPath = agentsMdPath(root);

  await writeText(skillPath, skillContent);
  await writeText(workflowPath, workflowSkillContent);
  await writeText(agentsPath, agentsContent);

  return {
    endGoalName: status.endGoal.name,
    endGoalSummary: status.endGoal.summary,
    phase: status.phase,
    progress: status.progress.percent,
    activeChange: null,
    skillPath,
    workflowSkillPath: workflowPath,
    agentsMdPath: agentsPath,
    docsPath: agentDocsPath(root)
  };
}
