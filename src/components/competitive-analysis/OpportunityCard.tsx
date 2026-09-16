"use client";

import type { Evidence, Opportunity } from "@/lib/competitive-analysis/types";
import {
  formatEvidenceItemsAndSources,
  getEvidenceForOpportunity,
} from "@/lib/competitive-analysis/evidence-helpers";
import { INSUFFICIENT_EVIDENCE } from "@/lib/competitive-analysis/zh-cn";

type Props = {
  opportunity: Opportunity;
  evidence?: Evidence[];
  onViewEvidence: (evidenceIds: string[], title: string) => void;
};

function stars(n: number) {
  const filled = Math.round(n);
  return "★".repeat(filled) + "☆".repeat(Math.max(0, 5 - filled));
}

export function OpportunityCard({
  opportunity,
  evidence = [],
  onViewEvidence,
}: Props) {
  const impact = opportunity.impact ?? Math.round(opportunity.confidence * 5);
  const confidenceStars = Math.round(opportunity.confidence * 5);
  const linked = getEvidenceForOpportunity(opportunity, evidence);

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-[10px] tracking-[0.2em] text-[var(--accent-2)] uppercase">
        机会
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">
        {opportunity.title}
      </h3>

      <Section label="问题" text={opportunity.problem} />
      <Section label="竞争空白" text={opportunity.strategicValue} />
      <Section label="潜在产品方向" text={opportunity.userValue} />

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div>
          <p className="text-[10px] text-[var(--muted)] uppercase">影响</p>
          <p className="text-[var(--warn)]">{stars(impact)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--muted)] uppercase">置信度</p>
          <p className="text-[var(--accent)]">{stars(confidenceStars)}</p>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-[var(--muted)]">
        {linked.length > 0
          ? formatEvidenceItemsAndSources(linked)
          : INSUFFICIENT_EVIDENCE}
      </p>

      <button
        type="button"
        onClick={() =>
          onViewEvidence(
            linked.map((e) => e.id),
            opportunity.title,
          )
        }
        className="mt-4 text-xs font-medium text-[var(--accent)] hover:underline"
      >
        查看证据 →
      </button>
    </article>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3">
      <p className="text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm text-white/85">{text}</p>
    </div>
  );
}
