import { NextResponse } from "next/server";
import {
  AnalysisInputSchema,
  type AnalysisInput,
} from "@/lib/competitive-analysis/types";
import { runCompetitiveAnalysisWorkflow } from "@/lib/competitive-analysis/workflow";
import type { ProgressEvent } from "@/lib/competitive-analysis/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function isLiveProviderAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY);
}

/**
 * Resolve runtime mode without a form toggle:
 * - explicit "demo" → sample dataset (e.g. Run example analysis)
 * - otherwise → live if API keys exist, else sample dataset
 */
function resolveAnalysisInput(
  input: Omit<AnalysisInput, "mode"> & { mode?: "demo" | "live" },
): AnalysisInput {
  if (input.mode === "demo") {
    return { ...input, mode: "demo" };
  }
  const mode = isLiveProviderAvailable() ? "live" : "demo";
  return { ...input, mode };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AnalysisInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid analysis input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = resolveAnalysisInput(parsed.data);
  const stream = request.headers.get("accept")?.includes("application/x-ndjson");

  if (!stream) {
    const state = await runCompetitiveAnalysisWorkflow(input);
    return NextResponse.json(state);
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: ProgressEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        await runCompetitiveAnalysisWorkflow(input, send);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`${JSON.stringify({ type: "error", message })}\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
