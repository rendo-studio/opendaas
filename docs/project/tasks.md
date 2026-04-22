---
name: 任务闭环
description: VibeCoding 的任务清单、闭环视图与历史入口页。
---

# Task Model

VibeCoding 的任务状态由 .opendaas 控制面驱动，这里负责展示完整任务树、已完成闭环与历史入口。

OpenDaaS 的 task 不是只有 `name` 的平面清单。

当前工作区中的每个 task 至少应被理解为：

- `name`
- `summary`
- `status`
- `planRef`
- `parentTaskId`
- `countedForProgress`

## Name 与 Summary

`name` 用来快速识别任务。

`summary` 用来补充任务意图、范围或预期结果。Console 的 tasks 视图会同时展示这两层信息，而不是只堆一个名字列表。

## Grouping Node 与 Progress Unit

不是所有 task 都是 progress unit。

当前模型中存在两类节点：

- grouping node
  - 用来组织任务树
  - 不进入 progress 分母
- counted task
  - 进入 progress 计算
  - 代表真正可计入完成度的执行节点

## Task Tree

当前 live task graph 存在于 `.opendaas/tasks/current.yaml`。

Console 的 tasks 视图会直接渲染这棵树，而不是再生成一份独立静态列表。

## Archive

任务闭环之后，不应该一直留在 live tree 里。

已闭环任务会进入 `.opendaas/tasks/archive.yaml`，用来和当前 live tree 区分。

## Change 关联

如果某轮任务推进对应到具体 change，Console 的 tasks 视图也会把相关 change 页面一起展示出来。

## 当前任务树

- 待同步

## 最近完成

- 待同步

## 历史闭环

- 待同步
