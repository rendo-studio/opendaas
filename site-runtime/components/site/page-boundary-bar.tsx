import { FileLock2, FileSymlink, PencilLine } from "lucide-react";

import type { RuntimePageBoundary } from "@/lib/runtime-data";

import { DocEditor } from "./doc-editor";

interface PageBoundaryBarProps {
  boundary: RuntimePageBoundary;
  editableContent?: string | null;
}

const modeMeta = {
  editable: {
    label: "Editable",
    icon: PencilLine
  },
  projection: {
    label: "Projection",
    icon: FileLock2
  },
  hybrid: {
    label: "Hybrid",
    icon: FileSymlink
  }
} as const;

export function PageBoundaryBar({ boundary, editableContent }: PageBoundaryBarProps) {
  const meta = modeMeta[boundary.mode];
  const Icon = meta.icon;

  return (
    <div className="mb-6 rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 p-5 shadow-[0_30px_100px_-65px_rgba(15,23,42,0.8)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[color:var(--color-muted-foreground)] uppercase">
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
            <span className="rounded-full border border-[color:var(--color-border)] px-3 py-1 font-mono text-xs text-[color:var(--color-muted-foreground)]">
              {boundary.path}
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-muted-foreground)]">{boundary.reason}</p>
          {boundary.managedSections.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {boundary.managedSections.map((section) => (
                <span
                  key={section}
                  className="rounded-full border border-dashed border-[color:var(--color-border)] px-3 py-1 text-xs text-[color:var(--color-muted-foreground)]"
                >
                  {section}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {boundary.mode === "editable" && editableContent ? <DocEditor relativePath={boundary.path} initialContent={editableContent} /> : null}
      </div>
    </div>
  );
}
