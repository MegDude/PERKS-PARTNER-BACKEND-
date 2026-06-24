import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Monthly Partner Redemption Report
// - Writes a per-partner redemption summary row to a Google Sheet tab (appends, never overwrites)
// - Sends an HTML email summary to each active partner venue
// Designed to run as a scheduled automation (service role, no authenticated user).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow manual override of the reporting month via JSON body (for testing)
    let yearMonth = null;
    try {
      const body = await req.json();
      if (body && body.year_month) yearMonth = body.year_month;
    } catch (_) { /* scheduled invocation has no JSON body */ }

    // ── Determine reporting window (previous full month by default) ─────────
    const now = new Date();
    const reportDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = yearMonth ? parseInt(yearMonth.split('-')[0]) : reportDate.getFullYear();
    const month = yearMonth ? parseInt(yearMonth.split('-')[1]) : reportDate.getMonth() + 1;
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 1));
    const prevMonthStart = new Date(Date.UTC(year, month - 2, 1));
    const prevMonthEnd = new Date(Date.UTC(year, month - 1, 1));
    const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const periodCode = `${year}-${String(month).padStart(2, '0')}`;

    // ── Fetch Google Sheets OAuth token ───────────────────────────────────
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // ── Resolve the tracking spreadsheet ID ───────────────────────────────
    // Priority: GlobalSettings (persisted from a prior run) → env secret → create new
    let spreadsheetId = null;
    let spreadsheetUrl = null;

    // 1. Check GlobalSettings for a previously created spreadsheet
    const settings = await base44.asServiceRole.entities.GlobalSettings.list();
    const globalSettings = settings[0];

    if (globalSettings?.partner_report_spreadsheet_id) {
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${globalSettings.partner_report_spreadsheet_id}?fields=spreadsheetId,spreadsheetUrl`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (checkRes.ok) {
        const checkMeta = await checkRes.json();
        spreadsheetId = checkMeta.spreadsheetId;
        spreadsheetUrl = checkMeta.spreadsheetUrl;
      }
    }

    // 2. Fall back to the env-configured secret
    if (!spreadsheetId) {
      const configuredSheetId = Deno.env.get("GOOGLE_SHEETS_SURVEY_SPREADSHEET_ID");
      if (configuredSheetId) {
        const checkRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${configuredSheetId}?fields=spreadsheetId,spreadsheetUrl`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        if (checkRes.ok) {
          const checkMeta = await checkRes.json();
          spreadsheetId = checkMeta.spreadsheetId;
          spreadsheetUrl = checkMeta.spreadsheetUrl;
        }
      }
    }

    // 3. Create a new tracking spreadsheet if none is accessible
    if (!spreadsheetId) {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: { title: 'Downtown Perks — Partner Monthly Redemption Reports' },
          sheets: [{ properties: { title: 'Partner Monthly Summary', gridProperties: { columnCount: 11 } } }]
        })
      });
      if (!createRes.ok) throw new Error(`Failed to create tracking spreadsheet: ${await createRes.text()}`);
      const newSheet = await createRes.json();
      spreadsheetId = newSheet.spreadsheetId;
      spreadsheetUrl = newSheet.spreadsheetUrl;

      // Persist the new spreadsheet ID to GlobalSettings for future runs
      if (globalSettings?.id) {
        await base44.asServiceRole.entities.GlobalSettings.update(globalSettings.id, {
          partner_report_spreadsheet_id: spreadsheetId,
          partner_report_spreadsheet_url: spreadsheetUrl
        });
      } else {
        await base44.asServiceRole.entities.GlobalSettings.create({
          business_name: 'Downtown Perks Hub',
          partner_report_spreadsheet_id: spreadsheetId,
          partner_report_spreadsheet_url: spreadsheetUrl
        });
      }
    }

    // ── Fetch all data in parallel ─────────────────────────────────────────
    const [rawPartners, perkLocations, allRedemptions] = await Promise.all([
      base44.asServiceRole.entities.Partner.filter({ is_active: true }),
      base44.asServiceRole.entities.PerkLocation.list(),
      base44.asServiceRole.entities.PerkRedemption.list()
    ]);

    // Deduplicate partners by email
    const seenEmails = new Set();
    const partners = rawPartners.filter(p => {
      const email = (p.contact_email || '').toLowerCase().trim();
      if (!email || seenEmails.has(email)) return false;
      seenEmails.add(email);
      return true;
    });

    // Map perk_id -> partner_id
    const perkToPartner = {};
    for (const pl of perkLocations) {
      perkToPartner[pl.id] = pl.partner_id;
    }

    // Filter redemptions by date windows
    const monthlyRedemptions = allRedemptions.filter(r => {
      if (!r.redeemed_at) return false;
      const d = new Date(r.redeemed_at);
      return d >= monthStart && d < monthEnd;
    });
    const prevMonthRedemptions = allRedemptions.filter(r => {
      if (!r.redeemed_at) return false;
      const d = new Date(r.redeemed_at);
      return d >= prevMonthStart && d < prevMonthEnd;
    });

    // ── Compute per-partner stats ─────────────────────────────────────────
    const partnerStats = [];
    for (const partner of partners) {
      const partnerRedemptions = monthlyRedemptions.filter(r =>
        perkToPartner[r.perk_id] === partner.id
      );
      const partnerPrevRedemptions = prevMonthRedemptions.filter(r =>
        perkToPartner[r.perk_id] === partner.id
      );

      const totalRedemptions = partnerRedemptions.length;
      const uniqueCustomers = new Set(partnerRedemptions.map(r => r.user_email)).size;
      const prevTotal = partnerPrevRedemptions.length;
      const changePct = prevTotal > 0
        ? Math.round(((totalRedemptions - prevTotal) / prevTotal) * 100)
        : null;

      // Top perk by redemption count
      const perkCounts = {};
      for (const r of partnerRedemptions) {
        const name = r.perk_name || 'Unknown';
        perkCounts[name] = (perkCounts[name] || 0) + 1;
      }
      const sortedPerks = Object.entries(perkCounts).sort((a, b) => b[1] - a[1]);
      const topPerk = sortedPerks[0] ? sortedPerks[0][0] : '';
      const topPerkCount = sortedPerks[0] ? sortedPerks[0][1] : 0;

      partnerStats.push({
        partner,
        totalRedemptions,
        uniqueCustomers,
        prevTotal,
        changePct,
        topPerk,
        topPerkCount
      });
    }

    // ── Write summary rows to Google Sheet ────────────────────────────────
    let sheetWriteResult = null;
    if (spreadsheetId && accessToken) {
      const TAB_NAME = 'Partner Monthly Summary';
      const HEADERS = [
        'Report Month', 'Period Code', 'Partner Name', 'Contact Email',
        'Total Redemptions', 'Unique Customers', 'Previous Month Redemptions',
        'MoM Change %', 'Top Perk', 'Top Perk Count', 'Generated At'
      ];

      // Build rows for this run
      const timestamp = new Date().toISOString();
      const newRows = partnerStats.map(s => [
        monthLabel,
        periodCode,
        s.partner.business_name || '',
        s.partner.contact_email || '',
        String(s.totalRedemptions),
        String(s.uniqueCustomers),
        String(s.prevTotal),
        s.changePct === null ? '' : String(s.changePct),
        s.topPerk,
        String(s.topPerkCount),
        timestamp
      ]);

      try {
        // Fetch spreadsheet metadata to find the tab
        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        const meta = await metaRes.json();
        const existingTab = (meta.sheets || []).find(s => s.properties?.title === TAB_NAME);

        if (!existingTab) {
          // Create the tab with headers
          const addSheetRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requests: [{
                  addSheet: {
                    properties: {
                      title: TAB_NAME,
                      gridProperties: { columnCount: HEADERS.length }
                    }
                  }
                }]
              })
            }
          );
          if (!addSheetRes.ok) throw new Error(`Failed to create tab: ${await addSheetRes.text()}`);
          const newSheetId = (await addSheetRes.json()).replies[0].addSheet.properties.sheetId;

          // Write headers
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${TAB_NAME}'!A1?valueInputOption=RAW`,
            {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ values: [HEADERS] })
            }
          );

          // Format header row (bold + frozen + auto-resize)
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requests: [
                  {
                    repeatCell: {
                      range: { sheetId: newSheetId, startRowIndex: 0, endRowIndex: 1 },
                      cell: { userEnteredFormat: { textFormat: { bold: true } } },
                      fields: 'userEnteredFormat.textFormat.bold'
                    }
                  },
                  {
                    updateSheetProperties: {
                      properties: { sheetId: newSheetId, gridProperties: { frozenRowCount: 1 } },
                      fields: 'gridProperties.frozenRowCount'
                    }
                  },
                  {
                    autoResizeDimensions: {
                      dimensions: { sheetId: newSheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: HEADERS.length }
                    }
                  }
                ]
              })
            }
          );
        }

        // Find the next empty row to append
        const valuesRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${TAB_NAME}'!A:A`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        const valuesData = await valuesRes.json();
        const nextRow = (valuesData.values?.length || 0) + 1;

        // Write the new rows starting at the next empty row
        const appendRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${TAB_NAME}'!A${nextRow}?valueInputOption=RAW`,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: newRows })
          }
        );

        if (!appendRes.ok) throw new Error(`Failed to write rows: ${await appendRes.text()}`);

        sheetWriteResult = {
          tab: TAB_NAME,
          rows_appended: newRows.length,
          starting_row: nextRow,
          spreadsheet_url: spreadsheetUrl
        };
      } catch (sheetErr) {
        sheetWriteResult = { error: sheetErr.message };
      }
    } else {
      sheetWriteResult = { error: 'No spreadsheet ID configured and creation failed' };
    }

    // ── Send email summary to each partner ────────────────────────────────
    let emailsSent = 0;
    let emailsSkipped = 0;
    const emailErrors = [];

    for (const stat of partnerStats) {
      const { partner, totalRedemptions, uniqueCustomers, changePct, topPerk, topPerkCount } = stat;
      if (!partner.contact_email) {
        emailsSkipped++;
        continue;
      }

      const changeDisplay = changePct === null
        ? '<span style="color:#8B9AAB;">No prior data</span>'
        : `<span style="color:${changePct >= 0 ? '#10B981' : '#EF4444'};">${changePct >= 0 ? '▲' : '▼'} ${Math.abs(changePct)}%</span>`;

      const topPerkRow = topPerk
        ? `<tr>
            <td style="padding:10px 16px;color:#5A6B7D;font-size:13px;border-bottom:1px solid #f0f0f0;">Top Perk</td>
            <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0B1F33;border-bottom:1px solid #f0f0f0;">${topPerk} (${topPerkCount} redemptions)</td>
          </tr>`
        : '';

      const emailBody = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
          <div style="background:#0B1F33;padding:24px 32px;text-align:center;">
            <h1 style="color:#C9A227;font-size:18px;margin:0;letter-spacing:1px;text-transform:uppercase;">Monthly Redemption Report</h1>
            <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0;">${monthLabel}</p>
          </div>
          <div style="padding:32px;">
            <p style="font-size:15px;color:#0B1F33;margin:0 0 4px;">Hi ${partner.business_name},</p>
            <p style="font-size:14px;color:#5A6B7D;line-height:1.6;margin:0 0 24px;">
              Here's your Downtown Perks redemption performance summary for ${monthLabel}. This data is also logged to our Google Sheet for ongoing tracking.
            </p>
            <table style="width:100%;border-collapse:collapse;background:#F7F9FC;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;color:#5A6B7D;font-size:13px;border-bottom:1px solid #f0f0f0;">Total Redemptions</td>
                <td style="padding:12px 16px;font-size:16px;font-weight:700;color:#0B1F33;border-bottom:1px solid #f0f0f0;text-align:right;">${totalRedemptions}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;color:#5A6B7D;font-size:13px;border-bottom:1px solid #f0f0f0;">Unique Customers</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0B1F33;border-bottom:1px solid #f0f0f0;text-align:right;">${uniqueCustomers}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;color:#5A6B7D;font-size:13px;border-bottom:1px solid #f0f0f0;">vs Previous Month</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:600;border-bottom:1px solid #f0f0f0;text-align:right;">${changeDisplay}</td>
              </tr>
              ${topPerkRow}
            </table>
            <div style="background:#C9A227;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="color:#0B1F33;font-size:14px;font-weight:600;margin:0;">
                💡 ${totalRedemptions > 0
                  ? `Great work this month! Residents redeemed ${totalRedemptions} perk${totalRedemptions !== 1 ? 's' : ''} at your venue.`
                  : 'No redemptions this month. Consider refreshing your perk offers to attract more residents.'}
              </p>
            </div>
            <p style="font-size:12px;color:#8B9AAB;margin:0;text-align:center;">
              This report was generated automatically by Downtown Perks and logged to Google Sheets.<br/>
              Questions? Reply to this email or visit your Partner Portal.
            </p>
          </div>
        </div>
      `;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: partner.contact_email,
          subject: `Downtown Perks Monthly Redemption Report — ${monthLabel}`,
          body: emailBody,
          from_name: 'Downtown Perks',
        });
        emailsSent++;
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        emailErrors.push({ partner: partner.business_name, error: e.message });
      }
    }

    return Response.json({
      success: true,
      report_month: monthLabel,
      period_code: periodCode,
      partners_emailed: emailsSent,
      partners_skipped: emailsSkipped,
      total_redemptions_in_month: monthlyRedemptions.length,
      google_sheets_result: sheetWriteResult,
      email_errors: emailErrors
    });
  } catch (error) {
    console.error('Monthly partner redemption report error:', error);
    return Response.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
});