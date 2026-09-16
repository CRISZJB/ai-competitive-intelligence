"use client";

import { useMemo, useState } from "react";
import type { AnalysisInput } from "@/lib/competitive-analysis/types";
import { ANALYSIS_DIMENSIONS } from "@/lib/competitive-analysis/types";
import { DEMO_INPUT } from "@/data/competitive-analysis/demo";
import { DIMENSION_LABEL_ZH } from "@/lib/competitive-analysis/zh-cn";

/** Example form values only — not the same as Demo Dataset runtime mode. */
export const EXAMPLE_INPUT: Omit<AnalysisInput, "mode"> & {
  mode?: AnalysisInput["mode"];
} = {
  product: DEMO_INPUT.product,
  productUrl: DEMO_INPUT.productUrl,
  competitors: [...DEMO_INPUT.competitors],
  competitorUrls: DEMO_INPUT.competitorUrls,
  goal: DEMO_INPUT.goal,
  audience: DEMO_INPUT.audience,
  market: DEMO_INPUT.market,
  dimensions: [...DEMO_INPUT.dimensions],
};

type Props = {
  disabled?: boolean;
  onSubmit: (input: AnalysisInput) => void;
  onRunExampleAnalysis?: () => void;
};

export function AnalysisForm({
  disabled,
  onSubmit,
  onRunExampleAnalysis,
}: Props) {
  const [product, setProduct] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorDraft, setCompetitorDraft] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [market, setMarket] = useState("");
  const [dimensions, setDimensions] = useState<string[]>([
    "core_features",
    "ai_capabilities",
    "pricing",
    "positioning",
    "ux_workflow",
  ]);

  const canSubmit = useMemo(
    () =>
      product.trim().length > 0 &&
      competitors.length > 0 &&
      goal.trim().length > 0 &&
      dimensions.length > 0,
    [product, competitors, goal, dimensions],
  );

  function addCompetitor() {
    const name = competitorDraft.trim();
    if (!name) return;
    if (competitors.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setCompetitorDraft("");
      return;
    }
    setCompetitors((prev) => [...prev, name]);
    setCompetitorDraft("");
  }

  function toggleDimension(dim: string) {
    setDimensions((prev) =>
      prev.includes(dim) ? prev.filter((d) => d !== dim) : [...prev, dim],
    );
  }

  /** Prefill sample values only — does not start the workflow. */
  function loadExampleInput() {
    setProduct(EXAMPLE_INPUT.product);
    setProductUrl(EXAMPLE_INPUT.productUrl ?? "");
    setCompetitors([...EXAMPLE_INPUT.competitors]);
    setGoal(EXAMPLE_INPUT.goal);
    setAudience(EXAMPLE_INPUT.audience ?? "");
    setMarket(EXAMPLE_INPUT.market ?? "");
    setDimensions([...EXAMPLE_INPUT.dimensions]);
  }

  return (
    <form
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-5 shadow-xl backdrop-blur md:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit || disabled) return;
        onSubmit({
          product: product.trim(),
          productUrl: productUrl.trim() || undefined,
          competitors,
          goal: goal.trim(),
          audience: audience.trim() || undefined,
          market: market.trim() || undefined,
          dimensions,
        } as AnalysisInput);
      }}
    >
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-2)] uppercase">
          新建分析
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
          研究简报
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          定义分析目标与维度。工作流会分阶段收集证据，而不是一次生成整篇报告。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs text-[var(--muted)]">你的产品</span>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm outline-none ring-[var(--accent)] focus:ring-2"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="例如 Notion"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-[var(--muted)]">产品官网（可选）</span>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm outline-none ring-[var(--accent)] focus:ring-2"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://"
          />
        </label>
      </div>

      <div className="mt-4 space-y-2">
        <span className="text-xs text-[var(--muted)]">竞品</span>
        <div className="flex flex-wrap gap-2">
          {competitors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() =>
                setCompetitors((prev) => prev.filter((x) => x !== c))
              }
              className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-sm text-white hover:border-[var(--danger)]"
              title="移除"
            >
              {c} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm outline-none ring-[var(--accent)] focus:ring-2"
            value={competitorDraft}
            onChange={(e) => setCompetitorDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCompetitor();
              }
            }}
            placeholder="添加竞品"
          />
          <button
            type="button"
            onClick={addCompetitor}
            className="rounded-xl border border-[var(--border)] px-4 text-sm text-white hover:border-[var(--accent)]"
          >
            +
          </button>
        </div>
      </div>

      <label className="mt-4 block space-y-1.5">
        <span className="text-xs text-[var(--muted)]">研究目标</span>
        <textarea
          className="min-h-[96px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm outline-none ring-[var(--accent)] focus:ring-2"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="你想回答的竞争问题是什么？"
        />
      </label>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs text-[var(--muted)]">目标用户</span>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm outline-none ring-[var(--accent)] focus:ring-2"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-[var(--muted)]">市场 / 地区</span>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm outline-none ring-[var(--accent)] focus:ring-2"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 space-y-2">
        <span className="text-xs text-[var(--muted)]">分析维度</span>
        <div className="flex flex-wrap gap-2">
          {ANALYSIS_DIMENSIONS.map((dim) => {
            const active = dimensions.includes(dim);
            return (
              <button
                key={dim}
                type="button"
                onClick={() => toggleDimension(dim)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--border)] text-[var(--muted)] hover:text-white"
                }`}
              >
                {DIMENSION_LABEL_ZH[dim] ?? dim}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={!canSubmit || disabled}
          className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {disabled ? "分析中…" : "开始分析"}
        </button>

        {onRunExampleAnalysis && (
          <button
            type="button"
            disabled={disabled}
            onClick={onRunExampleAnalysis}
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            运行示例分析 →
          </button>
        )}
      </div>

      <p className="mt-4 text-sm text-[var(--muted)]">
        使用示例：{" "}
        <button
          type="button"
          disabled={disabled}
          onClick={loadExampleInput}
          className="text-[var(--accent)] underline-offset-2 transition hover:text-white hover:underline disabled:opacity-40"
        >
          Notion 与 Coda、ClickUp、Confluence 对比
        </button>
      </p>
    </form>
  );
}
