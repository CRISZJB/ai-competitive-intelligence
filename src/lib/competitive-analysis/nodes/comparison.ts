import type { LLMProvider } from "../providers/llm-provider";
import type {
  AnalysisInput,
  ComparisonDimension,
  CompetitorProfile,
  Evidence,
  Fact,
  FeatureMatrixRow,
} from "../types";
import { z } from "zod";
import { comparisonPrompt, comparisonSystem } from "../prompts";
import {
  DEMO_COMPARISONS,
  DEMO_FEATURE_MATRIX,
} from "../../../data/competitive-analysis/demo";
import {
  bindComparisonEvidence,
  hasScoreableEvidence,
  sanitizeComparisons,
  sanitizeFeatureMatrix,
} from "../consistency";
import { INSUFFICIENT_EVIDENCE } from "../zh-cn";

const ComparisonEngineOutputSchema = z.object({
  comparisons: z.array(
    z.object({
      dimension: z.string(),
      competitors: z.array(
        z.object({
          competitorId: z.string(),
          score: z.number().min(0).max(5).nullable().optional(),
          summary: z.string(),
          evidenceIds: z.array(z.string()),
        }),
      ),
    }),
  ),
  featureMatrix: z.array(
    z.object({
      feature: z.string(),
      competitors: z.array(
        z.object({
          competitorId: z.string(),
          status: z.enum(["strong", "medium", "weak", "unknown"]),
          note: z.string(),
          evidenceIds: z.array(z.string()),
        }),
      ),
    }),
  ),
});

function scoredRow(
  profile: CompetitorProfile,
  summary: string,
  evidenceIds: string[],
  scoreWhenEvidence: number | null,
): ComparisonDimension["competitors"][number] {
  if (
    !hasScoreableEvidence(evidenceIds) ||
    /insufficient evidence/i.test(summary) ||
    summary.includes(INSUFFICIENT_EVIDENCE)
  ) {
    return {
      competitorId: profile.id,
      score: null,
      summary: INSUFFICIENT_EVIDENCE,
      evidenceIds: [],
    };
  }
  return {
    competitorId: profile.id,
    score: scoreWhenEvidence,
    summary,
    evidenceIds,
  };
}

function deterministicComparison(
  profiles: CompetitorProfile[],
  evidence: Evidence[] = [],
): { comparisons: ComparisonDimension[]; featureMatrix: FeatureMatrixRow[] } {
  const maturityScore = { strong: 5, medium: 3, weak: 1, unknown: 2 } as const;

  const comparisons: ComparisonDimension[] = [
    {
      dimension: "????",
      competitors: profiles.map((p) =>
        scoredRow(
          p,
          p.positioning || INSUFFICIENT_EVIDENCE,
          p.evidenceIds.slice(0, 2),
          3,
        ),
      ),
    },
    {
      dimension: "AI ??",
      competitors: profiles.map((p) => {
        const evidenceIds = p.aiCapabilities
          .flatMap((c) => c.evidenceIds)
          .slice(0, 3);
        const avg =
          p.aiCapabilities.length === 0
            ? null
            : p.aiCapabilities.reduce(
                (s, c) => s + maturityScore[c.maturity],
                0,
              ) / p.aiCapabilities.length;
        return scoredRow(
          p,
          p.aiCapabilities.map((c) => c.name).join("?") ||
            INSUFFICIENT_EVIDENCE,
          evidenceIds,
          avg === null ? null : Math.round(avg * 10) / 10,
        );
      }),
    },
    {
      dimension: "????",
      competitors: profiles.map((p) =>
        scoredRow(
          p,
          p.coreFeatures.map((f) => f.name).join("?") || INSUFFICIENT_EVIDENCE,
          p.coreFeatures.flatMap((f) => f.evidenceIds).slice(0, 3),
          Math.min(5, Math.max(1, p.coreFeatures.length)),
        ),
      ),
    },
    {
      dimension: "??",
      competitors: profiles.map((p) =>
        scoredRow(
          p,
          p.pricing?.map((x) => `${x.name}?${x.price}`).join("?") ||
            INSUFFICIENT_EVIDENCE,
          p.pricing?.flatMap((x) => x.evidenceIds).slice(0, 2) ?? [],
          p.pricing?.length ? 3 : null,
        ),
      ),
    },
    {
      dimension: "??",
      competitors: profiles.map((p) =>
        scoredRow(
          p,
          p.weaknesses[0]?.title
            ? `????${p.weaknesses[0].title}`
            : INSUFFICIENT_EVIDENCE,
          p.weaknesses[0]?.evidenceIds ?? [],
          p.weaknesses[0] ? 3 : null,
        ),
      ),
    },
    {
      dimension: "??",
      competitors: profiles.map((p) =>
        scoredRow(
          p,
          p.integrations.join("?") || INSUFFICIENT_EVIDENCE,
          p.evidenceIds.slice(0, 1),
          p.integrations.length
            ? Math.min(5, Math.max(1, p.integrations.length))
            : null,
        ),
      ),
    },
    {
      dimension: "????",
      competitors: profiles.map((p) =>
        scoredRow(
          p,
          p.targetUsers.join("?") || INSUFFICIENT_EVIDENCE,
          p.evidenceIds.slice(0, 1),
          p.targetUsers.length ? 3 : null,
        ),
      ),
    },
    {
      dimension: "????",
      competitors: profiles.map((p) =>
        scoredRow(
          p,
          p.userFeedback.slice(0, 2).join(" | ") || INSUFFICIENT_EVIDENCE,
          p.evidenceIds.slice(0, 2),
          p.userFeedback.length ? 3 : null,
        ),
      ),
    },
  ];

  const featureNames = [
    "AI ?? / ??",
    "AI ??",
    "???",
    "???",
    "??",
  ];

  const featureMatrix: FeatureMatrixRow[] = featureNames.map((feature) => ({
    feature,
    competitors: profiles.map((p) => {
      const match = p.aiCapabilities.find((c) =>
        feature.toLowerCase().includes("ai")
          ? true
          : c.name
              .toLowerCase()
              .includes(feature.toLowerCase().split(" ")[0] ?? ""),
      );
      const evidenceIds = match?.evidenceIds ?? [];
      if (!hasScoreableEvidence(evidenceIds) && feature !== "??") {
        return {
          competitorId: p.id,
          status: "unknown" as const,
          note: INSUFFICIENT_EVIDENCE,
          evidenceIds: [],
        };
      }
      const status =
        match?.maturity ??
        (feature === "??"
          ? p.integrations.length > 2
            ? "strong"
            : p.integrations.length > 0
              ? "medium"
              : "unknown"
          : "unknown");
      return {
        competitorId: p.id,
        status: status as "strong" | "medium" | "weak" | "unknown",
        note:
          match?.description ??
          (status === "unknown" ? INSUFFICIENT_EVIDENCE : ""),
        evidenceIds:
          match?.evidenceIds ??
          (feature === "??" ? p.evidenceIds.slice(0, 1) : []),
      };
    }),
  }));

  return {
    comparisons: sanitizeComparisons(
      bindComparisonEvidence(comparisons, profiles, evidence),
      evidence,
    ),
    featureMatrix: sanitizeFeatureMatrix(featureMatrix, profiles, evidence),
  };
}

export async function runComparisonEngine(
  input: AnalysisInput,
  profiles: CompetitorProfile[],
  facts: Fact[],
  llm: LLMProvider | null,
  evidence: Evidence[] = [],
): Promise<{ comparisons: ComparisonDimension[]; featureMatrix: FeatureMatrixRow[] }> {
  if (input.mode === "demo") {
    const ids = new Set(profiles.map((p) => p.id));
    return {
      comparisons: sanitizeComparisons(
        bindComparisonEvidence(
          DEMO_COMPARISONS.map((c) => ({
            ...c,
            competitors: c.competitors.filter((x) => ids.has(x.competitorId)),
          })),
          profiles,
          evidence,
        ),
        evidence,
      ),
      featureMatrix: sanitizeFeatureMatrix(
        DEMO_FEATURE_MATRIX.map((row) => ({
          ...row,
          competitors: row.competitors.filter((x) => ids.has(x.competitorId)),
        })),
        profiles,
        evidence,
      ),
    };
  }

  if (llm) {
    try {
      const raw = await llm.generate({
        system: comparisonSystem,
        prompt: comparisonPrompt({
          product: input.product,
          profilesJson: JSON.stringify(profiles, null, 2),
          factsJson: JSON.stringify(facts, null, 2),
        }),
        schema: ComparisonEngineOutputSchema,
      });
      return {
        comparisons: sanitizeComparisons(
          bindComparisonEvidence(raw.comparisons, profiles, evidence),
          evidence,
        ),
        featureMatrix: sanitizeFeatureMatrix(
          raw.featureMatrix,
          profiles,
          evidence,
        ),
      };
    } catch {
      return deterministicComparison(profiles, evidence);
    }
  }

  return deterministicComparison(profiles, evidence);
}
