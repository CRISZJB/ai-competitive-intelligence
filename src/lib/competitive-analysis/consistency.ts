import type {
  ComparisonDimension,
  CompetitorProfile,
  Evidence,
  ExecutiveSummary,
  Fact,
  FeatureMatrixRow,
  Insight,
  Opportunity,
  ProductRecommendation,
} from "./types";
import {
  calibrateConfidenceBySourceQuality,
  isHighQualitySourceType,
  sortEvidenceBySourceQuality,
} from "./evidence-helpers";
import { INSUFFICIENT_EVIDENCE, NEEDS_VALIDATION } from "./zh-cn";

export type EntailmentLevel = "supported" | "partially_supported" | "unsupported";

export const SCORE_EVIDENCE_THRESHOLD = 1;

const INSUFFICIENT_RE = /insufficient evidence/i;
const HYPOTHESIS_RE = /needs validation|hypothesis/i;

function isInsufficientText(text: string): boolean {
  return (
    INSUFFICIENT_RE.test(text) || text.includes(INSUFFICIENT_EVIDENCE)
  );
}

function isHypothesisText(text: string): boolean {
  return (
    HYPOTHESIS_RE.test(text) ||
    text.includes(NEEDS_VALIDATION) ||
    text.includes("待验证") ||
    text.includes("假设")
  );
}

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

/** Internal id tokens that must never appear in user-visible narrative. */
const INTERNAL_ID_RE =
  /\b(?:evidence|fact|insight|opportunity|recommendation|competitor)[_-]?ids?\b\s*[:=]?\s*\[?[^\]]*\]?/gi;

const SHORT_INTERNAL_ID_RE =
  /\b(?:ev|fact|ins|opp|rec|cmp)-[a-z0-9_-]{4,}\b/gi;

const ABSENCE_RE =
  /\b(neither|none of|no (one|competitor)|does not offer|doesn't offer|do not offer|don't offer|does not (have|include|provide|support)|doesn't (have|include|provide|support)|has no|have no|lacks?|missing|absent|without any)\b/i;

const OVERBROAD_EVIDENCE_ABSENCE_RE =
  /\b(lacks?|without|no|missing)\b[\s\S]{0,60}\b(official\s+)?evidence\b|\b(the\s+)?(entire|whole|all|overall)\b[\s\S]{0,40}\b(lacks?|missing|no)\b[\s\S]{0,40}\b(official\s+)?evidence\b/i;

/** Internal chain-of-thought / structure labels — never show in user prose. */
const STRUCTURE_LABEL_RE =
  /\b(Fact|Inference|Recommendation|Insight|Opportunity|Hypothesis)\s*:\s*/gi;

const OVERBROAD_MARKET_RE =
  /\b((becoming\s+)?the\s+default(\s+competitive)?\s+norm|industry\s+standard|market\s+(default|norm|standard)|competitive\s+norm|everyone|all\s+competitors|the\s+entire\s+market)\b|成为默认竞争常态|默认竞争常态|行业标准|整个市场|所有竞品/i;

const AI_PACKAGING_CLAIM_RE =
  /\b(ai|artificial\s+intelligence)\b[\s\S]{0,80}\b(pric|tier|plan|bundle|bundl|subscription|credit|paid|packag|inclusion)\b|\b(pric|tier|plan|bundle|bundl|subscription|credit|paid|packag)\b[\s\S]{0,80}\b(ai|artificial\s+intelligence)\b/i;

const AI_SIGNAL_RE =
  /\b(ai|artificial\s+intelligence|machine\s+learning|copilot|magic\s+studio)\b/i;

const PRICING_PACKAGING_SIGNAL_RE =
  /\b(pric(e|ing)?|tier|plan|bundle|bundl|subscription|credit|paid|pro\b|enterprise|inclusion|packag)\b/i;

function tokenize(text: string): string[] {
  const keepShort = new Set(["ai", "ux", "api", "ml", "db"]);
  return text
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((t) => t.length > 2 || keepShort.has(t))
    .filter(
      (t) =>
        ![
          "the",
          "and",
          "for",
          "with",
          "that",
          "this",
          "from",
          "into",
          "your",
          "their",
          "have",
          "has",
          "are",
          "was",
          "were",
          "can",
          "product",
          "feature",
          "features",
        ].includes(t),
    );
}

function overlapRatio(a: string[], b: Set<string>): number {
  if (a.length === 0) return 0;
  const hits = a.filter((t) => b.has(t)).length;
  return hits / a.length;
}

/**
 * Lightweight claim↔evidence entailment (deterministic, no LLM).
 * Does NOT treat same-entity membership as relevance.
 */
export function assessClaimEvidenceEntailment(
  claim: string,
  evidence: Evidence,
): EntailmentLevel {
  const claimTokens = tokenize(claim);
  const evText = `${evidence.title} ${evidence.summary} ${evidence.quote ?? ""}`;
  const evTokens = new Set(tokenize(evText));

  // Drop ultra-generic brand-only overlap: require topical tokens beyond the entity name
  const brandish = new Set(
    [evidence.competitorId, ...evidence.competitorId.split("-")]
      .map((s) => s.toLowerCase())
      .filter(Boolean),
  );
  const topicalClaim = claimTokens.filter((t) => !brandish.has(t));
  const topicalEv = new Set([...evTokens].filter((t) => !brandish.has(t)));

  const ratio = overlapRatio(
    topicalClaim.length ? topicalClaim : claimTokens,
    topicalEv.size ? topicalEv : evTokens,
  );
  const claimCore = (topicalClaim.length ? topicalClaim : claimTokens).slice(0, 8);
  const coreHits = claimCore.filter((t) =>
    (topicalEv.size ? topicalEv : evTokens).has(t),
  ).length;

  const claimIsAiPackaging = AI_PACKAGING_CLAIM_RE.test(claim);
  const evHasAi = AI_SIGNAL_RE.test(evText);
  const evHasPricingPackaging = PRICING_PACKAGING_SIGNAL_RE.test(evText);

  // AI pricing / bundling claims need topical AI or packaging signals —
  // generic product / integration blurbs for the same brand are unsupported.
  if (claimIsAiPackaging && !evHasAi && !evHasPricingPackaging) {
    return "unsupported";
  }

  if (ratio >= 0.35 && coreHits >= 2) {
    if (claimIsAiPackaging && !(evHasAi && evHasPricingPackaging)) {
      return "partially_supported";
    }
    return "supported";
  }
  if (ratio >= 0.22 && coreHits >= 2) return "partially_supported";
  if (ratio >= 0.28 && coreHits >= 1) return "partially_supported";

  const distinctive = [
    "ai",
    "pricing",
    "subscription",
    "automation",
    "workflow",
    "collaboration",
    "privacy",
    "security",
    "shield",
    "bundle",
    "tier",
    "credit",
  ];
  const claimDistinct = distinctive.filter((d) =>
    claim.toLowerCase().includes(d),
  );
  const evDistinct = distinctive.filter((d) => evText.toLowerCase().includes(d));
  const sharedDistinct = claimDistinct.filter((d) => evDistinct.includes(d));

  // Conflicting topical families: AI/pricing vs security/privacy alone is not support
  const claimIsPricingAi =
    claimDistinct.includes("ai") ||
    claimDistinct.includes("subscription") ||
    claimDistinct.includes("pricing") ||
    claimDistinct.includes("bundle") ||
    claimDistinct.includes("tier");
  const evIsSecurityOnly =
    (evDistinct.includes("privacy") ||
      evDistinct.includes("security") ||
      evDistinct.includes("shield")) &&
    !evDistinct.includes("ai") &&
    !evDistinct.includes("pricing") &&
    !evDistinct.includes("subscription") &&
    !evDistinct.includes("bundle");
  if (claimIsPricingAi && evIsSecurityOnly) return "unsupported";

  if (claimIsAiPackaging && sharedDistinct.includes("ai") && evHasPricingPackaging) {
    return "partially_supported";
  }

  if (sharedDistinct.length >= 2 && coreHits >= 1) return "partially_supported";

  return "unsupported";
}

export function filterEvidenceByEntailment(
  claim: string,
  evidenceIds: string[],
  evidence: Evidence[],
): { supportedIds: string[]; levels: Record<string, EntailmentLevel> } {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const levels: Record<string, EntailmentLevel> = {};
  const supportedIds: string[] = [];

  for (const id of evidenceIds) {
    const ev = byId.get(id);
    if (!ev) continue;
    const level = assessClaimEvidenceEntailment(claim, ev);
    levels[id] = level;
    if (level !== "unsupported") {
      supportedIds.push(id);
    }
  }

  return { supportedIds, levels };
}

/** Only fully/partially supporting evidence may remain on a fact. */
export function bindFactsWithEntailment(
  facts: Fact[],
  evidence: Evidence[],
): Fact[] {
  return facts.map((fact) => {
    const { supportedIds, levels } = filterEvidenceByEntailment(
      fact.claim,
      fact.evidenceIds,
      evidence,
    );
    const linked = evidence.filter((e) => supportedIds.includes(e.id));
    const onlyPartial =
      supportedIds.length > 0 &&
      supportedIds.every((id) => levels[id] === "partially_supported");

    let confidence = calibrateConfidenceBySourceQuality(
      fact.confidence,
      linked,
    );
    if (supportedIds.length === 0) {
      confidence = Math.min(confidence, 0.4);
    } else if (onlyPartial) {
      confidence = Math.min(confidence, 0.65);
    }

    return {
      ...fact,
      evidenceIds: supportedIds,
      confidence,
    };
  });
}

/** Resolve evidence ids to objects that actually exist. */
export function resolveEvidenceByIds(
  evidenceIds: string[],
  evidence: Evidence[],
): Evidence[] {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const seen = new Set<string>();
  const resolved: Evidence[] = [];
  for (const id of evidenceIds) {
    if (!id || seen.has(id)) continue;
    const ev = byId.get(id);
    if (!ev) continue;
    seen.add(id);
    resolved.push(ev);
  }
  return resolved;
}

export function hasScoreableEvidence(
  evidenceIds: string[],
  evidenceCatalog?: Evidence[],
): boolean {
  if (evidenceCatalog) {
    return (
      resolveEvidenceByIds(evidenceIds, evidenceCatalog).length >=
      SCORE_EVIDENCE_THRESHOLD
    );
  }
  return evidenceIds.filter(Boolean).length >= SCORE_EVIDENCE_THRESHOLD;
}

/**
 * If evidence is insufficient, score must be unavailable (null).
 * Never show Score N/5 alongside "Insufficient evidence".
 */
export function resolveComparisonScore(
  score: number | null | undefined,
  evidenceIds: string[],
  summary: string,
  evidenceCatalog?: Evidence[],
): number | null {
  const insufficient =
    !hasScoreableEvidence(evidenceIds, evidenceCatalog) ||
    isInsufficientText(summary);
  if (insufficient) return null;
  if (score === undefined || score === null || Number.isNaN(score)) return null;
  return score;
}

function profileEvidenceForDimension(
  profile: CompetitorProfile | undefined,
  dimension: string,
): string[] {
  if (!profile) return [];
  const dim = dimension.toLowerCase();
  if (dim.includes("ai")) {
    const fromCaps = profile.aiCapabilities.flatMap((c) => c.evidenceIds);
    if (fromCaps.length > 0) return fromCaps;
  }
  if (dim.includes("pricing")) {
    const fromPricing = (profile.pricing ?? []).flatMap((p) => p.evidenceIds);
    if (fromPricing.length > 0) return fromPricing;
  }
  if (dim.includes("feature") || dim.includes("core")) {
    const fromFeatures = profile.coreFeatures.flatMap((f) => f.evidenceIds);
    if (fromFeatures.length > 0) return fromFeatures;
  }
  return profile.evidenceIds;
}

/**
 * Bind comparison rows to resolved evidence; for AI/pricing/feature dims,
 * inherit profile evidence when the claim is about that entity but ids are empty/stale.
 */
export function bindComparisonEvidence(
  comparisons: ComparisonDimension[],
  profiles: CompetitorProfile[],
  evidence: Evidence[],
): ComparisonDimension[] {
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return comparisons.map((dim) => ({
    ...dim,
    competitors: dim.competitors.map((row) => {
      let ids = resolveEvidenceByIds(row.evidenceIds, evidence).map((e) => e.id);

      if (ids.length === 0) {
        const inherited = profileEvidenceForDimension(
          profileById.get(row.competitorId),
          dim.dimension,
        );
        const claim = row.summary || dim.dimension;
        const { supportedIds } = filterEvidenceByEntailment(
          claim,
          inherited,
          evidence,
        );
        ids =
          supportedIds.length > 0
            ? supportedIds
            : resolveEvidenceByIds(inherited, evidence).map((e) => e.id);
      }

      return { ...row, evidenceIds: ids };
    }),
  }));
}

export function sanitizeComparisons(
  comparisons: ComparisonDimension[],
  evidenceCatalog?: Evidence[],
): ComparisonDimension[] {
  return comparisons.map((dim) => ({
    ...dim,
    competitors: dim.competitors.map((row) => {
      const resolvedIds = evidenceCatalog
        ? resolveEvidenceByIds(row.evidenceIds, evidenceCatalog).map((e) => e.id)
        : row.evidenceIds.filter(Boolean);
      const summaryText = sanitizeNarrativeText(row.summary);
      const scoreable = hasScoreableEvidence(resolvedIds, evidenceCatalog);
      return {
        ...row,
        evidenceIds: resolvedIds,
        score: resolveComparisonScore(
          row.score,
          resolvedIds,
          summaryText,
          evidenceCatalog,
        ),
        summary: scoreable ? summaryText : INSUFFICIENT_EVIDENCE,
      };
    }),
  }));
}

export function sanitizeFeatureMatrix(
  matrix: FeatureMatrixRow[],
  profiles?: CompetitorProfile[],
  evidenceCatalog?: Evidence[],
): FeatureMatrixRow[] {
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return matrix.map((row) => ({
    ...row,
    competitors: row.competitors.map((cell) => {
      let ids = evidenceCatalog
        ? resolveEvidenceByIds(cell.evidenceIds, evidenceCatalog).map((e) => e.id)
        : cell.evidenceIds.filter(Boolean);

      if (ids.length === 0 && profiles && evidenceCatalog) {
        const inherited = profileEvidenceForDimension(
          profileById.get(cell.competitorId),
          row.feature,
        );
        const { supportedIds } = filterEvidenceByEntailment(
          `${row.feature} ${cell.note}`,
          inherited,
          evidenceCatalog,
        );
        ids =
          supportedIds.length > 0
            ? supportedIds
            : resolveEvidenceByIds(inherited, evidenceCatalog).map((e) => e.id);
      }

      const note = sanitizeNarrativeText(cell.note);
      if (!hasScoreableEvidence(ids, evidenceCatalog)) {
        return {
          ...cell,
          evidenceIds: [],
          status: "unknown" as const,
          note: INSUFFICIENT_EVIDENCE,
        };
      }
      return { ...cell, evidenceIds: ids, note };
    }),
  }));
}

export function stripInternalIds(text: string): string {
  return text
    .replace(UUID_RE, "")
    .replace(INTERNAL_ID_RE, "")
    .replace(SHORT_INTERNAL_ID_RE, "")
    .replace(/\bevidence\s*(?:ids?)?\s*[:=]\s*\[[^\]]*\]/gi, "")
    .replace(/\bevidence\s*(?:ids?)?\s*[:=]\s*/gi, "")
    .replace(/\b(fact|insight|opportunity|recommendation)\s*ids?\s*[:=]\s*\[[^\]]*\]/gi, "")
    .replace(/\b(fact|insight|opportunity|recommendation)Id[s]?\b/gi, "")
    .replace(/\bid[s]?\s*[:=]\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/^[,;:\s]+|[,;:\s]+$/g, "")
    .trim();
}

/** Remove Fact:/Inference:/Recommendation: style labels from user-facing prose. */
export function stripStructureLabels(text: string): string {
  return text
    .replace(STRUCTURE_LABEL_RE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function splitIntoClaims(text: string): string[] {
  return text
    .split(/(?<=[.!?。？！])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAbsenceClaim(text: string): boolean {
  return ABSENCE_RE.test(text);
}

/**
 * Rewrite a *single* absence claim into hypothesis phrasing.
 * Must not wrap multi-claim narratives or structure-labeled blobs.
 */
export function rewriteAbsenceClaim(text: string): string {
  const cleaned = stripStructureLabels(stripInternalIds(text));
  if (!isAbsenceClaim(cleaned)) return cleaned;
  if (
    /did not find|insufficient evidence|needs validation|hypothesis/i.test(
      cleaned,
    ) ||
    cleaned.includes("未找到足够证据") ||
    cleaned.includes(INSUFFICIENT_EVIDENCE) ||
    cleaned.includes("待验证") ||
    cleaned.includes("假设")
  ) {
    return cleaned;
  }
  // Refuse to rewrite if this still looks like a multi-claim paragraph
  if (splitIntoClaims(cleaned).length > 1) {
    return cleaned;
  }
  const normalized = cleaned
    .replace(/^(neither|none of|no one)\b/i, "")
    .replace(/\b(does not|doesn't|do not|don't)\s+offer\b/gi, "offers")
    .replace(
      /\b(does not|doesn't|do not|don't)\s+(have|include|provide|support)\b/gi,
      "$2s",
    )
    .replace(/\bhas no\b/gi, "has")
    .replace(/\bhave no\b/gi, "have")
    .replace(/\blacks?\b/gi, "has")
    .replace(/\b(is|are)\s+missing\b/gi, "has")
    .replace(/\bwithout any\b/gi, "with")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!normalized || /^(fact|inference|recommendation)\b/i.test(normalized)) {
    return `我们未找到足够证据支撑该主张。（${NEEDS_VALIDATION}）`;
  }
  return `我们未找到足够证据表明${normalized}。（${NEEDS_VALIDATION}）`;
}

/**
 * Do not generalize “this capability lacks evidence” into
 * “the whole product lacks official evidence” when official sources exist.
 * Operates on a single claim sentence.
 */
export function alignClaimWithEvidenceScope(
  claim: string,
  evidence: Evidence[],
): string {
  const cleaned = stripStructureLabels(stripInternalIds(claim));
  if (!cleaned) return cleaned;

  const hasOfficial = evidence.some((e) =>
    isHighQualitySourceType(e.sourceType),
  );
  if (
    hasOfficial &&
    OVERBROAD_EVIDENCE_ABSENCE_RE.test(cleaned) &&
    !/specifically|for (this|that) (capability|feature|claim)/i.test(cleaned)
  ) {
    const topical = cleaned
      .replace(OVERBROAD_EVIDENCE_ABSENCE_RE, " ")
      .replace(/\b(figma|canva|miro|notion|coda|clickup|confluence|linear|jira|asana)\b/gi, " ")
      .replace(/^['’s]+\s*/i, "")
      .replace(/\b(across|for|the|product|overall|entire|whole)\b/gi, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    const focus =
      topical.length > 8 ? topical : "this specific capability claim";
    return `我们未找到针对「${focus}」的充分官方证据。产品整体存在官方来源，但不足以支撑该具体主张。`;
  }

  return rewriteAbsenceClaim(cleaned);
}

function formatCompetitorList(names: string[]): string {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (unique.length === 0) return "已分析竞品";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} 与 ${unique[1]}`;
  return `${unique.slice(0, -1).join("、")}与 ${unique[unique.length - 1]}`;
}

/**
 * Limited competitor samples must not be phrased as market-wide norms.
 */
export function scopeLimitInsightClaim(
  text: string,
  competitorNames: string[],
  confidence: number,
): string {
  const cleaned = stripStructureLabels(stripInternalIds(text));
  if (!OVERBROAD_MARKET_RE.test(cleaned)) return cleaned;

  // High confidence + broader named set may keep stronger language
  if (confidence >= 0.85 && competitorNames.length >= 4) return cleaned;

  const named = formatCompetitorList(competitorNames);
  return cleaned
    .replace(
      /\b(becoming\s+)?the\s+default(\s+competitive)?\s+norm\b/gi,
      `在已分析竞品（${named}）中反复出现的模式`,
    )
    .replace(/\bindustry\s+standard\b/gi, `在 ${named} 中较常见`)
    .replace(/\bmarket\s+(default|norm|standard)\b/gi, `在 ${named} 中的模式`)
    .replace(/\bcompetitive\s+norm\b/gi, `在 ${named} 中的模式`)
    .replace(/\beveryone\b/gi, named)
    .replace(/\ball\s+competitors\b/gi, named)
    .replace(/\bthe\s+entire\s+market\b/gi, `本次分析范围内的竞品（${named}）`)
    .replace(/成为默认竞争常态|默认竞争常态|行业标准|整个市场|所有竞品/g, (m) => {
      if (m.includes("行业")) return `在 ${named} 中较常见`;
      if (m.includes("整个市场") || m.includes("所有竞品"))
        return `本次分析范围内的竞品（${named}）`;
      return `在已分析竞品（${named}）中反复出现的模式`;
    })
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Strip IDs / structure labels; apply absence/scope guardrails per claim sentence.
 * Never wrap an entire multi-claim narrative in a single absence template.
 */
export function sanitizeNarrativeText(
  text: string,
  linkedEvidence: Evidence[] = [],
): string {
  const cleaned = stripStructureLabels(stripInternalIds(text));
  if (!cleaned) return cleaned;

  const claims = splitIntoClaims(cleaned);
  if (claims.length <= 1) {
    return alignClaimWithEvidenceScope(cleaned, linkedEvidence);
  }

  return claims
    .map((claim) => alignClaimWithEvidenceScope(claim, linkedEvidence))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Absence-of-search ≠ factual absence.
 * Cap confidence at Medium unless explicitly marked otherwise with official denial evidence.
 */
export function sanitizeOpportunities(
  opportunities: Opportunity[],
  evidence: Evidence[],
  insights: Insight[],
): Opportunity[] {
  return opportunities.map((opp) => {
    const linked = resolveEvidenceByIds(opp.evidence, evidence);
    const resolvedIds = linked.map((e) => e.id);
    const blob = `${opp.title} ${opp.problem} ${opp.strategicValue} ${opp.userValue}`;
    const absence = isAbsenceClaim(blob);

    let confidence = propagateDownstreamConfidence01(
      opp.confidence,
      insights,
      linked,
      resolvedIds,
    );

    const title = sanitizeNarrativeText(opp.title, linked);
    const problem = sanitizeNarrativeText(opp.problem, linked);
    const strategicValue = sanitizeNarrativeText(opp.strategicValue, linked);
    const userValue = sanitizeNarrativeText(opp.userValue, linked);

    if (absence || isAbsenceClaim(`${problem} ${strategicValue}`)) {
      confidence = Math.min(confidence, 0.65);
    }

    return {
      ...opp,
      title,
      problem,
      strategicValue,
      userValue,
      evidence: resolvedIds,
      confidence,
    };
  });
}

/** Map insight 0-1 confidence → recommendation 1-5 scale ceiling. */
export function insightConfidenceToRecScale(confidence01: number): number {
  if (confidence01 >= 0.8) return 5;
  if (confidence01 >= 0.6) return 4;
  if (confidence01 >= 0.4) return 3;
  return 2;
}

/**
 * Recommendation confidence cannot exceed supporting insights/evidence ceiling,
 * unless it has additional independent high-quality evidence.
 */
export function propagateRecommendationConfidence(
  recommendations: ProductRecommendation[],
  insights: Insight[],
  evidence: Evidence[],
): ProductRecommendation[] {
  const insightById = new Map(insights.map((i) => [i.id, i]));
  const evidenceById = new Map(evidence.map((e) => [e.id, e]));

  return recommendations.map((rec) => {
    const supportingInsights = rec.insightIds
      .map((id) => insightById.get(id))
      .filter((i): i is Insight => Boolean(i));

    const insightCeiling =
      supportingInsights.length > 0
        ? Math.min(
            ...supportingInsights.map((i) =>
              insightConfidenceToRecScale(i.confidence),
            ),
          )
        : 3;

    const directEvidence = rec.evidenceIds
      .map((id) => evidenceById.get(id))
      .filter((e): e is Evidence => Boolean(e));

    const independentHighQuality = directEvidence.some((e) =>
      isHighQualitySourceType(e.sourceType),
    );

    let ceiling = insightCeiling;
    if (independentHighQuality && supportingInsights.length === 0) {
      ceiling = Math.max(ceiling, 4);
    } else if (independentHighQuality) {
      // Extra independent evidence can raise at most +1 above insight ceiling
      ceiling = Math.min(5, insightCeiling + 1);
    }

    // Evidence quality still caps High
    const evidenceCap = directEvidence.length
      ? insightConfidenceToRecScale(
          calibrateConfidenceBySourceQuality(0.9, directEvidence),
        )
      : ceiling;
    ceiling = Math.min(ceiling, Math.max(evidenceCap, insightCeiling));

    const confidence = Math.min(rec.confidence, ceiling) as 1 | 2 | 3 | 4 | 5;
    const resolvedEvidenceIds = directEvidence.map((e) => e.id);
    const title = sanitizeNarrativeText(rec.title, directEvidence);
    const description = sanitizeNarrativeText(rec.description, directEvidence);
    const reasoning = sanitizeNarrativeText(rec.reasoning, directEvidence);
    const needsValidation =
      resolvedEvidenceIds.length === 0 ||
      isHypothesisText(`${description} ${reasoning}`);

    return {
      ...rec,
      confidence,
      evidenceIds: resolvedEvidenceIds,
      title,
      description,
      reasoning,
      needsValidation,
    };
  });
}

export function sanitizeExecutiveSummary(
  summary: ExecutiveSummary,
  evidence: Evidence[] = [],
): ExecutiveSummary {
  return {
    summary: sanitizeNarrativeText(summary.summary, evidence),
    keyFindings: summary.keyFindings.map((f) =>
      sanitizeNarrativeText(f, evidence),
    ),
    biggestThreat: sanitizeNarrativeText(summary.biggestThreat, evidence),
    biggestOpportunity: sanitizeNarrativeText(
      summary.biggestOpportunity,
      evidence,
    ),
    competitiveAdvantage: summary.competitiveAdvantage
      ? sanitizeNarrativeText(summary.competitiveAdvantage, evidence)
      : summary.competitiveAdvantage,
    recommendedNextMove: sanitizeNarrativeText(
      summary.recommendedNextMove,
      evidence,
    ),
  };
}

function propagateDownstreamConfidence01(
  confidence: number,
  insights: Insight[],
  linkedEvidence: Evidence[],
  evidenceIds: string[],
): number {
  const insightCeiling =
    insights.length > 0
      ? Math.min(...insights.map((i) => i.confidence))
      : confidence;

  let next = Math.min(confidence, insightCeiling);
  next = calibrateConfidenceBySourceQuality(next, linkedEvidence);

  if (evidenceIds.length === 0 && linkedEvidence.length === 0) {
    next = Math.min(next, 0.5);
  }
  return next;
}

export function assessOverallEvidenceQuality(
  evidence: Evidence[],
): "high" | "medium" | "low" {
  if (evidence.length === 0) return "low";
  const high = evidence.filter((e) => isHighQualitySourceType(e.sourceType));
  const uniqueOfficialish = high.length;
  const ratio = uniqueOfficialish / evidence.length;

  if (uniqueOfficialish >= 3 && ratio >= 0.4) return "high";
  if (uniqueOfficialish >= 1 || evidence.length >= 4) return "medium";
  return "low";
}

const THIRD_PARTY_HOST_HINTS = [
  "g2.com",
  "capterra",
  "trustradius",
  "softwarereviews",
  "medium.com",
  "reddit.com",
  "youtube.com",
  "saasworthy",
  "alternativeto",
];

/**
 * Prefer official homepage / product page — never a third-party pricing article.
 */
export function pickCanonicalProductUrl(input: {
  name: string;
  preferredUrl?: string;
  evidence: Evidence[];
  searchUrls?: string[];
}): string | undefined {
  if (input.preferredUrl?.trim()) {
    return input.preferredUrl.trim();
  }

  const brand = input.name.toLowerCase().replace(/\s+/g, "");
  const candidates = [
    ...sortEvidenceBySourceQuality(input.evidence)
      .filter((e) => e.url && isHighQualitySourceType(e.sourceType))
      .map((e) => e.url!),
    ...(input.searchUrls ?? []),
  ];

  const scored = candidates
    .filter(Boolean)
    .map((url) => {
      try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase().replace(/^www\./, "");
        const path = u.pathname.replace(/\/+$/, "") || "/";
        let score = 0;
        if (host.includes(brand) || brand.includes(host.split(".")[0] ?? "")) {
          score += 50;
        }
        if (THIRD_PARTY_HOST_HINTS.some((h) => host.includes(h))) score -= 80;
        if (path === "/" || path.split("/").filter(Boolean).length <= 1) score += 20;
        if (/pricing|blog|review|compare|alternative/i.test(path)) score -= 30;
        if (/product|features|ai/i.test(path)) score += 5;
        score -= path.length / 50;
        return { url, score };
      } catch {
        return { url, score: -100 };
      }
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].url : scored[0]?.url;
}

/**
 * Supporting findings: only count facts whose claim tokens overlap THIS finding.
 * Never return global facts.length.
 */
export function countSupportingFactsForFinding(
  finding: string,
  facts: Fact[],
): number {
  const findingTokens = tokenize(finding);
  if (findingTokens.length === 0) return 0;

  // Require stronger overlap so one finding cannot match almost all facts
  const requiredHits = Math.min(3, Math.max(2, Math.ceil(findingTokens.length * 0.25)));

  return facts.filter((f) => {
    const claimTokens = new Set(tokenize(f.claim));
    const hits = findingTokens.filter((t) => claimTokens.has(t)).length;
    return hits >= requiredHits;
  }).length;
}

export function sanitizeInsightConfidence(
  insights: Insight[],
  facts: Fact[],
  evidence: Evidence[],
): Insight[] {
  const factById = new Map(facts.map((f) => [f.id, f]));

  return insights.map((insight) => {
    const supportingFacts = insight.supportingFactIds
      .map((id) => factById.get(id))
      .filter((f): f is Fact => Boolean(f));

    const insightClaimDraft = `${insight.title}. ${insight.description}`;

    // Re-check each fact claim against insight title+description relevance
    const relevantFacts = supportingFacts.filter((f) => {
      const level = assessClaimEvidenceEntailment(insightClaimDraft, {
        id: f.id,
        competitorId: f.competitorId,
        title: f.claim,
        summary: f.claim,
        sourceType: "manual",
        confidence: "medium",
      });
      return level !== "unsupported";
    });
    const relevantFactIds = relevantFacts.map((f) => f.id);

    const candidateEvidence = evidence.filter((e) =>
      relevantFacts.some((f) => f.evidenceIds.includes(e.id)),
    );

    // Drop evidence that does not topically support the insight claim
    const { supportedIds, levels } = filterEvidenceByEntailment(
      insightClaimDraft,
      candidateEvidence.map((e) => e.id),
      evidence,
    );
    const linkedEvidence = candidateEvidence.filter((e) =>
      supportedIds.includes(e.id),
    );

    let confidence = calibrateConfidenceBySourceQuality(
      insight.confidence,
      linkedEvidence,
    );

    const competitorNames = [
      ...new Set(
        relevantFacts.map((f) => {
          const id = f.competitorId.trim();
          return id ? id.charAt(0).toUpperCase() + id.slice(1) : id;
        }),
      ),
    ];

    let title = sanitizeNarrativeText(insight.title, linkedEvidence);
    let description = sanitizeNarrativeText(
      insight.description,
      linkedEvidence,
    );
    title = scopeLimitInsightClaim(title, competitorNames, confidence);
    description = scopeLimitInsightClaim(
      description,
      competitorNames,
      confidence,
    );

    const onlyPartial =
      linkedEvidence.length > 0 &&
      linkedEvidence.every((e) => levels[e.id] === "partially_supported");
    if (onlyPartial) confidence = Math.min(confidence, 0.65);
    if (relevantFactIds.length === 0 || linkedEvidence.length === 0) {
      confidence = Math.min(confidence, 0.4);
    }
    if (
      isAbsenceClaim(title) ||
      splitIntoClaims(description).some((c) => isAbsenceClaim(c))
    ) {
      confidence = Math.min(confidence, 0.65);
    }
    if (OVERBROAD_MARKET_RE.test(`${insight.title} ${insight.description}`)) {
      confidence = Math.min(confidence, 0.65);
    }

    return {
      ...insight,
      title,
      description,
      supportingFactIds: relevantFactIds,
      confidence,
    };
  });
}

