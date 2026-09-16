export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  sourceType?: "official" | "pricing" | "documentation" | "review" | "article";
};

export type PageContent = {
  url: string;
  title: string;
  text: string;
  fetchedAt: string;
};

export interface ResearchProvider {
  readonly name: string;
  search(query: string): Promise<SearchResult[]>;
  fetch(url: string): Promise<PageContent>;
}

/** Offline / portfolio demo provider — clearly sample data. */
export class DemoResearchProvider implements ResearchProvider {
  readonly name = "demo";

  constructor(
    private readonly catalog: Record<
      string,
      { results: SearchResult[]; pages: Record<string, PageContent> }
    >,
  ) {}

  async search(query: string): Promise<SearchResult[]> {
    const key = Object.keys(this.catalog).find((k) =>
      query.toLowerCase().includes(k.toLowerCase()),
    );
    if (!key) {
      return [
        {
          title: `[Demo] No catalog match for: ${query}`,
          url: "https://example.com/demo",
          snippet: "Demo provider — sample data only.",
          sourceType: "article",
        },
      ];
    }
    return this.catalog[key].results;
  }

  async fetch(url: string): Promise<PageContent> {
    for (const entry of Object.values(this.catalog)) {
      if (entry.pages[url]) return entry.pages[url];
    }
    return {
      url,
      title: "[Demo] Sample page",
      text: "This is demo/sample page content. Not live research.",
      fetchedAt: new Date().toISOString(),
    };
  }
}

/** Live HTTP fetch with simple text extraction. Search remains pluggable. */
export class HttpResearchProvider implements ResearchProvider {
  readonly name = "http";

  constructor(
    private readonly searchImpl?: (query: string) => Promise<SearchResult[]>,
  ) {}

  async search(query: string): Promise<SearchResult[]> {
    if (this.searchImpl) return this.searchImpl(query);

    const tavilyKey = process.env.TAVILY_API_KEY;
    if (tavilyKey) {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query,
          max_results: 5,
        }),
      });
      if (!res.ok) {
        throw new Error(`Tavily search failed: ${res.status}`);
      }
      const data = (await res.json()) as {
        results?: { title?: string; url?: string; content?: string }[];
      };
      return (data.results ?? []).map((r) => ({
        title: r.title ?? "Untitled",
        url: r.url ?? "",
        snippet: r.content ?? "",
        sourceType: "article" as const,
      }));
    }

    // Fallback: no search API — return empty so nodes can mark insufficient evidence
    return [];
  }

  async fetch(url: string): Promise<PageContent> {
    const res = await fetch(url, {
      headers: { "User-Agent": "CompetitiveIntelligenceBot/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      throw new Error(`Fetch failed ${res.status} for ${url}`);
    }
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000);

    return {
      url,
      title: titleMatch?.[1]?.trim() || url,
      text,
      fetchedAt: new Date().toISOString(),
    };
  }
}
