import type { LLMProvider } from "../providers/llm-provider";
import type { AnalysisInput, ResearchPlan } from "../types";
import { ResearchPlanSchema } from "../schemas";
import { researchPlannerPrompt, researchPlannerSystem } from "../prompts";
import { DEMO_RESEARCH_PLAN } from "../../../data/competitive-analysis/demo";

export async function runResearchPlanner(
  input: AnalysisInput,
  llm: LLMProvider | null,
): Promise<ResearchPlan> {
  if (input.mode === "demo" || !llm) {
    return {
      ...DEMO_RESEARCH_PLAN,
      dimensions: input.dimensions,
      competitorTasks: input.competitors.map((competitor) => ({
        competitor,
        focus: input.dimensions.slice(0, 4),
      })),
      researchQuestions: DEMO_RESEARCH_PLAN.researchQuestions,
      assumptions: [
        ...DEMO_RESEARCH_PLAN.assumptions,
        input.mode === "demo"
          ? "Running in Demo / Sample Data mode — not live web research."
          : "No LLM API key configured; using deterministic demo planner output.",
      ],
    };
  }

  return llm.generate({
    system: researchPlannerSystem,
    prompt: researchPlannerPrompt(input),
    schema: ResearchPlanSchema,
  });
}
