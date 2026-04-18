import crypto from "node:crypto";
import fs from "node:fs/promises";
import nodeFs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { readText, writeText } from "./storage.js";
import { buildSiteControlPlaneSnapshot } from "./site-data.js";
import { getWorkspacePaths, resolveWorkspaceRoot, withWorkspaceRoot } from "./workspace.js";
import { diffCheck } from "./diff.js";

interface SiteRuntimeRegistry {
  siteId: string;
  pid: number | null;
  watcherPid: number | null;
  port: number;
  url: string;
  runtimeBase: string;
  runtimeRoot: string;
  templateRoot: string;
  sourceDocsRoot: string;
  sourceWorkspaceRoot: string | null;
  stagedDocsRoot: string;
  logFile: string;
  startedAt: string;
  mode: "open" | "dev" | "build";
}

interface GlobalSiteRegistryEntry {
  siteId: string;
  sourceDocsRoot: string;
  sourceWorkspaceRoot: string | null;
  runtimeRoot: string;
  port: number;
  url: string;
  startedAt: string;
  mode: "open" | "dev" | "build";
}

type GlobalSiteRegistry = Record<string, GlobalSiteRegistryEntry>;

interface StageResult {
  siteId: string;
  sourceDocsRoot: string;
  sourceWorkspaceRoot: string | null;
  runtimeBase: string;
  runtimeRoot: string;
  templateRoot: string;
  stagedDocsRoot: string;
  runtimeDataRoot: string;
  fileCount: number;
  pageCount: number;
  registryFile: string;
  dataFile: string;
  versionFile: string;
  runtimeFile: string;
  logFile: string;
}

function extractFrontmatter(content: string): { data: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: content };
  }

  const raw = match[1];
  const body = match[2];
  const data: Record<string, string> = {};

  for (const line of raw.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    data[key] = value;
  }

  return { data, body };
}

function isMarkdownFile(filePath: string): boolean {
  return [".md", ".mdx"].includes(path.extname(filePath).toLowerCase());
}

async function collectSiteSourceFiles(root: string, base = root): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.name.startsWith(".")) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await collectSiteSourceFiles(fullPath, base)));
      continue;
    }

    if (entry.isFile()) {
      files.push(path.relative(base, fullPath).replace(/\\/g, "/"));
    }
  }

  return files.sort();
}

async function resolveDocsRoot(inputPath?: string): Promise<string> {
  if (!inputPath) {
    return getWorkspacePaths().docsRoot;
  }

  const absolute = path.resolve(inputPath);
  const stats = await fs.stat(absolute);

  if (stats.isDirectory()) {
    if (path.basename(absolute) === "docs") {
      return absolute;
    }

    const nestedDocs = path.join(absolute, "docs");
    const nestedStats = await fs.stat(nestedDocs).catch(() => null);
    if (nestedStats?.isDirectory()) {
      return nestedDocs;
    }
  }

  throw new Error(`Unable to resolve a docs root from ${inputPath}`);
}

function convertForFumadocs(content: string, fallbackTitle: string): string {
  const { data, body } = extractFrontmatter(content);
  const title = data.name ?? fallbackTitle;
  const description = data.description ?? "";

  const frontmatter = ["---", `title: ${title}`, `description: ${description}`, "---", ""].join(
    "\n"
  );
  return `${frontmatter}${body.trimStart()}`;
}

function getTemplateRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../site-runtime");
}

function getRuntimeBase(): string {
  const override = process.env.OPENDAAS_SITE_RUNTIME_BASE;
  if (override) {
    return path.resolve(override);
  }

  if (process.platform === "win32") {
    return path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"), "OpenDaaS", "runtime");
  }

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "OpenDaaS", "runtime");
  }

  return path.join(process.env.XDG_STATE_HOME ?? path.join(os.homedir(), ".local", "state"), "opendaas", "runtime");
}

function tryResolveWorkspaceRootFromDocsRoot(sourceDocsRoot: string): string | null {
  try {
    return resolveWorkspaceRoot(path.dirname(sourceDocsRoot));
  } catch {
    return null;
  }
}

function createSiteId(sourceDocsRoot: string, sourceWorkspaceRoot: string | null): string {
  const seed = sourceWorkspaceRoot ?? sourceDocsRoot;
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  return hash.slice(0, 16);
}

function getRuntimeRoot(siteId: string, runtimeBase = getRuntimeBase()): string {
  return path.join(runtimeBase, "sites", siteId);
}

function getGlobalRegistryFile(runtimeBase = getRuntimeBase()): string {
  return path.join(runtimeBase, "registry", "sites.json");
}

function getRegistryFile(runtimeRoot: string): string {
  return path.join(runtimeRoot, "runtime-data", "registry.json");
}

async function readRegistry(runtimeRoot: string): Promise<SiteRuntimeRegistry | null> {
  try {
    return JSON.parse(await readText(getRegistryFile(runtimeRoot))) as SiteRuntimeRegistry;
  } catch {
    return null;
  }
}

async function writeRegistry(registry: SiteRuntimeRegistry): Promise<void> {
  await writeText(getRegistryFile(registry.runtimeRoot), `${JSON.stringify(registry, null, 2)}\n`);
}

async function readGlobalRegistry(runtimeBase: string): Promise<GlobalSiteRegistry> {
  try {
    return JSON.parse(await readText(getGlobalRegistryFile(runtimeBase))) as GlobalSiteRegistry;
  } catch {
    return {};
  }
}

async function updateGlobalRegistry(runtimeBase: string, entry: GlobalSiteRegistryEntry): Promise<void> {
  const registry = await readGlobalRegistry(runtimeBase);
  registry[entry.siteId] = entry;
  await writeText(getGlobalRegistryFile(runtimeBase), `${JSON.stringify(registry, null, 2)}\n`);
}

async function removeGlobalRegistryEntry(runtimeBase: string, siteId: string): Promise<void> {
  const registry = await readGlobalRegistry(runtimeBase);
  delete registry[siteId];
  await writeText(getGlobalRegistryFile(runtimeBase), `${JSON.stringify(registry, null, 2)}\n`);
}

function createNpmInvocation(args: string[]): { command: string; args: string[] } {
  if (process.platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/c", "npm", ...args]
    };
  }

  return {
    command: "npm",
    args
  };
}

function createNextInvocation(
  runtimeRoot: string,
  subcommand: "dev" | "build",
  args: string[] = []
): { command: string; args: string[] } {
  return {
    command: process.execPath,
    args: [path.join(runtimeRoot, "node_modules", "next", "dist", "bin", "next"), subcommand, ...args]
  };
}

function processExists(pid: number | null): boolean {
  if (!pid) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function waitForPort(port: number, timeoutMs = 15000): Promise<boolean> {
  const start = Date.now();

  return new Promise((resolve) => {
    const attempt = () => {
      const socket = net.createConnection({ port, host: "127.0.0.1" });

      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - start >= timeoutMs) {
          resolve(false);
          return;
        }
        setTimeout(attempt, 250);
      });
    };

    attempt();
  });
}

async function findAvailablePort(startPort = 4310): Promise<number> {
  for (let port = startPort; port < startPort + 100; port += 1) {
    const isOpen = await waitForPort(port, 250);
    if (!isOpen) {
      return port;
    }
  }

  throw new Error("Unable to find an available port for the OpenDaaS site runtime.");
}

async function terminateProcessTree(pid: number): Promise<void> {
  if (process.platform === "win32") {
    const result = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      encoding: "utf8"
    });
    if (result.status !== 0 && !result.stderr.includes("not found")) {
      throw new Error(result.stderr.trim() || `Failed to terminate PID ${pid}`);
    }
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    return;
  }
}

async function ensureRuntimeTemplate(runtimeRoot: string): Promise<void> {
  const templateRoot = getTemplateRoot();
  const managedEntries = [
    "app",
    "lib",
    "components",
    "package.json",
    "package-lock.json",
    "next-env.d.ts",
    "next.config.mjs",
    "postcss.config.mjs",
    "source.config.ts",
    "tsconfig.json"
  ];

  await fs.mkdir(runtimeRoot, { recursive: true });
  for (const entry of managedEntries) {
    const source = path.join(templateRoot, entry);
    const target = path.join(runtimeRoot, entry);
    const stats = await fs.stat(source).catch(() => null);
    if (!stats) {
      continue;
    }
    await fs.rm(target, { recursive: true, force: true });
    await fs.cp(source, target, {
      recursive: true,
      force: true
    });
  }

  await fs.mkdir(path.join(runtimeRoot, "content"), { recursive: true });
  await fs.mkdir(path.join(runtimeRoot, "runtime-data"), { recursive: true });

  const nodeModulesRoot = path.join(runtimeRoot, "node_modules");
  const nextPackage = path.join(nodeModulesRoot, "next");
  const nextPackageJson = path.join(nextPackage, "package.json");
  const nextRequireHook = path.join(nextPackage, "dist", "server", "require-hook.js");

  if (!nodeFs.existsSync(nextPackageJson) || !nodeFs.existsSync(nextRequireHook)) {
    await fs.rm(nodeModulesRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    const invocation = createNpmInvocation(["install", "--no-fund", "--no-audit"]);
    const child = spawn(invocation.command, invocation.args, {
      cwd: runtimeRoot,
      stdio: "inherit",
      shell: false
    });

    const exitCode = await new Promise<number>((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (code) => resolve(code ?? 1));
    });

    if (exitCode !== 0) {
      throw new Error(`site runtime dependency install failed with exit code ${exitCode}`);
    }
  }
}

async function writeRuntimeVersion(runtimeDataRoot: string): Promise<string> {
  const payload = {
    updatedAt: new Date().toISOString()
  };
  const versionFile = path.join(runtimeDataRoot, "version.json");
  await writeText(versionFile, `${JSON.stringify(payload, null, 2)}\n`);
  return versionFile;
}

async function writeRuntimeMetadata(stage: {
  siteId: string;
  sourceDocsRoot: string;
  sourceWorkspaceRoot: string | null;
  runtimeRoot: string;
  templateRoot: string;
  runtimeDataRoot: string;
  mode: "staged" | "open" | "dev" | "build";
  port?: number;
  url?: string;
}) {
  const runtimeFile = path.join(stage.runtimeDataRoot, "runtime.json");
  await writeText(
    runtimeFile,
    `${JSON.stringify(
      {
        siteId: stage.siteId,
        sourceDocsRoot: stage.sourceDocsRoot,
        sourceWorkspaceRoot: stage.sourceWorkspaceRoot,
        runtimeRoot: stage.runtimeRoot,
        templateRoot: stage.templateRoot,
        mode: stage.mode,
        port: stage.port ?? null,
        url: stage.url ?? null,
        updatedAt: new Date().toISOString()
      },
      null,
      2
    )}\n`
  );
  return runtimeFile;
}

export async function stageDocsForSiteRuntime(inputPath?: string): Promise<StageResult> {
  const sourceDocsRoot = await resolveDocsRoot(inputPath);
  const sourceWorkspaceRoot = tryResolveWorkspaceRootFromDocsRoot(sourceDocsRoot);
  const runtimeBase = getRuntimeBase();
  const siteId = createSiteId(sourceDocsRoot, sourceWorkspaceRoot);
  const runtimeRoot = getRuntimeRoot(siteId, runtimeBase);
  const stagedDocsRoot = path.join(runtimeRoot, "content", "docs");
  const runtimeDataRoot = path.join(runtimeRoot, "runtime-data");
  const templateRoot = getTemplateRoot();
  const logFile = path.join(runtimeRoot, "runtime-data", "site.log");

  await fs.mkdir(stagedDocsRoot, { recursive: true });
  await fs.mkdir(runtimeDataRoot, { recursive: true });
  await fs.rm(stagedDocsRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  await fs.mkdir(stagedDocsRoot, { recursive: true });

  const sourceFiles = await collectSiteSourceFiles(sourceDocsRoot);
  let pageCount = 0;

  for (const relativePath of sourceFiles) {
    const sourceFile = path.join(sourceDocsRoot, relativePath);
    const targetFile = path.join(stagedDocsRoot, relativePath);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });

    if (isMarkdownFile(relativePath)) {
      const titleFallback = path.basename(relativePath, path.extname(relativePath));
      const source = await readText(sourceFile);
      const transformed = convertForFumadocs(source, titleFallback);
      await writeText(targetFile, transformed);
      pageCount += 1;
      continue;
    }

    await fs.copyFile(sourceFile, targetFile);
  }

  if (sourceWorkspaceRoot) {
    await withWorkspaceRoot(sourceWorkspaceRoot, async () => {
      await diffCheck();
    });
  }

  const snapshot = await buildSiteControlPlaneSnapshot(sourceDocsRoot);
  const dataFile = path.join(runtimeDataRoot, "control-plane.json");
  await writeText(dataFile, `${JSON.stringify(snapshot, null, 2)}\n`);
  const versionFile = await writeRuntimeVersion(runtimeDataRoot);
  const runtimeFile = await writeRuntimeMetadata({
    siteId,
    sourceDocsRoot,
    sourceWorkspaceRoot,
    runtimeRoot,
    templateRoot,
    runtimeDataRoot,
    mode: "staged"
  });

  return {
    siteId,
    sourceDocsRoot,
    sourceWorkspaceRoot,
    runtimeBase,
    runtimeRoot,
    templateRoot,
    stagedDocsRoot,
    runtimeDataRoot,
    fileCount: sourceFiles.length,
    pageCount,
    registryFile: getRegistryFile(runtimeRoot),
    dataFile,
    versionFile,
    runtimeFile,
    logFile
  };
}

function watcherWorkerPath(): { command: string; args: string[] } {
  const currentPath = fileURLToPath(import.meta.url);
  const sourcePath = currentPath.replace(/site\.js$/, "site-watch-worker.js");
  const tsPath = currentPath.replace(/site\.ts$/, "site-watch-worker.ts");

  if (currentPath.endsWith(".ts") && nodeFs.existsSync(tsPath)) {
    return {
      command: process.execPath,
      args: ["--import", "tsx", tsPath]
    };
  }

  return {
    command: process.execPath,
    args: [sourcePath]
  };
}

async function ensureWatcher(stage: StageResult, registry: SiteRuntimeRegistry | null): Promise<number | null> {
  if (registry?.watcherPid && processExists(registry.watcherPid)) {
    return registry.watcherPid;
  }

  const worker = watcherWorkerPath();
  const child = spawn(worker.command, [...worker.args, stage.sourceDocsRoot, stage.runtimeRoot], {
    cwd: stage.runtimeRoot,
    detached: true,
    stdio: "ignore",
    shell: false
  });
  child.unref();
  return child.pid ?? null;
}

async function ensureSiteRuntimeServer(stage: StageResult, mode: "open" | "dev") {
  await ensureRuntimeTemplate(stage.runtimeRoot);

  const existing = await readRegistry(stage.runtimeRoot);
  const preferredPort = existing && existing.port > 0 ? existing.port : 4310;
  const reuseExisting = existing && processExists(existing.pid) && (await waitForPort(existing.port, 500));
  const port = reuseExisting ? existing!.port : await findAvailablePort(preferredPort);
  const url = `http://127.0.0.1:${port}/docs`;
  let pid = reuseExisting ? existing!.pid : null;
  let watcherPid = existing?.watcherPid ?? null;

  if (!reuseExisting) {
    const invocation = createNextInvocation(stage.runtimeRoot, "dev", [
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port)
    ]);
    const output = nodeFs.openSync(stage.logFile, "a");
    const child = spawn(invocation.command, invocation.args, {
      cwd: stage.runtimeRoot,
      detached: true,
      stdio: ["ignore", output, output],
      shell: false
    });
    child.unref();
    pid = child.pid ?? null;

    const ready = await waitForPort(port, 90000);
    if (!ready) {
      throw new Error(`site runtime did not become reachable at ${url} within the timeout.`);
    }
  }

  if (mode === "dev") {
    watcherPid = await ensureWatcher(stage, existing);
  }

  const nextRegistry: SiteRuntimeRegistry = {
    siteId: stage.siteId,
    pid,
    watcherPid,
    port,
    url,
    runtimeBase: stage.runtimeBase,
    runtimeRoot: stage.runtimeRoot,
    templateRoot: stage.templateRoot,
    sourceDocsRoot: stage.sourceDocsRoot,
    sourceWorkspaceRoot: stage.sourceWorkspaceRoot,
    stagedDocsRoot: stage.stagedDocsRoot,
    logFile: stage.logFile,
    startedAt: new Date().toISOString(),
    mode
  };

  await writeRegistry(nextRegistry);
  await writeRuntimeMetadata({
    siteId: stage.siteId,
    sourceDocsRoot: stage.sourceDocsRoot,
    sourceWorkspaceRoot: stage.sourceWorkspaceRoot,
    runtimeRoot: stage.runtimeRoot,
    templateRoot: stage.templateRoot,
    runtimeDataRoot: stage.runtimeDataRoot,
    mode,
    port,
    url
  });
  await updateGlobalRegistry(stage.runtimeBase, {
    siteId: stage.siteId,
    sourceDocsRoot: stage.sourceDocsRoot,
    sourceWorkspaceRoot: stage.sourceWorkspaceRoot,
    runtimeRoot: stage.runtimeRoot,
    port,
    url,
    startedAt: nextRegistry.startedAt,
    mode
  });

  return {
    ...stage,
    url,
    port,
    alreadyRunning: reuseExisting,
    pid,
    watcherPid
  };
}

export async function buildSiteRuntime(inputPath?: string) {
  const stage = await stageDocsForSiteRuntime(inputPath);
  await ensureRuntimeTemplate(stage.runtimeRoot);

  const invocation = createNextInvocation(stage.runtimeRoot, "build");
  const child = spawn(invocation.command, invocation.args, {
    cwd: stage.runtimeRoot,
    stdio: "inherit",
    shell: false
  });

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    throw new Error(`site runtime build failed with exit code ${exitCode}`);
  }

  const registry: SiteRuntimeRegistry = {
    siteId: stage.siteId,
    pid: null,
    watcherPid: null,
    port: 0,
    url: "",
    runtimeBase: stage.runtimeBase,
    runtimeRoot: stage.runtimeRoot,
    templateRoot: stage.templateRoot,
    sourceDocsRoot: stage.sourceDocsRoot,
    sourceWorkspaceRoot: stage.sourceWorkspaceRoot,
    stagedDocsRoot: stage.stagedDocsRoot,
    logFile: stage.logFile,
    startedAt: new Date().toISOString(),
    mode: "build"
  };
  await writeRegistry(registry);
  await writeRuntimeMetadata({
    siteId: stage.siteId,
    sourceDocsRoot: stage.sourceDocsRoot,
    sourceWorkspaceRoot: stage.sourceWorkspaceRoot,
    runtimeRoot: stage.runtimeRoot,
    templateRoot: stage.templateRoot,
    runtimeDataRoot: stage.runtimeDataRoot,
    mode: "build"
  });

  return {
    ...stage,
    buildOutput: path.join(stage.runtimeRoot, ".next")
  };
}

export async function devSiteRuntime(inputPath?: string) {
  const stage = await stageDocsForSiteRuntime(inputPath);
  return ensureSiteRuntimeServer(stage, "dev");
}

export async function openSiteRuntime(inputPath?: string) {
  const stage = await stageDocsForSiteRuntime(inputPath);
  return ensureSiteRuntimeServer(stage, "open");
}

export async function cleanSiteRuntime(inputPath?: string) {
  const sourceDocsRoot = await resolveDocsRoot(inputPath);
  const sourceWorkspaceRoot = tryResolveWorkspaceRootFromDocsRoot(sourceDocsRoot);
  const siteId = createSiteId(sourceDocsRoot, sourceWorkspaceRoot);
  const runtimeBase = getRuntimeBase();
  const runtimeRoot = getRuntimeRoot(siteId, runtimeBase);
  const registry = await readRegistry(runtimeRoot);

  if (registry?.watcherPid && processExists(registry.watcherPid)) {
    await terminateProcessTree(registry.watcherPid);
  }

  if (registry?.pid && processExists(registry.pid)) {
    await terminateProcessTree(registry.pid);
  }

  const existed = nodeFs.existsSync(runtimeRoot);
  if (existed) {
    await fs.rm(runtimeRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  }

  await removeGlobalRegistryEntry(runtimeBase, siteId);

  return {
    runtimeBase,
    runtimeRoot,
    siteId,
    cleaned: existed,
    terminatedPid: registry?.pid ?? null,
    terminatedWatcherPid: registry?.watcherPid ?? null
  };
}
