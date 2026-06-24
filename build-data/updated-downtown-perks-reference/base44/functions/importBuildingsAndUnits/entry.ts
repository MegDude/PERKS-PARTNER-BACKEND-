import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// All buildings and units consolidated from the uploaded property files
const BUILDINGS_DATA = [
  // From downtown_austin_full_building_map (Rentals)
  { name: "The Shore", address: "603 Davis St, Austin, TX", district: "Rainey Core", lat: 30.2587, lng: -97.7373 },
  { name: "70 Rainey", address: "70 Rainey St, Austin, TX", district: "Rainey Core", lat: 30.2599, lng: -97.7383 },
  { name: "The Quincy", address: "91 Rainey St, Austin, TX", district: "Rainey Core", lat: 30.2597, lng: -97.7380 },
  { name: "The Catherine", address: "214 Barton Springs Rd, Austin, TX", district: "South Edge", lat: 30.2585, lng: -97.7480 },
  { name: "The Austonian", address: "200 Congress Ave, Austin, TX", district: "Congress Core", lat: 30.2619, lng: -97.7430 },
  { name: "The Independent", address: "301 West Ave, Austin, TX", district: "West End", lat: 30.2651, lng: -97.7484 },
  { name: "44 East Ave", address: "44 East Ave, Austin, TX 78701", district: "Rainey Core", lat: 30.2596, lng: -97.7365 },
  { name: "210 Lavaca", address: "210 Lavaca St, Austin, TX 78701", district: "Congress Core", lat: 30.2645, lng: -97.7470 },
  { name: "610 Davis", address: "610 Davis St, Austin, TX 78701", district: "Rainey Core", lat: 30.2589, lng: -97.7370 },
  { name: "1800 Lavaca", address: "1800 Lavaca St, Austin, TX 78701", district: "West End", lat: 30.2810, lng: -97.7455 },
  { name: "84 East Ave", address: "84 East Ave, Austin, TX 78701", district: "Rainey Core", lat: 30.2602, lng: -97.7358 },
  { name: "360 Nueces", address: "360 Nueces St, Austin, TX 78701", district: "West End", lat: 30.2660, lng: -97.7512 },
  { name: "555 E 5th", address: "555 E 5th St, Austin, TX 78701", district: "East Downtown", lat: 30.2672, lng: -97.7358 },
  { name: "The Nokonah", address: "601 W 11th St, Austin, TX 78701", district: "West Campus", lat: 30.2790, lng: -97.7502 },
];

const UNITS_DATA = [
  // The Shore
  { building: "The Shore", unit: "1103", price: 3900, beds: 3, baths: 3, sqft: 1699, mls: "8687681", type: "rental" },
  { building: "The Shore", unit: "2003", price: 4300, beds: 2, baths: 2, sqft: 978, mls: "4593022", type: "rental" },
  { building: "The Shore", unit: "1904", price: 1200000, beds: 2, baths: 2, sqft: 1300, mls: "AUTO", type: "for_sale" },
  // 70 Rainey
  { building: "70 Rainey", unit: "1505", price: 4200, beds: 2, baths: 2, sqft: 1200, mls: "AUTO", type: "rental" },
  { building: "70 Rainey", unit: "3302", price: 1800000, beds: 2, baths: 2, sqft: 1400, mls: "AUTO", type: "for_sale" },
  // The Quincy
  { building: "The Quincy", unit: "2307", price: 3600, beds: 1, baths: 1, sqft: 800, mls: "AUTO", type: "rental" },
  { building: "The Quincy", unit: "2801", price: 1600000, beds: 2, baths: 2, sqft: 1350, mls: "AUTO", type: "for_sale" },
  // The Catherine
  { building: "The Catherine", unit: "2402", price: 5200, beds: 2, baths: 2, sqft: 1300, mls: "AUTO", type: "rental" },
  { building: "The Catherine", unit: "1801", price: 1450000, beds: 2, baths: 2, sqft: 1250, mls: "AUTO", type: "for_sale" },
  // The Austonian
  { building: "The Austonian", unit: "3104", price: 9500, beds: 2, baths: 2, sqft: 1600, mls: "AUTO", type: "rental" },
  { building: "The Austonian", unit: "5201", price: 3500000, beds: 3, baths: 4, sqft: 3200, mls: "AUTO", type: "for_sale" },
  // The Independent
  { building: "The Independent", unit: "4105", price: 19000, beds: 3, baths: 4, sqft: 3023, mls: "3710500", type: "rental" },
  { building: "The Independent", unit: "5801", price: 4200000, beds: 3, baths: 3, sqft: 3100, mls: "AUTO", type: "for_sale" },
  // 44 East Ave
  { building: "44 East Ave", unit: "2610", price: 1059000, beds: 2, baths: 2, sqft: 1260, mls: "6405164", type: "for_sale" },
  { building: "44 East Ave", unit: "4201", price: 2420000, beds: 3, baths: 4, sqft: 2118, mls: "6556972", type: "for_sale" },
  { building: "44 East Ave", unit: "1802", price: 3800, beds: 2, baths: 2, sqft: 1100, mls: "AUTO", type: "rental" },
  // 210 Lavaca
  { building: "210 Lavaca", unit: "2013", price: 4500, beds: 1, baths: 1, sqft: 888, mls: "9472858", type: "rental" },
  { building: "210 Lavaca", unit: "1910", price: 6995, beds: 2, baths: 3, sqft: 1523, mls: "9263726", type: "rental" },
  { building: "210 Lavaca", unit: "2504", price: 1100000, beds: 2, baths: 2, sqft: 1200, mls: "AUTO", type: "for_sale" },
  // 610 Davis
  { building: "610 Davis", unit: "4007", price: 5500, beds: 2, baths: 2, sqft: 1178, mls: "3168886", type: "rental" },
  { building: "610 Davis", unit: "2803", price: 1350000, beds: 2, baths: 2, sqft: 1150, mls: "AUTO", type: "for_sale" },
  // 1800 Lavaca
  { building: "1800 Lavaca", unit: "A705", price: 1300, beds: 1, baths: 1, sqft: 608, mls: "3515087", type: "rental" },
  // 84 East Ave
  { building: "84 East Ave", unit: "1604", price: 2500, beds: 1, baths: 1, sqft: 892, mls: "4223482", type: "rental" },
  // 360 Nueces
  { building: "360 Nueces", unit: "2004", price: 699900, beds: 2, baths: 2, sqft: 998, mls: "1261483", type: "for_sale" },
  { building: "360 Nueces", unit: "2509", price: 870000, beds: 2, baths: 2, sqft: 1244, mls: "2629904", type: "for_sale" },
  { building: "360 Nueces", unit: "1502", price: 3200, beds: 1, baths: 1, sqft: 850, mls: "AUTO", type: "rental" },
  // 555 E 5th
  { building: "555 E 5th", unit: "2901", price: 1340000, beds: 2, baths: 3, sqft: 1755, mls: "7215617", type: "for_sale" },
  { building: "555 E 5th", unit: "1404", price: 4800, beds: 2, baths: 2, sqft: 1100, mls: "AUTO", type: "rental" },
  // The Nokonah
  { building: "The Nokonah", unit: "121", price: 1039, beds: 1, baths: 1, sqft: 696, mls: "2756108", type: "rental" },
];

function bedroomToRoomType(beds) {
  if (!beds || beds === 0) return "Studio";
  if (beds === 1) return "1-Bedroom";
  if (beds === 2) return "2-Bedroom";
  if (beds === 3) return "3-Bedroom";
  if (beds === 4) return "4-Bedroom";
  return "Penthouse";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const results = { buildings_created: 0, units_created: 0, errors: [] };
    const buildingMap = {}; // name -> id

    // Create buildings
    for (const b of BUILDINGS_DATA) {
      const unitCount = UNITS_DATA.filter(u => u.building === b.name).length;
      const created = await base44.asServiceRole.entities.Building.create({
        name: b.name,
        address: b.address,
        district: b.district,
        lat: b.lat,
        lng: b.lng,
        total_floors: 30,
        total_units: unitCount,
        downtown_perks_enabled: true,
      });
      buildingMap[b.name] = created.id;
      results.buildings_created++;
    }

    // Create units
    for (const u of UNITS_DATA) {
      const buildingId = buildingMap[u.building];
      if (!buildingId) { results.errors.push(`No building found: ${u.building}`); continue; }
      const floorNum = parseInt(u.unit.replace(/\D/g, '').substring(0, 2)) || 1;
      await base44.asServiceRole.entities.Flat.create({
        building_id: buildingId,
        flat_number: u.unit,
        floor: floorNum,
        listing_type: u.type,
        price: u.price,
        beds: u.beds,
        baths: u.baths,
        sqft: u.sqft,
        mls: u.mls,
        room_type: bedroomToRoomType(u.beds),
        is_occupied: false,
        notes: u.type === 'for_sale' ? 'For Sale' : 'For Rent',
      });
      results.units_created++;
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});