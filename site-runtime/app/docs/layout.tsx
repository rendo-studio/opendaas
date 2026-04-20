import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { DocsLiveProvider } from "../../components/site/docs-live-provider";
import { DocsSidebarFolder, DocsSidebarItem, DocsSidebarSeparator } from "../../components/site/docs-sidebar";
import { baseOptions } from "../../lib/layout.shared";
import { loadControlPlaneSnapshot, loadRuntimeMetadata, loadRuntimeVersion } from "../../lib/runtime-data";
import { source } from "../../lib/source";

export default async function Layout({ children }: { children: ReactNode }) {
  const [snapshot, runtime, version] = await Promise.all([
    loadControlPlaneSnapshot(),
    loadRuntimeMetadata(),
    loadRuntimeVersion()
  ]);

  return (
    <DocsLiveProvider
      enabled={runtime.mode === "dev"}
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
        {...baseOptions()}
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
