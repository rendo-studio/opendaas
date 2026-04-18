import { AclipApp, stringArgument } from "@rendo-studio/aclip";
import { buildSiteRuntime, cleanSiteRuntime, devSiteRuntime, openSiteRuntime } from "../../core/site.js";

export function registerSiteGroup(app: AclipApp) {
  app
    .group("site", {
      summary: "Run the docs site view.",
      description:
        "Open or build a docs-site view from a project root or docs-pack path without writing build output back into the repository."
    })
    .command("open", {
      summary: "Open a local docs site.",
      description:
        "Resolve the docs pack path, build site artifacts into a global runtime directory, and return a local access URL.",
      arguments: [
        stringArgument("path", {
          required: true,
          description: "Project root or docs-pack path."
        })
      ],
      examples: [
        "opendaas site open --path D:/project/example",
        "opendaas site open --path D:/project/example/docs"
      ],
      handler: async ({ path }) => {
        const runtime = await openSiteRuntime(String(path));
        return {
          site: {
            sourcePath: String(path),
            runtimeMode: "local-implicit-deploy",
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
    .command("dev", {
      summary: "Start or reuse the local docs dev runtime.",
      description:
        "Stage docs into the site runtime, ensure the local Fumadocs dev server is running, and return the live docs URL.",
      arguments: [
        stringArgument("path", {
          required: true,
          description: "Project root or docs-pack path."
        })
      ],
      examples: [
        "opendaas site dev --path D:/project/example",
        "opendaas site dev --path D:/project/example/docs"
      ],
      handler: async ({ path }) => ({
        site: {
          ...(await devSiteRuntime(String(path))),
          runtimeMode: "dev"
        }
      })
    })
    .command("build", {
      summary: "Stage docs for the site runtime.",
      description:
        "Prepare and build the Fumadocs site runtime from a project root or docs package.",
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
    .command("clean", {
      summary: "Stop and clean the local docs runtime.",
      description:
        "Terminate the managed local docs dev server if it is running and remove staged docs/build output from the site runtime.",
      examples: ["opendaas site clean"],
      handler: async () => ({
        site: await cleanSiteRuntime()
      })
    });
}
