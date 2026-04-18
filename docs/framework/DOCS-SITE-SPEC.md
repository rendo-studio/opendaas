---
name: OpenDaaS 文档站信息架构与渲染规范
description: 定义从 docs 到文档站的最小信息架构与渲染规则。
---

# OpenDaaS 文档站信息架构与渲染规范
## OpenDaaS Docs Site Specification v1

**版本：** v1.1  
**状态：** 当前主稿  
**产品工作名：** `OpenDaaS`  
**CLI 名：** `opendaas`  
**性质：** 实施规范  
**依赖：** [共享文档目录协议规范](./DOCS-DIRECTORY-SPEC.md)、[共享文档固定页面模板规范](./DOCS-TEMPLATE-SPEC.md)、[命名空间规范](./NAMESPACE-SPEC.md)、[实时文档站与编辑边界规范](./LIVE-DOCS-SPEC.md)

---

## 1. 文档目的

本文档定义从 `docs/` 到文档站的最小信息架构与渲染规则。

它要回答的是：

- 文档站至少应有哪些稳定导航入口
- 固定锚点页面如何在站点中呈现
- 自适应扩展区如何进入导航
- 哪些内容不能出现在站点里

---

## 2. 基本判断

文档站的职责不是创造第二套项目现实，而是把 `docs/` 渲染成人类友好的主界面。

这里的主界面默认面向：

- 项目开发者
- 项目维护者
- 开发端 Agent 的协作审视

它默认不是：

- 产品官网
- 最终用户帮助中心
- 消费端 Agent 的说明站

因此，文档站必须满足：

1. 只从 `docs/` 源文档派生
2. 优先帮助人类理解项目当前现实
3. 稳定暴露固定锚点
4. 有内容的自适应区块才进入导航
5. 不暴露 `.opendaas/` 内部工作区

---

## 3. 顶层导航要求

文档站至少应包含以下稳定顶层入口：

1. `Home`
2. `Project`
3. `Engineering`

其中：

- `Home` 对应 `docs/index.md`
- `Project` 对应项目级协作与推进信息
- `Engineering` 对应开发、部署、架构等工程信息

---

## 4. 固定锚点的导航映射

### 4.1 `Home`

映射：

- `docs/index.md`

作用：

- 项目入口
- 项目定义
- 阅读起点

### 4.2 `Project / Goal`

映射：

- `docs/project/goal.md`

作用：

- 最终目标锚点

### 4.3 `Project / Status`

映射：

- `docs/project/status.md`

作用：

- 当前状态总览

### 4.4 `Project / Current Work`

映射：

- `docs/project/current-work.md`

作用：

- 当前高层工作焦点

### 4.5 `Project / Changes`

映射：

- `docs/project/changes/index.md`

作用：

- 高层变化可见入口

### 4.6 `Project / Tasks`

映射：

- `docs/project/tasks.md`

作用：

- 当前完整任务树与闭环入口

### 4.7 `Engineering / Development`

映射：

- `docs/engineering/development.md`

作用：

- 开发接手入口

---

## 5. 条件性导航入口

以下导航入口在对应内容存在时应自动出现：

### 5.1 `Engineering / Deployment`

映射：

- `docs/engineering/deployment.md`

### 5.2 `Project / Decisions`

映射：

- `docs/project/decisions/index.md`

### 5.3 `Project / Releases`

映射：

- `docs/project/releases/index.md`

---

## 6. 自适应区块的导航规则

当 `docs/` 中存在以下区块时，文档站可将其作为扩展导航加入：

- `product/`
- `features/`
- `modules/`
- `guides/`
- `reference/`
- `api/`
- `contracts/`
- `protocols/`
- `integrations/`
- `architecture/`

加入规则：

1. 区块存在
2. 区块内有真实内容
3. 区块名称对人类可理解

如果只是空目录或内部流程命名，不应加入导航。

---

## 7. 首页呈现要求

首页至少应突出：

1. 最终目标
2. 当前进度
3. 一句话定义
4. 从哪里开始阅读
5. 当前状态与当前工作的快捷入口

首页不应被做成：

- 纯营销页
- 纯美化封面页
- 只有站点目录而没有项目摘要
- 框架产品或项目产品的对外介绍站

---

## 8. 项目区块呈现要求

`Project` 区块应优先突出：

1. 最终目标
2. 当前状态
3. 当前工作
4. Changes
5. Tasks
6. Decisions（存在时）
7. Releases（存在时）

理由：

- 这是人类最需要快速理解的部分
- 也是 Agent 协作被人类审视的主要入口

---

## 9. 工程区块呈现要求

`Engineering` 区块应优先突出：

1. Development
2. Deployment（存在时）
3. Architecture（存在时）
4. Integrations（存在时）

理由：

- 这是新人类维护者和新 Agent 接手时最先需要的工程入口

---

## 10. 变化可见性要求

文档站必须让人类无需翻 Git diff，也能快速理解：

1. 当前活跃 change 是什么
2. 最近完成了什么重要变化
3. 哪些变化需要重点关注

推荐渲染入口：

- `Project / Changes`
- 首页中的最近变化摘要卡片或链接

---

## 11. 最终目标与当前进度的可见性要求

文档站必须把以下信息放在最高可见区域：

1. 最终目标
2. 当前进度

推荐来源：

- 最终目标来自 `docs/project/goal.md`
- 当前进度来自 CLI 基于原生结构化 task tree 状态的计算结果

文档站不应通过解析 `docs/` 中任意 Markdown checkbox 来计算正式进度。

---

## 12. 可见性边界

文档站默认不应暴露以下内容：

1. `.opendaas/` 内部配置
2. 差异确认状态文件
3. Agent 微观开发计划
4. 当前轮次内部 TODO
5. CLI 中间态或缓存

如果某项信息需要被人类看见，正确做法是先提升到 `docs/`，而不是直接把 `.opendaas/` 暴露到站点。

---

## 13. 渲染规则

### 13.1 源优先

站点内容必须以 `docs/` 源文档为准。

### 13.2 无内容则不渲染导航

自适应区块若没有实际页面，不应占据导航位置。

### 13.3 固定锚点稳定可达

固定锚点页面必须始终有稳定入口，不应因为主题或导航重排而消失。

### 13.4 页面标题取人类语义

站点导航与页面标题应优先使用人类可理解的名称，而不是内部对象名。

---

## 14. OpenDaaS CLI 的职责

`opendaas site` 至少应能够：

1. 从 `docs/` 识别固定锚点页面
2. 从 `docs/` 识别存在内容的自适应区块
3. 读取最终目标与当前进度的展示入口
4. 构建稳定导航
5. 过滤 `.opendaas/` 和其他非共享源内容
6. 基于项目根路径或文档包路径启动本地站点
7. 通过本地链接直接暴露可访问结果
8. 将站点产物写入全局运行时目录而不是项目仓库

CLI 不应：

1. 把 `.opendaas/` 直接公开到站点
2. 依赖站点侧私有状态补全共享项目现实
3. 通过解析 Markdown checkbox 计算正式进度
4. 默认把站点构建产物写回项目仓库
5. 把框架使用指南或产品对外文档默认混入项目内部文档站

---

## 15. 不合格状态

出现以下任一情况时，应视为文档站 IA 与渲染规则尚未正确落地：

1. 首页没有最终目标和当前进度
2. 固定锚点页没有稳定导航入口
3. 导航充满内部流程对象名
4. `.opendaas/` 内容直接暴露到公开站点
5. 自适应区块只是空壳却占据主要导航

---

## 16. 当前结论

当前可以明确：

> **文档站必须稳定突出固定锚点，并按内容存在情况加入自适应导航。**

更具体地说：

> **`Home`、`Project`、`Engineering` 是当前最小稳定顶层导航；最终目标和当前进度必须处于最高可见区域；`.opendaas/` 不属于站点公开信息架构。**

---

## 17. 下一步

在文档站 IA 与渲染规则被定义后，后续应继续回答：

1. 具体视觉布局与首页模块
2. changes、decisions、releases 的更细渲染样式
3. 文档站编辑能力是否开放，以及如何安全回写 `docs/`
4. [实时文档站与编辑边界规范](./LIVE-DOCS-SPEC.md)
5. [文档站运行时规范](./SITE-RUNTIME-SPEC.md)
