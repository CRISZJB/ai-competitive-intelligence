"use client";

import { useMemo, useState } from "react";
import type { CompetitiveAnalysisState } from "@/lib/competitive-analysis/types";
import {
  getResearchModeBadge,
  researchModeBadgeLabel,
  formatEvidenceItemsAndSources,
  sourceCoverageBadgeLabel,
  sourceTypeLabel,
} from "@/lib/competitive-analysis/evidence-helpers";
import {
  INSUFFICIENT_EVIDENCE,
  formatComparisonTitle,
} from "@/lib/competitive-analysis/zh-cn";
import { CompetitorCard } from "./CompetitorCard";
import { FeatureMatrix } from "./FeatureMatrix";
import { InsightCard } from "./InsightCard";
import { OpportunityCard } from "./OpportunityCard";
import { RecommendationCard } from "./RecommendationCard";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { OverviewPanel } from "./OverviewPanel";

const TABS = [
  { id: "overview", label: "总览" },
  { id: "competitors", label: "竞品" },
  { id: "matrix", label: "功能矩阵" },
  { id: "ai", label: "AI 能力对比" },
  { id: "pricing", label: "定价" },
  { id: "insights", label: "洞察" },
  { id: "opportunities", label: "机会" },
  { id: "recommendations", label: "建议" },
  { id: "sources", label: "来源" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ResearchBadge({ state }: { state: CompetitiveAnalysisState }) {
  const mode = getResearchModeBadge(state);
  const label = researchModeBadgeLabel(mode);
  const styles =
    mode === "demo"
      ? "border-[var(--warn)]/40 bg-[var(--warn)]/10 text-[var(--warn)]"
      : mode === "live"
        ? "border-[var(--ok)]/40 bg-[var(--ok)]/10 text-[var(--ok)]"
        : "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]";

  const quality = state.evidenceQuality;
  const qualityStyles =
    quality === "high"
      ? "border-[var(--ok)]/40 text-[var(--ok)]"
      : quality === "medium"
        ? "border-[var(--warn)]/40 text-[var(--warn)]"
        : "border-[var(--muted)]/40 text-[var(--muted)]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full border px-2 py-0.5 text-[10px] tracking-wide ${styles}`}
      >
        {label}
      </span>
      {quality && (
        <span
          className={`rounded-full border bg-white/5 px-2 py-0.5 text-[10px] tracking-wide ${qualityStyles}`}
          title="整体来源覆盖度 / 研究深度，与单条洞察置信度相互独立"
        >
          {sourceCoverageBadgeLabel(quality)}
        </span>
      )}
    </div>
  );
}

export function ReportWorkspace({
  state,
  onNewAnalysis,
}: {
  state: CompetitiveAnalysisState;
  onNewAnalysis: () => void;
}) {
  const [tab, setTab] = useState<TabId>("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState("证据");
  const [drawerIds, setDrawerIds] = useState<string[]>([]);

  const evidenceById = useMemo(
    () => Object.fromEntries(state.evidence.map((e) => [e.id, e])),
    [state.evidence],
  );

  function openEvidence(ids: string[], title: string) {
    setDrawerIds(ids);
    setDrawerTitle(title);
    setDrawerOpen(true);
  }

  const drawerEvidence = drawerIds
    .map((id) => evidenceById[id])
    .filter(Boolean);

  const aiComparison = state.comparisons.find((c) =>
    /ai|人工智能/i.test(c.dimension),
  );
  const pricingComparison = state.comparisons.find((c) =>
    /pric|定价/i.test(c.dimension),
  );
  const matrixEntities = state.productProfile
    ? [state.productProfile, ...state.competitors]
    : state.competitors;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="text-[10px] tracking-[0.18em] text-[var(--accent-2)] uppercase">
            分析报告
          </p>
          <h2 className="text-xl font-semibold text-white">
            {formatComparisonTitle(
              state.input.product,
              state.input.competitors,
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ResearchBadge state={state} />
          <button
            type="button"
            onClick={onNewAnalysis}
            className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white"
          >
            新建分析
          </button>
        </div>
      </div>

      <div className="flex min-h-[560px] flex-col md:flex-row">
        <nav className="shrink-0 border-b border-[var(--border)] p-3 md:w-52 md:border-r md:border-b-0">
          <ul className="flex gap-1 overflow-auto md:flex-col">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm ${
                    tab === t.id
                      ? "bg-[var(--accent)]/20 font-medium text-white ring-1 ring-[var(--accent)]/40"
                      : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 p-5 md:p-6">
          {tab === "overview" && (
            <OverviewPanel
              state={state}
              onViewEvidence={openEvidence}
              onExploreRecommendation={() => setTab("recommendations")}
            />
          )}

          {tab === "competitors" && (
            <div className="space-y-6">
              {state.productProfile && (
                <div>
                  <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-[var(--accent-2)] uppercase">
                    目标产品
                  </p>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <CompetitorCard
                      competitor={state.productProfile}
                      onViewEvidence={openEvidence}
                    />
                  </div>
                </div>
              )}
              <div>
                <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
                  竞品
                </p>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {state.competitors.map((c) => (
                    <CompetitorCard
                      key={c.id}
                      competitor={c}
                      onViewEvidence={openEvidence}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "matrix" && (
            <FeatureMatrix
              rows={state.featureMatrix}
              competitors={
                state.productProfile
                  ? [state.productProfile, ...state.competitors]
                  : state.competitors
              }
              onCellClick={openEvidence}
            />
          )}

          {tab === "ai" && (
            <ComparisonList
              title="AI 能力对比"
              comparison={aiComparison}
              competitors={matrixEntities}
              evidence={state.evidence}
              onViewEvidence={openEvidence}
            />
          )}

          {tab === "pricing" && (
            <div className="space-y-6">
              <ComparisonList
                title="定价对比"
                comparison={pricingComparison}
                competitors={matrixEntities}
                evidence={state.evidence}
                onViewEvidence={openEvidence}
              />
              <div className="grid gap-6 md:grid-cols-3">
                {matrixEntities.map((c) => (
                  <div key={c.id}>
                    <h4 className="font-medium text-white">{c.name}</h4>
                    <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                      {(c.pricing ?? []).map((p) => (
                        <li key={p.name}>
                          {p.name}：
                          <span className="text-white">{p.price}</span>
                          {p.notes ? ` — ${p.notes}` : ""}
                        </li>
                      ))}
                      {!c.pricing?.length && (
                        <li>{INSUFFICIENT_EVIDENCE}</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "insights" && (
            <div className="grid gap-4 lg:grid-cols-2">
              {state.insights.map((i) => (
                <InsightCard
                  key={i.id}
                  insight={i}
                  facts={state.facts}
                  evidence={state.evidence}
                  onViewEvidence={openEvidence}
                />
              ))}
            </div>
          )}

          {tab === "opportunities" && (
            <div className="grid gap-4 lg:grid-cols-2">
              {state.opportunities.map((o) => (
                <OpportunityCard
                  key={o.id}
                  opportunity={o}
                  evidence={state.evidence}
                  onViewEvidence={openEvidence}
                />
              ))}
            </div>
          )}

          {tab === "recommendations" && (
            <div className="space-y-4">
              <ImpactEffortLegend recommendations={state.recommendations} />
              <div className="grid gap-4 lg:grid-cols-2">
                {state.recommendations.map((r) => (
                  <RecommendationCard
                    key={r.id}
                    recommendation={r}
                    insights={state.insights}
                    facts={state.facts}
                    evidence={state.evidence}
                    onViewEvidence={openEvidence}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === "sources" && (
            <div>
              <p className="mb-4 text-xs text-[var(--muted)]">
                {state.evidence.length > 0
                  ? formatEvidenceItemsAndSources(state.evidence)
                  : INSUFFICIENT_EVIDENCE}
              </p>
              <div className="divide-y divide-[var(--border)]">
                {state.evidence.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => openEvidence([ev.id], ev.title)}
                    className="block w-full py-4 text-left first:pt-0 hover:opacity-90"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">
                        {ev.title}
                      </p>
                      <span className="text-[10px] tracking-wide text-[var(--muted)]">
                        {sourceTypeLabel(ev.sourceType)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {ev.summary}
                    </p>
                  </button>
                ))}
                {state.evidence.length === 0 && (
                  <p className="text-sm text-[var(--muted)]">
                    {INSUFFICIENT_EVIDENCE}
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <EvidenceDrawer
        open={drawerOpen}
        title={drawerTitle}
        evidence={drawerEvidence}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

function ComparisonList({
  title,
  comparison,
  competitors,
  evidence,
  onViewEvidence,
}: {
  title: string;
  comparison: CompetitiveAnalysisState["comparisons"][number] | undefined;
  competitors: CompetitiveAnalysisState["competitors"];
  evidence: CompetitiveAnalysisState["evidence"];
  onViewEvidence: (ids: string[], title: string) => void;
}) {
  const nameById = Object.fromEntries(competitors.map((c) => [c.id, c.name]));
  const evidenceById = Object.fromEntries(evidence.map((e) => [e.id, e]));

  if (!comparison) {
    return (
      <p className="text-sm text-[var(--muted)]">{INSUFFICIENT_EVIDENCE}</p>
    );
  }
  return (
    <div>
      <h3 className="mb-4 text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
        {title}
      </h3>
      <div className="divide-y divide-[var(--border)]">
        {comparison.competitors.map((row) => {
          const linked = row.evidenceIds
            .map((id) => evidenceById[id])
            .filter(Boolean);
          const resolvedIds = linked.map((e) => e.id);
          const scoreable = resolvedIds.length > 0 && row.score != null;
          return (
            <button
              key={row.competitorId}
              type="button"
              onClick={() =>
                onViewEvidence(
                  resolvedIds,
                  `${nameById[row.competitorId] ?? row.competitorId} · ${comparison.dimension}`,
                )
              }
              className="block w-full py-4 text-left first:pt-0 hover:opacity-90"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-white">
                  {nameById[row.competitorId] ?? row.competitorId}
                </p>
                {scoreable ? (
                  <span className="text-xs text-[var(--accent)]">
                    评分 {row.score}/5
                  </span>
                ) : (
                  <span className="text-xs text-[var(--muted)]">
                    {INSUFFICIENT_EVIDENCE}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">{row.summary}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {linked.length > 0
                  ? formatEvidenceItemsAndSources(linked)
                  : INSUFFICIENT_EVIDENCE}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImpactEffortLegend({
  recommendations,
}: {
  recommendations: CompetitiveAnalysisState["recommendations"];
}) {
  const buckets = {
    "高影响 / 低成本": 0,
    "高影响 / 高成本": 0,
    "低影响 / 低成本": 0,
    "低影响 / 高成本": 0,
  };
  for (const r of recommendations) {
    if (r.impact >= 4 && r.effort <= 2) buckets["高影响 / 低成本"] += 1;
    else if (r.impact >= 4 && r.effort >= 4) buckets["高影响 / 高成本"] += 1;
    else if (r.impact <= 2 && r.effort <= 2) buckets["低影响 / 低成本"] += 1;
    else if (r.impact <= 2 && r.effort >= 4) buckets["低影响 / 高成本"] += 1;
  }
  return (
    <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
      {Object.entries(buckets).map(([label, count]) => (
        <span key={label}>
          {label}：<strong className="text-white">{count}</strong>
        </span>
      ))}
    </div>
  );
}
