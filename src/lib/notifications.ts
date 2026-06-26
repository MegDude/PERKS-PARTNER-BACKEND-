export type ManagementNotification = {
  id: string;
  type: "survey-completed" | "redemption-survey-completed" | "system";
  message: string;
  channel: "email" | "in-app";
  status: "sent" | "pending_configuration" | "failed";
  createdAt: string;
  sentAt?: string;
  metadata?: Record<string, unknown>;
};

export function buildSurveyManagementMessage(response: Record<string, unknown>, exportStatus: string) {
  return [
    "New Downtown Perks survey response completed",
    `Resident: ${String(response.residentName || "Resident")}`,
    `Building: ${String(response.buildingName || response.buildingId || "Not provided")}`,
    response.unitId ? `Unit: ${String(response.unitId)}` : "",
    `Survey: ${String(response.surveyName || "Survey")}`,
    response.partnerName ? `Partner: ${String(response.partnerName)}` : "",
    response.perkName ? `Perk: ${String(response.perkName)}` : "",
    response.redemptionId ? `Redemption: ${String(response.redemptionId)}` : "",
    response.score ? `Rating: ${String(response.score)}` : "",
    response.sentiment ? `Sentiment: ${String(response.sentiment)}` : "",
    `Google Sheet export: ${exportStatus}`,
    `/map?mode=partner&tab=reports&filter=Surveys&responseId=${encodeURIComponent(String(response.id || ""))}`,
  ].filter(Boolean).join("\n");
}

export async function sendSurveyManagementNotification(response: Record<string, unknown>, exportStatus: string): Promise<ManagementNotification> {
  const message = buildSurveyManagementMessage(response, exportStatus);
  const notification = {
    id: `management-note-${String(response.id || Date.now())}`,
    type: response.redemptionId ? "redemption-survey-completed" : "survey-completed",
    message,
    channel: "in-app",
    status: "pending_configuration",
    createdAt: new Date().toISOString(),
    metadata: response,
  };

  const apiResponse = await fetch("/api/entities/ManagementNotification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notification),
  }).catch(() => null);

  if (!apiResponse || !apiResponse.ok) return notification as ManagementNotification;
  return { ...(await apiResponse.json()), status: "sent", sentAt: new Date().toISOString() };
}
