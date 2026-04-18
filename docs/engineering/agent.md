---
name: Agent Usage
description: OpenDaaS 当前工作区面向开发端 Agent 的最小使用说明。
---

# Agent Usage

## 当前工作区摘要

- Goal: OpenDaaS public release baseline
- Summary: 将 OpenDaaS 推进到可对外发布的公开 alpha 基线，补齐可运行的 init/adopt、稳定的本地文档站运行时、最低可用的 Agent 接入路径、安装分发与更强的验证护栏。
- Phase: Completed
- Progress: 100%
- Active change: release-readiness-iteration-1

## 开发端 Agent 最小工作流

1. 先读取 `docs/project/goal.md`、`docs/project/status.md`、`docs/project/current-work.md`
2. 每轮任务开始前运行 `opendaas diff check`
3. 范围内直接推进，越界时升级
4. 高频 task / plan 维护优先直接更新 `.opendaas/` 工作区
5. 用 CLI 做校验、差异处理、状态投影、站点运行时与 agent artifact 同步

## 何时记录正式决策

仅在以下情况触发：

- 新最终目标
- 目标差异化变更
- 大范围 scope 扩张
- 新的显著成本 change
- 架构路线切换
- 不可逆高影响决策

常规 UI 优化、范围内功能升级、低风险重构和已批准 change 内的实现推进，不应默认阻塞在 formal decision 上。
