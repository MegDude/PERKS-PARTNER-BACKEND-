import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ── Determine reporting window (previous full month) ─────────────────
    const now = new Date();
    const reportMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);

    const monthLabel = reportMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // ── Fetch all data via service role ─────────────────────────────────
    const rawPartners = await base44.asServiceRole.entities.Partner.filter({ is_active: true });
    // Deduplicate by email (database may contain duplicate partner records)
    const seenEmails = new Set();
    const partners = rawPartners.filter(p => {
      const email = (p.contact_email || '').toLowerCase().trim();
      if (!email || seenEmails.has(email)) return false;
      seenEmails.add(email);
      return true;
    });
    const perkLocations = await base44.asServiceRole.entities.PerkLocation.list();

    // Map perk_id -> partner_id and group perks by partner
    const perkToPartner = {};
    const partnerPerkMap = {};
    for (const pl of perkLocations) {
      perkToPartner[pl.id] = pl.partner_id;
      if (pl.partner_id) {
        if (!partnerPerkMap[pl.partner_id]) partnerPerkMap[pl.partner_id] = [];
        partnerPerkMap[pl.partner_id].push(pl);
      }
    }

    // Fetch all redemptions and filter by date
    const allRedemptions = await base44.asServiceRole.entities.PerkRedemption.list();

    const monthlyRedemptions = allRedemptions.filter(r => {
      if (!r.redeemed_at) return false;
      const d = new Date(r.redeemed_at);
      return d >= startOfMonth && d <= endOfMonth;
    });

    const prevMonthRedemptions = allRedemptions.filter(r => {
      if (!r.redeemed_at) return false;
      const d = new Date(r.redeemed_at);
      return d >= startOfPrevMonth && d <= endOfPrevMonth;
    });

    // ── Compute stats + send email per partner ─────────────────────────
    let emailsSent = 0;
    let emailsSkipped = 0;
    const errors = [];

    for (const partner of partners) {
      if (!partner.contact_email) {
        emailsSkipped++;
        continue;
      }

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
      const topPerk = sortedPerks[0] || null;

      // Partner's active perks
      const activePerkCount = (partnerPerkMap[partner.id] || []).filter(p => p.is_active !== false).length;

      // ── Build HTML email ──────────────────────────────────────────────
      const changeDisplay = changePct === null
        ? '<span style="color:#8B9AAB;">No prior data</span>'
        : `<span style="color:${changePct >= 0 ? '#10B981' : '#EF4444'};">${changePct >= 0 ? '▲' : '▼'} ${Math.abs(changePct)}%</span>`;

      const topPerkRow = topPerk
        ? `<tr>
            <td style="padding:10px 16px;color:#5A6B7D;font-size:13px;border-bottom:1px solid #f0f0f0;">Top Perk</td>
            <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0B1F33;border-bottom:1px solid #f0f0f0;">${topPerk[0]} (${topPerk[1]} redemptions)</td>
          </tr>`
        : '';

      const emailBody = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
          <div style="background:#0B1F33;padding:24px 32px;text-align:center;">
            <h1 style="color:#C9A227;font-size:18px;margin:0;letter-spacing:1px;text-transform:uppercase;">Monthly Performance Report</h1>
            <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0;">${monthLabel}</p>
          </div>

          <div style="padding:32px;">
            <p style="font-size:15px;color:#0B1F33;margin:0 0 4px;">Hi ${partner.business_name},</p>
            <p style="font-size:14px;color:#5A6B7D;line-height:1.6;margin:0 0 24px;">
              Here's your Downtown Perks performance summary for ${monthLabel}. Thank you for being a valued partner.
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
              <tr>
                <td style="padding:10px 16px;color:#5A6B7D;font-size:13px;border-bottom:1px solid #f0f0f0;">Active Perks</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0B1F33;border-bottom:1px solid #f0f0f0;text-align:right;">${activePerkCount}</td>
              </tr>
              ${topPerkRow}
            </table>

            <div style="background:#C9A227;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="color:#0B1F33;font-size:14px;font-weight:600;margin:0;">
                💡 ${totalRedemptions > 0
                  ? `Great work this month! Your residents redeemed ${totalRedemptions} perk${totalRedemptions !== 1 ? 's' : ''}.`
                  : 'No redemptions this month. Consider refreshing your perk offers to attract more residents.'}
              </p>
            </div>

            <p style="font-size:12px;color:#8B9AAB;margin:0;text-align:center;">
              This report was generated automatically by Downtown Perks.<br/>
              Questions? Reply to this email or visit your Partner Portal.
            </p>
          </div>
        </div>
      `;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: partner.contact_email,
          subject: `Downtown Perks Monthly Report — ${monthLabel}`,
          body: emailBody,
          from_name: 'Downtown Perks',
        });
        emailsSent++;
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        errors.push({ partner: partner.business_name, error: e.message });
      }
    }

    return Response.json({
      success: true,
      report_month: monthLabel,
      partners_contacted: emailsSent,
      partners_skipped: emailsSkipped,
      errors: errors,
      total_redemptions_in_month: monthlyRedemptions.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});