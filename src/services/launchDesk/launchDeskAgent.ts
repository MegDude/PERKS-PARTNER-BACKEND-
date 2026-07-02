export type LaunchDeskInput = {
  productBrief: string;
  audience: string;
  launchDate: string;
  constraints: string;
  assets: string;
};

export type LaunchDeskToolEvent = {
  type: "tool_progress";
  tool: string;
  status: "started" | "completed";
  payload?: unknown;
};

function splitSentences(value: string) {
  return value
    .split(/[\n.]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function extractLaunchTasks(input: LaunchDeskInput) {
  const briefTasks = splitSentences(input.productBrief)
    .filter((line) => /launch|release|ship|build|announce|publish|test|review|approve/i.test(line))
    .slice(0, 6);
  return [
    ...briefTasks,
    "Confirm launch owner and decision maker.",
    "Lock launch date, channels, and approval path.",
    "Prepare launch copy, assets, QA notes, and rollback plan.",
  ];
}

export function checkLaunchReadiness(input: LaunchDeskInput) {
  const rubric = [
    ["Product brief", input.productBrief],
    ["Audience", input.audience],
    ["Launch date", input.launchDate],
    ["Constraints", input.constraints],
    ["Available assets", input.assets],
  ] as const;
  const missing = rubric.filter(([, value]) => !value.trim()).map(([label]) => label);
  const score = Math.max(0, Math.round(((rubric.length - missing.length) / rubric.length) * 100));
  return {
    score,
    missing,
    status: score >= 80 ? "ready_to_plan" : score >= 50 ? "needs_detail" : "not_ready",
  };
}

export function generateOwnerChecklist(input: LaunchDeskInput) {
  const audience = input.audience || "target audience";
  return [
    { owner: "Engineering", item: "Confirm scope, release branch, test coverage, deploy owner, and rollback path." },
    { owner: "Product", item: `Confirm launch promise, user-facing value, and success metric for ${audience}.` },
    { owner: "Marketing", item: "Prepare announcement copy, channel plan, launch FAQ, and asset checklist." },
    { owner: "Support", item: "Prepare known issues, escalation path, and first-response notes." },
  ];
}

export function draftChannelCopy(input: LaunchDeskInput) {
  const product = input.productBrief || "the launch";
  const audience = input.audience || "the team";
  return {
    email: `Subject: ${product.slice(0, 68)}\n\nWe are preparing this launch for ${audience}. Here is what is changing, why it matters, and what to do next.`,
    slack: `Launch draft: ${product.slice(0, 120)}. Audience: ${audience}. Next step: confirm owners, risks, and launch date.`,
    releaseNotes: `New: ${product.slice(0, 160)}\n\nWho it helps: ${audience}\n\nBefore launch: confirm QA, support notes, and rollback plan.`,
  };
}

function sse(type: string, payload: unknown) {
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function openAIInput(input: LaunchDeskInput, tools: Record<string, unknown>) {
  return [
    {
      role: "system",
      content: [
        "You are Launch Desk, a launch-planning agent for engineering and marketing teams.",
        "Use the provided deterministic tool outputs. Do not invent facts.",
        "Return a practical release plan with priorities, risks, owner checklist, channel copy suggestions, and follow-up questions for missing details.",
        "Write clearly and directly. Keep it actionable.",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({ input, toolOutputs: tools }, null, 2),
    },
  ];
}

export async function streamLaunchDeskAgent(input: LaunchDeskInput, write: (chunk: string) => void) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    write(sse("error", { error: "OPENAI_API_KEY is not configured on the server." }));
    return;
  }

  const tools: Record<string, unknown> = {};
  const runTool = (tool: string, fn: () => unknown) => {
    const started: LaunchDeskToolEvent = { type: "tool_progress", tool, status: "started" };
    write(sse("tool_progress", started));
    const payload = fn();
    tools[tool] = payload;
    const completed: LaunchDeskToolEvent = { type: "tool_progress", tool, status: "completed", payload };
    write(sse("tool_progress", completed));
  };

  runTool("extract_tasks", () => extractLaunchTasks(input));
  runTool("check_launch_readiness", () => checkLaunchReadiness(input));
  runTool("generate_owner_checklist", () => generateOwnerChecklist(input));
  runTool("draft_channel_copy", () => draftChannelCopy(input));

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.LAUNCH_DESK_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
      stream: true,
      input: openAIInput(input, tools),
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    write(sse("error", { error: detail || "OpenAI stream failed." }));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const event of events) {
      const dataLine = event.split("\n").find((line) => line.startsWith("data: "));
      if (!dataLine || dataLine === "data: [DONE]") continue;
      try {
        const payload = JSON.parse(dataLine.slice(6));
        if (payload.type === "response.output_text.delta" && payload.delta) {
          write(sse("text_delta", { delta: payload.delta }));
        }
        if (payload.type === "response.completed") {
          write(sse("done", { ok: true }));
        }
      } catch {
        // Ignore provider keepalive or unrecognized stream events.
      }
    }
  }
  write(sse("done", { ok: true }));
}
