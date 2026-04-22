---
name: OpenDaaS 共享文档目录协议规范
description: 定义 OpenDaaS 官方推荐文档包 profile 的最小目录结构与职责映射。
---

# OpenDaaS Docs Directory Specification

## 1. 目的

本文档把官方推荐的通用文档包 profile 映射到具体目录。

它回答的是：

1. 推荐 profile 的最小目录应该长什么样
2. 每个目录负责什么
3. 哪些路径是推荐固定锚点，哪些只是语义区

## 2. 当前推荐 profile

当前 OpenDaaS 官方推荐的最小目录结构为：

```text
docs/
  shared/
    overview.md
    goal.md
  public/
  internal/
```

这是一套推荐 profile，也是当前 CLI 默认 scaffold 的最小 docs package 结构。

## 3. 目录职责

### 3.1 `docs/shared/`

共享层。

用于放置人类与开发端 Agent 都需要首先理解的公共项目上下文。

固定推荐页面：

- `docs/shared/overview.md`
- `docs/shared/goal.md`

### 3.2 `docs/public/`

对外层。

用于放置面向外部受众的 authored docs。

当前不预设具体页面。

### 3.3 `docs/internal/`

内部层。

用于放置面向维护者、开发者、运行者的 authored docs。

当前不预设具体页面。

## 4. 固定推荐锚点

### 4.1 `docs/shared/overview.md`

这是推荐 profile 里的项目介绍锚点。

必须回答：

- 项目是什么
- 项目为什么存在
- 项目的基本边界是什么

### 4.2 `docs/shared/goal.md`

这是推荐 profile 里的目标锚点。

必须回答：

- 项目要到哪里
- 为什么这是当前目标
- 成功条件是什么

## 5. 为什么不再推荐更重的固定路径

OpenDaaS 当前不再把以下内容作为官方最小目录要求：

- `docs/index.md`
- `docs/project/status.md`
- `docs/project/current-work.md`
- `docs/project/tasks.md`
- `docs/project/changes/index.md`
- `docs/engineering/development.md`

原因不是这些内容永远不需要，而是：

1. 它们并不对任何项目都具备普适性
2. 它们过度反映了 OpenDaaS 自身历史实践
3. 它们容易误导开发者和 Agent，把“当前仓库结构”误当成“通用最佳实践”

## 6. 扩展规则

在最小 profile 之上，项目可以自由扩展：

- `docs/public/` 下的对外说明
- `docs/internal/` 下的开发、架构、运维、集成说明
- 任何适合当前项目的其他 authored docs

原则是：

1. 有真实内容需求再扩展
2. 不预先塞入大量空页面
3. 保持 `shared / public / internal` 的语义清晰

## 7. 与当前仓库的关系

当前 OpenDaaS 仓库仍保留部分历史目录与页面结构。

因此这份规范表达的是：

- 官方推荐 profile

而不是要求所有现有仓库立即强制重构为同一布局。

## 8. 与脚手架的关系

当前 `init/adopt` 已默认生成这套最小 profile。

现有仓库是否进一步采用它，仍应由维护者按需决定。

## 9. 当前结论

当前可以明确：

> **OpenDaaS 官方推荐的最小通用文档包目录，不应过度预设项目内容，只应固定 `shared / public / internal` 三层语义。**

更具体地说：

> **`docs/shared/overview.md`、`docs/shared/goal.md`、`docs/public/`、`docs/internal/` 是当前推荐 profile 的最小目录协议。**
