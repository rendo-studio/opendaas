---
name: OpenDaaS MVP 实现计划
description: 定义 OpenDaaS 进入开发阶段后的最小实现切片、目录结构与推进顺序。
---

# OpenDaaS MVP 实现计划

## 1. 目的

本文档用于把 OpenDaaS 从“规范定义阶段”推进到“可执行开发阶段”。

它只回答三件事：

1. 当前 MVP 先做什么
2. 当前仓库如何组织才更适合开发
3. 代码实现按什么顺序推进最稳

---

## 2. 当前阶段判断

当前已经满足进入开发阶段的前置条件：

1. 概念边界已基本固定
2. CLI-first 产品形态已固定
3. `docs/` 与 `.opendaas/` 命名空间边界已固定
4. `goal / plan / task` 的控制面模型已固定，phase / progress 采用读取时派生
5. `aclip` 已通过最小可运行 spike
6. 文档站方向已固定为 `Fumadocs`

因此，当前结论是：

> **OpenDaaS 已准备好进入 MVP 开发阶段。**

---

## 3. MVP 技术基线

当前实现阶段的技术基线如下：

1. CLI 基座：`@rendo-studio/aclip`
2. 文档站运行时：`Fumadocs`
3. 文档站宿主：`Next.js App Router`
4. 语言：`TypeScript`
5. Node 运行时：`Node.js 22+`
6. 模块系统：`ESM`
7. 当前包管理策略：`npm`

补充约束：

1. 文件读写优先使用 Node 内建能力
2. 结构化状态以 `yaml + json` 为主
3. 技术选型先以低摩擦、快验证为优先，不先引入工作区复杂度

---

## 4. 当前仓库目录结构

进入开发阶段后，当前仓库应按以下职责组织：

```text
docs/                 # 规范、PRD、方法论、实现计划
src/
  bin/                # CLI 入口
  cli/                # ACLIP 命令树定义
  core/               # 共享领域模型与控制面核心逻辑
site-runtime/         # 内嵌式 Fumadocs 站点运行时
test/                 # 自动化测试
```

当前结构的核心意图是：

1. `src/` 只放 CLI 与共享核心代码
2. `site-runtime/` 单独留给 Fumadocs / Next.js
3. `docs/` 不再承担源码目录职责
4. 测试从一开始就预留独立位置

---

## 5. MVP 实现切片

### 5.1 第一切片：CLI 控制面骨架

先实现：

1. `goal`
2. `task`
3. `site open`
4. `validate`

目标：

- 先证明 `aclip` 命令树足够自然
- 先打通结构化输出与最小文件读写

### 5.2 第二切片：核心状态读写

实现：

1. `.opendaas/meta`
2. `.opendaas/goals/end.yaml`
3. `.opendaas/tasks/current.yaml`
4. 基于真实文件的 `goal set/show`
5. 基于真实文件的 `task add/list`

### 5.3 第三切片：计划树与派生状态视图

实现：

1. `plan` 命令组
2. `plans/current.yaml`
3. `progress` 自动计算
4. `status show` / Console 读取时派生 phase 与 progress

### 5.4 第四切片：共享文档差异

实现：

1. `status show`
2. 自动派生状态视图
3. `baseline.json`
4. `pending.json`

### 5.5 第五切片：文档站运行时

实现：

1. `site open`
2. `site dev`
3. `site build`
4. `site clean`
5. Fumadocs 站点运行时与全局运行时目录对接

---

## 6. 当前不做什么

MVP 开发阶段当前不做：

1. 多 Agent orchestration
2. 云端分享链接
3. 高级可视化 dashboard
4. 自动审批流
5. 复杂 AI 技能导出自动化

---

## 7. 当前结论

当前可以明确：

> **OpenDaaS 现在应从“继续补规范”切换到“按切片实现 MVP”。**

更具体地说：

> **当前仓库已经整理为 `docs + src + site-runtime + test` 的开发结构；接下来的开发应先实现 ACLIP 控制面与核心状态读写，再接入 Fumadocs 站点运行时。**
