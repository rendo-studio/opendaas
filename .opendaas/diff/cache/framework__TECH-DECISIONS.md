---
name: OpenDaaS 技术决策记录
description: 记录 OpenDaaS 在实现阶段的重要技术选型、验证结果与当前决定。
---

# OpenDaaS 技术决策记录

## 1. 目的

本文档用于记录 OpenDaaS 在实现阶段的关键技术决策。

它不负责重写产品目标，而是负责沉淀：

- 选了什么
- 为什么选
- 实际验证结果是什么
- 当前决定是正式采用、暂缓还是放弃

---

## 2. 决策格式

每条决策至少记录：

1. 决策对象
2. 当前状态
3. 选择理由
4. 现场验证结果
5. 当前结论

---

## 3. TD-001：CLI 基座采用 `@rendo-studio/aclip`

### 3.1 决策对象

OpenDaaS CLI 的命令面基础实现是否尝试使用 `@rendo-studio/aclip`。

### 3.2 当前状态

**已通过最小可运行 spike，进入继续采用状态。**

当前仓库已落下一个最小可运行原型：

- `package.json`
- `tsconfig.json`
- `src/bin/opendaas.ts`
- `src/cli/app.ts`
- `src/cli/groups/*`
- `src/cli/commands/*`

当前 spike 覆盖的命令面包括：

- `goal set`
- `goal show`
- `task add`
- `task list`
- `site open`
- `validate`

---

### 3.3 为什么尝试它

尝试 `aclip` 的原因不是“它新”，而是它与 OpenDaaS 的方向有几处真实重合：

1. 它支持树状命令建模
2. 它默认输出 Markdown 风格帮助信息
3. 它有结构化 result / error envelope
4. 它对后续 skill 导出有明确兴趣点

这些都与 OpenDaaS 的需求相符：

- CLI-first
- 人类可读帮助
- Agent 可消费结构化输出
- 后续 skill 派生

---

### 3.4 现场验证结果

当前已验证通过的点：

1. 最小原型能够完成类型检查
2. 最小原型能够完成 TypeScript 构建
3. 顶层帮助页输出清晰
4. 分组帮助页输出清晰
5. 命令帮助页会自动展示 `Usage / Arguments / Examples`
6. `site open` 会输出结构化 JSON envelope，而不是随意字符串

验证时观察到的一个重要约束：

1. `aclip` 当前要求每个命令都显式提供 `examples`
2. 如果缺失 `examples`，不仅类型检查会失败，运行时也会直接报错

这说明它的契约比常见 CLI 库更严格。

这不是坏事，但意味着：

- OpenDaaS 之后要么接受这种严格性
- 要么自己在上层再包一层默认行为

---

### 3.5 当前优点

基于这次 spike，`aclip` 当前最明显的优点是：

1. 帮助信息开箱即用，且比常规 CLI 更适合文档化
2. 结构化输出非常贴合 Agent 消费场景
3. 命令树建模自然，适合 OpenDaaS 的多层命令组
4. 对后续 skill 方向有天然延展性

---

### 3.6 当前风险

基于这次 spike，当前主要风险也很明确：

1. 包仍然非常早期
2. 契约较严格，一些默认值不够宽容
3. 我们还没验证更复杂的命令场景，例如：
   - 多级计划树管理
   - 差异确认工作流
   - 站点运行时管理
   - 文件读写与错误恢复

---

### 3.7 当前结论

当前结论是：

> **OpenDaaS 当前正式采用 `@rendo-studio/aclip` 作为 MVP 阶段的 CLI 命令面基础。**

补充说明：

> **这不是永久不可逆锁定，但已经足以作为当前开发阶段的正式实现基座继续向下推进。**

---

## 4. TD-002：文档站运行时采用 `Fumadocs`

### 4.1 决策对象

OpenDaaS 的文档站运行时框架是否采用 `Fumadocs`。

### 4.2 当前状态

**已定稿。**

当前不再继续在 `VitePress / VuePress / Fumadocs` 之间摇摆，文档站运行时正式采用 `Fumadocs`。

### 4.3 为什么采用它

选择 `Fumadocs` 的原因是：

1. 它是现代 React 文档框架，适合 OpenDaaS 的长期方向
2. 它与 `shadcn/ui` 风格生态更接近
3. 官方明确支持 `Next.js`
4. 官方也明确把本地内容源作为标准能力的一部分

这对 OpenDaaS 很关键，因为我们需要的是：

- 从本地文档包渲染站点
- 由 CLI 启动本地站点
- 后续支持更强的组件化和可编程文档界面

### 4.4 官方实现边界

基于官方文档，当前实现边界应理解为：

1. OpenDaaS 的 Fumadocs 运行时宿主采用 `Next.js App Router`
2. 站点配置需要遵循 Fumadocs 的 Next.js 接入方式
3. Next.js 配置文件应按其要求使用 `.mjs`
4. 内容源优先面向本地文档包而不是数据库

### 4.5 当前结论

当前结论是：

> **OpenDaaS 文档站运行时正式采用 `Fumadocs + Next.js App Router`。**

补充说明：

> **站点运行时只是 CLI 的内部实现边界，不是第二产品表面。**

---

## 5. TD-003：当前工程基线采用 `Node.js 22 + TypeScript + ESM + npm`

### 5.1 决策对象

OpenDaaS 当前 MVP 阶段的工程基础环境如何固定。

### 5.2 当前结论

当前工程基线固定为：

1. `Node.js 22+`
2. `TypeScript`
3. `ESM`
4. `npm`

### 5.3 选择理由

1. 当前本地环境已经是 Node 22
2. `aclip` 和 `Fumadocs` 都与现代 ESM/TypeScript 方向兼容
3. 当前阶段优先降低工程切换成本，不先引入工作区层级复杂度
4. 后续如果演化出真正多包边界，再评估工作区管理策略

---

## 6. TD-004：当前仓库进入正式开发结构

### 6.1 决策对象

当前仓库是否已从“文档仓库 + spike 文件”切换到正式开发骨架。

### 6.2 当前结论

当前仓库结构正式收敛为：

1. `docs/`
2. `src/bin/`
3. `src/cli/`
4. `src/core/`
5. `site-runtime/`
6. `test/`

### 6.3 选择理由

1. `src/` 用于 CLI 与共享核心逻辑
2. `site-runtime/` 单独容纳 Fumadocs / Next.js 边界
3. `docs/` 保持为规范与项目文档区，而不是源码区
4. `test/` 从一开始预留，避免后面再返工目录

---

## 7. 下一步

围绕当前选型，下一轮实现应继续覆盖：

1. `plan` 命令树
2. `diff check / ack`
3. `site open / dev / build / clean`
4. 结构化结果与文件系统读写的结合
5. 错误场景下的 envelope 与退出码表现
