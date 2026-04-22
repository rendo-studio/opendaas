---
name: 当前工作
description: 记录 VibeCoding 当前高层焦点、执行计划与任务树。
---

# Current Work

在 OpenDaaS 里，“当前工作”由三层东西共同定义：

1. end goal
2. top-level plans
3. current task tree

这三层一起决定当前工作区正在推动什么，而不是单靠一段文案。

## End Goal

end goal 说明这个项目最终要到哪里。

它负责约束当前推进范围，但不直接承担阶段计划语义。

## Top-level Plans

top-level plan 负责把 end goal 切成几个当前可观察的 workstream。

Console 会直接显示这些顶层 workstream 及其状态。

## Task Tree

task tree 负责把每个 workstream 落成可执行节点。

如果需要理解当前具体做过什么、还剩什么、哪些是 grouping node，应该直接查看 Console 的 tasks 视图。

## 为什么不再手工抄写

“当前工作”是会频繁变化的。

如果同时在 markdown 里再维护一份静态摘要，最终只会得到：

- 结构化真相源一份
- 文档口头摘要一份
- 两者逐渐偏离

因此当前仓库采用的做法是：

- 结构化当前工作由 `.opendaas/` 维护
- 文档只解释 current work 的组织方式

## 最终目标锚点

当前所有执行工作都以“OpenDaaS long-term end goal”作为最高优先级锚点。

## 当前高层焦点

- Align safe adopt and project-level version records

## 当前高层计划

- Switch init and adopt to the minimal docs package safely
- Finalize project-level version records
- Align docs, guidance, and runtime projections with the new model

这些 plan 的执行状态由 task tree 在读取时自动派生，不在 `plans/current.yaml` 中单独持久化。

## 当前不做什么

- public hosted docs platform
- full SaaS control plane
- multi-agent orchestration
- cloud sync
