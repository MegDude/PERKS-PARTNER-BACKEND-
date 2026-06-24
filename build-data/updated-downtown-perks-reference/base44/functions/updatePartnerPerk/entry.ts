import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { perk_id, data } = body;

    if (!perk_id || !data) {
      return Response.json({ error: 'perk_id and data are required' }, { status: 400 });
    }

    // Resolve partner by email using service role
    const allPartners = await base44.asServiceRole.entities.Partner.list();
    const partner = allPartners.find(p => p.contact_email === user.email);

    if (!partner) {
      return Response.json({ error: 'No partner account found for this user' }, { status: 403 });
    }

    // Fetch the perk and verify ownership
    const allPerks = await base44.asServiceRole.entities.PerkLocation.list();
    const perk = allPerks.find(p => p.id === perk_id);

    if (!perk) {
      return Response.json({ error: 'Perk not found' }, { status: 404 });
    }

    if (perk.partner_id !== partner.id) {
      return Response.json({ error: 'You do not have permission to update this perk' }, { status: 403 });
    }

    // Only allow updating these fields
    const allowedFields = {};
    const allowed = ['perk', 'specials', 'deals_offers', 'hours', 'contact_phone', 'is_active', 'is_featured', 'events_available'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        allowedFields[key] = data[key];
      }
    }

    const updated = await base44.asServiceRole.entities.PerkLocation.update(perk_id, allowedFields);
    return Response.json({ success: true, perk: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});