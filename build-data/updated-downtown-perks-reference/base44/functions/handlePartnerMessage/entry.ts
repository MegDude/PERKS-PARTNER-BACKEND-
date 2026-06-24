import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, message_id, reply_text } = body;

    // Resolve partner by email using service role
    const allPartners = await base44.asServiceRole.entities.Partner.list();
    const partner = allPartners.find(p => p.contact_email === user.email);

    if (!partner) {
      return Response.json({ error: 'No partner account found for this user' }, { status: 403 });
    }

    // Fetch the message and verify ownership
    const allMessages = await base44.asServiceRole.entities.PartnerMessage.list('-sent_at');
    const msg = allMessages.find(m => m.id === message_id);

    if (!msg) {
      return Response.json({ error: 'Message not found' }, { status: 404 });
    }

    if (msg.partner_id !== partner.id) {
      return Response.json({ error: 'You do not have permission to access this message' }, { status: 403 });
    }

    if (action === 'mark_read') {
      const updated = await base44.asServiceRole.entities.PartnerMessage.update(message_id, { status: 'read' });
      return Response.json({ success: true, message: updated });
    }

    if (action === 'reply') {
      if (!reply_text || !reply_text.trim()) {
        return Response.json({ error: 'Reply text is required' }, { status: 400 });
      }

      // Create the reply message
      const reply = await base44.asServiceRole.entities.PartnerMessage.create({
        partner_id: partner.id,
        partner_name: partner.business_name,
        resident_email: msg.resident_email,
        resident_name: msg.resident_name,
        subject: `Re: ${msg.subject}`,
        message: reply_text.trim(),
        sent_at: new Date().toISOString(),
        status: 'unread',
      });

      // Mark the original message as replied
      await base44.asServiceRole.entities.PartnerMessage.update(message_id, { status: 'replied' });

      return Response.json({ success: true, reply });
    }

    return Response.json({ error: 'Invalid action. Use "mark_read" or "reply".' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});