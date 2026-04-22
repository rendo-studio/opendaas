---
name: OpenDaaS Version Spec
description: 定义 OpenDaaS 如何以结构化 version records 作为项目级正式版本记录的唯一事实源。
---

# OpenDaaS Version Spec

## 1. 目的

本规范用于固定 OpenDaaS 的项目级版本记录模型。

它回答的是：

- 版本记录的唯一事实源应该是什么
- 什么时候值得记录一个版本
- `change`、`validation` 与 `version` 的关系是什么
- 人类可读的版本页面如何从结构化记录派生

## 2. 基本判断

OpenDaaS 不应把普通 task 进展自动拼接成 changelog，也不应要求开发端 Agent 高频写版本记录。

更合理的方式是：

1. 以 `.opendaas/versions/records.yaml` 作为唯一结构化事实源
2. 让维护者或开发端 Agent 在版本边界到来时维护低频 `version` entry
3. 由 CLI 派生 `docs/internal/versions/*.md`

## 3. 真相源分层

### 3.1 控制面真相源

位于：

- `.opendaas/versions/records.yaml`

职责：

- 持久化项目级版本记录
- 承载结构化 highlights / breaking changes / migration notes / validation summary
- 作为未来对外发布说明或内部里程碑说明的稳定输入

### 3.2 共享可读投影

位于：

- `docs/internal/versions/index.md`
- `docs/internal/versions/<entry>.md`

职责：

- 为人类提供版本记录入口
- 为文档站提供可阅读的版本页

## 4. 与其他对象的关系

- `task`
  - 是执行单元，不是版本记录
- `plan`
  - 是执行流，不是版本记录
- `change`
  - 是高层变化主线，可以成为版本记录的候选证据
- `validation`
  - 表示该版本是否经过足够验证
- `version`
  - 表示项目进入了新的整体成熟状态并被正式记录

## 5. 最小数据结构

每条 version entry 至少应包含：

- `id`
- `version`
- `title`
- `summary`
- `status`
  - `draft`
  - `recorded`
- `decisionRefs`
- `highlights`
- `breakingChanges`
- `migrationNotes`
- `validationSummary`
- `createdAt`
- `recordedAt`

## 6. 合理写入时机

### 6.1 当项目进入一个新的整体成熟状态时

创建 `draft` version entry。

### 6.2 当维护者决定该状态值得长期保留时

补充：

- `highlights`
- `breakingChanges`
- `migrationNotes`
- `validationSummary`

并把状态推进为 `recorded`。

## 7. 不应写入 version record 的内容

以下内容通常不应直接进入 version entry：

- 普通 task 状态变化
- 单个 plan 完成
- 高频内部小修
- 纯内部格式修补
- 尚未形成稳定边界的实验性噪声

## 8. 当前结论

当前可以明确：

> **OpenDaaS 的项目级版本记录应该是低频的结构化 `version` entry，而不是被 `release` 或 task 日志语义混淆的混合物。**

更具体地说：

> **开发端 Agent 或维护者应在“项目进入新的整体成熟状态并决定正式记录”时维护 `.opendaas/versions/records.yaml`，再由 CLI 投影到 `docs/internal/versions/`。**
