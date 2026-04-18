"use client";

import { useEffectEvent, useState } from "react";
import { FilePenLine, LoaderCircle, Save, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface DocEditorProps {
  relativePath: string;
  initialContent: string;
}

export function DocEditor({ relativePath, initialContent }: DocEditorProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onSave = useEffectEvent(async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const response = await fetch("/api/opendaas/page", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        relativePath,
        content
      })
    }).catch(() => null);

    if (!response?.ok) {
      const payload = response ? ((await response.json().catch(() => ({}))) as { error?: string }) : null;
      setSaving(false);
      setError(payload?.error ?? "保存失败，站点未能写回源文档。");
      return;
    }

    setSaving(false);
    setOpen(false);
    setSaved(true);
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-4 py-2 text-sm font-medium text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
      >
        <FilePenLine className="h-4 w-4" />
        页面内编辑
      </button>
      {saved ? (
        <p className="mt-3 text-sm text-emerald-600">
          已写回源文档，站点会在 watcher 完成同步后自动刷新。
        </p>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-3xl flex-col border-l border-[color:var(--color-border)] bg-[color:var(--color-background)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-6 py-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-muted-foreground)] uppercase">
                  Editable Page
                </p>
                <h2 className="text-lg font-semibold text-[color:var(--color-foreground)]">{relativePath}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-muted-foreground)] transition hover:text-[color:var(--color-foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 p-6">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className={cn(
                  "h-full min-h-[26rem] w-full resize-none rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-5 py-4 font-mono text-sm leading-7 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-primary)]",
                  saving && "opacity-70"
                )}
                spellCheck={false}
              />
              {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}
            </div>
            <div className="flex items-center justify-between border-t border-[color:var(--color-border)] px-6 py-4">
              <p className="text-sm text-[color:var(--color-muted-foreground)]">
                保存后会立刻写回 `docs/`、记录 diff，并刷新当前站点。
              </p>
              <button
                type="button"
                onClick={() => void onSave()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-primary-foreground)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                保存并刷新
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
