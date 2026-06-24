import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { announcementId } = await req.json();

    if (!announcementId) {
      return Response.json({ error: 'Missing announcementId' }, { status: 400 });
    }

    // Fetch announcement
    const announcement = await base44.asServiceRole.entities.Announcement.get(announcementId);
    
    if (!announcement) {
      return Response.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Fetch all tenants in building
    const flats = await base44.asServiceRole.entities.Flat.filter({ building_id: announcement.building_id });
    const tenants = await base44.asServiceRole.entities.Tenant.filter(
      { flat_id: { $in: flats.map(f => f.id) } }
    );

    // Send notifications to each tenant
    const notificationPromises = tenants.map(tenant =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: tenant.email,
        subject: `🔔 ${announcement.title}`,
        body: `
          <h2>${announcement.title}</h2>
          <p>${announcement.message}</p>
          <p style="color: #888; font-size: 12px; margin-top: 20px;">
            Priority: <strong>${announcement.priority}</strong> | Type: <strong>${announcement.type}</strong>
          </p>
        `
      })
    );

    await Promise.all(notificationPromises);

    // Mark notification as sent
    await base44.asServiceRole.entities.Announcement.update(announcementId, {
      notification_sent: true
    });

    return Response.json({
      success: true,
      notificationsSent: tenants.length,
      message: `Notification sent to ${tenants.length} resident${tenants.length !== 1 ? 's' : ''}`
    });
  } catch (error) {
    console.error('Error sending announcement notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});