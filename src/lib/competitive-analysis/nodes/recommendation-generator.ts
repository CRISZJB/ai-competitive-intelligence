import { v4 as uuid } from "uuid";
import { z } from "zod";
import type { LLMProvider } from "../providers/llm-provider";
import type {
  AnalysisInput,
  ExecutiveSummary,
  Insight,
  Opportunity,
  ProductRecommendation,
} from "../types";
import { recommendationPrompt, recommendationSystem } from "../prompts";
import {
  DEMO_EXECUTIVE_SUMMARY,
  DEMO_RECOMMENDATIONS,
} from "../../../data/competitive-analysis/demo";
import { ExecutiveSummarySchema } from "../types";

const RecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      impact: z.number().min(1).max(5),
      effort: z.number().min(1).max(5),
      confidence: z.number().min(1).max(5),
      reasoning: z.string(),
      evidenceIds: z.array(z.string()),
      insightIds: z.array(z.string()),
    }),
  ),
  executiveSummary: ExecutiveSummarySchema,
});

function deterministicRecommendations(
  input: AnalysisInput,
  opportunities: Opportunity[],
  insights: Insight[],
): { recommendations: ProductRecommendation[]; executiveSummary: ExecutiveSummary } {
  const recommendations: ProductRecommendation[] = opportunities.slice(0, 3).map((o, idx) => ({
    id: uuid(),
    title: o.title.startsWith("Invest") ? o.title : `Pursue: ${o.title}`,
    description: `${o.userValue} Strategic angle: ${o.strategicValue}`,
    impact: (o.impact ?? 4) as 1 | 2 | 3 | 4 | 5,
    effort: (idx === 0 ? 4 : idx === 1 ? 3 : 2) as 1 | 2 | 3 | 4 | 5,
    confidence: 4 as 1 | 2 | 3 | 4 | 5,
    reasoning: `Because: ${insights[0]?.title ?? o.problem}. We infer: this creates a product gap worth closing. Therefore: prioritize ${o.title} for ${input.product}.`,
    evidenceIds: o.evidence,
    insightIds: insights.slice(0, 2).map((i) => i.id),
  }));

  return {
    recommendations,
    executiveSummary: {
      summary: `${input.product} faces an AI landscape shifting from writing assistants to workflow layers. Based on structured competitor facts and insights, the highest-leverage move is concrete orchestration around user breakpoints — not more generic AI copy features.`,
      keyFindings: insights.slice(0, 4).map((i) => i.title),
      biggestThreat: insights[0]?.title ?? "Feature parity in AI writing",
      biggestOpportunity: opportunities[0]?.title ?? "insufficient evidence",
      competitiveAdvantage: `${input.product} can win with progressive, evidence-linked automation rather than tool sprawl.`,
      recommendedNextMove:
        recommendations[0]?.title ?? "Validate top opportunity with a tracer-bullet prototype",
    },
  };
}

export async function runRecommendationGenerator(
  input: AnalysisInput,
  opportunities: Opportunity[],
  insights: Insight[],
  llm: LLMProvider | null,
): Promise<{
  recommendations: ProductRecommendation[];
  executiveSummary: ExecutiveSummary;
}> {
  if (input.mode === "demo") {
    return {
      recommendations: DEMO_RECOMMENDATIONS.map((r) => ({ ...r })),
      executiveSummary: { ...DEMO_EXECUTIVE_SUMMARY },
    };
  }

  if (llm) {
    try {
      const raw = await llm.generate({
        system: recommendationSystem,
        prompt: recommendationPrompt({
          product: input.product,
          goal: input.goal,
          opportunitiesJson: JSON.stringify(opportunities, null, 2),
          insightsJson: JSON.stringify(insights, null, 2),
        }),
        schema: RecommendationsOutputSchema,
      });
      return {
        recommendations: raw.recommendations.map((r) => ({ ...r, id: uuid() })),
        executiveSummary: raw.executiveSummary,
      };
    } catch {
      return deterministicRecommendations(input, opportunities, insights);
    }
  }

  return deterministicRecommendations(input, opportunities, insights);
}
