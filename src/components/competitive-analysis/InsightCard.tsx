"use client";

import type { Insight, Fact, Evidence } from "@/lib/competitive-analysis/types";
import {
  confidenceLabel,
  formatEvidenceItemsAndSources,
  getEvidenceForInsight,
} from "@/lib/competitive-analysis/evidence-helpers";

type Props = {
  insight: Insight;
  facts: Fact[];
  evidence: Evidence[];
  onViewEvidence: (evidenceIds: string[], title: string) => void;
};

export function InsightCard({
  insight,
  facts,
  evidence,
  onViewEvidence,
}: Props) {
  const supporting = facts.filter((f) =>
    insight.supportingFactIds.includes(f.id),
  );
  const linkedEvidence = getEvidenceForInsight(insight, facts, evidence);

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-[10px] tracking-[0.2em] text-[var(--accent)] uppercase">
        洞察
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">{insight.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        {insight.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
        <span>
          证据{" "}
          <strong className="text-white">
            {formatEvidenceItemsAndSources(linkedEvidence)}
          </strong>
        </span>
        <span>
          置信度{" "}
          <strong className="text-white">
            {confidenceLabel(insight.confidence)}
          </strong>
        </span>
      </div>
      <ul className="mt-3 space-y-1 text-xs text-white/70">
        {supporting.slice(0, 4).map((f) => (
          <li key={f.id}>• {f.claim}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() =>
          onViewEvidence(
            linkedEvidence.map((e) => e.id),
            insight.title,
          )
        }
        className="mt-4 text-xs font-medium text-[var(--accent)] hover:underline"
      >
        查看证据 →
      </button>
    </article>
  );
}
