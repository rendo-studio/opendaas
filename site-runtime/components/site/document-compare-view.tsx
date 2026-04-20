import type { RuntimeDocRevisionEntry } from "../../lib/runtime-data";

interface DiffRow {
  left: string | null;
  right: string | null;
  leftNumber: number | null;
  rightNumber: number | null;
  kind: "same" | "added" | "removed";
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function buildDiffRows(previous: string, current: string): DiffRow[] {
  const left = previous.split(/\r?\n/);
  const right = current.split(/\r?\n/);
  const matrix = Array.from({ length: left.length + 1 }, () => Array<number>(right.length + 1).fill(0));

  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      matrix[i][j] =
        left[i] === right[j]
          ? matrix[i + 1][j + 1] + 1
          : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  let leftNumber = 1;
  let rightNumber = 1;

  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      rows.push({
        left: left[i],
        right: right[j],
        leftNumber,
        rightNumber,
        kind: "same"
      });
      i += 1;
      j += 1;
      leftNumber += 1;
      rightNumber += 1;
      continue;
    }

    if (matrix[i + 1][j] >= matrix[i][j + 1]) {
      rows.push({
        left: left[i],
        right: null,
        leftNumber,
        rightNumber: null,
        kind: "removed"
      });
      i += 1;
      leftNumber += 1;
      continue;
    }

    rows.push({
      left: null,
      right: right[j],
      leftNumber: null,
      rightNumber,
      kind: "added"
    });
    j += 1;
    rightNumber += 1;
  }

  while (i < left.length) {
    rows.push({
      left: left[i],
      right: null,
      leftNumber,
      rightNumber: null,
      kind: "removed"
    });
    i += 1;
    leftNumber += 1;
  }

  while (j < right.length) {
    rows.push({
      left: null,
      right: right[j],
      leftNumber: null,
      rightNumber,
      kind: "added"
    });
    j += 1;
    rightNumber += 1;
  }

  return rows;
}

function revisionTone(kind: DiffRow["kind"], side: "left" | "right"): string {
  if (kind === "added" && side === "right") {
    return "bg-[#ecfff5]";
  }
  if (kind === "removed" && side === "left") {
    return "bg-[#fff5f4]";
  }

  return "bg-[color:var(--card)]";
}

function renderLineNumber(value: number | null): string {
  return value === null ? "" : String(value);
}

export function DocumentRevisionPreview({
  revision
}: {
  revision: RuntimeDocRevisionEntry;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--card)] shadow-[var(--console-item-shadow)]">
      <div className="border-b border-[color:var(--color-border)] px-4 py-3">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--muted-foreground)]">
          Historical Revision
        </div>
        <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">版本时间 {formatTimestamp(revision.createdAt)}</div>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-sm leading-6 text-[color:var(--foreground)]">
        <code>{revision.content}</code>
      </pre>
    </section>
  );
}

export function DocumentCompareView({
  previous,
  current
}: {
  previous: RuntimeDocRevisionEntry;
  current: RuntimeDocRevisionEntry;
}) {
  const rows = buildDiffRows(previous.content, current.content);

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--card)] shadow-[var(--console-item-shadow)]">
      <div className="grid gap-4 border-b border-[color:var(--color-border)] px-4 py-4 md:grid-cols-2">
        <div>
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--muted-foreground)]">
            历史版本
          </div>
          <div className="mt-1 text-sm font-medium text-[color:var(--foreground)]">{previous.title}</div>
          <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">{formatTimestamp(previous.createdAt)}</div>
        </div>
        <div>
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--muted-foreground)]">
            当前版本
          </div>
          <div className="mt-1 text-sm font-medium text-[color:var(--foreground)]">{current.title}</div>
          <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">{formatTimestamp(current.createdAt)}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="border-b border-[color:var(--color-border)] px-4 py-2 text-xs font-medium text-[color:var(--muted-foreground)] md:border-b-0 md:border-r">
          历史版本
        </div>
        <div className="px-4 py-2 text-xs font-medium text-[color:var(--muted-foreground)]">当前版本</div>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="border-r border-[color:var(--color-border)]">
          {rows.map((row, index) => (
            <div
              key={`left-${index}`}
              className={`grid grid-cols-[3rem_minmax(0,1fr)] gap-3 border-t border-[color:var(--color-border)] px-4 py-2 text-sm ${revisionTone(row.kind, "left")}`}
            >
              <div className="font-mono text-xs text-[color:var(--muted-foreground)]">{renderLineNumber(row.leftNumber)}</div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[color:var(--foreground)]">{row.left ?? ""}</pre>
            </div>
          ))}
        </div>

        <div>
          {rows.map((row, index) => (
            <div
              key={`right-${index}`}
              className={`grid grid-cols-[3rem_minmax(0,1fr)] gap-3 border-t border-[color:var(--color-border)] px-4 py-2 text-sm ${revisionTone(row.kind, "right")}`}
            >
              <div className="font-mono text-xs text-[color:var(--muted-foreground)]">{renderLineNumber(row.rightNumber)}</div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[color:var(--foreground)]">{row.right ?? ""}</pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
