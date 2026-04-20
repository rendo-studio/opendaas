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

export function DocumentRevisionSidebar({
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
    <section className="mt-6 border-t border-[color:var(--color-border)] pt-4">
      <div className="mb-3">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--muted-foreground)]">
          Revision Line
        </div>
        <div className="mt-1 text-xs leading-5 text-[color:var(--muted-foreground)]">
          最近更新于 {formatTimestamp(record.updatedAt)}，共 {record.revisions.length} 个版本。
        </div>
      </div>

      <div className="space-y-2">
        {recentRevisions.map((revision) => {
          const isCurrent = revision.id === latestRevision.id;
          const isActive = revision.id === activeRevisionId || revision.id === compareRevisionId;

          return (
            <div
              key={revision.id}
              className={`rounded-lg border px-3 py-2.5 transition ${
                isActive
                  ? "border-[#00a35c] bg-[#f3fff9]"
                  : "border-[color:var(--color-border)] bg-[color:var(--muted)]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={isCurrent ? pathname : withQuery(pathname, "revision", revision.id)}
                  className={`text-sm font-medium transition ${
                    isActive && !compareRevisionId
                      ? "text-[#00663a]"
                      : "text-[color:var(--foreground)] hover:text-[#00a35c]"
                  }`}
                >
                  {isCurrent ? "当前版本" : formatTimestamp(revision.createdAt)}
                </Link>
                {isCurrent ? (
                  <span className="rounded-full bg-[color:var(--foreground)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--background)]">
                    live
                  </span>
                ) : null}
              </div>

              {!isCurrent ? (
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <Link
                    href={withQuery(pathname, "revision", revision.id)}
                    className={`font-medium transition ${
                      activeRevisionId === revision.id
                        ? "text-[#00663a]"
                        : "text-[color:var(--muted-foreground)] hover:text-[#00a35c]"
                    }`}
                  >
                    查看版本
                  </Link>
                  <Link
                    href={withQuery(pathname, "compare", revision.id)}
                    className={`font-medium transition ${
                      compareRevisionId === revision.id
                        ? "text-[#00663a]"
                        : "text-[color:var(--muted-foreground)] hover:text-[#00a35c]"
                    }`}
                  >
                    对比当前
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {(activeRevisionId || compareRevisionId) ? (
        <Link
          href={pathname}
          className="mt-3 inline-flex text-xs font-medium text-[color:var(--muted-foreground)] transition hover:text-[#00a35c]"
        >
          回到当前版本
        </Link>
      ) : null}
    </section>
  );
}
