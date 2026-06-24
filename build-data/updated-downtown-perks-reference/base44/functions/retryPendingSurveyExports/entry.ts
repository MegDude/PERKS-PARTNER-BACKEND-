import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Retries pending/failed Google Sheets exports for survey responses.
// Admin-only: called manually from dashboard or via scheduled automation.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Find all failed/pending export logs
    const logs = await base44.asServiceRole.entities.SurveyExportLog.list();
    const pendingLogs = logs.filter(l => l.status === 'failed' || l.status === 'pending');

    if (pendingLogs.length === 0) {
      return Response.json({ success: true, message: 'No pending exports to retry', retried: 0 });
    }

    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SURVEY_SPREADSHEET_ID');
    const tabName = 'Survey Responses';

    if (!spreadsheetId) {
      return Response.json({
        success: false,
        error: 'GOOGLE_SHEETS_SURVEY_SPREADSHEET_ID not configured',
        pending_count: pendingLogs.length,
      }, { status: 400 });
    }

    // Get OAuth token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch all survey responses for enrichment
    const allResponses = await base44.asServiceRole.entities.SurveyResponse.list();
    const responseMap = new Map(allResponses.map(r => [r.id, r]));

    let succeeded = 0;
    let failed = 0;
    const results = [];

    for (const log of pendingLogs) {
      const response = responseMap.get(log.survey_response_id);
      if (!response) {
        failed++;
        results.push({ id: log.id, status: 'failed', error: 'SurveyResponse not found' });
        continue;
      }

      // Idempotency: skip if already exported
      if (response.exported_to_google_sheets) {
        await base44.asServiceRole.entities.SurveyExportLog.update(log.id, {
          status: 'success',
          completed_at: new Date().toISOString(),
          error_message: null,
        });
        succeeded++;
        continue;
      }

      try {
        const rowData = [
          response.completed_at,
          response.resident_name,
          response.resident_email,
          response.building_name,
          '',
          response.survey_name,
          response.source_flow,
          response.partner_name,
          response.perk_name,
          response.redemption_id,
          response.district,
          response.category,
          response.score ?? '',
          response.sentiment || '',
          JSON.stringify(response.answers || []),
          'success',
          response.id,
        ];

        const appendRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A:Q:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [rowData] }),
          }
        );

        if (!appendRes.ok) {
          const errText = await appendRes.text();
          throw new Error(`Sheets API: ${errText}`);
        }

        const appendData = await appendRes.json();
        const rowRef = appendData?.updates?.updatedRange || 'appended';

        // Update export log
        await base44.asServiceRole.entities.SurveyExportLog.update(log.id, {
          status: 'success',
          completed_at: new Date().toISOString(),
          error_message: null,
          retry_count: (log.retry_count || 0) + 1,
        });

        // Update survey response
        await base44.asServiceRole.entities.SurveyResponse.update(response.id, {
          exported_to_google_sheets: true,
          google_sheet_row_id: rowRef,
        });

        succeeded++;
        results.push({ id: log.id, response_id: response.id, status: 'success' });
      } catch (err) {
        await base44.asServiceRole.entities.SurveyExportLog.update(log.id, {
          status: 'failed',
          attempted_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          error_message: err.message,
          retry_count: (log.retry_count || 0) + 1,
        });
        failed++;
        results.push({ id: log.id, response_id: response.id, status: 'failed', error: err.message });
      }
    }

    return Response.json({
      success: true,
      retried: pendingLogs.length,
      succeeded,
      failed,
      results,
    });

  } catch (error) {
    console.error('retryPendingSurveyExports error:', error);
    return Response.json({ error: error.message || 'Failed to retry exports' }, { status: 500 });
  }
});