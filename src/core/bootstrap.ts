import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { parse, stringify } from "yaml";

import { inspectGuidanceArtifacts, syncGuidanceArtifacts } from "./guidance.js";
import { writeText, writeYamlFile } from "./storage.js";
import { normalizeWorkspaceConfig } from "./workspace-config.js";
import type {
  GoalState,
  ProjectOverviewState,
  PlansState,
  DecisionState,
  VersionState,
  TaskArchiveState,
  TasksState,
  WorkspaceConfigState,
  WorkspaceMetaState,
  WorkspaceState
} from "./types.js";
import { withWorkspaceRoot } from "./workspace.js";

type ProjectKind = "general" | "frontend" | "library" | "service";
type DocsMode = "minimal" | "standard";

export const WORKSPACE_SCHEMA_VERSION = 8;
export const WORKSPACE_TEMPLATE_VERSION = "2026-04-21.agent-first-derived-state-1";

interface BootstrapInput {
  targetPath?: string;
  projectName?: string;
  projectSummary?: string;
  endGoalName?: string;
  endGoalSummary?: string;
  projectKind?: ProjectKind;
  docsMode?: DocsMode;
  force?: boolean;
  preserveExistingDocs?: boolean;
}

interface BootstrapResult {
  mode: "init";
  root: string;
  docsRoot: string;
  workspaceRoot: string;
  activeChangeId: string;
  createdFiles: string[];
  updatedFiles: string[];
  skippedFiles: string[];
}

interface ManagedDocFile {
  relativePath: string;
  name: string;
  description: string;
  title: string;
  bodyPrefix?: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
}

interface ManagedTextFile {
  relativePath: string;
  content: string;
}

interface ManagedWorkspaceFile {
  relativePath: string;
  value: unknown;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function isoNow(): string {
  return new Date().toISOString();
}

async function ensureDirectory(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function listDirEntries(dirPath: string): Promise<string[]> {
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

async function resolveInitStrategy(root: string): Promise<"new" | "existing"> {
  const entries = await listDirEntries(root);

  if (entries.length === 0) {
    return "new";
  }

  const isExistingWorkspace = entries.includes(".opendaas") && entries.includes("docs");
  if (isExistingWorkspace) {
    return "existing";
  }

  return "existing";
}

function buildEndGoal(
  projectName: string,
  input: Pick<BootstrapInput, "endGoalName" | "endGoalSummary">
): GoalState {
  const hasExplicitGoal = Boolean(input.endGoalName?.trim() && input.endGoalSummary?.trim());
  const name = input.endGoalName?.trim() || "Unspecified end goal";
  const summary =
    input.endGoalSummary?.trim() ||
    `${projectName} has not defined a long-lived end goal yet. Use \`opendaas goal set\` when the target outcome becomes clear.`;

  return {
    goalId: `end-goal-${slugify(name) || "project"}`,
    name,
    summary,
    successCriteria: hasExplicitGoal
      ? [
          `${projectName} exposes a stable project overview, end goal, plans, tasks, decisions, and version records as structured control-plane data`,
          `${projectName} keeps shared docs, control-plane state, and local docs-site views aligned for human developers and development agents`,
          `${projectName} supports a repeatable loop from project understanding to planning, implementation, validation, and version recording`
        ]
      : [
          `Define the long-lived end goal for ${projectName}.`,
          `Turn the current workspace into an explicit plan and task tree once the destination is clear.`,
          `${projectName} keeps shared docs and structured workspace state aligned while the project shape is still being discovered.`
        ],
    nonGoals: [
      "public hosted docs platform",
      "full SaaS control plane",
      "multi-agent orchestration",
      "cloud sync"
    ]
  };
}

function buildProjectOverview(projectName: string, projectSummary?: string): ProjectOverviewState {
  return {
    name: projectName,
    summary:
      projectSummary?.trim() ||
      `${projectName} has not defined a project overview yet. Use \`opendaas project set\` when the project identity, scope, and narrative are clear enough to anchor explicitly.`,
    docPath: "shared/overview.md"
  };
}

function buildPlans(endGoal: GoalState): PlansState {
  return {
    endGoalRef: endGoal.goalId,
    items: [
      {
        id: "establish-shared-project-context-1",
        name: "Establish shared project context",
        summary: "Anchor the project overview, end goal, and authored docs before execution begins.",
        parentPlanId: null
      },
      {
        id: "translate-end-goal-into-plan-streams-1",
        name: "Translate the end goal into plan streams",
        summary: "Break the long-lived end goal into explicit execution streams and task structure.",
        parentPlanId: null
      },
      {
        id: "deliver-and-validate-first-slice-1",
        name: "Deliver and validate first slice",
        summary: "Ship the first concrete slice and verify the project context control plane stays coherent.",
        parentPlanId: null
      }
    ]
  };
}

function buildTasks(): TasksState {
  return {
    items: [
      {
        id: "task-project-context",
        name: "Establish shared project context",
        summary: "Create the initial shared-reality anchor for the workspace.",
        status: "pending",
        planRef: "establish-shared-project-context-1",
        parentTaskId: null,
        countedForProgress: false
      },
      {
        id: "task-project-context-1",
        name: "Confirm project scope and constraints",
        summary: "Capture the immediate scope, boundaries, and non-goals for the current round.",
        status: "pending",
        planRef: "establish-shared-project-context-1",
        parentTaskId: "task-project-context",
        countedForProgress: true
      },
      {
        id: "task-breakdown",
        name: "Translate the end goal into plan streams",
        summary: "Translate the long-lived end goal into executable plans and tasks.",
        status: "pending",
        planRef: "translate-end-goal-into-plan-streams-1",
        parentTaskId: null,
        countedForProgress: false
      },
      {
        id: "task-breakdown-1",
        name: "Refine the plan tree and active change",
        summary: "Refine the active plan tree so the next implementation slice is explicit.",
        status: "pending",
        planRef: "translate-end-goal-into-plan-streams-1",
        parentTaskId: "task-breakdown",
        countedForProgress: true
      },
      {
        id: "task-delivery",
        name: "Deliver and validate first slice",
        summary: "Implement the first meaningful slice and validate the workspace around it.",
        status: "pending",
        planRef: "deliver-and-validate-first-slice-1",
        parentTaskId: null,
        countedForProgress: false
      },
      {
        id: "task-delivery-1",
        name: "Implement and validate the first concrete slice",
        summary: "Deliver the first slice and verify the expected control-plane behavior.",
        status: "pending",
        planRef: "deliver-and-validate-first-slice-1",
        parentTaskId: "task-delivery",
        countedForProgress: true
      }
    ]
  };
}

function buildActiveState(activeChangeId: string): WorkspaceState {
  return {
    activeChange: activeChangeId,
    currentRoundId: `round-${isoNow().slice(0, 10)}-01`
  };
}

function buildWorkspaceFiles(
  mode: "init",
  activeChangeId: string,
  endGoal: GoalState,
  projectName: string,
  projectSummary: string | undefined,
  projectKind: ProjectKind,
  docsMode: DocsMode
): ManagedWorkspaceFile[] {
  const createdAt = isoNow();
  const projectOverview = buildProjectOverview(projectName, projectSummary);
  const initialDecisionState: DecisionState = {
    items: []
  };
  const initialVersionState: VersionState = {
    items: []
  };
  const initialTaskArchiveState: TaskArchiveState = {
    items: []
  };
  const meta: WorkspaceMetaState = {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    workspaceName: slugify(projectName) || "opendaas-project",
    docsRoot: "docs",
    workspaceRoot: ".opendaas",
    bootstrapMode: mode,
    templateVersion: WORKSPACE_TEMPLATE_VERSION,
    projectKind,
    docsMode,
    createdAt,
    lastUpgradedAt: null
  };
  const config: WorkspaceConfigState = {
    ...normalizeWorkspaceConfig(null, {
      projectKind,
      docsMode,
      workspaceSchemaVersion: WORKSPACE_SCHEMA_VERSION
    }),
    workspaceSchemaVersion: WORKSPACE_SCHEMA_VERSION
  };
  return [
    {
      relativePath: ".opendaas/meta/workspace.yaml",
      value: meta
    },
    {
      relativePath: ".opendaas/config/workspace.yaml",
      value: config
    },
    {
      relativePath: ".opendaas/state/active.yaml",
      value: buildActiveState(activeChangeId)
    },
    {
      relativePath: ".opendaas/goals/end.yaml",
      value: endGoal
    },
    {
      relativePath: ".opendaas/project/overview.yaml",
      value: projectOverview
    },
    {
      relativePath: ".opendaas/plans/current.yaml",
      value: buildPlans(endGoal)
    },
    {
      relativePath: ".opendaas/tasks/current.yaml",
      value: buildTasks()
    },
    {
      relativePath: ".opendaas/tasks/archive.yaml",
      value: initialTaskArchiveState
    },
    {
      relativePath: ".opendaas/decisions/records.yaml",
      value: initialDecisionState
    },
    {
      relativePath: ".opendaas/versions/records.yaml",
      value: initialVersionState
    }
  ];
}

function renderDocTemplate(file: ManagedDocFile): string {
  const sections = file.sections
    .map((section) => `## ${section.heading}\n\n${section.body.trim()}\n`)
    .join("\n");

  const prefix = file.bodyPrefix ? `${file.bodyPrefix.trim()}\n\n` : "";
  return `---\nname: ${file.name}\ndescription: ${file.description}\n---\n\n# ${file.title}\n\n${prefix}${sections}`.trimEnd() + "\n";
}

function buildDocsFiles(
  projectName: string,
  projectSummary: string | undefined,
  endGoal: GoalState,
  options: {
    hasExplicitProjectSummary: boolean;
    hasExplicitEndGoal: boolean;
  }
): ManagedDocFile[] {
  return [
    {
      relativePath: "docs/shared/overview.md",
      name: "Project Overview",
      description: "Shared project overview anchor.",
      title: "Project Overview",
      sections: [
        {
          heading: "项目摘要",
          body: options.hasExplicitProjectSummary ? (projectSummary?.trim() ?? "") : ""
        },
        {
          heading: "项目介绍、最终目标与当前计划",
          body: ""
        }
      ]
    },
    {
      relativePath: "docs/shared/goal.md",
      name: "Project Goal",
      description: "Shared project goal anchor.",
      title: "Project Goal",
      sections: [
        {
          heading: "最终目标",
          body: options.hasExplicitEndGoal ? `${endGoal.name}\n\n${endGoal.summary}` : ""
        },
        {
          heading: "背景与理由",
          body: ""
        },
        {
          heading: "完成标准",
          body: ""
        },
        {
          heading: "明确不做什么",
          body: ""
        },
        {
          heading: "当前进度摘要",
          body: ""
        }
      ]
    }
  ];
}

function buildDocsTextFiles(): ManagedTextFile[] {
  return [
    {
      relativePath: "docs/public/.gitkeep",
      content: ""
    },
    {
      relativePath: "docs/internal/.gitkeep",
      content: ""
    }
  ];
}

function parseFrontmatter(text: string): { frontmatter: Record<string, string>; body: string } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: text };
  }

  const frontmatter = parse(match[1]) as Record<string, string>;
  return { frontmatter, body: match[2] ?? "" };
}

function ensureFrontmatterValues(frontmatter: Record<string, string>, updates: Record<string, string>) {
  for (const [key, value] of Object.entries(updates)) {
    frontmatter[key] = value;
  }
}

function ensureSection(body: string, heading: string, sectionBody: string): string {
  const normalized = body.trim();
  const marker = `## ${heading}`;
  if (normalized.includes(marker)) {
    return `${normalized}\n`;
  }

  const suffix = normalized ? "\n\n" : "";
  return `${normalized}${suffix}${marker}\n\n${sectionBody.trim()}\n`;
}

async function upsertManagedDoc(
  root: string,
  file: ManagedDocFile,
  force: boolean,
  allowMergeExisting: boolean,
  result: BootstrapResult
): Promise<void> {
  const target = path.join(root, file.relativePath);
  const rendered = renderDocTemplate(file);
  const existed = existsSync(target);

  if (existed && !allowMergeExisting) {
    result.skippedFiles.push(file.relativePath);
    return;
  }

  if (!existed || force) {
    await writeText(target, rendered);
    result[existed ? "updatedFiles" : "createdFiles"].push(file.relativePath);
    return;
  }

  const current = await fs.readFile(target, "utf8");
  const parsed = parseFrontmatter(current);
  ensureFrontmatterValues(parsed.frontmatter, {
    name: file.name,
    description: file.description
  });

  let body = parsed.body.trim();
  if (!body.startsWith("# ")) {
    body = `# ${file.title}\n\n${body}`.trim();
  }

  if (file.bodyPrefix && !body.includes(file.bodyPrefix)) {
    const bodyPrefix = file.bodyPrefix;
    if (body.startsWith("# ")) {
      body = body.replace(/^# .+?\n\n/, (headingBlock) => `${headingBlock}${bodyPrefix.trim()}\n\n`);
    } else {
      body = `${bodyPrefix.trim()}\n\n${body}`.trim();
    }
  }

  for (const section of file.sections) {
    body = ensureSection(body, section.heading, section.body);
  }

  const next = `---\n${stringify(parsed.frontmatter, { indent: 2, lineWidth: 0 }).trim()}\n---\n\n${body.trimEnd()}\n`;

  if (next === current) {
    result.skippedFiles.push(file.relativePath);
    return;
  }

  await writeText(target, next);
  result.updatedFiles.push(file.relativePath);
}

async function writeManagedTextFile(
  root: string,
  file: ManagedTextFile,
  force: boolean,
  overwriteExisting: boolean,
  result: BootstrapResult
): Promise<void> {
  const target = path.join(root, file.relativePath);
  const existed = existsSync(target);

  if (existed && !overwriteExisting) {
    result.skippedFiles.push(file.relativePath);
    return;
  }

  if (existed && !force) {
    result.skippedFiles.push(file.relativePath);
    return;
  }

  await writeText(target, file.content);
  result[existed ? "updatedFiles" : "createdFiles"].push(file.relativePath);
}

async function writeManagedWorkspaceFile(
  root: string,
  file: ManagedWorkspaceFile,
  force: boolean,
  result: BootstrapResult
): Promise<void> {
  const target = path.join(root, file.relativePath);
  const existed = existsSync(target);

  if (existed && !force) {
    result.skippedFiles.push(file.relativePath);
    return;
  }

  await writeYamlFile(target, file.value);
  result[existed ? "updatedFiles" : "createdFiles"].push(file.relativePath);
}

async function bootstrapWorkspace(input: BootstrapInput): Promise<BootstrapResult> {
  const root = path.resolve(input.targetPath ?? process.cwd());
  const projectName = input.projectName?.trim() || path.basename(root);
  const projectSummary = input.projectSummary?.trim() || undefined;
  const endGoal = buildEndGoal(projectName, {
    endGoalName: input.endGoalName,
    endGoalSummary: input.endGoalSummary
  });
  const activeChangeId = `bootstrap-${slugify(projectName) || "project"}`;
  const force = Boolean(input.force);
  const preserveExistingDocs = Boolean(input.preserveExistingDocs);
  const projectKind = input.projectKind ?? "general";
  const docsMode = input.docsMode ?? "standard";
  const hasExplicitProjectSummary = Boolean(input.projectSummary?.trim());
  const hasExplicitEndGoal = Boolean(input.endGoalName?.trim() && input.endGoalSummary?.trim());

  await ensureDirectory(root);
  const initStrategy = await resolveInitStrategy(root);
  const mode = "init";

  const result: BootstrapResult = {
    mode,
    root,
    docsRoot: path.join(root, "docs"),
    workspaceRoot: path.join(root, ".opendaas"),
    activeChangeId,
    createdFiles: [],
    updatedFiles: [],
    skippedFiles: []
  };

  for (const file of buildWorkspaceFiles(mode, activeChangeId, endGoal, projectName, projectSummary, projectKind, docsMode)) {
    await writeManagedWorkspaceFile(root, file, force, result);
  }

  const allowMergeExistingDocs = false;

  for (const doc of buildDocsFiles(projectName, projectSummary, endGoal, {
    hasExplicitProjectSummary,
    hasExplicitEndGoal
  })) {
    if (preserveExistingDocs && existsSync(path.join(root, doc.relativePath))) {
      result.skippedFiles.push(doc.relativePath);
      continue;
    }
    await upsertManagedDoc(root, doc, force, allowMergeExistingDocs, result);
  }

  for (const file of buildDocsTextFiles()) {
    await writeManagedTextFile(root, file, force, initStrategy === "new", result);
  }

  await withWorkspaceRoot(root, async () => {
    const beforeGuidanceArtifacts = await inspectGuidanceArtifacts(root);
    await syncGuidanceArtifacts(root);

    const managedGuidanceFiles = [
      {
        relativePath: "AGENTS.md",
        existed: beforeGuidanceArtifacts.agentsMdExists
      },
      {
        relativePath: ".agents/skills/opendaas-workflow/SKILL.md",
        existed: beforeGuidanceArtifacts.workflowSkillExists
      }
    ];

    for (const file of managedGuidanceFiles) {
      result[file.existed ? "updatedFiles" : "createdFiles"].push(file.relativePath);
    }
  });

  return result;
}

export async function initWorkspace(input: BootstrapInput): Promise<BootstrapResult> {
  return bootstrapWorkspace(input);
}
