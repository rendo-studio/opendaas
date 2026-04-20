---
name: OpenDaaS 内部工作区文件与数据结构规范
description: 定义 .opendaas 固定文件骨架与最小数据结构。
---

# OpenDaaS 内部工作区文件与数据结构规范
## OpenDaaS Workspace Data Specification v1

**版本：** v1.1  
**状态：** 当前主稿  
**产品工作名：** `OpenDaaS`  
**CLI 名：** `opendaas`  
**性质：** 实施规范  
**依赖：** [内部工作区规范](./WORKSPACE-SPEC.md)、[CLI 命令面规范](./CLI-SPEC.md)、[命名空间规范](./NAMESPACE-SPEC.md)

---

## 1. 文档目的

本文档把 `.opendaas/` 的固定区块进一步映射到具体文件和最小数据结构。

它要回答的是：

- 哪些文件默认应存在
- 这些文件各自负责什么
- 建议使用什么文件格式
- 哪些字段是最小必需字段

---

## 2. 基本判断

`.opendaas/` 的文件设计应同时满足：

1. CLI 可稳定读写
2. Agent 可稳定读写
3. 人类在必要时也能检查
4. 不依赖隐式数据库才能成立

因此，本规范优先采用：

- `yaml` 作为结构化配置和状态格式
- `json` 作为程序化索引与差异数据格式
- `md` 作为可选的内部说明与技术推演格式

---

## 3. 建议的固定文件总览

当前建议 `.opendaas/` 至少存在以下固定文件：

```text
.opendaas/
  meta/
    workspace.yaml
  config/
    workspace.yaml
  state/
    active.yaml
    progress.yaml
  goals/
    current.yaml
    baseline.json
    pending.json
    history.json
    sources.json
  plans/
    current.yaml
  tasks/
    current.yaml
    archive.yaml
```

说明：

- `cache/` 是固定区块，但不要求固定文件一开始就存在
- 其他文件可按后续版本继续扩展

---

## 4. 各固定文件职责

### 4.1 `.opendaas/meta/workspace.yaml`

职责：

- 标识当前仓库已接入 OpenDaaS
- 提供内部工作区版本与根路径上下文

### 4.2 `.opendaas/config/workspace.yaml`

职责：

- 承载 CLI 的工作区级配置
- 承载差异检查与站点构建等行为开关

### 4.3 `.opendaas/state/active.yaml`

职责：

- 记录当前控制面活跃状态
- 记录 active change、当前轮次以及最近一次差异检查结果

### 4.4 `.opendaas/state/progress.yaml`

职责：

- 记录当前基于原生结构化 task 状态计算出的进度摘要

### 4.5 `.opendaas/goals/end.yaml`

职责：

- 承载长期最终目标的原生结构化定义


职责：

- 记录 `docs/` 共享源文档当前已确认的差异基线


职责：

- 记录当前尚未确认的共享源文档差异摘要

### 4.8 `.opendaas/plans/current.yaml`

职责：

- 承载当前高层 plan tree 的原生结构化定义

### 4.9 `.opendaas/tasks/current.yaml`

职责：

- 承载当前轮次的内部 TODO 与 task tree

### 4.10 `.opendaas/tasks/archive.yaml`

职责：

- 承载已经关闭或归档的任务闭环历史
- 为任务历史视图提供稳定真相源


职责：

- 记录共享源文档最近一次由 CLI / Agent 写入时的来源签名


职责：

- 记录 append-only 的差异事件流
- 为“上一个版本 vs 当前版本”的可视化比较提供历史依据

---

## 5. 文件格式约定

### 5.1 `yaml`

适用于：

- 元信息
- 配置
- 当前状态
- 内部任务清单

原因：

- 人类可读
- 结构化程度足够
- 易于 CLI 与 Agent 读写

### 5.2 `json`

适用于：

- 差异索引
- 差异基线
- 差异摘要

原因：

- 适合程序化比对
- 适合后续扩展字段

## 6. 最小字段定义

### 6.1 `meta/workspace.yaml`

最少字段建议：

```yaml
version: 1
workspaceName: opendaas
docsRoot: docs
workspaceRoot: .opendaas
createdAt: 2026-04-17T00:00:00Z
```

### 6.2 `config/workspace.yaml`

最少字段建议：

```yaml
docsSiteEnabled: true
```

### 6.3 `state/active.yaml`

最少字段建议：

```yaml
activeChange: null
currentRoundId: null
```

说明：

- `activeChange` 指向当前高层执行单元
- `currentRoundId` 指向当前开发轮次

### 6.4 `state/progress.yaml`

最少字段建议：

```yaml
percent: 0
countedTasks: 0
doneTasks: 0
computedAt: null
```

### 6.5 `goals/end.yaml`

最少字段建议：

```yaml
goalId: end-goal-1
name: null
summary: null
successCriteria: []
nonGoals: []
```


最少字段建议：

```json
{
  "docs/index.md": {
    "hash": "",
    "acknowledgedAt": null
  }
}
```

说明：

- key 为 `docs/` 中的源文件相对路径
- `hash` 表示最近一次确认时的内容标识


最少字段建议：

```json
{
  "generatedAt": null,
  "files": []
}
```

当存在差异时，`files` 中的每个对象至少应包含：

```json
{
  "path": "docs/project/status.md",
  "changeType": "modified",
  "source": "human",
  "hunks": [
    {
      "oldStart": 10,
      "oldCount": 2,
      "newStart": 10,
      "newCount": 3
    }
  ]
}
```

说明：

- `source` 允许值建议为 `human / agent / unknown`
- `hunks` 用于支持行级差异定位


最少字段建议：

```json
{
  "project/status.md": {
    "hash": "",
    "source": "agent",
    "recordedAt": "2026-04-17T00:00:00Z"
  }
}
```

说明：

- key 为 `docs/` 内相对路径
- `hash` 对应最近一次由 CLI / Agent 写入后的共享文档内容标识
- 若当前文档内容 hash 与记录不匹配，则默认应视为 `human`


最少字段建议：

```json
{
  "items": [
    {
      "kind": "check",
      "generatedAt": "2026-04-18T00:00:00Z",
      "fileCount": 2,
      "addedCount": 0,
      "modifiedCount": 2,
      "deletedCount": 0,
      "files": []
    }
  ]
}
```

### 6.10 `plans/current.yaml`

最少字段建议：

```yaml
endGoalRef: end-goal-1
items:
  - id: plan-1
    name: establish auth flow
    summary: define the first stable execution stream
    status: pending
    parentPlanId: null
  - id: plan-1-1
    name: implement sign-in flow
    summary: deliver the first concrete slice inside the plan stream
    status: pending
    parentPlanId: plan-1
```

说明：

- `plans/current.yaml` 应支持树形结构
- 根计划节点使用 `parentPlanId: null`

### 6.11 `tasks/current.yaml`

最少字段建议：

```yaml
items:
  - id: task-1
    name: build auth page
    status: pending
    planRef: plan-1
    parentTaskId: null
    countedForProgress: true
  - id: task-1-1
    name: wire form validation flow
    status: pending
    planRef: plan-1
    parentTaskId: task-1
    countedForProgress: true
```

允许的 `status` 至少包括：

- `pending`
- `in_progress`
- `done`
- `blocked`

说明：

- `tasks/current.yaml` 必须支持不限层级的树形结构
- 每个 task 都必须有明确的 `parentTaskId`
- 根任务节点使用 `parentTaskId: null`
- `countedForProgress: true` 的 task 才进入默认进度计算

### 6.12 `tasks/archive.yaml`

最少字段建议：

```yaml
items:
  - id: task-closed-1
    name: close auth rollout
    planRef: plan-1
    parentTaskId: null
    status: done
    closedAt: 2026-04-18T00:00:00Z
    closedByChange: auth-rollout-1
    summary: close out the initial auth rollout
```

---

## 7. 差异追踪的最小运行规则

### 7.1 比对对象


### 7.2 任务前检查

开发端 Agent 在每轮任务开始前，必须：


### 7.3 差异确认

在 Agent 明确吸收差异并完成理解后，CLI 应支持：


### 7.4 来源判定

CLI 至少应支持：

1. 记录共享源文档最近一次由 Agent / CLI 写入后的来源签名
3. 对无法匹配来源签名的共享文档变更默认判定为 `human`

### 7.5 进度计算

CLI 应至少能够：

1. 基于 `tasks/current.yaml` 中 `countedForProgress: true` 的 task 计算默认进度
2. 将结果写入 `state/progress.yaml`

---

## 8. 哪些文件可以延后生成

以下文件或目录可以在实际需要时再生成：

1. `cache/` 下的具体文件
2. 更细粒度的 `plans/archive/`
3. 更细粒度的 `tasks/archive/`
4. 更复杂的差异快照或 patch 文件
5. 用于内部技术推演的附加 Markdown 说明文件

但第 3 节列出的固定文件，至少应在 `init` 或 `adopt` 后具备最小占位。

---

## 9. 不合格状态

出现以下任一情况时，应视为 `.opendaas/` 结构尚未正确落地：

1. 没有工作区元信息文件
2. 没有当前活跃状态文件
3. 没有最终目标结构化文件
4. 没有当前进度结构化文件
5. 没有差异基线文件
6. 没有待确认差异文件
7. CLI 无法查询结构化 plan / task 状态
8. 文件级变化无法稳定产出可复用的结构化结果
9. task 缺少明确 `parentTaskId`
10. 没有任务归档或差异历史入口却声称支持闭环历史

---

## 10. 当前结论

当前可以明确：

> **`.opendaas/` 的固定区块需要进一步落到固定文件。**

更具体地说：

> **`workspace.yaml`、`active.yaml`、`progress.yaml`、`goals/end.yaml`、`baseline.json`、`pending.json`、`history.json`、`plans/current.yaml`、`tasks/current.yaml`、`tasks/archive.yaml` 已经足以构成 OpenDaaS 内部工作区的第一版可闭环文件骨架。**

---

## 11. 下一步

在内部工作区文件与数据结构被固定后，后续应继续回答：

1. 差异来源如何更可靠地区分 human / agent / unknown
2. patch 文件或快照文件是否需要独立存储
3. 多轮任务历史如何归档
