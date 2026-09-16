"use client";

import type { CompetitorProfile } from "@/lib/competitive-analysis/types";
import {
  STATUS_ZH,
  sourceCoverageLabel,
} from "@/lib/competitive-analysis/zh-cn";

type Props = {
  competitor: CompetitorProfile;
  onViewEvidence: (evidenceIds: string[], title: string) => void;
};

export function CompetitorCard({ competitor, onViewEvidence }: Props) {
  const aiStrategy =
    competitor.aiCapabilities.map((c) => c.name).join(" · ") || "证据不足";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              {competitor.name}
            </h3>
            {competitor.role === "product" && (
              <span className="rounded-full border border-[var(--accent-2)]/40 bg-[var(--accent-2)]/10 px-2 py-0.5 text-[10px] text-[var(--accent-2)]">
                目标产品
              </span>
            )}
          </div>
          {competitor.url && (
            <a
              href={competitor.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--accent)] hover:underline"
            >
              {competitor.url.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              competitor.status === "complete"
                ? "bg-[var(--ok)]/15 text-[var(--ok)]"
                : competitor.status === "partial"
                  ? "bg-[var(--warn)]/15 text-[var(--warn)]"
                  : competitor.status === "error"
                    ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                    : "bg-white/10 text-[var(--muted)]"
            }`}
          >
            {STATUS_ZH[competitor.status] ?? competitor.status}
          </span>
          {competitor.evidenceQuality && (
            <span className="text-[10px] text-[var(--muted)]">
              {sourceCoverageLabel(competitor.evidenceQuality)}
            </span>
          )}
        </div>
      </div>

      <Field label="产品定位" value={competitor.positioning} />
      <Field
        label="目标用户"
        value={competitor.targetUsers.join(" / ") || "证据不足"}
      />
      <Field
        label="优势"
        value={competitor.strengths[0]?.title ?? "证据不足"}
      />
      <Field
        label="劣势"
        value={competitor.weaknesses[0]?.title ?? "证据不足"}
      />
      <Field label="AI 策略" value={aiStrategy} />

      <button
        type="button"
        onClick={() =>
          onViewEvidence(competitor.evidenceIds, `${competitor.name} 证据`)
        }
        className="mt-auto pt-4 text-left text-xs font-medium text-[var(--accent)] hover:underline"
      >
        查看证据 →
      </button>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm text-white/90">{value}</p>
    </div>
  );
}
