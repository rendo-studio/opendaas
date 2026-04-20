---
name: Agent Usage
description: 面向开发端 Agent 的稳定接手说明页，解释应读什么和应信什么。
---

# Agent Usage

本页是说明页，不是实时状态页。

开发端 Agent 当前应遵循的原则是：

- 书面背景和边界从 `docs/` 读取
- 实时结构化状态从 `.opendaas/` 读取，必要时再结合 Console
- 对外权威指南来自 CLI 内置的 `opendaas guide`，工作区内的 `.agents/skills/opendaas-workflow/SKILL.md` 只是同一内容的本地镜像

## Round Start

1. 读取 [Goal Context](../project/goal.md)
2. 读取 [Development](./development.md)
3. 运行 `opendaas status show`
4. 按需检查 `.opendaas/goals/end.yaml`、`.opendaas/plans/current.yaml`、`.opendaas/tasks/current.yaml`
5. 如需 UI 视图，运行 `opendaas site open` 并查看 Console

## 不要依赖什么

- 不要把普通 markdown 里的口头进度描述当成唯一真相源
- 不要把 docs 页面中的说明性文字误判为结构化状态
- 不要把 total task nodes 和 progress units 混为一谈

## 推荐命令

```bash
npm run dev -- validate --repair
npm run dev -- status show
npm run dev -- status sync
npm run dev -- site open
npm run dev -- site stop
```
