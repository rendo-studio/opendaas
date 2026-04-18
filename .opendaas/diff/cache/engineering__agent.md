---
name: Agent Usage
description: 面向开发端 Agent 的稳定接手说明页，解释应读什么和应信什么。
---

# Agent Usage

本页是说明页，不是实时状态页。

开发端 Agent 当前应遵循的原则是：

- 书面背景和边界从 `docs/` 读取
- 实时结构化状态从 `.opendaas/` 读取，必要时再结合 Console
- 最小执行协议以 `.opendaas/agent/SKILL.md` 为准

## Round Start

1. 读取 [Goal Context](../project/goal.md)
2. 读取 [Development](./development.md)
3. 运行 `opendaas diff check`
4. 检查 `.opendaas/goals/end.yaml`、`.opendaas/plans/current.yaml`、`.opendaas/tasks/current.yaml`
5. 如需 UI 视图，查看 Console

## 不要依赖什么

- 不要把普通 markdown 里的口头进度描述当成唯一真相源
- 不要把 docs 页面中的说明性文字误判为结构化状态
- 不要把 total task nodes 和 progress units 混为一谈

## 推荐命令

```bash
npm run dev -- validate --repair
npm run dev -- diff check
npm run dev -- diff ack
npm run dev -- status show
npm run dev -- site dev --path .
```
