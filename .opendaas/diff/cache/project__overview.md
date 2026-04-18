---
name: Project Overview
description: OpenDaaS 项目是什么、解决什么问题，以及如何理解项目介绍、最终目标与当前计划的关系。
---

# Project Overview

OpenDaaS 是一个 `CLI-first` 的人类开发者与开发端 Agent 项目上下文控制面框架。

它不试图替代 Git、issue tracker 或外部知识库，而是解决另一类问题：在一个具体项目里，如何同时维护 **共享文档** 与 **结构化工作区状态**，让人类和 Agent 可以在同一套现实上推进工作。

## 项目摘要

OpenDaaS 通过 `.opendaas/` 持久化项目控制面，再通过本地文档站和 CLI 把这些结构化状态暴露给人类与开发端 Agent。

## 它管理什么

- 项目目标与边界
- 计划、任务与进度
- 重要决策与 release 记录
- 共享文档与本地文档站
- 文档差异和工作区校验

## 项目介绍、最终目标与当前计划

项目介绍回答“这个项目是什么”。

end goal 回答“最终要到哪里”。

current plans 回答“当前这一轮具体怎么推进”。

三者不能混用：

- 项目介绍应相对稳定
- end goal 应相对稳定并贯穿完整闭环
- current plans 可以随着阶段推进而变化

## 从哪里继续

- 需要 live 结构化视图时，进入 `Console`
- 需要理解最终目标时，读 [Final Goal](./goal.md)
- 需要理解任务与进度口径时，读 [Status Model](./status.md) 和 [Task Model](./tasks.md)
