---
name: bootstrap-opendaas-self-hosting
description: 让 OpenDaaS 开始使用 OpenDaaS 自己的框架推进自身开发的高层 change 说明。
---

# bootstrap-opendaas-self-hosting

## Why

OpenDaaS 如果不能先管理 OpenDaaS 自己，那么很多规范都只能停留在概念层。

这个 change 的目的是让 OpenDaaS 先成为第一个原始受益者。

## Scope

当前 change 覆盖：

1. 建立 OpenDaaS 自身的 `docs/` 项目现实锚点
2. 建立 OpenDaaS 自身的 `.opendaas/` 控制面骨架
3. 让 CLI 开始围绕这些文件做真实读写
4. 最终把这些文档渲染成可访问站点

## Current Status

当前状态：**done**

已完成：

- 文档与控制面规范
- 技术选型
- CLI 最小 spike
- 开发骨架重组

## Validation Targets

该 change 完成时至少应满足：

1. `opendaas goal` 有真实持久化
2. `opendaas task` 有真实 task tree 持久化
3. `opendaas plan` / `progress` 可计算
4. `opendaas site open` 可渲染当前项目文档包
