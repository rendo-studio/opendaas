---
name: Engineering Development
description: VibeCoding 的开发入口、工程约束与本地推进说明。
---

# Development

VibeCoding 当前通过 OpenDaaS 的 docs/.opendaas 双命名空间推进。

## 环境要求

当前开发环境基线：

- Node.js 22+
- npm
- TypeScript

## 本地运行

当前已可用的本地命令：

```bash
npm install
npm run check
npm run build
npm run dev -- --help
```

## 开发方式

当前推荐的推进顺序：

1. 先通过 `docs/project/*.md` 理解最终目标、当前状态和当前工作
2. 每轮任务开始前运行 `opendaas diff check`
3. 高频 task / plan 维护优先直接更新 `.opendaas/` 工作区
4. 再用 CLI 执行 `validate / status sync / site / agent sync` 等护栏与派生动作

## 测试方式

当前已存在正式测试套件。

当前最低验证方式是：

- `npm run check`
- `npm run test`
- `npm run build`
- 直接运行关键 CLI 命令观察结构化输出

## 构建方式

当前构建命令：

```bash
npm run build
```

当前 CLI 入口构建产物：

- `dist/bin/opendaas.js`

## 代码结构入口

当前主要目录：

- `src/bin/`：CLI 入口
- `src/cli/`：命令树定义
- `src/core/`：共享控制面、bootstrap、diff、site、agent 等核心逻辑
- `site-runtime/`：Fumadocs / Next.js 运行时
- `test/`：自动化测试

## Agent 接入

当前已可生成最小 Agent 接入产物：

- `.opendaas/agent/SKILL.md`
- [`Agent Usage`](./agent.md)

建议在工作区中通过以下命令刷新：

```bash
npm run dev -- agent sync
```

## Release 记录

当前已存在结构化 release / changelog 控制面：

- `.opendaas/releases/records.yaml`
- `docs/project/releases/index.md`

建议使用：

```bash
npm run dev -- release list
npm run dev -- release new --version 0.1.0-alpha.1 --title "Public alpha baseline" --summary "..."
```

## 开发约束

- 在当前目标范围内自主推进
- 新决策节点先做 diff check 再升级
- 共享文档只使用 `name + description` 头部元信息

## 当前工作流

1. 先阅读最终目标与当前状态
2. 在开始任务前运行 `opendaas diff check`
3. 使用 `goal / plan / task / status` 维护控制面
4. 通过 `site dev` 或 `site open` 查看文档站投影
