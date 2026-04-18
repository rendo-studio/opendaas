import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  CircleCheckBig,
  CircleDot,
  ClipboardList,
  FileDiff,
  Goal,
  Layers3,
  RefreshCw,
  ShieldCheck
} from "lucide-react";

import type { ControlPlaneSnapshot } from "@/lib/runtime-data";

function StatCard(props: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 p-5 shadow-[0_25px_80px_-60px_rgba(15,23,42,0.75)]">
      <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-muted-foreground)] uppercase">{props.label}</p>
      <p className="mt-3 text-3xl font-semibold text-[color:var(--color-foreground)]">{props.value}</p>
      <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted-foreground)]">{props.detail}</p>
    </div>
  );
}

function SectionCard(props: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-card)]/88 p-6 shadow-[0_32px_120px_-80px_rgba(15,23,42,0.85)]">
      <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-muted-foreground)] uppercase">{props.eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-foreground)]">{props.title}</h2>
      <div className="mt-5">{props.children}</div>
    </section>
  );
}

export function Dashboard({ snapshot }: { snapshot: ControlPlaneSnapshot }) {
  const progress = snapshot.progress?.percent ?? 0;
  const countedTasks = snapshot.progress?.countedTasks ?? 0;
  const doneTasks = snapshot.progress?.doneTasks ?? 0;
  const pendingDiffs = snapshot.diff?.pending.files.length ?? 0;
  const decisions = snapshot.decisions?.items.length ?? 0;
  const releases = snapshot.releases?.items.length ?? 0;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-[color:var(--color-border)] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.9))] p-8 shadow-[0_42px_140px_-90px_rgba(15,23,42,0.9)]">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-white/85 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-[color:var(--color-muted-foreground)] uppercase">
              <Blocks className="h-4 w-4" />
              Internal Collaboration Frontend
            </span>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-[color:var(--color-foreground)] md:text-5xl">
                {snapshot.goal?.name ?? "OpenDaaS Workspace Dashboard"}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-700">
                {snapshot.goal?.summary ??
                  "当前文档站未连接到完整工作区控制面，因此只渲染 docs 共享文档本身。"}
              </p>
            </div>
          </div>
          <div className="min-w-[16rem] rounded-[2rem] border border-[color:var(--color-border)] bg-white/85 p-5 backdrop-blur">
            <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-muted-foreground)] uppercase">Current Phase</p>
            <p className="mt-3 text-2xl font-semibold text-[color:var(--color-foreground)]">
              {snapshot.status?.phase ?? "Docs-only mode"}
            </p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm text-[color:var(--color-muted-foreground)]">
                <span>Progress</span>
                <span className="font-mono text-[color:var(--color-foreground)]">{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#10b981)]" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm leading-7 text-[color:var(--color-muted-foreground)]">
                Counted tasks: {doneTasks} / {countedTasks}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Progress" value={`${progress}%`} detail={`${doneTasks} / ${countedTasks} counted tasks completed.`} />
        <StatCard label="Diff Watch" value={String(pendingDiffs)} detail="Pending shared-doc diffs currently waiting for acknowledgement." />
        <StatCard label="Boundaries" value={String(snapshot.docs.pages.length)} detail={`${snapshot.docs.editableCount} editable, ${snapshot.docs.hybridCount} hybrid, ${snapshot.docs.projectionCount} projection pages.`} />
        <StatCard label="Records" value={`${decisions + releases}`} detail={`${decisions} decision records and ${releases} release records currently tracked.`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard eyebrow="Focus" title="Current workstreams">
          <div className="grid gap-4 md:grid-cols-2">
            {(snapshot.status?.topLevelPlans ?? []).map((plan) => {
              const status = plan.match(/\[(.+)\]$/)?.[1] ?? "pending";
              const icon = status === "done" ? CircleCheckBig : status === "in_progress" ? CircleDot : Layers3;
              const Icon = icon;

              return (
                <div key={plan} className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-[color:var(--color-primary)]" />
                    <p className="text-sm font-medium text-[color:var(--color-foreground)]">{plan.replace(/\s+\[[^\]]+\]$/, "")}</p>
                  </div>
                  <p className="mt-2 text-xs tracking-[0.16em] text-[color:var(--color-muted-foreground)] uppercase">{status}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Signals" title="What needs attention">
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-foreground)]">
                <ClipboardList className="h-4 w-4 text-[color:var(--color-primary)]" />
                Next actions
              </div>
              <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-muted-foreground)]">
                {(snapshot.status?.nextActions ?? ["当前没有新的动作建议。"]).map((item) => (
                  <li key={item} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-foreground)]">
                <ShieldCheck className="h-4 w-4 text-[color:var(--color-primary)]" />
                Blockers
              </div>
              <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-muted-foreground)]">
                {(snapshot.status?.blockers ?? ["暂无明确 blocker"]).map((item) => (
                  <li key={item} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard eyebrow="Inspection" title="Diff and runtime">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-foreground)]">
                  <FileDiff className="h-4 w-4 text-[color:var(--color-primary)]" />
                  Pending diff
                </div>
                <p className="mt-3 text-3xl font-semibold text-[color:var(--color-foreground)]">{pendingDiffs}</p>
                <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
                  Last diff check: {snapshot.workspace.lastDiffCheckAt ?? "never"}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-foreground)]">
                  <RefreshCw className="h-4 w-4 text-[color:var(--color-primary)]" />
                  Last sync
                </div>
                <p className="mt-3 text-lg font-semibold text-[color:var(--color-foreground)]">{snapshot.generatedAt}</p>
                <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
                  Last diff ack: {snapshot.workspace.lastDiffAckAt ?? "never"}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {(snapshot.diff?.history.items ?? []).slice(0, 4).map((entry) => (
                <div key={entry.id} className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--color-foreground)]">{entry.kind === "ack" ? "Diff acknowledged" : "Diff captured"}</p>
                      <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">{entry.generatedAt}</p>
                    </div>
                    <span className="rounded-full border border-[color:var(--color-border)] px-3 py-1 font-mono text-xs text-[color:var(--color-muted-foreground)]">
                      {entry.fileCount} files
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Entry points" title="Project reality">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { href: "/docs/project/goal", label: "Final goal", icon: Goal, detail: "最终目标、完成标准与非目标。" },
              { href: "/docs/project/status", label: "Current status", icon: CircleDot, detail: "当前阶段、进展、风险与下一步动作。" },
              { href: "/docs/project/current-work", label: "Current work", icon: Layers3, detail: "活跃焦点与高层计划。" },
              { href: "/docs/project/tasks", label: "Task closure", icon: ClipboardList, detail: "完整任务树、闭环和历史入口。" },
              { href: "/docs/project/changes", label: "Changes", icon: RefreshCw, detail: "从 change 视角理解项目演进。" },
              { href: "/docs/engineering/development", label: "Development", icon: ShieldCheck, detail: "人类与开发端 Agent 的接手入口。" }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[1.6rem] border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-5 transition hover:border-[color:var(--color-primary)] hover:shadow-[0_25px_90px_-70px_rgba(14,165,233,0.9)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="h-5 w-5 text-[color:var(--color-primary)]" />
                    <ArrowRight className="h-4 w-4 text-[color:var(--color-muted-foreground)] transition group-hover:translate-x-1 group-hover:text-[color:var(--color-primary)]" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[color:var(--color-foreground)]">{item.label}</h3>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted-foreground)]">{item.detail}</p>
                </Link>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
