import { v4 as uuid } from "uuid";
import { z } from "zod";
import type { LLMProvider } from "../providers/llm-provider";
import type {
  AnalysisInput,
  ComparisonDimension,
  Evidence,
  Fact,
  Insight,
} from "../types";
import { insightPrompt, insightSystem } from "../prompts";
import { DEMO_INSIGHTS } from "../../../data/competitive-analysis/demo";
import {
  calibrateConfidenceBySourceQuality,
  getEvidenceForInsight,
} from "../evidence-helpers";

const InsightsOutputSchema = z.object({
  insights: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      supportingFactIds: z.array(z.string()),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

/**
 * Keep only fact ids that exist, and drop empty supporting sets.
 * Confidence is recalibrated from linked evidence source quality.
 */
function finalizeInsights(
  raw: Omit<Insight, "id">[],
  facts: Fact[],
  evidence: Evidence[],
): Insight[] {
  const factIds = new Set(facts.map((f) => f.id));

  return raw
    .map((insight) => {
      const supportingFactIds = [
        ...new Set(insight.supportingFactIds.filter((id) => factIds.has(id))),
      ];
      const withId: Insight = {
        ...insight,
        id: uuid(),
        supportingFactIds,
      };
      const linked = getEvidenceForInsight(withId, facts, evidence);
      return {
        ...withId,
        confidence: calibrateConfidenceBySourceQuality(
          insight.confidence,
          linked,
        ),
      };
    })
    .filter((i) => i.supportingFactIds.length > 0);
}

function deterministicInsights(
  facts: Fact[],
  evidence: Evidence[],
): Insight[] {
  const byDim = (d: string) => facts.filter((f) => f.dimension === d);
  const ai = byDim("ai_capabilities");
  const ux = byDim("user_reviews");
  const integ = byDim("integrations");

  const drafts: Omit<Insight, "id">[] = [];
  if (ai.length >= 2) {
    drafts.push({
      title: "AI competition is shifting toward workflow execution",
      description:
        "Multiple competitors expose AI beyond drafting — into context across objects or actions. Writing-only differentiation is becoming feature parity.",
      supportingFactIds: ai.slice(0, 3).map((f) => f.id),
      confidence: 0.75,
    });
  }
  if (ux.length >= 1) {
    drafts.push({
      title: "Power vs. cognitive load remains an unresolved tension",
      description:
        "User feedback repeatedly trades flexibility/breadth against learning curve or UI density — a gap for progressive, AI-assisted configuration.",
      supportingFactIds: ux.slice(0, 3).map((f) => f.id),
      confidence: 0.7,
    });
  }
  if (integ.length >= 1 || ai.length >= 1) {
    // Only attach facts from the dimensions that actually support the claim
    const supporting = [
      ...integ.slice(0, 2),
      ...ai.filter((f) => /workflow|automat|action|cross/i.test(f.claim)).slice(0, 2),
    ];
    const ids =
      supporting.length > 0
        ? supporting.map((f) => f.id)
        : [...integ, ...ai].slice(0, 2).map((f) => f.id);
    drafts.push({
      title: "Cross-tool orchestration is still under-served",
      description:
        "Integrations and in-product AI exist, but end-to-end movement of work across meeting → doc → task remains weakly automated.",
      supportingFactIds: ids,
      confidence: 0.72,
    });
  }
  if (drafts.length === 0) {
    drafts.push({
      title: "insufficient evidence for cross-competitor insights",
      description:
        "Not enough structured facts were extracted to support high-confidence strategic insights.",
      supportingFactIds: facts.slice(0, 2).map((f) => f.id),
      confidence: 0.3,
    });
  }

  return finalizeInsights(drafts, facts, evidence);
}

export async function runInsightGenerator(
  input: AnalysisInput,
  facts: Fact[],
  comparisons: ComparisonDimension[],
  llm: LLMProvider | null,
  evidence: Evidence[] = [],
): Promise<Insight[]> {
  if (input.mode === "demo") {
    return finalizeInsights(
      DEMO_INSIGHTS.map(({ title, description, supportingFactIds, confidence }) => ({
        title,
        description,
        supportingFactIds,
        confidence,
      })),
      facts,
      evidence,
    );
  }

  if (llm) {
    try {
      const raw = await llm.generate({
        system: insightSystem,
        prompt: insightPrompt({
          product: input.product,
          goal: input.goal,
          factsJson: JSON.stringify(facts, null, 2),
          comparisonsJson: JSON.stringify(comparisons, null, 2),
        }),
        schema: InsightsOutputSchema,
      });
      const finalized = finalizeInsights(raw.insights, facts, evidence);
      if (finalized.length > 0) return finalized;
    } catch {
      // fall through
    }
  }

  return deterministicInsights(facts, evidence);
}
