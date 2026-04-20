import Link from "next/link";

import type { RuntimeDocRevisionRecord } from "../../lib/runtime-data";

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function withQuery(pathname: string, key: "revision" | "compare", value?: string): string {
  if (!value) {
    return pathname;
  }

  const params = new URLSearchParams();
  params.set(key, value);
  return `${pathname}?${params.toString()}`;
}

export function DocumentRevisionBar({
  pathname,
  record,
  activeRevisionId,
  compareRevisionId
}: {
  pathname: string;
  record: RuntimeDocRevisionRecord;
  activeRevisionId: string | null;
  compareRevisionId: string | null;
}) {
  const latestRevision = record.revisions.at(-1);
  const recentRevisions = [...record.revisions].reverse().slice(0, 6);

  if (!latestRevision) {
    return null;
  }

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--card)] shadow-[var(--console-item-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-4 py-3">
        <div>
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--muted-foreground)]">
            Revision Line
          </div>
          <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            最近更新于 {formatTimestamp(record.updatedAt)}，共 {record.revisions.length} 个版本。
          </div>
        </div>
        {(activeRevisionId || compareRevisionId) ? (
          <Link
            href={pathname}
            className="rounded-full border border-[color:var(--color-border)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] transition hover:border-[#00a35c] hover:text-[#00a35c]"
          >
            回到当前版本
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 px-4 py-4">
        {recentRevisions.map((revision) => {
          const isCurrent = revision.id === latestRevision.id;
          const isActive = revision.id === activeRevisionId || revision.id === compareRevisionId;

          return (
            <div key={revision.id} className="flex items-center gap-2 rounded-full bg-[color:var(--muted)] px-2 py-2">
              <Link
                href={withQuery(pathname, "revision", revision.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  isActive && !compareRevisionId
                    ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
                    : "text-[color:var(--foreground)] hover:text-[#00a35c]"
                }`}
              >
                {isCurrent ? "当前" : formatTimestamp(revision.createdAt)}
              </Link>
              {!isCurrent ? (
                <Link
                  href={withQuery(pathname, "compare", revision.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    compareRevisionId === revision.id
                      ? "border-[#00a35c] bg-[#ecfff5] text-[#00663a]"
                      : "border-[color:var(--color-border)] text-[color:var(--muted-foreground)] hover:border-[#00a35c] hover:text-[#00a35c]"
                  }`}
                >
                  对比当前
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
