import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// DANA members data
const danaMembers = [
  { fullName: 'Cyrus Tehrani', email: 'cytehrani@gmail.com', membershipLevel: 'Individual', startDate: '05/25/2025', expirationDate: '05/24/2027' },
  { fullName: 'Burton Fitzsimmons', email: 'burtonf@gmail.com', membershipLevel: 'Household', startDate: '02/06/2026', expirationDate: '02/05/2027' },
  { fullName: 'Brandon McKeithen', email: 'brandon.mckeithen@gmail.com', membershipLevel: 'Household', startDate: '02/21/2026', expirationDate: '02/20/2027' },
  { fullName: 'Steve Krant', email: 'tvstevek@gmail.com', membershipLevel: 'Individual', startDate: '02/25/2025', expirationDate: '02/24/2027' },
  { fullName: 'Pam Bellin', email: 'pamelaleebellin@gmail.com', membershipLevel: 'Individual', startDate: '02/26/2026', expirationDate: '02/25/2027' },
  { fullName: 'Lillian Gray', email: 'ldiazgray@gmail.com', membershipLevel: 'Household', startDate: '06/25/2025', expirationDate: '06/24/2026' },
  { fullName: 'Ralph Underwood', email: 'ralph@nokonah.net', membershipLevel: 'Individual', startDate: '02/24/2026', expirationDate: '02/23/2027' },
  { fullName: 'Dorothy Doolittle', email: 'db.doolittle@yahoo.com', membershipLevel: 'Individual', startDate: '02/11/2026', expirationDate: '02/10/2027' },
  { fullName: 'Azgari Lipshy', email: 'alipshy@painterbros.com', membershipLevel: 'Individual', startDate: '02/18/2025', expirationDate: '02/17/2027' },
];

// DANA buildings
const danaBuildings = [
  { name: '5 Fifty Five', address: '555 East 5th Street', units: 98 },
  { name: 'The Austonian', address: '200 Congress', units: 140 },
  { name: 'Four Seasons', address: '98 San Jacinto Blvd.', units: 146 },
  { name: 'Plaza Lofts', address: '311 W. 5th St.', units: 60 },
  { name: 'Residences at 6G', address: '600 Guadalupe St.', units: 70 },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get or create 5 DANA buildings
    let buildings = await base44.entities.Building.list();
    const buildingNames = danaBuildings.map(b => b.name);
    let existingDANABuildings = buildings.filter(b => buildingNames.includes(b.name));
    
    if (existingDANABuildings.length === 0) {
      // Create first 5 buildings only
      for (const danaBuilding of danaBuildings) {
        await base44.entities.Building.create({
          name: danaBuilding.name,
          address: danaBuilding.address,
          district: 'downtown',
          tier: 3,
          type: 'apartment',
          lat: 30.2672,
          lng: -97.7431,
          units: danaBuilding.units,
          yearBuilt: 2020,
          priceTier: 'premium',
          walkScore: 85,
          perkDensity: 0.8,
          activityScore: 0.9,
        });
      }
      buildings = await base44.entities.Building.list();
      existingDANABuildings = buildings.filter(b => buildingNames.includes(b.name));
    }

    // Get flats for existing DANA buildings
    let flats = await base44.entities.Flat.list();
    let flatCount = 0;

    for (const building of existingDANABuildings) {
      const buildingFlats = flats.filter(f => f.building_id === building.id);
      if (buildingFlats.length === 0) {
        // Create 10 flats per building
        for (let i = 0; i < 10; i++) {
          await base44.entities.Flat.create({
            building_id: building.id,
            flat_number: `${(i + 1).toString().padStart(3, '0')}`,
            floor: Math.floor(i / 3) + 1,
            listing_type: 'rental',
            price: 2500 + (i * 100),
            beds: 1 + (i % 3),
            baths: 1 + (i % 2),
            sqft: 700 + (i * 50),
            room_type: ['Studio', '1-Bedroom', '2-Bedroom'][i % 3],
            is_occupied: false,
          });
          flatCount++;
        }
      }
    }

    // Refresh flats
    flats = await base44.entities.Flat.list();

    // Import first 50 DANA members (distributed across 5 buildings)
    let imported = 0;

    for (let i = 0; i < Math.min(danaMembers.length, 50); i++) {
      const member = danaMembers[i];
      const buildingIdx = i % existingDANABuildings.length;
      const flatIdx = Math.floor(i / existingDANABuildings.length);
      
      const building = existingDANABuildings[buildingIdx];
      const buildingFlats = flats.filter(f => f.building_id === building.id);
      const flat = buildingFlats[flatIdx % buildingFlats.length];

      if (flat) {
        await base44.entities.Tenant.create({
          flat_id: flat.id,
          name: member.fullName,
          email: member.email,
          mobile_number: '+1-555-0000',
          preferred_language: 'en',
          move_in_date: new Date().toISOString().split('T')[0],
          lease_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          yearly_rent: 30000,
          rent_interval_months: 6,
          rent_per_interval: 5000,
          next_payment_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
          payment_status: 'unpaid',
          perks_enrolled: true,
          perks_tier: 'standard',
          notes: `DANA Member - ${member.membershipLevel}`,
        });
        imported++;
      }
    }

    return Response.json({
      success: true,
      buildingsCreated: existingDANABuildings.length,
      flatsCreated: flatCount,
      tenantsImported: imported,
      message: `Imported ${imported} DANA members as tenants across ${existingDANABuildings.length} buildings`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});