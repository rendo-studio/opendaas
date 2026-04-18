"use client";

import { startTransition, useEffect, useEffectEvent, useRef } from "react";
import { useRouter } from "next/navigation";

interface LiveRefreshProps {
  initialVersion: string;
}

export function LiveRefresh({ initialVersion }: LiveRefreshProps) {
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
    const timer = window.setInterval(() => {
      void checkVersion();
    }, 2000);

    return () => {
      window.clearInterval(timer);
    };
  }, [checkVersion]);

  return null;
}
