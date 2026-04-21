import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { DocsLiveProvider } from "../../../components/site/docs-live-provider";
import { DocsSidebarFolder, DocsSidebarItem, DocsSidebarSeparator } from "../../../components/site/docs-sidebar";
import { i18n, isSiteLocale } from "../../../lib/i18n";
import { baseOptions } from "../../../lib/layout.shared";
import { loadControlPlaneSnapshot, loadRuntimeMetadata, loadRuntimeVersion } from "../../../lib/runtime-data";
import { getSource } from "../../../lib/source";

export async function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}

export default async function Layout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isSiteLocale(lang)) {
    notFound();
  }

  const [snapshot, runtime, version] = await Promise.all([
    loadControlPlaneSnapshot(),
    loadRuntimeMetadata(),
    loadRuntimeVersion()
  ]);
  const source = getSource(lang);

  return (
    <DocsLiveProvider
      enabled={runtime.mode === "dev"}
      locale={lang}
      initialVersion={version.updatedAt}
      pages={snapshot.docs.pages.map((entry) => ({
        path: entry.path,
        title: entry.title,
        latestRevisionId: entry.latestRevisionId,
        revisionCount: entry.revisionCount
      }))}
      workspaceStateDigest={snapshot.workspace.stateDigest}
    >
      <DocsLayout
        {...baseOptions(lang)}
        tree={source.pageTree}
        sidebar={{
          components: {
            Item: DocsSidebarItem,
            Folder: DocsSidebarFolder,
            Separator: DocsSidebarSeparator
          }
        }}
      >
        {children}
      </DocsLayout>
    </DocsLiveProvider>
  );
}
