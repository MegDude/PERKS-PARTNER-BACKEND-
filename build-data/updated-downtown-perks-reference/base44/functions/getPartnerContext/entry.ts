import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to bypass RLS — find partner by contact email
    const allPartners = await base44.asServiceRole.entities.Partner.list();
    const partner = allPartners.find(p => p.contact_email === user.email);

    if (!partner) {
      return Response.json({ partner: null, perks: [], redemptions: [], messages: [] });
    }

    // Fetch perks, redemptions, and messages for this partner
    const [allPerks, allRedemptions, allMessages] = await Promise.all([
      base44.asServiceRole.entities.PerkLocation.list(),
      base44.asServiceRole.entities.PerkRedemption.list(),
      base44.asServiceRole.entities.PartnerMessage.list('-sent_at'),
    ]);

    const partnerPerks = allPerks.filter(p => p.partner_id === partner.id);
    const partnerPerkIds = new Set(partnerPerks.map(p => p.id));
    const partnerRedemptions = allRedemptions.filter(r => partnerPerkIds.has(r.perk_id));
    const partnerMessages = allMessages.filter(m => m.partner_id === partner.id);

    return Response.json({
      partner,
      perks: partnerPerks,
      redemptions: partnerRedemptions,
      messages: partnerMessages,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});