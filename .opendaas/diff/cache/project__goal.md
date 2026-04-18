---
name: Goal Context
description: 说明项目的长期方向、最终目标与当前计划之间的关系。
---

# Goal Context

这个页面是解释页，不是实时控制台。

当前 live structured end goal 以 `.opendaas/goals/end.yaml` 为准。Console 会直接读取这份结构化数据；本页负责解释“长期方向”和“当前 plans / tasks”之间的关系。

## 长期方向

OpenDaaS 的长期方向不是堆更多页面，而是把它收敛成一套清晰、可持续、方法论中立的人类与开发端 Agent 协作控制面。

我们希望它最终稳定回答的是：

- 目标如何被锚定
- 范围如何被控制
- 任务与计划如何被持续推进
- 决策、验证、发布如何可追踪
- 文档与结构化状态如何清晰分层

## 为什么不用 active goal

当前实践里，阶段性推进语义已经由 top-level plans 和 task tree 承担。

如果再额外维护一份 active goal，就会同时出现：

- end goal 一份
- active goal 一份
- current plans 一份

这会制造重复真相源，而不是减少混乱。

## 为什么拆开

如果把当前活跃目标直接称为“最终目标”，会产生两个问题：

1. 阶段性交付目标会看起来像永久产品使命
2. 当前计划和目标边界会重复表达并逐渐漂移

因此当前仓库采用的原则是：

- 长期方向和最终目标由文档解释并由 `.opendaas/goals/end.yaml` 锚定
- 当前推进焦点由 `.opendaas/plans/current.yaml` 和 `.opendaas/tasks/current.yaml` 承担
- 实时数值和状态统一在 `Console` 导航组查看

## 阅读建议

- 要看最终结构化目标：读 `.opendaas/goals/end.yaml`，或直接看 Console
- 要看当前执行焦点：读 `.opendaas/plans/current.yaml` 与 `.opendaas/tasks/current.yaml`
- 要看长期方向和语义边界：继续读本页
- 要看工程接手方式：转到 [Development](../engineering/development.md)
