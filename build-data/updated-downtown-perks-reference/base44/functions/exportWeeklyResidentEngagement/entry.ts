import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Exports weekly resident engagement and perk redemption summary to Google Sheets.
// Creates a new spreadsheet with tabs for resident engagement metrics and redemption activity.
// Designed to run as a scheduled automation (weekly).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get Google Sheets OAuth access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch all data in parallel
    const [tenants, flats, buildings, redemptions, perks, events, rsvps] = await Promise.all([
      base44.asServiceRole.entities.Tenant.list(),
      base44.asServiceRole.entities.Flat.list(),
      base44.asServiceRole.entities.Building.list(),
      base44.asServiceRole.entities.PerkRedemption.list(),
      base44.asServiceRole.entities.PerkLocation.list(),
      base44.asServiceRole.entities.Event.list(),
      base44.asServiceRole.entities.EventRSVP.list()
    ]);

    // Build lookup maps
    const buildingMap = {};
    buildings.forEach(b => { buildingMap[b.id] = b; });
    const flatMap = {};
    flats.forEach(f => { flatMap[f.id] = f; });
    const perkMap = {};
    perks.forEach(p => { perkMap[p.id] = p; });

    // Calculate engagement metrics per resident
    const tenantEngagement = {};
    tenants.forEach(t => {
      tenantEngagement[t.id] = {
        tenant: t,
        redemptions: 0,
        eventsAttended: 0,
        flat: flatMap[t.flat_id],
        building: null
      };
      if (t.flat_id && flatMap[t.flat_id]) {
        tenantEngagement[t.id].building = buildingMap[flatMap[t.flat_id].building_id];
      }
    });

    // Count redemptions per tenant
    redemptions.forEach(r => {
      // Find tenant by email
      const tenant = tenants.find(t => t.email === r.user_email);
      if (tenant && tenantEngagement[tenant.id]) {
        tenantEngagement[tenant.id].redemptions += 1;
      }
    });

    // Count event RSVPs per tenant
    rsvps.forEach(r => {
      // Find tenant by registered_by or tenant_id if available
      const tenant = tenants.find(t => t.id === r.tenant_id || t.email === r.user_email);
      if (tenant && tenantEngagement[tenant.id]) {
        tenantEngagement[tenant.id].eventsAttended += 1;
      }
    });

    // ---- Prepare Resident Engagement Summary ----
    const engagementRows = [
      ['Resident Name', 'Email', 'Unit', 'Building', 'Perks Tier', 'Perks Enrolled', 'Payment Status', 'Total Redemptions', 'Events Attended', 'Engagement Score', 'Lease End Date']
    ];

    const sortedTenants = Object.values(tenantEngagement).sort((a, b) => {
      const scoreA = (a.redemptions * 2) + (a.eventsAttended * 3) + (a.tenant.perks_enrolled ? 1 : 0);
      const scoreB = (b.redemptions * 2) + (b.eventsAttended * 3) + (b.tenant.perks_enrolled ? 1 : 0);
      return scoreB - scoreA; // Highest engagement first
    });

    sortedTenants.forEach(({ tenant, redemptions, eventsAttended, flat, building }) => {
      const engagementScore = (redemptions * 2) + (eventsAttended * 3) + (tenant.perks_enrolled ? 1 : 0);
      let engagementLevel = 'Low';
      if (engagementScore >= 10) engagementLevel = 'High';
      else if (engagementScore >= 5) engagementLevel = 'Medium';

      engagementRows.push([
        tenant.name || '',
        tenant.email || '',
        flat?.flat_number || '',
        building?.name || '',
        tenant.perks_tier || 'standard',
        tenant.perks_enrolled ? 'Yes' : 'No',
        tenant.payment_status || 'unpaid',
        String(redemptions),
        String(eventsAttended),
        `${engagementScore} (${engagementLevel})`,
        tenant.lease_end_date || ''
      ]);
    });

    // ---- Prepare Weekly Redemption Activity ----
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const redemptionRows = [
      ['Resident Name', 'Resident Email', 'Perk Name', 'Category', 'Partner', 'District', 'Redeemed At', 'Day of Week']
    ];

    const recentRedemptions = redemptions.filter(r => {
      if (!r.redeemed_at) return false;
      return new Date(r.redeemed_at) >= oneWeekAgo;
    }).sort((a, b) => {
      const da = a.redeemed_at ? new Date(a.redeemed_at).getTime() : 0;
      const db = b.redeemed_at ? new Date(b.redeemed_at).getTime() : 0;
      return db - da;
    });

    recentRedemptions.forEach(r => {
      const perk = perkMap[r.perk_id];
      const redeemedAt = r.redeemed_at || '';
      let dayOfWeek = '';
      if (redeemedAt) {
        const d = new Date(redeemedAt);
        dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }

      redemptionRows.push([
        r.user_name || '',
        r.user_email || '',
        r.perk_name || perk?.name || '',
        r.perk_category || perk?.category || '',
        perk?.name || '',
        perk?.district || '',
        redeemedAt,
        dayOfWeek
      ]);
    });

    // ---- Prepare Summary Statistics ----
    const summaryRows = [
      ['Metric', 'Value'],
      ['Total Residents', String(tenants.length)],
      ['Perks Enrolled', String(tenants.filter(t => t.perks_enrolled).length)],
      ['Enrollment Rate', `${Math.round((tenants.filter(t => t.perks_enrolled).length / tenants.length) * 100) || 0}%`],
      ['Total Redemptions (All Time)', String(redemptions.length)],
      ['Redemptions This Week', String(recentRedemptions.length)],
      ['Total Event RSVPs', String(rsvps.length)],
      ['High Engagement Residents', String(Object.values(tenantEngagement).filter(({ redemptions, eventsAttended, tenant }) => 
        (redemptions * 2) + (eventsAttended * 3) + (tenant.perks_enrolled ? 1 : 0) >= 10).length)],
      ['Medium Engagement Residents', String(Object.values(tenantEngagement).filter(({ redemptions, eventsAttended, tenant }) => {
        const score = (redemptions * 2) + (eventsAttended * 3) + (tenant.perks_enrolled ? 1 : 0);
        return score >= 5 && score < 10;
      }).length)],
      ['Low Engagement Residents', String(Object.values(tenantEngagement).filter(({ redemptions, eventsAttended, tenant }) => 
        (redemptions * 2) + (eventsAttended * 3) + (tenant.perks_enrolled ? 1 : 0) < 5).length)],
      ['Export Date', new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })]
    ];

    // ---- Create a new Google Sheet ----
    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: { title: `Weekly Resident Engagement & Perks Report (${timestamp})` },
        sheets: [
          { properties: { title: 'Summary', gridProperties: { columnCount: 2 } } },
          { properties: { title: 'Resident Engagement', gridProperties: { columnCount: 11 } } },
          { properties: { title: 'Weekly Redemptions', gridProperties: { columnCount: 8 } } }
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

    // ---- Write Summary tab ----
    const summaryWriteRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Summary'!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: summaryRows })
      }
    );

    // ---- Write Resident Engagement tab ----
    const engagementWriteRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Resident Engagement'!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: engagementRows })
      }
    );

    // ---- Write Weekly Redemptions tab ----
    const redemptionWriteRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Weekly Redemptions'!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: redemptionRows })
      }
    );

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
              repeatCell: {
                range: { sheetId: 2, startRowIndex: 0, endRowIndex: 1 },
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
            {
              updateSheetProperties: {
                properties: { sheetId: 2, gridProperties: { frozenRowCount: 1 } },
                fields: 'gridProperties.frozenRowCount'
              }
            },
            // Auto-resize columns
            {
              autoResizeDimensions: { dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 2 } }
            },
            {
              autoResizeDimensions: { dimensions: { sheetId: 1, dimension: 'COLUMNS', startIndex: 0, endIndex: 11 } }
            },
            {
              autoResizeDimensions: { dimensions: { sheetId: 2, dimension: 'COLUMNS', startIndex: 0, endIndex: 8 } }
            }
          ]
        })
      }
    );

    if (!formatRes.ok) {
      const errText = await formatRes.text();
      console.error('Formatting error:', errText);
    }

    return Response.json({
      success: true,
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: spreadsheetUrl,
      residents_exported: engagementRows.length - 1,
      redemptions_exported: redemptionRows.length - 1,
      exported_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Google Sheets export error:', error);
    return Response.json({ error: error.message || 'Failed to export to Google Sheets' }, { status: 500 });
  }
});