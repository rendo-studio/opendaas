---
name: Init Spec
description: 固定 OpenDaaS `init` 的输入、输出、覆盖策略与安全边界。
---

# Init Spec

## 目的

本规范定义 `opendaas init` 的当前正式边界。

它覆盖两类目标：

1. 新目录初始化
2. 已有项目的安全接入

## 命令定位

`opendaas init` 是唯一的公开 bootstrap 入口。

它必须根据目标目录状态自动判断：

- 空目录：生成新工作区
- 已有仓库：以非侵入方式补入 OpenDaaS 控制面

## 输出契约

`init` 必须生成或补齐：

- `.opendaas/` 固定结构
- 最小 authored docs package
- `AGENTS.md`
- `.agents/skills/opendaas-workflow/SKILL.md`

## 固定生成结构

### .opendaas

- `.opendaas/meta/workspace.yaml`
- `.opendaas/config/workspace.yaml`
- `.opendaas/state/active.yaml`
- `.opendaas/project/overview.yaml`
- `.opendaas/goals/end.yaml`
- `.opendaas/plans/current.yaml`
- `.opendaas/tasks/current.yaml`
- `.opendaas/tasks/archive.yaml`
- `.opendaas/decisions/records.yaml`
- `.opendaas/versions/records.yaml`

### docs

- `docs/shared/overview.md`
- `docs/shared/goal.md`
- `docs/public/`
- `docs/internal/`

说明：

- 这是默认生成的最小 docs package 示例
- 它不是运行时必须依赖的固定目录契约
- 后续 authored docs 绑定应通过 `.opendaas` 中的显式 `docPath` 维护

## 安全边界

当 `init` 作用于已有仓库时：

- 不得重写现有 authored docs 正文
- 不得覆盖同路径同名的现有 Markdown 文件
- 不得改写用户代码目录
- 只能补 OpenDaaS 自己负责的缺失锚点和控制面文件

## 幂等规则

重复执行 `init` 必须满足：

- 不产生重复目录
- 不重复追加同一段模板正文
- 不改变未被 OpenDaaS 托管的用户内容
- 遇到同路径已有 authored docs 时直接跳过

## 当前结论

`init` 的职责不仅是初始化新工作区，也包括安全接入已有项目。
