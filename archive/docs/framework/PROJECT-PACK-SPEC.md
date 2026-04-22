---
name: OpenDaaS 共享项目文档包规范
description: 定义 OpenDaaS 官方推荐的通用 `docs/` 文档包分层与最小结构。
---

# OpenDaaS Shared Docs Package Specification

## 1. 目的

本文档定义 OpenDaaS 对通用项目文档包的官方推荐。

它回答三件事：

1. OpenDaaS 是否应该提供文档包最佳实践
2. 这套最佳实践应该约束到什么程度
3. 一个任何项目都可采用的最小文档包结构应该长什么样

## 2. 当前结论

OpenDaaS 应该提供文档包最佳实践，但只应标准化“文档意图分层”，不应过度介入具体项目的业务文档细节。

因此官方推荐应满足：

1. 任何项目都可使用
2. 不预设业务模块、API、架构、部署等具体页面
3. 不复制 OpenDaaS 当前仓库自身的历史结构
4. 作为推荐 profile 存在，而不是强制目录契约

## 3. 设计原则

### 3.1 只标准化最小通用要素

OpenDaaS 只应要求：

- 项目是什么
- 项目目标是什么
- 存在对外文档区
- 存在内部文档区

除此之外，不应替项目预设更多内容结构。

### 3.2 文档分层优先于文档内容

最佳实践的核心不是“每个项目都要有同样的页面”，而是“每个项目都应把共享、对外、内部三类文档语义分开”。

### 3.3 推荐而不强制

这套结构是 OpenDaaS 官方推荐的通用 profile。

它可以用于：

- skill 中的最佳实践示例
- 后续脚手架的默认参考方案
- 人类和开发端 Agent 的文档组织建议

但它当前不是：

- 工作区合法性的强制条件
- CLI 当前版本的固定目录契约

## 4. 官方推荐的最小文档包结构

当前官方推荐的通用最小结构是：

```text
docs/
  shared/
    overview.md
    goal.md
  public/
  internal/
```

## 5. 各分层职责

### 5.1 `docs/shared/`

这是人类与开发端 Agent 共用的共享上下文层。

它只承载最核心、最稳定的项目理解锚点。

当前官方推荐至少包含：

- `docs/shared/overview.md`
- `docs/shared/goal.md`

#### `docs/shared/overview.md`

必须回答：

- 项目是什么
- 项目为什么存在
- 项目的基本边界是什么

#### `docs/shared/goal.md`

必须回答：

- 项目要到哪里
- 为什么这是当前目标
- 完成标准或成功条件是什么

### 5.2 `docs/public/`

这是对外文档层。

它用于放置面向外部用户、集成方、消费者、合作方或公开受众的 authored docs。

它当前不要求必须预置具体页面，因为并不是所有项目在一开始就有对外文档内容。

但目录本身应作为一个清晰语义区存在。

### 5.3 `docs/internal/`

这是内部文档层。

它用于放置面向维护者、开发者、运行者的 authored docs。

典型内容可能包括：

- 开发说明
- 架构说明
- 运维说明
- 内部约束

但这些内容不是最小 profile 的强制页面。

## 6. 为什么这是当前最佳实践

这套最小结构优于更重的模板化目录，原因是：

1. 它对任何项目都成立
2. 它不把 OpenDaaS 当前仓库的偏差固化成官方推荐
3. 它不会误导开发者和 Agent 以为每个项目都必须预先具备一整套业务文档
4. 它已经足够表达文档包中最重要的语义分层

## 7. OpenDaaS 不应做什么

OpenDaaS 当前不应把以下内容写成官方默认文档包要求：

- `api.md`
- `architecture.md`
- `deployment.md`
- `runbooks.md`
- `guides/`
- `reference/`
- `modules/`
- 任何预设项目业务结构的区块

这些内容只有在具体项目确实需要时才应扩展。

## 8. 与 `.opendaas/` 的关系

这套文档包结构和 `.opendaas/` 的边界必须清楚：

- `docs/` 是 authored context
- `.opendaas/` 是结构化控制面

更具体地说：

- 项目介绍与目标的叙述性内容放在 `docs/shared/`
- 对外说明放在 `docs/public/`
- 内部维护说明放在 `docs/internal/`
- 结构化 project / goal / plan / task / decision / version 状态放在 `.opendaas/`

## 9. 与当前仓库和脚手架的关系

当前 OpenDaaS 仓库仍处于历史结构向更通用 profile 收敛的过程中。

因此需要明确：

1. 本规范定义的是官方推荐 profile
2. 它不要求当前仓库立刻完全重构为该结构
3. 当前 CLI 的默认 scaffold 已采用这套最小 profile
4. 具体项目仍可在此基础上自由扩展

## 10. 最低合格条件

一个符合 OpenDaaS 官方推荐的最小文档包，至少应满足：

1. 存在 `docs/shared/overview.md`
2. 存在 `docs/shared/goal.md`
3. 存在 `docs/public/` 语义区
4. 存在 `docs/internal/` 语义区

这四项已经足以表达通用项目文档包的最小结构。

## 11. 当前结论

当前可以明确：

> **OpenDaaS 应该提供通用文档包最佳实践，但只应标准化最小分层语义，不应替项目预设业务文档细节。**

更具体地说：

> **`docs/shared/overview.md`、`docs/shared/goal.md`、`docs/public/`、`docs/internal/` 是当前官方推荐的最小通用文档包结构。**
