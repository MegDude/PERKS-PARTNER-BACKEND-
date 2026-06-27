export type ManagementSurveyNotificationContext = {
  surveyResponseId?: string;
  surveyName?: string;
  residentName?: string;
  residentEmail?: string;
  buildingName?: string;
  partnerName?: string;
  perkName?: string;
  redemptionId?: string;
  score?: number;
  sentiment?: string;
  exportStatus?: string;
};

export type ManagementNotificationResult = {
  status: "sent" | "failed";
  notification?: Record<string, unknown>;
  error?: string;
};

export function buildManagementNotificationPayload(context: ManagementSurveyNotificationContext) {
  const title = context.redemptionId ? "Perk feedback came in" : "Survey response came in";
  const detail = [
    context.residentName || context.residentEmail || "A resident",
    context.surveyName ? `completed ${context.surveyName}` : "shared feedback",
    context.buildingName ? `for ${context.buildingName}` : "",
  ].filter(Boolean).join(" ");

  return {
    type: context.redemptionId ? "redemption-survey-completed" : "survey-completed",
    title,
    message: detail,
    status: "sent",
    channel: "in-app",
    survey_response_id: context.surveyResponseId || "",
    resident_name: context.residentName || "",
    resident_email: context.residentEmail || "",
    building_name: context.buildingName || "",
    partner_name: context.partnerName || "",
    perk_name: context.perkName || "",
    redemption_id: context.redemptionId || "",
    score: context.score ?? null,
    sentiment: context.sentiment || "",
    export_status: context.exportStatus || "not checked",
    sent_at: new Date().toISOString(),
  };
}

export async function sendManagementNotification(context: ManagementSurveyNotificationContext): Promise<ManagementNotificationResult> {
  const payload = buildManagementNotificationPayload(context);
  const response = await fetch("/api/entities/ManagementNotification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((error) => ({ ok: false, json: async () => ({ error: error instanceof Error ? error.message : String(error) }) } as Response));

  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { status: "failed", error: body.error || "Notification could not be saved." };
  return { status: "sent", notification: body };
}
