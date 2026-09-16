import { z } from "zod";

export type LLMGenerateParams<T> = {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  temperature?: number;
};

export interface LLMProvider {
  readonly name: string;
  generate<T>(params: LLMGenerateParams<T>): Promise<T>;
}

export class StructuredOutputError extends Error {
  readonly issues: string;
  readonly rawPreview: string;

  constructor(message: string, issues: string, rawPreview: string) {
    super(`${message}\n${issues}`);
    this.name = "StructuredOutputError";
    this.issues = issues;
    this.rawPreview = rawPreview;
  }
}

/**
 * Extract a JSON object from model text.
 * Handles optional ```json fences and leading/trailing prose.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : trimmed).trim();

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    // fall through to brace slicing
  }

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new StructuredOutputError(
      "No JSON object found in model response",
      "missing_object",
      candidate.slice(0, 500),
    );
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as unknown;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "JSON parse failed";
    throw new StructuredOutputError(
      `Invalid JSON in model response: ${msg}`,
      msg,
      candidate.slice(0, 500),
    );
  }
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("\n");
}

function describeSchemaShape(schema: z.ZodType<unknown>): string {
  try {
    return JSON.stringify(z.toJSONSchema(schema), null, 2);
  } catch {
    return "Match the exact field types required by the application schema (arrays of strings where specified, no nested objects in string arrays).";
  }
}

function buildRepairPrompt(input: {
  invalidJson: string;
  validationErrors: string;
  schemaShape: string;
}): string {
  return `
You are a JSON structure repair assistant.

Task: Repair the following JSON so it EXACTLY matches the required structure.
Do NOT redo the underlying analysis or invent a new plan.
Only fix types, missing fields, and nesting so validation passes.

Return ONLY one corrected JSON object.
Do not return Markdown.
Do not wrap JSON in code fences.
Do not include explanations.

VALIDATION ERRORS:
${input.validationErrors}

INVALID JSON:
${input.invalidJson}

REQUIRED STRUCTURE (guidance):
${input.schemaShape}
`.trim();
}

/** OpenAI-compatible chat completions (OpenAI / DeepSeek / compatible gateways). */
export class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string;

  constructor(
    private readonly options: {
      apiKey: string;
      baseUrl?: string;
      model?: string;
      name?: string;
    },
  ) {
    this.name = options.name ?? "openai-compatible";
  }

  private async chatCompletion(messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[], temperature: number): Promise<string> {
    const baseUrl = (this.options.baseUrl ?? "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    );
    const model = this.options.model ?? "gpt-4o-mini";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        response_format: { type: "json_object" },
        messages,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `LLM request failed (${response.status}): ${body.slice(0, 400)}`,
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty LLM response");
    }
    return content;
  }

  async generate<T>(params: LLMGenerateParams<T>): Promise<T> {
    const temperature = params.temperature ?? 0.2;

    const content = await this.chatCompletion(
      [
        {
          role: "system",
          content: `${params.system}\n\nReturn ONLY one valid JSON object matching the required schema. No Markdown. No code fences.`,
        },
        { role: "user", content: params.prompt },
      ],
      temperature,
    );

    let parsed: unknown;
    try {
      parsed = extractJson(content);
    } catch (err) {
      // Attempt one repair even on extract/parse failure
      const repairedContent = await this.chatCompletion(
        [
          {
            role: "system",
            content:
              "Return ONLY one corrected JSON object. No Markdown. No code fences.",
          },
          {
            role: "user",
            content: buildRepairPrompt({
              invalidJson: content.slice(0, 4000),
              validationErrors:
                err instanceof StructuredOutputError
                  ? err.issues
                  : err instanceof Error
                    ? err.message
                    : "JSON extraction failed",
              schemaShape: describeSchemaShape(params.schema),
            }),
          },
        ],
        0,
      );

      let repairedParsed: unknown;
      try {
        repairedParsed = extractJson(repairedContent);
      } catch (repairErr) {
        throw new StructuredOutputError(
          "Structured output failed after repair (invalid JSON)",
          repairErr instanceof Error ? repairErr.message : "invalid_json",
          repairedContent.slice(0, 500),
        );
      }

      const repairedResult = params.schema.safeParse(repairedParsed);
      if (repairedResult.success) {
        return repairedResult.data;
      }

      throw new StructuredOutputError(
        "Structured output failed after repair",
        formatZodIssues(repairedResult.error),
        repairedContent.slice(0, 500),
      );
    }

    const first = params.schema.safeParse(parsed);
    if (first.success) {
      return first.data;
    }

    const invalidJson = JSON.stringify(parsed, null, 2);
    const validationErrors = formatZodIssues(first.error);

    const repairedContent = await this.chatCompletion(
      [
        {
          role: "system",
          content:
            "Return ONLY one corrected JSON object. No Markdown. No code fences.",
        },
        {
          role: "user",
          content: buildRepairPrompt({
            invalidJson: invalidJson.slice(0, 4000),
            validationErrors,
            schemaShape: describeSchemaShape(params.schema),
          }),
        },
      ],
      0,
    );

    let repairedParsed: unknown;
    try {
      repairedParsed = extractJson(repairedContent);
    } catch (repairErr) {
      throw new StructuredOutputError(
        "Structured output failed after repair (invalid JSON)",
        `${validationErrors}\n---\n${repairErr instanceof Error ? repairErr.message : "invalid_json"}`,
        repairedContent.slice(0, 500),
      );
    }

    const second = params.schema.safeParse(repairedParsed);
    if (second.success) {
      return second.data;
    }

    throw new StructuredOutputError(
      "Structured output failed after 1 repair attempt",
      formatZodIssues(second.error),
      repairedContent.slice(0, 500),
    );
  }
}

/** Deterministic fallback used by demo / when no API key is configured. */
export class MockLLMProvider implements LLMProvider {
  readonly name = "mock";

  constructor(private readonly resolver: <T>(params: LLMGenerateParams<T>) => T) {}

  async generate<T>(params: LLMGenerateParams<T>): Promise<T> {
    const value = this.resolver(params);
    return params.schema.parse(value);
  }
}

export function createLLMProvider(): LLMProvider | null {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  if (process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
    return new OpenAICompatibleProvider({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: "https://api.deepseek.com/v1",
      model: process.env.LLM_MODEL ?? "deepseek-chat",
      name: "deepseek",
    });
  }

  return new OpenAICompatibleProvider({
    apiKey,
    baseUrl: process.env.OPENAI_BASE_URL,
    model: process.env.LLM_MODEL ?? "gpt-4o-mini",
    name: "openai",
  });
}
