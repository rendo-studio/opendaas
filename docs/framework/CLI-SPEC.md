---
name: OpenDaaS CLI Spec
description: 定义 OpenDaaS CLI 的命令边界、职责分工与推荐使用方式。
---

# OpenDaaS CLI Spec

## CLI 角色

CLI 不是细粒度项目编辑器，而是控制面护栏。

CLI 主要负责：

- 初始化与接入
- 校验与迁移
- 差异处理
- 文档投影
- 站点运行时
- Agent 适配产物
- 结构化 decision / release 记录
- 框架使用指南的渐进式披露

## 命令组

- `init`
- `adopt`
- `validate`
- `diff`
- `goal`
- `plan`
- `task`
- `status`
- `decision`
- `release`
- `site`
- `agent`

## 使用原则

- 高频 task / plan 更新优先直接编辑 `.opendaas/`
- CLI 负责护栏、同步与结构化投影
- 不要求所有操作都必须通过 CLI

## 使用指南职责

OpenDaaS 自身的默认使用指南不要求做成独立对外文档站。

更合理的默认职责分工是：

- CLI 负责按当前状态渐进式提示下一步
- skills 负责让开发端 Agent 在工作区内就地理解操作协议
- `docs/` 与 `site` 负责项目内部共享现实，而不是框架产品教程

## decision 组

`opendaas decision` 用于记录高价值节点。

支持：

- `opendaas decision new`
- `opendaas decision list`
- `opendaas decision show`
- `opendaas decision decide`

## release 组

`opendaas release` 用于维护结构化版本 / 迭代记录，并同步到 `docs/project/releases/`。

## validate

`validate` 必须检查：

- 工作区锚点文件是否齐全
- 文档元信息是否存在
- schema / template 版本是否需要升级
- 关键控制面文件是否可读

`validate --repair` 必须尽可能回填缺失锚点并升级当前模板。
