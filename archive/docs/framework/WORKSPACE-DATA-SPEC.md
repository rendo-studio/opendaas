---
name: OpenDaaS 内部工作区文件与数据结构规范
description: 定义当前 `.opendaas/` 工作区的固定文件骨架、最小字段与派生规则。
---

# OpenDaaS Workspace Data Specification

## 1. 目的

本文档定义当前 OpenDaaS 工作区的真实数据模型。

它回答三件事：

1. `.opendaas/` 里哪些文件是固定真相源
2. 哪些字段属于显式事实，应该被持久化
3. 哪些值属于读取时派生结果，不应该写回工作区

## 2. 基本原则

OpenDaaS 的工作区首先服务开发端 Agent，其次服务人类检查与协作。

因此数据模型必须满足：

1. Agent 直接读取 `.opendaas/` 时不会遇到过时缓存
2. CLI 与文档站都能从同一份结构化真相源派生视图
3. 工作区不依赖隐式数据库或后台守护进程才能保持一致
4. 纯计算值不进入 `.opendaas` 真相层
5. 文档包路径和目录结构只能被推荐，不能成为运行时隐式依赖

当前结论：

- `.opendaas` 只持久化显式事实与结构化意图
- `phase`、`progress`、top-level plan execution status 都在读取时自动计算
- 运行时缓存如果存在，应留在 docs-site runtime，而不是写回 `.opendaas`

## 3. 固定目录骨架

当前建议至少存在以下固定文件：

```text
.opendaas/
  meta/
    workspace.yaml
  config/
    workspace.yaml
  state/
    active.yaml
  project/
    overview.yaml
  goals/
    end.yaml
  plans/
    current.yaml
  tasks/
    current.yaml
    archive.yaml
  decisions/
    records.yaml
  versions/
    records.yaml
```

说明：

- 这是当前产品实现对应的真实骨架
- `docs/` 是 authored context，不属于 `.opendaas` 内部结构的一部分
- 文档包根路径由 `.opendaas/config/workspace.yaml` 中的 `docsSite.sourcePath` 决定，默认值是 `docs`
- docs revision history、site runtime snapshot 等运行态数据不进入这个骨架

## 4. 各固定文件职责

### 4.1 `.opendaas/meta/workspace.yaml`

职责：

- 标识当前仓库已经接入 OpenDaaS
- 提供 schema/template 版本与工作区根路径信息

### 4.2 `.opendaas/config/workspace.yaml`

职责：

- 提供 docs-site 和工作区运行配置
- 提供 schema 版本与项目类型等配置性信息

### 4.3 `.opendaas/state/active.yaml`

职责：

- 记录当前 active change
- 记录当前 round id

### 4.4 `.opendaas/project/overview.yaml`

职责：

- 持久化项目介绍的结构化锚点
- 指明 authored project overview 文档路径 `docPath`

### 4.5 `.opendaas/goals/end.yaml`

职责：

- 持久化长期 end goal
- 指明 authored goal 文档路径 `docPath`
- 提供 success criteria 与 non-goals

### 4.6 `.opendaas/plans/current.yaml`

职责：

- 持久化当前 plan tree
- 表达计划结构，而不是缓存执行状态

### 4.7 `.opendaas/tasks/current.yaml`

职责：

- 持久化当前 live task tree
- 提供执行状态、归属 plan、父子关系与 progress accounting 标记

### 4.8 `.opendaas/tasks/archive.yaml`

职责：

- 持久化已经关闭的任务闭环历史

### 4.9 `.opendaas/decisions/records.yaml`

职责：

- 持久化正式决策记录
- 如需要人类可读决策文档，通过每条记录的 `docPath` 显式绑定

### 4.10 `.opendaas/versions/records.yaml`

职责：

- 持久化低频、项目级的 version 记录
- 如需要人类可读版本文档，通过每条记录的 `docPath` 显式绑定

## 5. 最小字段定义

### 5.1 `meta/workspace.yaml`

最少字段建议：

```yaml
schemaVersion: 8
workspaceName: opendaas
docsRoot: docs
workspaceRoot: .opendaas
bootstrapMode: init
templateVersion: 2026-04-21.agent-first-derived-state-1
projectKind: general
docsMode: standard
createdAt: 2026-04-21T00:00:00Z
lastUpgradedAt: null
```

### 5.2 `config/workspace.yaml`

最少字段建议：

```yaml
siteFramework: fumadocs
packageManager: npm
projectKind: general
docsMode: standard
docsSite:
  enabled: true
  sourcePath: docs
  preferredPort: 4310
workspaceSchemaVersion: 8
```

### 5.3 `state/active.yaml`

最少字段建议：

```yaml
activeChange: null
currentRoundId: null
```

### 5.4 `project/overview.yaml`

最少字段建议：

```yaml
name: OpenDaaS
summary: CLI-first project context control plane for development agents.
docPath: shared/overview.md
```

### 5.5 `goals/end.yaml`

最少字段建议：

```yaml
goalId: end-goal-opendaas
name: Make OpenDaaS durable
summary: Turn OpenDaaS into a stable project context control plane.
docPath: shared/goal.md
successCriteria: []
nonGoals: []
```

### 5.6 `plans/current.yaml`

最少字段建议：

```yaml
endGoalRef: end-goal-opendaas
items:
  - id: plan-1
    name: establish shared context
    summary: anchor the project reality before implementation
    parentPlanId: null
  - id: plan-1-1
    name: refine execution slice
    summary: turn the current slice into explicit executable work
    parentPlanId: plan-1
```

说明：

- `plans/current.yaml` 只表达 plan tree
- plan execution status 不在这个文件里持久化
- `plan show`、`status show`、docs-site Console 会基于 task tree 自动派生 plan status

### 5.7 `tasks/current.yaml`

最少字段建议：

```yaml
items:
  - id: task-1
    name: build auth page
    summary: deliver the first auth UI slice
    status: pending
    planRef: plan-1
    parentTaskId: null
    countedForProgress: true
  - id: task-1-1
    name: wire form validation flow
    summary: connect the auth form to validation and submission behavior
    status: pending
    planRef: plan-1
    parentTaskId: task-1
    countedForProgress: true
```

允许的 `status`：

- `pending`
- `in_progress`
- `done`
- `blocked`

说明：

- task tree 必须支持不限层级的父子结构
- 每个 task 都必须有明确 `parentTaskId`
- `countedForProgress: true` 的 task 才进入默认进度计算

### 5.8 `tasks/archive.yaml`

最少字段建议：

```yaml
items:
  - id: task-closed-1
    name: close auth rollout
    planRef: plan-1
    parentTaskId: null
    status: done
    closedAt: 2026-04-21T00:00:00Z
    closedByChange: auth-rollout-1
    summary: close out the initial auth rollout
```

### 5.9 `decisions/records.yaml`

最少字段建议：

```yaml
items:
  - id: define-version-record-policy
    name: Define version record policy
    description: Introduce low-frequency project-level version records.
    docPath: internal/decision-log/version-record-policy.md
    category: version
    proposedBy: agent
    context: The framework needs a stable version-recording model.
    impactOfNoAction: Version history stays ambiguous.
    expectedOutcome: Project-level version records become explicit and low-frequency.
    boundary: Only version-record semantics; no external publish workflow.
    status: approved
    decisionSummary: Approved as the project-level version baseline.
    revisitCondition: Revisit if version semantics change materially.
    createdAt: 2026-04-23T00:00:00Z
    decidedAt: 2026-04-23T00:10:00Z
```

### 5.10 `versions/records.yaml`

最少字段建议：

```yaml
items:
  - id: 0-2-0-stable-control-plane-baseline
    version: 0.2.0
    title: Stable control-plane baseline
    summary: First version where the control plane is stable enough to preserve.
    docPath: internal/changelog/0-2-0.md
    status: recorded
    decisionRefs:
      - define-version-record-policy
    highlights: []
    breakingChanges: []
    migrationNotes: []
    validationSummary: Core version control-plane flow validated.
    createdAt: 2026-04-23T00:00:00Z
    recordedAt: 2026-04-23T00:20:00Z
```

## 6. 派生视图规则

以下值属于派生结果，不应该持久化到 `.opendaas`：

- `progress.percent`
- `progress.countedTasks`
- `progress.doneTasks`
- `phase`
- top-level plan execution status
- 任何能够仅凭 `plans/current.yaml` + `tasks/current.yaml` 推导出的摘要

当前规则：

1. `status show` 必须读取时计算这些值
2. `plan show` 必须读取时计算 plan execution status
3. docs-site Console 必须读取时计算并投影这些值
4. 如果需要运行时缓存，只能写到 docs-site runtime，而不是 `.opendaas`

## 7. 为什么不持久化纯计算值

原因很直接：

1. 开发端 Agent 经常直接编辑 `.opendaas`
2. 如果纯计算值被持久化但没有可靠自动重算机制，它们就会变成过时假真相
3. `phase` 与 `progress` 的计算成本很低，没有必要为它们引入后台同步系统

因此当前最佳实践是：

- 持久化显式事实
- 读取时派生执行视图

## 8. 不合格状态

出现以下任一情况时，应视为工作区未对齐：

1. 缺少 `meta/workspace.yaml`
2. 缺少 `config/workspace.yaml`
3. 缺少 `state/active.yaml`
4. 缺少 `project/overview.yaml`
5. 缺少 `goals/end.yaml`
6. 缺少 `plans/current.yaml`
7. 缺少 `tasks/current.yaml`
8. 缺少 `tasks/archive.yaml`
9. `plans/current.yaml` 仍持久化 plan execution `status`
10. 工作区仍持久化独立的 `progress.yaml`

## 9. 当前结论

当前可以明确：

> **OpenDaaS 的 `.opendaas/` 应被视为 Agent-first 的结构化真相层，而不是派生状态缓存层。**

更具体地说：

> **`workspace.yaml`、`active.yaml`、`project/overview.yaml`、`goals/end.yaml`、`plans/current.yaml`、`tasks/current.yaml`、`tasks/archive.yaml`、`decisions/records.yaml`、`versions/records.yaml` 已足以构成当前版本的闭环工作区骨架；任何 authored docs 绑定都必须通过显式 `docPath`，而不是靠固定目录推断。**
