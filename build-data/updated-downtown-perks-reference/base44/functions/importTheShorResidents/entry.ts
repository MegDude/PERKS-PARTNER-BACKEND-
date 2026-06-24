import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // The Shore residents sample data extracted from the file
    const shoreResidents = [
      { name: 'Rafael Brito', unit: '601', phone: '', email: '' },
      { name: 'Justin Becker', unit: '607', phone: '', email: '' },
      { name: 'Michael Chen', unit: '612', phone: '', email: '' },
      { name: 'Sarah Johnson', unit: '620', phone: '', email: '' },
      { name: 'David Martinez', unit: '625', phone: '', email: '' },
      { name: 'Jessica Williams', unit: '630', phone: '', email: '' },
      { name: 'Robert Taylor', unit: '635', phone: '', email: '' },
      { name: 'Emily Anderson', unit: '640', phone: '', email: '' },
      { name: 'James Brown', unit: '645', phone: '', email: '' },
      { name: 'Lisa Davis', unit: '650', phone: '', email: '' },
    ];

    // Get or create The Shore building
    let buildings = await base44.entities.Building.list();
    let theShore = buildings.find(b => b.name === 'The Shore');

    if (!theShore) {
      theShore = await base44.entities.Building.create({
        name: 'The Shore',
        address: '603 Davis St, Austin, TX 78701',
        district: 'downtown',
        tier: 5,
        type: 'condo',
        lat: 30.2650,
        lng: -97.7422,
        units: 200,
        yearBuilt: 2020,
        priceTier: 'luxury',
        walkScore: 95,
        perkDensity: 1.0,
        activityScore: 0.95,
      });
    }

    // Get or create flats for The Shore
    let flats = await base44.entities.Flat.list();
    let shoreFlats = flats.filter(f => f.building_id === theShore.id);

    if (shoreFlats.length === 0) {
      // Create flats based on resident units
      for (const resident of shoreResidents) {
        const unitNum = parseInt(resident.unit) || 600 + shoreResidents.indexOf(resident);
        const floor = Math.floor(unitNum / 100);
        const suitNum = unitNum % 100;

        await base44.entities.Flat.create({
          building_id: theShore.id,
          flat_number: resident.unit,
          floor: floor || 6,
          listing_type: 'rental',
          price: 4500,
          beds: 2,
          baths: 2,
          sqft: 1200,
          room_type: '2-Bedroom',
          is_occupied: false,
        });
      }
      flats = await base44.entities.Flat.list();
      shoreFlats = flats.filter(f => f.building_id === theShore.id);
    }

    // Import residents as tenants
    let imported = 0;
    let existing = 0;

    for (let i = 0; i < shoreResidents.length; i++) {
      const resident = shoreResidents[i];
      const flat = shoreFlats[i];

      if (flat) {
        // Check if tenant already exists for this flat
        const existingTenant = await base44.entities.Tenant.filter({ flat_id: flat.id });
        
        if (existingTenant.length === 0) {
          await base44.entities.Tenant.create({
            flat_id: flat.id,
            name: resident.name,
            email: resident.email || `resident${i}@theshore.local`,
            mobile_number: resident.phone || '+1-512-555-0000',
            preferred_language: 'en',
            move_in_date: new Date().toISOString().split('T')[0],
            lease_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            yearly_rent: 54000,
            rent_interval_months: 12,
            rent_per_interval: 4500,
            next_payment_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            payment_status: 'unpaid',
            perks_enrolled: true,
            perks_tier: 'premium',
            notes: 'The Shore luxury resident',
          });
          imported++;
        } else {
          existing++;
        }
      }
    }

    return Response.json({
      success: true,
      building: theShore.name,
      flatsCreated: shoreFlats.length,
      residentsImported: imported,
      residentsExisting: existing,
      message: `Imported ${imported} Shore residents, ${existing} already existed`,
    });
  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});