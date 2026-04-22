---
name: OpenDaaS CLI Spec
description: 定义 OpenDaaS CLI 的命令边界、职责分工与推荐使用方式。
---

# OpenDaaS CLI Spec

## CLI 角色

CLI 不是日常开发的唯一编辑器，而是 OpenDaaS 的控制面护栏。

CLI 主要负责：

- 初始化与接入
- 校验与修复
- 文档站运行时
- 结构化 project / goal / plan / task / decision / version mutation
- 显式维护 `docPath` 引用
- 输出渐进式工作流指南

CLI 不负责：

- 托管整个项目的全部编辑行为
- 取代直接编辑 `.opendaas/`
- 替项目定义对外文档站

## 命令组

当前正式命令面应保持为：

- `guide`
- `init`
- `validate`
- `project`
- `goal`
- `plan`
- `task`
- `status`
- `decision`
- `version`
- `site`

不应再暴露：

- `agent`
- `release`
- 独立的 existing-project bootstrap 命令
- 手动 `sync` ritual

## 使用原则

- 高频 plan / task 调整可以直接编辑 `.opendaas/`
- CLI 负责安全护栏、结构化写入和运行时动作
- 派生视图必须读取时计算，而不是依赖手动同步

## `init`

`init` 是唯一的公开 bootstrap 入口。

它同时处理：

- 空目录或新项目目录
- 已有仓库的安全接入

当前默认 docs scaffold 应使用最小通用文档包：

```text
docs/
  shared/
    overview.md
    goal.md
  public/
  internal/
```

当 `init` 作用于已有仓库时，必须是安全无侵入的：

- 只补 OpenDaaS 自己负责的控制面和最小锚点
- 不重写现有 authored docs 正文
- 不篡改已有项目的代码和目录结构

## `status`

`status show` 是只读派生视图。

它必须：

- 从当前 `.opendaas` 真相层直接读取
- 在读取时派生 phase、progress、next actions 和 blockers
- 不依赖手动 sync

## `version`

`version` 用于记录低频、项目级的正式版本状态。

如果需要人类可读的版本文档，应通过 `--doc-path` 显式绑定，而不是依赖固定 docs 目录投影。

它不是：

- task 日志
- 高频 change log
- 必然对外发布的 deploy 事件

它适用于：

- 项目进入新的整体成熟状态
- 项目达到一个值得长期保留的版本边界
- 维护者决定正式记录该版本

## `validate`

`validate` 必须检查：

- 当前工作区锚点文件是否齐全
- 当前 schema / template surface 是否对齐
- 关键控制面文件是否可读

`validate --repair` 只负责当前 schema 的修复，不承担历史版本迁移器职责。

## 当前结论

OpenDaaS CLI 应被视为轻量控制面护栏，而 `init` 应作为唯一 bootstrap 入口覆盖新建与既有项目两类场景。
