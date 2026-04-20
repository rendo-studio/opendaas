import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { stageDocsForSiteRuntime, stopSiteRuntime } from "../src/core/site.js";
import { buildSiteControlPlaneSnapshot } from "../src/core/site-data.js";
import { resolveSiteWatchRoots } from "../src/core/site-watch-roots.js";
import { createWorkspaceFixture } from "./helpers/workspace.js";

const restorers: Array<() => void> = [];
const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (restorers.length > 0) {
    restorers.pop()?.();
  }

  while (cleanups.length > 0) {
    await cleanups.pop()?.();
  }
});

describe("site runtime staging", () => {
  it("translates OpenDaaS doc frontmatter into Fumadocs-compatible title/description", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    const staged = await stageDocsForSiteRuntime();
    const stagedIndex = await fs.readFile(path.join(staged.stagedDocsRoot, "index.md"), "utf8");

    expect(staged.fileCount).toBeGreaterThan(0);
    expect(stagedIndex).toContain("title: Test index");
    expect(stagedIndex).toContain("description: Workspace entry page.");
    expect(stagedIndex).not.toContain("name: Test index");
  });

  it("copies source docs assets and injects runtime-managed console pages into the staged tree", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    await fs.writeFile(
      path.join(fixture.root, "docs", "meta.json"),
      JSON.stringify(
        {
          pages: ["index", "project", "engineering"]
        },
        null,
        2
      ) + "\n",
      "utf8"
    );
    await fs.writeFile(path.join(fixture.root, "docs", "logo.txt"), "site-asset\n", "utf8");

    const staged = await stageDocsForSiteRuntime();
    const stagedMeta = await fs.readFile(path.join(staged.stagedDocsRoot, "meta.json"), "utf8");
    const stagedAsset = await fs.readFile(path.join(staged.stagedDocsRoot, "logo.txt"), "utf8");
    const stagedConsoleMeta = await fs.readFile(path.join(staged.stagedDocsRoot, "console", "meta.json"), "utf8");
    const stagedConsoleIndex = await fs.readFile(path.join(staged.stagedDocsRoot, "console", "index.md"), "utf8");

    expect(JSON.parse(stagedMeta)).toEqual({
      pages: ["console", "project", "engineering"]
    });
    expect(JSON.parse(stagedConsoleMeta)).toEqual({
      title: "Console",
      pages: ["index", "tasks"]
    });
    expect(stagedConsoleIndex).toContain("title: Overview");
    expect(stagedAsset).toBe("site-asset\n");
  });

  it("keeps staged runtime roots isolated across different workspaces", async () => {
    const runtimeBase = await fs.mkdtemp(path.join(os.tmpdir(), "opendaas-runtime-base-"));
    const previousRuntimeBase = process.env.OPENDAAS_SITE_RUNTIME_BASE;
    process.env.OPENDAAS_SITE_RUNTIME_BASE = runtimeBase;
    restorers.push(() => {
      if (previousRuntimeBase === undefined) {
        delete process.env.OPENDAAS_SITE_RUNTIME_BASE;
        return;
      }
      process.env.OPENDAAS_SITE_RUNTIME_BASE = previousRuntimeBase;
    });
    cleanups.push(async () => {
      await fs.rm(runtimeBase, { recursive: true, force: true });
    });

    const first = await createWorkspaceFixture();
    const second = await createWorkspaceFixture();
    cleanups.push(first.cleanup);
    cleanups.push(second.cleanup);

    const stagedFirst = await stageDocsForSiteRuntime(first.root);
    const stagedSecond = await stageDocsForSiteRuntime(second.root);

    expect(stagedFirst.siteId).not.toBe(stagedSecond.siteId);
    expect(stagedFirst.runtimeRoot).not.toBe(stagedSecond.runtimeRoot);
    expect(stagedFirst.runtimeRoot.startsWith(runtimeBase)).toBe(true);
    expect(stagedSecond.runtimeRoot.startsWith(runtimeBase)).toBe(true);
  });

  it("uses the persisted docs-site source path and preferred port when path is omitted", async () => {
    const fixture = await createWorkspaceFixture({
      config: {
        siteFramework: "fumadocs",
        packageManager: "npm",
        projectKind: "general",
        docsMode: "standard",
        docsSite: {
          enabled: true,
          sourcePath: "docs-pack",
          preferredPort: 4555
        },
        workspaceSchemaVersion: 7
      }
    });
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    await fs.mkdir(path.join(fixture.root, "docs-pack"), { recursive: true });
    await fs.writeFile(
      path.join(fixture.root, "docs-pack", "index.md"),
      `---\nname: Configured Index\ndescription: Configured docs site entry.\n---\n\n# Configured Docs\n`,
      "utf8"
    );

    const staged = await stageDocsForSiteRuntime();
    const stagedIndex = await fs.readFile(path.join(staged.stagedDocsRoot, "index.md"), "utf8");

    expect(staged.sourceDocsRoot).toBe(path.join(fixture.root, "docs-pack"));
    expect(staged.preferredPort).toBe(4555);
    expect(stagedIndex).toContain("title: Configured Index");
  });

  it("restages the same runtime without clobbering generated source state", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    const first = await stageDocsForSiteRuntime();
    const generatedSourceRoot = path.join(first.runtimeRoot, ".source");
    await fs.mkdir(generatedSourceRoot, { recursive: true });
    await fs.writeFile(path.join(generatedSourceRoot, "source.config.mjs"), "export default {};\n", "utf8");
    await fs.writeFile(
      path.join(fixture.root, "docs", "index.md"),
      `---\nname: Restaged Index\ndescription: Restaged docs entry.\n---\n\n# Restaged Docs\n`,
      "utf8"
    );

    const second = await stageDocsForSiteRuntime();
    const stagedIndex = await fs.readFile(path.join(second.stagedDocsRoot, "index.md"), "utf8");
    const generatedSourceConfig = await fs.readFile(path.join(second.runtimeRoot, ".source", "source.config.mjs"), "utf8");

    expect(second.runtimeRoot).toBe(first.runtimeRoot);
    expect(stagedIndex).toContain("title: Restaged Index");
    expect(generatedSourceConfig).toBe("export default {};\n");
  });

  it("can refresh runtime metadata without rewriting the staged docs tree", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    const first = await stageDocsForSiteRuntime();
    const stagedIndexPath = path.join(first.stagedDocsRoot, "index.md");
    const initialIndex = await fs.readFile(stagedIndexPath, "utf8");

    await fs.writeFile(
      path.join(fixture.root, ".opendaas", "project", "overview.yaml"),
      [
        "name: Test Project",
        "summary: Updated control-plane summary without touching authored docs.",
        "docPath: project/overview.md",
        ""
      ].join("\n"),
      "utf8"
    );

    const second = await stageDocsForSiteRuntime(undefined, { syncDocs: false });
    const restagedIndex = await fs.readFile(path.join(second.stagedDocsRoot, "index.md"), "utf8");

    expect(second.runtimeRoot).toBe(first.runtimeRoot);
    expect(restagedIndex).toBe(initialIndex);
  });

  it("tracks authored doc revisions and exposes changed docs in the site snapshot", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    await stageDocsForSiteRuntime();
    await fs.writeFile(
      path.join(fixture.root, "docs", "project", "overview.md"),
      `---\nname: Project Overview\ndescription: Project overview page.\n---\n\n# Project Overview\n\n## 项目摘要\n\n第二版项目介绍。\n`,
      "utf8"
    );

    await stageDocsForSiteRuntime();
    const snapshot = await buildSiteControlPlaneSnapshot(path.join(fixture.root, "docs"));
    const overviewPage = snapshot.docs.pages.find((page) => page.path === "project/overview.md");

    expect(overviewPage?.revisionCount).toBe(2);
    expect(snapshot.docs.changedPages.some((page) => page.path === "project/overview.md")).toBe(true);
  });

  it("stops the runtime without deleting the staged runtime root", async () => {
    const fixture = await createWorkspaceFixture();
    restorers.push(fixture.use());
    cleanups.push(fixture.cleanup);

    const staged = await stageDocsForSiteRuntime();
    await fs.writeFile(
      staged.registryFile,
      JSON.stringify(
        {
          siteId: staged.siteId,
          pid: null,
          watcherPid: null,
          port: 4310,
          url: "http://127.0.0.1:4310/docs",
          runtimeBase: staged.runtimeBase,
          runtimeRoot: staged.runtimeRoot,
          templateRoot: staged.templateRoot,
          sourceDocsRoot: staged.sourceDocsRoot,
          sourceWorkspaceRoot: staged.sourceWorkspaceRoot,
          stagedDocsRoot: staged.stagedDocsRoot,
          logFile: staged.logFile,
          startedAt: "2026-04-20T00:00:00.000Z",
          mode: "dev"
        },
        null,
        2
      ) + "\n",
      "utf8"
    );

    const result = await stopSiteRuntime();
    const runtimeMetadata = JSON.parse(await fs.readFile(staged.runtimeFile, "utf8")) as {
      mode: string;
      port: number | null;
      url: string | null;
    };
    const registry = JSON.parse(await fs.readFile(staged.registryFile, "utf8")) as {
      pid: number | null;
      watcherPid: number | null;
      port: number;
    };

    expect(result.preservedRuntime).toBe(true);
    expect(result.runtimeRoot).toBe(staged.runtimeRoot);
    expect(runtimeMetadata.mode).toBe("staged");
    expect(runtimeMetadata.port).toBeNull();
    expect(runtimeMetadata.url).toBeNull();
    expect(registry.pid).toBeNull();
    expect(registry.watcherPid).toBeNull();
    expect(registry.port).toBe(4310);
  });

  it("watches the whole control-plane root so project/config changes can restage the runtime", async () => {
    const fixture = await createWorkspaceFixture();
    cleanups.push(fixture.cleanup);

    const watchRoots = resolveSiteWatchRoots(path.join(fixture.root, "docs"));

    expect(watchRoots).toContain(path.join(fixture.root, "docs"));
    expect(watchRoots).toContain(path.join(fixture.root, ".opendaas"));
    expect(watchRoots).toContain(path.join(fixture.root, ".agents"));
  });
});
