import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Exports survey participation data and redemption trends to a Google Sheet.
// Creates a new spreadsheet with two tabs each run and returns the URL.
// Designed to run as a scheduled automation (service role + Google Sheets OAuth).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get Google Sheets OAuth access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch all data in parallel
    const [surveys, buildings, redemptions, perks, partners] = await Promise.all([
      base44.asServiceRole.entities.Survey.list(),
      base44.asServiceRole.entities.Building.list(),
      base44.asServiceRole.entities.PerkRedemption.list(),
      base44.asServiceRole.entities.PerkLocation.list(),
      base44.asServiceRole.entities.Partner.list()
    ]);

    // Build lookup maps
    const buildingMap = {};
    buildings.forEach(b => { buildingMap[b.id] = b; });
    const perkMap = {};
    perks.forEach(p => { perkMap[p.id] = p; });
    const partnerMap = {};
    partners.forEach(p => { partnerMap[p.id] = p; });

    // ---- Prepare Survey Participation rows ----
    const surveyRows = [['Survey Title', 'Building', 'Status', 'Responses', 'Target Residents', 'Participation Rate', 'Start Date', 'End Date', 'Questions Count']];
    surveys.forEach(s => {
      const building = buildingMap[s.building_id];
      const responses = s.responses_count || 0;
      const target = s.target_residents || 0;
      const rate = target > 0 ? `${Math.round((responses / target) * 100)}%` : '—';
      const questions = Array.isArray(s.questions) ? s.questions.length : 0;
      surveyRows.push([
        s.title || '',
        building?.name || s.building_id || '',
        s.status || '',
        String(responses),
        String(target),
        rate,
        s.starts_at || '',
        s.ends_at || '',
        String(questions)
      ]);
    });

    // ---- Prepare Redemption Trends rows ----
    const redemptionRows = [['Resident Name', 'Resident Email', 'Perk Name', 'Category', 'Partner', 'Building (via Perk)', 'Redeemed At', 'Month']];
    const sortedRedemptions = [...redemptions].sort((a, b) => {
      const da = a.redeemed_at ? new Date(a.redeemed_at).getTime() : 0;
      const db = b.redeemed_at ? new Date(b.redeemed_at).getTime() : 0;
      return db - da;
    });
    sortedRedemptions.forEach(r => {
      const perk = perkMap[r.perk_id];
      const partner = perk ? partnerMap[perk.partner_id] : null;
      const redeemedAt = r.redeemed_at || '';
      let monthLabel = '';
      if (redeemedAt) {
        const d = new Date(redeemedAt);
        monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      redemptionRows.push([
        r.user_name || '',
        r.user_email || '',
        r.perk_name || perk?.name || '',
        r.perk_category || perk?.category || '',
        partner?.business_name || '',
        perk?.district || '',
        redeemedAt,
        monthLabel
      ]);
    });

    // ---- Create a new Google Sheet ----
    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: { title: `Downtown Perks — Survey & Redemption Export (${timestamp})` },
        sheets: [
          { properties: { title: 'Survey Participation', gridProperties: { columnCount: 9 } } },
          { properties: { title: 'Redemption Trends', gridProperties: { columnCount: 8 } } }
        ]
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return Response.json({ error: `Failed to create spreadsheet: ${errText}` }, { status: 500 });
    }

    const sheet = await createRes.json();
    const spreadsheetId = sheet.spreadsheetId;
    const spreadsheetUrl = sheet.spreadsheetUrl;

    // ---- Write Survey Participation tab ----
    const surveyWriteRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Survey Participation'!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: surveyRows })
      }
    );

    if (!surveyWriteRes.ok) {
      const errText = await surveyWriteRes.text();
      return Response.json({ error: `Failed to write survey data: ${errText}` }, { status: 500 });
    }

    // ---- Write Redemption Trends tab ----
    const redemptionWriteRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Redemption Trends'!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: redemptionRows })
      }
    );

    if (!redemptionWriteRes.ok) {
      const errText = await redemptionWriteRes.text();
      return Response.json({ error: `Failed to write redemption data: ${errText}` }, { status: 500 });
    }

    // ---- Format header rows (bold + freeze) ----
    const formatRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              repeatCell: {
                range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
                cell: { userEnteredFormat: { textFormat: { bold: true } } },
                fields: 'userEnteredFormat.textFormat.bold'
              }
            },
            {
              repeatCell: {
                range: { sheetId: 1, startRowIndex: 0, endRowIndex: 1 },
                cell: { userEnteredFormat: { textFormat: { bold: true } } },
                fields: 'userEnteredFormat.textFormat.bold'
              }
            },
            {
              updateSheetProperties: {
                properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } },
                fields: 'gridProperties.frozenRowCount'
              }
            },
            {
              updateSheetProperties: {
                properties: { sheetId: 1, gridProperties: { frozenRowCount: 1 } },
                fields: 'gridProperties.frozenRowCount'
              }
            },
            // Auto-resize columns on both sheets
            {
              autoResizeDimensions: { dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 9 } }
            },
            {
              autoResizeDimensions: { dimensions: { sheetId: 1, dimension: 'COLUMNS', startIndex: 0, endIndex: 8 } }
            }
          ]
        })
      }
    );

    return Response.json({
      success: true,
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: spreadsheetUrl,
      survey_rows_exported: surveyRows.length - 1,
      redemption_rows_exported: redemptionRows.length - 1,
      exported_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Google Sheets export error:', error);
    return Response.json({ error: error.message || 'Failed to export to Google Sheets' }, { status: 500 });
  }
});