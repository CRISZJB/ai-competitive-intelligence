"use client";

import { useState } from "react";
import type { CompetitiveAnalysisState } from "@/lib/competitive-analysis/types";
import {
  getResearchModeBadge,
  researchModeBadgeLabel,
  countUniqueSources,
} from "@/lib/competitive-analysis/evidence-helpers";

type Step = {
  id: string;
  label: string;
  match: (
    state: CompetitiveAnalysisState,
  ) => "done" | "active" | "pending" | "error";
};

function buildSteps(state: CompetitiveAnalysisState): Step[] {
  const competitorSteps: Step[] = state.input.competitors.map((name) => ({
    id: `comp-${name}`,
    label: `${name} 研究`,
    match: (s) => {
      const profile = s.competitors.find(
        (c) => c.name.toLowerCase() === name.toLowerCase(),
      );
      if (!profile) {
        return s.status === "researching" &&
          s.activities.some(
            (a) =>
              (a.label === `正在研究 ${name}` ||
                a.label === `Researching ${name}`) &&
              a.status === "active",
          )
          ? "active"
          : s.competitors.length > 0 &&
              s.input.competitors.indexOf(name) < s.competitors.length
            ? "pending"
            : s.status === "planning"
              ? "pending"
              : s.activities.some(
                    (a) => a.label.includes(name) && a.status === "active",
                  )
                ? "active"
                : "pending";
      }
      if (profile.status === "error") return "error";
      if (profile.status === "complete" || profile.status === "partial")
        return "done";
      return "active";
    },
  }));

  return [
    {
      id: "plan",
      label: "研究计划",
      match: (s) =>
        s.researchPlan
          ? "done"
          : s.status === "planning"
            ? "active"
            : "pending",
    },
    ...competitorSteps,
    {
      id: "analysis",
      label: "竞品对比分析",
      match: (s) => {
        if (s.comparisons.length > 0) return "done";
        if (
          s.currentStep === "Comparison Engine" ||
          s.currentStep === "Evidence Extraction"
        )
          return "active";
        return s.facts.length > 0 ? "active" : "pending";
      },
    },
    {
      id: "opp",
      label: "机会发现",
      match: (s) => {
        if (s.opportunities.length > 0) return "done";
        if (s.currentStep === "Opportunity Discovery") return "active";
        return s.insights.length > 0 ? "active" : "pending";
      },
    },
    {
      id: "rec",
      label: "产品建议",
      match: (s) => {
        if (s.recommendations.length > 0) return "done";
        if (s.currentStep === "Recommendation") return "active";
        return "pending";
      },
    },
  ];
}

const icon = {
  done: "✓",
  active: "→",
  pending: "○",
  error: "!",
} as const;

function ModeBadge({ state }: { state: CompetitiveAnalysisState }) {
  const mode = getResearchModeBadge(state);
  const label = researchModeBadgeLabel(mode);
  const styles =
    mode === "demo"
      ? "border-[var(--warn)]/40 bg-[var(--warn)]/10 text-[var(--warn)]"
      : mode === "live"
        ? "border-[var(--ok)]/40 bg-[var(--ok)]/10 text-[var(--ok)]"
        : "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] tracking-wide ${styles}`}
    >
      {label}
    </span>
  );
}

type Props = {
  state: CompetitiveAnalysisState;
  onViewReport?: () => void;
  defaultExpanded?: boolean;
};

export function WorkflowProgress({
  state,
  onViewReport,
  defaultExpanded = false,
}: Props) {
  const steps = buildSteps(state);
  const isComplete = state.status === "complete";
  const [expanded, setExpanded] = useState(defaultExpanded && !isComplete);

  const completedStages = steps.filter((s) => s.match(state) === "done").length;
  const evidenceItemCount = state.evidence.length;
  const uniqueSourceCount = countUniqueSources(state.evidence);
  const factCount = state.facts.length;
  const insightCount = state.insights.length;

  if (isComplete && !expanded) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ok)]/20 text-xs text-[var(--ok)]">
                ✓
              </span>
              <h3 className="text-sm font-semibold text-white">分析完成</h3>
              <ModeBadge state={state} />
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {completedStages} 个研究阶段已完成
            </p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              {evidenceItemCount} 条证据 · {uniqueSourceCount} 个独立来源 ·{" "}
              {factCount} 条事实 · {insightCount} 条洞察
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onViewReport && (
              <button
                type="button"
                onClick={onViewReport}
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                查看报告
              </button>
            )}
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] transition hover:text-white"
            >
              查看运行详情
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">
          {isComplete ? "运行详情" : "研究进度"}
        </h3>
        <div className="flex items-center gap-2">
          <ModeBadge state={state} />
          {isComplete && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-xs text-[var(--muted)] hover:text-white"
            >
              收起
            </button>
          )}
        </div>
      </div>
      <ul className="space-y-2">
        {steps.map((step) => {
          const status = step.match(state);
          return (
            <li
              key={step.id}
              className={`flex items-center gap-3 text-sm ${
                status === "pending"
                  ? "text-[var(--muted)]"
                  : status === "error"
                    ? "text-[var(--danger)]"
                    : "text-white"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  status === "done"
                    ? "bg-[var(--ok)]/20 text-[var(--ok)]"
                    : status === "active"
                      ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                      : status === "error"
                        ? "bg-[var(--danger)]/20"
                        : "bg-white/5"
                }`}
              >
                {icon[status]}
              </span>
              <span>{step.label}</span>
            </li>
          );
        })}
      </ul>

      {state.activities.length > 0 && (
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <p className="mb-2 text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase">
            工作流进度
          </p>
          <ul className="max-h-40 space-y-1 overflow-auto text-xs text-[var(--muted)]">
            {state.activities.slice(-8).map((a) => (
              <li key={a.id}>
                <span className="text-white/80">{a.label}</span>
                {a.detail ? ` — ${a.detail}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
