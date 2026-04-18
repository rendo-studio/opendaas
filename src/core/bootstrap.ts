import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { parse, stringify } from "yaml";

import { diffAck } from "./diff.js";
import { recordAgentDocWrite } from "./doc-sources.js";
import { syncAgentArtifacts } from "./agent.js";
import { syncStatusDocs } from "./status.js";
import { writeText, writeYamlFile } from "./storage.js";
import type {
  GoalState,
  PlansState,
  ProgressState,
  DecisionState,
  ReleaseState,
  TaskArchiveState,
  TasksState,
  WorkspaceConfigState,
  WorkspaceMetaState,
  WorkspaceState
} from "./types.js";
import { withWorkspaceRoot } from "./workspace.js";

type ProjectKind = "general" | "frontend" | "library" | "service";
type DocsMode = "minimal" | "standard";

export const WORKSPACE_SCHEMA_VERSION = 4;
export const WORKSPACE_TEMPLATE_VERSION = "2026-04-18.live-site-runtime-1";

interface BootstrapInput {
  targetPath: string;
  projectName?: string;
  goalName: string;
  goalSummary: string;
  projectKind?: ProjectKind;
  docsMode?: DocsMode;
  force?: boolean;
}

interface BootstrapResult {
  mode: "init" | "adopt";
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

async function assertInitTargetIsSafe(root: string): Promise<void> {
  const entries = await listDirEntries(root);

  if (entries.length === 0) {
    return;
  }

  const isExistingWorkspace = entries.includes(".opendaas") && entries.includes("docs");
  if (isExistingWorkspace) {
    return;
  }

  throw new Error(
    `init only supports an empty directory or an existing OpenDaaS workspace. Use adopt for an existing project: ${root}`
  );
}

async function assertAdoptTargetExists(root: string): Promise<void> {
  const stats = await fs.stat(root).catch(() => null);
  if (!stats?.isDirectory()) {
    throw new Error(`adopt requires an existing target directory: ${root}`);
  }
}

function buildGoal(input: Required<Pick<BootstrapInput, "goalName" | "goalSummary">>): GoalState {
  return {
    goalId: `goal-${slugify(input.goalName) || "project"}`,
    name: input.goalName,
    summary: input.goalSummary,
    successCriteria: [
      "project workspace is initialized with docs and .opendaas anchors",
      "goal, plan, task, progress, and diff state exist as structured files",
      "shared docs can be rendered and inspected through OpenDaaS"
    ],
    nonGoals: [
      "public hosted docs platform",
      "multi-agent orchestration",
      "cloud sync and SaaS control plane"
    ]
  };
}

function buildPlans(goal: GoalState): PlansState {
  return {
    goalRef: goal.goalId,
    items: [
      {
        id: "establish-shared-project-reality-1",
        name: "Establish shared project reality",
        status: "pending",
        parentPlanId: null
      },
      {
        id: "break-down-executable-work-1",
        name: "Break down executable work",
        status: "pending",
        parentPlanId: null
      },
      {
        id: "deliver-and-validate-first-slice-1",
        name: "Deliver and validate first slice",
        status: "pending",
        parentPlanId: null
      }
    ]
  };
}

function buildTasks(): TasksState {
  return {
    items: [
      {
        id: "task-project-reality",
        name: "Establish shared project reality",
        status: "pending",
        planRef: "establish-shared-project-reality-1",
        parentTaskId: null,
        countedForProgress: false
      },
      {
        id: "task-project-reality-1",
        name: "Confirm project scope and constraints",
        status: "pending",
        planRef: "establish-shared-project-reality-1",
        parentTaskId: "task-project-reality",
        countedForProgress: true
      },
      {
        id: "task-breakdown",
        name: "Break down executable work",
        status: "pending",
        planRef: "break-down-executable-work-1",
        parentTaskId: null,
        countedForProgress: false
      },
      {
        id: "task-breakdown-1",
        name: "Refine the plan tree and active change",
        status: "pending",
        planRef: "break-down-executable-work-1",
        parentTaskId: "task-breakdown",
        countedForProgress: true
      },
      {
        id: "task-delivery",
        name: "Deliver and validate first slice",
        status: "pending",
        planRef: "deliver-and-validate-first-slice-1",
        parentTaskId: null,
        countedForProgress: false
      },
      {
        id: "task-delivery-1",
        name: "Implement and validate the first concrete slice",
        status: "pending",
        planRef: "deliver-and-validate-first-slice-1",
        parentTaskId: "task-delivery",
        countedForProgress: true
      }
    ]
  };
}

function buildProgress(): ProgressState {
  return {
    percent: 0,
    countedTasks: 3,
    doneTasks: 0,
    computedAt: isoNow()
  };
}

function buildActiveState(activeChangeId: string): WorkspaceState {
  return {
    activeChange: activeChangeId,
    currentRoundId: `round-${isoNow().slice(0, 10)}-01`,
    lastDiffCheckAt: null,
    lastDiffAckAt: null
  };
}

function buildWorkspaceFiles(
  mode: "init" | "adopt",
  activeChangeId: string,
  goal: GoalState,
  projectName: string,
  projectKind: ProjectKind,
  docsMode: DocsMode
): ManagedWorkspaceFile[] {
  const createdAt = isoNow();
  const initialDecisionState: DecisionState = {
    items: []
  };
  const initialReleaseState: ReleaseState = {
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
    requireDiffCheckBeforeTask: true,
    docsSiteEnabled: true,
    defaultDiffMode: "line",
    siteFramework: "fumadocs",
    packageManager: "npm",
    projectKind,
    docsMode,
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
      relativePath: ".opendaas/state/progress.yaml",
      value: buildProgress()
    },
    {
      relativePath: ".opendaas/goals/current.yaml",
      value: goal
    },
    {
      relativePath: ".opendaas/plans/current.yaml",
      value: buildPlans(goal)
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
      relativePath: ".opendaas/releases/records.yaml",
      value: initialReleaseState
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

function buildDocsFiles(projectName: string, goal: GoalState, activeChangeId: string): ManagedDocFile[] {
  return [
    {
      relativePath: "docs/index.md",
      name: `${projectName} 项目入口`,
      description: `${projectName} 的共享入口页，概览最终目标、当前进度与阅读路径。`,
      title: projectName,
      bodyPrefix: "OpenDaaS 通过共享文档包和内部控制面来帮助 Human-Agent 协作推进项目。",
      sections: [
        {
          heading: "一句话定义",
          body: `${projectName} 是一个采用 OpenDaaS 框架推进的项目。`
        },
        {
          heading: "最终目标",
          body: goal.summary
        },
        {
          heading: "当前进度",
          body: "当前默认进度：**0%**"
        },
        {
          heading: "边界与非目标",
          body: goal.nonGoals.map((item) => `- ${item}`).join("\n")
        },
        {
          heading: "从哪里开始",
          body: [
            "建议阅读顺序：",
            "",
            "1. [最终目标](./project/goal.md)",
            "2. [当前状态](./project/status.md)",
            "3. [当前工作](./project/current-work.md)",
            "4. [任务闭环](./project/tasks.md)",
            "5. [变化入口](./project/changes/index.md)",
            "6. [发布入口](./project/releases/index.md)",
            "7. [开发入口](./engineering/development.md)"
          ].join("\n")
        },
        {
          heading: "文档导航",
          body: [
            "### 项目现实",
            "",
            "- [最终目标](./project/goal.md)",
            "- [当前状态](./project/status.md)",
            "- [当前工作](./project/current-work.md)",
            "- [任务闭环](./project/tasks.md)",
            "- [Changes](./project/changes/index.md)",
            "- [Decisions](./project/decisions/index.md)",
            "- [Releases](./project/releases/index.md)",
            "",
            "### 开发入口",
            "",
            "- [Engineering Development](./engineering/development.md)"
          ].join("\n")
        }
      ]
    },
    {
      relativePath: "docs/project/goal.md",
      name: "Final Goal",
      description: `${projectName} 的最终目标、完成标准与非目标锚点页。`,
      title: "Final Goal",
      bodyPrefix: `${projectName} 的正式目标已经固定到共享控制面，并作为后续计划、任务与状态的最高优先级锚点。`,
      sections: [
        { heading: "最终目标", body: `${goal.name}\n\n${goal.summary}` },
        {
          heading: "背景与理由",
          body: "当前项目已经进入正式推进阶段，因此需要把最终目标固定到共享文档包中，避免后续目标漂移。"
        },
        {
          heading: "完成标准",
          body: goal.successCriteria.map((item) => `- ${item}`).join("\n")
        },
        {
          heading: "明确不做什么",
          body: goal.nonGoals.map((item) => `- ${item}`).join("\n")
        },
        { heading: "当前进度摘要", body: "当前默认进度：**0%**" }
      ]
    },
    {
      relativePath: "docs/project/status.md",
      name: "当前状态",
      description: `记录 ${projectName} 当前推进状态、主要风险与下一步动作。`,
      title: "当前状态",
      sections: [
        { heading: "状态摘要", body: `当前围绕最终目标“${goal.name}”推进，控制面与共享文档已初始化。` },
        { heading: "当前阶段", body: "当前阶段：**Next: Establish shared project reality**" },
        {
          heading: "当前进度",
          body: ["当前默认进度：**0%**", "", "计算口径：", "", "- 控制面当前纳入统计的 3 个叶子任务中，已完成 0 个"].join("\n")
        },
        { heading: "当前进展", body: "- 暂无" },
        { heading: "主要 blocker / 风险", body: "- 暂无明确 blocker" },
        { heading: "下一步动作", body: "- Confirm project scope and constraints" },
        { heading: "最近更新时间", body: isoNow() }
      ]
    },
    {
      relativePath: "docs/project/current-work.md",
      name: "当前工作",
      description: `记录 ${projectName} 当前 active work、高层焦点与当前计划。`,
      title: "当前工作",
      sections: [
        { heading: "当前 active work", body: `当前 active work：**${goal.summary}**` },
        {
          heading: "当前高层焦点",
          body: ["- Establish shared project reality", "- Break down executable work", "- Deliver and validate first slice"].join("\n")
        },
        {
          heading: "当前高层计划",
          body: [
            "- Establish shared project reality [pending]",
            "- Break down executable work [pending]",
            "- Deliver and validate first slice [pending]"
          ].join("\n")
        },
        {
          heading: "当前不做什么",
          body: goal.nonGoals.map((item) => `- ${item}`).join("\n")
        }
      ]
    },
    {
      relativePath: "docs/project/tasks.md",
      name: "任务闭环",
      description: `${projectName} 的任务清单、闭环视图与历史入口页。`,
      title: "任务闭环",
      bodyPrefix: `${projectName} 的任务状态由 .opendaas 控制面驱动，这里负责展示完整任务树、已完成闭环与历史入口。`,
      sections: [
        {
          heading: "当前任务树",
          body: "- 待同步"
        },
        {
          heading: "最近完成",
          body: "- 待同步"
        },
        {
          heading: "历史闭环",
          body: "- 待同步"
        }
      ]
    },
    {
      relativePath: "docs/project/changes/index.md",
      name: "Changes",
      description: `${projectName} 的变化可见入口，聚合当前活跃 change 与最近完成变化。`,
      title: "Changes",
      sections: [
        { heading: "变化摘要", body: `当前 ${projectName} 的核心变化主线是：**${activeChangeId}**` },
        { heading: "当前活跃 change", body: `- ${activeChangeId}` },
        { heading: "最近完成的变化", body: "- 暂无" },
        { heading: "值得关注的变化", body: "- 当前正在建立第一轮共享项目现实和执行计划。" }
      ]
    },
    {
      relativePath: "docs/project/decisions/index.md",
      name: "Decisions",
      description: `${projectName} 的重要决策索引页。`,
      title: "Decisions",
      sections: [
        { heading: "决策摘要", body: "当前还没有正式记录的重要决策。" },
        { heading: "关键决策列表", body: "- 暂无" },
        { heading: "最近新增决策", body: "- 暂无" }
      ]
    },
    {
      relativePath: "docs/project/releases/index.md",
      name: "Releases",
      description: `${projectName} 的发布与版本更新入口页。`,
      title: "Releases",
      sections: [
        { heading: "发布摘要", body: "当前还没有正式记录的 release / changelog entry。" },
        { heading: "最近版本", body: "- 暂无" },
        { heading: "重要变化", body: "- 暂无" }
      ]
    },
    {
      relativePath: "docs/engineering/development.md",
      name: "Engineering Development",
      description: `${projectName} 的开发入口、工程约束与本地推进说明。`,
      title: "Engineering Development",
      bodyPrefix: `${projectName} 当前通过 OpenDaaS 的 docs/.opendaas 双命名空间推进。`,
      sections: [
        { heading: "开发约束", body: ["- 在当前目标范围内自主推进", "- 新决策节点先做 diff check 再升级", "- 共享文档只使用 `name + description` 头部元信息"].join("\n") },
        { heading: "当前工作流", body: ["1. 先阅读最终目标与当前状态", "2. 在开始任务前运行 `opendaas diff check`", "3. 使用 `goal / plan / task / status` 维护控制面", "4. 通过 `site dev` 或 `site open` 查看文档站投影"].join("\n") }
      ]
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
  result: BootstrapResult
): Promise<void> {
  const target = path.join(root, file.relativePath);
  const rendered = renderDocTemplate(file);
  const existed = existsSync(target);

  if (!existed || force) {
    await writeText(target, rendered);
    await recordAgentDocWrite(target, rendered);
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
  await recordAgentDocWrite(target, next);
  result.updatedFiles.push(file.relativePath);
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

async function writeDiffScaffolding(root: string, force: boolean, result: BootstrapResult) {
  const entries = [
    {
      relativePath: ".opendaas/diff/baseline.json",
      content: "{}\n"
    },
    {
      relativePath: ".opendaas/diff/pending.json",
      content: `${JSON.stringify({ generatedAt: null, files: [] }, null, 2)}\n`
    },
    {
      relativePath: ".opendaas/diff/sources.json",
      content: "{}\n"
    },
    {
      relativePath: ".opendaas/diff/history.json",
      content: `${JSON.stringify({ items: [] }, null, 2)}\n`
    }
  ];

  for (const entry of entries) {
    const target = path.join(root, entry.relativePath);
    const existed = existsSync(target);

    if (existed && !force) {
      result.skippedFiles.push(entry.relativePath);
      continue;
    }

    await writeText(target, entry.content);
    result[existed ? "updatedFiles" : "createdFiles"].push(entry.relativePath);
  }
}

async function bootstrapWorkspace(mode: "init" | "adopt", input: BootstrapInput): Promise<BootstrapResult> {
  const root = path.resolve(input.targetPath);
  const projectName = input.projectName?.trim() || path.basename(root);
  const goal = buildGoal({
    goalName: input.goalName,
    goalSummary: input.goalSummary
  });
  const activeChangeId = `bootstrap-${slugify(projectName) || "project"}`;
  const force = Boolean(input.force);
  const projectKind = input.projectKind ?? "general";
  const docsMode = input.docsMode ?? "standard";

  await ensureDirectory(root);

  if (mode === "init") {
    await assertInitTargetIsSafe(root);
  } else {
    await assertAdoptTargetExists(root);
  }

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

  for (const file of buildWorkspaceFiles(mode, activeChangeId, goal, projectName, projectKind, docsMode)) {
    await writeManagedWorkspaceFile(root, file, force, result);
  }

  await writeDiffScaffolding(root, force, result);

  for (const doc of buildDocsFiles(projectName, goal, activeChangeId)) {
    await upsertManagedDoc(root, doc, force, result);
  }

  await withWorkspaceRoot(root, async () => {
    await syncStatusDocs();
    await syncAgentArtifacts();
    await diffAck();
  });

  return result;
}

export async function initWorkspace(input: BootstrapInput): Promise<BootstrapResult> {
  return bootstrapWorkspace("init", input);
}

export async function adoptWorkspace(input: BootstrapInput): Promise<BootstrapResult> {
  return bootstrapWorkspace("adopt", input);
}
