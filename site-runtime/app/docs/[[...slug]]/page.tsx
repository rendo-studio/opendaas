import { notFound } from "next/navigation";
import defaultMdxComponents, { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsPage } from "fumadocs-ui/layouts/docs/page";

import { Dashboard } from "@/components/site/dashboard";
import { LiveRefresh } from "@/components/site/live-refresh";
import { PageBoundaryBar } from "@/components/site/page-boundary-bar";
import { TaskClosurePage } from "@/components/site/task-closure-page";
import {
  findPageBoundary,
  loadControlPlaneSnapshot,
  loadRuntimeMetadata,
  loadRuntimeVersion,
  loadSourcePage
} from "@/lib/runtime-data";
import { source } from "@/lib/source";

export function generateStaticParams() {
  return source.generateParams();
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const snapshot = await loadControlPlaneSnapshot();
  const runtime = await loadRuntimeMetadata();
  const version = await loadRuntimeVersion();
  const page = source.getPage(params.slug);
  const boundary = findPageBoundary(snapshot, params.slug);
  const editableSource =
    boundary?.mode === "editable" && runtime.mode === "dev"
      ? await loadSourcePage(boundary.path)
      : null;

  const isDashboard = (params.slug?.length ?? 0) === 0;
  const isTaskClosure = (params.slug ?? []).join("/") === "project/tasks";

  if (!page && !isDashboard && !isTaskClosure) {
    notFound();
  }

  if (isDashboard) {
    const MDX = page?.data.body ?? null;
    const components = page
      ? {
          ...defaultMdxComponents,
          a: createRelativeLink(source, page)
        }
      : defaultMdxComponents;

    return (
      <DocsPage full>
        <LiveRefresh initialVersion={version.updatedAt} />
        <DocsBody>
          <div className="not-prose">
            <Dashboard snapshot={snapshot} />
          </div>
          {page && boundary ? (
            <>
              <PageBoundaryBar boundary={boundary} editableContent={editableSource?.content ?? null} />
              {MDX ? <MDX components={components} /> : null}
            </>
          ) : null}
        </DocsBody>
      </DocsPage>
    );
  }

  if (isTaskClosure) {
    const MDX = page?.data.body ?? null;
    const components = page
      ? {
          ...defaultMdxComponents,
          a: createRelativeLink(source, page)
        }
      : defaultMdxComponents;

    return (
      <DocsPage full>
        <LiveRefresh initialVersion={version.updatedAt} />
        <DocsBody>
          <div className="not-prose">
            <TaskClosurePage snapshot={snapshot} />
          </div>
          {boundary ? <PageBoundaryBar boundary={boundary} editableContent={editableSource?.content ?? null} /> : null}
          {MDX ? <MDX components={components} /> : null}
        </DocsBody>
      </DocsPage>
    );
  }

  if (!page) {
    notFound();
  }

  const MDX = page.data.body;
  const components = {
    ...defaultMdxComponents,
    a: createRelativeLink(source, page)
  };

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <LiveRefresh initialVersion={version.updatedAt} />
      <DocsBody>
        {boundary ? <PageBoundaryBar boundary={boundary} editableContent={editableSource?.content ?? null} /> : null}
        <MDX components={components} />
      </DocsBody>
    </DocsPage>
  );
}
