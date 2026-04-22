---
name: version-readiness-iteration-1
description: OpenDaaS 向公开 alpha 可记录基线推进的高层 change 说明。
---

# version-readiness-iteration-1

## Why

最小自举闭环和生产化补强已经证明 OpenDaaS 的方向成立，但它还不具备正式版本记录和对外试用时最关键的几个入口能力。

当前最短板是：

1. 新项目无法直接通过 CLI 生成 OpenDaaS 工作区
2. 既有项目无法安全接入 OpenDaaS
3. 最小工作流指导路径和版本记录路径还没有被真正打通

## Scope

当前 change 覆盖：

1. `init`
2. `adopt`
3. bootstrap / adoption 自动化测试
4. minimum workflow guidance artifacts
5. generic `decision` CLI 最小闭环
6. structured version-record control plane
7. 向公开 alpha 基线推进的任务树与共享文档同步

## Current Status

当前状态：**done**

已完成：

- `init` 内部验证版
- `adopt` 内部验证版
- bootstrap 测试补齐
- minimum workflow guidance artifacts
- first-time agent usage flow validation
- `decision new / list / show / decide`
- `version new / list / show / update / record`
- `.opendaas/versions/records.yaml` 与 `docs/internal/versions/` 投影
- `validate --repair` 与 adopted workspace schema hardening

## Validation Targets

该 change 完成时至少应满足：

1. `opendaas init` 可在空目录创建最小工作区
2. `opendaas adopt` 可在既有项目中安全补齐 `.opendaas/` 与 docs 锚点
3. 两者都具备基本幂等性
4. 下一轮可直接围绕工作流指导与项目级版本记录继续推进
