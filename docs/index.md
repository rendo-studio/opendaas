---
name: VibeCoding 项目入口
description: VibeCoding 的共享入口页，概览最终目标、当前进度与阅读路径。
---

# OpenDaaS

OpenDaaS 通过共享文档包和结构化控制面来帮助人类开发者与开发端 Agent 对齐项目现实。

OpenDaaS 是一个 `CLI-first` 的人类开发者与开发端 Agent 项目上下文控制面框架。

它不试图替代 Git、issue tracker 或外部知识库，而是解决另一类问题：在一个具体项目里，如何同时维护 **共享文档** 与 **结构化工作区状态**，让人类和 Agent 能持续对齐项目现实，而不是在一堆黑盒代码和失真的说明里摸索。

## OpenDaaS 管理什么

- 项目目标与边界
- 项目介绍与最终目标
- 计划、任务与进度
- 重要决策与项目级版本记录
- 共享文档与本地文档站
- 工作区校验与本地协作视图

## OpenDaaS 的两个核心落点

- `docs/`
  - 面向人类和开发端 Agent 的共享文档包
  - 用来记录共享背景、对外说明、内部说明和框架参考
- `.opendaas/`
  - 面向工具和运行时的结构化工作区
  - 用来持久化 project overview、end goal、plan、task、decision、version 等显式事实

## 当前工作区怎么读

1. 先读本页，理解 OpenDaaS 的职责边界
2. 再读 [Shared Overview](./shared/overview.md)
3. 再读 [Shared Goal](./shared/goal.md)
4. 再读 [Status Model](./project/status.md)
5. 需要开发接手时读 [Development](./engineering/development.md)
6. 需要框架规范时进入 [Framework Overview](./framework/index.md)

站点中的 live 控制台视图由 runtime 内建，不依赖项目 authored docs 自行提供 `console/` 目录。

## 导航

### Shared

- [Shared Overview](./shared/overview.md)
- [Shared Goal](./shared/goal.md)

### Project

- [Project Overview](./project/overview.md)
- [Goal Context](./project/goal.md)
- [Status Model](./project/status.md)
- [Current Work](./project/current-work.md)
- [Task Model](./project/tasks.md)
- [Decisions](./project/decisions/index.md)

### Engineering

- [Development](./engineering/development.md)
- [Agent Usage](./engineering/agent.md)

### Internal

- [Versions](./internal/versions/index.md)

### Framework

- [Framework Overview](./framework/index.md)

## 一句话定义

VibeCoding 是一个采用 OpenDaaS 框架推进的项目。

## 默认入口

文档站默认入口是 Console。共享介绍与背景请阅读 [Shared Overview](./shared/overview.md)。

## 项目介绍

OpenDaaS 是一个 `CLI-first` 的人类开发者与开发端 Agent 项目上下文控制面框架。

## 边界与非目标

- public hosted docs platform
- full SaaS control plane
- multi-agent orchestration
- cloud sync

## 从哪里开始

建议阅读顺序：

1. Console
2. [Shared Overview](./shared/overview.md)
3. [Shared Goal](./shared/goal.md)
4. [Status Model](./project/status.md)
5. [Task Model](./project/tasks.md)
6. [Engineering Development](./engineering/development.md)

## 文档导航

### 项目现实

- [Shared Overview](./shared/overview.md)
- [Shared Goal](./shared/goal.md)
- [当前状态](./project/status.md)
- [当前工作](./project/current-work.md)
- [任务闭环](./project/tasks.md)
- [Decisions](./project/decisions/index.md)

### 开发入口

- [Engineering Development](./engineering/development.md)

### 内部记录

- [Versions](./internal/versions/index.md)
