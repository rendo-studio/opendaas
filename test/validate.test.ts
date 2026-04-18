import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { initWorkspace } from "../src/core/bootstrap.js";
import { repairWorkspace, validateWorkspace } from "../src/core/validate.js";
import { withWorkspaceRoot } from "../src/core/workspace.js";

const cleanups: string[] = [];

afterEach(async () => {
  while (cleanups.length > 0) {
    const target = cleanups.pop();
    if (target) {
      await fs.rm(target, { recursive: true, force: true });
    }
  }
});

describe("workspace validation and repair", () => {
  it("detects migration gaps in an adopted-style workspace and repairs them", async () => {
    const root = path.join(process.env.TEMP ?? process.cwd(), `opendaas-validate-${Date.now()}`);
    cleanups.push(root);

    await initWorkspace({
      targetPath: root,
      projectName: "Legacy Workspace",
      endGoalName: "Modernize legacy workspace",
      endGoalSummary: "Bring the workspace forward to the current OpenDaaS schema."
    });

    await fs.writeFile(
      path.join(root, ".opendaas", "meta", "workspace.yaml"),
      [
        "workspaceName: legacy-workspace",
        "docsRoot: docs",
        "workspaceRoot: .opendaas",
        "createdAt: 2026-04-17T00:00:00Z",
        ""
      ].join("\n"),
      "utf8"
    );
    await fs.writeFile(
      path.join(root, ".opendaas", "config", "workspace.yaml"),
      [
        "requireDiffCheckBeforeTask: true",
        "docsSiteEnabled: true",
        "defaultDiffMode: line",
        ""
      ].join("\n"),
      "utf8"
    );
    await fs.rm(path.join(root, "docs", "project", "releases", "index.md"), { force: true });
    await fs.rm(path.join(root, "docs", "engineering", "agent.md"), { force: true });
    await fs.rm(path.join(root, ".opendaas", "agent", "SKILL.md"), { force: true });

    const before = await withWorkspaceRoot(root, async () => validateWorkspace());
    expect(before.migrationNeeded).toBe(true);
    expect(before.schemaIssues.length).toBeGreaterThan(0);
    expect(before.missingFiles.some((entry) => entry.endsWith(path.join("project", "releases", "index.md")))).toBe(true);

    const repaired = await withWorkspaceRoot(root, async () => repairWorkspace());
    expect(repaired.repaired).toBe(true);
    expect(repaired.validation.ok).toBe(true);
    expect(repaired.validation.migrationNeeded).toBe(false);
  });
});
