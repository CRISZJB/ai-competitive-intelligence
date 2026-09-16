import { v4 as uuid } from "uuid";
import type { LLMProvider } from "../providers/llm-provider";
import type { ResearchProvider } from "../providers/research-provider";
import type {
  AnalysisInput,
  CompetitorProfile,
  Evidence,
} from "../types";
import { CompetitorResearchOutputSchema } from "../schemas";
import {
  competitorResearchPrompt,
  competitorResearchSystem,
} from "../prompts";
import {
  DEMO_COMPETITORS,
  DEMO_EVIDENCE,
  slugifyCompetitor,
} from "../../../data/competitive-analysis/demo";
import {
  assessOverallEvidenceQuality,
  pickCanonicalProductUrl,
} from "../consistency";

export type CompetitorResearchResult = {
  profile: CompetitorProfile;
  evidence: Evidence[];
};

function demoResult(
  competitorName: string,
  role: "product" | "competitor",
): CompetitorResearchResult | null {
  const profile = DEMO_COMPETITORS.find(
    (c) => c.name.toLowerCase() === competitorName.toLowerCase(),
  );

  // Target product "Notion" in demo: synthesize from notion-tagged evidence
  if (!profile && role === "product") {
    const id = slugifyCompetitor(competitorName);
    const evidence = DEMO_EVIDENCE.filter(
      (e) =>
        e.competitorId === id ||
        e.competitorId === competitorName.toLowerCase(),
    );
    if (evidence.length === 0 && competitorName.toLowerCase() === "notion") {
      const notionEv = DEMO_EVIDENCE.filter((e) => e.competitorId === "notion");
      return {
        profile: {
          id: "notion",
          name: "Notion",
          url: "https://www.notion.so",
          role: "product",
          status: notionEv.length ? "complete" : "partial",
          positioning:
            "Flexible all-in-one workspace combining docs, databases, and AI-assisted knowledge work.",
          targetUsers: ["Knowledge workers", "Product and ops teams"],
          coreFeatures: [
            {
              name: "Docs & databases",
              description: "Connected pages and databases in one workspace.",
              evidenceIds: notionEv.slice(0, 1).map((e) => e.id),
            },
          ],
          aiCapabilities: [
            {
              name: "Notion AI",
              description:
                "Writing, summarize, Q&A and partial automation inside Notion.",
              maturity: "medium",
              evidenceIds: notionEv.slice(0, 1).map((e) => e.id),
            },
          ],
          integrations: [],
          strengths: [],
          weaknesses: [],
          userFeedback: [],
          evidenceIds: notionEv.map((e) => e.id),
          evidenceQuality: assessOverallEvidenceQuality(notionEv),
        },
        evidence: notionEv,
      };
    }
    if (evidence.length > 0) {
      return {
        profile: {
          id,
          name: competitorName,
          url: pickCanonicalProductUrl({
            name: competitorName,
            evidence,
          }),
          role: "product",
          status: "complete",
          positioning: `${competitorName} (demo sample profile)`,
          targetUsers: [],
          coreFeatures: [],
          aiCapabilities: [],
          integrations: [],
          strengths: [],
          weaknesses: [],
          userFeedback: [],
          evidenceIds: evidence.map((e) => e.id),
          evidenceQuality: assessOverallEvidenceQuality(evidence),
        },
        evidence,
      };
    }
  }

  if (!profile) return null;
  const evidence = DEMO_EVIDENCE.filter((e) => e.competitorId === profile.id);
  return {
    profile: {
      ...profile,
      role,
      evidenceQuality: assessOverallEvidenceQuality(evidence),
    },
    evidence,
  };
}

export async function researchCompetitor(
  competitorName: string,
  input: AnalysisInput,
  research: ResearchProvider,
  llm: LLMProvider | null,
  options?: {
    role?: "product" | "competitor";
    preferredUrl?: string;
  },
): Promise<CompetitorResearchResult> {
  const id = slugifyCompetitor(competitorName);
  const role = options?.role ?? "competitor";

  if (input.mode === "demo") {
    const demo = demoResult(competitorName, role);
    if (demo) return demo;

    return {
      profile: {
        id,
        name: competitorName,
        role,
        status: "partial",
        positioning: "insufficient evidence (not in demo dataset)",
        targetUsers: [],
        coreFeatures: [],
        aiCapabilities: [],
        integrations: [],
        strengths: [],
        weaknesses: [],
        userFeedback: ["insufficient evidence"],
        evidenceIds: [],
        evidenceQuality: "low",
        errorMessage: "Entity not covered by Demo / Sample Data catalog",
      },
      evidence: [],
    };
  }

  try {
    const queryFocus =
      role === "product"
        ? `${competitorName} official product AI features pricing documentation`
        : `${competitorName} product AI features pricing`;
    const results = await research.search(queryFocus);
    const pages = [];
    for (const r of results.slice(0, 3)) {
      try {
        pages.push(await research.fetch(r.url));
      } catch {
        // continue — partial evidence ok
      }
    }

    const evidenceBundle = [
      ...results.map(
        (r) => `[search] ${r.title}\nURL: ${r.url}\n${r.snippet}`,
      ),
      ...pages.map(
        (p) => `[page] ${p.title}\nURL: ${p.url}\n${p.text.slice(0, 3000)}`,
      ),
    ].join("\n\n---\n\n");

    if (!llm) {
      return {
        profile: {
          id,
          name: competitorName,
          role,
          url: options?.preferredUrl,
          status: "partial",
          positioning: "insufficient evidence (no LLM configured for live mode)",
          targetUsers: [],
          coreFeatures: [],
          aiCapabilities: [],
          integrations: [],
          strengths: [],
          weaknesses: [],
          userFeedback: [],
          evidenceIds: [],
          evidenceQuality: "low",
          errorMessage: "Live mode requires OPENAI_API_KEY or DEEPSEEK_API_KEY",
        },
        evidence: [],
      };
    }

    const raw = await llm.generate({
      system: competitorResearchSystem,
      prompt: competitorResearchPrompt({
        competitor: competitorName,
        product: input.product,
        goal: input.goal,
        evidenceBundle: evidenceBundle || "insufficient evidence",
        entityRole: role,
      }),
      schema: CompetitorResearchOutputSchema,
    });

    const calibrateNoteConfidence = (
      sourceType: Evidence["sourceType"],
      confidence: Evidence["confidence"],
    ): Evidence["confidence"] => {
      const lowQuality =
        sourceType === "article" ||
        sourceType === "review" ||
        sourceType === "manual";
      if (lowQuality && confidence === "high") return "medium";
      return confidence;
    };

    const evidence: Evidence[] = raw.evidenceNotes.map((note) => ({
      id: uuid(),
      competitorId: id,
      title: note.title,
      url: note.url,
      sourceType: note.sourceType,
      quote: note.quote,
      summary: note.summary,
      retrievedAt: new Date().toISOString(),
      confidence: calibrateNoteConfidence(note.sourceType, note.confidence),
    }));

    const preferred = [...evidence].sort((a, b) => {
      const rank: Record<string, number> = {
        official: 0,
        documentation: 1,
        pricing: 2,
        review: 3,
        article: 4,
        manual: 5,
      };
      return (rank[a.sourceType] ?? 9) - (rank[b.sourceType] ?? 9);
    });

    const preferredUrl =
      options?.preferredUrl ??
      (role === "competitor"
        ? input.competitorUrls?.[competitorName]
        : input.productUrl);

    const canonicalUrl = pickCanonicalProductUrl({
      name: competitorName,
      preferredUrl,
      evidence,
      searchUrls: results.map((r) => r.url),
    });

    const evidenceQuality = assessOverallEvidenceQuality(evidence);

    const profile: CompetitorProfile = {
      id,
      name: raw.company || competitorName,
      url: canonicalUrl,
      role,
      status: evidence.length === 0 ? "partial" : "complete",
      positioning: raw.positioning,
      targetUsers: raw.targetUsers,
      coreFeatures: raw.features.map((f) => ({
        name: f.name,
        description: f.description,
        evidenceIds: preferred.slice(0, 2).map((e) => e.id),
      })),
      aiCapabilities: raw.aiCapabilities.map((c) => ({
        name: c.name,
        description: c.description,
        maturity: c.maturity,
        evidenceIds: preferred.slice(0, 2).map((e) => e.id),
      })),
      pricing: raw.pricing.map((p) => ({
        ...p,
        evidenceIds: preferred
          .filter((e) => e.sourceType === "pricing")
          .map((e) => e.id),
      })),
      integrations: raw.integrations,
      strengths: raw.strengths.map((s) => ({
        id: uuid(),
        title: s,
        description: s,
        evidenceIds: preferred.slice(0, 1).map((e) => e.id),
      })),
      weaknesses: raw.weaknesses.map((w) => ({
        id: uuid(),
        title: w,
        description: w,
        evidenceIds: preferred.slice(0, 1).map((e) => e.id),
      })),
      userFeedback: raw.userFeedback,
      evidenceIds: evidence.map((e) => e.id),
      evidenceQuality,
    };

    return { profile, evidence };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown research error";
    return {
      profile: {
        id,
        name: competitorName,
        role,
        status: "error",
        positioning: "insufficient evidence",
        targetUsers: [],
        coreFeatures: [],
        aiCapabilities: [],
        integrations: [],
        strengths: [],
        weaknesses: [],
        userFeedback: [],
        evidenceIds: [],
        evidenceQuality: "low",
        errorMessage: message,
      },
      evidence: [],
    };
  }
}
