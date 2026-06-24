import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';
import { base44Integrations } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { building_id, year_month } = await req.json();

    if (!building_id || !year_month) {
      return Response.json({ error: 'Missing building_id or year_month' }, { status: 400 });
    }

    // Fetch all required data
    const [building, tenants, flats, broadcasts, surveys] = await Promise.all([
      base44.asServiceRole.entities.Building.get(building_id),
      base44.asServiceRole.entities.Tenant.list(),
      base44.asServiceRole.entities.Flat.list(),
      base44.asServiceRole.entities.Broadcast.list(),
      base44.asServiceRole.entities.Survey.list()
    ]);

    // Filter building-specific data
    const buildingFlats = flats.filter(f => f.building_id === building_id);
    const buildingTenants = tenants.filter(t => buildingFlats.some(f => f.id === t.flat_id));
    const buildingBroadcasts = broadcasts.filter(b => b.building_id === building_id);
    const buildingSurveys = surveys.filter(s => s.building_id === building_id);

    // Calculate metrics
    const totalUnits = buildingFlats.length;
    const occupiedUnits = buildingTenants.length;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    const perksEnrolled = buildingTenants.filter(t => t.perks_enrolled).length;
    const perksEnrollmentRate = occupiedUnits > 0 ? Math.round((perksEnrolled / occupiedUnits) * 100) : 0;
    const standardTier = buildingTenants.filter(t => t.perks_tier === 'standard').length;
    const premiumTier = buildingTenants.filter(t => t.perks_tier === 'premium').length;
    const vipTier = buildingTenants.filter(t => t.perks_tier === 'vip').length;
    const activeBroadcasts = buildingBroadcasts.filter(b => b.delivery_status === 'sent').length;
    const activeSurveys = buildingSurveys.filter(s => s.status === 'active').length;
    const totalResponses = buildingSurveys.reduce((sum, s) => sum + (s.responses_count || 0), 0);

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Header
    doc.setFillColor(11, 31, 51); // Navy
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(207, 175, 90); // Gold
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('Performance Report', margin, yPosition + 10);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(building.name, margin, yPosition + 22);

    yPosition = 45;

    // Report Period
    doc.setTextColor(11, 31, 51);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Report Period: ${year_month}`, margin, yPosition);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition + 6);

    yPosition += 20;

    // Executive Summary Section
    doc.setFillColor(247, 248, 251); // Light gray background
    doc.rect(margin - 2, yPosition - 8, pageWidth - 2 * margin + 4, 50, 'F');

    doc.setTextColor(11, 31, 51);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Executive Summary', margin, yPosition);

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const summaryMetrics = [
      `Occupancy Rate: ${occupancyRate}% (${occupiedUnits}/${totalUnits} units)`,
      `Perks Enrollment: ${perksEnrollmentRate}% (${perksEnrolled} residents)`,
      `Premium Tier Adoption: ${premiumTier} residents`,
      `Community Engagement: ${activeBroadcasts} messages sent, ${activeSurveys} surveys active`
    ];

    summaryMetrics.forEach((metric, idx) => {
      doc.text(metric, margin + 5, yPosition + (idx * 7));
    });

    yPosition += 40;

    // Key Metrics Section
    doc.setFillColor(11, 31, 51);
    doc.rect(margin - 2, yPosition - 8, pageWidth - 2 * margin + 4, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Key Metrics', margin, yPosition);

    yPosition += 15;

    // Metrics Grid
    const metrics = [
      { label: 'Total Units', value: totalUnits },
      { label: 'Occupied Units', value: occupiedUnits },
      { label: 'Occupancy Rate', value: `${occupancyRate}%` },
      { label: 'Perks Enrolled', value: perksEnrolled },
      { label: 'Enrollment Rate', value: `${perksEnrollmentRate}%` },
      { label: 'Premium Members', value: premiumTier },
      { label: 'VIP Members', value: vipTier },
      { label: 'Broadcast Messages', value: activeBroadcasts }
    ];

    doc.setTextColor(11, 31, 51);
    doc.setFontSize(9);

    let col = 0;
    let row = 0;
    const metricsPerRow = 2;
    const metricWidth = (pageWidth - 2 * margin) / metricsPerRow;

    metrics.forEach((metric, idx) => {
      col = idx % metricsPerRow;
      row = Math.floor(idx / metricsPerRow);

      const xPos = margin + col * metricWidth;
      const yPos = yPosition + row * 20;

      doc.setFillColor(245, 246, 248);
      doc.rect(xPos, yPos, metricWidth - 3, 18, 'F');

      doc.setFont(undefined, 'bold');
      doc.setFontSize(8);
      doc.text(metric.label, xPos + 3, yPos + 6);

      doc.setFont(undefined, 'bold');
      doc.setFontSize(14);
      doc.setTextColor(207, 175, 90); // Gold for values
      doc.text(String(metric.value), xPos + 3, yPos + 14);

      doc.setTextColor(11, 31, 51);
    });

    yPosition += 45;

    // Perks Tier Distribution
    doc.setFillColor(11, 31, 51);
    doc.rect(margin - 2, yPosition - 8, pageWidth - 2 * margin + 4, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Perks Tier Distribution', margin, yPosition);

    yPosition += 12;

    doc.setTextColor(11, 31, 51);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const tiers = [
      { label: 'Standard Tier', value: standardTier, color: [200, 200, 200] },
      { label: 'Premium Tier', value: premiumTier, color: [100, 150, 200] },
      { label: 'VIP Tier', value: vipTier, color: [207, 175, 90] }
    ];

    tiers.forEach((tier, idx) => {
      const xStart = margin;
      const tierLabel = `${tier.label}: ${tier.value} residents`;
      doc.text(tierLabel, xStart, yPosition + idx * 8);

      const barWidth = (tier.value / Math.max(1, standardTier + premiumTier + vipTier)) * 80;
      doc.setFillColor(...tier.color);
      doc.rect(xStart + 50, yPosition - 2 + idx * 8, barWidth, 5, 'F');
    });

    yPosition += 30;

    // Recommendations
    if (perksEnrollmentRate < 50) {
      doc.setFillColor(255, 245, 230);
      doc.rect(margin - 2, yPosition - 8, pageWidth - 2 * margin + 4, 25, 'F');

      doc.setTextColor(11, 31, 51);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Recommendations', margin, yPosition);

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Increase engagement efforts to boost perks enrollment. Consider targeted communications highlighting exclusive benefits.', margin + 3, yPosition + 8, { maxWidth: pageWidth - 2 * margin - 6 });
    }

    // Footer
    doc.setTextColor(140, 140, 140);
    doc.setFontSize(8);
    doc.text(`Downtown Perks Hub | ${new Date().toLocaleDateString()} | Page 1`, margin, pageHeight - 10);

    // Convert PDF to base64 and upload
    const pdfData = doc.output('arraybuffer');
    const base64Pdf = btoa(String.fromCharCode.apply(null, new Uint8Array(pdfData)));

    // Upload the PDF using the integration
    const uploadResponse = await base44.asServiceRole.integrations.Core.UploadFile({
      file: base64Pdf
    });

    return Response.json({
      success: true,
      file_url: uploadResponse.file_url,
      building_name: building.name,
      report_period: year_month
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
});