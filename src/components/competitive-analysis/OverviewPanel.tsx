"use client";

import { useMemo } from "react";
import type { CompetitiveAnalysisState } from "@/lib/competitive-analysis/types";
import {
  confidenceLabel,
  countSupportingFactsForFinding,
  formatEvidenceItemsAndSources,
  getEvidenceForInsight,
  getEvidenceForOpportunity,
  getEvidenceForRecommendation,
  parseWhyChain,
  scaleLabel,
  selectPrimaryOpportunity,
  selectPrimaryRecommendation,
  selectThreatInsight,
  selectTopInsight,
  truncateToSentences,
} from "@/lib/competitive-analysis/evidence-helpers";
import {
  INSUFFICIENT_EVIDENCE,
  NEEDS_VALIDATION,
  NO_LINKED_EVIDENCE,
} from "@/lib/competitive-analysis/zh-cn";

type OpenEvidence = (ids: string[], title: string) => void;

type Props = {
  state: CompetitiveAnalysisState;
  onViewEvidence: OpenEvidence;
  onExploreRecommendation: () => void;
};

export function OverviewPanel({
  state,
  onViewEvidence,
  onExploreRecommendation,
}: Props) {
  const exec = state.executiveSummary;

  const topInsight = useMemo(
    () => selectTopInsight(state.insights),
    [state.insights],
  );

  const primaryRec = useMemo(
    () =>
      selectPrimaryRecommendation(
        state.recommendations,
        exec?.recommendedNextMove,
      ),
    [state.recommendations, exec?.recommendedNextMove],
  );

  const primaryOpp = useMemo(
    () =>
      selectPrimaryOpportunity(
        state.opportunities,
        exec?.biggestOpportunity,
      ),
    [state.opportunities, exec?.biggestOpportunity],
  );

  const threatInsight = useMemo(
    () => selectThreatInsight(state.insights, exec?.biggestThreat),
    [state.insights, exec?.biggestThreat],
  );

  if (!exec) {
    return (
      <p className="text-sm text-[var(--muted)]">暂无执行摘要。</p>
    );
  }

  const topInsightEvidence = topInsight
    ? getEvidenceForInsight(topInsight, state.facts, state.evidence)
    : [];

  const threatEvidence = threatInsight
    ? getEvidenceForInsight(threatInsight, state.facts, state.evidence)
    : [];

  const oppEvidence = primaryOpp
    ? getEvidenceForOpportunity(primaryOpp, state.evidence)
    : [];

  const recEvidence = primaryRec
    ? getEvidenceForRecommendation(
        primaryRec,
        state.insights,
        state.facts,
        state.evidence,
      )
    : [];

  const why = primaryRec
    ? parseWhyChain(primaryRec.reasoning)
    : { because: "", infer: "", therefore: "" };

  return (
    <div className="space-y-10">
      <section>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
          执行摘要
        </p>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-white/90">
          {truncateToSentences(exec.summary, 4)}
        </p>
        {exec.competitiveAdvantage && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
            <span className="text-white/70">定位：</span>
            {exec.competitiveAdvantage}
          </p>
        )}
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/15 via-[var(--surface)] to-[var(--surface)] p-6 md:p-8">
        <p className="text-[10px] font-semibold tracking-[0.22em] text-[var(--accent)] uppercase">
          核心战略洞察
        </p>
        {topInsight ? (
          <>
            <h3 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {topInsight.title}
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/75 md:text-base">
              {topInsight.description}
            </p>
            <div className="mt-6 flex flex-wrap items-end gap-6">
              <Meta
                label="证据"
                value={
                  topInsightEvidence.length > 0
                    ? formatEvidenceItemsAndSources(topInsightEvidence)
                    : INSUFFICIENT_EVIDENCE
                }
              />
              <Meta
                label="置信度"
                value={confidenceLabel(topInsight.confidence)}
              />
            </div>
            <button
              type="button"
              onClick={() =>
                onViewEvidence(
                  topInsightEvidence.map((e) => e.id),
                  topInsight.title,
                )
              }
              className="mt-5 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              查看证据 →
            </button>
          </>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">
            {INSUFFICIENT_EVIDENCE}
          </p>
        )}
      </section>

      <section className="grid gap-8 md:grid-cols-2 md:gap-10">
        <aside>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--danger)] uppercase">
            最大威胁
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {threatInsight?.title ?? "竞争压力"}
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            {exec.biggestThreat}
          </p>
          <p className="mt-3 text-xs text-[var(--muted)]">
            {threatEvidence.length > 0
              ? formatEvidenceItemsAndSources(threatEvidence)
              : INSUFFICIENT_EVIDENCE}
          </p>
          {threatEvidence.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onViewEvidence(
                  threatEvidence.map((e) => e.id),
                  "最大威胁",
                )
              }
              className="mt-2 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              查看证据 →
            </button>
          )}
        </aside>

        <aside>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--ok)] uppercase">
            最大机会
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {primaryOpp?.title ?? "市场空白"}
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            {exec.biggestOpportunity}
          </p>
          <p className="mt-3 text-xs text-[var(--muted)]">
            {oppEvidence.length > 0
              ? formatEvidenceItemsAndSources(oppEvidence)
              : INSUFFICIENT_EVIDENCE}
          </p>
          {oppEvidence.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onViewEvidence(
                  oppEvidence.map((e) => e.id),
                  primaryOpp?.title ?? "最大机会",
                )
              }
              className="mt-2 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              查看证据 →
            </button>
          )}
        </aside>
      </section>

      <div className="h-px bg-[var(--border)]" />

      <section className="rounded-2xl border border-[var(--accent-2)]/35 bg-[var(--surface-2)]/60 p-6 md:p-8">
        <p className="text-[10px] font-semibold tracking-[0.22em] text-[var(--accent-2)] uppercase">
          下一步建议
        </p>
        {primaryRec ? (
          <>
            <h3 className="mt-3 text-xl font-semibold text-white md:text-2xl">
              {primaryRec.title}
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80">
              {primaryRec.description}
            </p>

            <div className="mt-6">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
                为什么
              </p>
              <div className="mt-3 space-y-3 text-sm leading-relaxed">
                <WhyLine label="依据" text={why.because} />
                {why.infer ? (
                  <WhyLine label="我们推断" text={why.infer} />
                ) : null}
                {why.therefore ? (
                  <WhyLine label="因此建议" text={why.therefore} />
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-6">
              <Meta label="影响" value={scaleLabel(primaryRec.impact)} />
              <Meta label="实施成本" value={scaleLabel(primaryRec.effort)} />
              <Meta
                label="置信度"
                value={scaleLabel(primaryRec.confidence)}
              />
              <Meta
                label="证据"
                value={
                  recEvidence.length > 0
                    ? formatEvidenceItemsAndSources(recEvidence)
                    : NO_LINKED_EVIDENCE
                }
              />
            </div>

            {(recEvidence.length === 0 ||
              primaryRec.needsValidation ||
              /needs validation|hypothesis|假设|待验证/i.test(
                `${primaryRec.description} ${primaryRec.reasoning}`,
              )) && (
              <p className="mt-3 text-xs text-[var(--warn)]">
                {NEEDS_VALIDATION}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onExploreRecommendation}
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                查看建议详情
              </button>
              {recEvidence.length > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    onViewEvidence(
                      recEvidence.map((e) => e.id),
                      primaryRec.title,
                    )
                  }
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] transition hover:text-white"
                >
                  查看证据
                </button>
              ) : (
                <span className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] opacity-60">
                  {NO_LINKED_EVIDENCE}
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">
            {exec.recommendedNextMove || INSUFFICIENT_EVIDENCE}
          </p>
        )}
      </section>

      <section>
        <p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
          支撑发现
        </p>
        <ul className="mt-4 space-y-3">
          {exec.keyFindings.map((finding) => {
            const factCount = countSupportingFactsForFinding(
              finding,
              state.facts,
            );
            return (
              <li
                key={finding}
                className="flex items-baseline justify-between gap-4 border-b border-[var(--border)]/70 pb-3 last:border-b-0"
              >
                <p className="text-sm text-white/80">{finding}</p>
                <span className="shrink-0 text-[11px] text-[var(--muted)]">
                  {factCount > 0
                    ? `${factCount} 条支撑事实`
                    : INSUFFICIENT_EVIDENCE}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function WhyLine({ label, text }: { label: string; text: string }) {
  return (
    <p className="text-[var(--muted)]">
      <span className="font-medium text-white/90">{label}：</span>
      {text}
    </p>
  );
}
