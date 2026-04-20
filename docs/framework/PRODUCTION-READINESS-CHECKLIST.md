---
name: Production Readiness Checklist
description: 定义 OpenDaaS 达到生产级闭环前必须满足的收口标准。
---

# Production Readiness Checklist

本清单定义 OpenDaaS 何时才能被认为达到“生产级”。

这里的“生产级”不是指已经做成 SaaS，而是指：

- 人类开发者能正确采用
- 开发端 Agent 能稳定接手
- 边界情况和关键缺口已经被收敛
- 100% 进度真正代表完整闭环

## 采用与上手

- `init` 和 `adopt` 可重复执行
- `opendaas guide` 可直接提供权威工作流入口
- `opendaas guide` 与 `.agents/skills/opendaas-workflow/SKILL.md` 内容完全一致并来自同一 CLI 资产
- 每个 CLI help 都会把用户引回 workflow guide
- 脚手架默认包含 `AGENTS.md`
- 脚手架默认包含 `.agents/skills/opendaas-workflow/SKILL.md`

## 控制面

- 项目介绍、最终目标、计划、任务、决策、发布都存在稳定结构化落点
- 当前焦点由 `plans + tasks` 表达，不再依赖额外 active goal
- Console 能读取这些结构化状态
- 人类能从 Console 直接编辑关键 `.opendaas` 状态

## 差异与校验

- `diff check` 以 `.opendaas` 为优先差异源
- `docs` 行级差异仍保留为次级上下文审计层
- `validate --repair` 能补齐关键锚点和 schema 缺口
- 工作区升级不会破坏已有 authored docs

## 运行时与分发

- `site-runtime` 随 CLI 显式分发
- 多项目 runtime staging 保持隔离
- 本地 docs site 能稳定启动、构建、清理

## 第一小时成功标准

一个从未接触过当前仓库的人类或开发端 Agent，应在第一小时内完成：

1. 看懂项目是什么
2. 看懂最终目标是什么
3. 看懂当前 plans 和 tasks
4. 跑通 `diff check`
5. 完成一次正确的小闭环
6. 不需要猜测 undocumented workflow
