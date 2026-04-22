---
name: Init And Adopt Spec
description: 固定 OpenDaaS init/adopt 的输入、输出、覆盖策略与安全边界。
---

# Init And Adopt Spec

## 目的

本规范定义 `opendaas init` 与 `opendaas adopt` 的当前正式边界。

它关注两件事：

1. 新工作区应该得到什么最小骨架
2. 现有项目怎样被安全接入 OpenDaaS，而不会被侵入式篡改

## 命令定位

- `opendaas init`
  - 面向空目录或新项目目录
- `opendaas adopt`
  - 面向已存在的仓库

两者都只生成 OpenDaaS 自己负责的最小结构，不应注入与当前项目无关的模板噪音。

## 输入契约

### init

最小输入：

- 可选 `targetPath`

扩展输入：

- `projectName`
- `projectSummary`
- `endGoalName`
- `endGoalSummary`
- `docsMode`
- `projectKind`
- `force`

### adopt

最小输入：

- 可选 `targetPath`

扩展输入：

- `projectName`
- `projectSummary`
- `endGoalName`
- `endGoalSummary`
- `force`

## 输出契约

### init 输出

必须生成：

- `.opendaas/` 固定结构
- 最小 authored docs package
- `AGENTS.md`
- `.agents/skills/opendaas-workflow/SKILL.md`

### adopt 输出

必须生成或补齐：

- 缺失的 `.opendaas/` 固定结构
- 缺失的最小 authored docs anchors
- `AGENTS.md`
- `.agents/skills/opendaas-workflow/SKILL.md`

必须保留：

- 现有项目代码
- 现有 authored docs 正文
- 现有目录结构

## 固定生成结构

### .opendaas

实现时必须稳定生成：

- `.opendaas/meta/workspace.yaml`
- `.opendaas/config/workspace.yaml`
- `.opendaas/state/active.yaml`
- `.opendaas/project/overview.yaml`
- `.opendaas/goals/end.yaml`
- `.opendaas/plans/current.yaml`
- `.opendaas/tasks/current.yaml`
- `.opendaas/tasks/archive.yaml`
- `.opendaas/decisions/records.yaml`
- `.opendaas/versions/records.yaml`

### docs

实现时必须稳定生成或补齐：

- `docs/shared/overview.md`
- `docs/shared/goal.md`
- `docs/public/`
- `docs/internal/`

## 覆盖与保留策略

### 允许直接创建

- 缺失目录
- 缺失锚点文件
- 明确属于 OpenDaaS 命名空间的控制面文件

### 允许覆盖

- `.opendaas/` 内部控制面文件
- OpenDaaS 自己托管且已明确标记为可覆盖的 generated artifacts

### adopt 默认不得覆盖

- 现有 authored docs 正文
- 同路径同名的已有 Markdown 文件
- 用户代码目录
- 非 OpenDaaS 命名空间的文件

### force 的边界

`force` 只允许覆盖 OpenDaaS 自己负责的控制面与 generated artifacts，不得越权重写已有 authored docs。

## 幂等规则

重复执行 `init` 或 `adopt` 必须满足：

- 不产生重复目录
- 不重复追加同一段模板正文
- 不改变未被 OpenDaaS 托管的用户内容
- `adopt` 遇到同路径已有 authored docs 时直接跳过

## 当前结论

`init` 的职责是生成最小可用骨架。

`adopt` 的职责是安全接入现有项目，而不是篡改现有项目的 authored docs 结构。
