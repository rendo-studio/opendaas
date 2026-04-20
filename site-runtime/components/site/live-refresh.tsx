"use client";

import { startTransition, useEffect, useEffectEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function storageKey(prefix: string) {
  return `opendaas-docs-${prefix}-v1`;
}

function readMap(key: string): Record<string, string> {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeMap(key: string, value: Record<string, string>) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeHref(value: string): string {
  return value.replace(/\/+$/, "") || "/";
}

interface LiveRefreshProps {
  initialVersion: string;
  currentPath: string | null;
  pages: Array<{
    path: string;
    title: string;
    latestRevisionId: string | null;
    revisionCount: number;
  }>;
}

export function LiveRefresh({ initialVersion, currentPath, pages }: LiveRefreshProps) {
  const router = useRouter();
  const currentVersion = useRef(initialVersion);

  const checkVersion = useEffectEvent(async () => {
    const response = await fetch("/api/opendaas/version", {
      cache: "no-store"
    }).catch(() => null);

    if (!response?.ok) {
      return;
    }

    const payload = (await response.json()) as { updatedAt?: string };
    if (!payload.updatedAt || payload.updatedAt === currentVersion.current) {
      return;
    }

    currentVersion.current = payload.updatedAt;
    startTransition(() => {
      router.refresh();
    });
  });

  useEffect(() => {
    const knownKey = storageKey("known");
    const seenKey = storageKey("seen");
    const known = readMap(knownKey);
    const seen = readMap(seenKey);
    const latestByPath = Object.fromEntries(
      pages
        .filter((page) => page.latestRevisionId)
        .map((page) => [page.path, page.latestRevisionId as string])
    );
    const isFirstSeen = Object.keys(known).length === 0;

    if (currentPath) {
      const currentRevisionId = latestByPath[currentPath];
      if (currentRevisionId) {
        seen[currentPath] = currentRevisionId;
      }
    }

    const unreadChanged = pages.filter((page) => {
      if (!page.latestRevisionId || page.revisionCount < 2) {
        return false;
      }

      return seen[page.path] !== page.latestRevisionId;
    });

    if (!isFirstSeen) {
      const newlyUpdated = unreadChanged.filter((page) => known[page.path] !== page.latestRevisionId);
      if (newlyUpdated.length > 0) {
        const preview = newlyUpdated
          .slice(0, 3)
          .map((page) => page.title)
          .join(" · ");
        toast("文档已更新", {
          description:
            newlyUpdated.length > 3
              ? `${preview} 等 ${newlyUpdated.length} 篇文档发生了新修订。`
              : `${preview} 发生了新修订。`
        });
      }
    }

    writeMap(knownKey, latestByPath);
    writeMap(seenKey, seen);

    const changedHrefs = new Set(
      unreadChanged.map((page) => normalizeHref(`/docs/${page.path.replace(/\.(md|mdx)$/i, "").replace(/\/index$/i, "")}`))
    );
    const applySidebarMarkers = () => {
      document.querySelectorAll("[data-opendaas-doc-marker]").forEach((node) => node.remove());
      const links = document.querySelectorAll<HTMLAnchorElement>("aside a[href^='/docs'], nav a[href^='/docs']");
      for (const link of links) {
        const href = normalizeHref(new URL(link.href, window.location.origin).pathname);
        if (!changedHrefs.has(href)) {
          continue;
        }

        const marker = document.createElement("span");
        marker.dataset.opendaasDocMarker = "true";
        marker.className = "opendaas-doc-marker";
        link.appendChild(marker);
      }
    };

    applySidebarMarkers();
    const observer = new MutationObserver(() => {
      applySidebarMarkers();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [currentPath, pages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void checkVersion();
    }, 2000);

    return () => {
      window.clearInterval(timer);
    };
  }, [checkVersion]);

  return null;
}
