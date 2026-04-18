---
name: OpenDaaS Concepts
description: 固定 OpenDaaS 的核心概念边界，确保框架定义层保持方法论中立。
---

# OpenDaaS Concepts

## 核心概念图

`goal -> change -> plan/task -> validation/release`

`decision` 是一个低频控制面，用来约束重要节点，不参与每一步日常开发。

## docs

`docs/` 是共享项目现实。

它默认服务于：

- 项目开发者
- 开发端 Agent
- 项目状态检查与接手协作

它不是：

- 产品官网
- 用户帮助中心
- 面向最终用户的说明站
- 面向消费端 Agent 的默认文档面

它应该承载：

- 项目介绍
- 最终目标
- 当前状态
- 当前工作
- changes
- decisions
- releases
- 工程入口

## .opendaas

`.opendaas/` 是内部控制面工作区。

它应该承载：

- 结构化目标状态
- 结构化 plan / task / progress
- active state
- diff baseline / pending / sources
- 结构化 decision 记录
- 结构化 release 记录
- Agent 适配产物

## goal

`goal` 是项目当前正式目标锚点。

它不是临时讨论，不应被状态页或随口承诺覆盖。

## change

`change` 是当前一条高层变化主线。

它定义本轮为何推进、覆盖什么、不覆盖什么、当前完成到哪里。

## plan / task

`plan` 用来表达高层拆分；`task` 用来表达执行项。

高频维护允许直接编辑 `.opendaas/plans/current.yaml` 与 `.opendaas/tasks/current.yaml`。

## decision

`decision` 是低频、通用、方法论中立的重要决策记录。

它用于记录：

- 为什么某个方向被批准或拒绝
- 为什么某个目标被确立或修改
- 为什么某个架构、范围或发布策略成立

`decision` 不是某种方法论本体，也不负责替团队思考。

## validation

`validation` 表示当前工作区、变更或发布是否已经过足够验证。

它可以来自测试、校验命令、验证总结和迁移修复结果。

## release

`release` 是面向迭代或版本的结构化更新记录。

它是 changelog 的真相源，不应由 diff 自动拼接，也不应依赖自由文本重写。

## agent adaptation

OpenDaaS 默认建模的是开发端 Agent，而不是消费端 Agent。

OpenDaaS 允许为开发端 Agent 提供技能包或适配文档，但这些都属于增强项，不属于核心定义层。
