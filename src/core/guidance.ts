import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

import { readText, writeText } from "./storage.js";
import { loadWorkflowGuide } from "./workflow-guide.js";

const OPENDAAS_AGENTS_BEGIN = "<!-- OPENDAAS:BEGIN -->";
const OPENDAAS_AGENTS_END = "<!-- OPENDAAS:END -->";

function packageRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

function workflowSkillPath(root = process.cwd()): string {
  return path.join(root, ".agents", "skills", "opendaas-workflow", "SKILL.md");
}

function agentsMdPath(root = process.cwd()): string {
  return path.join(root, "AGENTS.md");
}

export function getAgentsTemplateAssetPath(): string {
  return path.join(packageRoot(), "assets", "agents-template.md");
}

async function loadAgentsTemplate(): Promise<string> {
  return readText(getAgentsTemplateAssetPath());
}

function renderStandaloneAgentsMd(template: string): string {
  return `# AGENTS.md

${template.trim()}
`;
}

function renderWrappedAgentsSection(template: string): string {
  return `${OPENDAAS_AGENTS_BEGIN}\n${template.trim()}\n${OPENDAAS_AGENTS_END}`;
}

function mergeAgentsMd(current: string, template: string): string {
  const standalone = renderStandaloneAgentsMd(template).trim();
  const wrapped = renderWrappedAgentsSection(template);
  const normalizedCurrent = current.trim();
  if (current.trim() === standalone) {
    return `${standalone}\n`;
  }

  if (normalizedCurrent === `${standalone}\n\n${wrapped}`.trim()) {
    return `${standalone}\n`;
  }

  if (current.includes(OPENDAAS_AGENTS_BEGIN) && current.includes(OPENDAAS_AGENTS_END)) {
    const next = current.replace(
      new RegExp(`${OPENDAAS_AGENTS_BEGIN}[\\s\\S]*?${OPENDAAS_AGENTS_END}`, "m"),
      wrapped
    );
    if (next.trim() === `${standalone}\n\n${wrapped}`.trim()) {
      return `${standalone}\n`;
    }
    return next.endsWith("\n") ? next : `${next}\n`;
  }

  const trimmedCurrent = current.trimEnd();
  return `${trimmedCurrent}\n\n${wrapped}\n`;
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
  const agentsTemplate = await loadAgentsTemplate();

  const workflowPath = workflowSkillPath(root);
  const agentsPath = agentsMdPath(root);
  const agentsContent = existsSync(agentsPath)
    ? mergeAgentsMd(await readText(agentsPath), agentsTemplate)
    : renderStandaloneAgentsMd(agentsTemplate);

  await writeText(workflowPath, workflowSkillContent);
  await writeText(agentsPath, agentsContent);

  return {
    workflowSkillPath: workflowPath,
    agentsMdPath: agentsPath
  };
}
