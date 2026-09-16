/**
 * Lightweight zh-CN presentation copy.
 * Not a full i18n framework — default locale for this MVP only.
 */

export const INSUFFICIENT_EVIDENCE = "证据不足";
export const NO_LINKED_EVIDENCE = "暂无关联证据";
export const NEEDS_VALIDATION = "假设 / 待验证";

/** User-facing comparison title: 「Linear 与 Jira、Asana 对比」 */
export function formatComparisonTitle(
  product: string,
  competitors: string[],
): string {
  const names = competitors.map((c) => c.trim()).filter(Boolean);
  if (names.length === 0) return `${product.trim()} 对比`;
  return `${product.trim()} 与 ${names.join("、")} 对比`;
}

export const QUALITY_LABEL: Record<"high" | "medium" | "low", string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export function sourceCoverageLabel(
  quality: "high" | "medium" | "low",
): string {
  return `来源覆盖度：${QUALITY_LABEL[quality]}`;
}

export function researchModeLabel(
  mode: "demo" | "live" | "limited",
): string {
  switch (mode) {
    case "live":
      return "实时研究";
    case "limited":
      return "有限研究";
    default:
      return "演示 / 示例数据";
  }
}

export const SOURCE_TYPE_ZH: Record<string, string> = {
  official: "官方",
  pricing: "定价",
  documentation: "文档",
  review: "评测",
  article: "文章",
  manual: "人工输入",
};

export const STATUS_ZH: Record<string, string> = {
  strong: "强",
  medium: "中",
  weak: "弱",
  unknown: "未知",
  complete: "已完成",
  partial: "部分完成",
  pending: "进行中",
  error: "出错",
  researching: "研究中",
};

export const DIMENSION_LABEL_ZH: Record<string, string> = {
  positioning: "产品定位",
  target_users: "目标用户",
  core_features: "核心功能",
  ai_capabilities: "AI 能力",
  pricing: "定价",
  ux_workflow: "体验 / 工作流",
  integrations: "集成",
  user_reviews: "用户评价",
  strengths: "优势",
  weaknesses: "劣势",
  differentiation: "差异化",
  opportunities: "机会",
};
