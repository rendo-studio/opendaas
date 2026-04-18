import path from "node:path";
import { existsSync } from "node:fs";

import { recordAgentDocWrite } from "./doc-sources.js";
import { replaceSectionContent } from "./markdown.js";
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
  goalName: string;
  goalSummary: string;
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

Current goal: **${input.goalName}**

Current phase: **${input.phase}**

Current progress: **${input.progress}%**

Current active change: **${activeChange}**

## Mandatory Round Start

1. Read \`docs/project/goal.md\`, \`docs/project/status.md\`, and \`docs/project/current-work.md\`
2. Run \`opendaas diff check\`
3. Absorb pending shared-doc diffs before changing code, docs, or control-plane state
4. Re-check whether the current work is still inside the approved goal and current change boundary

## Write Rules

- Treat \`docs/\` as the shared project reality for humans and agents
- Treat \`.opendaas/\` as the internal control plane
- For high-frequency plan/task maintenance, prefer direct edits to \`.opendaas/goals/current.yaml\`, \`.opendaas/plans/current.yaml\`, \`.opendaas/tasks/current.yaml\`, and related state files when that is clearer and faster than issuing many CLI mutations
- Use CLI as the primary guardrail for initialization, adoption, validation, diff handling, docs projection, site runtime, and agent artifact sync
- Treat \`plan\` and \`task\` CLI mutations as auxiliary entry points, not the only valid editing path

## Decision Trigger Rules

- Record a formal decision when proposing a new goal, materially expanding scope, starting a new high-cost change, changing architecture, or making an irreversible high-impact decision
- Do not force a formal decision entry for ordinary in-scope implementation, UI polish, routine refactors, or low-risk optimization inside the current approved goal

## Recommended Commands

- \`opendaas validate\`
- \`opendaas diff check\`
- \`opendaas diff ack\`
- \`opendaas status sync\`
- \`opendaas site dev --path <project-or-docs-path>\`
- \`opendaas agent sync\`
`;
}

function renderAgentDocs(input: {
  goalName: string;
  goalSummary: string;
  phase: string;
  progress: number;
  activeChange: string | null;
}): string {
  const activeChange = input.activeChange ?? "none";

  return `---
name: Agent Usage
description: OpenDaaS 当前工作区面向开发端 Agent 的最小使用说明。
---

# Agent Usage

## 当前工作区摘要

- Goal: ${input.goalName}
- Summary: ${input.goalSummary}
- Phase: ${input.phase}
- Progress: ${input.progress}%
- Active change: ${activeChange}

## 开发端 Agent 最小工作流

1. 先读取 \`docs/project/goal.md\`、\`docs/project/status.md\`、\`docs/project/current-work.md\`
2. 每轮任务开始前运行 \`opendaas diff check\`
3. 范围内直接推进，越界时升级
4. 高频 task / plan 维护优先直接更新 \`.opendaas/\` 工作区
5. 用 CLI 做校验、差异处理、状态投影、站点运行时与 agent artifact 同步

## 何时记录正式决策

仅在以下情况触发：

- 新最终目标
- 目标差异化变更
- 大范围 scope 扩张
- 新的显著成本 change
- 架构路线切换
- 不可逆高影响决策

常规 UI 优化、范围内功能升级、低风险重构和已批准 change 内的实现推进，不应默认阻塞在 formal decision 上。
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
    goalName: status.goal.name,
    goalSummary: status.goal.summary,
    phase: status.phase,
    progress: status.progress.percent,
    activeChange: activeState.activeChange
  };

  const skillContent = renderAgentSkill(payload);
  const docsContent = renderAgentDocs(payload);

  const skillPath = agentSkillPath(root);
  const docsPath = agentDocsPath(root);

  await writeText(skillPath, skillContent);
  await writeText(docsPath, docsContent);
  await recordAgentDocWrite(docsPath, docsContent);

  try {
    await replaceSectionContent(
      path.join(paths.docsRoot, "engineering", "development.md"),
      "开发方式",
      [
        "当前推荐的推进顺序：",
        "",
        "1. 先通过 `docs/project/*.md` 理解最终目标、当前状态和当前工作",
        "2. 每轮任务开始前运行 `opendaas diff check`",
        "3. 高频 task / plan 维护优先直接更新 `.opendaas/` 工作区",
        "4. 再用 CLI 执行 `validate / status sync / site / agent sync` 等护栏与派生动作"
      ].join("\n")
    );
  } catch {
    // If the development page shape changed, leave the dedicated agent guide as the stable artifact.
  }

  return {
    ...payload,
    skillPath,
    docsPath
  };
}
