# Competitive Intelligence Agent

Evidence-first AI workflow for competitor research — not a ChatGPT report generator.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

1. Click **Load Demo Scenario** (Notion vs Coda / ClickUp / Confluence)
2. Click **Start Analysis**
3. Watch staged progress, then explore the **Report Workspace**
4. Click **View evidence** on insights / features / recommendations

Demo mode is marked **Demo / Sample Data** and works offline.

## Live mode (optional)

Copy `.env.example` → `.env.local` and set `OPENAI_API_KEY` or `DEEPSEEK_API_KEY` (optional `TAVILY_API_KEY` for search).

## Architecture

```text
User
 ↓
Analysis Input
 ↓
Research Planner
 ↓
Competitor Researchers (per competitor)
 ↓
Evidence Store + Fact Extraction
 ↓
Comparison Engine + Feature Matrix
 ↓
Insight Engine
 ↓
Opportunity Engine
 ↓
Recommendation Engine
 ↓
Report UI (with Evidence Drawer)
```
