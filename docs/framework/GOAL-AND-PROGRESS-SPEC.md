---
name: Goal And Progress Spec
description: 定义最终目标锚点与进度投影的最小规范。
---

# Goal And Progress Spec

## 最终目标

项目必须存在一个正式 `end goal` 锚点，落在：

- `.opendaas/goals/end.yaml`
- `docs/shared/goal.md`

该锚点是项目长期方向的最高优先级目标定义。

## 何时更新 end goal

以下情况需要更新 end goal：

- 当前最终目标被确认改变
- 当前目标摘要已经无法准确代表当前项目现实

目标改写不应由普通状态更新隐式完成，必要时应配套一条正式 `decision`。

## 进度投影

项目进度默认从结构化 task 叶子节点计算，并同步到：

- `docs/shared/goal.md`
- `docs/project/status.md`

## 当前状态

`docs/project/status.md` 应回答：

- 当前阶段是什么
- 当前进度是多少
- 最近完成了什么
- 当前 blocker 是什么
- 下一步做什么
