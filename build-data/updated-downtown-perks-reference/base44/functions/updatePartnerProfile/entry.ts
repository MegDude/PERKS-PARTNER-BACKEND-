import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { business_name, contact_person, contact_phone, address, category } = body;

    // Resolve partner by email using service role
    const allPartners = await base44.asServiceRole.entities.Partner.list();
    const partner = allPartners.find(p => p.contact_email === user.email);

    if (!partner) {
      return Response.json({ error: 'No partner account found for this user' }, { status: 404 });
    }

    // Update partner profile — only allow editable fields
    const updated = await base44.asServiceRole.entities.Partner.update(partner.id, {
      business_name: business_name ?? partner.business_name,
      contact_person: contact_person ?? partner.contact_person,
      contact_phone: contact_phone ?? partner.contact_phone,
      address: address ?? partner.address,
      category: category ?? partner.category,
    });

    return Response.json({ success: true, partner: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});