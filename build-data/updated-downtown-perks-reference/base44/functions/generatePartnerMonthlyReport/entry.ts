import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Generates a clean editorial-style PDF monthly performance report for each active
// venue partner, uploads it, and emails the partner a download link.
// Designed to run as a scheduled automation (no authenticated user) — uses service role.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Determine report period (previous full month by default)
    let yearMonth = null;
    try {
      const body = await req.json();
      if (body && body.year_month) yearMonth = body.year_month;
    } catch (_) { /* scheduled invocation has no JSON body */ }

    const now = new Date();
    const reportDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = yearMonth ? parseInt(yearMonth.split('-')[0]) : reportDate.getFullYear();
    const month = yearMonth ? parseInt(yearMonth.split('-')[1]) : reportDate.getMonth() + 1;
    const periodLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const periodCode = `${year}-${String(month).padStart(2, '0')}`;

    // Month boundaries (UTC)
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 1));

    // Fetch all data in parallel (service role for scheduled task)
    const [partners, perks, redemptions, messages, surveys] = await Promise.all([
      base44.asServiceRole.entities.Partner.list(),
      base44.asServiceRole.entities.PerkLocation.list(),
      base44.asServiceRole.entities.PerkRedemption.list(),
      base44.asServiceRole.entities.PartnerMessage.list(),
      base44.asServiceRole.entities.Survey.list()
    ]);

    const activePartners = partners.filter(p => p.is_active !== false);
    const results = [];

    for (const partner of activePartners) {
      const partnerPerks = perks.filter(p => p.partner_id === partner.id);
      const partnerPerkIds = new Set(partnerPerks.map(p => p.id));
      const partnerPerkNames = new Set(partnerPerks.map(p => p.name));

      // Redemptions for this partner's perks within the report month
      const partnerRedemptions = redemptions.filter(r => {
        const matchesPerk = partnerPerkIds.has(r.perk_id) || partnerPerkNames.has(r.perk_name);
        if (!matchesPerk) return false;
        const redeemedAt = r.redeemed_at ? new Date(r.redeemed_at) : null;
        if (!redeemedAt) return false;
        return redeemedAt >= monthStart && redeemedAt < monthEnd;
      });

      // All-time redemptions for trend context
      const allTimeRedemptions = redemptions.filter(r =>
        partnerPerkIds.has(r.perk_id) || partnerPerkNames.has(r.perk_name)
      );

      // Unique residents who redeemed this month
      const uniqueResidents = new Set(partnerRedemptions.map(r => r.user_email)).size;

      // Repeat redeemers (redeemed more than once this month)
      const redeemCounts = {};
      partnerRedemptions.forEach(r => {
        redeemCounts[r.user_email] = (redeemCounts[r.user_email] || 0) + 1;
      });
      const repeatRedeemers = Object.values(redeemCounts).filter(c => c > 1).length;
      const repeatRate = partnerRedemptions.length > 0
        ? Math.round((repeatRedeemers / Math.max(1, uniqueResidents)) * 100)
        : 0;

      // Messages received this month + reply rate
      const partnerMessages = messages.filter(m =>
        m.partner_id === partner.id &&
        m.sent_at &&
        new Date(m.sent_at) >= monthStart &&
        new Date(m.sent_at) < monthEnd
      );
      const repliedMessages = partnerMessages.filter(m => m.status === 'replied').length;
      const replyRate = partnerMessages.length > 0
        ? Math.round((repliedMessages / partnerMessages.length) * 100)
        : 0;

      // Top performing perks (by redemption count this month)
      const perkCounts = {};
      partnerRedemptions.forEach(r => {
        const name = r.perk_name || 'Unknown';
        perkCounts[name] = (perkCounts[name] || 0) + 1;
      });
      const topPerks = Object.entries(perkCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Category breakdown
      const categoryCounts = {};
      partnerRedemptions.forEach(r => {
        const cat = r.perk_category || partner.category || 'Other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      // Survey engagement context (building-level surveys active during the month)
      const activeSurveys = surveys.filter(s => {
        if (s.status !== 'active') return false;
        const start = s.starts_at ? new Date(s.starts_at) : null;
        const end = s.ends_at ? new Date(s.ends_at) : null;
        if (start && start >= monthEnd) return false;
        if (end && end < monthStart) return false;
        return true;
      });
      const totalSurveyResponses = activeSurveys.reduce((sum, s) => sum + (s.responses_count || 0), 0);

      // Engagement score (0-100): weighted blend of redemptions, unique residents, repeat rate, replies
      const engagementScore = Math.min(100, Math.round(
        partnerRedemptions.length * 4 +
        uniqueResidents * 6 +
        repeatRate * 0.3 +
        repliedMessages * 5
      ));

      // ---- Build PDF (navy/gold editorial style matching generatePDFReport) ----
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      // Header band
      doc.setFillColor(11, 31, 51);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(207, 175, 90);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('Partner Performance Report', margin, y + 10);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(partner.business_name || 'Venue Partner', margin, y + 22);
      y = 45;

      // Period
      doc.setTextColor(11, 31, 51);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Report Period: ${periodLabel}`, margin, y);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y + 6);
      y += 18;

      // Executive Summary box
      doc.setFillColor(247, 248, 251);
      doc.rect(margin - 2, y - 8, pageWidth - 2 * margin + 4, 46, 'F');
      doc.setTextColor(11, 31, 51);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Executive Summary', margin, y);
      y += 9;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const summaryLines = [
        `Total Redemptions: ${partnerRedemptions.length} (survey-reward workflow)`,
        `Unique Residents Engaged: ${uniqueResidents}`,
        `Repeat Visitor Rate: ${repeatRate}%`,
        `Engagement Score: ${engagementScore}/100`
      ];
      summaryLines.forEach((line, idx) => {
        doc.text(line, margin + 5, y + idx * 7);
      });
      y += 38;

      // Key Metrics header bar
      doc.setFillColor(11, 31, 51);
      doc.rect(margin - 2, y - 8, pageWidth - 2 * margin + 4, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Key Metrics', margin, y);
      y += 12;

      // Metrics grid (2 cols)
      const metrics = [
        { label: 'Monthly Redemptions', value: partnerRedemptions.length },
        { label: 'Unique Residents', value: uniqueResidents },
        { label: 'Repeat Redeemers', value: repeatRedeemers },
        { label: 'Repeat Rate', value: `${repeatRate}%` },
        { label: 'Messages Received', value: partnerMessages.length },
        { label: 'Reply Rate', value: `${replyRate}%` },
        { label: 'Engagement Score', value: `${engagementScore}/100` },
        { label: 'All-Time Redemptions', value: allTimeRedemptions.length }
      ];
      const metricsPerRow = 2;
      const metricWidth = (pageWidth - 2 * margin) / metricsPerRow;
      doc.setTextColor(11, 31, 51);
      doc.setFontSize(9);
      metrics.forEach((metric, idx) => {
        const col = idx % metricsPerRow;
        const row = Math.floor(idx / metricsPerRow);
        const xPos = margin + col * metricWidth;
        const yPos = y + row * 20;
        doc.setFillColor(245, 246, 248);
        doc.rect(xPos, yPos, metricWidth - 3, 18, 'F');
        doc.setFont(undefined, 'bold');
        doc.setFontSize(8);
        doc.text(metric.label, xPos + 3, yPos + 6);
        doc.setFontSize(14);
        doc.setTextColor(207, 175, 90);
        doc.text(String(metric.value), xPos + 3, yPos + 14);
        doc.setTextColor(11, 31, 51);
      });
      y += Math.ceil(metrics.length / metricsPerRow) * 20 + 6;

      // Top Performing Perks
      if (topPerks.length > 0) {
        doc.setFillColor(11, 31, 51);
        doc.rect(margin - 2, y - 8, pageWidth - 2 * margin + 4, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Top Performing Perks', margin, y);
        y += 10;
        doc.setTextColor(11, 31, 51);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const maxBar = Math.max(...topPerks.map(p => p[1]), 1);
        topPerks.forEach(([name, count], idx) => {
          doc.text(`${idx + 1}. ${name}`, margin, y + idx * 9);
          doc.text(`${count}`, pageWidth - margin - 5, y + idx * 9, { align: 'right' });
          const barWidth = (count / maxBar) * 60;
          doc.setFillColor(207, 175, 90);
          doc.rect(margin + 55, y - 2 + idx * 9, barWidth, 4, 'F');
        });
        y += topPerks.length * 9 + 8;
      }

      // Survey Workflow Insights
      doc.setFillColor(11, 31, 51);
      doc.rect(margin - 2, y - 8, pageWidth - 2 * margin + 4, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Survey Workflow Insights', margin, y);
      y += 10;
      doc.setTextColor(11, 31, 51);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const surveyLines = [
        `Active surveys during period: ${activeSurveys.length}`,
        `Total survey responses collected: ${totalSurveyResponses}`,
        `Redemptions driven by survey-reward flow: ${partnerRedemptions.length}`,
        `Resident conversion (responses to redemptions): ${totalSurveyResponses > 0 ? Math.round((partnerRedemptions.length / totalSurveyResponses) * 100) : 0}%`
      ];
      surveyLines.forEach((line, idx) => {
        doc.text(line, margin, y + idx * 7);
      });
      y += surveyLines.length * 7 + 8;

      // Category breakdown
      const categoryEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
      if (categoryEntries.length > 0) {
        doc.setFillColor(11, 31, 51);
        doc.rect(margin - 2, y - 8, pageWidth - 2 * margin + 4, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Redemptions by Category', margin, y);
        y += 10;
        doc.setTextColor(11, 31, 51);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        categoryEntries.forEach(([cat, count], idx) => {
          doc.text(`${cat}: ${count}`, margin + 3, y + idx * 7);
        });
      }

      // Footer
      doc.setTextColor(140, 140, 140);
      doc.setFontSize(8);
      doc.text(`Downtown Perks Hub | ${new Date().toLocaleDateString()} | ${partner.business_name}`, margin, pageHeight - 10);

      // Upload PDF
      const pdfData = doc.output('arraybuffer');
      const pdfFile = new File(
        [pdfData],
        `${(partner.business_name || 'partner').replace(/\s+/g, '_')}_${periodCode}_report.pdf`,
        { type: 'application/pdf' }
      );
      const uploadResponse = await base44.asServiceRole.integrations.Core.UploadFile({
        file: pdfFile
      });

      // Email the partner a download link (only works for app-registered emails)
      const email = partner.contact_email;
      let emailed = false;
      if (email) {
        try {
          const body = [
            `Hello ${partner.contact_person || 'Team'},`,
            ``,
            `Your Downtown Perks performance report for ${periodLabel} is ready.`,
            ``,
            `Highlights:`,
            `• ${partnerRedemptions.length} redemptions from the survey-reward workflow`,
            `• ${uniqueResidents} unique residents engaged`,
            `• Engagement score: ${engagementScore}/100`,
            ``,
            `Download the full editorial report (PDF):`,
            uploadResponse.file_url,
            ``,
            `Thank you for being a valued Downtown Perks partner.`,
            ``,
            `— Downtown Perks Hub`
          ].join('\n');

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: `Downtown Perks — ${periodLabel} Performance Report for ${partner.business_name}`,
            body,
            from_name: 'Downtown Perks Hub'
          });
          emailed = true;
        } catch (emailErr) {
          // Email sending restricted to app users — skip silently, report still uploaded
          console.log(`Email skipped for ${partner.business_name}: ${emailErr.message}`);
        }
      }

      results.push({
        partner_id: partner.id,
        partner_name: partner.business_name,
        period: periodCode,
        redemptions: partnerRedemptions.length,
        unique_residents: uniqueResidents,
        engagement_score: engagementScore,
        file_url: uploadResponse.file_url,
        emailed
      });
    }

    return Response.json({
      success: true,
      period: periodCode,
      period_label: periodLabel,
      reports_generated: results.length,
      results
    });

  } catch (error) {
    console.error('Partner monthly report error:', error);
    return Response.json({ error: error.message || 'Failed to generate partner reports' }, { status: 500 });
  }
});