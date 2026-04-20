import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { stringify } from "yaml";

import type {
  GoalState,
  PlansState,
  ProgressState,
  ProjectOverviewState,
  TasksState,
  WorkspaceConfigState,
  WorkspaceMetaState,
  WorkspaceState
} from "../../src/core/types.js";

interface WorkspaceFixtureInput {
  project?: ProjectOverviewState;
  endGoal?: GoalState;
  plans?: PlansState;
  tasks?: TasksState;
  progress?: ProgressState;
  active?: WorkspaceState;
  config?: WorkspaceConfigState;
  meta?: WorkspaceMetaState;
}

const defaultEndGoal: GoalState = {
  goalId: "end-goal-test",
  name: "Test end goal",
  summary: "Exercise the OpenDaaS project context control plane in isolation.",
  successCriteria: ["Persist and project control-plane state."],
  nonGoals: ["External deployment."]
};

const defaultProject: ProjectOverviewState = {
  name: "Test Workspace",
  summary: "Test workspace for isolated OpenDaaS control-plane behavior.",
  docPath: "project/overview.md"
};

const defaultPlans: PlansState = {
  endGoalRef: "end-goal-test",
  items: [
    {
      id: "plan-root",
      name: "Root plan",
      summary: "Default top-level plan used by workspace fixtures.",
      status: "pending",
      parentPlanId: null
    }
  ]
};

const defaultTasks: TasksState = {
  items: []
};

const defaultProgress: ProgressState = {
  percent: 0,
  countedTasks: 0,
  doneTasks: 0,
  computedAt: null
};

const defaultActive: WorkspaceState = {
  activeChange: "test-change",
  currentRoundId: "round-test"
};

const defaultMeta: WorkspaceMetaState = {
  schemaVersion: 7,
  workspaceName: "test-workspace",
  docsRoot: "docs",
  workspaceRoot: ".opendaas",
  bootstrapMode: "adopt",
  templateVersion: "test-template",
  projectKind: "general",
  docsMode: "standard",
  createdAt: "2026-04-19T00:00:00Z",
  lastUpgradedAt: null
};

const defaultConfig: WorkspaceConfigState = {
  siteFramework: "fumadocs",
  packageManager: "npm",
  projectKind: "general",
  docsMode: "standard",
  docsSite: {
    enabled: true,
    sourcePath: "docs",
    preferredPort: null
  },
  workspaceSchemaVersion: 7
};

async function writeYaml(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    stringify(value, {
      indent: 2,
      lineWidth: 0
    }),
    "utf8"
  );
}

async function writeText(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

function doc(name: string, description: string, body: string): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n${body.trim()}\n`;
}

export async function createWorkspaceFixture(input: WorkspaceFixtureInput = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "opendaas-test-"));
  const project = input.project ?? defaultProject;
  const endGoal = input.endGoal ?? defaultEndGoal;
  const plans = input.plans ?? defaultPlans;
  const tasks = input.tasks ?? defaultTasks;
  const progress = input.progress ?? defaultProgress;
  const active = input.active ?? defaultActive;
  const config = input.config ?? defaultConfig;
  const meta = input.meta ?? defaultMeta;

  await writeYaml(path.join(root, ".opendaas", "meta", "workspace.yaml"), meta);
  await writeYaml(path.join(root, ".opendaas", "config", "workspace.yaml"), config);
  await writeYaml(path.join(root, ".opendaas", "project", "overview.yaml"), project);
  await writeYaml(path.join(root, ".opendaas", "goals", "end.yaml"), endGoal);
  await writeYaml(path.join(root, ".opendaas", "plans", "current.yaml"), plans);
  await writeYaml(path.join(root, ".opendaas", "tasks", "current.yaml"), tasks);
  await writeYaml(path.join(root, ".opendaas", "tasks", "archive.yaml"), { items: [] });
  await writeYaml(path.join(root, ".opendaas", "decisions", "records.yaml"), { items: [] });
  await writeYaml(path.join(root, ".opendaas", "releases", "records.yaml"), { items: [] });
  await writeYaml(path.join(root, ".opendaas", "state", "progress.yaml"), progress);
  await writeYaml(path.join(root, ".opendaas", "state", "active.yaml"), active);

  await writeText(
    path.join(root, "docs", "index.md"),
    doc(
      "Test index",
      "Workspace entry page.",
      `
# Test Workspace

## 最终目标

待同步

## 当前进度

待同步
`
    )
  );
  await writeText(
    path.join(root, "docs", "project", "overview.md"),
    doc(
      "Project Overview",
      "Project overview page.",
      `
# Project Overview

## 项目摘要

待同步
`
    )
  );
  await writeText(
    path.join(root, "docs", "project", "goal.md"),
    doc(
      "Final Goal",
      "Goal anchor page.",
      `
# Final Goal

## 最终目标

待同步

## 完成标准

- 待同步

## 明确不做什么

- 待同步

## 当前进度摘要

待同步
`
    )
  );
  await writeText(
    path.join(root, "docs", "project", "status.md"),
    doc(
      "当前状态",
      "Workspace status page.",
      `
# 当前状态

## 状态摘要

待同步

## 当前阶段

待同步

## 当前进度

待同步

## 当前进展

- 待同步

## 主要 blocker / 风险

- 待同步

## 下一步动作

- 待同步

## 最近更新时间

待同步
`
    )
  );
  await writeText(
    path.join(root, "docs", "project", "current-work.md"),
    doc(
      "当前工作",
      "Current work projection.",
      `
# 当前工作

## 当前 active work

待同步

## 当前高层焦点

待同步

## 当前高层计划

- 待同步

## 当前不做什么

- 待同步
`
    )
  );
  await writeText(
    path.join(root, "docs", "project", "tasks.md"),
    doc(
      "任务闭环",
      "Task closure projection.",
      `
# 任务闭环

## 当前任务树

- 待同步

## 最近完成

- 待同步

## 历史闭环

- 待同步
`
    )
  );
  await writeText(
    path.join(root, "docs", "project", "decisions", "index.md"),
    doc(
      "Decisions",
      "Decision index page.",
      `
# Decisions

## 决策摘要

待同步

## 关键决策列表

- 待同步

## 最近新增决策

- 待同步
`
    )
  );
  await writeText(
    path.join(root, "docs", "project", "releases", "index.md"),
    doc(
      "Releases",
      "Release index page.",
      `
# Releases

## 发布摘要

待同步

## 最近版本

- 待同步

## 重要变化

- 待同步
`
    )
  );
  await writeText(
    path.join(root, "docs", "engineering", "development.md"),
    doc(
      "Engineering Development",
      "Engineering entry page.",
      `
# Engineering Development

OpenDaaS test workspace.
`
    )
  );

  return {
    root,
    use() {
      const previous = process.env.OPENDAAS_WORKSPACE_ROOT;
      process.env.OPENDAAS_WORKSPACE_ROOT = root;

      return () => {
        if (previous === undefined) {
          delete process.env.OPENDAAS_WORKSPACE_ROOT;
          return;
        }
        process.env.OPENDAAS_WORKSPACE_ROOT = previous;
      };
    },
    async cleanup() {
      await fs.rm(root, { recursive: true, force: true });
    }
  };
}
