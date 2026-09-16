import { z } from "zod";

/** Shared analysis dimensions */
export const ANALYSIS_DIMENSIONS = [
  "positioning",
  "target_users",
  "core_features",
  "ai_capabilities",
  "pricing",
  "ux_workflow",
  "integrations",
  "user_reviews",
  "strengths",
  "weaknesses",
  "differentiation",
  "opportunities",
] as const;

export type AnalysisDimension = (typeof ANALYSIS_DIMENSIONS)[number];

export const SourceTypeSchema = z.enum([
  "official",
  "pricing",
  "documentation",
  "review",
  "article",
  "manual",
]);

export type SourceType = z.infer<typeof SourceTypeSchema>;

export const ConfidenceLabelSchema = z.enum(["high", "medium", "low"]);
export type ConfidenceLabel = z.infer<typeof ConfidenceLabelSchema>;

export const EvidenceSchema = z.object({
  id: z.string(),
  competitorId: z.string(),
  title: z.string(),
  url: z.string().optional(),
  sourceType: SourceTypeSchema,
  quote: z.string().optional(),
  summary: z.string(),
  retrievedAt: z.string().optional(),
  confidence: ConfidenceLabelSchema,
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export const FeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  evidenceIds: z.array(z.string()).default([]),
});

export type Feature = z.infer<typeof FeatureSchema>;

export const CapabilitySchema = z.object({
  name: z.string(),
  description: z.string(),
  maturity: z.enum(["strong", "medium", "weak", "unknown"]).default("unknown"),
  evidenceIds: z.array(z.string()).default([]),
});

export type Capability = z.infer<typeof CapabilitySchema>;

export const PricingPlanSchema = z.object({
  name: z.string(),
  price: z.string(),
  billing: z.string().optional(),
  notes: z.string().optional(),
  evidenceIds: z.array(z.string()).default([]),
});

export type PricingPlan = z.infer<typeof PricingPlanSchema>;

export const InsightItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  evidenceIds: z.array(z.string()).default([]),
});

export type InsightItem = z.infer<typeof InsightItemSchema>;

export const CompetitorStatusSchema = z.enum([
  "pending",
  "researching",
  "complete",
  "partial",
  "error",
]);

export type CompetitorStatus = z.infer<typeof CompetitorStatusSchema>;

export const CompetitorProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().optional(),
  /** Target product is researched as a profile but is not a competitor. */
  role: z.enum(["product", "competitor"]).default("competitor"),
  status: CompetitorStatusSchema.default("pending"),
  positioning: z.string(),
  targetUsers: z.array(z.string()),
  coreFeatures: z.array(FeatureSchema),
  aiCapabilities: z.array(CapabilitySchema),
  pricing: z.array(PricingPlanSchema).optional(),
  integrations: z.array(z.string()),
  strengths: z.array(InsightItemSchema),
  weaknesses: z.array(InsightItemSchema),
  userFeedback: z.array(z.string()).default([]),
  evidenceIds: z.array(z.string()),
  /** Research may complete while evidence depth is still thin. */
  evidenceQuality: z.enum(["high", "medium", "low"]).optional(),
  errorMessage: z.string().optional(),
});

export type CompetitorProfile = z.infer<typeof CompetitorProfileSchema>;

export const FactSchema = z.object({
  id: z.string(),
  competitorId: z.string(),
  dimension: z.string(),
  claim: z.string(),
  evidenceIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type Fact = z.infer<typeof FactSchema>;

export const ComparisonCompetitorSchema = z.object({
  competitorId: z.string(),
  /** null when evidence is insufficient — never show a numeric score without evidence. */
  score: z.number().min(0).max(5).nullable().optional(),
  summary: z.string(),
  evidenceIds: z.array(z.string()),
});

export const ComparisonDimensionSchema = z.object({
  dimension: z.string(),
  competitors: z.array(ComparisonCompetitorSchema),
});

export type ComparisonDimension = z.infer<typeof ComparisonDimensionSchema>;

export const FeatureMatrixCellSchema = z.object({
  competitorId: z.string(),
  status: z.enum(["strong", "medium", "weak", "unknown"]),
  note: z.string(),
  evidenceIds: z.array(z.string()),
});

export const FeatureMatrixRowSchema = z.object({
  feature: z.string(),
  competitors: z.array(FeatureMatrixCellSchema),
});

export type FeatureMatrixRow = z.infer<typeof FeatureMatrixRowSchema>;

export const InsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  supportingFactIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type Insight = z.infer<typeof InsightSchema>;

export const OpportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  problem: z.string(),
  evidence: z.array(z.string()),
  competitorsAffected: z.array(z.string()),
  userValue: z.string(),
  strategicValue: z.string(),
  confidence: z.number().min(0).max(1),
  impact: z.number().min(1).max(5).optional(),
});

export type Opportunity = z.infer<typeof OpportunitySchema>;

export const ProductRecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  impact: z.number().min(1).max(5),
  effort: z.number().min(1).max(5),
  confidence: z.number().min(1).max(5),
  reasoning: z.string(),
  evidenceIds: z.array(z.string()),
  insightIds: z.array(z.string()),
  /** True when recommendation is strategic hypothesis without resolved evidence. */
  needsValidation: z.boolean().optional(),
});

export type ProductRecommendation = z.infer<typeof ProductRecommendationSchema>;

export const ResearchPlanSchema = z.object({
  researchQuestions: z.array(z.string()),
  dimensions: z.array(z.string()),
  competitorTasks: z.array(
    z.object({
      competitor: z.string(),
      focus: z.array(z.string()),
    }),
  ),
  priority: z.array(z.string()),
  assumptions: z.array(z.string()),
});

export type ResearchPlan = z.infer<typeof ResearchPlanSchema>;

export const AnalysisInputSchema = z.object({
  product: z.string().min(1),
  productUrl: z.string().optional(),
  competitors: z.array(z.string().min(1)).min(1),
  competitorUrls: z.record(z.string(), z.string()).optional(),
  goal: z.string().min(1),
  audience: z.string().optional(),
  market: z.string().optional(),
  dimensions: z.array(z.string()).min(1),
  /** Omit or leave unset to let the API auto-resolve live vs sample dataset. */
  mode: z.enum(["demo", "live"]).optional(),
});

export type AnalysisInput = z.infer<typeof AnalysisInputSchema>;

export const WorkflowStatusSchema = z.enum([
  "planning",
  "researching",
  "analyzing",
  "generating_insights",
  "complete",
  "error",
]);

export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const ExecutiveSummarySchema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  biggestThreat: z.string(),
  biggestOpportunity: z.string(),
  competitiveAdvantage: z.string(),
  recommendedNextMove: z.string(),
});

export type ExecutiveSummary = z.infer<typeof ExecutiveSummarySchema>;

export const WorkflowActivitySchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["pending", "active", "done", "error"]),
  detail: z.string().optional(),
  at: z.string(),
});

export type WorkflowActivity = z.infer<typeof WorkflowActivitySchema>;

export const CompetitiveAnalysisStateSchema = z.object({
  id: z.string(),
  input: AnalysisInputSchema,
  researchPlan: ResearchPlanSchema.optional(),
  /** Researched profile for input.product — not a competitor. */
  productProfile: CompetitorProfileSchema.optional(),
  competitors: z.array(CompetitorProfileSchema),
  evidence: z.array(EvidenceSchema),
  facts: z.array(FactSchema),
  comparisons: z.array(ComparisonDimensionSchema),
  featureMatrix: z.array(FeatureMatrixRowSchema),
  insights: z.array(InsightSchema),
  opportunities: z.array(OpportunitySchema),
  recommendations: z.array(ProductRecommendationSchema),
  executiveSummary: ExecutiveSummarySchema.optional(),
  activities: z.array(WorkflowActivitySchema).default([]),
  isDemo: z.boolean().default(false),
  /** UI badge: demo sample data, full live retrieval, or LLM-only / incomplete web research */
  researchMode: z.enum(["demo", "live", "limited"]).optional(),
  /** Overall evidence depth — independent of workflow completion status. */
  evidenceQuality: z.enum(["high", "medium", "low"]).optional(),
  status: WorkflowStatusSchema,
  currentStep: z.string().optional(),
  errors: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CompetitiveAnalysisState = z.infer<
  typeof CompetitiveAnalysisStateSchema
>;

export type ProgressEvent = {
  type: "progress" | "complete" | "error";
  state: CompetitiveAnalysisState;
  message?: string;
};
