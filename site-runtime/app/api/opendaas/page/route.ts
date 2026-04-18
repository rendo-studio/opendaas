import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { loadControlPlaneSnapshot, loadRuntimeMetadata } from "@/lib/runtime-data";

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  const runtime = await loadRuntimeMetadata();
  if (runtime.mode !== "dev") {
    return NextResponse.json(
      {
        error: "页面内编辑只在 site dev 模式下开放。"
      },
      {
        status: 409
      }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        relativePath?: string;
        content?: string;
      }
    | null;

  if (!body?.relativePath || typeof body.content !== "string") {
    return NextResponse.json(
      {
        error: "缺少 relativePath 或 content。"
      },
      {
        status: 400
      }
    );
  }

  const snapshot = await loadControlPlaneSnapshot();
  const normalizedPath = body.relativePath.replace(/\\/g, "/");
  const boundary = snapshot.docs.pages.find((page) => page.path === normalizedPath) ?? null;
  if (!boundary) {
    return NextResponse.json(
      {
        error: "无法识别目标页面。"
      },
      {
        status: 404
      }
    );
  }

  if (boundary.mode !== "editable") {
    return NextResponse.json(
      {
        error: "该页面不是可编辑页。"
      },
      {
        status: 403
      }
    );
  }

  const sourceDocsRoot = runtime.sourceDocsRoot || snapshot.workspace.docsRoot;
  const absolute = path.resolve(sourceDocsRoot, normalizedPath);
  const normalizedDocsRoot = path.resolve(sourceDocsRoot);
  if (!absolute.startsWith(normalizedDocsRoot)) {
    return NextResponse.json(
      {
        error: "目标路径越界。"
      },
      {
        status: 400
      }
    );
  }

  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, body.content, "utf8");

  if (runtime.sourceWorkspaceRoot) {
    const sourcesFile = path.join(runtime.sourceWorkspaceRoot, ".opendaas", "diff", "sources.json");
    const registry = await readJsonFile<Record<string, { hash: string; source: "human"; recordedAt: string }>>(sourcesFile, {});
    registry[normalizedPath] = {
      hash: sha256(body.content),
      source: "human",
      recordedAt: new Date().toISOString()
    };
    await fs.writeFile(sourcesFile, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
  }

  return NextResponse.json({
    saved: true,
    relativePath: normalizedPath
  });
}
