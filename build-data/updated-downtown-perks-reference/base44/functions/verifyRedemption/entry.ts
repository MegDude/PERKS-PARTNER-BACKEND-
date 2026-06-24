import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const qr_data = body.qr_data;
        if (!qr_data) {
            return Response.json({ error: 'QR data is required' }, { status: 400 });
        }

        let payload;
        try {
            payload = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
        } catch (e) {
            return Response.json({ error: 'Invalid QR code format' }, { status: 400 });
        }

        if (payload.type !== 'dp_redeem' || !payload.perk_id || !payload.user_email) {
            return Response.json({ error: 'Invalid redemption code' }, { status: 400 });
        }

        // Get partner context
        const partners = await base44.asServiceRole.entities.Partner.filter({ contact_email: user.email });
        const partner = partners[0];
        if (!partner) {
            return Response.json({ error: 'No partner account found for this user' }, { status: 403 });
        }

        // Verify the perk belongs to this partner
        const perk = await base44.asServiceRole.entities.PerkLocation.get(payload.perk_id);
        if (!perk || perk.partner_id !== partner.id) {
            return Response.json({ error: 'This perk does not belong to your business' }, { status: 403 });
        }

        // Check for duplicate redemption (same user + perk within 24h)
        const recentRedemptions = await base44.asServiceRole.entities.PerkRedemption.filter({
            perk_id: payload.perk_id,
            user_email: payload.user_email,
        });
        const now = new Date();
        const isDuplicate = recentRedemptions.some(r => {
            if (!r.redeemed_at) return false;
            const redeemedAt = new Date(r.redeemed_at);
            const hoursDiff = (now - redeemedAt) / (1000 * 60 * 60);
            return hoursDiff < 24;
        });

        if (isDuplicate) {
            return Response.json({
                error: 'This resident already redeemed this perk in the last 24 hours',
                status: 'duplicate'
            }, { status: 409 });
        }

        // Create redemption record
        const redemption = await base44.asServiceRole.entities.PerkRedemption.create({
            perk_id: payload.perk_id,
            perk_name: payload.perk_name || perk.name,
            perk_category: perk.category,
            user_email: payload.user_email,
            user_name: payload.user_name || '',
            redeemed_at: new Date().toISOString(),
        });

        return Response.json({
            success: true,
            redemption,
            perk_name: perk.name,
            resident_name: payload.user_name || payload.user_email,
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});