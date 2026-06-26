export type GoogleSheetsAppendResult = {
  status: "success" | "pending_configuration" | "failed";
  errorMessage?: string;
  sheetId?: string;
  rowNumber?: number;
  googleSheetRowId?: string;
};

export async function appendContactLead(lead: Record<string, unknown>): Promise<GoogleSheetsAppendResult> {
  const response = await fetch("/api/functions/exportSurveyDataToSheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "contact_lead", lead }),
  }).catch(() => null);

  if (!response) {
    return { status: "pending_configuration", errorMessage: "Google Sheets export function is not reachable in this environment." };
  }

  if (!response.ok) {
    return { status: "failed", errorMessage: `Google Sheets export failed with ${response.status}` };
  }

  const body = await response.json().catch(() => ({}));
  return { status: "success", sheetId: body.sheetId, rowNumber: body.rowNumber, googleSheetRowId: body.googleSheetRowId };
}

export async function appendSurveyResponseToGoogleSheet(response: Record<string, unknown>): Promise<GoogleSheetsAppendResult> {
  return appendContactLead({ ...response, source: "survey_response" });
}
