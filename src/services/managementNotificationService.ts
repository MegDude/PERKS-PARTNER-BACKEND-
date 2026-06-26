const WEBHOOK_URL = (import.meta as any).env?.VITE_MANAGEMENT_SURVEY_NOTIFICATION_WEBHOOK_URL;

export type ManagementSurveyNotificationContext = {
  timestamp?: string;
  buildingId?: string;
  buildingName?: string;
  residentIdOrSessionId?: string;
  surveyId?: string;
  perkId?: string;
  redemptionId?: string;
  exportStatus?: string;
  answersSummary?: string;
};

export async function sendManagementNotification(context: ManagementSurveyNotificationContext) {
  const payload = {
    eventType: "survey_completed",
    timestamp: context.timestamp || new Date().toISOString(),
    buildingId: context.buildingId || "",
    buildingName: context.buildingName || "",
    residentIdOrSessionId: context.residentIdOrSessionId || "anonymous",
    surveyId: context.surveyId || "",
    perkId: context.perkId || "",
    redemptionId: context.redemptionId || "",
    exportStatus: context.exportStatus || "unknown",
    answersSummary: context.answersSummary || "",
  };

  if (!WEBHOOK_URL) return { status: "skipped" as const, payload };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
    return { status: "sent" as const, payload };
  } catch (error) {
    return { status: "failed" as const, error: error instanceof Error ? error.message : String(error), payload };
  }
}
