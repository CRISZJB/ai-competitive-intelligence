"use client";

import type {
  FeatureMatrixRow,
  CompetitorProfile,
} from "@/lib/competitive-analysis/types";
import { STATUS_ZH } from "@/lib/competitive-analysis/zh-cn";

const STATUS_STYLE = {
  strong: "bg-[var(--ok)]/20 text-[var(--ok)]",
  medium: "bg-[var(--warn)]/20 text-[var(--warn)]",
  weak: "bg-[var(--danger)]/20 text-[var(--danger)]",
  unknown: "bg-white/10 text-[var(--muted)]",
} as const;

type Props = {
  rows: FeatureMatrixRow[];
  competitors: CompetitorProfile[];
  onCellClick: (evidenceIds: string[], title: string) => void;
};

export function FeatureMatrix({ rows, competitors, onCellClick }: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">暂无功能矩阵。</p>
    );
  }

  const nameById = Object.fromEntries(competitors.map((c) => [c.id, c.name]));

  return (
    <div className="overflow-auto rounded-2xl border border-[var(--border)]">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-[var(--surface-2)]">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
              能力
            </th>
            {competitors.map((c) => (
              <th
                key={c.id}
                className="px-4 py-3 text-left font-medium text-white"
              >
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-t border-[var(--border)]">
              <td className="px-4 py-3 font-medium text-white">{row.feature}</td>
              {competitors.map((c) => {
                const cell = row.competitors.find((x) => x.competitorId === c.id);
                if (!cell) {
                  return (
                    <td key={c.id} className="px-4 py-3 text-[var(--muted)]">
                      —
                    </td>
                  );
                }
                return (
                  <td key={c.id} className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        onCellClick(
                          cell.evidenceIds,
                          `${row.feature} · ${nameById[c.id] ?? c.id}`,
                        )
                      }
                      className="text-left"
                    >
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[cell.status]}`}
                      >
                        {STATUS_ZH[cell.status] ?? cell.status}
                      </span>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {cell.note}
                      </p>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
