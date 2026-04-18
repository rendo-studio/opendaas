import Link from "next/link";
import { ArrowRight, History, ListTree, Sparkles } from "lucide-react";

import type { ControlPlaneSnapshot } from "@/lib/runtime-data";

import { TaskTree } from "./task-tree";

export function TaskClosurePage({ snapshot }: { snapshot: ControlPlaneSnapshot }) {
  const tasks = snapshot.tasks;

  return (
    <div className="space-y-8">
      <section className="rounded-[2.4rem] border border-[color:var(--color-border)] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-8 shadow-[0_42px_140px_-92px_rgba(15,23,42,0.95)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-muted-foreground)] uppercase">Task Closure</p>
            <h1 className="text-4xl font-semibold text-[color:var(--color-foreground)]">从当前任务树到闭环历史的统一视图</h1>
            <p className="text-base leading-8 text-slate-700">
              这里直接读取 `.opendaas/tasks/current.yaml`、`.opendaas/tasks/archive.yaml` 和变化记录，提供完整任务树、最近完成事项和历史占位。
            </p>
          </div>
          <div className="rounded-[1.8rem] border border-[color:var(--color-border)] bg-white/85 p-5 backdrop-blur">
            <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-muted-foreground)] uppercase">Snapshot</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--color-foreground)]">{snapshot.generatedAt}</p>
            <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
              Current tasks: {tasks?.items.length ?? 0}
            </p>
            <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
              Archived tasks: {tasks?.archive.items.length ?? 0}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-card)]/88 p-6 shadow-[0_32px_120px_-80px_rgba(15,23,42,0.85)]">
          <div className="flex items-center gap-3">
            <ListTree className="h-5 w-5 text-[color:var(--color-primary)]" />
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-muted-foreground)] uppercase">Current tree</p>
              <h2 className="mt-1 text-2xl font-semibold text-[color:var(--color-foreground)]">完整任务树</h2>
            </div>
          </div>
          <div className="mt-6">
            <TaskTree items={tasks?.tree ?? []} />
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-card)]/88 p-6 shadow-[0_32px_120px_-80px_rgba(15,23,42,0.85)]">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[color:var(--color-primary)]" />
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-muted-foreground)] uppercase">Recent completion</p>
                <h2 className="mt-1 text-2xl font-semibold text-[color:var(--color-foreground)]">最近完成</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {(tasks?.recentCompleted ?? ["当前还没有新的完成项。"]).map((item) => (
                <div key={item} className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-4 py-3 text-sm text-[color:var(--color-foreground)]">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-card)]/88 p-6 shadow-[0_32px_120px_-80px_rgba(15,23,42,0.85)]">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-[color:var(--color-primary)]" />
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-muted-foreground)] uppercase">History</p>
                <h2 className="mt-1 text-2xl font-semibold text-[color:var(--color-foreground)]">历史闭环</h2>
              </div>
            </div>
            {tasks?.archive.items.length ? (
              <div className="mt-5 space-y-3">
                {tasks.archive.items.map((item) => (
                  <div key={item.id} className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[color:var(--color-foreground)]">{item.name}</p>
                      <span className="rounded-full border border-[color:var(--color-border)] px-3 py-1 font-mono text-xs text-[color:var(--color-muted-foreground)]">
                        {item.closedAt}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
                      {item.summary ?? "该归档任务尚未补充摘要。"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.75rem] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-background)] p-5 text-sm leading-7 text-[color:var(--color-muted-foreground)]">
                归档模型已经落进 `.opendaas/tasks/archive.yaml`，但当前项目还没有归档条目。后续已关闭的大任务应进入这里，并与 change / release 记录建立关联。
              </div>
            )}
            <div className="mt-5 space-y-3">
              <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-muted-foreground)] uppercase">Linked changes</p>
              {snapshot.docs.changePages.length ? (
                snapshot.docs.changePages.map((page) => (
                  <Link
                    key={page.path}
                    href={`/docs/${page.slug.join("/")}`}
                    className="group flex items-center justify-between rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-4 py-3 text-sm text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-primary)]"
                  >
                    <span>{page.title}</span>
                    <ArrowRight className="h-4 w-4 text-[color:var(--color-muted-foreground)] transition group-hover:translate-x-1 group-hover:text-[color:var(--color-primary)]" />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[color:var(--color-muted-foreground)]">当前没有 change 页面可供关联。</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
