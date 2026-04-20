import crypto from "node:crypto";
import fs from "node:fs/promises";
import nodeFs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { emptyDocsRevisionState, loadDocsRevisionState, syncDocsRevisionState } from "./docs-revisions.js";
import { readText, writeText } from "./storage.js";
import { buildSiteControlPlaneSnapshot } from "./site-data.js";
import { loadWorkspaceConfig } from "./workspace-config.js";
import { getWorkspacePaths, resolveWorkspaceRoot, withWorkspaceRoot } from "./workspace.js";

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
  docsRevisionDataFile: string;
  versionFile: string;
  runtimeFile: string;
  logFile: string;
  preferredPort: number | null;
}

interface StageDocsOptions {
  syncDocs?: boolean;
}

interface ResolvedSiteRuntimeLocation {
  sourceDocsRoot: string;
  sourceWorkspaceRoot: string | null;
  siteId: string;
  runtimeBase: string;
  runtimeRoot: string;
  runtimeDataRoot: string;
  templateRoot: string;
}

interface RootMetaFile {
  title?: string;
  pages?: string[];
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

async function pruneEmptyDirectories(root: string, preserveRoot = true): Promise<void> {
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    await pruneEmptyDirectories(path.join(root, entry.name), false);
  }

  if (preserveRoot) {
    return;
  }

  const remaining = await fs.readdir(root).catch(() => []);
  if (remaining.length === 0) {
    await fs.rmdir(root).catch(() => undefined);
  }
}

async function syncDirectoryContents(sourceRoot: string, targetRoot: string): Promise<void> {
  await fs.mkdir(targetRoot, { recursive: true });

  const sourceFiles = await collectSiteSourceFiles(sourceRoot);
  const targetFiles = await collectSiteSourceFiles(targetRoot).catch(() => []);
  const sourceSet = new Set(sourceFiles);

  for (const relativePath of sourceFiles) {
    const sourceFile = path.join(sourceRoot, relativePath);
    const targetFile = path.join(targetRoot, relativePath);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.copyFile(sourceFile, targetFile);
  }

  for (const relativePath of targetFiles.filter((file) => !sourceSet.has(file)).sort().reverse()) {
    await fs.rm(path.join(targetRoot, relativePath), {
      force: true,
      maxRetries: 3,
      retryDelay: 200
    });
  }

  await pruneEmptyDirectories(targetRoot);
}

async function looksLikeDocsPack(root: string): Promise<boolean> {
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  return entries.some((entry) => {
    if (!entry.isFile()) {
      return false;
    }

    if (entry.name === "meta.json") {
      return true;
    }

    return isMarkdownLike(entry.name);
  });
}

async function resolveDocsRoot(inputPath?: string): Promise<string> {
  if (!inputPath) {
    const paths = getWorkspacePaths();
    const config = await loadWorkspaceConfig(paths.root).catch(() => null);
    if (config?.docsSite.sourcePath) {
      const configuredPath = path.resolve(paths.root, config.docsSite.sourcePath);
      return resolveDocsRoot(configuredPath);
    }
    return paths.docsRoot;
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

    if (await looksLikeDocsPack(absolute)) {
      return absolute;
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

function renderRuntimeConsoleDoc(title: string, description: string): string {
  return `---\nname: ${title}\ndescription: ${description}\n---\n\n# ${title}\n`;
}

function isMarkdownLike(fileName: string): boolean {
  return [".md", ".mdx"].includes(path.extname(fileName).toLowerCase());
}

function isConsoleMetaSeparator(value: string): boolean {
  return /^---\s*console\s*---$/i.test(value.trim());
}

async function listDefaultRootPages(stagedDocsRoot: string): Promise<string[]> {
  const entries = await fs.readdir(stagedDocsRoot, { withFileTypes: true });
  const pages: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "meta.json" || entry.name === "console") {
      continue;
    }

    if (entry.isDirectory()) {
      pages.push(entry.name);
      continue;
    }

    if (entry.isFile() && isMarkdownLike(entry.name)) {
      pages.push(path.basename(entry.name, path.extname(entry.name)));
    }
  }

  const unique = [...new Set(pages)];
  return [
    ...unique.filter((item) => item === "index"),
    ...unique.filter((item) => item !== "index").sort((left, right) => left.localeCompare(right))
  ];
}

async function patchRootMetaForConsole(stagedDocsRoot: string): Promise<void> {
  const metaPath = path.join(stagedDocsRoot, "meta.json");
  let rootMeta: RootMetaFile = {};

  try {
    rootMeta = JSON.parse(await readText(metaPath)) as RootMetaFile;
  } catch {
    rootMeta = {};
  }

  const sourcePages = Array.isArray(rootMeta.pages) ? rootMeta.pages : await listDefaultRootPages(stagedDocsRoot);
  const nextPages = [
    "console",
    ...sourcePages.filter((item) => item !== "console" && item !== "index" && !isConsoleMetaSeparator(item))
  ];

  await writeText(
    metaPath,
    `${JSON.stringify(
      {
        ...rootMeta,
        pages: nextPages
      },
      null,
      2
    )}\n`
  );
}

async function injectRuntimeConsoleDocs(stagedDocsRoot: string): Promise<void> {
  const consoleRoot = path.join(stagedDocsRoot, "console");
  await fs.rm(consoleRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  await fs.mkdir(consoleRoot, { recursive: true });

  await writeText(
    path.join(consoleRoot, "meta.json"),
    `${JSON.stringify(
      {
        title: "Console",
        pages: ["index", "tasks"]
      },
      null,
      2
    )}\n`
  );

  await writeText(
    path.join(consoleRoot, "index.md"),
    convertForFumadocs(
      renderRuntimeConsoleDoc("Overview", "OpenDaaS runtime console overview."),
      "Overview"
    )
  );
  await writeText(
    path.join(consoleRoot, "tasks.md"),
    convertForFumadocs(
      renderRuntimeConsoleDoc("Tasks", "OpenDaaS runtime task console."),
      "Tasks"
    )
  );

  await patchRootMetaForConsole(stagedDocsRoot);
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
    const command =
      process.env.ComSpec ??
      path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "cmd.exe");
    return {
      command,
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

function escapePowerShellSingleQuoted(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function writeWindowsBackgroundScript(options: {
  scriptPath: string;
  cwd: string;
  command: string;
  args: string[];
  logFile?: string;
  mirrorLogsToConsole?: boolean;
  bannerLines?: string[];
}): Promise<void> {
  const lines = [
    `$OutputEncoding = [System.Text.UTF8Encoding]::new($false)`,
    `Set-Location -LiteralPath ${escapePowerShellSingleQuoted(options.cwd)}`
  ];
  const mirrorLogsToConsole = options.mirrorLogsToConsole ?? false;
  const logFileLiteral = options.logFile ? escapePowerShellSingleQuoted(options.logFile) : null;
  const invocation = [
    "&",
    escapePowerShellSingleQuoted(options.command),
    ...options.args.map((arg) => escapePowerShellSingleQuoted(arg))
  ].join(" ");
  const redirected = logFileLiteral
    ? mirrorLogsToConsole
      ? `${invocation} 2>&1 | Tee-Object -FilePath ${logFileLiteral} -Append`
      : `${invocation} *>> ${logFileLiteral}`
    : mirrorLogsToConsole
      ? invocation
      : `${invocation} *> $null`;

  for (const line of options.bannerLines ?? []) {
    const literal = escapePowerShellSingleQuoted(line);
    if (logFileLiteral && mirrorLogsToConsole) {
      lines.push(`Write-Output ${literal} | Tee-Object -FilePath ${logFileLiteral} -Append`);
      continue;
    }
    if (logFileLiteral) {
      lines.push(`Write-Output ${literal} | Out-File -FilePath ${logFileLiteral} -Append -Encoding utf8`);
      continue;
    }
    lines.push(`Write-Output ${literal}`);
  }

  lines.push(redirected);
  lines.push("exit $LASTEXITCODE");

  await fs.writeFile(options.scriptPath, `${lines.join("\r\n")}\r\n`, "utf8");
}

function startHiddenWindowsScript(scriptPath: string): number | null {
  const launcherArgs = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath]
    .map((value) => escapePowerShellSingleQuoted(value))
    .join(", ");
  const launcher = [
    `$process = Start-Process`,
    `-FilePath ${escapePowerShellSingleQuoted("powershell.exe")}`,
    `-ArgumentList @(${launcherArgs})`,
    `-WindowStyle Hidden`,
    `-WorkingDirectory ${escapePowerShellSingleQuoted(path.dirname(scriptPath))}`,
    `-PassThru;`,
    `$process.Id`
  ].join(" ");
  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", launcher], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(output || `Failed to start hidden Windows background process for ${scriptPath}`);
  }

  const pid = Number.parseInt(result.stdout.trim(), 10);
  return Number.isFinite(pid) ? pid : null;
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForProcessExit(pid: number | null, timeoutMs = 5000): Promise<void> {
  const startedAt = Date.now();
  while (processExists(pid)) {
    if (Date.now() - startedAt >= timeoutMs) {
      break;
    }
    await delay(100);
  }
}

function isIgnorableWindowsTaskkillFailure(output: string): boolean {
  const normalized = output.toLowerCase();
  return [
    "not found",
    "no running instance of the task",
    "the operation attempted is not supported",
    "找不到",
    "没有运行的任务实例",
    "此操作不受支持"
  ].some((pattern) => normalized.includes(pattern));
}

async function renameWithRetries(fromPath: string, toPath: string, attempts = 8): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await fs.rename(fromPath, toPath);
      return;
    } catch (error) {
      lastError = error;
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (!["EBUSY", "EPERM", "ENOTEMPTY"].includes(code)) {
        throw error;
      }
      await delay(150 * (attempt + 1));
    }
  }

  throw lastError;
}

async function clearDirectoryContents(root: string): Promise<void> {
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    const targetPath = path.join(root, entry.name);
    try {
      await fs.rm(targetPath, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 200
      });
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (!["EBUSY", "EPERM", "ENOTEMPTY"].includes(code)) {
        throw error;
      }
      if (entry.isDirectory()) {
        await clearDirectoryContents(targetPath);
      }
    }
  }
}

async function findWindowsRuntimeProcessIds(runtimeRoot: string): Promise<number[]> {
  const query = [
    `$needle = ${escapePowerShellSingleQuoted(runtimeRoot.toLowerCase())}`,
    `Get-CimInstance Win32_Process |`,
    `Where-Object { $_.CommandLine -and $_.CommandLine.ToLowerInvariant().Contains($needle) } |`,
    `Select-Object -ExpandProperty ProcessId`
  ].join(" ");
  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", query], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => Number.parseInt(line.trim(), 10))
    .filter((value) => Number.isFinite(value) && value !== process.pid);
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
    if (result.status !== 0) {
      const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      if (!processExists(pid) || isIgnorableWindowsTaskkillFailure(output)) {
        return;
      }
      throw new Error(output || `Failed to terminate PID ${pid}`);
    }
    await waitForProcessExit(pid);
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    return;
  }

  await waitForProcessExit(pid);
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
  await fs.mkdir(path.join(runtimeRoot, ".source"), { recursive: true });
  await fs.mkdir(path.join(runtimeRoot, "runtime-data"), { recursive: true });
  await fs.copyFile(path.join(templateRoot, "source.config.ts"), path.join(runtimeRoot, ".source", "source.config.mjs"));
  await fs.rm(path.join(runtimeRoot, ".next", "types"), { recursive: true, force: true });
  await fs.rm(path.join(runtimeRoot, ".next", "dev", "types"), { recursive: true, force: true });

  const nodeModulesRoot = path.join(runtimeRoot, "node_modules");
  const nextPackage = path.join(nodeModulesRoot, "next");
  const nextPackageJson = path.join(nextPackage, "package.json");
  const nextRequireHook = path.join(nextPackage, "dist", "server", "require-hook.js");
  const requiredPackages = [
    ["next", "package.json"],
    ["fumadocs-ui", "package.json"],
    ["@radix-ui", "react-accordion", "package.json"],
    ["@radix-ui", "react-progress", "package.json"],
    ["@radix-ui", "react-tooltip", "package.json"],
    ["sonner", "package.json"]
  ];
  const missingRequiredPackage = requiredPackages.some((segments) => !nodeFs.existsSync(path.join(nodeModulesRoot, ...segments)));

  if (!nodeFs.existsSync(nextPackageJson) || !nodeFs.existsSync(nextRequireHook) || missingRequiredPackage) {
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

async function resolveSiteRuntimeLocation(inputPath?: string): Promise<ResolvedSiteRuntimeLocation> {
  const sourceDocsRoot = await resolveDocsRoot(inputPath);
  const sourceWorkspaceRoot = tryResolveWorkspaceRootFromDocsRoot(sourceDocsRoot);
  const runtimeBase = getRuntimeBase();
  const siteId = createSiteId(sourceDocsRoot, sourceWorkspaceRoot);
  const runtimeRoot = getRuntimeRoot(siteId, runtimeBase);
  const runtimeDataRoot = path.join(runtimeRoot, "runtime-data");

  return {
    sourceDocsRoot,
    sourceWorkspaceRoot,
    siteId,
    runtimeBase,
    runtimeRoot,
    runtimeDataRoot,
    templateRoot: getTemplateRoot()
  };
}

export async function stageDocsForSiteRuntime(inputPath?: string, options: StageDocsOptions = {}): Promise<StageResult> {
  const sourceDocsRoot = await resolveDocsRoot(inputPath);
  const sourceWorkspaceRoot = tryResolveWorkspaceRootFromDocsRoot(sourceDocsRoot);
  const workspaceConfig = sourceWorkspaceRoot
    ? await loadWorkspaceConfig(sourceWorkspaceRoot).catch(() => null)
    : null;
  const runtimeBase = getRuntimeBase();
  const siteId = createSiteId(sourceDocsRoot, sourceWorkspaceRoot);
  const runtimeRoot = getRuntimeRoot(siteId, runtimeBase);
  const stagedDocsRoot = path.join(runtimeRoot, "content", "docs");
  const nextDocsRoot = path.join(runtimeRoot, "content", ".next-docs");
  const runtimeDataRoot = path.join(runtimeRoot, "runtime-data");
  const templateRoot = getTemplateRoot();
  const logFile = path.join(runtimeRoot, "runtime-data", "site.log");

  await fs.mkdir(runtimeRoot, { recursive: true });
  await fs.mkdir(runtimeDataRoot, { recursive: true });
  const shouldSyncDocs = options.syncDocs ?? true;
  const sourceFiles = await collectSiteSourceFiles(sourceDocsRoot);
  let pageCount = 0;

  if (shouldSyncDocs) {
    await fs.rm(nextDocsRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    await fs.mkdir(nextDocsRoot, { recursive: true });

    for (const relativePath of sourceFiles) {
      const sourceFile = path.join(sourceDocsRoot, relativePath);
      const targetFile = path.join(nextDocsRoot, relativePath);
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

    await injectRuntimeConsoleDocs(nextDocsRoot);
    await syncDirectoryContents(nextDocsRoot, stagedDocsRoot);
    await fs.rm(nextDocsRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  } else {
    pageCount = sourceFiles.filter((relativePath) => isMarkdownFile(relativePath)).length;
  }

  const docsRevisionState = sourceWorkspaceRoot
    ? shouldSyncDocs
      ? await syncDocsRevisionState(sourceDocsRoot)
      : await loadDocsRevisionState(sourceWorkspaceRoot).catch(() => emptyDocsRevisionState())
    : emptyDocsRevisionState();
  const docsRevisionDataFile = path.join(runtimeDataRoot, "docs-revisions.json");
  await writeText(docsRevisionDataFile, `${JSON.stringify(docsRevisionState, null, 2)}\n`);
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
    docsRevisionDataFile,
    versionFile,
    runtimeFile,
    logFile,
    preferredPort: workspaceConfig?.docsSite.preferredPort ?? null
  };
}

function packageRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

function watcherWorkerPath(): { command: string; args: string[]; cwd: string } {
  const currentPath = fileURLToPath(import.meta.url);
  const root = packageRoot();
  const builtPath = path.join(root, "dist", "core", "site-watch-worker.js");
  const tsPath = path.join(root, "src", "core", "site-watch-worker.ts");
  const jsSiblingPath = currentPath.replace(/site\.js$/, "site-watch-worker.js");

  if (nodeFs.existsSync(builtPath)) {
    return {
      command: process.execPath,
      args: [builtPath],
      cwd: root
    };
  }

  if (currentPath.endsWith(".ts") && nodeFs.existsSync(tsPath)) {
    return {
      command: process.execPath,
      args: ["--import", "tsx", tsPath],
      cwd: root
    };
  }

  return {
    command: process.execPath,
    args: [jsSiblingPath],
    cwd: root
  };
}

async function ensureWatcher(stage: StageResult, registry: SiteRuntimeRegistry | null): Promise<number | null> {
  if (registry?.watcherPid && processExists(registry.watcherPid)) {
    return registry.watcherPid;
  }

  const worker = watcherWorkerPath();
  if (process.platform === "win32") {
    const watcherScript = path.join(stage.runtimeDataRoot, "site-watch.ps1");
    const watcherLogFile = path.join(stage.runtimeDataRoot, "site-watch.log");
    await writeWindowsBackgroundScript({
      scriptPath: watcherScript,
      cwd: worker.cwd,
      command: worker.command,
      args: [...worker.args, stage.sourceDocsRoot, stage.runtimeRoot],
      logFile: watcherLogFile
    });
    return startHiddenWindowsScript(watcherScript);
  }

  const child = spawn(worker.command, [...worker.args, stage.sourceDocsRoot, stage.runtimeRoot], {
    cwd: worker.cwd,
    detached: true,
    stdio: "ignore",
    shell: false,
    windowsHide: true
  });
  child.unref();
  return child.pid ?? null;
}

async function ensureSiteRuntimeServer(stage: StageResult, mode: "open" | "dev") {
  await ensureRuntimeTemplate(stage.runtimeRoot);

  const existing = await readRegistry(stage.runtimeRoot);
  const configuredPort = stage.preferredPort;
  const preferredPort = existing && existing.port > 0 ? existing.port : configuredPort ?? 4310;
  const reuseExisting = existing && processExists(existing.pid) && (await waitForPort(existing.port, 500));
  let port = reuseExisting ? existing!.port : preferredPort;
  let pid = reuseExisting ? existing!.pid : null;
  let watcherPid = existing?.watcherPid ?? null;

  if (!reuseExisting) {
    if (configuredPort !== null) {
      const configuredPortInUse = await waitForPort(configuredPort, 250);
      if (configuredPortInUse) {
        throw new Error(
          `Configured docs-site port ${configuredPort} is already in use. Update .opendaas/config/workspace.yaml or free the port.`
        );
      }
      port = configuredPort;
    } else {
      port = await findAvailablePort(preferredPort);
    }

    const invocation = createNextInvocation(stage.runtimeRoot, "dev", [
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port)
    ]);
    await fs.writeFile(stage.logFile, "", "utf8");

    if (process.platform === "win32") {
      const serverScript = path.join(stage.runtimeDataRoot, "next-server.ps1");
      await writeWindowsBackgroundScript({
        scriptPath: serverScript,
        cwd: stage.runtimeRoot,
        command: invocation.command,
        args: invocation.args,
        logFile: stage.logFile,
        mirrorLogsToConsole: true,
        bannerLines: [
          "[OpenDaaS] Starting Next.js docs runtime",
          `[OpenDaaS] URL: http://127.0.0.1:${port}/docs`,
          `[OpenDaaS] Log file: ${stage.logFile}`
        ]
      });
      pid = startHiddenWindowsScript(serverScript);
    } else {
      const output = nodeFs.openSync(stage.logFile, "w");
      const child = spawn(invocation.command, invocation.args, {
        cwd: stage.runtimeRoot,
        detached: true,
        stdio: ["ignore", output, output],
        shell: false,
        windowsHide: true
      });
      child.unref();
      pid = child.pid ?? null;
    }

    const ready = await waitForPort(port, 90000);
    if (!ready) {
      const failedUrl = `http://127.0.0.1:${port}/docs`;
      throw new Error(`site runtime did not become reachable at ${failedUrl} within the timeout.`);
    }
  }

  const url = `http://127.0.0.1:${port}/docs`;

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
  await fs.rm(path.join(stage.runtimeRoot, ".next"), { recursive: true, force: true });

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

export async function openSiteRuntime(inputPath?: string) {
  const stage = await stageDocsForSiteRuntime(inputPath);
  return ensureSiteRuntimeServer(stage, "dev");
}

export async function devSiteRuntime(inputPath?: string) {
  return openSiteRuntime(inputPath);
}

export async function stopSiteRuntime(inputPath?: string) {
  const target = await resolveSiteRuntimeLocation(inputPath);
  const registry = await readRegistry(target.runtimeRoot);

  if (registry?.watcherPid && processExists(registry.watcherPid)) {
    await terminateProcessTree(registry.watcherPid);
  }

  if (registry?.pid && processExists(registry.pid)) {
    await terminateProcessTree(registry.pid);
  }

  if (process.platform === "win32" && nodeFs.existsSync(target.runtimeRoot)) {
    const extraPids = await findWindowsRuntimeProcessIds(target.runtimeRoot);
    for (const pid of [...new Set(extraPids)]) {
      if (processExists(pid)) {
        await terminateProcessTree(pid);
      }
    }
  }

  const runtimeExists = nodeFs.existsSync(target.runtimeRoot);
  if (runtimeExists) {
    const nextRegistry: SiteRuntimeRegistry = {
      siteId: target.siteId,
      pid: null,
      watcherPid: null,
      port: registry?.port ?? 0,
      url: registry?.url ?? "",
      runtimeBase: target.runtimeBase,
      runtimeRoot: target.runtimeRoot,
      templateRoot: target.templateRoot,
      sourceDocsRoot: target.sourceDocsRoot,
      sourceWorkspaceRoot: target.sourceWorkspaceRoot,
      stagedDocsRoot: registry?.stagedDocsRoot ?? path.join(target.runtimeRoot, "content", "docs"),
      logFile: registry?.logFile ?? path.join(target.runtimeDataRoot, "site.log"),
      startedAt: registry?.startedAt ?? new Date().toISOString(),
      mode: registry?.mode ?? "open"
    };
    await fs.mkdir(target.runtimeDataRoot, { recursive: true });
    await writeRegistry(nextRegistry);
    await writeRuntimeMetadata({
      siteId: target.siteId,
      sourceDocsRoot: target.sourceDocsRoot,
      sourceWorkspaceRoot: target.sourceWorkspaceRoot,
      runtimeRoot: target.runtimeRoot,
      templateRoot: target.templateRoot,
      runtimeDataRoot: target.runtimeDataRoot,
      mode: "staged"
    });
  }

  await removeGlobalRegistryEntry(target.runtimeBase, target.siteId);

  return {
    runtimeBase: target.runtimeBase,
    runtimeRoot: target.runtimeRoot,
    siteId: target.siteId,
    stopped: Boolean(registry?.pid || registry?.watcherPid || runtimeExists),
    preservedRuntime: runtimeExists,
    terminatedPid: registry?.pid ?? null,
    terminatedWatcherPid: registry?.watcherPid ?? null
  };
}

export async function cleanSiteRuntime(inputPath?: string) {
  const stopResult = await stopSiteRuntime(inputPath);
  const { runtimeBase, runtimeRoot, siteId } = stopResult;
  const existed = nodeFs.existsSync(runtimeRoot);

  if (existed) {
    const tombstoneRoot = `${runtimeRoot}.deleting-${Date.now()}`;
    try {
      await renameWithRetries(runtimeRoot, tombstoneRoot);
      await fs.rm(tombstoneRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (!["EBUSY", "EPERM", "ENOTEMPTY"].includes(code)) {
        throw error;
      }
      await clearDirectoryContents(runtimeRoot);
    }
  }

  await removeGlobalRegistryEntry(runtimeBase, siteId);

  return {
    runtimeBase,
    runtimeRoot,
    siteId,
    cleaned: existed,
    terminatedPid: stopResult.terminatedPid,
    terminatedWatcherPid: stopResult.terminatedWatcherPid
  };
}
