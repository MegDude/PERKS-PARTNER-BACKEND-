const WEBHOOK_URL = (import.meta as any).env?.VITE_GOOGLE_SHEETS_SURVEY_WEBHOOK_URL;

export type SurveyAnswer = {
  question: string;
  answer: string;
};

export type SurveyExportContext = {
  surveyId?: string;
  buildingId?: string;
  buildingName?: string;
  residentId?: string;
  residentName?: string;
  residentEmail?: string;
  perkId?: string;
  perkName?: string;
  redemptionId?: string;
  answers?: SurveyAnswer[];
  score?: number;
  sentiment?: string;
  sourceRoute?: string;
};

export function buildSurveyExportPayload(responseContext: SurveyExportContext) {
  const answers = responseContext.answers || [];
  return {
    timestamp: new Date().toISOString(),
    buildingId: responseContext.buildingId || "",
    buildingName: responseContext.buildingName || "",
    residentIdOrSessionId: responseContext.residentId || responseContext.residentEmail || "anonymous",
    residentName: responseContext.residentName || "",
    surveyId: responseContext.surveyId || "",
    perkId: responseContext.perkId || "",
    perkName: responseContext.perkName || "",
    redemptionId: responseContext.redemptionId || "",
    answers,
    answersSummary: answers.map((answer) => `${answer.question}: ${answer.answer}`).join(" | "),
    score: responseContext.score ?? null,
    sentiment: responseContext.sentiment || "",
    completionStatus: "completed",
    sourceRoute: responseContext.sourceRoute || (typeof window !== "undefined" ? window.location.pathname : ""),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };
}

export async function exportSurveyResponseToSheet(payload: Record<string, unknown>) {
  if (!WEBHOOK_URL) return { status: "skipped" as const };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
    return { status: "success" as const };
  } catch (error) {
    return { status: "failed" as const, error: error instanceof Error ? error.message : String(error) };
  }
}
