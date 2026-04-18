---
name: OpenDaaS Docs
description: OpenDaaS 的项目内入口，说明它是什么、管理什么，以及如何阅读当前工作区。
---

# OpenDaaS

OpenDaaS 是一个 `CLI-first` 的人类开发者与开发端 Agent 项目上下文控制面框架。

它不试图替代 Git、issue tracker 或外部知识库，而是解决另一类问题：在一个具体项目里，如何同时维护 **共享文档** 与 **结构化工作区状态**，让人类和 Agent 能持续对齐项目现实，而不是在一堆黑盒代码和失真的说明里摸索。

## OpenDaaS 管理什么

- 项目目标与边界
- 项目介绍与最终目标
- 计划、任务与进度
- 重要决策与 release 记录
- 共享文档与本地文档站
- 文档差异和工作区校验

## OpenDaaS 的两个核心落点

- `docs/`
  - 面向人类和开发端 Agent 的共享文档包
  - 用来记录背景、约束、说明、开发方式和框架参考
- `.opendaas/`
  - 面向工具和运行时的结构化工作区
  - 用来持久化 project overview、end goal、plan、task、progress、decision、release、diff 等数据

## 当前工作区怎么读

1. 先读本页，理解 OpenDaaS 的职责边界
2. 再读 [Project Overview](./project/overview.md)
3. 再读 [Goal Context](./project/goal.md)
4. 再读 [Status Model](./project/status.md)
5. 需要开发接手时读 [Development](./engineering/development.md)
6. 需要框架规范时进入 [Framework Overview](./framework/index.md)

站点中的 live 控制台视图由 runtime 内建，不依赖项目 authored docs 自行提供 `console/` 目录。

## 导航

### Project

- [Project Overview](./project/overview.md)
- [Goal Context](./project/goal.md)
- [Status Model](./project/status.md)
- [Current Work](./project/current-work.md)
- [Task Model](./project/tasks.md)
- [Changes](./project/changes/index.md)
- [Decisions](./project/decisions/index.md)
- [Releases](./project/releases/index.md)

### Engineering

- [Development](./engineering/development.md)
- [Agent Usage](./engineering/agent.md)

### Framework

- [Framework Overview](./framework/index.md)
