import { notFound, redirect } from "next/navigation";
import defaultMdxComponents, { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsPage } from "fumadocs-ui/layouts/docs/page";

import { ConsoleOverviewView } from "../../../components/site/console-overview-view";
import { ConsoleTasksView } from "../../../components/site/console-tasks-view";
import { LiveRefresh } from "../../../components/site/live-refresh";
import { loadControlPlaneSnapshot, loadRuntimeMetadata, loadRuntimeVersion } from "../../../lib/runtime-data";
import { source } from "../../../lib/source";

export function generateStaticParams() {
  return source.generateParams();
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const key = (params.slug ?? []).join("/");

  if (!params.slug || params.slug.length === 0) {
    redirect("/docs/console");
  }

  if (key === "console/overview") {
    redirect("/docs/console");
  }

  const runtime = await loadRuntimeMetadata();
  const version = await loadRuntimeVersion();
  const page = source.getPage(params.slug);
  const useOverviewConsole = key === "console";
  const useTasksConsole = key === "console/tasks";
  const useConsoleView = useOverviewConsole || useTasksConsole;
  const snapshot = useConsoleView ? await loadControlPlaneSnapshot() : null;

  if (!page) {
    notFound();
  }

  const MDX = page.data.body;
  const components = {
    ...defaultMdxComponents,
    a: createRelativeLink(source, page)
  };

  return (
    <DocsPage toc={useConsoleView ? undefined : page.data.toc} full={useConsoleView ? true : page.data.full}>
      {runtime.mode === "dev" ? <LiveRefresh initialVersion={version.updatedAt} /> : null}
      <DocsBody>
        {snapshot ? (
          useOverviewConsole ? (
            <ConsoleOverviewView snapshot={snapshot} />
          ) : (
            <ConsoleTasksView snapshot={snapshot} />
          )
        ) : (
          <MDX components={components} />
        )}
      </DocsBody>
    </DocsPage>
  );
}
