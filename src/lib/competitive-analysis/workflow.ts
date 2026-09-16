import type {
  AnalysisInput,
  CompetitiveAnalysisState,
  ProgressEvent,
} from "./types";
import { createLLMProvider } from "./providers/llm-provider";
import { createResearchProvider } from "./providers";
import {
  createInitialState,
  pushActivity,
  setActivityStatus,
  sleep,
  touch,
} from "./nodes/state";
import { runResearchPlanner } from "./nodes/research-planner";
import { researchCompetitor } from "./nodes/competitor-research";
import { extractFactsFromProfiles } from "./nodes/evidence-extractor";
import { runComparisonEngine } from "./nodes/comparison";
import { runInsightGenerator } from "./nodes/insight-generator";
import { runOpportunityGenerator } from "./nodes/opportunity-generator";
import { runRecommendationGenerator } from "./nodes/recommendation-generator";
import {
  assessOverallEvidenceQuality,
  bindFactsWithEntailment,
  propagateRecommendationConfidence,
  sanitizeExecutiveSummary,
  sanitizeInsightConfidence,
  sanitizeOpportunities,
} from "./consistency";
import { getEvidenceForRecommendation } from "./evidence-helpers";

export type ProgressCallback = (event: ProgressEvent) => void | Promise<void>;

async function emit(
  onProgress: ProgressCallback | undefined,
  state: CompetitiveAnalysisState,
  type: ProgressEvent["type"] = "progress",
  message?: string,
) {
  if (onProgress) {
    await onProgress({ type, state, message });
  }
}

/**
 * Multi-stage competitive intelligence workflow.
 * One competitor failure does not abort the pipeline.
 */
export async function runCompetitiveAnalysisWorkflow(
  input: AnalysisInput,
  onProgress?: ProgressCallback,
): Promise<CompetitiveAnalysisState> {
  const resolved: AnalysisInput = {
    ...input,
    mode: input.mode ?? "demo",
  };
  const mode: "demo" | "live" = resolved.mode === "live" ? "live" : "demo";
  const analysisInput: AnalysisInput = { ...resolved, mode };
  let state = createInitialState(analysisInput);
  const llm = createLLMProvider();
  const research = createResearchProvider(mode);

  try {
    // —— Node 1: Research Planner ——
    state = pushActivity(state, "正在制定研究计划", "active");
    state = touch(state, {
      status: "planning",
      currentStep: "Research Planner",
    });
    await emit(onProgress, state, "progress", "正在制定研究计划");
    await sleep(mode === "demo" ? 400 : 0);

    const plan = await runResearchPlanner(analysisInput, llm);
    state = setActivityStatus(state, "正在制定研究计划", "done");
    state = touch(state, { researchPlan: plan });
    await emit(onProgress, state);

    // —— Node 2a: Target Product Research ——
    state = touch(state, {
      status: "researching",
      currentStep: "Target Product Research",
    });
    const productLabel = `正在研究目标产品 ${analysisInput.product}`;
    state = pushActivity(
      state,
      productLabel,
      "active",
      "正在收集产品相关公开资料",
    );
    await emit(onProgress, state, "progress", productLabel);
    await sleep(mode === "demo" ? 400 : 0);

    const productResult = await researchCompetitor(
      analysisInput.product,
      analysisInput,
      research,
      llm,
      { role: "product", preferredUrl: analysisInput.productUrl },
    );

    const allEvidence = [...productResult.evidence];
    state = setActivityStatus(
      state,
      productLabel,
      productResult.profile.status === "error" ? "error" : "done",
      productResult.profile.errorMessage,
    );
    state = touch(state, {
      productProfile: productResult.profile,
      evidence: [...allEvidence],
    });
    await emit(onProgress, state);

    // —— Node 2b: Competitor Research (per competitor) ——
    state = touch(state, {
      status: "researching",
      currentStep: "Competitor Research",
    });

    const competitorProfiles = [];

    for (const competitor of analysisInput.competitors) {
      const label = `正在研究 ${competitor}`;
      state = pushActivity(state, label, "active", "正在收集公开资料");
      await emit(onProgress, state, "progress", label);
      await sleep(mode === "demo" ? 500 : 0);

      const result = await researchCompetitor(
        competitor,
        analysisInput,
        research,
        llm,
        { role: "competitor" },
      );
      competitorProfiles.push(result.profile);
      allEvidence.push(...result.evidence);

      state = setActivityStatus(
        state,
        label,
        result.profile.status === "error" ? "error" : "done",
        result.profile.status === "partial" || result.profile.status === "error"
          ? result.profile.errorMessage
          : undefined,
      );
      state = touch(state, {
        competitors: [...competitorProfiles],
        evidence: [...allEvidence],
      });
      await emit(onProgress, state);
    }

    const allProfiles = [productResult.profile, ...competitorProfiles];

    // —— Node 3: Evidence / Fact extraction + entailment binding ——
    state = pushActivity(state, "正在提取结构化事实", "active");
    state = touch(state, {
      status: "analyzing",
      currentStep: "Evidence Extraction",
    });
    await emit(onProgress, state);
    await sleep(mode === "demo" ? 300 : 0);

    const rawFacts = extractFactsFromProfiles(
      allProfiles,
      allEvidence,
      mode === "demo",
    );
    const facts = bindFactsWithEntailment(rawFacts, allEvidence);
    state = setActivityStatus(state, "正在提取结构化事实", "done");
    state = touch(state, { facts });
    await emit(onProgress, state);

    // —— Node 4–5: Comparison + Feature Matrix (product vs competitors) ——
    state = pushActivity(state, "正在对比功能覆盖", "active");
    state = touch(state, { currentStep: "Comparison Engine" });
    await emit(onProgress, state);
    await sleep(mode === "demo" ? 350 : 0);

    const { comparisons, featureMatrix } = await runComparisonEngine(
      analysisInput,
      allProfiles,
      facts,
      llm,
      allEvidence,
    );
    state = setActivityStatus(state, "正在对比功能覆盖", "done");
    state = touch(state, { comparisons, featureMatrix });
    await emit(onProgress, state);

    // —— Insight Engine ——
    state = pushActivity(state, "正在生成竞品洞察", "active");
    state = touch(state, {
      status: "generating_insights",
      currentStep: "Insight Generation",
    });
    await emit(onProgress, state);
    await sleep(mode === "demo" ? 350 : 0);

    let insights = await runInsightGenerator(
      analysisInput,
      facts,
      comparisons,
      llm,
      allEvidence,
    );
    insights = sanitizeInsightConfidence(insights, facts, allEvidence);
    state = setActivityStatus(state, "正在生成竞品洞察", "done");
    state = touch(state, { insights });
    await emit(onProgress, state);

    // —— Opportunity Discovery ——
    state = pushActivity(state, "正在识别市场机会", "active");
    state = touch(state, { currentStep: "Opportunity Discovery" });
    await emit(onProgress, state);
    await sleep(mode === "demo" ? 350 : 0);

    let opportunities = await runOpportunityGenerator(
      analysisInput,
      insights,
      facts,
      llm,
    );
    opportunities = sanitizeOpportunities(
      opportunities,
      allEvidence,
      insights,
    );
    state = setActivityStatus(state, "正在识别市场机会", "done");
    state = touch(state, { opportunities });
    await emit(onProgress, state);

    // —— Recommendations + Final report payload ——
    state = pushActivity(state, "正在生成产品建议", "active");
    state = touch(state, { currentStep: "Recommendation" });
    await emit(onProgress, state);
    await sleep(mode === "demo" ? 350 : 0);

    const generated = await runRecommendationGenerator(
      analysisInput,
      opportunities,
      insights,
      llm,
    );
    const recommendations = propagateRecommendationConfidence(
      generated.recommendations,
      insights,
      allEvidence,
    ).map((rec) => {
      const resolved = getEvidenceForRecommendation(
        rec,
        insights,
        facts,
        allEvidence,
      );
      return {
        ...rec,
        needsValidation:
          resolved.length === 0 || rec.needsValidation === true,
      };
    });
    const executiveSummary = sanitizeExecutiveSummary(
      generated.executiveSummary,
      allEvidence,
    );

    const evidenceQuality = assessOverallEvidenceQuality(allEvidence);

    state = setActivityStatus(state, "正在生成产品建议", "done");
    state = pushActivity(state, "分析报告已生成", "done");
    state = touch(state, {
      recommendations,
      executiveSummary,
      evidenceQuality,
      status: "complete",
      currentStep: "Final Report",
    });
    await emit(onProgress, state, "complete", "分析完成");

    return state;
  } catch (err) {
    const message = err instanceof Error ? err.message : "工作流执行失败";
    state = touch(state, {
      status: "error",
      errors: [...state.errors, message],
    });
    state = pushActivity(state, "工作流出错", "error", message);
    await emit(onProgress, state, "error", message);
    return state;
  }
}
