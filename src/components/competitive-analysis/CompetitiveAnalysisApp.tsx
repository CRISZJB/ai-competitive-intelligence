"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AnalysisInput,
  CompetitiveAnalysisState,
  ProgressEvent,
} from "@/lib/competitive-analysis/types";
import {
  AnalysisForm,
  EXAMPLE_INPUT,
} from "@/components/competitive-analysis/AnalysisForm";
import { WorkflowProgress } from "@/components/competitive-analysis/WorkflowProgress";
import { ReportWorkspace } from "@/components/competitive-analysis/ReportWorkspace";

export function CompetitiveAnalysisApp() {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<CompetitiveAnalysisState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const didScrollToReport = useRef(false);

  const startAnalysis = useCallback(async (input: AnalysisInput) => {
    setRunning(true);
    setError(null);
    setState(null);
    didScrollToReport.current = false;

    try {
      const res = await fetch("/api/competitive-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? `请求失败（${res.status}）`);
      }

      if (!res.body) {
        throw new Error("无响应数据流");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const event = JSON.parse(trimmed) as ProgressEvent;
          if (event.state) {
            setState(event.state);
          }
          if (event.type === "error") {
            setError(event.message ?? "工作流出错");
          }
        }
      }

      if (buffer.trim()) {
        const event = JSON.parse(buffer.trim()) as ProgressEvent;
        if (event.state) setState(event.state);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setRunning(false);
    }
  }, []);

  const runExampleAnalysis = useCallback(() => {
    void startAnalysis({
      product: EXAMPLE_INPUT.product,
      productUrl: EXAMPLE_INPUT.productUrl,
      competitors: [...EXAMPLE_INPUT.competitors],
      competitorUrls: EXAMPLE_INPUT.competitorUrls,
      goal: EXAMPLE_INPUT.goal,
      audience: EXAMPLE_INPUT.audience,
      market: EXAMPLE_INPUT.market,
      dimensions: [...EXAMPLE_INPUT.dimensions],
      mode: "demo",
    });
  }, [startAnalysis]);

  const showReport = state?.status === "complete";

  const scrollToReport = useCallback(() => {
    reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (showReport && !didScrollToReport.current) {
      didScrollToReport.current = true;
      const t = window.setTimeout(scrollToReport, 120);
      return () => window.clearTimeout(t);
    }
  }, [showReport, scrollToReport]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold tracking-[0.22em] text-[var(--accent-2)] uppercase">
          竞品情报
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          AI 竞品分析工作流
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
          以证据为核心的多阶段分析工作流：研究 → 事实 → 对比 → 洞察 → 机会 →
          建议。不是一次让大模型写完整报告。
        </p>
      </header>

      {!showReport && (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <AnalysisForm
            disabled={running}
            onSubmit={startAnalysis}
            onRunExampleAnalysis={runExampleAnalysis}
          />
          {state ? (
            <WorkflowProgress state={state} />
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted)]">
              <p className="font-medium text-white/80">工作方式</p>
              <ol className="mt-3 list-decimal space-y-1.5 pl-4">
                <li>制定研究计划</li>
                <li>按竞品收集证据并研究</li>
                <li>结构化事实与功能矩阵</li>
                <li>洞察 → 机会 → 产品建议</li>
              </ol>
              <p className="mt-4 text-xs leading-relaxed">
                填写研究简报后点击
                <span className="text-white">「开始分析」</span>
                ，或使用
                <span className="text-white">「运行示例分析」</span>
                查看示例数据演示。
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {showReport && state && (
        <div className="space-y-5">
          <WorkflowProgress state={state} onViewReport={scrollToReport} />
          <div ref={reportRef}>
            <ReportWorkspace
              state={state}
              onNewAnalysis={() => {
                setState(null);
                setError(null);
                didScrollToReport.current = false;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
