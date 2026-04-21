import { createI18nSearchAPI, type AdvancedIndex } from "fumadocs-core/search/server";
import { createTokenizer } from "@orama/tokenizers/mandarin";

import { i18n } from "../../../lib/i18n";
import { getSource } from "../../../lib/source";

const mandarinTokenizer = await createTokenizer();

const api = createI18nSearchAPI("advanced", {
  i18n,
  localeMap: {
    "zh-CN": {
      tokenizer: mandarinTokenizer,
      search: {
        threshold: 0,
        tolerance: 0
      }
    },
    en: "english"
  },
  indexes: () =>
    i18n.languages.flatMap((locale) =>
      getSource(locale).getPages().map((page) => {
        const pageData = page.data as unknown as {
          title?: string;
          description?: string;
          structuredData: AdvancedIndex["structuredData"];
        };

        return {
          id: page.url,
          locale,
          title: pageData.title ?? page.slugs.at(-1) ?? "Untitled",
          description: pageData.description,
          structuredData: pageData.structuredData,
          url: page.url
        };
      })
    )
});

export const { GET } = api;
