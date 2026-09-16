import type {
  AnalysisInput,
  CompetitorProfile,
  Evidence,
  Fact,
  ComparisonDimension,
  FeatureMatrixRow,
  Insight,
  Opportunity,
  ProductRecommendation,
  ResearchPlan,
  ExecutiveSummary,
} from "@/lib/competitive-analysis/types";

export const DEMO_INPUT: AnalysisInput = {
  product: "Notion",
  productUrl: "https://www.notion.so",
  competitors: ["Coda", "ClickUp", "Confluence"],
  competitorUrls: {
    Coda: "https://coda.io",
    ClickUp: "https://clickup.com",
    Confluence: "https://www.atlassian.com/software/confluence",
  },
  goal: "了解 AI 功能如何影响知识管理 SaaS 的竞争格局，并找出 Notion 下一步值得加强的产品机会。",
  audience: "知识工作者、产品与运营团队、中型协作团队",
  market: "全球 / 知识工作与协作 SaaS",
  dimensions: [
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
  ],
  mode: "demo",
};

export const DEMO_RESEARCH_PLAN: ResearchPlan = {
  researchQuestions: [
    "各竞品如何将 AI 嵌入核心工作流，而不是作为独立写作助手？",
    "定价结构如何影响团队从文档工具升级到工作流平台？",
    "用户在跨会议、文档、任务之间迁移信息时的主要痛点是什么？",
    "哪些能力已成行业标配（feature parity），哪些仍是差异化机会？",
    "Notion 在数据库灵活性与 AI 自动化之间的空白在哪里？",
  ],
  dimensions: DEMO_INPUT.dimensions,
  competitorTasks: [
    {
      competitor: "Coda",
      focus: ["doc+app platform", "AI packs", "automation", "pricing"],
    },
    {
      competitor: "ClickUp",
      focus: ["all-in-one work OS", "AI Brain", "task automation", "UX density"],
    },
    {
      competitor: "Confluence",
      focus: ["enterprise knowledge", "Atlassian Intelligence", "Jira integration"],
    },
  ],
  priority: [
    "AI capability depth",
    "Workflow automation across tools",
    "Pricing transparency and upgrade friction",
    "User-reported workflow breakpoints",
  ],
  assumptions: [
    "公开官网、定价页与文档可作为主要证据来源",
    "第三方评测反映常见用户体验，但不代表全部客户",
    "本 Demo 使用样本数据，非实时抓取",
  ],
};

const retrievedAt = "2026-03-01T00:00:00.000Z";

export const DEMO_EVIDENCE: Evidence[] = [
  {
    id: "ev-coda-1",
    competitorId: "coda",
    title: "Coda product positioning",
    url: "https://coda.io",
    sourceType: "official",
    quote:
      "Coda brings docs, spreadsheets, and apps together so teams can build tools that run their work.",
    summary: "Coda 将文档、表格与应用构建能力整合为协作平台。",
    retrievedAt,
    confidence: "high",
  },
  {
    id: "ev-coda-2",
    competitorId: "coda",
    title: "Coda AI & Packs",
    url: "https://coda.io/product/ai",
    sourceType: "documentation",
    quote: "Coda AI can draft, analyze tables, and trigger actions with Packs.",
    summary: "Coda AI 结合 Packs 可在文档内执行分析与外部动作。",
    retrievedAt,
    confidence: "high",
  },
  {
    id: "ev-coda-3",
    competitorId: "coda",
    title: "Coda pricing overview",
    url: "https://coda.io/pricing",
    sourceType: "pricing",
    quote: "Free, Pro, Team, and Enterprise tiers with Doc Maker based billing.",
    summary: "采用 Doc Maker 计费模型，含 Free / Pro / Team / Enterprise。",
    retrievedAt,
    confidence: "medium",
  },
  {
    id: "ev-coda-4",
    competitorId: "coda",
    title: "User review: learning curve",
    url: "https://www.g2.com/products/coda/reviews",
    sourceType: "review",
    quote: "Powerful once set up, but building complex docs has a steep learning curve.",
    summary: "用户认可灵活性，但反映复杂文档学习成本高。",
    retrievedAt,
    confidence: "medium",
  },
  {
    id: "ev-clickup-1",
    competitorId: "clickup",
    title: "ClickUp work OS positioning",
    url: "https://clickup.com",
    sourceType: "official",
    quote: "One app to replace them all — tasks, docs, goals, chat, and more.",
    summary: "ClickUp 定位为可替代多工具的一体化 Work OS。",
    retrievedAt,
    confidence: "high",
  },
  {
    id: "ev-clickup-2",
    competitorId: "clickup",
    title: "ClickUp Brain",
    url: "https://clickup.com/ai",
    sourceType: "documentation",
    quote: "ClickUp Brain connects tasks, docs, and people to answer questions with company context.",
    summary: "ClickUp Brain 强调跨任务/文档的公司上下文问答与自动化。",
    retrievedAt,
    confidence: "high",
  },
  {
    id: "ev-clickup-3",
    competitorId: "clickup",
    title: "ClickUp pricing",
    url: "https://clickup.com/pricing",
    sourceType: "pricing",
    quote: "Free Forever, Unlimited, Business, and Enterprise plans.",
    summary: "按席位分层定价，AI 能力通常作为附加或高阶计划能力。",
    retrievedAt,
    confidence: "medium",
  },
  {
    id: "ev-clickup-4",
    competitorId: "clickup",
    title: "User review: feature overload",
    url: "https://www.g2.com/products/clickup/reviews",
    sourceType: "review",
    quote: "Everything is possible, but the UI can feel overwhelming for new teams.",
    summary: "功能全面，但新用户常抱怨界面密度与上手成本。",
    retrievedAt,
    confidence: "medium",
  },
  {
    id: "ev-conf-1",
    competitorId: "confluence",
    title: "Confluence knowledge base positioning",
    url: "https://www.atlassian.com/software/confluence",
    sourceType: "official",
    quote: "Create, collaborate, and organize all your work in one place.",
    summary: "Confluence 专注企业知识沉淀与跨团队文档协作。",
    retrievedAt,
    confidence: "high",
  },
  {
    id: "ev-conf-2",
    competitorId: "confluence",
    title: "Atlassian Intelligence",
    url: "https://www.atlassian.com/software/artificial-intelligence",
    sourceType: "documentation",
    quote:
      "Atlassian Intelligence helps summarize pages, draft content, and find answers across Atlassian products.",
    summary: "AI 侧重摘要、起草与 Atlassian 产品生态内检索。",
    retrievedAt,
    confidence: "high",
  },
  {
    id: "ev-conf-3",
    competitorId: "confluence",
    title: "Confluence + Jira integration",
    url: "https://www.atlassian.com/software/confluence/jira-integration",
    sourceType: "official",
    quote: "Connect project work in Jira with knowledge in Confluence.",
    summary: "与 Jira 深度集成是企业研发团队的核心差异化。",
    retrievedAt,
    confidence: "high",
  },
  {
    id: "ev-conf-4",
    competitorId: "confluence",
    title: "User review: rigid page model",
    url: "https://www.g2.com/products/atlassian-confluence/reviews",
    sourceType: "review",
    quote: "Great for policies and specs, weaker as a flexible database or app builder.",
    summary: "企业知识库强，灵活数据库/应用构建相对弱。",
    retrievedAt,
    confidence: "medium",
  },
  {
    id: "ev-notion-1",
    competitorId: "notion",
    title: "Notion AI overview",
    url: "https://www.notion.so/product/ai",
    sourceType: "official",
    quote: "Notion AI helps you write, summarize, find answers, and automate busywork inside Notion.",
    summary: "Notion AI 覆盖写作、摘要、问答与部分自动化，仍主要发生在 Notion 工作区内。",
    retrievedAt,
    confidence: "high",
  },
];

export const DEMO_COMPETITORS: CompetitorProfile[] = [
  {
    id: "coda",
    name: "Coda",
    url: "https://coda.io",
    role: "competitor",
    status: "complete",
    positioning: "Doc + database + app platform，让团队把文档升级为可运行的内部工具。",
    targetUsers: ["Product / Ops", "跨职能协作团队", "需要轻量内部工具的中小团队"],
    coreFeatures: [
      {
        name: "Docs as apps",
        description: "页面可嵌入表格、按钮、自动化，形成轻量应用。",
        evidenceIds: ["ev-coda-1"],
      },
      {
        name: "Packs",
        description: "连接外部服务并在文档内触发动作。",
        evidenceIds: ["ev-coda-2"],
      },
      {
        name: "Tables & relations",
        description: "强表格与关联能力，适合运营系统。",
        evidenceIds: ["ev-coda-1"],
      },
    ],
    aiCapabilities: [
      {
        name: "Coda AI drafting & analysis",
        description: "在表格与文档中起草、分析。",
        maturity: "strong",
        evidenceIds: ["ev-coda-2"],
      },
      {
        name: "AI + Packs actions",
        description: "AI 可结合 Packs 触发外部动作。",
        maturity: "medium",
        evidenceIds: ["ev-coda-2"],
      },
    ],
    pricing: [
      {
        name: "Free",
        price: "$0",
        billing: "per Doc Maker",
        notes: "基础协作",
        evidenceIds: ["ev-coda-3"],
      },
      {
        name: "Pro / Team",
        price: "Paid tiers",
        billing: "Doc Maker based",
        notes: "高级自动化与权限",
        evidenceIds: ["ev-coda-3"],
      },
    ],
    integrations: ["Slack", "Google Drive", "Jira", "Salesforce (via Packs)"],
    strengths: [
      {
        id: "coda-s1",
        title: "Flexible workflow building",
        description: "可将文档演化为可执行工作流与轻量应用。",
        evidenceIds: ["ev-coda-1", "ev-coda-2"],
      },
    ],
    weaknesses: [
      {
        id: "coda-w1",
        title: "Higher learning curve",
        description: "复杂 doc/app 构建对非技术用户门槛较高。",
        evidenceIds: ["ev-coda-4"],
      },
    ],
    userFeedback: [
      "灵活性强，适合搭建内部工具",
      "学习曲线陡峭",
      "Doc Maker 计费对部分团队不直觉",
    ],
    evidenceIds: ["ev-coda-1", "ev-coda-2", "ev-coda-3", "ev-coda-4"],
  },
  {
    id: "clickup",
    name: "ClickUp",
    url: "https://clickup.com",
    role: "competitor",
    status: "complete",
    positioning: "All-in-one Work OS：任务、文档、目标、聊天整合在一个工作区。",
    targetUsers: ["项目管理团队", "追求工具整合的中大型团队", "运营与交付团队"],
    coreFeatures: [
      {
        name: "Tasks & views",
        description: "多视图任务管理（List/Board/Gantt 等）。",
        evidenceIds: ["ev-clickup-1"],
      },
      {
        name: "Docs",
        description: "内置文档，与任务双向关联。",
        evidenceIds: ["ev-clickup-1"],
      },
      {
        name: "Automation",
        description: "丰富的任务流自动化。",
        evidenceIds: ["ev-clickup-2"],
      },
    ],
    aiCapabilities: [
      {
        name: "ClickUp Brain",
        description: "跨任务与文档的上下文问答与内容生成。",
        maturity: "strong",
        evidenceIds: ["ev-clickup-2"],
      },
      {
        name: "AI task automation",
        description: "用 AI 辅助任务拆解与更新。",
        maturity: "medium",
        evidenceIds: ["ev-clickup-2"],
      },
    ],
    pricing: [
      {
        name: "Free Forever",
        price: "$0",
        billing: "per user",
        evidenceIds: ["ev-clickup-3"],
      },
      {
        name: "Unlimited / Business",
        price: "Paid per seat",
        billing: "monthly/annual",
        notes: "AI 多为附加能力",
        evidenceIds: ["ev-clickup-3"],
      },
    ],
    integrations: ["Slack", "GitHub", "Google Workspace", "Zoom"],
    strengths: [
      {
        id: "cu-s1",
        title: "Breadth of work management",
        description: "覆盖任务到文档的宽能力面，适合替代多工具。",
        evidenceIds: ["ev-clickup-1"],
      },
    ],
    weaknesses: [
      {
        id: "cu-w1",
        title: "UX density / overload",
        description: "功能过多导致新团队上手与配置成本高。",
        evidenceIds: ["ev-clickup-4"],
      },
    ],
    userFeedback: [
      "功能几乎什么都有",
      "界面信息密度高，容易 overload",
      "AI 与任务上下文结合是卖点",
    ],
    evidenceIds: ["ev-clickup-1", "ev-clickup-2", "ev-clickup-3", "ev-clickup-4"],
  },
  {
    id: "confluence",
    name: "Confluence",
    url: "https://www.atlassian.com/software/confluence",
    role: "competitor",
    status: "complete",
    positioning: "企业知识库与研发协作文档中枢，深度嵌入 Atlassian 生态。",
    targetUsers: ["企业研发与 IT", "需要合规知识管理的组织", "已使用 Jira 的团队"],
    coreFeatures: [
      {
        name: "Spaces & pages",
        description: "结构化空间与页面树管理企业知识。",
        evidenceIds: ["ev-conf-1"],
      },
      {
        name: "Jira integration",
        description: "需求/缺陷与知识页双向联动。",
        evidenceIds: ["ev-conf-3"],
      },
      {
        name: "Permissions & admin",
        description: "企业级权限与治理。",
        evidenceIds: ["ev-conf-1"],
      },
    ],
    aiCapabilities: [
      {
        name: "Atlassian Intelligence",
        description: "摘要、起草、跨 Atlassian 产品找答案。",
        maturity: "medium",
        evidenceIds: ["ev-conf-2"],
      },
      {
        name: "In-ecosystem search",
        description: "强在生态内检索，弱在跨非 Atlassian 工具执行。",
        maturity: "medium",
        evidenceIds: ["ev-conf-2", "ev-conf-3"],
      },
    ],
    pricing: [
      {
        name: "Free / Standard / Premium",
        price: "Per user tiers",
        billing: "Atlassian Cloud",
        evidenceIds: ["ev-conf-1"],
      },
    ],
    integrations: ["Jira", "Trello", "Slack", "Microsoft Teams"],
    strengths: [
      {
        id: "cf-s1",
        title: "Enterprise knowledge + Jira",
        description: "在研发知识管理与工单联动上壁垒清晰。",
        evidenceIds: ["ev-conf-3"],
      },
    ],
    weaknesses: [
      {
        id: "cf-w1",
        title: "Less flexible as database/app builder",
        description: "页面模型相对固定，不擅长灵活数据库与应用构建。",
        evidenceIds: ["ev-conf-4"],
      },
    ],
    userFeedback: [
      "适合政策、规格与企业 wiki",
      "不如 Notion/Coda 灵活",
      "Jira 用户迁移成本低",
    ],
    evidenceIds: ["ev-conf-1", "ev-conf-2", "ev-conf-3", "ev-conf-4"],
  },
];

export const DEMO_FACTS: Fact[] = [
  {
    id: "fact-1",
    competitorId: "coda",
    dimension: "ai_capabilities",
    claim: "Coda AI 可结合 Packs 在文档内触发外部动作，而不仅是文本生成。",
    evidenceIds: ["ev-coda-2"],
    confidence: 0.86,
  },
  {
    id: "fact-2",
    competitorId: "coda",
    dimension: "positioning",
    claim: "Coda 将文档定位为可运行的内部工具平台（doc + app）。",
    evidenceIds: ["ev-coda-1"],
    confidence: 0.9,
  },
  {
    id: "fact-3",
    competitorId: "clickup",
    dimension: "ai_capabilities",
    claim: "ClickUp Brain 强调跨任务与文档的公司上下文问答。",
    evidenceIds: ["ev-clickup-2"],
    confidence: 0.88,
  },
  {
    id: "fact-4",
    competitorId: "clickup",
    dimension: "ux_workflow",
    claim: "用户反馈指出 ClickUp 功能全面但界面容易 overload。",
    evidenceIds: ["ev-clickup-4"],
    confidence: 0.72,
  },
  {
    id: "fact-5",
    competitorId: "confluence",
    dimension: "integrations",
    claim: "Confluence 与 Jira 的深度集成为企业研发场景核心优势。",
    evidenceIds: ["ev-conf-3"],
    confidence: 0.92,
  },
  {
    id: "fact-6",
    competitorId: "confluence",
    dimension: "ai_capabilities",
    claim: "Atlassian Intelligence 主要服务生态内摘要、起草与检索。",
    evidenceIds: ["ev-conf-2"],
    confidence: 0.85,
  },
  {
    id: "fact-7",
    competitorId: "coda",
    dimension: "user_reviews",
    claim: "用户认为 Coda 强大但复杂文档学习成本高。",
    evidenceIds: ["ev-coda-4"],
    confidence: 0.7,
  },
  {
    id: "fact-8",
    competitorId: "notion",
    dimension: "ai_capabilities",
    claim: "Notion AI 能力主要发生在 Notion 工作区内（写作/摘要/问答/部分自动化）。",
    evidenceIds: ["ev-notion-1"],
    confidence: 0.84,
  },
];

export const DEMO_COMPARISONS: ComparisonDimension[] = [
  {
    dimension: "Positioning",
    competitors: [
      {
        competitorId: "coda",
        score: 4,
        summary: "Doc+app platform，偏可构建内部工具。",
        evidenceIds: ["ev-coda-1"],
      },
      {
        competitorId: "clickup",
        score: 4,
        summary: "All-in-one Work OS，偏任务与交付。",
        evidenceIds: ["ev-clickup-1"],
      },
      {
        competitorId: "confluence",
        score: 3,
        summary: "企业知识库，偏研发与治理。",
        evidenceIds: ["ev-conf-1"],
      },
    ],
  },
  {
    dimension: "AI Capabilities",
    competitors: [
      {
        competitorId: "coda",
        score: 4,
        summary: "AI + Packs，开始具备动作执行。",
        evidenceIds: ["ev-coda-2"],
      },
      {
        competitorId: "clickup",
        score: 4,
        summary: "Brain 连接任务/文档上下文。",
        evidenceIds: ["ev-clickup-2"],
      },
      {
        competitorId: "confluence",
        score: 3,
        summary: "生态内 AI 辅助，跨工具执行弱。",
        evidenceIds: ["ev-conf-2"],
      },
    ],
  },
  {
    dimension: "Pricing",
    competitors: [
      {
        competitorId: "coda",
        score: 3,
        summary: "Doc Maker 模型，对部分团队不直觉。",
        evidenceIds: ["ev-coda-3"],
      },
      {
        competitorId: "clickup",
        score: 3,
        summary: "席位制分层，AI 常为附加。",
        evidenceIds: ["ev-clickup-3"],
      },
      {
        competitorId: "confluence",
        score: 3,
        summary: "Atlassian 云分层，企业打包强。",
        evidenceIds: ["ev-conf-1"],
      },
    ],
  },
  {
    dimension: "UX",
    competitors: [
      {
        competitorId: "coda",
        score: 3,
        summary: "灵活但学习曲线高。",
        evidenceIds: ["ev-coda-4"],
      },
      {
        competitorId: "clickup",
        score: 2,
        summary: "能力全，密度高易 overload。",
        evidenceIds: ["ev-clickup-4"],
      },
      {
        competitorId: "confluence",
        score: 3,
        summary: "企业熟悉，页面模型较固定。",
        evidenceIds: ["ev-conf-4"],
      },
    ],
  },
  {
    dimension: "Integrations",
    competitors: [
      {
        competitorId: "coda",
        score: 4,
        summary: "Packs 可扩展外部动作。",
        evidenceIds: ["ev-coda-2"],
      },
      {
        competitorId: "clickup",
        score: 4,
        summary: "常见协作/开发工具覆盖广。",
        evidenceIds: ["ev-clickup-1"],
      },
      {
        competitorId: "confluence",
        score: 5,
        summary: "Jira 深度集成为壁垒。",
        evidenceIds: ["ev-conf-3"],
      },
    ],
  },
  {
    dimension: "Target Market",
    competitors: [
      {
        competitorId: "coda",
        score: 4,
        summary: "中小团队内部工具与运营系统。",
        evidenceIds: ["ev-coda-1"],
      },
      {
        competitorId: "clickup",
        score: 4,
        summary: "追求一站式工作管理的团队。",
        evidenceIds: ["ev-clickup-1"],
      },
      {
        competitorId: "confluence",
        score: 5,
        summary: "企业研发与合规知识管理。",
        evidenceIds: ["ev-conf-1"],
      },
    ],
  },
  {
    dimension: "User Feedback",
    competitors: [
      {
        competitorId: "coda",
        score: 3,
        summary: "强灵活 / 高门槛。",
        evidenceIds: ["ev-coda-4"],
      },
      {
        competitorId: "clickup",
        score: 3,
        summary: "强覆盖 / 易 overload。",
        evidenceIds: ["ev-clickup-4"],
      },
      {
        competitorId: "confluence",
        score: 3,
        summary: "强治理 / 弱灵活数据库。",
        evidenceIds: ["ev-conf-4"],
      },
    ],
  },
  {
    dimension: "Core Features",
    competitors: [
      {
        competitorId: "coda",
        score: 4,
        summary: "Docs、表格、按钮与自动化。",
        evidenceIds: ["ev-coda-1"],
      },
      {
        competitorId: "clickup",
        score: 5,
        summary: "任务视图 + Docs + 自动化面最宽。",
        evidenceIds: ["ev-clickup-1"],
      },
      {
        competitorId: "confluence",
        score: 3,
        summary: "Spaces/Pages + 企业权限。",
        evidenceIds: ["ev-conf-1"],
      },
    ],
  },
];

export const DEMO_FEATURE_MATRIX: FeatureMatrixRow[] = [
  {
    feature: "AI Search / Q&A",
    competitors: [
      {
        competitorId: "coda",
        status: "medium",
        note: "文档/表格内分析问答",
        evidenceIds: ["ev-coda-2"],
      },
      {
        competitorId: "clickup",
        status: "strong",
        note: "Brain 跨任务文档上下文",
        evidenceIds: ["ev-clickup-2"],
      },
      {
        competitorId: "confluence",
        status: "strong",
        note: "生态内智能检索",
        evidenceIds: ["ev-conf-2"],
      },
    ],
  },
  {
    feature: "AI Writing",
    competitors: [
      {
        competitorId: "coda",
        status: "strong",
        note: "起草与改写",
        evidenceIds: ["ev-coda-2"],
      },
      {
        competitorId: "clickup",
        status: "strong",
        note: "内容生成与任务描述",
        evidenceIds: ["ev-clickup-2"],
      },
      {
        competitorId: "confluence",
        status: "medium",
        note: "页面起草与摘要",
        evidenceIds: ["ev-conf-2"],
      },
    ],
  },
  {
    feature: "Automation",
    competitors: [
      {
        competitorId: "coda",
        status: "strong",
        note: "按钮/自动化 + Packs",
        evidenceIds: ["ev-coda-2"],
      },
      {
        competitorId: "clickup",
        status: "strong",
        note: "任务流自动化成熟",
        evidenceIds: ["ev-clickup-1"],
      },
      {
        competitorId: "confluence",
        status: "medium",
        note: "偏生态内流程，跨工具执行有限",
        evidenceIds: ["ev-conf-3"],
      },
    ],
  },
  {
    feature: "Database",
    competitors: [
      {
        competitorId: "coda",
        status: "strong",
        note: "表格与关联强",
        evidenceIds: ["ev-coda-1"],
      },
      {
        competitorId: "clickup",
        status: "medium",
        note: "以任务数据模型为主",
        evidenceIds: ["ev-clickup-1"],
      },
      {
        competitorId: "confluence",
        status: "weak",
        note: "页面模型，非灵活数据库",
        evidenceIds: ["ev-conf-4"],
      },
    ],
  },
  {
    feature: "Integrations",
    competitors: [
      {
        competitorId: "coda",
        status: "strong",
        note: "Packs 可扩展",
        evidenceIds: ["ev-coda-2"],
      },
      {
        competitorId: "clickup",
        status: "strong",
        note: "主流工具覆盖广",
        evidenceIds: ["ev-clickup-1"],
      },
      {
        competitorId: "confluence",
        status: "strong",
        note: "Jira 深度集成",
        evidenceIds: ["ev-conf-3"],
      },
    ],
  },
];

export const DEMO_INSIGHTS: Insight[] = [
  {
    id: "ins-1",
    title: "AI 正在从写作助手升级为 workflow layer",
    description:
      "Coda 的 Packs 动作与 ClickUp Brain 的跨对象上下文表明，竞争焦点已从“帮你写”转向“帮你在工作流中执行与串联”。仅增强写作能力会快速落入 feature parity。",
    supportingFactIds: ["fact-1", "fact-3", "fact-8"],
    confidence: 0.86,
  },
  {
    id: "ins-2",
    title: "跨工具执行仍是普遍短板",
    description:
      "多数 AI 仍强在各自工作区内；Confluence 强在 Atlassian 生态，但用户在会议→文档→任务之间的手工搬运抱怨持续存在。这是可被重新定义的体验断点。",
    supportingFactIds: ["fact-5", "fact-6", "fact-4"],
    confidence: 0.8,
  },
  {
    id: "ins-3",
    title: "灵活性与上手成本形成共同张力",
    description:
      "Coda 与 ClickUp 都因能力面扩展获得评价，但也因学习曲线与界面密度被抱怨。知识平台的下一阶段差异化可能是“强大但可渐进披露”的 AI 编排，而非继续堆功能入口。",
    supportingFactIds: ["fact-4", "fact-7"],
    confidence: 0.78,
  },
];

export const DEMO_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-1",
    title: "Cross-tool AI workflow orchestration",
    problem:
      "用户仍需在会议纪要、文档与任务系统之间手工搬运信息，AI 多停留在单一工作区。",
    evidence: ["ev-clickup-2", "ev-conf-2", "ev-coda-2", "ev-notion-1"],
    competitorsAffected: ["coda", "clickup", "confluence", "notion"],
    userValue: "减少上下文切换与重复录入，让 AI 直接生成可执行的跨工具下一步。",
    strategicValue:
      "把 Notion 从“更好的文档 AI”提升为“工作流编排层”，形成难被单点功能复制的平台叙事。",
    confidence: 0.84,
    impact: 5,
  },
  {
    id: "opp-2",
    title: "Progressive automation for database workflows",
    problem:
      "团队需要数据库驱动的运营流程，但不愿承担 Coda 式高学习曲线或 ClickUp 式配置密度。",
    evidence: ["ev-coda-4", "ev-clickup-4", "ev-coda-1"],
    competitorsAffected: ["coda", "clickup"],
    userValue: "用自然语言把 Notion database 变成可运行流程，同时保持低门槛。",
    strategicValue: "在 Notion 已有数据库优势上叠加 AI 编排，攻击 Coda 的核心战场。",
    confidence: 0.81,
    impact: 5,
  },
  {
    id: "opp-3",
    title: "Evidence-linked AI answers for teams",
    problem:
      "知识库问答常给出无法追溯的答案，企业用户难以信任并采取行动。",
    evidence: ["ev-conf-2", "ev-clickup-2"],
    competitorsAffected: ["confluence", "clickup"],
    userValue: "每个 AI 答案附带来源页面/数据库行，便于审计与协作确认。",
    strategicValue: "把“可信 AI”做成 Notion 企业升级理由，对标 Confluence 治理需求。",
    confidence: 0.76,
    impact: 4,
  },
];

export const DEMO_RECOMMENDATIONS: ProductRecommendation[] = [
  {
    id: "rec-1",
    title: "投资跨页面 / 跨工具的 AI workflow orchestration",
    description:
      "优先做：从会议纪要/页面自动生成任务、更新 database、并回写状态；先打通 Notion 内，再开放精选外部连接器。",
    impact: 5,
    effort: 4,
    confidence: 4,
    reasoning:
      "因为证据显示竞品 AI 仍偏工作区内（fact-6/fact-8），而用户痛点在跨对象搬运（insight-2）→ 推断编排层尚未被占满 → 因此推荐把自动化编排而非更多写作模板作为下一投资重点。",
    evidenceIds: ["ev-notion-1", "ev-clickup-2", "ev-conf-2"],
    insightIds: ["ins-1", "ins-2"],
  },
  {
    id: "rec-2",
    title: "用自然语言驱动 Database → 轻量自动化",
    description:
      "允许用户用一句话创建视图、按钮与提醒（例如“当状态变为 Done 时通知 owner 并归档”），降低对复杂配置 UI 的依赖。",
    impact: 5,
    effort: 3,
    confidence: 4,
    reasoning:
      "因为 Coda 灵活但学习成本高（fact-7）、ClickUp 易 overload（fact-4）→ 推断市场存在“强自动化但低门槛”空缺 → 因此推荐在 Notion DB 上做渐进式自动化。",
    evidenceIds: ["ev-coda-4", "ev-clickup-4", "ev-coda-1"],
    insightIds: ["ins-3"],
  },
  {
    id: "rec-3",
    title: "默认启用 citation / evidence 的 AI 回答",
    description:
      "Q&A 与摘要结果必须展示来源块；企业计划提供审计导出。避免无法追溯的“聪明回答”。",
    impact: 4,
    effort: 2,
    confidence: 4,
    reasoning:
      "因为企业场景重视可追溯（Confluence 治理叙事 / fact-5）且 AI 答案可信度是采用门槛 → 推断低成本可信度功能可拉动升级 → 因此推荐优先做 evidence-linked answers。",
    evidenceIds: ["ev-conf-2", "ev-conf-3"],
    insightIds: ["ins-2"],
  },
  {
    id: "rec-4",
    title: "避免以更多通用 AI writing 功能作为主叙事",
    description:
      "写作/改写已接近标配。对外叙事应强调 workflow outcomes（更少搬运、更快闭环），而非模型文采。",
    impact: 3,
    effort: 1,
    confidence: 5,
    reasoning:
      "因为多竞品均具备 AI writing（feature matrix）→ 推断继续堆写作属于 over-served → 因此推荐把写作作为基础能力，把差异化预算留给编排与可信检索。",
    evidenceIds: ["ev-coda-2", "ev-clickup-2", "ev-conf-2"],
    insightIds: ["ins-1"],
  },
];

export const DEMO_EXECUTIVE_SUMMARY: ExecutiveSummary = {
  summary:
    "在知识管理 SaaS 中，AI 竞争正从“写作助手”转向“工作流层”。Coda 以 doc+app 与 Packs 动作、ClickUp 以 Brain 上下文、Confluence 以生态内智能与 Jira 联动分别施压。Notion 仍具备灵活数据库与清爽体验优势，但若停留在工作区内的生成式能力，容易陷入 feature parity。最大机会是：用低门槛的 AI 编排打通会议→文档→数据库→任务，并默认提供可追溯证据。",
  keyFindings: [
    "AI 差异化正从生成质量转向执行与串联能力",
    "跨工具 / 跨对象信息搬运仍是高频痛点",
    "灵活工具普遍付出学习曲线或界面密度代价",
    "企业用户需要可追溯的 AI 答案，而不只是流畅文本",
  ],
  biggestThreat:
    "ClickUp Brain 与 Coda AI+Packs 把 AI 绑到任务执行与外部动作，削弱 Notion“更好的文档 AI”叙事。",
  biggestOpportunity:
    "Cross-tool / cross-page AI workflow orchestration：把 Notion 变成减少搬运的编排层。",
  competitiveAdvantage:
    "Notion 的数据库灵活性 + 相对克制的 UX，适合做成“强大但渐进披露”的自动化，而不是另一套重型 Work OS。",
  recommendedNextMove:
    "启动一个垂直切片：会议纪要 → 结构化 database 行 → 任务创建（带 citation），验证编排层的用户价值后再扩展连接器。",
};

export function slugifyCompetitor(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}
