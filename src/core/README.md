---
name: OpenDaaS 核心层目录说明
description: 说明 src/core 预留用于共享领域模型、文件系统操作与结构化状态读写。
---

# src/core

该目录预留给 OpenDaaS 的共享核心逻辑。

后续实现应优先落在这里的内容包括：

- 文档包与 `.opendaas` 的读写模型
- `goal / plan / task / progress` 的领域对象
- 差异追踪与确认逻辑
- 元信息校验
- 同步与投影规则
