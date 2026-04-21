import path from "node:path";
import { existsSync } from "node:fs";

import { writeText } from "./storage.js";
import { loadWorkflowGuide } from "./workflow-guide.js";

function workflowSkillPath(root = process.cwd()): string {
  return path.join(root, ".agents", "skills", "opendaas-workflow", "SKILL.md");
}

function agentsMdPath(root = process.cwd()): string {
  return path.join(root, "AGENTS.md");
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

export async function inspectGuidanceArtifacts(root = process.cwd()) {
  return {
    workflowSkillPath: workflowSkillPath(root),
    agentsMdPath: agentsMdPath(root),
    workflowSkillExists: existsSync(workflowSkillPath(root)),
    agentsMdExists: existsSync(agentsMdPath(root))
  };
}

export async function syncGuidanceArtifacts(root = process.cwd()) {
  const guide = await loadWorkflowGuide();
  const workflowSkillContent = guide.markdown;
  const agentsContent = renderAgentsMd();

  const workflowPath = workflowSkillPath(root);
  const agentsPath = agentsMdPath(root);

  await writeText(workflowPath, workflowSkillContent);
  await writeText(agentsPath, agentsContent);

  return {
    workflowSkillPath: workflowPath,
    agentsMdPath: agentsPath
  };
}
