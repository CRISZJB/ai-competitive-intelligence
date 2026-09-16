import { v4 as uuid } from "uuid";
import type {
  AnalysisInput,
  CompetitiveAnalysisState,
  WorkflowActivity,
} from "../types";

export function createInitialState(input: AnalysisInput): CompetitiveAnalysisState {
  const now = new Date().toISOString();
  const mode = input.mode === "live" ? "live" : "demo";
  const hasWebSearch = Boolean(process.env.TAVILY_API_KEY);
  const researchMode =
    mode === "demo" ? "demo" : hasWebSearch ? "live" : "limited";

  return {
    id: uuid(),
    input: { ...input, mode },
    competitors: [],
    evidence: [],
    facts: [],
    comparisons: [],
    featureMatrix: [],
    insights: [],
    opportunities: [],
    recommendations: [],
    activities: [],
    isDemo: mode === "demo",
    researchMode,
    status: "planning",
    currentStep: "Research Planner",
    errors: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function touch(
  state: CompetitiveAnalysisState,
  patch: Partial<CompetitiveAnalysisState>,
): CompetitiveAnalysisState {
  return {
    ...state,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export function pushActivity(
  state: CompetitiveAnalysisState,
  label: string,
  status: WorkflowActivity["status"],
  detail?: string,
): CompetitiveAnalysisState {
  const activity: WorkflowActivity = {
    id: uuid(),
    label,
    status,
    detail,
    at: new Date().toISOString(),
  };
  return touch(state, {
    activities: [...state.activities, activity],
  });
}

export function setActivityStatus(
  state: CompetitiveAnalysisState,
  label: string,
  status: WorkflowActivity["status"],
  detail?: string,
): CompetitiveAnalysisState {
  const activities = state.activities.map((a) =>
    a.label === label && a.status === "active"
      ? { ...a, status, detail: detail ?? a.detail }
      : a,
  );
  return touch(state, { activities });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
