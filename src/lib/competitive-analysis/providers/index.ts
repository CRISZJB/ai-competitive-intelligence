import type { ResearchProvider } from "./research-provider";
import { DemoResearchProvider, HttpResearchProvider } from "./research-provider";
import { DEMO_RESEARCH_CATALOG } from "../../../data/competitive-analysis/demo-catalog";

export function createResearchProvider(mode: "demo" | "live"): ResearchProvider {
  if (mode === "demo") {
    return new DemoResearchProvider(DEMO_RESEARCH_CATALOG);
  }
  return new HttpResearchProvider();
}
