import type { WorkspaceConfigState, WorkspaceDocsSiteConfig } from "./types.js";
import { readYamlFile } from "./storage.js";
import { getWorkspacePaths } from "./workspace.js";

type ProjectKind = "general" | "frontend" | "library" | "service";
type DocsMode = "minimal" | "standard";

interface LegacyWorkspaceConfigState {
  docsSiteEnabled?: boolean;
  siteFramework?: string;
  packageManager?: string;
  projectKind?: ProjectKind;
  docsMode?: DocsMode;
  docsSite?: Partial<WorkspaceDocsSiteConfig> | null;
  workspaceSchemaVersion?: number;
}

export function defaultDocsSiteConfig(): WorkspaceDocsSiteConfig {
  return {
    enabled: true,
    sourcePath: "docs",
    preferredPort: null
  };
}

export function normalizeWorkspaceConfig(
  raw: LegacyWorkspaceConfigState | null | undefined,
  fallback: { projectKind?: ProjectKind; docsMode?: DocsMode; workspaceSchemaVersion?: number } = {}
): WorkspaceConfigState {
  const docsSite = raw?.docsSite;

  return {
    siteFramework: raw?.siteFramework ?? "fumadocs",
    packageManager: raw?.packageManager ?? "npm",
    projectKind: raw?.projectKind ?? fallback.projectKind ?? "general",
    docsMode: raw?.docsMode ?? fallback.docsMode ?? "standard",
    docsSite: {
      enabled: docsSite?.enabled ?? raw?.docsSiteEnabled ?? true,
      sourcePath: docsSite?.sourcePath ?? "docs",
      preferredPort:
        typeof docsSite?.preferredPort === "number" && Number.isInteger(docsSite.preferredPort)
          ? docsSite.preferredPort
          : null
    },
    workspaceSchemaVersion: raw?.workspaceSchemaVersion ?? fallback.workspaceSchemaVersion ?? 0
  };
}

export async function loadWorkspaceConfig(start = process.cwd()): Promise<WorkspaceConfigState> {
  const paths = getWorkspacePaths(start);
  const raw = await readYamlFile<LegacyWorkspaceConfigState>(paths.workspaceConfigFile).catch(() => null);
  return normalizeWorkspaceConfig(raw);
}
