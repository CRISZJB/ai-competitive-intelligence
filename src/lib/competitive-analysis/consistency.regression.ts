/**
 * Deterministic regression checks for evidence reasoning consistency.
 * Run: npx --yes tsx src/lib/competitive-analysis/consistency.regression.ts
 */
import assert from "node:assert/strict";
import {
  alignClaimWithEvidenceScope,
  assessClaimEvidenceEntailment,
  bindComparisonEvidence,
  countSupportingFactsForFinding,
  filterEvidenceByEntailment,
  isAbsenceClaim,
  pickCanonicalProductUrl,
  propagateRecommendationConfidence,
  resolveComparisonScore,
  resolveEvidenceByIds,
  rewriteAbsenceClaim,
  sanitizeComparisons,
  sanitizeExecutiveSummary,
  sanitizeInsightConfidence,
  sanitizeNarrativeText,
  scopeLimitInsightClaim,
  stripInternalIds,
} from "./consistency";
import { sourceCoverageBadgeLabel } from "./evidence-helpers";
import { INSUFFICIENT_EVIDENCE, NEEDS_VALIDATION, formatComparisonTitle } from "./zh-cn";
import type {
  CompetitorProfile,
  Evidence,
  Fact,
  Insight,
  ProductRecommendation,
} from "./types";

function run() {
  // 1) Entailment: pricing claim vs security evidence → unsupported
  const claim = "Canva bundles AI into subscription tiers";
  const securityEv: Evidence = {
    id: "ev-sec",
    competitorId: "canva",
    title: "Canva Shield enterprise privacy",
    summary: "Enterprise security, privacy controls and compliance for Canva Shield.",
    quote: "Protect your brand with Canva Shield",
    sourceType: "official",
    confidence: "high",
    url: "https://www.canva.com/shield",
  };
  const pricingEv: Evidence = {
    id: "ev-price",
    competitorId: "canva",
    title: "Canva AI pricing",
    summary: "Canva includes Magic Studio AI features in Pro and Teams subscription tiers.",
    sourceType: "pricing",
    confidence: "high",
    url: "https://www.canva.com/pricing",
  };
  assert.equal(
    assessClaimEvidenceEntailment(claim, securityEv),
    "unsupported",
  );
  assert.notEqual(
    assessClaimEvidenceEntailment(claim, pricingEv),
    "unsupported",
  );
  const filtered = filterEvidenceByEntailment(
    claim,
    [securityEv.id, pricingEv.id],
    [securityEv, pricingEv],
  );
  assert.ok(!filtered.supportedIds.includes(securityEv.id));
  assert.ok(filtered.supportedIds.includes(pricingEv.id));

  // 2) Score abstain
  assert.equal(
    resolveComparisonScore(4, [], INSUFFICIENT_EVIDENCE),
    null,
  );
  assert.equal(resolveComparisonScore(4, ["ev-1"], "Strong AI"), 4);
  const sanitized = sanitizeComparisons([
    {
      dimension: "AI Capabilities",
      competitors: [
        {
          competitorId: "canva",
          score: 4,
          summary: INSUFFICIENT_EVIDENCE,
          evidenceIds: [],
        },
      ],
    },
  ]);
  assert.equal(sanitized[0].competitors[0].score, null);

  // 3) Confidence propagation — Medium insight cannot yield High rec
  const insights: Insight[] = [
    {
      id: "ins-m",
      title: "AI bundling",
      description: "AI is packaged in paid tiers",
      supportingFactIds: ["f1"],
      confidence: 0.65,
    },
  ];
  const recs: ProductRecommendation[] = [
    {
      id: "r1",
      title: "Match AI bundling",
      description: "Ship AI in plan tiers",
      impact: 5,
      effort: 3,
      confidence: 5,
      reasoning:
        "Because: competitors bundle AI. We infer: table stakes. Therefore: ship bundling. evidence 11111111-1111-4111-8111-111111111111",
      evidenceIds: [],
      insightIds: ["ins-m"],
    },
  ];
  const propagated = propagateRecommendationConfidence(recs, insights, []);
  assert.ok(propagated[0].confidence <= 4);
  assert.ok(!UUID_LIKE(propagated[0].reasoning));

  // 4) Absence claims
  assert.ok(isAbsenceClaim("Neither Canva nor Miro offers native design systems sync"));
  const rewritten = rewriteAbsenceClaim(
    "Neither Canva nor Miro offers native design systems sync",
  );
  assert.match(rewritten, /未找到足够证据|待验证|did not find sufficient evidence|Needs validation/i);
  assert.ok(isAbsenceClaim("Figma lacks offline collaboration"));
  assert.match(
    rewriteAbsenceClaim("Figma lacks offline collaboration"),
    /未找到足够证据|did not find sufficient evidence/i,
  );

  // 5) Canonical URL prefers official homepage over third-party article
  const url = pickCanonicalProductUrl({
    name: "Canva",
    evidence: [
      {
        id: "a",
        competitorId: "canva",
        title: "Third party pricing",
        summary: "Pricing comparison",
        sourceType: "article",
        confidence: "medium",
        url: "https://www.g2.com/products/canva/pricing",
      },
      {
        id: "b",
        competitorId: "canva",
        title: "Canva home",
        summary: "Official Canva product",
        sourceType: "official",
        confidence: "high",
        url: "https://www.canva.com/",
      },
    ],
  });
  assert.ok(url?.includes("canva.com"));
  assert.ok(!url?.includes("g2.com"));

  // 6) Supporting findings counts are local, not global
  const facts: Fact[] = Array.from({ length: 38 }, (_, i) => ({
    id: `f-${i}`,
    competitorId: i % 2 === 0 ? "canva" : "miro",
    dimension: "core_features",
    claim:
      i < 3
        ? "Canva bundles AI into Pro subscription pricing tiers"
        : `Miro whiteboard collaboration feature number ${i}`,
    evidenceIds: [],
    confidence: 0.7,
  }));
  const count = countSupportingFactsForFinding(
    "Canva AI subscription bundling",
    facts,
  );
  assert.ok(count < 10, `expected local count, got ${count}`);
  assert.ok(count >= 1);

  // 7) stripInternalIds — UUIDs and internal id phrases
  assert.equal(
    stripInternalIds("see aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee now").includes(
      "aaaaaaaa",
    ),
    false,
  );
  assert.ok(
    !stripInternalIds(
      "See evidenceIds: [11111111-1111-4111-8111-111111111111] and factId xyz",
    ).includes("11111111"),
  );
  assert.ok(
    !UUID_LIKE(
      sanitizeNarrativeText(
        "Insight about ev-abcde-1234 and 22222222-2222-4222-8222-222222222222",
      ),
    ),
  );

  // 8) Evidence count uses resolved ids only
  const catalog: Evidence[] = [pricingEv];
  assert.equal(
    resolveEvidenceByIds(["ev-price", "ev-missing", "ev-price"], catalog)
      .length,
    1,
  );
  const staleComparison = sanitizeComparisons(
    [
      {
        dimension: "AI Capabilities",
        competitors: [
          {
            competitorId: "canva",
            score: 4,
            summary: "Strong AI",
            evidenceIds: ["ev-missing", "ghost-id"],
          },
        ],
      },
    ],
    catalog,
  );
  assert.equal(staleComparison[0].competitors[0].evidenceIds.length, 0);
  assert.equal(staleComparison[0].competitors[0].score, null);
  assert.equal(
    staleComparison[0].competitors[0].summary,
    INSUFFICIENT_EVIDENCE,
  );

  // 9) Claim scope vs evidence scope
  const officialHelp: Evidence = {
    id: "ev-help",
    competitorId: "figma",
    title: "Figma Help Center",
    summary: "Official Figma help and pricing documentation.",
    sourceType: "official",
    confidence: "high",
    url: "https://help.figma.com/",
  };
  const overbroad =
    "Figma's AI feature set lacks official evidence across the product";
  const aligned = alignClaimWithEvidenceScope(overbroad, [officialHelp]);
  assert.match(aligned, /充分官方证据|specifically|did not find sufficient official evidence/i);
  assert.ok(!/lacks official evidence across the product/i.test(aligned));

  // 10) AI Comparison evidence binding from profile
  const profile: CompetitorProfile = {
    id: "figma",
    name: "Figma",
    role: "product",
    positioning: "Design collaboration",
    targetUsers: ["Designers"],
    coreFeatures: [],
    aiCapabilities: [
      {
        name: "AI image generation",
        description: "Generate images in designs",
        maturity: "medium",
        evidenceIds: ["ev-ai"],
      },
    ],
    pricing: [],
    integrations: [],
    strengths: [],
    weaknesses: [],
    userFeedback: [],
    evidenceIds: ["ev-ai"],
    status: "complete",
  };
  const aiEv: Evidence = {
    id: "ev-ai",
    competitorId: "figma",
    title: "Figma AI features",
    summary: "Figma AI image generation and design assist capabilities.",
    sourceType: "documentation",
    confidence: "high",
    url: "https://www.figma.com/ai",
  };
  const bound = bindComparisonEvidence(
    [
      {
        dimension: "AI Capabilities",
        competitors: [
          {
            competitorId: "figma",
            score: 3,
            summary: "Figma AI image generation assist",
            evidenceIds: [],
          },
        ],
      },
    ],
    [profile],
    [aiEv],
  );
  assert.ok(bound[0].competitors[0].evidenceIds.includes("ev-ai"));
  const boundSanitized = sanitizeComparisons(bound, [aiEv]);
  assert.notEqual(boundSanitized[0].competitors[0].score, null);

  // 11) Insight narrative sanitization strips IDs + absence rewrite
  const insightFacts: Fact[] = [
    {
      id: "f-ai",
      competitorId: "figma",
      dimension: "ai_capabilities",
      claim: "Figma documents AI image generation assist capabilities",
      evidenceIds: ["ev-ai"],
      confidence: 0.8,
    },
  ];
  const dirtyInsights: Insight[] = [
    {
      id: "ins-dirty",
      title: "AI gap 33333333-3333-4333-8333-333333333333",
      description:
        "Figma lacks AI workflow automation. See evidenceIds: [ev-ai]",
      supportingFactIds: ["f-ai"],
      confidence: 0.7,
    },
  ];
  const cleanedInsights = sanitizeInsightConfidence(
    dirtyInsights,
    insightFacts,
    [aiEv],
  );
  assert.ok(!UUID_LIKE(cleanedInsights[0].title));
  assert.ok(!/evidenceIds/i.test(cleanedInsights[0].description));
  assert.match(
    cleanedInsights[0].description,
    /未找到足够证据|Hypothesis|待验证/i,
  );

  // 12) Executive summary sanitization
  const exec = sanitizeExecutiveSummary({
    summary: "See fact 44444444-4444-4444-8444-444444444444 for details",
    keyFindings: ["Canva does not offer native X"],
    biggestThreat: "Parity",
    biggestOpportunity: "Gap",
    competitiveAdvantage: "Focus",
    recommendedNextMove: "Ship",
  });
  assert.ok(!UUID_LIKE(exec.summary));
  assert.match(exec.keyFindings[0], /未找到足够证据|did not find sufficient evidence/i);

  // 13) Source coverage badge naming
  assert.equal(sourceCoverageBadgeLabel("high"), "来源覆盖度：高");
  assert.ok(!/evidence high/i.test(sourceCoverageBadgeLabel("high")));

  // A) Absence guardrail must not wrap structure labels into "that Fact: ..."
  const labeledNarrative =
    "Fact: Jira includes AI in paid plans. Inference: packaging is converging. Recommendation: differentiate on workflow depth.";
  const cleanedNarrative = sanitizeNarrativeText(labeledNarrative);
  assert.ok(!/Fact\s*:/i.test(cleanedNarrative));
  assert.ok(!/Inference\s*:/i.test(cleanedNarrative));
  assert.ok(!/Recommendation\s*:/i.test(cleanedNarrative));
  assert.ok(
    !/未找到足够证据表明Fact:|did not find sufficient evidence that Fact:/i.test(
      cleanedNarrative,
    ),
  );
  assert.match(cleanedNarrative, /Jira includes AI/i);

  // B) AI pricing claim + generic product description → unsupported
  const aiBundlingClaim =
    "AI bundling into paid tiers is becoming common for issue trackers";
  const genericLinearEv: Evidence = {
    id: "ev-make",
    competitorId: "linear",
    title: "Make.com Linear Integration",
    summary:
      "Linear is a project management tool for tracking issues and collaborating with your team.",
    sourceType: "article",
    confidence: "medium",
    url: "https://www.make.com/en/integrations/linear",
  };
  assert.equal(
    assessClaimEvidenceEntailment(aiBundlingClaim, genericLinearEv),
    "unsupported",
  );
  const aiPricingEv: Evidence = {
    id: "ev-jira-ai-price",
    competitorId: "jira",
    title: "Jira Cloud pricing — AI features",
    summary:
      "Atlassian bundles Rovo AI capabilities into paid Jira Cloud subscription tiers with credit limits.",
    sourceType: "pricing",
    confidence: "high",
    url: "https://www.atlassian.com/software/jira/pricing",
  };
  assert.notEqual(
    assessClaimEvidenceEntailment(aiBundlingClaim, aiPricingEv),
    "unsupported",
  );

  // C) Two-competitor evidence must not stay as market-default phrasing
  const scoped = scopeLimitInsightClaim(
    "AI bundling into paid tiers is becoming the default competitive norm",
    ["Jira", "Asana"],
    0.65,
  );
  assert.ok(!/default competitive norm/i.test(scoped));
  assert.match(scoped, /Jira|Asana|竞品|among/i);

  // D) recommendation with zero resolved evidence → needsValidation
  const bareRecs = propagateRecommendationConfidence(
    [
      {
        id: "r-bare",
        title: "Differentiate on AI packaging clarity",
        description: "Publish transparent AI tier packaging",
        impact: 4,
        effort: 3,
        confidence: 4,
        reasoning:
          "Because: competitors bundle AI. We infer: buyers expect clarity. Therefore: publish packaging.",
        evidenceIds: ["ghost-ev"],
        insightIds: [],
      },
    ],
    [],
    [],
  );
  assert.equal(bareRecs[0].evidenceIds.length, 0);
  assert.equal(bareRecs[0].needsValidation, true);
  assert.ok(NEEDS_VALIDATION.includes("待验证"));

  // E) Comparison title uses Chinese「与…对比」, not「vs」
  assert.equal(
    formatComparisonTitle("Linear", ["Jira", "Asana"]),
    "Linear 与 Jira、Asana 对比",
  );
  assert.ok(!formatComparisonTitle("Linear", ["Jira"]).includes(" vs "));

  console.log("consistency.regression: all checks passed");
}

function UUID_LIKE(text: string): boolean {
  return /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(
    text,
  );
}

run();
