export type GoogleSheetsStatus = {
  provider: string;
  status: "configured" | "pending_credentials" | "failed";
  spreadsheet_id?: string;
  default_range?: string;
  survey_range?: string;
  lead_range?: string;
  report_range?: string;
  required_env_vars?: string[];
  missing_env_vars?: string[];
};

export type GoogleSheetsAppendResult = {
  status: "success" | "pending_configuration" | "pending_credentials" | "failed";
  error?: string;
  errorMessage?: string;
  spreadsheetId?: string;
  sheetId?: string;
  range?: string;
  updatedRange?: string;
  updatedRows?: number;
  rowNumber?: number;
  googleSheetRowId?: string;
};

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && payload.status !== "pending_configuration") {
    throw new Error(payload.error || payload.errorMessage || `Google Sheets request failed with ${response.status}`);
  }
  return payload;
}

export async function getGoogleSheetsStatus(): Promise<GoogleSheetsStatus> {
  return request("/api/google-sheets/status");
}

export async function testGoogleSheetsConnection(range?: string): Promise<GoogleSheetsAppendResult> {
  return request("/api/google-sheets/test", {
    method: "POST",
    body: JSON.stringify({ range }),
  });
}

export async function appendToGoogleSheet(payload: Record<string, unknown>): Promise<GoogleSheetsAppendResult> {
  try {
    const body = await request("/api/google-sheets/append", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return {
      status: body.status,
      sheetId: body.spreadsheetId,
      spreadsheetId: body.spreadsheetId,
      range: body.range,
      updatedRange: body.updatedRange,
      updatedRows: body.updatedRows,
      googleSheetRowId: body.googleSheetRowId,
      errorMessage: body.error,
    };
  } catch (error) {
    return { status: "failed", errorMessage: error instanceof Error ? error.message : String(error) };
  }
}

export async function appendContactLead(lead: Record<string, unknown>): Promise<GoogleSheetsAppendResult> {
  return appendToGoogleSheet({ type: "contact_lead", lead });
}

export async function appendSurveyResponseToGoogleSheet(response: Record<string, unknown>): Promise<GoogleSheetsAppendResult> {
  return appendToGoogleSheet({ type: "survey_response", response });
}

export async function exportPendingSurveyResponsesToGoogleSheets() {
  return request("/api/google-sheets/export-surveys", { method: "POST" });
}
