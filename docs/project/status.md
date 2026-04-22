---
name: 当前状态
description: 记录 VibeCoding 当前推进状态、主要风险与下一步动作。
---

# Status Model

OpenDaaS 里的状态不是一段口头描述，而是一组结构化控制面数据。

这页的职责不是重复当前数值，而是说明这些数值在当前工作区里分别代表什么。

## Phase

`phase` 是当前顶层推进阶段的简化读法。

它来自当前 task tree 派生出来的顶层 plan 执行状态，而不是手工写在文档里的标签。Console 会直接显示这个值。

## Progress

`progress` 只统计 `countedForProgress: true` 的任务。

这意味着：

- grouping task 不进入进度分母
- plan 本身不进入进度分母
- 只有被明确标记为 progress unit 的任务才会影响百分比
- 这个值在读取时自动计算，不会作为独立缓存再次写回 `.opendaas`

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

## 状态摘要

当前围绕最终目标“OpenDaaS long-term end goal”推进，工作焦点是把 adopt 安全边界、最小 docs package 与项目级 version records 收口到一致的正式模型。

## 当前阶段

当前阶段：**Align safe adopt and project-level version records**

## 当前进度

当前进度通过 `countedForProgress: true` 的 task 在读取时自动计算。

- 共享真相源是 `.opendaas/tasks/current.yaml`
- Console 与 `opendaas status show` 会直接基于当前 task 状态派生百分比
- `.opendaas` 不再持久化独立的 progress 缓存文件

## 当前进展

- init / adopt 已切到最小 docs package 默认结构
- adopt 已收口到“同路径已有 authored docs 不重写”的非侵入模型
- `version` 已成为项目级版本记录的正式命令面

## 主要 blocker / 风险

- 暂无明确 blocker

## 下一步动作

- 完成当前仓库 authored docs、runtime projection 和 guide 的最终语义对齐

## 最近更新时间

2026-04-22T00:00:00.000Z
