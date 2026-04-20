import { AclipApp, stringArgument } from "@rendo-studio/aclip";
import { buildSiteRuntime, cleanSiteRuntime, openSiteRuntime, stopSiteRuntime } from "../../core/site.js";
import { withGuideHint } from "../guide-hint.js";

export function registerSiteGroup(app: AclipApp) {
  app
    .group("site", {
      summary: "Run the docs site view.",
      description: withGuideHint(
        "Open or build a docs-site view from a project root or docs-pack path without writing build output back into the repository."
      )
    })
    .command("open", {
      summary: "Start or reuse the local docs site runtime.",
      description: withGuideHint(
        "Resolve the configured or explicit docs pack path, start the hot-reloading local docs site runtime, and return the live access URL."
      ),
      arguments: [
        stringArgument("path", {
          required: false,
          description: "Optional project root or docs-pack path. Defaults to the configured docs-site source path."
        })
      ],
      examples: [
        "opendaas site open",
        "opendaas site open --path D:/project/example",
        "opendaas site open --path D:/project/example/docs"
      ],
      handler: async ({ path }) => {
        const runtime = await openSiteRuntime(path ? String(path) : undefined);
        return {
          site: {
            sourcePath: path ? String(path) : runtime.sourceDocsRoot,
            runtimeMode: "open",
            framework: "fumadocs",
            runtimeRoot: runtime.runtimeRoot,
            stagedSourcePath: runtime.sourceDocsRoot,
            stagedDocsRoot: runtime.stagedDocsRoot,
            stagedFileCount: runtime.fileCount,
            url: runtime.url,
            alreadyRunning: runtime.alreadyRunning,
            pid: runtime.pid,
            logFile: runtime.logFile
          }
        };
      }
    })
    .command("build", {
      summary: "Stage docs for the site runtime.",
      description: withGuideHint(
        "Prepare and build the Fumadocs site runtime from a project root or docs package."
      ),
      arguments: [
        stringArgument("path", {
          required: false,
          description: "Optional project root or docs-pack path. Defaults to the current workspace docs."
        })
      ],
      examples: ["opendaas site build", "opendaas site build --path D:/project/example/docs"],
      handler: async ({ path }) => ({
        site: await buildSiteRuntime(path ? String(path) : undefined)
      })
    })
    .command("stop", {
      summary: "Stop the local docs runtime but keep the staged runtime.",
      description: withGuideHint(
        "Terminate the managed local docs server and watcher while preserving the staged runtime so the next open can restart faster."
      ),
      arguments: [
        stringArgument("path", {
          required: false,
          description: "Optional project root or docs-pack path. Defaults to the configured docs-site source path."
        })
      ],
      examples: ["opendaas site stop", "opendaas site stop --path D:/project/example"],
      handler: async ({ path }) => ({
        site: await stopSiteRuntime(path ? String(path) : undefined)
      })
    })
    .command("clean", {
      summary: "Stop and clean the local docs runtime.",
      description: withGuideHint(
        "Terminate the managed local docs server if it is running and remove the staged runtime so the next open starts from a cold state."
      ),
      arguments: [
        stringArgument("path", {
          required: false,
          description: "Optional project root or docs-pack path. Defaults to the configured docs-site source path."
        })
      ],
      examples: ["opendaas site clean", "opendaas site clean --path D:/project/example"],
      handler: async ({ path }) => ({
        site: await cleanSiteRuntime(path ? String(path) : undefined)
      })
    });
}
