import { CircleDashed, CircleDot, CircleOff, CircleCheckBig, CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

interface TaskNode {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "done" | "blocked";
  children: TaskNode[];
}

const statusMap = {
  pending: {
    label: "Pending",
    icon: CircleDashed,
    tone: "text-slate-500"
  },
  in_progress: {
    label: "In progress",
    icon: CircleDot,
    tone: "text-sky-500"
  },
  done: {
    label: "Done",
    icon: CircleCheckBig,
    tone: "text-emerald-500"
  },
  blocked: {
    label: "Blocked",
    icon: CircleAlert,
    tone: "text-rose-500"
  }
} as const;

export function TaskTree({ items, depth = 0 }: { items: TaskNode[]; depth?: number }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-card)]/70 p-5 text-sm text-[color:var(--color-muted-foreground)]">
        当前没有可展示的任务树。
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", depth > 0 && "ml-5 border-l border-[color:var(--color-border)]/70 pl-4")}>
      {items.map((item) => {
        const meta = statusMap[item.status] ?? {
          label: "Unknown",
          icon: CircleOff,
          tone: "text-slate-500"
        };
        const Icon = meta.icon;

        return (
          <div key={item.id} className="space-y-3">
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/80 p-4 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.55)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", meta.tone)} />
                    <span className="text-sm font-semibold tracking-[0.18em] text-[color:var(--color-muted-foreground)] uppercase">
                      {meta.label}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[color:var(--color-foreground)]">{item.name}</h3>
                </div>
                <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-3 py-1 font-mono text-xs text-[color:var(--color-muted-foreground)]">
                  {item.id}
                </span>
              </div>
            </div>
            {item.children.length > 0 ? <TaskTree items={item.children} depth={depth + 1} /> : null}
          </div>
        );
      })}
    </div>
  );
}
