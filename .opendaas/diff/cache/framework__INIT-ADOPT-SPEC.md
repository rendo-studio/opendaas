---
name: Init And Adopt Spec
description: 固定 OpenDaaS init/adopt 输入、输出、覆盖策略、模板变量与幂等规则的实现前规范。
---

# Init And Adopt Spec

## 目的

本规范用于在真正实现 `opendaas init` 与 `opendaas adopt` 之前，先固定它们的契约边界。

当前目标不是立刻推出正式脚手架，而是先避免后续实现因为输入、输出、覆盖策略和模板变量摇摆而留下迁移债务。

## 命令定位

- `opendaas init`
  - 面向空目录、新项目目录，或尚未接入 OpenDaaS 的最小项目骨架创建。
- `opendaas adopt`
  - 面向已存在的代码仓库或文档仓库，为其补入 OpenDaaS 的控制面与共享文档锚点。

两者都必须只生成 OpenDaaS 核心运行所需的最小结构，不得暗中注入与当前项目无关的模板噪音。

## 输入契约

### init

最小输入：

- `targetPath`
- `projectName`
- `goalName`
- `goalSummary`

扩展输入：

- `docsMode`
  - `minimal`
  - `standard`
- `projectKind`
  - `general`
  - `frontend`
  - `library`
  - `service`
- `force`
  - 仅影响允许覆盖的模板锚点

### adopt

最小输入：

- `targetPath`
- `goalName`
- `goalSummary`

扩展输入：

- `docsPath`
  - 默认为 `<targetPath>/docs`
- `workspacePath`
  - 默认为 `<targetPath>/.opendaas`
- `force`
  - 仅影响允许覆盖的模板锚点

## 输出契约

### init 输出

必须生成：

- `.opendaas/` 固定结构
- `docs/` 最小共享文档包锚点
- 初始 `goal / plan / task / progress / diff` 控制面文件

不得生成：

- 项目无关的示例页面
- 与所选项目类型无关的额外文档分区
- 独立 Web 应用产物

### adopt 输出

必须生成或补齐：

- 缺失的 `.opendaas/` 固定结构
- `docs/` 中 OpenDaaS 所需最小锚点
- 初始 `goal / plan / task / progress / diff` 控制面文件

必须保留：

- 现有项目代码
- 现有业务文档
- 现有仓库目录结构

## 固定生成结构

### .opendaas

实现时必须稳定生成：

- `.opendaas/meta/workspace.yaml`
- `.opendaas/config/workspace.yaml`
- `.opendaas/state/active.yaml`
- `.opendaas/state/progress.yaml`
- `.opendaas/diff/baseline.json`
- `.opendaas/diff/pending.json`
- `.opendaas/diff/sources.json`
- `.opendaas/goals/end.yaml`
- `.opendaas/plans/current.yaml`
- `.opendaas/tasks/current.yaml`

### docs

实现时必须稳定生成或补齐：

- `docs/index.md`
- `docs/project/goal.md`
- `docs/project/status.md`
- `docs/project/current-work.md`
- `docs/project/changes/index.md`
- `docs/engineering/development.md`

`docs/` 的其余目录不应写死，而应保持“固定锚点 + 自适应扩展”。

## 模板变量

所有模板只允许使用这一批显式变量：

- `projectName`
- `endGoalName`
- `endGoalSummary`
- `projectKind`
- `docsMode`
- `activeChangeId`
- `currentRoundId`
- `createdAt`

在没有更多稳定需求前，不得继续扩张变量面。

## 覆盖与保留策略

### 允许直接创建

- 缺失文件
- 缺失目录
- 明确属于 OpenDaaS 内部命名空间的文件

### 允许覆盖

- OpenDaaS 生成的固定锚点文件
- `.opendaas/` 内部控制面文件

### 默认不得覆盖

- 用户已有的业务文档正文
- 用户已有的 API、协议、模块说明
- 用户代码目录
- 用户手工维护但非 OpenDaaS 锚点的 Markdown 文件

### force 的边界

`force` 只允许覆盖 OpenDaaS 自己负责的固定锚点与控制面文件，不得越权覆盖用户文档或代码。

## 幂等规则

重复执行 `init` 或 `adopt` 必须满足：

- 不产生重复目录
- 不产生重复锚点文件
- 不重复追加同一段模板正文
- 不改变未被 OpenDaaS 托管的用户内容
- 不改变已有业务文档的信息层级

如果输出已经满足目标状态，应返回“已对齐”而不是重新生成噪音。

## 失败与中止规则

以下情况必须中止，不得半写入：

- 无法确定目标目录
- 无法解析已有 `docs/` 与 `.opendaas/` 的边界
- 发现需要覆盖非 OpenDaaS 托管文件
- 关键模板变量缺失

写入过程应尽量采用先准备、后落盘的方式，避免部分成功、部分失败造成工作区污染。

## 与脚手架正式实现的关系

本规范写死的是契约，不代表正式实现现在就应启动。

在以下条件稳定前，`init/adopt` 仍应视为内部验证级能力，而不是正式对外承诺：

- 站点运行时生命周期更稳定
- Agent 适配层最小实现落地
- 差异来源判定与确认流经过更多真实工作区验证
- 模板变量和目录锚点经过至少一轮实战收敛

## 当前结论

`init/adopt` 的目标已经足够清晰，可以开始按本规范做内部验证实现。

但在当前阶段，它们仍应以“可反复重构的初始化器”来设计，而不是一上来就当成不可变的正式脚手架产品能力。
