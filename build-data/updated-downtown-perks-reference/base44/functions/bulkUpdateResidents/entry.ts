import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Bulk updates resident records (payment status, perks tier, lease dates, etc.)
// Expects payload: { updates: [{id, field, value}, ...] }
// Returns count of successful updates
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { updates } = await req.json();
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return Response.json({ error: 'No updates provided' }, { status: 400 });
    }

    let successCount = 0;
    const errors = [];

    // Group updates by resident ID for efficiency
    const updatesByResident = {};
    updates.forEach(update => {
      if (!updatesByResident[update.id]) {
        updatesByResident[update.id] = {};
      }
      updatesByResident[update.id][update.field] = update.value;
    });

    // Apply updates to each resident
    for (const [residentId, fields] of Object.entries(updatesByResident)) {
      try {
        await base44.entities.Tenant.update(residentId, fields);
        successCount++;
      } catch (error) {
        errors.push({ resident_id: residentId, error: error.message });
      }
    }

    return Response.json({
      success: true,
      updated_count: successCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    return Response.json({ error: error.message || 'Bulk update failed' }, { status: 500 });
  }
});