"use client";

import type { Evidence } from "@/lib/competitive-analysis/types";
import {
  countUniqueSources,
  evidenceConfidenceLabel,
  sourceTypeLabel,
} from "@/lib/competitive-analysis/evidence-helpers";
import { INSUFFICIENT_EVIDENCE } from "@/lib/competitive-analysis/zh-cn";

type Props = {
  open: boolean;
  title?: string;
  evidence: Evidence[];
  onClose: () => void;
};

const SOURCE_BADGE: Record<Evidence["sourceType"], string> = {
  official: "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]",
  documentation:
    "border-[var(--accent-2)]/40 bg-[var(--accent-2)]/10 text-[var(--accent-2)]",
  pricing: "border-[var(--warn)]/40 bg-[var(--warn)]/10 text-[var(--warn)]",
  review: "border-white/20 bg-white/5 text-white/80",
  article: "border-[var(--muted)]/40 bg-white/5 text-[var(--muted)]",
  manual: "border-[var(--muted)]/40 bg-white/5 text-[var(--muted)]",
};

export function EvidenceDrawer({ open, title, evidence, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="关闭证据抽屉"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="text-[10px] tracking-[0.18em] text-[var(--accent-2)] uppercase">
              证据
            </p>
            <h3 className="text-lg font-semibold text-white">
              {title ?? "来源"}
            </h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {evidence.length > 0
                ? `${evidence.length} 条证据 · ${countUniqueSources(evidence)} 个独立来源`
                : INSUFFICIENT_EVIDENCE}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-2 py-1 text-sm text-[var(--muted)] hover:text-white"
          >
            关闭
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-auto p-5">
          {evidence.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              证据不足 — 该条目暂无关联来源。
            </p>
          ) : (
            evidence.map((ev) => (
              <article
                key={ev.id}
                className="border-b border-[var(--border)] pb-4 last:border-b-0"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white">{ev.title}</p>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] tracking-wide ${SOURCE_BADGE[ev.sourceType]}`}
                  >
                    {sourceTypeLabel(ev.sourceType)}
                  </span>
                </div>
                {ev.quote && (
                  <blockquote className="border-l-2 border-[var(--accent)] pl-3 text-sm text-white/80 italic">
                    “{ev.quote}”
                  </blockquote>
                )}
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  <span className="text-white/70">摘要：</span>
                  {ev.summary}
                </p>
                {ev.url && (
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block truncate text-xs text-[var(--accent)] hover:underline"
                  >
                    {ev.url}
                  </a>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[var(--muted)]">
                  <span>
                    置信度：
                    <strong className="text-white">
                      {evidenceConfidenceLabel(ev.confidence)}
                    </strong>
                  </span>
                  {ev.retrievedAt && (
                    <span>获取时间：{ev.retrievedAt.slice(0, 10)}</span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
