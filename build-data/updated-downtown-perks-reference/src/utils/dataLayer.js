/**
 * Downtown Perks Shared Data Layer
 *
 * This module provides normalized access to shared entities used by both
 * the Building Module (admin) and public Downtown Perks site.
 *
 * All data queries go through these helpers to ensure:
 * - Consistent building scoping
 * - Proper field filtering (public vs admin)
 * - Reusable query patterns
 * - Single source of truth for business logic
 */

import { base44 } from '@/api/base44Client';

/**
 * BUILDING-SCOPED QUERIES
 */

export async function getBuildingEvents(buildingId) {
  if (!buildingId) return [];
  const events = await base44.entities.Event.filter({
    building_id: buildingId
  });
  return events || [];
}

export async function getBuildingAnnouncements(buildingId, published = false) {
  if (!buildingId) return [];
  const query = { building_id: buildingId };
  if (published) {
    query.status = 'published';
  }
  const announcements = await base44.entities.Announcement.filter(query);
  return announcements || [];
}

export async function getBuildingSurveys(buildingId, active = false) {
  if (!buildingId) return [];
  const query = { building_id: buildingId };
  if (active) {
    query.status = 'active';
  }
  const surveys = await base44.entities.Survey.filter(query);
  return surveys || [];
}

export async function getBuildingBroadcasts(buildingId) {
  if (!buildingId) return [];
  const broadcasts = await base44.entities.Broadcast.filter({
    building_id: buildingId
  });
  return broadcasts || [];
}

export async function getBuildingFlats(buildingId) {
  if (!buildingId) return [];
  const flats = await base44.entities.Flat.filter({
    building_id: buildingId
  });
  return flats || [];
}

export async function getBuildingResidents(buildingId) {
  if (!buildingId) return [];
  // Get all flats, then all tenants in those flats
  const flats = await getBuildingFlats(buildingId);
  if (!flats.length) return [];
  const flatIds = flats.map(f => f.id);
  const tenants = await base44.entities.Tenant.list();
  return tenants.filter(t => flatIds.includes(t.flat_id)) || [];
}

export async function getBuildingAmenities(buildingId) {
  if (!buildingId) return [];
  const amenities = await base44.entities.Amenity.filter({
    building_id: buildingId
  });
  return amenities || [];
}

export async function getBuildingAmenityReservations(buildingId) {
  if (!buildingId) return [];
  const amenities = await getBuildingAmenities(buildingId);
  if (!amenities.length) return [];
  const amenityIds = amenities.map(a => a.id);
  const reservations = await base44.entities.AmenityReservation.list();
  return reservations.filter(r => amenityIds.includes(r.amenity_id)) || [];
}

export async function getBuildingMaintenanceTickets(buildingId) {
  if (!buildingId) return [];
  const flats = await getBuildingFlats(buildingId);
  if (!flats.length) return [];
  const flatIds = flats.map(f => f.id);
  const tickets = await base44.entities.MaintenanceTicket.list();
  return tickets.filter(t => flatIds.includes(t.flat_id)) || [];
}

export async function getBuildingEventRSVPs(buildingId) {
  if (!buildingId) return [];
  const events = await getBuildingEvents(buildingId);
  if (!events.length) return [];
  const eventIds = events.map(e => e.id);
  const rsvps = await base44.entities.EventRSVP.list();
  return rsvps.filter(r => eventIds.includes(r.event_id)) || [];
}

/**
 * GLOBAL QUERIES (Cross-building)
 */

export async function getAllBuildings() {
  return await base44.entities.Building.list() || [];
}

export async function getAllPartners(activeOnly = false) {
  const partners = await base44.entities.Partner.list() || [];
  return activeOnly ? partners.filter(p => p.is_active) : partners;
}

export async function getAllPerkLocations(activeOnly = true) {
  const perks = await base44.entities.PerkLocation.list() || [];
  return activeOnly ? perks.filter(p => p.is_active) : perks;
}

export async function getAllPerkRedemptions() {
  return await base44.entities.PerkRedemption.list() || [];
}

export async function getGlobalSettings() {
  const settings = await base44.entities.GlobalSettings.list() || [];
  return settings[0] || null;
}

/**
 * ENGAGEMENT & REPORTING
 */

export async function getBuildingEngagementMetrics(buildingId) {
  if (!buildingId) return null;

  const [
    residents,
    events,
    eventRsvps,
    announcements,
    surveys,
    perks,
    redemptions,
  ] = await Promise.all([
    getBuildingResidents(buildingId),
    getBuildingEvents(buildingId),
    getBuildingEventRSVPs(buildingId),
    getBuildingAnnouncements(buildingId),
    getBuildingSurveys(buildingId),
    getAllPerkLocations(),
    getAllPerkRedemptions(),
  ]);

  const perksEnrolled = residents.filter(r => r.perks_enrolled).length;
  const totalRedemptions = redemptions.length;
  const avgRedemptionsPerResident = residents.length > 0
    ? (totalRedemptions / residents.length).toFixed(2)
    : 0;

  return {
    totalResidents: residents.length,
    perksEnrolled,
    perksEnrollmentRate: residents.length > 0
      ? ((perksEnrolled / residents.length) * 100).toFixed(1) + '%'
      : '0%',
    totalEvents: events.length,
    totalRsvps: eventRsvps.length,
    avgRsvpsPerEvent: events.length > 0
      ? (eventRsvps.length / events.length).toFixed(2)
      : 0,
    totalAnnouncements: announcements.length,
    totalSurveys: surveys.length,
    totalPerkRedemptions: totalRedemptions,
    avgRedemptionsPerResident,
    engagementScore: calculateEngagementScore({
      perksEnrolled,
      totalRsvps: eventRsvps.length,
      totalAnnouncements: announcements.length,
      totalRedemptions,
      residents: residents.length,
    }),
  };
}

function calculateEngagementScore({
  perksEnrolled,
  totalRsvps,
  totalAnnouncements,
  totalRedemptions,
  residents,
}) {
  if (residents === 0) return 0;
  const perkScore = (perksEnrolled / residents) * 25;
  const rsvpScore = Math.min((totalRsvps / residents) * 25, 25);
  const announceScore = Math.min((totalAnnouncements / 5) * 25, 25);
  const redemptionScore = Math.min((totalRedemptions / residents) * 25, 25);
  return Math.round(perkScore + rsvpScore + announceScore + redemptionScore);
}

export async function getPartnerPerformance(partnerId) {
  if (!partnerId) return null;

  const perks = await base44.entities.PerkLocation.filter({
    partner_id: partnerId,
  });
  const redemptions = await getAllPerkRedemptions();

  const perkIds = perks.map(p => p.id);
  const partnerRedemptions = redemptions.filter(r =>
    perkIds.includes(r.perk_id)
  );

  const uniqueUsers = new Set(partnerRedemptions.map(r => r.user_email)).size;

  return {
    partnerId,
    totalPerks: perks.length,
    totalRedemptions: partnerRedemptions.length,
    uniqueUsers,
    avgRedemptionsPerPerk: perks.length > 0
      ? (partnerRedemptions.length / perks.length).toFixed(2)
      : 0,
    topPerks: perks
      .map(p => ({
        ...p,
        redemptionCount: partnerRedemptions.filter(
          r => r.perk_id === p.id
        ).length,
      }))
      .sort((a, b) => b.redemptionCount - a.redemptionCount)
      .slice(0, 5),
  };
}

/**
 * PUBLIC DATA SELECTORS
 * These return only fields safe for public consumption
 */

export function makePublicBuilding(building) {
  if (!building) return null;
  return {
    id: building.id,
    name: building.name,
    address: building.address,
    district: building.district,
    tier: building.tier,
    type: building.type,
    lat: building.lat,
    lng: building.lng,
    units: building.units,
    priceTier: building.priceTier,
    walkScore: building.walkScore,
    tags: building.tags,
    perkDensity: building.perkDensity,
    activityScore: building.activityScore,
  };
}

export function makePublicEvent(event) {
  if (!event) return null;
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    category: event.category,
  };
}

export function makePublicPerk(perk) {
  if (!perk) return null;
  return {
    id: perk.id,
    name: perk.name,
    category: perk.category,
    address: perk.address,
    district: perk.district,
    lat: perk.lat,
    lng: perk.lng,
    perk: perk.perk,
    hours: perk.hours,
    website: perk.website,
    contact_phone: perk.contact_phone,
    specials: perk.specials,
    deals_offers: perk.deals_offers,
    is_featured: perk.is_featured,
    is_active: perk.is_active,
    map_link: perk.map_link,
  };
}

export function makePublicAnnouncement(announcement) {
  if (!announcement) return null;
  return {
    id: announcement.id,
    title: announcement.title,
    message: announcement.message,
    type: announcement.type,
    priority: announcement.priority,
    published_at: announcement.published_at,
  };
}

export async function getPublicBuildingProfile(buildingId) {
  const building = await base44.entities.Building.filter({
    id: buildingId,
  }).then(b => b?.[0]);
  return makePublicBuilding(building);
}

export async function getPublicEventListing(buildingId) {
  const events = await getBuildingEvents(buildingId);
  return events.map(makePublicEvent);
}

export async function getPublicPerkListing() {
  const perks = await getAllPerkLocations(true);
  return perks.map(makePublicPerk);
}

export async function getPublicAnnouncementListing(buildingId) {
  const announcements = await getBuildingAnnouncements(buildingId, true);
  return announcements.map(makePublicAnnouncement);
}

/**
 * AGGREGATION HELPERS
 */

export async function getBuildingResidentSegments(buildingId) {
  const residents = await getBuildingResidents(buildingId);
  const events = await getBuildingEvents(buildingId);
  const eventRsvps = await getBuildingEventRSVPs(buildingId);

  const rsvpedResidents = new Set(eventRsvps.map(r => r.user_email));

  return {
    total: residents.length,
    perksEnrolled: residents.filter(r => r.perks_enrolled).length,
    perksNotEnrolled: residents.filter(r => !r.perks_enrolled).length,
    paidUp: residents.filter(r => r.payment_status === 'paid').length,
    behindOnRent: residents.filter(r => r.payment_status === 'unpaid').length,
    eventEngaged: rsvpedResidents.size,
    eventDisengaged: residents.length - rsvpedResidents.size,
  };
}

export async function getPerkCategoryBreakdown() {
  const perks = await getAllPerkLocations();
  const categories = {};

  perks.forEach(perk => {
    const cat = perk.category || 'Other';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  return categories;
}

export async function getTopPerksOverall(limit = 10) {
  const redemptions = await getAllPerkRedemptions();
  const perks = await getAllPerkLocations();

  const perkMap = new Map(perks.map(p => [p.id, p]));
  const counts = {};

  redemptions.forEach(r => {
    counts[r.perk_id] = (counts[r.perk_id] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([perkId, count]) => ({
      perk: perkMap.get(perkId),
      redemptionCount: count,
    }))
    .filter(item => item.perk);
}

/**
 * FILTER & SEARCH HELPERS
 */

export async function searchPerks(query, filters = {}) {
  const perks = await getAllPerkLocations();
  let results = perks;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.perk.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    );
  }

  if (filters.category) {
    results = results.filter(p => p.category === filters.category);
  }

  if (filters.district) {
    results = results.filter(p => p.district === filters.district);
  }

  if (filters.featured !== undefined) {
    results = results.filter(p => p.is_featured === filters.featured);
  }

  return results;
}

export async function searchResidents(buildingId, query) {
  const residents = await getBuildingResidents(buildingId);
  if (!query) return residents;

  const q = query.toLowerCase();
  return residents.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.email.toLowerCase().includes(q) ||
    r.mobile_number?.includes(q)
  );
}