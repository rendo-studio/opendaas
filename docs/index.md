---
name: VibeCoding 项目入口
description: VibeCoding 的共享入口页，概览最终目标、当前进度与阅读路径。
---

# OpenDaaS Docs

OpenDaaS 通过共享文档包和内部控制面来帮助 Human-Agent 协作推进项目。

OpenDaaS 是一套 `CLI-first`、方法论中立的 Human-Agent 协作规范框架。

这里的 `docs/` 及其站点投影默认服务项目内部协作，不等同于产品对外文档站；框架自身的默认使用指南优先通过 CLI 与 skills 暴露。

它关注的是：

- 如何固定项目目标与范围
- 如何把共享项目现实沉淀到 `docs/`
- 如何把内部控制面沉淀到 `.opendaas/`
- 如何让 Agent 在受控前提下持续推进
- 如何让变更、验证、发布与重要决策可追踪

OpenDaaS 不把任何特定方法论、技能包或编码流派绑定为核心定义。

## 阅读顺序

1. [Framework Overview](./framework/index.md)
2. [PRD](./framework/PRD.md)
3. [Concepts](./framework/CONCEPTS.md)
4. [CLI Spec](./framework/CLI-SPEC.md)
5. [Decision Spec](./framework/DECISION-SPEC.md)
6. [Goal And Progress Spec](./framework/GOAL-AND-PROGRESS-SPEC.md)
7. [Task And Plan Spec](./framework/TASK-AND-PLAN-SPEC.md)
8. [Release Spec](./framework/RELEASE-SPEC.md)

## 核心原则

- `docs/` 是人类与 Agent 共用的共享项目现实
- `.opendaas/` 是内部控制面工作区
- 目标、范围、变更、决策、验证、发布都应有稳定落点
- 高频 task / plan 维护允许直接编辑 `.opendaas/`
- CLI 主要承担初始化、校验、差异处理、投影同步、站点运行时与适配产物生成

## 一句话定义

VibeCoding 是一个采用 OpenDaaS 框架推进的项目。

## 最终目标

将 OpenDaaS 推进到可对外发布的公开 alpha 基线，补齐可运行的 init/adopt、稳定的本地文档站运行时、最低可用的 Agent 接入路径、安装分发与更强的验证护栏。

## 当前进度

当前默认进度：**100%**

## 边界与非目标

- public hosted docs platform
- multi-agent orchestration
- cloud sync and SaaS control plane

## 从哪里开始

建议阅读顺序：

1. [最终目标](./project/goal.md)
2. [当前状态](./project/status.md)
3. [当前工作](./project/current-work.md)
4. [任务闭环](./project/tasks.md)
5. [变化入口](./project/changes/index.md)
6. [发布入口](./project/releases/index.md)
7. [开发入口](./engineering/development.md)

## 文档导航

### 项目现实

- [最终目标](./project/goal.md)
- [当前状态](./project/status.md)
- [当前工作](./project/current-work.md)
- [任务闭环](./project/tasks.md)
- [Changes](./project/changes/index.md)
- [Decisions](./project/decisions/index.md)
- [Releases](./project/releases/index.md)

### 开发入口

- [Engineering Development](./engineering/development.md)

### 框架参考

- [Framework Overview](./framework/index.md)
