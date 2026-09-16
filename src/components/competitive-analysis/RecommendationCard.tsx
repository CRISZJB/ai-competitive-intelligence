"use client";

import type {
  Evidence,
  Fact,
  Insight,
  ProductRecommendation,
} from "@/lib/competitive-analysis/types";
import {
  formatEvidenceItemsAndSources,
  getEvidenceForRecommendation,
  parseWhyChain,
} from "@/lib/competitive-analysis/evidence-helpers";
import {
  NEEDS_VALIDATION,
  NO_LINKED_EVIDENCE,
} from "@/lib/competitive-analysis/zh-cn";

type Props = {
  recommendation: ProductRecommendation;
  insights?: Insight[];
  facts?: Fact[];
  evidence?: Evidence[];
  onViewEvidence: (evidenceIds: string[], title: string) => void;
};

function quadrant(impact: number, effort: number): string {
  if (impact >= 4 && effort <= 2) return "高影响 / 低成本";
  if (impact >= 4 && effort >= 4) return "高影响 / 高成本";
  if (impact <= 2 && effort <= 2) return "低影响 / 低成本";
  if (impact <= 2 && effort >= 4) return "低影响 / 高成本";
  if (impact >= 4) return "高影响 / 中等成本";
  return "中等影响 / 中等成本";
}

export function RecommendationCard({
  recommendation,
  insights = [],
  facts = [],
  evidence = [],
  onViewEvidence,
}: Props) {
  const why = parseWhyChain(recommendation.reasoning);
  const linked = getEvidenceForRecommendation(
    recommendation,
    insights,
    facts,
    evidence,
  );
  const needsValidation =
    linked.length === 0 ||
    recommendation.needsValidation === true ||
    /needs validation|hypothesis|假设|待验证/i.test(
      `${recommendation.description} ${recommendation.reasoning}`,
    );

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">
          {recommendation.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {needsValidation && (
            <span className="rounded-full border border-[var(--warn)]/40 bg-[var(--warn)]/10 px-2 py-0.5 text-[10px] text-[var(--warn)]">
              {NEEDS_VALIDATION}
            </span>
          )}
          <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] text-[var(--accent)]">
            {quadrant(recommendation.impact, recommendation.effort)}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {recommendation.description}
      </p>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-white/70">
        <p>
          <span className="font-medium text-white/90">依据：</span>
          {why.because}
        </p>
        {why.infer ? (
          <p>
            <span className="font-medium text-white/90">我们推断：</span>
            {why.infer}
          </p>
        ) : null}
        {why.therefore ? (
          <p>
            <span className="font-medium text-white/90">因此建议：</span>
            {why.therefore}
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        <Metric label="影响" value={recommendation.impact} />
        <Metric label="实施成本" value={recommendation.effort} />
        <Metric label="置信度" value={recommendation.confidence} />
      </div>
      <p className="mt-3 text-[11px] text-[var(--muted)]">
        {linked.length > 0
          ? formatEvidenceItemsAndSources(linked)
          : NO_LINKED_EVIDENCE}
      </p>
      {linked.length > 0 ? (
        <button
          type="button"
          onClick={() =>
            onViewEvidence(
              linked.map((e) => e.id),
              recommendation.title,
            )
          }
          className="mt-2 text-xs font-medium text-[var(--accent)] hover:underline"
        >
          查看证据 →
        </button>
      ) : (
        <p className="mt-2 text-xs text-[var(--muted)]">
          暂无法查看证据 — 没有关联来源。
        </p>
      )}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-lg border border-[var(--border)] px-2 py-1">
      {label}{" "}
      <strong className="text-white">{value}/5</strong>
    </span>
  );
}
