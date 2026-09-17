# Project

AI Competitive Intelligence / Competitor Analysis Workflow  
（AI 竞品分析工作流）

Evidence-first AI competitor analysis product (portfolio MVP).  
**Not** a ChatGPT-style “write me a competitor report” page.

**Default locale:** 简体中文（zh-CN）— UI + AI 用户可见输出。  
Evidence quote / title / URL 保留原文；summary 使用自然中文。  
对比标题格式：`{产品} 与 {竞品1}、{竞品2} 对比`（不用「vs」）。

---

# Product Goal

这是一个以证据为核心的 AI 竞品分析工作流，不是一次 LLM 写报告。

核心流程：

```text
User Input
→ Research Planner
→ Target Product Research
→ Competitor Research
→ Evidence Extraction
→ Facts
→ Product Profiles
→ Comparison
→ Feature Matrix
→ Insights
→ Opportunities
→ Recommendations
→ Report
```

用户通过表单输入自己的产品、竞品、分析目标与维度；系统分阶段产出结构化状态，最终进入分析报告（总览 / 竞品 / 功能矩阵 / AI 能力对比 / 定价 / 洞察 / 机会 / 建议 / 来源），并支持证据抽屉追溯来源。

---

# Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Zod (structured output validation)
- DeepSeek (OpenAI-compatible chat completions)
- Tavily (optional web search for Live Research)
- NDJSON streaming (`Accept: application/x-ndjson`) for workflow progress
- Lightweight zh-CN copy module（`zh-cn.ts`）— **不是**完整 i18n framework

Package name: `competitive-intelligence-agent`

---

# Research Modes

Resolved on the **server** (not a form toggle):

| Mode | When | UI badge |
|------|------|----------|
| **Demo / Sample Data** | `mode: "demo"` or no usable live path | `演示 / 示例数据` |
| **Limited Research** | Live requested but no `TAVILY_API_KEY` | `有限研究` |
| **Live Research** | Live + LLM key + `TAVILY_API_KEY` | `实时研究` |

UI also shows overall `evidenceQuality` as **来源覆盖度：高 / 中 / 低** (independent of workflow `status: complete`).

**Important:** Having an LLM API key alone must **not** be labeled as full Live Research.

---

# Current AI Architecture

## Providers

- **`LLMProvider`** (`OpenAICompatibleProvider` / `MockLLMProvider`)
  - DeepSeek or OpenAI-compatible base URL
  - `generate({ system, prompt, schema })` with Zod parse
- **`ResearchProvider`** (`DemoResearchProvider` / `HttpResearchProvider`)
  - `search(query)` / `fetch(url)`
  - Live search via Tavily when configured; otherwise limited/empty search

## Structured output

- All important nodes prefer Zod schemas
- JSON extraction supports optional ```json fences
- **Repair retry (max 1):** `safeParse` fail → repair prompt with validation errors → parse again → else `StructuredOutputError`

## Workflow state

- Unified `CompetitiveAnalysisState` streamed to the client via NDJSON progress events
- Includes: input, researchPlan, `productProfile`, competitors, evidence, facts, comparisons, featureMatrix, insights, opportunities, recommendations, executiveSummary, activities, researchMode, evidenceQuality, status

## Trust / consistency layer (`consistency.ts` + `evidence-helpers.ts`)

- Evidence helpers: unique source count by URL, source type labels, drawer formatting
- Source authority / quality ranking (official → documentation → pricing → review → article → manual)
- Confidence calibration by source quality (third-party-only cannot auto-High)
- Confidence propagation (Recommendation / Opportunity cannot exceed upstream support without independent evidence)
- Claim–evidence entailment: `supported` | `partially_supported` | `unsupported`
- Score abstention: insufficient evidence → `score: null`, UI shows “Insufficient evidence”
- Absence-of-evidence guardrail: search miss ≠ factual absence
- Canonical product URL picker (prefer official homepage, not third-party article URLs)

---

# Core Data Relationship

```text
Evidence
  → Fact.evidenceIds
    → Insight.supportingFactIds
      → Opportunity.evidence / Recommendation.evidenceIds + insightIds
```

### How UI resolves Evidence

1. **Insight**  
   `supportingFactIds` → Facts → union of `fact.evidenceIds` → Evidence objects  
   Helper: `getEvidenceForInsight()`

2. **Opportunity**  
   `opportunity.evidence` (evidence id list) → Evidence  
   Helper: `getEvidenceForOpportunity()`

3. **Recommendation**  
   Direct `evidenceIds` **plus** evidence reached via linked Insights → Facts → Evidence  
   Helper: `getEvidenceForRecommendation()`

4. **Comparison / Feature Matrix cells**  
   Row/cell `evidenceIds` → Evidence; if empty / insufficient → abstain from numeric score

**Rule:** Counts shown in UI must ultimately reflect **resolved** Evidence objects (not raw id array length when IDs fail to resolve). Remaining mismatches are listed under Current Remaining Issues.

---

# Current Completed Features

- Demo / Sample Data offline workflow (Notion vs Coda / ClickUp / Confluence scenario)
- Example Input prefills vs Demo Dataset runtime mode (separated)
- Start Analysis / Run example analysis / Try an example CTA hierarchy
- DeepSeek API integration (OpenAI-compatible)
- Tavily search integration (Live)
- Live / Limited / Demo research mode badges
- NDJSON streaming progress + compact completion summary
- Research Planner (structured)
- **Target Product research** (`productProfile`, role `product` — not a competitor)
- Per-competitor research (isolated)
- Evidence extraction → Facts (with entailment binding)
- Competitor + Product profiles
- Comparison engine + Feature Matrix
- AI Comparison / Pricing tabs
- Insights / Opportunities / Recommendations
- Overview decision hierarchy (Executive Summary → Top Insight → Threat/Opportunity → Next Move → Supporting Findings)
- Evidence Drawer (source type badges, confidence, URL, retrieved time)
- Source deduplication (same URL = 1 unique source)
- Unique source count UI: `X evidence items · Y unique sources`
- Source quality / authority preference in research & confidence
- Confidence calibration + propagation
- Score abstention when evidence insufficient
- Target product evidence required for target-product claims (architecture intent)
- Canonical product URL selection
- `evidenceQuality` on state / profiles
- Supporting Findings local fact counts (tightened; not global facts.length)
- Consistency regression tests (`npm run test:consistency`)
- Structured output repair retry

---

# Environment Variables

Record **names only** — never commit real keys.

```env
DEEPSEEK_API_KEY=
LLM_MODEL=
TAVILY_API_KEY=
```

Optional / related (may appear in code paths):

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=
```

**`.env.local` must not be committed to Git** (listed in `.gitignore`).  
Template: `.env.example`

---

# Current Validation

Already verified in this repo:

```bash
npm run lint
npm run build
npm run test:consistency
```

Scripts (see `package.json`):

- `dev` — Next.js Turbopack
- `build` / `start`
- `lint`
- `test:consistency` — `tsx src/lib/competitive-analysis/consistency.regression.ts`

---

# Latest Live Regression

**Target Product:** Linear  

**Competitors:** Jira, Asana  

**Research:** Live Research (DeepSeek + Tavily)

### Confirmed working

- Core Evidence → Fact → Insight → Opportunity → Recommendation → Report chain
- Target Product researched independently as `productProfile`
- Live sources via Tavily; structured nodes via DeepSeek
- Evidence Drawer, score abstention, confidence propagation, Source Coverage badge
- Supporting findings local counts; resolved-evidence UI counts
- Presentation cleanup (2026-09-16): narrative labels, entailment relevance, insight scope, recommendation hypothesis badge

### Prior live check (still valid)

**Target Product:** Figma · **Competitors:** Canva, Miro — core research + consistency path previously confirmed.

---

# Current Remaining Issues

> **MVP sealed for core product.** Do not redesign. Do not add features unless a new confirmed defect appears.

**Status (2026-09-16): presentation / evidence-relevance cleanup complete after Linear vs Jira / Asana Live spot-check.**  
Verified: `npm run lint` · `npm run build` · `npm run test:consistency`.

## Round 1 (2026-09-15) — consistency blockers — fixed

1. Raw internal IDs in user-visible text  
2. Evidence count must use resolved evidence  
3. Claim / evidence scope contradiction  
4. Absence-of-evidence wording  
5. AI Comparison evidence binding  
6. Report badge naming → `Source Coverage {level}`

## Round 2 (2026-09-16) — presentation / relevance — fixed

1. **Absence guardrail narrative** — per-claim sanitize; strip `Fact:` / `Inference:` / `Recommendation:`; never emit `We did not find sufficient evidence that Fact:…`  
2. **Claim–evidence relevance** — AI pricing/bundling claims reject generic product/integration blurbs; Insight drawer uses entailment-filtered evidence  
3. **Insight headline scope** — limited samples cannot stay as “default competitive norm / industry standard / everyone”  
4. **Recommendation hypothesis badge** — `needsValidation` when resolved evidence is empty; UI shows `假设 / 待验证` and `暂无关联证据`

## Round 3 (2026-09-16) — 简体中文本地化 — done

1. **AI 输出默认 zh-CN** — 全部 system/user prompts 增加语言指令；用户可见字段用简体中文  
2. **UI 中文化** — 表单、进度、报告 Tab、卡片、抽屉、徽章、状态文案  
3. **Evidence** — title / URL / quote 保留原文；summary 要求中文；抽屉显示「摘要：」  
4. **轻量文案模块** — `src/lib/competitive-analysis/zh-cn.ts`（非 i18n framework）  
5. **未改** schema / provider / workflow 架构 / entailment / confidence 规则逻辑  

## Round 4 (2026-09-16) — 中文文案一致性清洁 — done

1. 用户可见「vs」→「与 … 对比」（如 `Linear 与 Jira、Asana 对比`）  
2. Prompt 语言规则收紧：普通概念译中文（负责人 / 智能体 / 工作流 / AI 额度等）；官方产品名保留英文  
3. 避免「AI agent 能力」类混用，优先「AI 智能体能力」；洞察一核心一判断  
4. Evidence quote 仍不翻译；summary 自然中文  

Verified: `npm run lint` · `npm run build` · `npm run test:consistency`.

## Round 5 (2026-09-17) — Portfolio README & screenshot assets — done

1. 重写根目录 `README.md`（中文作品集叙事；去掉过时的 Load Demo Scenario 等文案）  
2. 创建 `docs/images/`（截图目录；含 `.gitkeep`；不造假图）  
3. README 引用：`research-brief` / `workflow-progress` / `overview` / `evidence-drawer` / `recommendations`  
4. Live Demo 使用 placeholder：`LIVE_DEMO_URL`  
5. **未改**任何 `src/` 业务代码  

---

# Next Task

**MVP 已 sealed；产品代码停止功能开发。**

作品集收尾可选：

1. 将真实截图放入 `docs/images/`（见 README 截图资产表）  
2. 部署完成后把 README 中的 `LIVE_DEMO_URL` 换成真实 URL  
3. 视需要同步更新 `.env.example` 文案（与 DeepSeek / Tavily 一致）  

Do **not** redesign architecture or add features by default.

---

# Important Product Principles

1. Evidence first  
2. Fact ≠ Insight ≠ Recommendation  
3. Never present assumptions as facts  
4. Abstain when evidence is insufficient（展示为「证据不足」）  
5. Do not expose chain-of-thought / hidden model reasoning — only safe workflow activity  
6. Do not infer target product lacks X merely because a competitor has X  
7. Absence of evidence ≠ evidence of absence  
8. Source authority ≠ claim relevance (official source can still be off-topic)  
9. User-visible content must never show internal IDs or structure labels (`Fact:`, `Inference:`, …)  
10. Recommendations must be traceable to Evidence; otherwise mark `假设 / 待验证`  
11. Limited competitor samples must not be phrased as market-wide norms  
12. Default user-facing language is Simplified Chinese; keep product/feature proper names; keep evidence quotes in source language  

---

# Do Not Change

- Do **not** massively refactor the architecture  
- Do **not** switch tech stack  
- Do **not** add new AI providers  
- Do **not** add a database  
- Do **not** add auth / login  
- Do **not** add PDF export  
- Do **not** add a multi-agent framework for buzzword reasons  
- Do **not** change overall dark UI visual style  
- Do **not** break Demo / Limited / Live Research modes  
- Do **not** break the stable Evidence → Fact → Insight → Recommendation relationship  
- Do **not** introduce a full i18n framework unless explicitly requested  
- Do **not** modify DeepSeek / Tavily providers, NDJSON streaming, Target Product research, score abstain, confidence propagation, source dedup, source authority, canonical URL, or Evidence Drawer structure unless fixing a confirmed regression  

**Current phase:** MVP sealed + zh-CN default — maintain only.

---

# Important Files

Verified paths in this repository:

### Workflow & domain

| Area | Path |
|------|------|
| Workflow orchestrator | `src/lib/competitive-analysis/workflow.ts` |
| Types / Zod state schemas | `src/lib/competitive-analysis/types.ts` |
| LLM output schemas | `src/lib/competitive-analysis/schemas.ts` |
| Consistency / trust helpers | `src/lib/competitive-analysis/consistency.ts` |
| Evidence UI helpers | `src/lib/competitive-analysis/evidence-helpers.ts` |
| zh-CN presentation copy | `src/lib/competitive-analysis/zh-cn.ts` |
| Workflow state helpers | `src/lib/competitive-analysis/nodes/state.ts` |
| Research Planner | `src/lib/competitive-analysis/nodes/research-planner.ts` |
| Competitor / Target Product research | `src/lib/competitive-analysis/nodes/competitor-research.ts` |
| Evidence → Facts extractor | `src/lib/competitive-analysis/nodes/evidence-extractor.ts` |
| Comparison engine | `src/lib/competitive-analysis/nodes/comparison.ts` |
| Insight generator | `src/lib/competitive-analysis/nodes/insight-generator.ts` |
| Opportunity generator | `src/lib/competitive-analysis/nodes/opportunity-generator.ts` |
| Recommendation generator | `src/lib/competitive-analysis/nodes/recommendation-generator.ts` |
| Prompts | `src/lib/competitive-analysis/prompts/index.ts` |
| LLM provider | `src/lib/competitive-analysis/providers/llm-provider.ts` |
| Research provider | `src/lib/competitive-analysis/providers/research-provider.ts` |
| Provider factory | `src/lib/competitive-analysis/providers/index.ts` |

### API & app shell

| Area | Path |
|------|------|
| Analysis API (NDJSON) | `src/app/api/competitive-analysis/route.ts` |
| Home page | `src/app/page.tsx` |
| Root layout | `src/app/layout.tsx` |

### UI

| Area | Path |
|------|------|
| App shell / streaming client | `src/components/competitive-analysis/CompetitiveAnalysisApp.tsx` |
| Analysis form | `src/components/competitive-analysis/AnalysisForm.tsx` |
| Workflow progress | `src/components/competitive-analysis/WorkflowProgress.tsx` |
| Report workspace | `src/components/competitive-analysis/ReportWorkspace.tsx` |
| Overview panel | `src/components/competitive-analysis/OverviewPanel.tsx` |
| Evidence Drawer | `src/components/competitive-analysis/EvidenceDrawer.tsx` |
| Recommendation UI | `src/components/competitive-analysis/RecommendationCard.tsx` |
| Insight cards | `src/components/competitive-analysis/InsightCard.tsx` |
| Opportunity cards | `src/components/competitive-analysis/OpportunityCard.tsx` |
| Competitor / product cards | `src/components/competitive-analysis/CompetitorCard.tsx` |
| Feature Matrix | `src/components/competitive-analysis/FeatureMatrix.tsx` |

### Data & tests

| Area | Path |
|------|------|
| Demo dataset | `src/data/competitive-analysis/demo.ts` |
| Demo research catalog | `src/data/competitive-analysis/demo-catalog.ts` |
| Consistency regression tests | `src/lib/competitive-analysis/consistency.regression.ts` |
| Env template | `.env.example` |
| README（作品集） | `README.md` |
| Portfolio screenshots | `docs/images/` |

---

# Handoff Instruction

新的 Cursor Chat 应：

1. **先阅读本文件** `PROJECT_CONTEXT.md`  
2. **再阅读当前 repository**（优先 Important Files）  
3. 先理解现有架构与已完成能力  
4. **不要重新设计项目，不要从零开始，不要默认加功能 / 完整 i18n**  
5. MVP 已封版 — 产品代码仅在确认缺陷时最小修复；作品集侧补截图与 Live Demo URL  

当前阶段：**MVP sealed + zh-CN + Portfolio README ready**（等待 `docs/images/` 截图与 `LIVE_DEMO_URL`）。
