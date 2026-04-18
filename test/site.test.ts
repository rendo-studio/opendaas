import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { stageDocsForSiteRuntime } from "../src/core/site.js";
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

  it("copies Fumadocs meta files and static assets into the staged content tree", async () => {
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

    expect(JSON.parse(stagedMeta)).toEqual({
      pages: ["index", "project", "engineering"]
    });
    expect(stagedAsset).toBe("site-asset\n");
  });
});
