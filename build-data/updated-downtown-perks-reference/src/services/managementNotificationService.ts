/**
 * Management Notification Service
 * 
 * Sends a notification to management when a resident completes the survey flow.
 * Uses VITE_MANAGEMENT_SURVEY_NOTIFICATION_WEBHOOK_URL env var.
 * 
 * If the env var is missing, the notification is gracefully skipped — the
 * resident flow still completes normally. A development warning is logged.
 */

const WEBHOOK_URL = import.meta.env.VITE_MANAGEMENT_SURVEY_NOTIFICATION_WEBHOOK_URL;

/**
 * Sends a management notification for a completed survey.
 * 
 * If VITE_MANAGEMENT_SURVEY_NOTIFICATION_WEBHOOK_URL is not set, logs a
 * development warning and returns { status: 'skipped' } without throwing.
 * 
 * @param {Object} context - Survey completion context
 * @param {string} context.timestamp - ISO timestamp
 * @param {string} context.buildingId
 * @param {string} [context.buildingName]
 * @param {string} [context.residentIdOrSessionId]
 * @param {string} context.surveyId
 * @param {string} [context.perkId]
 * @param {string} [context.redemptionId]
 * @param {string} context.exportStatus - Google Sheets export status
 * @param {string} [context.answersSummary] - Summary of answers
 * @returns {Promise<{ status: 'sent' | 'skipped' | 'failed', error?: string }>}
 */
export async function sendManagementNotification(context) {
  if (!WEBHOOK_URL) {
    if (import.meta.env.DEV) {
      console.warn(
        '[managementNotificationService] VITE_MANAGEMENT_SURVEY_NOTIFICATION_WEBHOOK_URL is not set. ' +
        'Management notification will be skipped. ' +
        'The resident flow will continue normally.'
      );
    }
    return { status: 'skipped' };
  }

  const payload = {
    eventType: 'survey_completed',
    timestamp: context.timestamp || new Date().toISOString(),
    buildingId: context.buildingId || '',
    buildingName: context.buildingName || '',
    residentIdOrSessionId: context.residentIdOrSessionId || 'anonymous',
    surveyId: context.surveyId || '',
    perkId: context.perkId || '',
    redemptionId: context.redemptionId || '',
    exportStatus: context.exportStatus || 'unknown',
    answersSummary: context.answersSummary || '',
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Webhook returned ${res.status}`);
    }

    return { status: 'sent' };
  } catch (error) {
    console.error('[managementNotificationService] Failed to send notification:', error.message);
    return { status: 'failed', error: error.message };
  }
}