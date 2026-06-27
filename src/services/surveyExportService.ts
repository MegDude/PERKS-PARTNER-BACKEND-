import { appendSurveyResponseToGoogleSheet } from "@/lib/googleSheets";

export type SurveyAnswer = {
  question: string;
  answer: string;
};

export type SurveyExportContext = {
  surveyId?: string;
  surveyName?: string;
  buildingId?: string;
  buildingName?: string;
  residentId?: string;
  residentName?: string;
  residentEmail?: string;
  partnerId?: string;
  partnerName?: string;
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
    id: responseContext.surveyId ? `survey-export-${responseContext.surveyId}-${Date.now()}` : `survey-export-${Date.now()}`,
    timestamp: new Date().toISOString(),
    survey_id: responseContext.surveyId || "",
    survey_name: responseContext.surveyName || "",
    building_id: responseContext.buildingId || "",
    building_name: responseContext.buildingName || "",
    resident_id: responseContext.residentId || "",
    resident_name: responseContext.residentName || "",
    resident_email: responseContext.residentEmail || "",
    partner_id: responseContext.partnerId || "",
    partner_name: responseContext.partnerName || "",
    perk_id: responseContext.perkId || "",
    perk_name: responseContext.perkName || "",
    redemption_id: responseContext.redemptionId || "",
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
  const result = await appendSurveyResponseToGoogleSheet(payload);
  if (result.status === "success") return { status: "success" as const, result };
  if (result.status === "pending_configuration" || result.status === "pending_credentials") {
    return { status: "pending_configuration" as const, result };
  }
  return { status: "failed" as const, error: result.errorMessage || result.error || "Google Sheets export failed.", result };
}
