import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get or create demo building
    const buildings = await base44.entities.Building.list();
    let demoBuilding = buildings[0];
    
    if (!demoBuilding) {
      demoBuilding = await base44.entities.Building.create({
        name: 'Downtown Tower',
        address: '505 East 6th Street, Austin, TX',
        district: 'cbd',
        tier: 3,
        type: 'condo',
        lat: 30.2639,
        lng: -97.7431,
        units: 150,
        yearBuilt: 2020,
        priceTier: 'premium',
        walkScore: 92,
        perkDensity: 0.85,
        activityScore: 0.78,
        tags: ['iconic', 'walkable', 'downtown']
      });
    }

    // Create demo flats
    const flats = [];
    for (let i = 1; i <= 8; i++) {
      const flat = await base44.entities.Flat.create({
        building_id: demoBuilding.id,
        flat_number: `${15}${String(i).padStart(2, '0')}`,
        floor: 15,
        listing_type: 'rental',
        price: 2800,
        beds: 2,
        baths: 2,
        sqft: 1100,
        room_type: '2-Bedroom',
        is_occupied: true
      });
      flats.push(flat);
    }

    // Create demo tenants with varied engagement levels
    const tenantNames = [
      { name: 'Sarah Johnson', email: 'sarah.j@example.com', tier: 'premium', engaged: true },
      { name: 'Michael Chen', email: 'm.chen@example.com', tier: 'premium', engaged: true },
      { name: 'Alex Rivera', email: 'arivera@example.com', tier: 'standard', engaged: true },
      { name: 'Emma Davis', email: 'emma.d@example.com', tier: 'standard', engaged: true },
      { name: 'James Wilson', email: 'j.wilson@example.com', tier: 'standard', engaged: false },
      { name: 'Lisa Anderson', email: 'l.anderson@example.com', tier: 'standard', engaged: false },
      { name: 'David Martinez', email: 'd.martinez@example.com', tier: 'standard', engaged: false },
      { name: 'Rachel Brown', email: 'r.brown@example.com', tier: 'premium', engaged: true }
    ];

    const tenants = [];
    for (let i = 0; i < tenantNames.length; i++) {
      const tenant = await base44.entities.Tenant.create({
        flat_id: flats[i].id,
        name: tenantNames[i].name,
        email: tenantNames[i].email,
        mobile_number: '+1' + Math.floor(Math.random() * 9000000000 + 1000000000),
        move_in_date: '2023-06-15',
        lease_end_date: '2026-06-14',
        yearly_rent: 33600,
        rent_interval_months: 6,
        rent_per_interval: 16800,
        next_payment_date: '2026-06-15',
        last_payment_date: '2025-12-15',
        payment_status: 'paid',
        perks_enrolled: true,
        perks_tier: tenantNames[i].tier
      });
      tenants.push(tenant);
    }

    // Create demo perk locations
    const partners = [];
    const perkData = [
      { name: 'Barista & Co', category: 'Coffee', perk: '15% discount on all beverages', image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400' },
      { name: 'The Craft Kitchen', category: 'Restaurant', perk: 'Free appetizer on $50+ dinner', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },
      { name: 'Fit Studio ATX', category: 'Fitness', perk: 'One free month with annual membership', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400' },
      { name: 'Canvas Collective', category: 'Art', perk: 'Free art class entry', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' },
      { name: 'Zilker Park Shop', category: 'Retail', perk: '20% off all merchandise', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
      { name: 'The Tavern', category: 'Bar/Nightlife', perk: 'Happy hour pricing all night', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400' }
    ];

    for (const data of perkData) {
      const partner = await base44.entities.Partner.create({
        business_name: data.name,
        contact_email: `contact@${data.name.toLowerCase().replace(/\s+/g, '')}.com`,
        contact_phone: '+1' + Math.floor(Math.random() * 9000000000 + 1000000000),
        contact_person: 'Manager',
        category: data.category,
        is_active: true
      });
      partners.push(partner);

      await base44.entities.PerkLocation.create({
        partner_id: partner.id,
        name: data.name,
        category: data.category,
        category_key: data.category.toLowerCase().replace(/\s+/g, '_'),
        address: `${Math.floor(Math.random() * 1000)} Austin Street, Austin, TX`,
        district: 'downtown',
        lat: 30.2639 + (Math.random() - 0.5) * 0.05,
        lng: -97.7431 + (Math.random() - 0.5) * 0.05,
        perk: data.perk,
        perk_type: data.category.toLowerCase(),
        hours: '10:00 AM - 10:00 PM',
        is_active: true,
        relevance_score: Math.random() * 0.4 + 0.6
      });
    }

    // Create demo events
    const eventNames = ['Rooftop Cocktail Social', 'Fitness Challenge', 'Art Gallery Night', 'Networking Breakfast', 'Movie Night in the Park'];
    for (const name of eventNames) {
      await base44.entities.EventRSVP.create({
        event_id: `event_${Date.now()}_${Math.random()}`,
        event_name: name,
        event_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        registered_at: new Date().toISOString()
      });
    }

    // Create demo announcements
    const announcementData = [
      { title: 'Building Maintenance Schedule', message: 'Water main maintenance scheduled for next Tuesday 2-4 PM', type: 'maintenance' },
      { title: 'New Downtown Perks Available', message: 'Check out our 3 new partner venues offering exclusive discounts!', type: 'event' },
      { title: 'Community Event This Saturday', message: 'Join us for a rooftop gathering at 6 PM', type: 'community_news' }
    ];

    for (const data of announcementData) {
      await base44.entities.Announcement.create({
        building_id: demoBuilding.id,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: 'medium',
        status: 'published',
        published_at: new Date().toISOString(),
        read_count: Math.floor(Math.random() * 50)
      });
    }

    // Create demo surveys
    await base44.entities.Survey.create({
      building_id: demoBuilding.id,
      title: 'Community Satisfaction Survey',
      description: 'Help us improve by sharing your feedback',
      status: 'active',
      responses_count: 24,
      target_residents: 150,
      starts_at: new Date().toISOString().split('T')[0],
      ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      questions: [
        { id: '1', text: 'How satisfied are you with the building amenities?', type: 'rating' },
        { id: '2', text: 'Would you recommend this building to others?', type: 'yes_no' }
      ]
    });

    // Create demo perk redemptions
    const redemptionCount = [8, 12, 5, 15, 3, 1, 2, 18];
    for (let i = 0; i < tenants.length; i++) {
      for (let j = 0; j < redemptionCount[i]; j++) {
        await base44.entities.PerkRedemption.create({
          perk_id: perkData[Math.floor(Math.random() * perkData.length)].name,
          perk_name: perkData[Math.floor(Math.random() * perkData.length)].name,
          perk_category: perkData[Math.floor(Math.random() * perkData.length)].category,
          user_email: tenants[i].email,
          user_name: tenants[i].name,
          redeemed_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    // Create demo amenities
    const amenityData = [
      { name: 'Rooftop Lounge', capacity: 50, hours_start: '06:00', hours_end: '23:00', duration: 60 },
      { name: 'Fitness Center', capacity: 30, hours_start: '05:00', hours_end: '22:00', duration: 60 },
      { name: 'Co-Working Space', capacity: 25, hours_start: '08:00', hours_end: '20:00', duration: 120 }
    ];

    for (const data of amenityData) {
      await base44.entities.Amenity.create({
        building_id: demoBuilding.id,
        name: data.name,
        description: `${data.name} available for residents`,
        capacity: data.capacity,
        hours_start: data.hours_start,
        hours_end: data.hours_end,
        slot_duration: data.duration,
        is_active: true
      });
    }

    // Create demo maintenance tickets
    const ticketDescriptions = [
      { title: 'Shower leaking', category: 'plumbing', priority: 'high' },
      { title: 'AC not cooling', category: 'hvac', priority: 'high' },
      { title: 'Microwave not heating', category: 'appliance', priority: 'medium' },
      { title: 'Ceiling crack', category: 'structural', priority: 'medium' }
    ];

    for (let i = 0; i < tenants.length; i++) {
      if (Math.random() > 0.6) {
        const ticket = ticketDescriptions[Math.floor(Math.random() * ticketDescriptions.length)];
        await base44.entities.MaintenanceTicket.create({
          tenant_id: tenants[i].id,
          flat_id: flats[i].id,
          title: ticket.title,
          description: `Issue reported: ${ticket.title}`,
          category: ticket.category,
          priority: ticket.priority,
          status: Math.random() > 0.5 ? 'open' : 'in_progress'
        });
      }
    }

    // Create demo campaigns
    const campaignData = [
      { name: 'Spring Fitness Challenge', segment: 'Power User', recipients: 15, opens: 12, clicks: 9, conversions: 4 },
      { name: 'Weekend Dining Promo', segment: 'Occasional', recipients: 45, opens: 27, clicks: 16, conversions: 6 },
      { name: 'Community Wellness', segment: 'Power User', recipients: 15, opens: 13, clicks: 10, conversions: 5 },
      { name: 'New Partner Spotlight', segment: 'All', recipients: 150, opens: 72, clicks: 38, conversions: 12 }
    ];

    for (const data of campaignData) {
      const openRate = Math.round((data.opens / data.recipients) * 100);
      const clickRate = Math.round((data.clicks / data.opens) * 100);
      const conversionRate = Math.round((data.conversions / data.recipients) * 100);

      await base44.entities.Campaign.create({
        building_id: demoBuilding.id,
        name: data.name,
        subject: data.name,
        segment_target: data.segment,
        message: `Check out our latest ${data.name.toLowerCase()} initiative!`,
        recipients_count: data.recipients,
        sent_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        opens: data.opens,
        clicks: data.clicks,
        conversions: data.conversions,
        open_rate: openRate,
        click_rate: clickRate,
        conversion_rate: conversionRate,
        status: 'completed'
      });
    }

    return Response.json({
      success: true,
      message: 'Demo data seeded successfully',
      building: demoBuilding.name,
      stats: {
        tenants: tenants.length,
        events: eventNames.length,
        partners: partners.length,
        amenities: amenityData.length,
        campaigns: campaignData.length
      }
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});