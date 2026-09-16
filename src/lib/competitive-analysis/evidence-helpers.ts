import type {
  CompetitiveAnalysisState,
  Evidence,
  Fact,
  Insight,
  Opportunity,
  ProductRecommendation,
} from "./types";
import { assessClaimEvidenceEntailment } from "./consistency";
import {
  INSUFFICIENT_EVIDENCE,
  QUALITY_LABEL,
  SOURCE_TYPE_ZH,
  researchModeLabel,
  sourceCoverageLabel,
} from "./zh-cn";

export type ResearchModeBadge = "demo" | "live" | "limited";

export function sourceTypeLabel(type: Evidence["sourceType"]): string {
  return SOURCE_TYPE_ZH[type] ?? type;
}

export function confidenceLabel(value: number): "高" | "中" | "低" {
  if (value >= 0.8) return "高";
  if (value >= 0.6) return "中";
  return "低";
}

export function scaleLabel(value: number): "高" | "中" | "低" {
  if (value >= 4) return "高";
  if (value >= 3) return "中";
  return "低";
}

export function evidenceConfidenceLabel(
  value: Evidence["confidence"],
): string {
  return QUALITY_LABEL[value] ?? value;
}

/** Higher = better. Official surfaces outrank third-party articles/reviews. */
export const SOURCE_QUALITY_RANK: Record<Evidence["sourceType"], number> = {
  official: 0,
  documentation: 1,
  pricing: 2,
  review: 3,
  article: 4,
  manual: 5,
};

export function isHighQualitySourceType(
  sourceType: Evidence["sourceType"],
): boolean {
  return (
    sourceType === "official" ||
    sourceType === "documentation" ||
    sourceType === "pricing"
  );
}

export function normalizeEvidenceUrl(url?: string): string | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const path = u.pathname.replace(/\/+$/, "") || "";
    return `${host}${path}${u.search}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, "");
  }
}

/**
 * Unique sources: same URL counts once.
 * Evidence without URL counts as its own source key (by id).
 */
export function countUniqueSources(evidence: Evidence[]): number {
  const keys = new Set<string>();
  for (const ev of evidence) {
    const urlKey = normalizeEvidenceUrl(ev.url);
    keys.add(urlKey ? `url:${urlKey}` : `id:${ev.id}`);
  }
  return keys.size;
}

/** e.g. "8 条证据 · 6 个独立来源" */
export function formatEvidenceItemsAndSources(evidence: Evidence[]): string {
  if (evidence.length === 0) return INSUFFICIENT_EVIDENCE;
  const unique = countUniqueSources(evidence);
  return `${evidence.length} 条证据 · ${unique} 个独立来源`;
}

/**
 * Cap insight confidence when support is only low-quality third-party sources.
 * High ( >= 0.8 ) requires at least one official / documentation / pricing source.
 */
export function calibrateConfidenceBySourceQuality(
  confidence: number,
  evidence: Evidence[],
): number {
  if (evidence.length === 0) {
    return Math.min(confidence, 0.45);
  }

  const hasHighQuality = evidence.some((e) =>
    isHighQualitySourceType(e.sourceType),
  );

  if (!hasHighQuality) {
    // Articles / reviews / manual only → never auto-High
    return Math.min(confidence, 0.65);
  }

  return confidence;
}

export function sortEvidenceBySourceQuality(
  evidence: Evidence[],
): Evidence[] {
  return [...evidence].sort(
    (a, b) =>
      SOURCE_QUALITY_RANK[a.sourceType] - SOURCE_QUALITY_RANK[b.sourceType],
  );
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function resolveEvidence(
  ids: string[],
  evidence: Evidence[],
): Evidence[] {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  return uniqueIds(ids)
    .map((id) => byId.get(id))
    .filter((e): e is Evidence => Boolean(e));
}

export function getFactsForInsight(
  insight: Insight,
  facts: Fact[],
): Fact[] {
  const idSet = new Set(insight.supportingFactIds);
  return facts.filter((f) => idSet.has(f.id));
}

export function getEvidenceForInsight(
  insight: Insight,
  facts: Fact[],
  evidence: Evidence[],
): Evidence[] {
  const supportingFacts = getFactsForInsight(insight, facts);
  const evidenceIds = supportingFacts.flatMap((f) => f.evidenceIds);
  const resolved = resolveEvidence(evidenceIds, evidence);
  const claim = `${insight.title}. ${insight.description}`;
  return resolved.filter(
    (ev) => assessClaimEvidenceEntailment(claim, ev) !== "unsupported",
  );
}

export function getEvidenceForRecommendation(
  recommendation: ProductRecommendation,
  insights: Insight[],
  facts: Fact[],
  evidence: Evidence[],
): Evidence[] {
  const direct = resolveEvidence(recommendation.evidenceIds, evidence);

  const linkedInsights = insights.filter((i) =>
    recommendation.insightIds.includes(i.id),
  );
  const viaInsights = linkedInsights.flatMap((insight) =>
    getEvidenceForInsight(insight, facts, evidence),
  );

  const byId = new Map<string, Evidence>();
  for (const ev of [...direct, ...viaInsights]) {
    byId.set(ev.id, ev);
  }
  return [...byId.values()];
}

export function getEvidenceForOpportunity(
  opportunity: Opportunity,
  evidence: Evidence[],
): Evidence[] {
  return resolveEvidence(opportunity.evidence, evidence);
}

/**
 * Deterministic top insight:
 * score = confidence × supportingFactCount
 */
export function selectTopInsight(insights: Insight[]): Insight | null {
  if (insights.length === 0) return null;

  let best = insights[0];
  let bestScore =
    best.confidence * Math.max(best.supportingFactIds.length, 1);

  for (let i = 1; i < insights.length; i += 1) {
    const insight = insights[i];
    const score =
      insight.confidence * Math.max(insight.supportingFactIds.length, 1);
    if (
      score > bestScore ||
      (score === bestScore && insight.confidence > best.confidence)
    ) {
      best = insight;
      bestScore = score;
    }
  }

  return best;
}

/**
 * Prefer recommendation that matches executive next-move text;
 * otherwise highest impact × confidence / effort.
 */
export function selectPrimaryRecommendation(
  recommendations: ProductRecommendation[],
  recommendedNextMove?: string,
): ProductRecommendation | null {
  if (recommendations.length === 0) return null;

  if (recommendedNextMove) {
    const needle = recommendedNextMove.toLowerCase();
    const matched = recommendations.find(
      (r) =>
        needle.includes(r.title.toLowerCase()) ||
        r.title.toLowerCase().includes(needle.slice(0, 40)) ||
        needle.includes(r.description.toLowerCase().slice(0, 40)),
    );
    if (matched) return matched;
  }

  return [...recommendations].sort((a, b) => {
    const scoreA = (a.impact * a.confidence) / Math.max(a.effort, 1);
    const scoreB = (b.impact * b.confidence) / Math.max(b.effort, 1);
    return scoreB - scoreA;
  })[0];
}

export function selectPrimaryOpportunity(
  opportunities: Opportunity[],
  biggestOpportunityText?: string,
): Opportunity | null {
  if (opportunities.length === 0) return null;

  if (biggestOpportunityText) {
    const needle = biggestOpportunityText.toLowerCase();
    const matched = opportunities.find(
      (o) =>
        needle.includes(o.title.toLowerCase()) ||
        o.title.toLowerCase().includes(needle.slice(0, 32)) ||
        needle.includes(o.problem.toLowerCase().slice(0, 32)),
    );
    if (matched) return matched;
  }

  return [...opportunities].sort(
    (a, b) => (b.impact ?? b.confidence * 5) - (a.impact ?? a.confidence * 5),
  )[0];
}

/**
 * Threat text is often free-form in executive summary.
 * Prefer insight overlap; fall back to top insight.
 */
export function selectThreatInsight(
  insights: Insight[],
  biggestThreatText?: string,
): Insight | null {
  if (insights.length === 0) return null;

  if (biggestThreatText) {
    const tokens = biggestThreatText
      .toLowerCase()
      .split(/[^a-z0-9\u4e00-\u9fff]+/)
      .filter((t) => t.length > 3);
    let best: Insight | null = null;
    let bestHits = 0;
    for (const insight of insights) {
      const hay = `${insight.title} ${insight.description}`.toLowerCase();
      const hits = tokens.filter((t) => hay.includes(t)).length;
      if (hits > bestHits) {
        bestHits = hits;
        best = insight;
      }
    }
    if (best && bestHits > 0) return best;
  }

  return selectTopInsight(insights);
}

export function parseWhyChain(reasoning: string): {
  because: string;
  infer: string;
  therefore: string;
} {
  const cleaned = reasoning
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      "",
    )
    .replace(/\bevidence\s*ids?\s*[:=]?\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const becauseMatch = cleaned.match(
    /(?:because|依据)[:\s：]+(.+?)(?=(?:→|we infer|infer[:\s]|我们推断|therefore|因此建议|因此|$))/i,
  );
  const inferMatch = cleaned.match(
    /(?:→\s*)?(?:we\s+)?(?:infer|我们推断)[:\s：]+(.+?)(?=(?:→|therefore|因此建议|因此|$))/i,
  );
  const thereforeMatch = cleaned.match(
    /(?:→\s*)?(?:therefore|因此建议|因此)[:\s：]+(.+)$/i,
  );

  return {
    because: (becauseMatch?.[1]?.trim() || cleaned).replace(/\s+,/g, ",").trim(),
    infer: (inferMatch?.[1]?.trim() || "").replace(/\s+,/g, ",").trim(),
    therefore: (thereforeMatch?.[1]?.trim() || "").replace(/\s+,/g, ",").trim(),
  };
}

/**
 * Prefer server-resolved `state.researchMode`.
 * Fallback: never claim LIVE RESEARCH just because mode is live.
 */
export function getResearchModeBadge(
  state: CompetitiveAnalysisState,
): ResearchModeBadge {
  if (state.researchMode) return state.researchMode;
  if (state.isDemo || state.input.mode === "demo") return "demo";
  if (state.input.mode === "live") return "limited";
  return "demo";
}

export function researchModeBadgeLabel(mode: ResearchModeBadge): string {
  return researchModeLabel(mode);
}

/** Report-level research depth — not per-insight confidence. */
export function sourceCoverageBadgeLabel(
  quality: "high" | "medium" | "low",
): string {
  return sourceCoverageLabel(quality);
}

/** Count supporting facts that loosely relate to a finding string. */
export {
  countSupportingFactsForFinding,
} from "./consistency";

export function truncateToSentences(text: string, maxSentences = 4): string {
  const parts = text
    .split(/(?<=[。.!？?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= maxSentences) return text.trim();
  return parts.slice(0, maxSentences).join(" ");
}
