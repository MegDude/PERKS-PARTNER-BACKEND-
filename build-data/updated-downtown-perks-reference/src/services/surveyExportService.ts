/**
 * Survey Export Service
 * 
 * Sends survey response data to a configurable Google Sheets webhook endpoint.
 * Uses VITE_GOOGLE_SHEETS_SURVEY_WEBHOOK_URL env var.
 * 
 * If the env var is missing, the export is gracefully skipped — the resident
 * flow still completes normally. A development warning is logged.
 */

const WEBHOOK_URL = import.meta.env.VITE_GOOGLE_SHEETS_SURVEY_WEBHOOK_URL;

/**
 * Builds the export payload from a survey response context.
 * 
 * @param {Object} responseContext - The survey completion context
 * @param {string} responseContext.surveyId - Survey ID
 * @param {string} responseContext.buildingId - Building ID
 * @param {string} [responseContext.buildingName] - Building display name
 * @param {string} [responseContext.residentId] - Resident ID or anonymous session ID
 * @param {string} [responseContext.residentName] - Resident name
 * @param {string} [responseContext.residentEmail] - Resident email
 * @param {string} [responseContext.perkId] - Perk ID (redemption context)
 * @param {string} [responseContext.perkName] - Perk name
 * @param {string} [responseContext.redemptionId] - Redemption ID
 * @param {Array} responseContext.answers - Survey answers [{question, answer}]
 * @param {number} [responseContext.score] - Calculated score
 * @param {string} [responseContext.sentiment] - Sentiment result
 * @param {string} [responseContext.sourceRoute] - Route where survey was completed
 * @returns {Object} The formatted export payload
 */
export function buildSurveyExportPayload(responseContext) {
  const {
    surveyId,
    buildingId,
    buildingName,
    residentId,
    residentName,
    residentEmail,
    perkId,
    perkName,
    redemptionId,
    answers,
    score,
    sentiment,
    sourceRoute,
  } = responseContext;

  return {
    timestamp: new Date().toISOString(),
    buildingId: buildingId || '',
    buildingName: buildingName || '',
    residentIdOrSessionId: residentId || residentEmail || 'anonymous',
    surveyId: surveyId || '',
    perkId: perkId || '',
    perkName: perkName || '',
    redemptionId: redemptionId || '',
    answers: answers || [],
    answersSummary: (answers || []).map(a => `${a.question}: ${a.answer}`).join(' | '),
    score: score ?? null,
    sentiment: sentiment || '',
    completionStatus: 'completed',
    sourceRoute: sourceRoute || (typeof window !== 'undefined' ? window.location.pathname : ''),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}

/**
 * Exports a survey response to the configured Google Sheets webhook.
 * 
 * If VITE_GOOGLE_SHEETS_SURVEY_WEBHOOK_URL is not set, logs a development
 * warning and returns { status: 'skipped' } without throwing.
 * 
 * @param {Object} payload - The export payload (from buildSurveyExportPayload)
 * @returns {Promise<{ status: 'success' | 'skipped' | 'failed', error?: string }>}
 */
export async function exportSurveyResponseToSheet(payload) {
  if (!WEBHOOK_URL) {
    if (import.meta.env.DEV) {
      console.warn(
        '[surveyExportService] VITE_GOOGLE_SHEETS_SURVEY_WEBHOOK_URL is not set. ' +
        'Survey export to Google Sheets will be skipped. ' +
        'The resident flow will continue normally.'
      );
    }
    return { status: 'skipped' };
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Webhook returned ${res.status}`);
    }

    return { status: 'success' };
  } catch (error) {
    console.error('[surveyExportService] Failed to export survey response:', error.message);
    return { status: 'failed', error: error.message };
  }
}