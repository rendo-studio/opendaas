---
name: OpenDaaS 文档头部元信息规范
description: 定义 OpenDaaS 体系内文档统一使用的最小头部元信息规范。
---

# OpenDaaS 文档头部元信息规范
## OpenDaaS Document Metadata Specification v1

**版本：** v1.1  
**状态：** 当前主稿  
**产品工作名：** `OpenDaaS`  
**CLI 名：** `opendaas`  
**性质：** 核心规范  
**依赖：** [命名空间规范](./NAMESPACE-SPEC.md)、[共享项目文档包规范](./PROJECT-PACK-SPEC.md)、[内部工作区规范](./WORKSPACE-SPEC.md)

---

## 1. 文档目的

本文档定义 OpenDaaS 体系中 Markdown 文档统一使用的头部元信息规则。

它要解决的是：

- 文档站如何快速索引文档
- CLI 如何快速识别文档
- 后续 skill 如何消费文档
- 如何避免在每个文档里重复堆砌冗余字段

---

## 2. 基本判断

在 OpenDaaS 中，任何进入规范体系的 Markdown 文档都必须具有标准头部元信息。

这里的“任何文档”包括：

1. `docs/` 中的共享文档
2. `.opendaas/` 中的 Markdown 文档
3. 当前规范文档本身
4. 后续会被文档站索引或被 skill 消费的文档

但当前版本的元信息必须尽量克制。

因此，当前第一版的正式判断是：

1. 所有文档统一采用 **YAML front matter**
2. 所有文档最少只要求两个字段：`name` 与 `description`
3. 其他会造成角色重复、语义冲突或维护负担的字段，不作为默认要求

---

## 3. 标准格式

当前统一格式如下：

```md
---
name: 当前状态
description: 记录项目当前推进状态、风险与下一步动作。
---
```

---

## 4. 最小必填字段

所有文档都必须包含以下字段：

1. `name`
2. `description`

---

## 5. 字段含义

### 5.1 `name`

`name` 是文档的人类可读主名。

它用于：

- 文档站索引与导航
- CLI 输出展示
- 后续 skill 消费

要求：

1. 必须可读
2. 必须能说明文档是什么
3. 不应只写内部对象编号

### 5.2 `description`

`description` 是文档用途的最小摘要。

它用于：

- 帮助人类快速判断是否要继续阅读
- 帮助 CLI 和后续 skill 做轻量索引
- 在不引入额外字段的前提下提供最小上下文

要求：

1. 必须一句话说明文档用途
2. 不应只是重复 `name`
3. 不应为空

---

## 6. 为什么不默认要求更多字段

当前版本不把以下字段作为统一必填要求：

- `title`
- `docType`
- `status`
- `visibility`
- `audience`
- `lastUpdated`

原因是：

1. `title` 与 `name` 重复
2. `visibility` 可由命名空间推断
3. `docType` 可由路径与固定锚点角色推断
4. `audience` 在当前体系中常与路径和命名空间重复
5. `lastUpdated` 不应靠手工维护 front matter 来承担真实更新时间

一句话说：

> **当前版本优先统一最小元信息，而不是让每份文档携带一套容易失真的字段包。**

---

## 7. 路径与命名空间承担什么职责

在当前版本中，以下信息应优先由路径和命名空间承担，而不是写进 front matter：

### 7.1 共享或内部可见性

由命名空间承担：

- `docs/` 表示共享文档
- `.opendaas/` 表示内部工作区文档

### 7.2 文档角色

由稳定路径承担：

- `docs/project/goal.md` 是最终目标锚点
- `docs/project/status.md` 是当前状态锚点
- `docs/project/current-work.md` 是当前工作锚点
- `docs/engineering/development.md` 是开发入口锚点

### 7.3 更新时间

由版本控制或 CLI 运行状态承担，不强制要求写进 front matter。

---

## 8. 示例

### 8.1 共享文档示例

```md
---
name: 当前状态
description: 记录项目当前推进状态、主要风险与下一步动作。
---
```

### 8.2 内部工作区文档示例

```md
---
name: 当前轮次内部计划
description: 记录当前开发轮次的内部执行拆解与临时推进说明。
---
```

### 8.3 规范文档示例

```md
---
name: OpenDaaS 原生任务与计划管理规范
description: 定义 OpenDaaS 原生 goal、plan、task、progress 的结构化管理规则。
---
```

---

## 9. 与 skill 的兼容性

当前把所有文档统一压缩到 `name + description`，也服务后续 skill 派生。

原因是：

1. 这两个字段已经满足 skill 最小索引需求
2. 统一字段集能减少规范与 skill 之间的转换损耗
3. 后续若产出 `SKILL.md`，也不需要再额外发明另一套最小头部规则

---

## 10. CLI 与文档站职责

`opendaas` 至少应能够：

1. 校验文档是否存在 front matter
2. 校验 `name` 是否存在
3. 校验 `description` 是否存在
4. 基于路径和命名空间补足文档角色判断

文档站至少应能够：

1. 读取 `name`
2. 读取 `description`
3. 只索引 `docs/` 中的共享文档

---

## 11. 不合格状态

以下情况应视为文档元信息规范未落地：

1. 文档没有 front matter
2. 缺少 `name`
3. 缺少 `description`
4. `name` 或 `description` 为空
5. 继续把 `title / docType / status / visibility / audience / lastUpdated` 作为统一必填字段

---

## 12. 当前结论

当前可以明确：

> **所有 OpenDaaS 体系内 Markdown 文档都必须具有标准头部元信息。**

更具体地说：

> **当前第一版统一只要求 `name` 与 `description` 两个字段；其他重复或易失真的字段不作为默认要求。**

---

## 13. 下一步

在元信息最小字段被固定后，后续应继续回答：

1. CLI 如何自动补齐缺失的 `name` 和 `description`
2. 后续是否需要为特定文档类型引入非默认扩展 profile
