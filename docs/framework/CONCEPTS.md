---
name: OpenDaaS Concepts
description: 固定 OpenDaaS 的核心概念边界，确保框架定义层保持方法论中立。
---

# OpenDaaS Concepts

## 核心概念图

`shared reality -> plan/task execution -> validation/version recording`

`decision` 是低频控制面，用来约束重要节点，不参与每一步日常开发。

## docs

`docs/` 是 authored context。

它默认服务于：

- 项目开发者
- 开发端 Agent
- 人类的接手、审阅与协作

推荐的最小分层是：

- `docs/shared/`
- `docs/public/`
- `docs/internal/`

## .opendaas

`.opendaas/` 是 Agent-first 的结构化控制面工作区。

它只应持久化显式事实与结构化意图，例如：

- project overview
- end goal
- plans
- tasks
- decisions
- version records
- workspace config

它不应持久化纯计算态，例如 progress 缓存。

## goal

`goal` 是项目长期目标锚点。

它不是当前迭代标题，也不应随着短期执行焦点频繁波动。

## plan / task

`plan` 表达高层执行流，`task` 表达具体执行项。

高频维护允许直接编辑 `.opendaas/plans/current.yaml` 与 `.opendaas/tasks/current.yaml`。

## decision

`decision` 是低频、通用、方法论中立的重要决策记录。

它用于记录：

- 为什么某个方向被批准或拒绝
- 为什么某个目标被确立或修改
- 为什么某个架构、范围或版本策略成立

## validation

`validation` 表示当前工作区、变更或版本是否已经过足够验证。

它可以来自测试、校验命令、验证总结和修复结果。

## version

`version` 是低频、项目级的正式版本记录。

它用于表达：

- 项目进入了新的整体成熟状态
- 该状态值得被长期保存
- 维护者已经决定把它作为正式版本边界记录下来

它不是普通 task 日志，也不等同于外部发布事件。
