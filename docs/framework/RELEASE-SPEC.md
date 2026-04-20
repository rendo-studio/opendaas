---
name: OpenDaaS Release And Changelog Spec
description: 定义 OpenDaaS 如何以结构化 release records 作为唯一事实源，并同步生成人类可读的发布与更新日志。
---

# OpenDaaS Release And Changelog Spec

## 1. 目的

本规范用于固定 OpenDaaS 的项目级迭代更新日志与发布记录模型。

它回答的是：

- 版本或迭代级 changelog 的唯一事实源应该是什么
- 开发端 Agent 何时应该写入 release entry
- `change`、`status` 与 `release` 的关系是什么
- 人类可读的发布日志应该如何从结构化记录派生

## 2. 基本判断

OpenDaaS 不应直接把环境噪声自动拼接成 changelog，也不应要求开发端 Agent 每次自由重写整篇发布日志。

更合理的方式是：

1. 以 `.opendaas/releases/records.yaml` 作为唯一结构化事实源
2. 让开发端 Agent 维护结构化 release entry
3. 由 CLI 同步派生 `docs/project/releases/*.md`

## 3. 真相源分层

### 3.1 控制面真相源

位于：

- `.opendaas/releases/records.yaml`

职责：

- 持久化版本或迭代级发布记录
- 承载结构化 highlights / breaking changes / migration notes / validation summary
- 为未来对外发布日志提供稳定输入

### 3.2 共享可读投影

位于：

- `docs/project/releases/index.md`
- `docs/project/releases/<entry>.md`

职责：

- 为人类提供发布与更新日志入口
- 为文档站提供 Releases 页面

## 4. 与其他对象的关系

  - 候选证据源，不是 changelog 真相源
- `change`
  - 记录高层变化主线
- `status`
  - 记录当前执行态
- `release`
  - 记录一轮最终交付了什么

## 5. 最小数据结构

每条 release entry 至少应包含：

- `id`
- `version`
- `title`
- `summary`
- `status`
  - `draft`
  - `frozen`
  - `published`
- `changeRefs`
- `decisionRefs`
- `highlights`
- `breakingChanges`
- `migrationNotes`
- `validationSummary`
- `startedAt`
- `closedAt`
- `publishedAt`

## 6. 合理写入时机

### 6.1 开启新一轮 release / iteration 时

创建 `draft` entry。

### 6.2 一个 change 完成或归档时

更新当前 `draft` entry，补充：

- `changeRefs`
- `highlights`
- `breakingChanges`
- `migrationNotes`

### 6.3 准备发布或宣告这一轮完成时

将 entry 推进到：

- `frozen`
- `published`

并补齐：

- `validationSummary`
- `closedAt`
- `publishedAt`

## 7. 不应写入 release/changelog 的内容

以下内容通常不应直接进入 release entry：

- 普通 task 状态变化
- 纯内部重构
- 局部命名整理
- 无用户感知的格式修补
- 纯内部流程修正且不影响使用方式的变动

## 8. 当前结论

当前可以明确：

> **OpenDaaS 的 changelog 应该是结构化 release entry 的派生产物，而不是环境噪声的自动拼接物。**

更具体地说：

> **开发端 Agent 应在“新 release 开始 / change 完成 / 准备发布”这三个时机维护 `.opendaas/releases/records.yaml`，再由 CLI 投影到 `docs/project/releases/`。**
