import { v4 as uuid } from "uuid";
import type { CompetitorProfile, Evidence, Fact } from "../types";
import { DEMO_FACTS } from "../../../data/competitive-analysis/demo";
import {
  isHighQualitySourceType,
  sortEvidenceBySourceQuality,
} from "../evidence-helpers";

function confidenceFromEvidence(related: Evidence[], fallback: number): number {
  if (related.length === 0) return Math.min(fallback, 0.4);
  const ranked = sortEvidenceBySourceQuality(related);
  const top = ranked[0];
  const base =
    top.confidence === "high" ? 0.85 : top.confidence === "medium" ? 0.7 : 0.45;
  if (!related.some((e) => isHighQualitySourceType(e.sourceType))) {
    return Math.min(base, 0.65);
  }
  return Math.max(base, fallback * 0.9);
}

function pickEvidenceIds(related: Evidence[], limit = 2): string[] {
  return sortEvidenceBySourceQuality(related)
    .slice(0, limit)
    .map((e) => e.id);
}

/**
 * Deterministic evidence → fact extraction.
 * Prefers official / documentation / pricing when linking evidence.
 */
export function extractFactsFromProfiles(
  profiles: CompetitorProfile[],
  evidence: Evidence[],
  isDemo: boolean,
): Fact[] {
  if (isDemo) {
    const ids = new Set(profiles.map((p) => p.id));
    return DEMO_FACTS.filter(
      (f) => ids.has(f.competitorId) || f.competitorId === "notion",
    );
  }

  const facts: Fact[] = [];

  for (const profile of profiles) {
    const related = sortEvidenceBySourceQuality(
      evidence.filter((e) => e.competitorId === profile.id),
    );

    if (
      profile.positioning &&
      !profile.positioning.includes("insufficient evidence")
    ) {
      const evidenceIds = pickEvidenceIds(related, 2);
      facts.push({
        id: uuid(),
        competitorId: profile.id,
        dimension: "positioning",
        claim: `${profile.name} positioning: ${profile.positioning}`,
        evidenceIds,
        confidence: confidenceFromEvidence(
          related.filter((e) => evidenceIds.includes(e.id)),
          0.7,
        ),
      });
    }

    for (const cap of profile.aiCapabilities) {
      const preferred = sortEvidenceBySourceQuality(
        cap.evidenceIds.length
          ? evidence.filter((e) => cap.evidenceIds.includes(e.id))
          : related,
      );
      const evidenceIds = preferred.slice(0, 2).map((e) => e.id);
      const maturityBase =
        cap.maturity === "strong" ? 0.85 : cap.maturity === "medium" ? 0.7 : 0.5;
      facts.push({
        id: uuid(),
        competitorId: profile.id,
        dimension: "ai_capabilities",
        claim: `${profile.name} AI: ${cap.name} — ${cap.description}`,
        evidenceIds,
        confidence: confidenceFromEvidence(preferred.slice(0, 2), maturityBase),
      });
    }

    for (const feature of profile.coreFeatures) {
      const preferred = sortEvidenceBySourceQuality(
        feature.evidenceIds.length
          ? evidence.filter((e) => feature.evidenceIds.includes(e.id))
          : related,
      );
      const evidenceIds = preferred.slice(0, 2).map((e) => e.id);
      facts.push({
        id: uuid(),
        competitorId: profile.id,
        dimension: "core_features",
        claim: `${profile.name} feature: ${feature.name} — ${feature.description}`,
        evidenceIds,
        confidence: confidenceFromEvidence(preferred.slice(0, 2), 0.75),
      });
    }

    for (const fb of profile.userFeedback) {
      const reviews = related.filter((e) => e.sourceType === "review");
      facts.push({
        id: uuid(),
        competitorId: profile.id,
        dimension: "user_reviews",
        claim: `${profile.name} user feedback: ${fb}`,
        evidenceIds: reviews.map((e) => e.id),
        confidence: confidenceFromEvidence(reviews, 0.6),
      });
    }
  }

  return facts;
}
