import { z } from "zod";
import {
  ComparisonDimensionSchema,
  FeatureMatrixRowSchema,
  InsightSchema,
  OpportunitySchema,
  ProductRecommendationSchema,
  ResearchPlanSchema,
  ExecutiveSummarySchema,
  CapabilitySchema,
  FeatureSchema,
  PricingPlanSchema,
  InsightItemSchema,
} from "./types";

/** Schemas used for structured LLM generation (without pre-assigned IDs). */

export const ResearchPlanOutputSchema = ResearchPlanSchema;

export const CompetitorResearchOutputSchema = z.object({
  company: z.string(),
  positioning: z.string(),
  targetUsers: z.array(z.string()),
  features: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
  aiCapabilities: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      maturity: z.enum(["strong", "medium", "weak", "unknown"]),
    }),
  ),
  pricing: z.array(
    z.object({
      name: z.string(),
      price: z.string(),
      billing: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  integrations: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  userFeedback: z.array(z.string()),
  evidenceNotes: z.array(
    z.object({
      title: z.string(),
      url: z.string().optional(),
      sourceType: z.enum([
        "official",
        "pricing",
        "documentation",
        "review",
        "article",
        "manual",
      ]),
      quote: z.string().optional(),
      summary: z.string(),
      confidence: z.enum(["high", "medium", "low"]),
    }),
  ),
});

export type CompetitorResearchOutput = z.infer<
  typeof CompetitorResearchOutputSchema
>;

export const FactExtractionOutputSchema = z.object({
  facts: z.array(
    z.object({
      dimension: z.string(),
      claim: z.string(),
      evidenceIndexes: z.array(z.number()),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

export const ComparisonOutputSchema = z.object({
  comparisons: z.array(ComparisonDimensionSchema.omit({}).passthrough()).or(
    z.array(
      z.object({
        dimension: z.string(),
        competitors: z.array(
          z.object({
            competitorId: z.string(),
            score: z.number().min(0).max(5).nullable().optional(),
            summary: z.string(),
            evidenceIds: z.array(z.string()),
          }),
        ),
      }),
    ),
  ),
  featureMatrix: z.array(
    z.object({
      feature: z.string(),
      competitors: z.array(
        z.object({
          competitorId: z.string(),
          status: z.enum(["strong", "medium", "weak", "unknown"]),
          note: z.string(),
          evidenceIds: z.array(z.string()),
        }),
      ),
    }),
  ),
});

export const InsightsOutputSchema = z.object({
  insights: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      supportingFactIds: z.array(z.string()),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

export const OpportunitiesOutputSchema = z.object({
  opportunities: z.array(
    z.object({
      title: z.string(),
      problem: z.string(),
      evidence: z.array(z.string()),
      competitorsAffected: z.array(z.string()),
      userValue: z.string(),
      strategicValue: z.string(),
      confidence: z.number().min(0).max(1),
      impact: z.number().min(1).max(5).optional(),
    }),
  ),
});

export const RecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      impact: z.number().min(1).max(5),
      effort: z.number().min(1).max(5),
      confidence: z.number().min(1).max(5),
      reasoning: z.string(),
      evidenceIds: z.array(z.string()),
      insightIds: z.array(z.string()),
    }),
  ),
  executiveSummary: ExecutiveSummarySchema,
});

export {
  ResearchPlanSchema,
  InsightSchema,
  OpportunitySchema,
  ProductRecommendationSchema,
  FeatureMatrixRowSchema,
  ComparisonDimensionSchema,
  CapabilitySchema,
  FeatureSchema,
  PricingPlanSchema,
  InsightItemSchema,
};
