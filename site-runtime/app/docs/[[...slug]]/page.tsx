import { redirect } from "next/navigation";

import { i18n } from "../../../lib/i18n";

export default async function DocsLocaleRedirectPage({
  params
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const suffix = slug && slug.length > 0 ? `/${slug.join("/")}` : "";

  redirect(`/${i18n.defaultLanguage}/docs${suffix}`);
}
