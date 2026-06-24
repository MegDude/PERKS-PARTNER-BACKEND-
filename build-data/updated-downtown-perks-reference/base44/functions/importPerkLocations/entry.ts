import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Top venues from downtown_austin_locations.json (curated with perks)
const PERK_LOCATIONS = [
  { name: "Garage", category: "Bar / Nightlife", category_key: "bar_nightlife", address: "503 Colorado Street, Austin, TX 78701", district: "westSixth", lat: 30.2679, lng: -97.7469, perk: "Resident night welcome cocktail and a faster entry lane.", perk_type: "drink", hours: "Open until 1 AM", is_featured: true, relevance_score: 96 },
  { name: "Caffé Medici", category: "Coffee", category_key: "coffee", address: "804 Congress Avenue, Austin, TX 78701", district: "congress", lat: 30.2687, lng: -97.7428, perk: "Weekday size upgrade before 11 AM.", perk_type: "coffee", hours: "Open until 6 PM", is_featured: false, relevance_score: 88 },
  { name: "Jo's Coffee", category: "Coffee", category_key: "coffee", address: "242 West 2nd Street, Austin, TX 78701", district: "secondStreet", lat: 30.2644, lng: -97.746, perk: "Cold brew or drip upgrade during weekday mornings.", perk_type: "coffee", hours: "Open until 6 PM", is_featured: true, relevance_score: 95 },
  { name: "Comedor", category: "Restaurant", category_key: "restaurant", address: "501 Colorado Street, Austin, TX 78701", district: "congress", lat: 30.2639, lng: -97.7417, perk: "Priority patio seating on resident nights.", perk_type: "dining", hours: "Open until 10 PM", is_featured: true, relevance_score: 91 },
  { name: "Arlo Grey", category: "Restaurant", category_key: "restaurant", address: "111 East Cesar Chavez Street, Austin, TX 78701", district: "congress", lat: 30.2608, lng: -97.7418, perk: "Dessert course or lounge priority on select evenings.", perk_type: "dining", hours: "Open until 10 PM", is_featured: false, relevance_score: 87 },
  { name: "Augustine", category: "Bar / Nightlife", category_key: "bar_nightlife", address: "86 Rainey Street, Austin, TX 78701", district: "rainey", lat: 30.259653, lng: -97.738679, perk: "Resident happy-hour perks, nightlife activations, and event check-ins", perk_type: "drink", hours: "Tu-We 16:00-24:00; Th 16:00-02:00; Sa 13:00-02:00; Su 12:00-02:00", is_featured: true, relevance_score: 89, website: "https://augustineaustin.com/", contact_phone: "+1 512-910-2100" },
  { name: "Antone's Nightclub", category: "Bar / Nightlife", category_key: "bar_nightlife", address: "305 East 5th Street, Austin, TX 78701", district: "eastDowntown", lat: 30.266056, lng: -97.7404, perk: "Resident happy-hour perks, nightlife activations, and event check-ins", perk_type: "drink", hours: "Check venue", is_featured: false, relevance_score: 82 },
  { name: "B.D. Riley's Irish Pub", category: "Bar / Nightlife", category_key: "bar_nightlife", address: "204 E 6th St, Austin, TX 78701", district: "eastSixth", lat: 30.267718, lng: -97.741118, perk: "Resident happy-hour perks and event check-ins", perk_type: "drink", hours: "Check venue", is_featured: false, relevance_score: 78, website: "https://bdrileys.com/", contact_phone: "+1-512-494-1335" },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let created = 0;
    for (const loc of PERK_LOCATIONS) {
      await base44.asServiceRole.entities.PerkLocation.create({
        name: loc.name,
        category: loc.category,
        category_key: loc.category_key,
        address: loc.address,
        district: loc.district,
        lat: loc.lat,
        lng: loc.lng,
        perk: loc.perk,
        perk_type: loc.perk_type,
        hours: loc.hours,
        website: loc.website || '',
        contact_phone: loc.contact_phone || '',
        is_featured: loc.is_featured,
        is_active: true,
        relevance_score: loc.relevance_score,
        source: "Downtown Austin Data",
      });
      created++;
    }

    return Response.json({ success: true, perk_locations_created: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});