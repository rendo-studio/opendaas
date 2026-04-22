---
name: Final Goal
description: VibeCoding 的最终目标、完成标准与非目标锚点页。
---

# Goal Context

VibeCoding 的正式目标已经固定到共享控制面，并作为后续计划、任务与状态的最高优先级锚点。

这个页面是解释页，不是实时控制台。

当前 live structured end goal 以 `.opendaas/goals/end.yaml` 为准。Console 会直接读取这份结构化数据；本页负责解释“长期方向”和“当前 plans / tasks”之间的关系。

## 长期方向

OpenDaaS 的长期方向不是堆更多页面，而是把它收敛成一套清晰、可持续、方法论中立的人类与开发端 Agent 协作控制面。

我们希望它最终稳定回答的是：

- 目标如何被锚定
- 范围如何被控制
- 任务与计划如何被持续推进
- 决策、验证、项目级版本记录如何可追踪
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

## 最终目标

OpenDaaS long-term end goal

让 OpenDaaS 成为面向 Agent 编程的项目上下文控制面最佳实践框架，提供清晰稳定的人类开发者与开发端 Agent 协作标准，以及从项目介绍、最终目标、计划、任务、决策、工作流指南到验证和项目级版本记录的完整闭环。

## 背景与理由

当前项目已经进入正式推进阶段，因此需要把最终目标固定到共享文档包中，避免后续目标漂移。

## 完成标准

- OpenDaaS defines stable standards for project overview, end goal, plans, tasks, decisions, version records, and workflow guidance
- OpenDaaS keeps authored docs, structured workspace state, and local docs-site views aligned for human developers and development agents
- OpenDaaS supports a complete and repeatable loop from project understanding to planning, implementation, validation, and version recording
- Human developers and development agents can initialize OpenDaaS in new or existing repositories, follow an authoritative workflow guide, and reach a correct first closed loop without guessing undocumented conventions
- OpenDaaS provides production-grade guardrails around bootstrap, validation, automatic derived-state consistency, site runtime, packaging, and existing-project initialization UX across real project edge cases

## 明确不做什么

- public hosted docs platform
- full SaaS control plane
- multi-agent orchestration
- cloud sync

## 当前进度摘要

当前进度由 Console 与 `opendaas status show` 在读取时自动计算，不在 `.opendaas` 中单独持久化。
