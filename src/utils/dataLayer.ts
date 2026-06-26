import { base44 } from "@/api/base44Client";

type AnyRecord = Record<string, any>;

export async function getBuildingEvents(buildingId: string) {
  if (!buildingId) return [];
  return (await base44.entities.Event.filter({ building_id: buildingId })) || [];
}

export async function getBuildingAnnouncements(buildingId: string, published = false) {
  if (!buildingId) return [];
  const query: AnyRecord = { building_id: buildingId };
  if (published) query.status = "published";
  return (await base44.entities.Announcement.filter(query)) || [];
}

export async function getBuildingSurveys(buildingId: string, active = false) {
  if (!buildingId) return [];
  const query: AnyRecord = { building_id: buildingId };
  if (active) query.status = "active";
  return (await base44.entities.Survey.filter(query)) || [];
}

export async function getBuildingBroadcasts(buildingId: string) {
  if (!buildingId) return [];
  return (await base44.entities.Broadcast.filter({ building_id: buildingId })) || [];
}

export async function getBuildingFlats(buildingId: string) {
  if (!buildingId) return [];
  return (await base44.entities.Flat.filter({ building_id: buildingId })) || [];
}

export async function getBuildingResidents(buildingId: string) {
  if (!buildingId) return [];
  const flats = await getBuildingFlats(buildingId);
  if (!flats.length) return [];
  const flatIds = flats.map((flat: AnyRecord) => flat.id);
  const tenants = (await base44.entities.Tenant.list()) || [];
  return tenants.filter((tenant: AnyRecord) => flatIds.includes(tenant.flat_id));
}

export async function getBuildingAmenities(buildingId: string) {
  if (!buildingId) return [];
  return (await base44.entities.Amenity.filter({ building_id: buildingId })) || [];
}

export async function getBuildingAmenityReservations(buildingId: string) {
  if (!buildingId) return [];
  const amenities = await getBuildingAmenities(buildingId);
  if (!amenities.length) return [];
  const amenityIds = amenities.map((amenity: AnyRecord) => amenity.id);
  const reservations = (await base44.entities.AmenityReservation.list()) || [];
  return reservations.filter((reservation: AnyRecord) => amenityIds.includes(reservation.amenity_id));
}

export async function getBuildingMaintenanceTickets(buildingId: string) {
  if (!buildingId) return [];
  const flats = await getBuildingFlats(buildingId);
  if (!flats.length) return [];
  const flatIds = flats.map((flat: AnyRecord) => flat.id);
  const tickets = (await base44.entities.MaintenanceTicket.list()) || [];
  return tickets.filter((ticket: AnyRecord) => flatIds.includes(ticket.flat_id));
}

export async function getBuildingEventRSVPs(buildingId: string) {
  if (!buildingId) return [];
  const events = await getBuildingEvents(buildingId);
  if (!events.length) return [];
  const eventIds = events.map((event: AnyRecord) => event.id);
  const rsvps = (await base44.entities.EventRSVP.list()) || [];
  return rsvps.filter((rsvp: AnyRecord) => eventIds.includes(rsvp.event_id));
}

export async function getAllBuildings() {
  return (await base44.entities.Building.list()) || [];
}

export async function getAllPartners(activeOnly = false) {
  const partners = (await base44.entities.Partner.list()) || [];
  return activeOnly ? partners.filter((partner: AnyRecord) => partner.is_active !== false) : partners;
}

export async function getAllPerkLocations(activeOnly = true) {
  const perks = (await base44.entities.PerkLocation.list()) || [];
  return activeOnly ? perks.filter((perk: AnyRecord) => perk.is_active !== false) : perks;
}

export async function getAllPerkRedemptions() {
  return (await base44.entities.PerkRedemption.list()) || [];
}

export async function getGlobalSettings() {
  const settings = (await base44.entities.GlobalSettings.list()) || [];
  return settings[0] || null;
}

export function calculateEngagementScore({
  perksEnrolled,
  totalRsvps,
  totalAnnouncements,
  totalRedemptions,
  residents,
}: {
  perksEnrolled: number;
  totalRsvps: number;
  totalAnnouncements: number;
  totalRedemptions: number;
  residents: number;
}) {
  if (residents === 0) return 0;
  const perkScore = (perksEnrolled / residents) * 25;
  const rsvpScore = Math.min((totalRsvps / residents) * 25, 25);
  const announceScore = Math.min((totalAnnouncements / 5) * 25, 25);
  const redemptionScore = Math.min((totalRedemptions / residents) * 25, 25);
  return Math.round(perkScore + rsvpScore + announceScore + redemptionScore);
}

export async function getBuildingEngagementMetrics(buildingId: string) {
  if (!buildingId) return null;

  const [residents, events, eventRsvps, announcements, surveys, redemptions] = await Promise.all([
    getBuildingResidents(buildingId),
    getBuildingEvents(buildingId),
    getBuildingEventRSVPs(buildingId),
    getBuildingAnnouncements(buildingId),
    getBuildingSurveys(buildingId),
    getAllPerkRedemptions(),
  ]);

  const perksEnrolled = residents.filter((resident: AnyRecord) => resident.perks_enrolled).length;
  const totalRedemptions = redemptions.length;

  return {
    totalResidents: residents.length,
    perksEnrolled,
    perksEnrollmentRate: residents.length > 0 ? `${((perksEnrolled / residents.length) * 100).toFixed(1)}%` : "0%",
    totalEvents: events.length,
    totalRsvps: eventRsvps.length,
    avgRsvpsPerEvent: events.length > 0 ? (eventRsvps.length / events.length).toFixed(2) : 0,
    totalAnnouncements: announcements.length,
    totalSurveys: surveys.length,
    totalPerkRedemptions: totalRedemptions,
    avgRedemptionsPerResident: residents.length > 0 ? (totalRedemptions / residents.length).toFixed(2) : 0,
    engagementScore: calculateEngagementScore({
      perksEnrolled,
      totalRsvps: eventRsvps.length,
      totalAnnouncements: announcements.length,
      totalRedemptions,
      residents: residents.length,
    }),
  };
}

export async function getPartnerPerformance(partnerId: string) {
  if (!partnerId) return null;

  const perks = await base44.entities.PerkLocation.filter({ partner_id: partnerId });
  const redemptions = await getAllPerkRedemptions();
  const perkIds = perks.map((perk: AnyRecord) => perk.id);
  const partnerRedemptions = redemptions.filter((redemption: AnyRecord) => perkIds.includes(redemption.perk_id));
  const uniqueUsers = new Set(partnerRedemptions.map((redemption: AnyRecord) => redemption.user_email)).size;

  return {
    partnerId,
    totalPerks: perks.length,
    totalRedemptions: partnerRedemptions.length,
    uniqueUsers,
    avgRedemptionsPerPerk: perks.length > 0 ? (partnerRedemptions.length / perks.length).toFixed(2) : 0,
    topPerks: perks
      .map((perk: AnyRecord) => ({
        ...perk,
        redemptionCount: partnerRedemptions.filter((redemption: AnyRecord) => redemption.perk_id === perk.id).length,
      }))
      .sort((a: AnyRecord, b: AnyRecord) => b.redemptionCount - a.redemptionCount)
      .slice(0, 5),
  };
}

export function makePublicBuilding(building: AnyRecord | null | undefined) {
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

export function makePublicEvent(event: AnyRecord | null | undefined) {
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

export function makePublicPerk(perk: AnyRecord | null | undefined) {
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

export function makePublicAnnouncement(announcement: AnyRecord | null | undefined) {
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

export async function getPublicBuildingProfile(buildingId: string) {
  const building = await base44.entities.Building.filter({ id: buildingId }).then((items) => items?.[0]);
  return makePublicBuilding(building);
}

export async function getPublicEventListing(buildingId: string) {
  const events = await getBuildingEvents(buildingId);
  return events.map(makePublicEvent).filter(Boolean);
}

export async function getPublicPerkListing() {
  const perks = await getAllPerkLocations(true);
  return perks.map(makePublicPerk).filter(Boolean);
}

export async function getPublicAnnouncementListing(buildingId: string) {
  const announcements = await getBuildingAnnouncements(buildingId, true);
  return announcements.map(makePublicAnnouncement).filter(Boolean);
}

export async function getBuildingResidentSegments(buildingId: string) {
  const residents = await getBuildingResidents(buildingId);
  const eventRsvps = await getBuildingEventRSVPs(buildingId);
  const rsvpedResidents = new Set(eventRsvps.map((rsvp: AnyRecord) => rsvp.user_email));

  return {
    total: residents.length,
    perksEnrolled: residents.filter((resident: AnyRecord) => resident.perks_enrolled).length,
    perksNotEnrolled: residents.filter((resident: AnyRecord) => !resident.perks_enrolled).length,
    paidUp: residents.filter((resident: AnyRecord) => resident.payment_status === "paid").length,
    behindOnRent: residents.filter((resident: AnyRecord) => resident.payment_status === "unpaid").length,
    eventEngaged: rsvpedResidents.size,
    eventDisengaged: residents.length - rsvpedResidents.size,
  };
}

export async function getPerkCategoryBreakdown() {
  const perks = await getAllPerkLocations();
  return perks.reduce((categories: Record<string, number>, perk: AnyRecord) => {
    const category = perk.category || "Other";
    categories[category] = (categories[category] || 0) + 1;
    return categories;
  }, {});
}

export async function getTopPerksOverall(limit = 10) {
  const redemptions = await getAllPerkRedemptions();
  const perks = await getAllPerkLocations();
  const perkMap = new Map(perks.map((perk: AnyRecord) => [perk.id, perk]));
  const counts = redemptions.reduce((acc: Record<string, number>, redemption: AnyRecord) => {
    acc[redemption.perk_id] = (acc[redemption.perk_id] || 0) + 1;
    return acc;
  }, {});

  return (Object.entries(counts) as Array<[string, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([perkId, count]) => ({ perk: perkMap.get(perkId), redemptionCount: count }))
    .filter((item) => item.perk);
}

export async function searchPerks(query: string, filters: { category?: string; district?: string; featured?: boolean } = {}) {
  const perks = await getAllPerkLocations();
  let results = perks;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter((perk: AnyRecord) =>
      [perk.name, perk.perk, perk.address].some((value) => String(value || "").toLowerCase().includes(q)),
    );
  }

  if (filters.category) results = results.filter((perk: AnyRecord) => perk.category === filters.category);
  if (filters.district) results = results.filter((perk: AnyRecord) => perk.district === filters.district);
  if (filters.featured !== undefined) results = results.filter((perk: AnyRecord) => perk.is_featured === filters.featured);

  return results;
}

export async function searchResidents(buildingId: string, query: string) {
  const residents = await getBuildingResidents(buildingId);
  if (!query) return residents;
  const q = query.toLowerCase();
  return residents.filter((resident: AnyRecord) =>
    [resident.name, resident.email, resident.mobile_number].some((value) => String(value || "").toLowerCase().includes(q)),
  );
}
