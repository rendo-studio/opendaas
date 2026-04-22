---
name: OpenDaaS PRD
description: 重新定义 OpenDaaS 的产品定位、范围、原则与核心能力。
---

# OpenDaaS PRD

## 产品定义

OpenDaaS 是一套面向人类开发者与开发端 Agent 协作的项目上下文控制面框架。

它提供：

- 稳定的共享文档分层建议
- 稳定的内部工作区结构
- project / goal / plan / task / decision / version 等控制面原语
- 面向开发端 Agent 的最小工作协议
- 与具体方法论解耦的 CLI 护栏
- 本地 docs-site 运行时

## 不做什么

OpenDaaS 不定义：

- 唯一正确的方法论
- 唯一正确的编码流派
- 托管式 SaaS 控制平面
- 多 Agent 编排平台
- 默认的产品对外文档站

## 核心问题

OpenDaaS 解决的不是“如何替用户做决策”，而是：

- 如何让项目现实稳定可见
- 如何让 Agent 不只依赖会话上下文推进
- 如何让 authored docs 与结构化控制面长期保持一致
- 如何让重要决策、验证结果和项目级版本记录可追溯

## 产品原则

- 方法论中立：核心层不绑定外部方法论
- Agent-first：`.opendaas/` 优先服务开发端 Agent 的读写模型
- Authored docs 与结构化控制面分离：`docs/` 是 authored context，`.opendaas/` 是结构化真相层
- 最小侵入：adopt 不能破坏已有项目
- 派生视图读取时计算：不依赖手动 sync

## 核心能力

- `guide`
- `init / adopt`
- `validate`
- `project / goal / plan / task / status`
- `decision`
- `version`
- `site`

## 对外与对内边界

OpenDaaS 推荐项目拥有：

- `docs/shared/` 共享层
- `docs/public/` 对外层
- `docs/internal/` 内部层

但这只是通用 profile，不是强制目录契约。

## 决策与版本控制面的定位

- `decision` 只用于高价值节点
- `version` 只用于低频、项目级的正式版本记录

日常实现推进、范围内优化和普通修复，不应默认触发 `decision` 或 `version`
