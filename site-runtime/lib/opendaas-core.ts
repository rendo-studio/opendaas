import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type { RuntimeMetadata } from "./runtime-data";

const runtimeImport = new Function("specifier", "return import(specifier);") as <T>(specifier: string) => Promise<T>;

function packageRoot(runtime: RuntimeMetadata): string {
  return path.resolve(runtime.templateRoot, "..");
}

export async function loadCoreModule<T>(runtime: RuntimeMetadata, relativePath: string): Promise<T> {
  return runtimeImport<T>(pathToFileURL(path.join(packageRoot(runtime), "dist", relativePath)).href);
}

export async function withCoreWorkspace<T>(
  runtime: RuntimeMetadata,
  work: () => Promise<T>
): Promise<T> {
  if (!runtime.sourceWorkspaceRoot) {
    throw new Error("This runtime is not attached to a writable OpenDaaS workspace.");
  }

  const workspace = await loadCoreModule<{
    withWorkspaceRoot(root: string, work: () => Promise<T>): Promise<T>;
  }>(runtime, "core/workspace.js");

  return workspace.withWorkspaceRoot(runtime.sourceWorkspaceRoot, work);
}

export async function refreshRuntimeData(runtime: RuntimeMetadata): Promise<void> {
  const runtimeDataRoot = path.join(process.cwd(), "runtime-data");
  const docsRevisionFile = path.join(runtimeDataRoot, "docs-revisions.json");
  const { syncDocsRevisionState } = await loadCoreModule<{
    syncDocsRevisionState(docsRoot: string, stateFile: string): Promise<unknown>;
  }>(runtime, "core/docs-revisions.js");
  const { buildSiteControlPlaneSnapshot } = await loadCoreModule<{
    buildSiteControlPlaneSnapshot(
      docsRoot: string,
      options?: {
        docsRevisionFile?: string | null;
      }
    ): Promise<unknown>;
  }>(runtime, "core/site-data.js");

  await syncDocsRevisionState(runtime.sourceDocsRoot, docsRevisionFile);
  const snapshot = await buildSiteControlPlaneSnapshot(runtime.sourceDocsRoot, {
    docsRevisionFile
  });

  await fs.mkdir(runtimeDataRoot, { recursive: true });
  await fs.writeFile(
    path.join(runtimeDataRoot, "control-plane.json"),
    `${JSON.stringify(snapshot, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(runtimeDataRoot, "version.json"),
    `${JSON.stringify({ updatedAt: new Date().toISOString() }, null, 2)}\n`,
    "utf8"
  );
}

export async function syncWorkspaceDerivedState(runtime: RuntimeMetadata): Promise<void> {
  await withCoreWorkspace(runtime, async () => {
    const { syncStatusDocs } = await loadCoreModule<{
      syncStatusDocs(): Promise<void>;
    }>(runtime, "core/status.js");
    const { syncGuidanceArtifacts } = await loadCoreModule<{
      syncGuidanceArtifacts(root?: string): Promise<void>;
    }>(runtime, "core/guidance.js");

    await syncStatusDocs();
    await syncGuidanceArtifacts(runtime.sourceWorkspaceRoot ?? process.cwd());
  });
}
