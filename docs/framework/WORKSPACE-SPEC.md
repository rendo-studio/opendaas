---
name: OpenDaaS 内部工作区规范
description: 定义 `.opendaas/` 的职责边界与当前固定结构方向。
---

# OpenDaaS 内部工作区规范

## 1. 文档目的

本文档定义 `.opendaas/` 的职责边界。

它回答的是：

- `.opendaas/` 应承载什么
- `.opendaas/` 不应承载什么
- authored docs 与结构化控制面应该怎样分工

## 2. 基本判断

`.opendaas/` 是 Agent-first 的结构化控制面工作区。

它的职责不是给人类充当 authored docs 站点，而是给 CLI、docs-site runtime 和开发端 Agent 提供稳定、可预测的真相层。

因此，`.opendaas/` 应当：

1. 结构固定
2. 只持久化显式事实与结构化意图
3. 不混入会陈旧的纯计算缓存
4. 不直接作为对人类的 authored docs 暴露

## 3. 当前固定结构方向

当前最小固定骨架应至少包含：

1. `meta/`
2. `config/`
3. `state/`
4. `project/`
5. `goals/`
6. `plans/`
7. `tasks/`
8. `decisions/`
9. `versions/`

具体文件与字段以 [Workspace Data Spec](./WORKSPACE-DATA-SPEC.md) 为准。

## 4. 哪些内容应留在 `.opendaas/`

以下内容默认应留在 `.opendaas/`：

1. project overview 的结构化锚点
2. end goal
3. plan tree
4. task tree
5. active state
6. formal decisions
7. formal version records
8. docs-site runtime config

## 5. 哪些内容不应留在 `.opendaas/`

以下内容不应作为工作区真相被持久化：

1. authored docs 正文
2. 站点历史修订缓存
3. progress 百分比缓存
4. 纯派生 plan execution status
5. 需要靠手动 sync 才一致的计算态

## 6. 与 `docs/` 的关系

OpenDaaS 的边界必须清楚：

- `docs/` 是 authored context
- `.opendaas/` 是结构化真相层

更具体地说：

- `docs/shared/` 放共享介绍和共享目标
- `docs/public/` 放对外 authored docs
- `docs/internal/` 放内部 authored docs
- `.opendaas/` 放 project / goal / plan / task / decision / version 等结构化事实

## 7. 当前结论

当前可以明确：

> **`.opendaas/` 不是共享文档包，而是面向 CLI、runtime 和开发端 Agent 的结构化控制面。**

更具体地说：

> **`docs/` 负责 authored context；`.opendaas/` 负责 project、goal、plans、tasks、decisions、versions 与运行配置等显式事实。**
