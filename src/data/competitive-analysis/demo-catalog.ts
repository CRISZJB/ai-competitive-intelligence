import type { PageContent, SearchResult } from "../../lib/competitive-analysis/providers/research-provider";

const now = "2026-03-01T00:00:00.000Z";

export const DEMO_RESEARCH_CATALOG: Record<
  string,
  { results: SearchResult[]; pages: Record<string, PageContent> }
> = {
  Coda: {
    results: [
      {
        title: "[Demo] Coda — docs that work like apps",
        url: "https://coda.io",
        snippet: "Docs, spreadsheets, and apps in one collaborative surface.",
        sourceType: "official",
      },
      {
        title: "[Demo] Coda AI",
        url: "https://coda.io/product/ai",
        snippet: "Draft, analyze tables, trigger Packs actions.",
        sourceType: "documentation",
      },
      {
        title: "[Demo] Coda Pricing",
        url: "https://coda.io/pricing",
        snippet: "Doc Maker based Free / Pro / Team / Enterprise.",
        sourceType: "pricing",
      },
    ],
    pages: {
      "https://coda.io": {
        url: "https://coda.io",
        title: "Coda",
        text: "Coda brings docs, spreadsheets, and apps together so teams can build tools that run their work. DEMO / SAMPLE DATA.",
        fetchedAt: now,
      },
      "https://coda.io/product/ai": {
        url: "https://coda.io/product/ai",
        title: "Coda AI",
        text: "Coda AI can draft, analyze tables, and trigger actions with Packs. DEMO / SAMPLE DATA.",
        fetchedAt: now,
      },
      "https://coda.io/pricing": {
        url: "https://coda.io/pricing",
        title: "Coda Pricing",
        text: "Free, Pro, Team, and Enterprise tiers with Doc Maker based billing. DEMO / SAMPLE DATA.",
        fetchedAt: now,
      },
    },
  },
  ClickUp: {
    results: [
      {
        title: "[Demo] ClickUp Work OS",
        url: "https://clickup.com",
        snippet: "One app for tasks, docs, goals, chat.",
        sourceType: "official",
      },
      {
        title: "[Demo] ClickUp Brain",
        url: "https://clickup.com/ai",
        snippet: "AI across tasks, docs, and people context.",
        sourceType: "documentation",
      },
      {
        title: "[Demo] ClickUp Pricing",
        url: "https://clickup.com/pricing",
        snippet: "Free Forever, Unlimited, Business, Enterprise.",
        sourceType: "pricing",
      },
    ],
    pages: {
      "https://clickup.com": {
        url: "https://clickup.com",
        title: "ClickUp",
        text: "One app to replace them all — tasks, docs, goals, chat, and more. DEMO / SAMPLE DATA.",
        fetchedAt: now,
      },
      "https://clickup.com/ai": {
        url: "https://clickup.com/ai",
        title: "ClickUp Brain",
        text: "ClickUp Brain connects tasks, docs, and people to answer questions with company context. DEMO / SAMPLE DATA.",
        fetchedAt: now,
      },
      "https://clickup.com/pricing": {
        url: "https://clickup.com/pricing",
        title: "ClickUp Pricing",
        text: "Free Forever, Unlimited, Business, and Enterprise plans. DEMO / SAMPLE DATA.",
        fetchedAt: now,
      },
    },
  },
  Confluence: {
    results: [
      {
        title: "[Demo] Confluence",
        url: "https://www.atlassian.com/software/confluence",
        snippet: "Enterprise knowledge collaboration.",
        sourceType: "official",
      },
      {
        title: "[Demo] Atlassian Intelligence",
        url: "https://www.atlassian.com/software/artificial-intelligence",
        snippet: "Summarize, draft, find answers across Atlassian.",
        sourceType: "documentation",
      },
      {
        title: "[Demo] Confluence + Jira",
        url: "https://www.atlassian.com/software/confluence/jira-integration",
        snippet: "Connect project work with knowledge.",
        sourceType: "official",
      },
    ],
    pages: {
      "https://www.atlassian.com/software/confluence": {
        url: "https://www.atlassian.com/software/confluence",
        title: "Confluence",
        text: "Create, collaborate, and organize all your work in one place. DEMO / SAMPLE DATA.",
        fetchedAt: now,
      },
      "https://www.atlassian.com/software/artificial-intelligence": {
        url: "https://www.atlassian.com/software/artificial-intelligence",
        title: "Atlassian Intelligence",
        text: "Atlassian Intelligence helps summarize pages, draft content, and find answers across Atlassian products. DEMO / SAMPLE DATA.",
        fetchedAt: now,
      },
      "https://www.atlassian.com/software/confluence/jira-integration": {
        url: "https://www.atlassian.com/software/confluence/jira-integration",
        title: "Confluence + Jira",
        text: "Connect project work in Jira with knowledge in Confluence. DEMO / SAMPLE DATA.",
        fetchedAt: now,
      },
    },
  },
};
