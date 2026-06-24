import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Processes a survey completion: saves SurveyResponse, exports to Google Sheets,
// sends management notification, and creates audit logs.
// Called from the frontend when a resident completes a survey.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      survey_id, answers, score, sentiment, source_flow,
      building_id, perk_id, partner_id, redemption_id, map_entity_id,
      district, category,
    } = body;

    if (!survey_id) {
      return Response.json({ error: 'Missing survey_id' }, { status: 400 });
    }

    // ---- Enrich data in parallel ----
    const surveyPromise = base44.asServiceRole.entities.Survey.get(survey_id).catch(() => null);
    const buildingPromise = building_id
      ? base44.asServiceRole.entities.Building.get(building_id).catch(() => null)
      : Promise.resolve(null);
    const perkPromise = perk_id
      ? base44.asServiceRole.entities.PerkLocation.get(perk_id).catch(() => null)
      : Promise.resolve(null);
    const partnerPromise = partner_id
      ? base44.asServiceRole.entities.Partner.get(partner_id).catch(() => null)
      : Promise.resolve(null);

    const [survey, building, perk, partner] = await Promise.all([
      surveyPromise, buildingPromise, perkPromise, partnerPromise,
    ]);

    // Derive partner from perk if not explicitly provided
    const resolvedPartnerId = partner_id || perk?.partner_id || '';
    const resolvedPartner = partner || (resolvedPartnerId
      ? await base44.asServiceRole.entities.Partner.get(resolvedPartnerId).catch(() => null)
      : null);

    // ---- Create SurveyResponse (local-first: save before any external calls) ----
    const completedAt = new Date().toISOString();
    const surveyResponse = await base44.entities.SurveyResponse.create({
      survey_id,
      survey_name: survey?.title || '',
      resident_name: user.full_name || 'Anonymous',
      resident_email: user.email || '',
      building_id: building_id || '',
      building_name: building?.name || '',
      partner_id: resolvedPartnerId,
      partner_name: resolvedPartner?.business_name || '',
      perk_id: perk_id || '',
      perk_name: perk?.name || '',
      redemption_id: redemption_id || '',
      map_entity_id: map_entity_id || '',
      district: district || perk?.district || building?.district || '',
      category: category || perk?.category || '',
      answers: answers || [],
      score: score ?? null,
      sentiment: sentiment || null,
      completed_at: completedAt,
      exported_to_google_sheets: false,
      notification_sent: false,
      source_flow: source_flow || 'resident-survey',
    });

    // ---- Attempt Google Sheets export (non-blocking on failure) ----
    let exportStatus = 'failed';
    let exportError = null;
    let sheetRowRef = null;

    try {
      const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SURVEY_SPREADSHEET_ID');
      const tabName = 'Survey Responses';

      if (!spreadsheetId) {
        throw new Error('GOOGLE_SHEETS_SURVEY_SPREADSHEET_ID not configured');
      }

      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

      const rowData = [
        completedAt,
        surveyResponse.resident_name,
        surveyResponse.resident_email,
        surveyResponse.building_name,
        '',
        surveyResponse.survey_name,
        surveyResponse.source_flow,
        surveyResponse.partner_name,
        surveyResponse.perk_name,
        surveyResponse.redemption_id,
        surveyResponse.district,
        surveyResponse.category,
        surveyResponse.score ?? '',
        surveyResponse.sentiment || '',
        JSON.stringify(answers || []),
        'success',
        surveyResponse.id,
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
      sheetRowRef = appendData?.updates?.updatedRange || 'appended';
      exportStatus = 'success';
    } catch (err) {
      exportError = err.message;
      exportStatus = 'failed';
    }

    // ---- Create SurveyExportLog ----
    await base44.asServiceRole.entities.SurveyExportLog.create({
      survey_response_id: surveyResponse.id,
      destination: 'google-sheets',
      status: exportStatus,
      attempted_at: completedAt,
      completed_at: new Date().toISOString(),
      error_message: exportError,
      sheet_id: Deno.env.get('GOOGLE_SHEETS_SURVEY_SPREADSHEET_ID') || '',
      row_number: null,
      retry_count: 0,
    });

    // Update SurveyResponse with export result
    if (exportStatus === 'success') {
      await base44.entities.SurveyResponse.update(surveyResponse.id, {
        exported_to_google_sheets: true,
        google_sheet_row_id: sheetRowRef,
      });
    }

    // ---- Send management notification (non-blocking on failure) ----
    let notificationStatus = 'failed';
    let notificationError = null;
    let recipientEmail = '';

    try {
      const adminUsers = await base44.asServiceRole.entities.User.list();
      const adminEmails = adminUsers
        .filter(u => u.role === 'admin' && u.email)
        .map(u => u.email);

      if (adminEmails.length === 0) {
        throw new Error('No admin users found to notify');
      }

      recipientEmail = adminEmails[0];

      const emailBody = [
        'A new survey response has been completed.',
        '',
        `Resident: ${surveyResponse.resident_name}`,
        `Building: ${surveyResponse.building_name || 'N/A'}`,
        `Survey: ${surveyResponse.survey_name || 'N/A'}`,
        surveyResponse.partner_name ? `Partner: ${surveyResponse.partner_name}` : '',
        surveyResponse.perk_name ? `Perk: ${surveyResponse.perk_name}` : '',
        surveyResponse.redemption_id ? `Redemption: ${surveyResponse.redemption_id}` : '',
        surveyResponse.score != null ? `Rating: ${surveyResponse.score}` : '',
        surveyResponse.sentiment ? `Sentiment: ${surveyResponse.sentiment}` : '',
        '',
        `Google Sheets Export: ${exportStatus === 'success' ? 'Exported' : 'Failed — will retry'}`,
        '',
        'View in dashboard: Downtown Perks Hub',
      ].filter(l => l !== '').join('\n');

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipientEmail,
        subject: 'New Downtown Perks survey response completed',
        body: emailBody,
        from_name: 'Downtown Perks Hub',
      });

      notificationStatus = 'sent';
    } catch (err) {
      notificationError = err.message;
      notificationStatus = 'failed';
    }

    // ---- Create ManagementNotification record ----
    await base44.asServiceRole.entities.ManagementNotification.create({
      type: redemption_id ? 'redemption-survey-completed' : 'survey-completed',
      resident_name: surveyResponse.resident_name,
      building_id: surveyResponse.building_id,
      building_name: surveyResponse.building_name,
      survey_response_id: surveyResponse.id,
      redemption_id: surveyResponse.redemption_id || '',
      partner_id: surveyResponse.partner_id || '',
      partner_name: surveyResponse.partner_name || '',
      perk_id: surveyResponse.perk_id || '',
      perk_name: surveyResponse.perk_name || '',
      message: `Survey completed by ${surveyResponse.resident_name} — ${surveyResponse.survey_name || 'Survey'}`,
      status: notificationStatus,
      channel: 'email',
      recipient_email: recipientEmail,
      created_at: completedAt,
      sent_at: notificationStatus === 'sent' ? new Date().toISOString() : null,
      error_message: notificationError,
    });

    if (notificationStatus === 'sent') {
      await base44.entities.SurveyResponse.update(surveyResponse.id, {
        notification_sent: true,
      });
    }

    // ---- Increment survey responses_count ----
    try {
      const currentCount = survey?.responses_count || 0;
      await base44.asServiceRole.entities.Survey.update(survey_id, {
        responses_count: currentCount + 1,
      });
    } catch (_) { /* non-critical */ }

    return Response.json({
      success: true,
      response_id: surveyResponse.id,
      export_status: exportStatus,
      notification_status: notificationStatus,
    });

  } catch (error) {
    console.error('processSurveyResponse error:', error);
    return Response.json({ error: error.message || 'Failed to process survey response' }, { status: 500 });
  }
});