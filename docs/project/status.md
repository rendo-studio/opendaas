---
name: Status Model
description: 当前工作区如何定义 phase、progress、task node 与 closure。
---

# Status Model

OpenDaaS 里的状态不是一段口头描述，而是一组结构化控制面数据。

这页的职责不是重复当前数值，而是说明这些数值在当前工作区里分别代表什么。

## Phase

`phase` 是当前顶层推进阶段的简化读法。

它来自顶层 plan 状态，而不是手工写在文档里的标签。Console 会直接显示这个值。

## Progress

`progress` 只统计 `countedForProgress: true` 的任务。

这意味着：

- grouping task 不进入进度分母
- plan 本身不进入进度分母
- 只有被明确标记为 progress unit 的任务才会影响百分比

## Total Task Nodes

当前任务树里还会存在不计入进度的节点，例如：

- 顶层 task group
- 中间分组节点

所以 `total task nodes` 和 `progress units` 从来都不是同一个数。

## Closure

已完成并退出当前 live tree 的任务，会进入 `.opendaas/tasks/archive.yaml`。

当前项目的归档模型已经存在，但还没有形成长期累积的 archived closures。

## 阅读建议

- 想看当前数值：看 Console
- 想理解这些数值的口径：看本页
