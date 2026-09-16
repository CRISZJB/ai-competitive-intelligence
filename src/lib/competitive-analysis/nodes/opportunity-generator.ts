import { v4 as uuid } from "uuid";
import { z } from "zod";
import type { LLMProvider } from "../providers/llm-provider";
import type { AnalysisInput, Fact, Insight, Opportunity } from "../types";
import { opportunityPrompt, opportunitySystem } from "../prompts";
import { DEMO_OPPORTUNITIES } from "../../../data/competitive-analysis/demo";

const OpportunitiesOutputSchema = z.object({
  opportunities: z.array(
    z.object({
      title: z.string(),
      problem: z.string(),
      evidence: z.array(z.string()),
      competitorsAffected: z.array(z.string()),
      userValue: z.string(),
      strategicValue: z.string(),
      confidence: z.number().min(0).max(1),
      impact: z.number().min(1).max(5).optional(),
    }),
  ),
});

function deterministicOpportunities(
  input: AnalysisInput,
  insights: Insight[],
  facts: Fact[],
): Opportunity[] {
  const evidenceIds = facts.flatMap((f) => f.evidenceIds).slice(0, 6);
  const competitorIds = [...new Set(facts.map((f) => f.competitorId))];

  return [
    {
      id: uuid(),
      title: "Cross-tool AI workflow orchestration",
      problem:
        "Users still manually move information between meetings, docs, and tasks.",
      evidence: evidenceIds,
      competitorsAffected: competitorIds,
      userValue: "Fewer context switches; AI produces executable next steps.",
      strategicValue: `Positions ${input.product} as a workflow layer, not only a writing assistant.`,
      confidence: insights[0]?.confidence ?? 0.65,
      impact: 5,
    },
    {
      id: uuid(),
      title: "Low-friction automation on structured data",
      problem:
        "Teams need automation without Coda-like learning curve or ClickUp-like density.",
      evidence: evidenceIds.slice(0, 4),
      competitorsAffected: competitorIds,
      userValue: "Natural-language setup of database workflows.",
      strategicValue: `Leverage ${input.product} structured data advantage with progressive disclosure.`,
      confidence: 0.7,
      impact: 5,
    },
  ];
}

export async function runOpportunityGenerator(
  input: AnalysisInput,
  insights: Insight[],
  facts: Fact[],
  llm: LLMProvider | null,
): Promise<Opportunity[]> {
  if (input.mode === "demo") {
    return DEMO_OPPORTUNITIES.map((o) => ({ ...o }));
  }

  if (llm) {
    try {
      const raw = await llm.generate({
        system: opportunitySystem,
        prompt: opportunityPrompt({
          product: input.product,
          goal: input.goal,
          insightsJson: JSON.stringify(insights, null, 2),
          factsJson: JSON.stringify(facts, null, 2),
          competitors: input.competitors,
        }),
        schema: OpportunitiesOutputSchema,
      });
      return raw.opportunities.map((o) => ({ ...o, id: uuid() }));
    } catch {
      return deterministicOpportunities(input, insights, facts);
    }
  }

  return deterministicOpportunities(input, insights, facts);
}
