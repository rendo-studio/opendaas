---
name: Development
description: 当前仓库的人类与开发端 Agent 接手方式、本地命令与目录入口。
---

# Development

当前仓库通过 OpenDaaS 的 `docs/` 与 `.opendaas/` 双落点推进。

## 接手顺序

1. 先读 [OpenDaaS Docs](../index.md)
2. 再读 [Project Overview](../project/overview.md)
3. 再读 [Goal Context](../project/goal.md)
4. 查看 Console
5. 上下文不确定时运行 `opendaas status show`

## 本地命令

```bash
npm install
npm run check
npm run test
npm run build
npm run dev -- --help
```

## 目录入口

- `src/bin/`：CLI 入口
- `src/cli/`：命令树定义
- `src/core/`：控制面、bootstrap、status、site、agent 等核心逻辑
- `site-runtime/`：Next.js / Fumadocs 运行时模板
- `test/`：自动化测试

## 工作约束

- 高频 plan / task 维护优先直接更新 `.opendaas/`
- 当前焦点优先通过 top-level plans 和 task tree 表达，而不是新增一层 active goal
- `docs/` 保持为共享书面文档，不再承载自动回写的 live status 摘要
- 共享文档统一使用 `name + description` 头部元信息

## Agent Artifact

开发端 Agent 的权威工作协议来自 CLI 内置的 `opendaas guide`，工作区生成的 `.agents/skills/opendaas-workflow/SKILL.md` 与其内容完全一致。
