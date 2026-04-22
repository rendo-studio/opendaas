---
name: Decision Spec
description: 定义 OpenDaaS 中通用 decision 控制面的边界、字段与使用时机。
---

# Decision Spec

## 定义

`decision` 是 OpenDaaS 中面向高价值节点的通用决策记录。

它不是某种方法论的别名，也不绑定任何固定的审查哲学。

## 落点

- `.opendaas/decisions/records.yaml`

如果需要人类可读的决策文档，应通过每条 decision record 的 `docPath` 显式绑定 authored docs 页面。
OpenDaaS 不应假设决策文档固定落在某个目录，也不应自动投影到 `docs/project/decisions/`。

## 字段

每条 decision 至少包含：

- `id`
- `name`
- `description`
- `category`
- `proposedBy`
- `context`
- `impactOfNoAction`
- `expectedOutcome`
- `boundary`
- `status`
- `decisionSummary`
- `revisitCondition`
- `createdAt`
- `decidedAt`

如果需要人类可读决策文档，可额外包含：

- `docPath`

## 推荐触发时机

- 新最终目标
- 目标显著变化
- 范围扩张
- 架构路线切换
- 高成本 change
- 不可逆高影响选择
- 发布策略变化

## 不推荐触发时机

- 常规任务推进
- UI 微调
- 范围内小功能升级
- 低风险重构
- 普通实现细节

## 状态

- `pending`
- `approved`
- `rejected`
