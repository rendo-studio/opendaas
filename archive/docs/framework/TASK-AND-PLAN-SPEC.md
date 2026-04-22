---
name: Task And Plan Spec
description: 定义 OpenDaaS 中结构化 plan / task 的边界与推荐维护方式。
---

# Task And Plan Spec

## 结构

- `plan` 表达高层工作拆分
- `task` 表达具体执行项

落点：

- `.opendaas/plans/current.yaml`
- `.opendaas/tasks/current.yaml`
- `.opendaas/tasks/archive.yaml`

## 原则

- `plan` 绑定到当前 `goal`
- `task` 绑定到某个 `plan`
- `task` 可以有父子关系
- 叶子任务可用于 progress 计算
- 已关闭的大任务应进入 `tasks/archive.yaml`，形成闭环历史

## Agent-first 维护方式

高频 task / plan 维护以直接编辑 `.opendaas/` 为主。

CLI 中的 `plan` / `task` 命令属于：

- 辅助入口
- 调试入口
- 人类手工修复入口

它们不是唯一合法的维护路径。

## 何时初始化一轮 plan / task

当项目已经有正式 `goal`，并且当前 change 已进入执行阶段时，就应初始化一版结构化 plan / task。
