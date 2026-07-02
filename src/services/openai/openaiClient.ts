type OpenAIJsonRequest = {
  system: string;
  user: string;
  schemaName?: string;
  temperature?: number;
};

export type OpenAIJsonResult<T = Record<string, unknown>> = {
  ok: boolean;
  provider: "openai";
  model: string;
  data?: T;
  error?: string;
  status?: number;
};

function extractJson(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OpenAI response did not contain JSON.");
    return JSON.parse(match[0]);
  }
}

export function getOpenAIConfigurationStatus() {
  return {
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  };
}

export async function generateOpenAIJson<T = Record<string, unknown>>({
  system,
  user,
  schemaName = "downtown_perks_intelligence",
  temperature = 0.35,
}: OpenAIJsonRequest): Promise<OpenAIJsonResult<T>> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    return {
      ok: false,
      provider: "openai",
      model,
      error: "OpenAI is not configured server-side. Add OPENAI_API_KEY to the runtime environment.",
      status: 503,
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        text: {
          format: {
            type: "json_schema",
            name: schemaName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64),
            strict: false,
            schema: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        provider: "openai",
        model,
        error: payload?.error?.message || "OpenAI request failed.",
        status: response.status,
      };
    }

    const outputText =
      payload.output_text ||
      payload.output?.flatMap((item: any) => item.content || [])
        .map((content: any) => content.text || "")
        .join("\n") ||
      "";

    return {
      ok: true,
      provider: "openai",
      model,
      data: extractJson(outputText) as T,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "openai",
      model,
      error: error instanceof Error ? error.message : "OpenAI request failed.",
      status: 500,
    };
  }
}
