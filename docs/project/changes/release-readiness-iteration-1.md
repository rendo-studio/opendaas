---
name: release-readiness-iteration-1
description: OpenDaaS 向公开 alpha 可发布基线推进的当前高层 change 说明。
---

# release-readiness-iteration-1

## Why

最小自举闭环和生产化补强已经证明 OpenDaaS 的方向成立，但它还不具备对外发布时最关键的几个入口能力。

当前最短板是：

1. 新项目无法直接通过 CLI 生成 OpenDaaS 工作区
2. 既有项目无法安全接入 OpenDaaS
3. Agent 最小适配路径和安装发布路径还没有被真正打通

## Scope

当前 change 覆盖：

1. `init`
2. `adopt`
3. bootstrap / adoption 自动化测试
4. minimum agent adaptation artifact
5. generic `decision` CLI 最小闭环
6. structured release / changelog control plane
7. 向公开 alpha 基线推进的任务树与共享文档同步

## Current Status

当前状态：**in progress**

已完成：

- `init` 内部验证版
- `adopt` 内部验证版
- bootstrap 测试补齐
- minimum agent adaptation artifact
- first-time agent usage flow validation
- `decision new / list / show / decide`
- `release new / list / show / update / publish`
- `.opendaas/releases/records.yaml` 与 `docs/project/releases/` 投影
- `validate --repair` 与 adopted workspace schema hardening

待完成：

- installation and release path

## Validation Targets

该 change 完成时至少应满足：

1. `opendaas init` 可在空目录创建最小工作区
2. `opendaas adopt` 可在既有项目中安全补齐 `.opendaas/` 与 docs 锚点
3. 两者都具备基本幂等性
4. 下一轮可直接围绕 agent 适配和安装发布继续推进
