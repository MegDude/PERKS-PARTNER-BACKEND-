import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Generates a single partner's monthly performance PDF on demand.
// Called from the partner portal — verifies the requesting user owns the partner account.
// Returns { file_url, period_label } so the frontend can download/open the PDF directly.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { partner_id, year_month } = body;

    if (!partner_id) {
      return Response.json({ error: 'Missing partner_id' }, { status: 400 });
    }

    // Fetch partner and verify ownership
    const partner = await base44.asServiceRole.entities.Partner.get(partner_id);
    if (!partner) {
      return Response.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Verify the requesting user owns this partner account
    if (partner.contact_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: You can only generate your own report' }, { status: 403 });
    }

    // Determine report period (previous full month by default)
    const now = new Date();
    const reportDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = year_month ? parseInt(year_month.split('-')[0]) : reportDate.getFullYear();
    const month = year_month ? parseInt(year_month.split('-')[1]) : reportDate.getMonth() + 1;
    const periodLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const periodCode = `${year}-${String(month).padStart(2, '0')}`;

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 1));

    const [perks, redemptions, messages, surveys] = await Promise.all([
      base44.asServiceRole.entities.PerkLocation.list(),
      base44.asServiceRole.entities.PerkRedemption.list(),
      base44.asServiceRole.entities.PartnerMessage.list(),
      base44.asServiceRole.entities.Survey.list()
    ]);

    const partnerPerks = perks.filter(p => p.partner_id === partner.id);
    const partnerPerkIds = new Set(partnerPerks.map(p => p.id));
    const partnerPerkNames = new Set(partnerPerks.map(p => p.name));

    const partnerRedemptions = redemptions.filter(r => {
      const matchesPerk = partnerPerkIds.has(r.perk_id) || partnerPerkNames.has(r.perk_name);
      if (!matchesPerk) return false;
      const redeemedAt = r.redeemed_at ? new Date(r.redeemed_at) : null;
      if (!redeemedAt) return false;
      return redeemedAt >= monthStart && redeemedAt < monthEnd;
    });

    const allTimeRedemptions = redemptions.filter(r =>
      partnerPerkIds.has(r.perk_id) || partnerPerkNames.has(r.perk_name)
    );

    const uniqueResidents = new Set(partnerRedemptions.map(r => r.user_email)).size;

    const redeemCounts = {};
    partnerRedemptions.forEach(r => {
      redeemCounts[r.user_email] = (redeemCounts[r.user_email] || 0) + 1;
    });
    const repeatRedeemers = Object.values(redeemCounts).filter(c => c > 1).length;
    const repeatRate = partnerRedemptions.length > 0
      ? Math.round((repeatRedeemers / Math.max(1, uniqueResidents)) * 100)
      : 0;

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

    const perkCounts = {};
    partnerRedemptions.forEach(r => {
      const name = r.perk_name || 'Unknown';
      perkCounts[name] = (perkCounts[name] || 0) + 1;
    });
    const topPerks = Object.entries(perkCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const engagementScore = Math.min(100, Math.round(
      partnerRedemptions.length * 4 +
      uniqueResidents * 6 +
      repeatRate * 0.3 +
      repliedMessages * 5
    ));

    // ---- Build PDF (navy/gold editorial style) ----
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

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

    doc.setTextColor(11, 31, 51);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Report Period: ${periodLabel}`, margin, y);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y + 6);
    y += 18;

    // Executive Summary
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
      `Total Redemptions: ${partnerRedemptions.length}`,
      `Unique Residents Engaged: ${uniqueResidents}`,
      `Repeat Visitor Rate: ${repeatRate}%`,
      `Engagement Score: ${engagementScore}/100`
    ];
    summaryLines.forEach((line, idx) => {
      doc.text(line, margin + 5, y + idx * 7);
    });
    y += 38;

    // Key Metrics
    doc.setFillColor(11, 31, 51);
    doc.rect(margin - 2, y - 8, pageWidth - 2 * margin + 4, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Key Metrics', margin, y);
    y += 12;

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
    }

    // Footer
    doc.setTextColor(140, 140, 140);
    doc.setFontSize(8);
    doc.text(`Downtown Perks Hub | ${new Date().toLocaleDateString()} | ${partner.business_name}`, margin, pageHeight - 10);

    const pdfData = doc.output('arraybuffer');
    const pdfFile = new File(
      [pdfData],
      `${(partner.business_name || 'partner').replace(/\s+/g, '_')}_${periodCode}_report.pdf`,
      { type: 'application/pdf' }
    );
    const uploadResponse = await base44.asServiceRole.integrations.Core.UploadFile({
      file: pdfFile
    });

    return Response.json({
      success: true,
      file_url: uploadResponse.file_url,
      period_label: periodLabel,
      partner_name: partner.business_name
    });

  } catch (error) {
    console.error('On-demand partner report error:', error);
    return Response.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
});