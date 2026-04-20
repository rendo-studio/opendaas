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

function findPage(slug: string[] | undefined) {
  const normalized = slug ?? [];
  const direct = source.getPage(normalized);

  if (direct) {
    return direct;
  }

  const joined = normalized.join("/");

  return source.getPages().find((candidate) => {
    if (candidate.slugs.join("/") === joined) {
      return true;
    }

    const candidatePath = candidate.url.replace(/^\/docs\/?/, "");
    return candidatePath === joined;
  });
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const key = (params.slug ?? []).join("/");
  const resolvedSlug = params.slug ?? [];

  const runtime = await loadRuntimeMetadata();
  const version = await loadRuntimeVersion();
  const useOverviewConsole = key === "console";
  const useTasksConsole = key === "console/tasks";
  const useConsoleView = useOverviewConsole || useTasksConsole;
  const snapshot = useConsoleView ? await loadControlPlaneSnapshot() : null;
  const page = findPage(resolvedSlug);

  if (key === "console/overview") {
    redirect("/docs/console");
  }

  if (!useConsoleView && !page) {
    notFound();
  }

  const MDX = page?.data.body ?? null;
  const components =
    page === null
      ? defaultMdxComponents
      : {
          ...defaultMdxComponents,
          a: createRelativeLink(source, page)
        };

  return (
    <DocsPage toc={useConsoleView ? undefined : page?.data.toc} full={useConsoleView ? true : page?.data.full ?? false}>
      {runtime.mode === "dev" ? <LiveRefresh initialVersion={version.updatedAt} /> : null}
      <DocsBody>
        {snapshot ? (
          useOverviewConsole ? (
            <ConsoleOverviewView snapshot={snapshot} />
          ) : (
            <ConsoleTasksView snapshot={snapshot} />
          )
        ) : (
          MDX ? <MDX components={components} /> : null
        )}
      </DocsBody>
    </DocsPage>
  );
}
