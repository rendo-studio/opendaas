---
name: OpenDaaS Skill 包派生规范
description: 定义 OpenDaaS 规范文档与后续 Agent skill 包之间的派生关系。
---

# OpenDaaS Skill 包派生规范
## OpenDaaS Skill Pack Specification v1

**版本：** v1.1  
**状态：** 当前主稿  
**产品工作名：** `OpenDaaS`  
**CLI 名：** `opendaas`  
**性质：** 核心规范  
**依赖：** [命名空间规范](./NAMESPACE-SPEC.md)、[文档头部元信息规范](./DOC-METADATA-SPEC.md)、[CLI 命令面规范](./CLI-SPEC.md)

---

## 1. 文档目的

本文档定义 OpenDaaS 规范文档与开发端 Agent skill 包之间的关系。

它要回答的是：

- 为什么 OpenDaaS 未来需要 skill 包
- skill 包应从哪里来
- 规范文档与 skill 包谁是权威来源
- 当前阶段是否应该立即产出 skill 包

---

## 2. 基本判断

OpenDaaS 的规范文档未来应能够被打包为开发端 Agent 使用的 skill。

原因很简单：

1. 没有对应 skill，Agent 很难稳定理解 OpenDaaS CLI 和规范
2. skill 可以把规范转化为 Agent 可消费的操作入口
3. 但规范文档本身仍应是权威来源

这里的 skill 默认服务于开发端 Agent，而不是消费端 Agent。

对 OpenDaaS 框架本身而言，skill 也是默认的使用指南载体之一。

一句话说：

> **文档是权威来源，skill 是从文档派生的 Agent 消费层。**

---

## 3. 当前阶段的判断

当前阶段还不应单独投入正式 skill 包产出。

原因是：

1. CLI 命令面还在继续收敛
2. `.opendaas/` 与 `docs/` 的规范仍在迭代
3. 过早固化 skill 会放大后续返工成本

因此，当前更合理的顺序是：

1. 先把规范文档写稳
2. 先把 MVP 相关规范与 CLI 能力跑通
3. 再把稳定版本的规范文档派生为 skill 包

---

## 4. 为什么不能反过来

skill 包不应反过来成为规范真相源。

否则会出现：

1. 规范与 skill 脱节
2. 人类无法直接审视 skill 所依赖的规则
3. 文档站、CLI、skill 三套现实分叉

---

## 5. skill 包至少应覆盖什么

一个可用的 OpenDaaS skill 包，至少应让开发端 Agent 理解：

1. `opendaas` CLI 的核心命令组
2. `docs/` 与 `.opendaas/` 的命名空间边界
3. 任务前必须执行 `diff check`
4. 最终目标锚点、plan tree、task tree 与 progress 的基本流转关系

---

## 6. 文档对 skill 派生的要求

如果规范文档未来要被派生为 skill，文档至少应具备：

1. 标准 front matter
2. `name`
3. `description`
4. 稳定的路径结构
5. 稳定的职责边界

---

## 7. 当前结论

当前可以明确：

> **OpenDaaS 规范文档未来应可被打包为开发端 Agent skill。**

更具体地说：

> **当前阶段先稳定规范与 MVP；正式的 OpenDaaS skill 包应在至少完成 MVP 后再产出。**

---

## 8. 下一步

在 skill 派生关系被固定后，后续应继续回答：

1. 哪些文档进入 skill 打包清单
2. `SKILL.md` 的最小入口说明应如何组织
