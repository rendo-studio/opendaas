---
name: production-hardening-iteration-1
description: OpenDaaS 从最小自举闭环推进到更接近生产基线的高层 change 说明。
---

# production-hardening-iteration-1

## Why

最小自举闭环已经跑通，但这还不足以支撑更真实的日常开发。

这一轮 change 的目标，是把最容易暴露为技术债的几块基础控制面先补齐：

1. plan 不能只有同步，必须能写入和变更
3. site 不能只有 open/build，还要有显式 dev/clean 生命周期
4. 自动化测试和 init/adopt 契约必须提前收口

## Scope

当前 change 覆盖：

1. `plan add / update / sync`
3. `site dev / clean`
4. 基础自动化测试
5. `INIT-ADOPT-SPEC.md`

## Current Status

当前状态：**done**

已完成：

- plan 写入与变更流
- site runtime 生命周期命令
- vitest 基线测试
- init/adopt 契约规范

## Validation Targets

该 change 完成时至少应满足：

1. `opendaas plan` 可新增、更新与同步
3. `opendaas site dev / clean` 可管理本地站点生命周期
4. 当前仓库存在自动化测试并只覆盖当前项目本体
