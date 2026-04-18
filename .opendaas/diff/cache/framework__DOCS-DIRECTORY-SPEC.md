---
name: OpenDaaS 共享文档目录协议规范
description: 定义 docs 共享文档包的固定锚点路径与自适应扩展规则。
---

# OpenDaaS 共享文档目录协议规范
## OpenDaaS Docs Directory Specification v1

**版本：** v1.1  
**状态：** 当前主稿  
**产品工作名：** `OpenDaaS`  
**CLI 名：** `opendaas`  
**性质：** 实施规范  
**依赖：** [共享项目文档包规范](./PROJECT-PACK-SPEC.md)、[命名空间规范](./NAMESPACE-SPEC.md)、[CLI 命令面规范](./CLI-SPEC.md)

---

## 1. 文档目的

本文档把 `docs/` 的固定锚点映射到具体目录和路径。

它要回答的是：

- `docs/` 至少应有哪些固定路径
- 哪些路径必须始终存在
- 哪些区域允许按项目类型自适应扩展
- OpenDaaS CLI 应如何初始化这些路径

---

## 2. 基本判断

`docs/` 必须同时满足两件事：

1. 对人类而言，看起来像一个正常技术文档站
2. 对 Agent 而言，足以恢复项目高层上下文

这里的“技术文档站”默认指项目内部协作和开发使用的技术文档站，而不是产品对外帮助中心或消费端 Agent 文档面。

因此，目录协议应采用：

- **少量固定锚点**
- **大面积自适应扩展区**

而不是：

- 完全自由散乱
- 或把所有项目都压成一模一样的僵硬树

---

## 3. 固定路径总览

当前建议 `docs/` 至少存在以下固定路径：

```text
docs/
  index.md
  project/
    goal.md
    status.md
    current-work.md
    tasks.md
    changes/
      index.md
  engineering/
    development.md
```

说明：

- 这是最低必需锚点，不代表完整站点结构
- 其他内容区块可按项目需要扩展

---

## 4. 各固定路径职责

### 4.1 `docs/index.md`

定位：

- 整个共享文档包的入口页

必须回答：

- 项目是什么
- 项目为什么存在
- 当前总体目标是什么
- 新接手的人或 Agent 应先看什么

不要求回答：

- OpenDaaS 框架如何对外营销
- 最终用户如何使用项目产品
- 消费端 Agent 如何调用项目能力

### 4.2 `docs/project/status.md`

定位：

- 当前状态锚点

必须回答：

- 当前阶段
- 当前总体进展
- 当前进度
- 当前高层 blocker
- 下一步主要动作

### 4.3 `docs/project/goal.md`

定位：

- 最终目标锚点

必须回答：

- 最终目标是什么
- 为什么这是当前最终目标
- 完成标准是什么
- 当前明确不做什么

### 4.4 `docs/project/current-work.md`

定位：

- 当前工作锚点

必须回答：

- 当前 active work 是什么
- 当前高层 change / feature / page / capability 焦点是什么
- 当前高层计划是什么

### 4.5 `docs/project/changes/index.md`

定位：

- 变化可见锚点

必须回答：

- 最近有哪些重要变化
- 当前活跃 change 的高层范围是什么
- 哪些变化值得人类重点关注

### 4.6 `docs/project/tasks.md`

定位：

- 任务闭环锚点

必须回答：

- 当前完整任务树
- 最近完成事项
- 历史闭环入口

### 4.7 `docs/engineering/development.md`

定位：

- 开发入口锚点

必须回答：

- 如何本地运行
- 如何开发
- 如何测试
- 如何构建
- 如有必要，如何部署或验证

---

## 5. 条件性固定路径

以下路径不是对所有项目都强制立即存在，但只要对应内容成立，就应固定落位：

### 5.1 `docs/engineering/deployment.md`

当项目存在明确部署路径、环境要求或上线流程时，应提供该页。

### 5.2 `docs/project/decisions/`

当项目开始积累非临时性关键决策时，应建立该区块。

推荐入口：

```text
docs/project/decisions/index.md
```

### 5.3 `docs/project/releases/`

当项目开始形成阶段性发布或可感知版本结果时，应建立该区块。

推荐入口：

```text
docs/project/releases/index.md
```

---

## 6. 自适应扩展区

除了固定锚点和条件性固定路径之外，`docs/` 允许按项目类型扩展。

当前推荐的扩展区名称包括但不限于：

```text
docs/product/
docs/features/
docs/modules/
docs/guides/
docs/reference/
docs/api/
docs/contracts/
docs/protocols/
docs/integrations/
docs/architecture/
```

选择原则：

1. 有真实内容需求才建立
2. 名称尽量贴近常规技术文档站习惯
3. 不要把内部流程对象直接作为主要导航区块暴露给人类

---

## 7. 路径分层原则

### 7.1 `project/`

用于承载项目级协作与推进信息，例如：

- 当前状态
- 当前工作
- 高层 changes
- 决策
- releases

### 7.2 `engineering/`

用于承载工程接手与实现相关的长期说明，例如：

- 开发
- 部署
- 架构
- 集成

### 7.3 业务或能力区块

用于承载项目本身的业务能力、模块、产品结构和参考材料。

例如：

- `product/`
- `features/`
- `modules/`
- `reference/`

---

## 8. 页面命名规则

为保证人类可读性，`docs/` 中的页面命名应遵守：

1. 优先使用面向人类的语义名
2. 避免使用只对 OpenDaaS 自己有意义的内部流程名作为主页面名
3. 避免把函数级、组件级、内部 TODO 直接做成公开页面

推荐命名示例：

- `current-work.md`
- `development.md`
- `deployment.md`
- `changes/index.md`
- `api/authentication.md`

不推荐作为人类主导航命名：

- `task-state.md`
- `agent-loop.md`
- `internal-plan-003.md`
- `diff-cache.md`

---

## 9. Change 在 `docs/` 中的呈现规则

`docs/` 需要让人类看到当前高层 change，但不应把所有内部细节都直接公开。

推荐方式：

1. 在 `docs/project/changes/index.md` 提供高层变化可见入口
2. 对需要人类理解的 change，提供高层摘要页或子目录
3. 函数级、组件级和局部实现级内部计划仍留在 `.opendaas/`

一句话说：

> **`docs/` 负责展示“当前高层在做什么”，`.opendaas/` 负责保存“具体怎么在这一轮实现”。**

---

## 10. OpenDaaS CLI 的初始化要求

`opendaas init` 或 `opendaas adopt` 至少应能为 `docs/` 做到：

1. 创建固定路径骨架
2. 创建必要的入口页占位
3. 按项目类型选择一组示范扩展区模板
4. 避免生成大量空目录和空页面

CLI 的职责是：

- 提供稳定起点
- 提供示范结构

而不是：

- 替所有项目决定完整信息架构

---

## 11. 文档站映射要求

文档站至少应把以下固定路径映射为稳定导航入口：

1. `docs/index.md`
2. `docs/project/goal.md`
3. `docs/project/status.md`
4. `docs/project/current-work.md`
5. `docs/project/tasks.md`
6. `docs/project/changes/index.md`
7. `docs/engineering/development.md`

自适应扩展区则按内容存在情况加入导航。

---

## 12. 不合格状态

出现以下任一情况时，应视为 `docs/` 目录协议尚未落地：

1. 没有根入口页
2. 没有当前状态锚点
3. 没有当前工作锚点
4. 没有开发入口锚点
5. 文档结构充满内部流程对象命名，普通人无法理解
6. 高层变化没有稳定可见入口

---

## 13. 当前结论

当前可以明确：

> **`docs/` 的目录协议应采用“固定锚点 + 自适应扩展”的结构。**

更具体地说：

> **`docs/index.md`、`docs/project/goal.md`、`docs/project/status.md`、`docs/project/current-work.md`、`docs/project/tasks.md`、`docs/project/changes/index.md`、`docs/engineering/development.md` 是当前最小固定路径；其余区块应按项目类型自适应扩展。**

---

## 14. 下一步

在共享文档包路径映射被固定后，后续应继续回答：

1. [各固定页面的模板字段](./DOCS-TEMPLATE-SPEC.md)
2. 各项目类型的示范扩展模板
3. [文档站的最终导航与渲染规则](./DOCS-SITE-SPEC.md)
