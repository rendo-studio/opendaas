---
name: Live Docs Spec
description: 定义实时文档站、页面编辑边界、差异历史与全局 runtime 模型。
---

# Live Docs Spec

## 目标

把 `site open / dev / build` 的语义、可编辑边界、差异历史与全局 runtime 模型一次说清。

## `site open / dev / build`

- `site open`
  - 打开当前最新快照
  - 允许查看，不默认承担持续 watch
- `site dev`
  - 启动本地 watcher
  - 监听 `docs/` 与关键 `.opendaas/` 控制面
  - 变化后立刻 restage、重建运行时数据，并驱动页面自动刷新
- `site build`
  - 构建当前快照
  - 输出静态站点产物到全局 runtime 下的站点实例目录

## 页面边界

OpenDaaS 站点页分三类：

### Editable

- 允许人在页面内直接修改
- 写回 `docs/` 源文件
- 写入后应记录 `human` 来源签名

### Projection

- 来源完全是结构化控制面投影
- 页面内不开放自由编辑
- 典型页面：
  - `project/goal.md`
  - `project/status.md`
  - `project/current-work.md`
  - `engineering/agent.md`

### Hybrid

- 页面仍有人工叙述价值
- 但其中部分 sections 由 CLI / 控制面持续回写
- 页面内应明确展示哪些 sections 受控

## 差异历史模型

最小差异模型分三层：

- `baseline.json`
  - 当前已确认基线
- `pending.json`
  - 当前相对基线的未确认差异
- `history.json`
  - append-only 事件流
  - 记录每次 `diff check` 发现的差异快照与每次 `diff ack`

`history.json` 不替代 `pending.json`，它负责回答：

- 上一次发生了什么
- 当前变化是从哪里演化来的
- 页面刷新后为什么还能看到上一个版本和当前版本的差异摘要

## 全局 runtime 模型

- 站点模板属于 OpenDaaS 包自身，不属于项目真相源
- 每个 docs/workspace 源对应一个全局 site runtime 实例目录
- 运行时目录至少包含：
  - staged `content/docs`
  - `runtime-data/control-plane.json`
  - `runtime-data/version.json`
  - `runtime-data/runtime.json`
  - 本地 dev/build 产物

项目仓库不应承担这些运行时缓存职责。

## 当前结论

OpenDaaS 的实时文档站应当被视为：

- 一个以 `docs/` 为共享现实源
- 以 `.opendaas/` 为结构化控制面
- 以全局 runtime 为本地执行容器
- 以页面边界模型控制可编辑性的协作前台
