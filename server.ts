import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { GoogleGenAI, Type } from "@google/genai";
import { enterpriseComponents, platformArchitecture, platformDomains, serializePlatformDomain } from "./src/platform/registry";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const dataDir = isServerless ? path.join("/tmp", "downtown-perks-backend") : path.join(__dirname, "data");
const dbPath = path.join(dataDir, "downtown-perks-db.json");
const PORT = Number(process.env.PORT || 3000);

type EntityName =
  | "Building"
  | "Flat"
  | "Tenant"
  | "Broadcast"
  | "Survey"
  | "Announcement"
  | "Partner"
  | "PerkLocation"
  | "PerkRedemption"
  | "Event"
  | "EventRSVP"
  | "PartnerMessage"
  | "Amenity"
  | "AmenityReservation"
  | "MaintenanceTicket"
  | "Campaign"
  | "DANAMember"
  | "User"
  | "SurveyResponse"
  | "SurveyExportLog"
  | "ManagementNotification"
  | "ProductOffering"
  | "GlobalSettings"
  | "BuildingDocument"
  | "SurveyProviderForm"
  | "MessagingJourney"
  | "SmsMessageLog"
  | "PassportProgram"
  | "PassportStamp"
  | "IntegrationEndpoint"
  | "AutomationRun"
  | "AiInsight"
  | "CrmSegment"
  | "PlatformTenant"
  | "TenantWorkspace"
  | "TenantUser"
  | "TenantRole"
  | "PartnerProfile"
  | "PartnerLocation"
  | "PartnerOffer"
  | "PartnerEvent"
  | "PartnerReport"
  | "PartnerAnalytics"
  | "PartnerSettings"
  | "PartnerRegistration"
  | "PartnerSubscription"
  | "PartnerInvoice"
  | "PartnerQrExperience"
  | "PartnerAiContext"
  | "PartnerWorkspaceModule"
  | "TenantNotification"
  | "TenantAuditLog"
  | "MapEntityLink";

type EntityRecord = Record<string, any> & { id: string; created_at?: string; updated_at?: string };
type Database = {
  meta: { version: number; seeded_at: string };
  entities: Record<EntityName, EntityRecord[]>;
};

const entityNames: EntityName[] = [
  "Building",
  "Flat",
  "Tenant",
  "Broadcast",
  "Survey",
  "Announcement",
  "Partner",
  "PerkLocation",
  "PerkRedemption",
  "Event",
  "EventRSVP",
  "PartnerMessage",
  "Amenity",
  "AmenityReservation",
  "MaintenanceTicket",
  "Campaign",
  "DANAMember",
  "User",
  "SurveyResponse",
  "SurveyExportLog",
  "ManagementNotification",
  "ProductOffering",
  "GlobalSettings",
  "BuildingDocument",
  "SurveyProviderForm",
  "MessagingJourney",
  "SmsMessageLog",
  "PassportProgram",
  "PassportStamp",
  "IntegrationEndpoint",
  "AutomationRun",
  "AiInsight",
  "CrmSegment",
  "PlatformTenant",
  "TenantWorkspace",
  "TenantUser",
  "TenantRole",
  "PartnerProfile",
  "PartnerLocation",
  "PartnerOffer",
  "PartnerEvent",
  "PartnerReport",
  "PartnerAnalytics",
  "PartnerSettings",
  "PartnerRegistration",
  "PartnerSubscription",
  "PartnerInvoice",
  "PartnerQrExperience",
  "PartnerAiContext",
  "PartnerWorkspaceModule",
  "TenantNotification",
  "TenantAuditLog",
  "MapEntityLink",
];

const now = () => new Date().toISOString();
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const tenantTypes = ["property", "hotel", "venue", "brand", "civic", "service", "sponsor", "real_estate"] as const;
type TenantType = (typeof tenantTypes)[number];

const defaultTenantRoles = [
  { name: "Owner", permissions: ["workspace:manage", "billing:manage", "users:manage", "reports:view", "analytics:view", "offers:manage", "events:manage", "messages:manage"] },
  { name: "Admin", permissions: ["workspace:manage", "users:manage", "reports:view", "analytics:view", "offers:manage", "events:manage", "messages:manage"] },
  { name: "Manager", permissions: ["reports:view", "analytics:view", "offers:manage", "events:manage", "messages:manage"] },
  { name: "Staff", permissions: ["offers:view", "events:view", "messages:reply", "redemptions:verify"] },
  { name: "Viewer", permissions: ["reports:view", "analytics:view"] },
];

const mapVisibleOrganizations = [
  { map_entity_id: "svc-1", name: "Fine Eyewear", type: "service", category: "Service", perk: "20% Off Comprehensive Exam & Frames", address: "2nd Street District" },
  { map_entity_id: "civ-1", name: "DANA", type: "civic", category: "Civic", perk: "Annual Meeting RSVP", address: "Downtown Austin Neighborhood Association" },
  { map_entity_id: "htl-1", name: "Hotel Van Zandt", type: "hotel", category: "Hotel", perk: "Complimentary Valet with Geraldine's Dinner", address: "605 Davis St, Austin, TX" },
  { map_entity_id: "htl-2", name: "Four Seasons", type: "hotel", category: "Hotel", perk: "15% Off Spa Services", address: "98 San Jacinto Blvd, Austin, TX" },
  { map_entity_id: "cof-1", name: "Jo's Coffee", type: "venue", category: "Food & Bev", perk: "Free Size Upgrade", address: "242 W 2nd St, Austin, TX" },
  { map_entity_id: "venue-1", name: "Half Step", type: "venue", category: "Food & Bev", perk: "Free Specialty Cocktail", address: "75 1/2 Rainey St" },
  { map_entity_id: "brand-1", name: "Rivian", type: "brand", category: "Brand", perk: "Exclusive Test Drive", address: "South Congress" },
  { map_entity_id: "venue-2", name: "Stay Put", type: "venue", category: "Food & Bev", perk: "Free Appetizer", address: "73 Rainey St" },
  { map_entity_id: "brand-2", name: "YETI", type: "brand", category: "Brand", perk: "10% Off Flagship Store", address: "South Congress" },
  { map_entity_id: "brand-3", name: "lululemon", type: "brand", category: "Brand", perk: "Private Studio Class", address: "By the lake" },
  { map_entity_id: "civic-waterloo-greenway", name: "Waterloo Greenway", type: "civic", category: "Civic", address: "Downtown Austin" },
  { map_entity_id: "civic-visit-austin", name: "Visit Austin", type: "civic", category: "Civic", address: "Austin, TX" },
  { map_entity_id: "sponsor-legends", name: "Legends", type: "real_estate", category: "Property Group", address: "Austin, TX" },
  { map_entity_id: "property-waterline", name: "Waterline", type: "property", category: "Property", address: "Downtown Austin" },
];

function withTimestamps<T extends Record<string, any>>(record: T, id: string): EntityRecord {
  const timestamp = now();
  return { id, created_at: timestamp, updated_at: timestamp, ...record };
}

function normalizeTenantType(value: any): TenantType {
  const raw = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (raw.includes("hotel") || raw.includes("hospitality")) return "hotel";
  if (raw.includes("property") || raw.includes("building") || raw.includes("apartment") || raw.includes("condo")) return "property";
  if (raw.includes("civic") || raw.includes("association") || raw.includes("district")) return "civic";
  if (raw.includes("brand")) return "brand";
  if (raw.includes("service") || raw.includes("wellness") || raw.includes("fitness")) return "service";
  if (raw.includes("sponsor")) return "sponsor";
  if (raw.includes("real_estate") || raw.includes("developer")) return "real_estate";
  return "venue";
}

function tenantIdFromSlug(tenantSlug: string) {
  return `tenant_${tenantSlug}`;
}

function ensureRecord(collection: EntityRecord[], id: string, data: Record<string, any>) {
  const existing = collection.find((item) => item.id === id);
  if (existing) {
    Object.assign(existing, { ...data, id, updated_at: now() });
    return existing;
  }
  const created = withTimestamps(data, id);
  collection.push(created);
  return created;
}

function provisionPlatformTenant(entities: Database["entities"], source: Record<string, any>) {
  const name = source.name || source.business_name || source.title;
  if (!name) return null;

  const tenantSlug = slug(name).replace(/_/g, "-");
  const tenantId = tenantIdFromSlug(tenantSlug);
  const type = normalizeTenantType(source.type || source.category || source.category_key);
  const workspaceId = `workspace_${tenantSlug}`;

  const tenant = ensureRecord(entities.PlatformTenant, tenantId, {
    name,
    slug: tenantSlug,
    type,
    status: source.status || "active",
    source_type: source.source_type || "provisioning",
    source_id: source.source_id || source.id || source.map_entity_id || null,
    public_map_entity_id: source.map_entity_id || null,
  });

  ensureRecord(entities.TenantWorkspace, workspaceId, {
    tenant_id: tenant.id,
    slug: tenantSlug,
    path: `/tenant/${tenantSlug}`,
    status: "active",
    modules: ["dashboard", "perks", "events", "messages", "analytics", "reports", "settings"],
    default_route: `/tenant/${tenantSlug}/dashboard`,
  });

  defaultTenantRoles.forEach((role) => {
    ensureRecord(entities.TenantRole, `role_${tenantSlug}_${slug(role.name)}`, {
      tenant_id: tenant.id,
      workspace_id: workspaceId,
      role: role.name,
      permissions: role.permissions,
    });
  });

  ensureRecord(entities.PartnerProfile, `profile_${tenantSlug}`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    partner_id: source.partner_id || (source.source_type === "partner" ? source.source_id : null),
    display_name: name,
    type,
    category: source.category || source.category_key || type,
    address: source.address || "",
    status: "active",
  });

  ensureRecord(entities.PartnerAnalytics, `analytics_${tenantSlug}`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    views: Number(source.views || 0),
    saves: Number(source.saves || 0),
    directions: Number(source.directions || 0),
    redemptions: Number(source.redemptions || source.redemption_count || 0),
    guests_reached: Number(source.guests_reached || source.reach || 0),
    revenue_estimate: Number(source.revenue_estimate || 0),
    status: "tracking_enabled",
  });

  ensureRecord(entities.PartnerReport, `report_container_${tenantSlug}`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    report_types: ["Monthly Summary", "Traffic", "Conversions", "Partner Report"],
    status: "enabled",
  });

  ensureRecord(entities.PartnerSettings, `settings_${tenantSlug}`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    notifications_enabled: true,
    modules_enabled: ["perks", "events", "surveys", "messaging", "reporting", "analytics"],
    row_level_tenant_isolation: true,
  });

  ensureRecord(entities.TenantNotification, `notification_${tenantSlug}_default`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    channel: "workspace",
    rule: "default_partner_updates",
    status: "active",
  });

  ensureRecord(entities.TenantAuditLog, `audit_${tenantSlug}_provisioned`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    actor_id: "system",
    action: "tenant_workspace_provisioned",
    resource: source.source_type || "map_entity",
    timestamp: now(),
  });

  if (source.map_entity_id || source.id) {
    ensureRecord(entities.MapEntityLink, `map_link_${source.map_entity_id || source.id}`, {
      tenant_id: tenant.id,
      workspace_id: workspaceId,
      entity_id: source.map_entity_id || source.id,
      partner_id: source.partner_id || (source.source_type === "partner" ? source.source_id : null),
      source_type: source.source_type || "map_entity",
      status: "linked",
    });
  }

  if (source.perk) {
    ensureRecord(entities.PartnerOffer, `offer_${tenantSlug}_${slug(source.perk)}`, {
      tenant_id: tenant.id,
      workspace_id: workspaceId,
      title: source.perk,
      status: "active",
      source_type: source.source_type || "map_entity",
      redemption_rules: source.perkRedemption || "Show Resident Card",
    });
  }

  if (type === "hotel" || type === "civic") {
    ensureRecord(entities.PartnerEvent, `event_container_${tenantSlug}`, {
      tenant_id: tenant.id,
      workspace_id: workspaceId,
      status: "enabled",
      event_types: type === "hotel" ? ["Live Music", "Lobby Events", "Resident Nights"] : ["Events", "Volunteer Signups", "Community Surveys", "Meetings"],
    });
  }

  return tenant;
}

function provisionAllPlatformTenants(entities: Database["entities"]) {
  mapVisibleOrganizations.forEach((organization) => provisionPlatformTenant(entities, { ...organization, source_type: "resident_map" }));

  entities.Building.forEach((building) =>
    provisionPlatformTenant(entities, {
      name: building.name,
      type: "property",
      category: "Property",
      address: building.address,
      source_type: "building",
      source_id: building.id,
      map_entity_id: building.id === "bldg_shore" ? "prop-1" : building.id,
    })
  );

  entities.Partner.forEach((partner) =>
    provisionPlatformTenant(entities, {
      name: partner.business_name,
      type: normalizeTenantType(partner.category),
      category: partner.category,
      address: partner.address,
      source_type: "partner",
      source_id: partner.id,
      partner_id: partner.id,
    })
  );

  entities.PerkLocation.forEach((perk) => {
    const tenant = provisionPlatformTenant(entities, {
      name: perk.name,
      type: normalizeTenantType(perk.category),
      category: perk.category,
      address: perk.address,
      source_type: "perk_location",
      source_id: perk.id,
      partner_id: perk.partner_id,
      perk: perk.perk || perk.title,
      redemption_count: perk.redemption_count,
    });
    if (tenant) {
      perk.tenant_id = tenant.id;
      perk.workspace_id = `workspace_${tenant.slug}`;
    }
  });

  entities.Partner.forEach((partner) => {
    const tenant = entities.PlatformTenant.find((item) => item.source_id === partner.id || item.name === partner.business_name);
    if (tenant) {
      partner.tenant_id = tenant.id;
      partner.workspace_id = `workspace_${tenant.slug}`;
    }
  });
}

function createSeedDatabase(): Database {
  const building1 = withTimestamps(
    {
      name: "The Shore",
      address: "603 Davis St, Austin, TX",
      district: "rainey",
      tier: 1,
      type: "condo",
      lat: 30.2591,
      lng: -97.7382,
      units: 156,
      totalUnits: 156,
      tenants: 128,
      yearBuilt: 2020,
      priceTier: "premium",
      walkScore: 92,
      perkDensity: 0.86,
      activityScore: 0.78,
      accessCode: "SHORE26",
      status: "occupied",
      amenities: ["Rooftop lounge", "Fitness center", "Pool", "Concierge"],
      photos: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80"],
      tags: ["downtown", "walkable", "premium"],
    },
    "bldg_shore"
  );
  const building2 = withTimestamps(
    {
      name: "Downtown Heights",
      address: "400 W 2nd St, Austin, TX",
      district: "warehouse",
      tier: 2,
      type: "apartment",
      lat: 30.2657,
      lng: -97.7476,
      units: 98,
      totalUnits: 98,
      tenants: 84,
      yearBuilt: 2018,
      priceTier: "luxury",
      walkScore: 96,
      perkDensity: 0.91,
      activityScore: 0.84,
      accessCode: "HEIGHTS26",
      status: "occupied",
      amenities: ["Co-working", "Pet spa", "Sky deck"],
      photos: ["https://images.unsplash.com/photo-1560448204-61dc36dc98c8?auto=format&fit=crop&w=900&q=80"],
      tags: ["warehouse", "luxury", "nightlife"],
    },
    "bldg_heights"
  );
  const building3 = withTimestamps(
    {
      name: "Riverside Towers",
      address: "35 River Walk, Austin, TX",
      district: "cbd",
      tier: 3,
      type: "mixed_use",
      lat: 30.2615,
      lng: -97.7442,
      units: 300,
      totalUnits: 300,
      tenants: 246,
      yearBuilt: 2022,
      priceTier: "mid",
      walkScore: 88,
      perkDensity: 0.73,
      activityScore: 0.66,
      accessCode: "RIVER26",
      status: "available",
      amenities: ["Spa", "Gym", "Resident events"],
      photos: ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80"],
      tags: ["river", "mixed-use", "family-friendly"],
    },
    "bldg_riverside"
  );

  const flats = [
    withTimestamps({ building_id: building1.id, flat_number: "1501", floor: 15, listing_type: "rental", price: 2800, beds: 2, baths: 2, sqft: 1120, room_type: "2-Bedroom", is_occupied: true }, "flat_1501"),
    withTimestamps({ building_id: building1.id, flat_number: "1502", floor: 15, listing_type: "rental", price: 2450, beds: 1, baths: 1, sqft: 760, room_type: "1-Bedroom", is_occupied: true }, "flat_1502"),
    withTimestamps({ building_id: building2.id, flat_number: "2204", floor: 22, listing_type: "rental", price: 3200, beds: 2, baths: 2, sqft: 1180, room_type: "2-Bedroom", is_occupied: true }, "flat_2204"),
    withTimestamps({ building_id: building3.id, flat_number: "804", floor: 8, listing_type: "rental", price: 2100, beds: 1, baths: 1, sqft: 710, room_type: "1-Bedroom", is_occupied: false }, "flat_804"),
  ];

  const tenants = [
    withTimestamps({ flat_id: "flat_1501", name: "Sarah Johnson", email: "sarah.j@example.com", mobile_number: "+15125550101", preferred_language: "en", move_in_date: "2024-06-15", lease_end_date: "2026-06-14", yearly_rent: 33600, rent_interval_months: 1, rent_per_interval: 2800, next_payment_date: "2026-07-01", last_payment_date: "2026-06-01", payment_status: "paid", perks_enrolled: true, per_enrolled: true, perks_tier: "premium", notes: "Interested in wellness events." }, "tenant_sarah"),
    withTimestamps({ flat_id: "flat_1502", name: "Michael Chen", email: "m.chen@example.com", mobile_number: "+15125550102", preferred_language: "en", move_in_date: "2023-09-01", lease_end_date: "2026-08-31", yearly_rent: 29400, rent_interval_months: 1, rent_per_interval: 2450, next_payment_date: "2026-07-01", last_payment_date: "2026-06-01", payment_status: "paid", perks_enrolled: true, per_enrolled: true, perks_tier: "standard" }, "tenant_michael"),
    withTimestamps({ flat_id: "flat_2204", name: "Avery Brooks", email: "avery@example.com", mobile_number: "+15125550103", preferred_language: "en", move_in_date: "2025-01-12", lease_end_date: "2027-01-11", yearly_rent: 38400, rent_interval_months: 1, rent_per_interval: 3200, next_payment_date: "2026-07-01", last_payment_date: "2026-06-01", payment_status: "paid", perks_enrolled: true, per_enrolled: true, perks_tier: "vip" }, "tenant_avery"),
    withTimestamps({ flat_id: "flat_804", name: "Jamie Wilson", email: "jamie@example.com", mobile_number: "+15125550104", preferred_language: "en", move_in_date: "2026-02-01", lease_end_date: "2027-01-31", yearly_rent: 25200, rent_interval_months: 1, rent_per_interval: 2100, next_payment_date: "2026-07-01", last_payment_date: "2026-06-01", payment_status: "unpaid", perks_enrolled: false, per_enrolled: false, perks_tier: "standard" }, "tenant_jamie"),
  ];

  const partners = [
    withTimestamps({ business_name: "Houndstooth Coffee", contact_email: "hello@houndstooth.example", contact_phone: "+15125551001", contact_person: "Store Manager", category: "coffee", is_active: true, join_date: "2026-01-15", address: "401 Congress Ave" }, "partner_houndstooth"),
    withTimestamps({ business_name: "Equinox Gym", contact_email: "partners@equinox.example", contact_phone: "+15125551002", contact_person: "Membership Lead", category: "fitness", is_active: true, join_date: "2026-02-10", address: "1000 W 6th St" }, "partner_equinox"),
    withTimestamps({ business_name: "Uchi", contact_email: "events@uchi.example", contact_phone: "+15125551003", contact_person: "Hospitality Lead", category: "dining", is_active: true, join_date: "2026-03-05", address: "801 S Lamar Blvd" }, "partner_uchi"),
    withTimestamps({ business_name: "ACL Live", contact_email: "vip@acllive.example", contact_phone: "+15125551004", contact_person: "Partnerships", category: "entertainment", is_active: true, join_date: "2026-04-12", address: "310 W 2nd St" }, "partner_acl"),
  ];

  const perkLocations = [
    withTimestamps({ partner_id: "partner_houndstooth", name: "Houndstooth Coffee", title: "15% Off Your Daily Brew", category: "Coffee", category_key: "coffee", address: "401 Congress Ave", district: "cbd", lat: 30.2662, lng: -97.7431, perk: "15% off espresso drinks and drip coffee", perk_type: "Discount", active: true, is_active: true, is_featured: true, redemption_count: 342, relevance_score: 0.95, hours: "7am-6pm", website: "https://example.com/houndstooth" }, "perk_houndstooth"),
    withTimestamps({ partner_id: "partner_equinox", name: "Equinox Gym", title: "Waived Initiation Fee", category: "Fitness", category_key: "fitness", address: "1000 W 6th St", district: "west_end", lat: 30.2705, lng: -97.7554, perk: "Waived initiation fee for Downtown Perks residents", perk_type: "Promotion", active: true, is_active: true, is_featured: true, redemption_count: 89, relevance_score: 0.84, hours: "5am-10pm", website: "https://example.com/equinox" }, "perk_equinox"),
    withTimestamps({ partner_id: "partner_uchi", name: "Uchi", title: "Priority Seating", category: "Dining", category_key: "dining", address: "801 S Lamar Blvd", district: "south_lamar", lat: 30.2576, lng: -97.7594, perk: "Priority seating for residents on weekdays", perk_type: "VIP Access", active: true, is_active: true, is_featured: false, redemption_count: 450, relevance_score: 0.91, hours: "4pm-10pm", website: "https://example.com/uchi" }, "perk_uchi"),
    withTimestamps({ partner_id: "partner_acl", name: "ACL Live", title: "Skip The Line Pass", category: "Entertainment", category_key: "entertainment", address: "310 W 2nd St", district: "warehouse", lat: 30.2651, lng: -97.7472, perk: "Skip-the-line entry for selected shows", perk_type: "VIP Access", active: true, is_active: true, is_featured: true, redemption_count: 120, relevance_score: 0.89, hours: "Event hours", website: "https://example.com/acl" }, "perk_acl"),
  ];

  const redemptions = [
    withTimestamps({ perk_id: "perk_houndstooth", perkId: "perk_houndstooth", propertyId: building1.id, perk_name: "Houndstooth Coffee", perk_category: "Coffee", user_email: "sarah.j@example.com", user_name: "Sarah Johnson", timestamp: "2026-06-12T08:30:00Z", redeemed_at: "2026-06-12T08:30:00Z", is_verified: true }, "red_1"),
    withTimestamps({ perk_id: "perk_houndstooth", perkId: "perk_houndstooth", propertyId: building1.id, perk_name: "Houndstooth Coffee", perk_category: "Coffee", user_email: "m.chen@example.com", user_name: "Michael Chen", timestamp: "2026-06-13T09:15:00Z", redeemed_at: "2026-06-13T09:15:00Z", is_verified: true }, "red_2"),
    withTimestamps({ perk_id: "perk_uchi", perkId: "perk_uchi", propertyId: building2.id, perk_name: "Uchi", perk_category: "Dining", user_email: "avery@example.com", user_name: "Avery Brooks", timestamp: "2026-06-14T19:45:00Z", redeemed_at: "2026-06-14T19:45:00Z", is_verified: true }, "red_3"),
    withTimestamps({ perk_id: "perk_acl", perkId: "perk_acl", propertyId: building3.id, perk_name: "ACL Live", perk_category: "Entertainment", user_email: "jamie@example.com", user_name: "Jamie Wilson", timestamp: "2026-06-15T21:00:00Z", redeemed_at: "2026-06-15T21:00:00Z", is_verified: true }, "red_4"),
  ];

  const entities = Object.fromEntries(entityNames.map((name) => [name, []])) as Database["entities"];
  entities.Building = [building1, building2, building3];
  entities.Flat = flats;
  entities.Tenant = tenants;
  entities.Partner = partners;
  entities.PerkLocation = perkLocations;
  entities.PerkRedemption = redemptions;
  entities.Broadcast = [
    withTimestamps({ building_id: building1.id, delivery_status: "sent", title: "Welcome to Downtown Perks", subject: "Welcome to Downtown Perks", message: "Your resident perks are live.", sent_at: "2026-06-01T14:00:00Z" }, "broadcast_welcome"),
  ];
  entities.Announcement = [
    withTimestamps({ building_id: building1.id, title: "Summer Pool Party Series", description: "Join us every Saturday in July for live music and complimentary drinks at the rooftop pool.", message: "Join us every Saturday in July for live music and complimentary drinks at the rooftop pool.", category: "event", type: "community_news", priority: "medium", status: "published", date: "2026-06-15", published_at: "2026-06-15T10:00:00Z", read_count: 48 }, "ann_pool"),
    withTimestamps({ building_id: building2.id, title: "New Partner Perks: Local Coffee", description: "Flash your digital resident card for 15% off espresso drinks.", message: "Flash your digital resident card for 15% off espresso drinks.", category: "general", type: "community_news", priority: "low", status: "published", date: "2026-06-12", published_at: "2026-06-12T10:00:00Z", read_count: 36 }, "ann_coffee"),
  ];
  entities.Survey = [
    withTimestamps({ building_id: building1.id, title: "Community Satisfaction Survey", description: "Help us improve resident programming.", status: "active", responses_count: 45, target_residents: 150, starts_at: "2026-06-01", ends_at: "2026-07-01", questions: [{ id: "q1", text: "How satisfied are you with the building amenities?", type: "rating" }] }, "survey_satisfaction"),
  ];
  entities.Event = [
    withTimestamps({ title: "Rooftop Yoga", description: "Start your morning with skyline yoga on the resident roof deck.", category: "wellness", date: "2026-06-25", time: "9:00 AM", location: "The Shore Rooftop", address: building1.address, lat: building1.lat, lng: building1.lng, building_id: building1.id, capacity: 30, registered_count: 1, image_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80", status: "upcoming" }, "event_rooftop_yoga"),
    withTimestamps({ title: "Residents Social Hour", description: "Meet neighbors and partner venues over light bites.", category: "social", date: "2026-06-28", time: "5:00 PM", location: "Downtown Heights Lounge", address: building2.address, lat: building2.lat, lng: building2.lng, building_id: building2.id, partner_id: "partner_houndstooth", capacity: 50, registered_count: 0, image_url: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80", status: "upcoming" }, "event_social_hour"),
  ];
  entities.EventRSVP = [
    withTimestamps({ tenant_id: "tenant_sarah", event_id: "event_rooftop_yoga", event_name: "Rooftop Yoga", event_date: "2026-06-25", registered_at: "2026-06-18T12:00:00Z" }, "rsvp_yoga"),
  ];
  entities.PartnerMessage = [
    withTimestamps({ partner_id: "partner_houndstooth", subject: "Monthly performance summary", message: "Coffee redemptions are pacing ahead of goal.", status: "unread" }, "msg_houndstooth"),
  ];
  entities.Campaign = [
    withTimestamps({ building_id: building1.id, name: "Weekend Dining Promo", subject: "Weekend Dining Promo", segment_target: "Power User", message: "Try a featured dining partner this weekend.", recipients_count: 128, sent_at: "2026-06-08T15:00:00Z", opens: 74, clicks: 31, conversions: 12, open_rate: 58, click_rate: 42, conversion_rate: 9, status: "completed" }, "campaign_dining"),
  ];
  entities.User = [
    withTimestamps({ role: "admin", name: "Demo Admin", full_name: "Demo Admin", email: "admin@downtownperks.local", preferences: {} }, "user_admin"),
  ];
  addOperationalDefaults(entities);

  return { meta: { version: 1, seeded_at: now() }, entities };
}

function addOperationalDefaults(entities: Database["entities"]) {
  if (entities.GlobalSettings.length === 0) {
    entities.GlobalSettings.push(
      withTimestamps(
        {
          business_name: "Downtown Perks",
          business_name_ar: "Downtown Perks",
          business_logo: "",
          partner_report_spreadsheet_id: "",
          partner_report_spreadsheet_url: "",
        },
        "settings_global"
      )
    );
  }

  if (entities.ProductOffering.length === 0) {
    entities.ProductOffering.push(
      withTimestamps({ name: "Downtown Perks Partner Subscription", display_name: "Partner Subscription", family: "Subscription", kind: "subscription", amount: 299, currency: "usd", interval: "month", stripe_price_id: "price_local_partner_subscription", stripe_product_id: "prod_local_partner_subscription" }, "product_partner_subscription"),
      withTimestamps({ name: "Resident Engagement Analytics", display_name: "Engagement Analytics", family: "Analytics", kind: "addon", amount: 149, currency: "usd", interval: "month", stripe_price_id: "price_local_analytics", stripe_product_id: "prod_local_analytics" }, "product_engagement_analytics"),
      withTimestamps({ name: "Featured Placement", display_name: "Featured Placement", family: "Placements", kind: "addon", amount: 99, currency: "usd", interval: "one_time", stripe_price_id: "price_local_featured", stripe_product_id: "prod_local_featured" }, "product_featured_placement")
    );
  }

  if (entities.Amenity.length === 0) {
    entities.Amenity.push(
      withTimestamps({ building_id: "bldg_shore", name: "Rooftop Lounge", description: "Resident skyline lounge available by reservation.", capacity: 50, hours_start: "06:00", hours_end: "23:00", slot_duration: 60, is_active: true }, "amenity_rooftop"),
      withTimestamps({ building_id: "bldg_heights", name: "Co-Working Studio", description: "Shared work lounge for residents and guests.", capacity: 25, hours_start: "08:00", hours_end: "20:00", slot_duration: 120, is_active: true }, "amenity_coworking")
    );
  }

  if (entities.SurveyResponse.length === 0) {
    entities.SurveyResponse.push(
      withTimestamps({ survey_id: "survey_satisfaction", survey_name: "Community Satisfaction Survey", resident_id: "tenant_sarah", resident_name: "Sarah Johnson", resident_email: "sarah.j@example.com", building_id: "bldg_shore", building_name: "The Shore", answers: [{ question: "How satisfied are you with the building amenities?", answer: "Very satisfied" }], score: 92, sentiment: "positive", completed_at: "2026-06-18T15:00:00Z", exported_to_google_sheets: false, notification_sent: true, source_flow: "resident-survey" }, "survey_response_sarah")
    );
  }

  if (entities.ManagementNotification.length === 0) {
    entities.ManagementNotification.push(
      withTimestamps({ type: "survey-completed", resident_id: "tenant_sarah", resident_name: "Sarah Johnson", building_id: "bldg_shore", building_name: "The Shore", survey_response_id: "survey_response_sarah", message: "Sarah Johnson completed Community Satisfaction Survey with a positive score.", status: "sent", channel: "in-app", recipient_email: "admin@downtownperks.local", sent_at: "2026-06-18T15:01:00Z" }, "notification_survey_sarah")
    );
  }

  if (entities.SurveyExportLog.length === 0) {
    entities.SurveyExportLog.push(
      withTimestamps({ survey_response_id: "survey_response_sarah", status: "success", destination: "local-json", attempted_at: "2026-06-18T15:02:00Z", completed_at: "2026-06-18T15:02:00Z", row_id: "local-row-1" }, "survey_export_sarah")
    );
  }

  if (entities.Event.length === 0) {
    entities.Event.push(
      withTimestamps({ title: "Rooftop Yoga", description: "Start your morning with skyline yoga on the resident roof deck.", category: "wellness", date: "2026-06-25", time: "9:00 AM", location: "The Shore Rooftop", address: "603 Davis St, Austin, TX", lat: 30.2591, lng: -97.7382, building_id: "bldg_shore", capacity: 30, registered_count: 1, image_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80", status: "upcoming" }, "event_rooftop_yoga")
    );
  }

  if (entities.SurveyProviderForm.length === 0) {
    entities.SurveyProviderForm.push(
      withTimestamps({
        provider: "Tally",
        provider_key: "tally",
        name: "Resident Onboarding",
        purpose: "Capture building, interests, phone verification readiness, and resident profile preferences.",
        use_case: "resident_onboarding",
        status: "recommended",
        embed_status: "pending_credentials",
        webhook_status: "pending",
        destination_tables: ["residents", "survey_responses", "crm_segments"],
        google_sheets_sync: true,
        fields: ["building", "interests", "phone", "dining", "fitness", "events", "nightlife"],
      }, "survey_provider_tally_onboarding"),
      withTimestamps({
        provider: "Tally",
        provider_key: "tally",
        name: "Perk Redemption Feedback",
        purpose: "Capture experience rating, return intent, and operational feedback after a redemption.",
        use_case: "perk_redemption_feedback",
        status: "recommended",
        embed_status: "pending_credentials",
        webhook_status: "pending",
        destination_tables: ["survey_responses", "perk_redemptions", "partner_reports"],
        google_sheets_sync: true,
        fields: ["rating", "would_return", "what_improved", "partner_id", "perk_id"],
      }, "survey_provider_tally_redemption"),
      withTimestamps({
        provider: "Jotform",
        provider_key: "jotform",
        name: "Partner Application",
        purpose: "Operational partner, property, hotel, brand, civic, and grant-style intake.",
        use_case: "partner_application",
        status: "available",
        embed_status: "pending_credentials",
        webhook_status: "pending",
        destination_tables: ["partner_leads", "partner_profiles", "tenant_workspaces"],
        google_sheets_sync: true,
        fields: ["organization", "partner_type", "location", "contact", "package_interest"],
      }, "survey_provider_jotform_partner_application"),
      withTimestamps({
        provider: "SurveyJS",
        provider_key: "surveyjs",
        name: "Resident Intelligence Platform",
        purpose: "Self-hosted survey engine option for advanced ownership and custom React flows.",
        use_case: "resident_intelligence",
        status: "future_phase",
        embed_status: "not_started",
        webhook_status: "not_started",
        destination_tables: ["survey_responses", "event_feedback", "resident_profiles"],
        google_sheets_sync: false,
        fields: ["custom_schema"],
      }, "survey_provider_surveyjs_resident_intelligence")
    );
  }

  if (entities.IntegrationEndpoint.length === 0) {
    entities.IntegrationEndpoint.push(
      withTimestamps({ name: "Tally Webhooks", provider: "Tally", layer: "Survey Engine", purpose: "Resident surveys, event feedback, and perk redemption forms.", status: "pending_credentials", required_env: ["TALLY_WEBHOOK_SECRET"] }, "integration_tally"),
      withTimestamps({ name: "Twilio Verify", provider: "Twilio", layer: "Messaging", purpose: "Verified phone onboarding before SMS journeys.", status: "pending_credentials", required_env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"] }, "integration_twilio_verify"),
      withTimestamps({ name: "Twilio Messaging", provider: "Twilio", layer: "Messaging", purpose: "Resident reminders, event automation, passport messages, and partner intelligence workflows.", status: "pending_credentials", required_env: ["TWILIO_PHONE_NUMBER", "TWILIO_MESSAGING_SERVICE_SID"] }, "integration_twilio_messaging"),
      withTimestamps({ name: "Supabase Operational Store", provider: "Supabase", layer: "Database", purpose: "Persist residents, survey responses, event feedback, redemptions, and partner leads.", status: "pending_credentials", required_env: ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] }, "integration_supabase"),
      withTimestamps({ name: "n8n Workflow Orchestration", provider: "n8n", layer: "Automation", purpose: "Webhook routing, reminders, report generation, and survey escalation workflows.", status: "pending_credentials", required_env: ["N8N_WEBHOOK_URL", "N8N_API_KEY"] }, "integration_n8n"),
      withTimestamps({ name: "OpenAI Insights", provider: "OpenAI", layer: "AI Layer", purpose: "Summaries, sentiment, recommendations, SMS concierge, and operator insights.", status: process.env.OPENAI_API_KEY ? "configured" : "pending_credentials", required_env: ["OPENAI_API_KEY"] }, "integration_openai")
    );
  }

  if (entities.MessagingJourney.length === 0) {
    entities.MessagingJourney.push(
      withTimestamps({
        name: "Resident Messaging",
        service: "Twilio Verify + Messaging",
        purpose: "Perk reminders, event reminders, passport challenges, and new downtown event notifications.",
        status: "planned",
        trigger: "resident joins",
        flow: ["phone captured", "Twilio Verify", "verified profile", "SMS campaigns"],
        audience: "residents",
      }, "journey_resident_messaging"),
      withTimestamps({
        name: "Event Automation",
        service: "Twilio Messaging + n8n",
        purpose: "RSVP reminders, check-in links, post-event surveys, and report creation.",
        status: "planned",
        trigger: "event RSVP",
        flow: ["24h reminder", "2h reminder", "check-in link", "post-event survey", "report"],
        audience: "event attendees",
      }, "journey_event_automation"),
      withTimestamps({
        name: "Downtown Passport",
        service: "Twilio Messaging + QR",
        purpose: "Passport stamps, reward progress, and unlock messaging for multi-location programs.",
        status: "planned",
        trigger: "QR stamp added",
        flow: ["visit location", "scan QR", "stamp added", "progress SMS", "reward unlocked"],
        audience: "passport participants",
      }, "journey_downtown_passport"),
      withTimestamps({
        name: "Partner Intelligence",
        service: "Twilio Messaging + Workspace",
        purpose: "Route resident issues or feedback into workspace follow-up and satisfaction surveys.",
        status: "planned",
        trigger: "resident submits issue",
        flow: ["workspace task", "assigned", "resolved", "feedback survey"],
        audience: "property managers",
      }, "journey_partner_intelligence")
    );
  }

  if (entities.PassportProgram.length === 0) {
    entities.PassportProgram.push(
      withTimestamps({
        name: "Sugar Wolf / Larry & Guy Passport",
        status: "planned",
        partner_group: "Larry & Guy",
        required_stamps: 4,
        reward: "Reward unlocked after four verified location visits",
        channels: ["QR", "Twilio SMS", "Workspace report"],
        metrics: ["stamps", "completion_rate", "repeat_visits", "reward_unlocks"],
      }, "passport_sugar_wolf_larry_guy")
    );
  }

  if (entities.CrmSegment.length === 0) {
    entities.CrmSegment.push(
      withTimestamps({ name: "Dining Interested Residents", source: "Resident Onboarding", criteria: ["interest:dining"], destination: "Twilio campaign", status: "seeded" }, "segment_dining"),
      withTimestamps({ name: "Event Responders", source: "Event Feedback", criteria: ["rsvp:true", "attended:true"], destination: "event recommendations", status: "seeded" }, "segment_event_responders"),
      withTimestamps({ name: "Perk Redeemers", source: "Perk Redemption Feedback", criteria: ["redemption_count:>0"], destination: "partner reports", status: "seeded" }, "segment_perk_redeemers")
    );
  }

  if (entities.AutomationRun.length === 0) {
    entities.AutomationRun.push(
      withTimestamps({ name: "Survey Webhook Intake", provider: "n8n", status: "ready_for_credentials", trigger: "Tally or Jotform webhook", action: "Store response, sync Sheets, create AI summary", last_run: "", target: "survey_responses" }, "automation_survey_webhook"),
      withTimestamps({ name: "Event Reminder Journey", provider: "Twilio", status: "ready_for_credentials", trigger: "RSVP created", action: "Send 24h and 2h reminders", last_run: "", target: "event_feedback" }, "automation_event_reminder"),
      withTimestamps({ name: "Passport Stamp Progress", provider: "Twilio", status: "ready_for_credentials", trigger: "QR stamp created", action: "Send progress and reward unlock SMS", last_run: "", target: "passport_stamps" }, "automation_passport_stamp"),
      withTimestamps({ name: "AI Survey Analysis", provider: "OpenAI", status: process.env.OPENAI_API_KEY ? "active" : "ready_for_credentials", trigger: "survey response completed", action: "Summarize, classify sentiment, recommend action", last_run: "", target: "ai_insights" }, "automation_ai_survey_analysis")
    );
  }

  if (entities.AiInsight.length === 0) {
    entities.AiInsight.push(
      withTimestamps({
        source: "Survey + Messaging + CRM architecture",
        insight_type: "recommendation",
        title: "Use Tally as the launch survey engine",
        summary: "Tally is the preferred launch option because it supports fast embedded surveys, webhook routing, Google Sheets support, and lower friction resident feedback flows.",
        recommended_action: "Configure Tally resident onboarding, perk redemption feedback, and event feedback forms before adding Jotform or SurveyJS.",
        status: "open",
      }, "ai_insight_tally_launch")
    );
  }

  provisionAllPlatformTenants(entities);
}

async function ensureDatabase(): Promise<Database> {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Database;
    for (const entityName of entityNames) parsed.entities[entityName] ||= [];
    addOperationalDefaults(parsed.entities);
    await saveDatabase(parsed);
    return parsed;
  } catch {
    const seeded = createSeedDatabase();
    await saveDatabase(seeded);
    return seeded;
  }
}

async function saveDatabase(db: Database) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

function listEntity(db: Database, entityName: EntityName, filters: Record<string, any> = {}) {
  return db.entities[entityName].filter((item) =>
    Object.entries(filters).every(([key, value]) => value === undefined || value === null || item[key] === value)
  );
}

function upsertPropertyCompatibility(record: Record<string, any>) {
  const units = Number(record.units ?? record.totalUnits ?? 0);
  return {
    district: record.district || "cbd",
    tier: Number(record.tier || 3),
    type: record.type || "apartment",
    lat: Number(record.lat || 30.2672),
    lng: Number(record.lng || -97.7431),
    units,
    totalUnits: units,
    tenants: Number(record.tenants || 0),
    priceTier: record.priceTier || "mid",
    walkScore: Number(record.walkScore || 85),
    perkDensity: Number(record.perkDensity || 0.5),
    activityScore: Number(record.activityScore || 0.5),
    status: record.status || "available",
    amenities: Array.isArray(record.amenities) ? record.amenities : [],
    photos: Array.isArray(record.photos) ? record.photos : [],
    accessCode: record.accessCode || `AUTO${Math.floor(Math.random() * 9000 + 1000)}`,
    ...record,
  };
}

export async function createApp() {
  const app = express();
  let db = await ensureDatabase();

  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "downtown-perks-backend",
      persistence: dbPath,
      entities: Object.fromEntries(entityNames.map((name) => [name, db.entities[name].length])),
    });
  });

  app.get("/api/platform", (req, res) => {
    res.json({
      architecture: platformArchitecture,
      domains: platformDomains.map(serializePlatformDomain),
      enterpriseComponents,
    });
  });

  app.get("/api/tenants", (req, res) => {
    res.json({
      tenants: db.entities.PlatformTenant,
      workspaces: db.entities.TenantWorkspace,
      roles: db.entities.TenantRole,
      mapEntityLinks: db.entities.MapEntityLink,
    });
  });

  app.get("/api/tenant-provisioning/status", (req, res) => {
    const requiredNames = ["Jo's Coffee", "Fine Eyewear", "Hotel Van Zandt", "Four Seasons", "DANA", "lululemon", "Legends", "Waterline", "The Shore", "YETI", "Rivian", "Waterloo Greenway", "Visit Austin"];
    const provisioned = requiredNames.map((name) => {
      const tenant = db.entities.PlatformTenant.find((item) => item.name === name);
      const workspace = tenant ? db.entities.TenantWorkspace.find((item) => item.tenant_id === tenant.id) : null;
      return {
        name,
        provisioned: Boolean(tenant && workspace),
        tenantId: tenant?.id || null,
        workspacePath: workspace?.path || null,
      };
    });
    res.json({
      tenants: db.entities.PlatformTenant.length,
      workspaces: db.entities.TenantWorkspace.length,
      roles: db.entities.TenantRole.length,
      analyticsContainers: db.entities.PartnerAnalytics.length,
      reportContainers: db.entities.PartnerReport.length,
      notificationChannels: db.entities.TenantNotification.length,
      auditLogs: db.entities.TenantAuditLog.length,
      mapEntityLinks: db.entities.MapEntityLink.length,
      allRequiredProvisioned: provisioned.every((item) => item.provisioned),
      provisioned,
    });
  });

  app.get("/api/tenants/:slug", (req, res) => {
    const tenant = db.entities.PlatformTenant.find((item) => item.slug === req.params.slug || item.id === req.params.slug);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    const workspace = db.entities.TenantWorkspace.find((item) => item.tenant_id === tenant.id);
    res.json({
      tenant,
      workspace,
      users: db.entities.TenantUser.filter((item) => item.tenant_id === tenant.id),
      roles: db.entities.TenantRole.filter((item) => item.tenant_id === tenant.id),
      profile: db.entities.PartnerProfile.find((item) => item.tenant_id === tenant.id),
      offers: db.entities.PartnerOffer.filter((item) => item.tenant_id === tenant.id),
      events: db.entities.PartnerEvent.filter((item) => item.tenant_id === tenant.id),
      reports: db.entities.PartnerReport.filter((item) => item.tenant_id === tenant.id),
      analytics: db.entities.PartnerAnalytics.find((item) => item.tenant_id === tenant.id),
      settings: db.entities.PartnerSettings.find((item) => item.tenant_id === tenant.id),
      notifications: db.entities.TenantNotification.filter((item) => item.tenant_id === tenant.id),
      auditLogs: db.entities.TenantAuditLog.filter((item) => item.tenant_id === tenant.id),
      mapLinks: db.entities.MapEntityLink.filter((item) => item.tenant_id === tenant.id),
    });
  });

  app.post("/api/tenant-provisioning/sync", async (req, res) => {
    const before = {
      tenants: db.entities.PlatformTenant.length,
      workspaces: db.entities.TenantWorkspace.length,
      mapLinks: db.entities.MapEntityLink.length,
    };
    provisionAllPlatformTenants(db.entities);
    await saveDatabase(db);
    res.json({
      success: true,
      before,
      after: {
        tenants: db.entities.PlatformTenant.length,
        workspaces: db.entities.TenantWorkspace.length,
        mapLinks: db.entities.MapEntityLink.length,
      },
    });
  });

  app.get("/api/auth/me", (req, res) => {
    res.json(db.entities.User[0] || { id: "user_admin", role: "admin", name: "Demo Admin", email: "admin@downtownperks.local" });
  });

  app.patch("/api/auth/me", async (req, res) => {
    const current = db.entities.User[0] || withTimestamps({ role: "admin", name: "Demo Admin" }, "user_admin");
    db.entities.User[0] = { ...current, ...req.body, updated_at: now() };
    await saveDatabase(db);
    res.json(db.entities.User[0]);
  });

  app.get("/api/entities/:entity", (req, res) => {
    const entityName = req.params.entity as EntityName;
    if (!entityNames.includes(entityName)) return res.status(404).json({ error: `Unknown entity: ${entityName}` });
    res.json(listEntity(db, entityName, req.query));
  });

  app.post("/api/entities/:entity/filter", (req, res) => {
    const entityName = req.params.entity as EntityName;
    if (!entityNames.includes(entityName)) return res.status(404).json({ error: `Unknown entity: ${entityName}` });
    res.json(listEntity(db, entityName, req.body || {}));
  });

  app.post("/api/entities/:entity", async (req, res) => {
    const entityName = req.params.entity as EntityName;
    if (!entityNames.includes(entityName)) return res.status(404).json({ error: `Unknown entity: ${entityName}` });
    const prefix = slug(entityName);
    const record = withTimestamps(req.body || {}, req.body?.id || makeId(prefix));
    db.entities[entityName].push(record);
    await saveDatabase(db);
    res.status(201).json(record);
  });

  app.put("/api/entities/:entity/:id", async (req, res) => {
    const entityName = req.params.entity as EntityName;
    if (!entityNames.includes(entityName)) return res.status(404).json({ error: `Unknown entity: ${entityName}` });
    const index = db.entities[entityName].findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: `${entityName} not found` });
    db.entities[entityName][index] = { ...db.entities[entityName][index], ...req.body, id: req.params.id, updated_at: now() };
    await saveDatabase(db);
    res.json(db.entities[entityName][index]);
  });

  app.patch("/api/entities/:entity/:id", async (req, res) => {
    const entityName = req.params.entity as EntityName;
    if (!entityNames.includes(entityName)) return res.status(404).json({ error: `Unknown entity: ${entityName}` });
    const index = db.entities[entityName].findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: `${entityName} not found` });
    db.entities[entityName][index] = { ...db.entities[entityName][index], ...req.body, id: req.params.id, updated_at: now() };
    await saveDatabase(db);
    res.json(db.entities[entityName][index]);
  });

  app.delete("/api/entities/:entity/:id", async (req, res) => {
    const entityName = req.params.entity as EntityName;
    if (!entityNames.includes(entityName)) return res.status(404).json({ error: `Unknown entity: ${entityName}` });
    const before = db.entities[entityName].length;
    db.entities[entityName] = db.entities[entityName].filter((item) => item.id !== req.params.id);
    if (db.entities[entityName].length === before) return res.status(404).json({ error: `${entityName} not found` });
    await saveDatabase(db);
    res.json({ success: true });
  });

  app.post("/api/functions/:name", async (req, res) => {
    const functionName = req.params.name;
    const body = req.body || {};

    const writeReport = async (filePrefix: string, payload: Record<string, any>) => {
      const fileName = `${filePrefix}-${Date.now()}.json`;
      await fs.writeFile(path.join(dataDir, fileName), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      return { file_url: `/api/reports/${fileName}`, file_name: fileName, report: payload };
    };

    const resolvePartner = () => {
      if (body.partner_id) return db.entities.Partner.find((partner) => partner.id === body.partner_id);
      if (body.contact_email) return db.entities.Partner.find((partner) => partner.contact_email === body.contact_email);
      return db.entities.Partner[0];
    };

    const partnerSummary = (partner: EntityRecord | undefined, yearMonth = new Date().toISOString().slice(0, 7)) => {
      const perks = partner ? db.entities.PerkLocation.filter((perk) => perk.partner_id === partner.id) : [];
      const perkIds = new Set(perks.map((perk) => perk.id));
      const redemptions = db.entities.PerkRedemption.filter((redemption) => perkIds.has(redemption.perk_id));
      const monthlyRedemptions = redemptions.filter((redemption) => String(redemption.redeemed_at || redemption.timestamp || "").startsWith(yearMonth));
      const uniqueCustomers = new Set(monthlyRedemptions.map((redemption) => redemption.user_email)).size;
      const messages = partner ? db.entities.PartnerMessage.filter((message) => message.partner_id === partner.id) : [];
      return { partner, perks, redemptions, monthlyRedemptions, uniqueCustomers, messages, year_month: yearMonth };
    };

    try {
      if (functionName === "seedDemoData" || functionName === "seedDowntownBuildings") {
        db = createSeedDatabase();
        await saveDatabase(db);
        return res.json({ data: { success: true, dbPath, entities: Object.fromEntries(entityNames.map((name) => [name, db.entities[name].length])) } });
      }

      if (functionName === "provisionPartnerWorkspace") {
        const organization = body.organization || {};
        const contact = body.contact || {};
        const location = body.location || {};
        const checkout = body.checkout || {};
        const selectedPlan = body.plan || {};
        const organizationName = String(organization.name || body.organization_name || body.organizationName || "Downtown Perks Partner").trim();
        const contactEmail = String(contact.email || body.email || "partner@downtownperks.local").trim().toLowerCase();
        const tenantSlug = slug(organizationName).replace(/_/g, "-");
        const workspaceModules = [
          "home",
          "map",
          "offers",
          "events",
          "campaigns",
          "qr",
          "listings",
          "gallery",
          "brand",
          "profile",
          "audience",
          "followers",
          "saved",
          "reviews",
          "reports",
          "performance",
          "exports",
          "growth",
          "team",
          "permissions",
          "billing",
          "integrations",
          "settings",
        ];

        let partner = db.entities.Partner.find((item) => String(item.contact_email || "").toLowerCase() === contactEmail || item.business_name === organizationName);
        if (!partner) {
          partner = withTimestamps(
            {
              business_name: organizationName,
              contact_person: contact.name || body.primary_contact || "Workspace owner",
              contact_email: contactEmail,
              contact_phone: contact.phone || "",
              address: location.address || organization.address || "",
              category: organization.type || body.organizationType || "Partner",
              status: "active",
              onboarding_stage: "workspace_created",
            },
            `partner_${tenantSlug}`
          );
          db.entities.Partner.push(partner);
        } else {
          Object.assign(partner, {
            business_name: organizationName,
            contact_person: contact.name || partner.contact_person,
            contact_email: contactEmail,
            contact_phone: contact.phone || partner.contact_phone,
            address: location.address || organization.address || partner.address,
            category: organization.type || body.organizationType || partner.category,
            status: "active",
            onboarding_stage: "workspace_created",
            updated_at: now(),
          });
        }

        const tenant = provisionPlatformTenant(db.entities, {
          name: organizationName,
          type: organization.type || body.organizationType || "venue",
          category: organization.industry || organization.type || body.organizationType || "Partner",
          address: location.address || organization.address,
          source_type: "partner_registration",
          source_id: partner.id,
          partner_id: partner.id,
        });

        if (!tenant) return res.status(400).json({ error: "Unable to provision workspace without an organization name." });

        const workspaceId = `workspace_${tenant.slug}`;
        const workspace = db.entities.TenantWorkspace.find((item) => item.id === workspaceId || item.tenant_id === tenant.id);
        if (workspace) {
          Object.assign(workspace, {
            name: `${organizationName} Workspace`,
            path: "/workspace/home",
            default_route: "/workspace/home",
            status: "active",
            workspace_status: "active",
            lifecycle_stage: "daily_operations",
            modules: workspaceModules,
            updated_at: now(),
          });
        }

        const registration = ensureRecord(db.entities.PartnerRegistration, `registration_${tenant.slug}`, {
          tenant_id: tenant.id,
          workspace_id: workspaceId,
          partner_id: partner.id,
          organization,
          contact,
          location,
          plan: selectedPlan,
          checkout,
          status: "submitted",
          lifecycle: ["landing", "partner_type", "registration", "organization_setup", "pricing", "checkout", "verification", "workspace_creation", "partner_dashboard", "daily_operations"],
          submitted_at: now(),
        });

        ensureRecord(db.entities.TenantUser, `tenant_user_${tenant.slug}_owner`, {
          tenant_id: tenant.id,
          workspace_id: workspaceId,
          name: contact.name || "Workspace owner",
          email: contactEmail,
          role: "Owner",
          status: "active",
        });

        ensureRecord(db.entities.PartnerLocation, `location_${tenant.slug}_primary`, {
          tenant_id: tenant.id,
          workspace_id: workspaceId,
          partner_id: partner.id,
          name: location.name || organizationName,
          address: location.address || organization.address || "",
          city: location.city || "Austin",
          state: location.state || "TX",
          status: "active",
          map_presence: "enabled",
        });

        ensureRecord(db.entities.Campaign, `campaign_${tenant.slug}_starter`, {
          tenant_id: tenant.id,
          workspace_id: workspaceId,
          partner_id: partner.id,
          title: "Starter campaign draft",
          description: "A first campaign draft created during workspace provisioning.",
          status: "draft",
          type: "launch",
          created_from: "workspace_provisioning",
        });

        ensureRecord(db.entities.PartnerSubscription, `subscription_${tenant.slug}`, {
          tenant_id: tenant.id,
          workspace_id: workspaceId,
          partner_id: partner.id,
          plan: selectedPlan.key || selectedPlan.name || "starter",
          plan_label: selectedPlan.label || selectedPlan.name || "Starter",
          cadence: selectedPlan.cadence || "annual",
          amount: Number(selectedPlan.amount || selectedPlan.price || 0),
          status: checkout.status || "active",
          provider: checkout.provider || "local_checkout_ready_for_stripe",
          renewal_date: checkout.renewal_date || null,
          billing_email: checkout.billing_email || contactEmail,
        });

        ensureRecord(db.entities.PartnerInvoice, `invoice_${tenant.slug}_latest`, {
          tenant_id: tenant.id,
          workspace_id: workspaceId,
          partner_id: partner.id,
          subscription_id: `subscription_${tenant.slug}`,
          invoice_number: `DP-${tenant.slug.toUpperCase().slice(0, 12)}-${new Date().getFullYear()}`,
          status: checkout.invoice_status || "paid",
          subtotal: Number(checkout.subtotal || selectedPlan.amount || selectedPlan.price || 0),
          tax: Number(checkout.tax || 0),
          total: Number(checkout.total || selectedPlan.amount || selectedPlan.price || 0),
          coupon: checkout.coupon || "",
          paid_at: now(),
        });

        ensureRecord(db.entities.PartnerQrExperience, `qr_${tenant.slug}_welcome`, {
          tenant_id: tenant.id,
          workspace_id: workspaceId,
          partner_id: partner.id,
          label: "Welcome QR",
          destination_url: "/workspace/home",
          status: "active",
          scans: 0,
        });

        ensureRecord(db.entities.PartnerAiContext, `ai_context_${tenant.slug}`, {
          tenant_id: tenant.id,
          workspace_id: workspaceId,
          partner_id: partner.id,
          assistant_name: "Downtown Assistant",
          status: "active",
          context_summary: `${organizationName} can manage offers, events, campaigns, QR, reporting, billing, and team access from the workspace.`,
          suggested_actions: ["Publish first offer", "Create first event", "Generate QR", "Invite team member"],
        });

        workspaceModules.forEach((moduleName) => {
          ensureRecord(db.entities.PartnerWorkspaceModule, `module_${tenant.slug}_${moduleName}`, {
            tenant_id: tenant.id,
            workspace_id: workspaceId,
            partner_id: partner.id,
            module: moduleName,
            status: "ready",
            route: moduleName === "home" ? "/workspace/home" : `/workspace/${moduleName}`,
          });
        });

        ensureRecord(db.entities.TenantNotification, `notification_${tenant.slug}_workspace_ready`, {
          tenant_id: tenant.id,
          workspace_id: workspaceId,
          channel: "workspace",
          rule: "workspace_ready",
          status: "active",
          message: `${organizationName} workspace is ready to launch.`,
        });

        ensureRecord(db.entities.TenantAuditLog, `audit_${tenant.slug}_partner_lifecycle_provisioned`, {
          tenant_id: tenant.id,
          workspace_id: workspaceId,
          actor_id: contactEmail,
          action: "partner_lifecycle_workspace_provisioned",
          resource: "partner_workspace",
          before: null,
          after: { partner_id: partner.id, registration_id: registration.id, modules: workspaceModules },
          timestamp: now(),
        });

        partner.tenant_id = tenant.id;
        partner.workspace_id = workspaceId;
        partner.updated_at = now();

        await saveDatabase(db);
        return res.json({
          data: {
            success: true,
            message: "Workspace provisioned",
            partner,
            tenant,
            workspace: workspace || db.entities.TenantWorkspace.find((item) => item.tenant_id === tenant.id),
            registration,
            subscription: db.entities.PartnerSubscription.find((item) => item.id === `subscription_${tenant.slug}`),
            invoice: db.entities.PartnerInvoice.find((item) => item.id === `invoice_${tenant.slug}_latest`),
            modules: workspaceModules,
            redirect: "/workspace/home",
          },
        });
      }

      if (functionName === "generatePDFReport") {
        const building = db.entities.Building.find((item) => item.id === body.building_id);
        const payload = {
          generated_at: now(),
          building,
          year_month: body.year_month,
          totals: {
            tenants: db.entities.Tenant.length,
            flats: db.entities.Flat.length,
            broadcasts: db.entities.Broadcast.length,
            redemptions: db.entities.PerkRedemption.length,
            survey_responses: db.entities.SurveyResponse.length,
            events: db.entities.Event.length,
          },
        };
        return res.json({ data: await writeReport(`report-${body.building_id || "building"}-${body.year_month || "latest"}`, payload) });
      }

      if (functionName === "processSurveyResponse") {
        if (!body.survey_id) return res.status(400).json({ error: "Missing survey_id" });
        const survey = db.entities.Survey.find((item) => item.id === body.survey_id);
        const building = db.entities.Building.find((item) => item.id === body.building_id);
        const perk = db.entities.PerkLocation.find((item) => item.id === body.perk_id);
        const partner = db.entities.Partner.find((item) => item.id === (body.partner_id || perk?.partner_id));
        const surveyResponse = withTimestamps(
          {
            survey_id: body.survey_id,
            survey_name: survey?.title || "",
            resident_id: body.resident_id || "",
            resident_name: body.resident_name || "Anonymous Resident",
            resident_email: body.resident_email || "",
            building_id: body.building_id || "",
            building_name: building?.name || "",
            partner_id: partner?.id || "",
            partner_name: partner?.business_name || "",
            perk_id: body.perk_id || "",
            perk_name: perk?.name || perk?.title || "",
            redemption_id: body.redemption_id || "",
            map_entity_id: body.map_entity_id || "",
            district: body.district || perk?.district || building?.district || "",
            category: body.category || perk?.category || "",
            answers: body.answers || [],
            score: body.score ?? null,
            sentiment: body.sentiment || "neutral",
            completed_at: now(),
            exported_to_google_sheets: false,
            notification_sent: true,
            source_flow: body.source_flow || "resident-survey",
          },
          makeId("survey_response")
        );
        db.entities.SurveyResponse.push(surveyResponse);
        if (survey) survey.responses_count = Number(survey.responses_count || 0) + 1;
        const notification = withTimestamps(
          {
            type: body.redemption_id ? "redemption-survey-completed" : "survey-completed",
            resident_id: surveyResponse.resident_id,
            resident_name: surveyResponse.resident_name,
            building_id: surveyResponse.building_id,
            building_name: surveyResponse.building_name,
            survey_response_id: surveyResponse.id,
            redemption_id: surveyResponse.redemption_id,
            partner_id: surveyResponse.partner_id,
            partner_name: surveyResponse.partner_name,
            perk_id: surveyResponse.perk_id,
            perk_name: surveyResponse.perk_name,
            message: `${surveyResponse.resident_name} completed ${surveyResponse.survey_name || "a survey"}.`,
            status: "sent",
            channel: "in-app",
            recipient_email: "admin@downtownperks.local",
            sent_at: now(),
          },
          makeId("notification")
        );
        db.entities.ManagementNotification.push(notification);
        db.entities.SurveyExportLog.push(withTimestamps({ survey_response_id: surveyResponse.id, status: "pending", destination: "local-json", attempted_at: now() }, makeId("survey_export")));
        await saveDatabase(db);
        return res.json({ data: { success: true, surveyResponse, notification } });
      }

      if (functionName === "retryPendingSurveyExports") {
        const pending = db.entities.SurveyExportLog.filter((log) => log.status === "pending" || log.status === "failed");
        pending.forEach((log) => {
          log.status = "success";
          log.completed_at = now();
          log.updated_at = now();
        });
        db.entities.SurveyResponse.forEach((response) => {
          response.exported_to_google_sheets = true;
          response.updated_at = now();
        });
        await saveDatabase(db);
        return res.json({ data: { success: true, retried: pending.length } });
      }

      if (functionName === "verifyRedemption") {
        const payload = typeof body.qr_data === "string" ? JSON.parse(body.qr_data) : body.qr_data || body;
        if (body.redemption_code) {
          const existing = db.entities.PerkRedemption.find((redemption) => redemption.code === body.redemption_code || redemption.id === body.redemption_code);
          if (!existing) return res.status(404).json({ error: "Redemption not found" });
          existing.is_verified = true;
          existing.verified_at = now();
          existing.updated_at = now();
          await saveDatabase(db);
          return res.json({ data: { success: true, redemption: existing } });
        }
        if (!payload.perk_id || !payload.user_email) return res.status(400).json({ error: "Invalid redemption payload" });
        const recentDuplicate = db.entities.PerkRedemption.some((redemption) => {
          if (redemption.perk_id !== payload.perk_id || redemption.user_email !== payload.user_email || !redemption.redeemed_at) return false;
          return Date.now() - new Date(redemption.redeemed_at).getTime() < 24 * 60 * 60 * 1000;
        });
        if (recentDuplicate) return res.status(409).json({ error: "This resident already redeemed this perk in the last 24 hours", status: "duplicate" });
        const perk = db.entities.PerkLocation.find((item) => item.id === payload.perk_id);
        const redemption = withTimestamps(
          {
            perk_id: payload.perk_id,
            perkId: payload.perk_id,
            perk_name: payload.perk_name || perk?.name || perk?.title || "",
            perk_category: perk?.category || "",
            user_email: payload.user_email,
            user_name: payload.user_name || "",
            propertyId: payload.propertyId || "",
            redeemed_at: now(),
            timestamp: now(),
            is_verified: true,
          },
          makeId("redemption")
        );
        db.entities.PerkRedemption.push(redemption);
        if (perk) perk.redemption_count = Number(perk.redemption_count || 0) + 1;
        await saveDatabase(db);
        return res.json({ data: { success: true, redemption, perk_name: redemption.perk_name, resident_name: redemption.user_name || redemption.user_email } });
      }

      if (functionName === "getPartnerContext") {
        const partner = resolvePartner();
        return res.json({ data: partnerSummary(partner) });
      }

      if (functionName === "updatePartnerProfile") {
        const partner = resolvePartner();
        if (!partner) return res.status(404).json({ error: "No partner account found" });
        const updates = body.updates || body.data || body;
        Object.assign(partner, {
          business_name: updates.business_name ?? partner.business_name,
          contact_person: updates.contact_person ?? partner.contact_person,
          contact_email: updates.contact_email ?? partner.contact_email,
          contact_phone: updates.contact_phone ?? partner.contact_phone,
          address: updates.address ?? partner.address,
          category: updates.category ?? partner.category,
          updated_at: now(),
        });
        await saveDatabase(db);
        return res.json({ data: { success: true, partner } });
      }

      if (functionName === "updatePartnerPerk") {
        const perk = db.entities.PerkLocation.find((item) => item.id === body.perk_id);
        if (!perk) return res.status(404).json({ error: "Perk not found" });
        const updates = body.updates || body.data || body;
        const allowed = ["perk", "specials", "deals_offers", "hours", "contact_phone", "is_active", "is_featured", "events_available", "title", "active"];
        for (const key of allowed) if (updates?.[key] !== undefined) perk[key] = updates[key];
        perk.updated_at = now();
        await saveDatabase(db);
        return res.json({ data: { success: true, perk } });
      }

      if (functionName === "handlePartnerMessage") {
        if (!body.message_id && body.partner_id && body.message) {
          const partner = resolvePartner();
          if (!partner) return res.status(404).json({ error: "Partner not found" });
          const created = withTimestamps(
            {
              partner_id: partner.id,
              resident_email: body.resident_email || "",
              resident_name: body.resident_name || "Platform team",
              subject: body.subject || "Partner message",
              message: body.message,
              sent_at: now(),
              status: "unread",
            },
            makeId("partner_message")
          );
          db.entities.PartnerMessage.push(created);
          await saveDatabase(db);
          return res.json({ data: { success: true, message: created } });
        }
        const message = db.entities.PartnerMessage.find((item) => item.id === body.message_id);
        if (!message) return res.status(404).json({ error: "Message not found" });
        if (body.action === "mark_read") {
          message.status = "read";
          message.updated_at = now();
          await saveDatabase(db);
          return res.json({ data: { success: true, message } });
        }
        if (body.action === "reply") {
          const reply = withTimestamps({ partner_id: message.partner_id, resident_email: message.resident_email, resident_name: message.resident_name, subject: `Re: ${message.subject || "Message"}`, message: body.reply_text || "", sent_at: now(), status: "unread" }, makeId("partner_message"));
          db.entities.PartnerMessage.push(reply);
          message.status = "replied";
          message.updated_at = now();
          await saveDatabase(db);
          return res.json({ data: { success: true, reply } });
        }
        return res.status(400).json({ error: "Invalid action. Use mark_read or reply." });
      }

      if (functionName === "bulkUpdateResidents") {
        const updates = Array.isArray(body.updates) ? body.updates : [];
        let updated_count = 0;
        const errors: any[] = [];
        for (const update of updates) {
          const tenant = db.entities.Tenant.find((item) => item.id === update.id);
          if (!tenant) {
            errors.push({ resident_id: update.id, error: "Resident not found" });
            continue;
          }
          tenant[update.field] = update.value;
          tenant.updated_at = now();
          updated_count++;
        }
        await saveDatabase(db);
        return res.json({ data: { success: true, updated_count, errors } });
      }

      if (["exportWeeklyResidentEngagement", "exportSurveyDataToSheets", "monthlyPartnerRedemptionReport", "sendMonthlyPartnerReports", "sendWeeklyPartnerSummary", "generatePartnerMonthlyReport", "generatePartnerReportOnDemand"].includes(functionName)) {
        const partner = resolvePartner();
        const summary = partnerSummary(partner, body.year_month || new Date().toISOString().slice(0, 7));
        const payload = {
          generated_at: now(),
          function: functionName,
          period: summary.year_month,
          partner: summary.partner,
          totals: {
            partners: db.entities.Partner.length,
            perks: db.entities.PerkLocation.length,
            redemptions: db.entities.PerkRedemption.length,
            monthly_redemptions: summary.monthlyRedemptions.length,
            unique_customers: summary.uniqueCustomers,
            surveys: db.entities.Survey.length,
            survey_responses: db.entities.SurveyResponse.length,
            events: db.entities.Event.length,
            rsvps: db.entities.EventRSVP.length,
          },
          partner_context: summary,
        };
        return res.json({ data: await writeReport(functionName, payload) });
      }

      if (["sendAnnouncementNotification", "importPerkLocations", "importBuildingsAndUnits", "importTheShorResidents", "importDANAMembers"].includes(functionName)) {
        return res.json({ data: { success: true, function: functionName, message: "Local backend compatibility endpoint is available. Use entity CRUD endpoints for imported records.", dbPath } });
      }

      res.status(404).json({ error: `Unknown function: ${functionName}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || `Function failed: ${functionName}` });
    }
  });

  app.get("/api/reports/:file", async (req, res) => {
    res.sendFile(path.join(dataDir, req.params.file));
  });

  app.post("/api/integrations/upload-file", (req, res) => {
    res.json({ file_url: req.body?.file_url || "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=900&q=80" });
  });

  app.post("/api/integrations/send-email", (req, res) => {
    res.json({ success: true, queued_at: now(), ...req.body });
  });

  app.get("/api/properties", (req, res) => {
    res.json(db.entities.Building);
  });

  app.post("/api/properties", async (req, res) => {
    const record = withTimestamps(upsertPropertyCompatibility(req.body || {}), makeId("prop"));
    db.entities.Building.push(record);
    await saveDatabase(db);
    res.status(201).json(record);
  });

  app.put("/api/properties/:id", async (req, res) => {
    const index = db.entities.Building.findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Property not found" });
    db.entities.Building[index] = { ...db.entities.Building[index], ...upsertPropertyCompatibility(req.body || {}), id: req.params.id, updated_at: now() };
    await saveDatabase(db);
    res.json(db.entities.Building[index]);
  });

  app.delete("/api/properties/:id", async (req, res) => {
    db.entities.Building = db.entities.Building.filter((item) => item.id !== req.params.id);
    await saveDatabase(db);
    res.json({ success: true });
  });

  app.post("/api/properties/ingest", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const { rawData } = req.body || {};
    if (!rawData) return res.status(400).json({ error: "No raw data provided." });
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Extract property records from this text and return JSON only.\n\n${rawData}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                address: { type: Type.STRING },
                totalUnits: { type: Type.INTEGER },
                amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
                status: { type: Type.STRING },
                photos: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["name", "address", "totalUnits", "status"],
            },
          },
        },
      });
      const parsed = response.text ? JSON.parse(response.text) : [];
      const records = (Array.isArray(parsed) ? parsed : [parsed]).map((item) => withTimestamps(upsertPropertyCompatibility(item), makeId("prop")));
      db.entities.Building.push(...records);
      await saveDatabase(db);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to ingest data." });
    }
  });

  app.get("/api/perks", (req, res) => res.json(db.entities.PerkLocation));

  app.post("/api/perks", async (req, res) => {
    const record = withTimestamps({ is_active: true, active: true, redemption_count: 0, ...req.body }, makeId("perk"));
    db.entities.PerkLocation.push(record);
    await saveDatabase(db);
    res.status(201).json(record);
  });

  app.patch("/api/perks/:id", async (req, res) => {
    const index = db.entities.PerkLocation.findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Perk not found" });
    db.entities.PerkLocation[index] = { ...db.entities.PerkLocation[index], ...req.body, updated_at: now() };
    await saveDatabase(db);
    res.json(db.entities.PerkLocation[index]);
  });

  app.delete("/api/perks/:id", async (req, res) => {
    db.entities.PerkLocation = db.entities.PerkLocation.filter((item) => item.id !== req.params.id);
    await saveDatabase(db);
    res.json({ success: true });
  });

  app.post("/api/redemptions", async (req, res) => {
    const { perkId, propertyId, user_email, user_name } = req.body || {};
    if (!perkId || !propertyId) return res.status(400).json({ error: "Missing perkId or propertyId" });
    const perk = db.entities.PerkLocation.find((item) => item.id === perkId);
    if (perk) {
      perk.redemption_count = Number(perk.redemption_count || 0) + 1;
      perk.updated_at = now();
    }
    const record = withTimestamps(
      {
        perk_id: perkId,
        perkId,
        propertyId,
        perk_name: perk?.name || perk?.title || "Perk",
        perk_category: perk?.category || "General",
        user_email: user_email || "resident@example.com",
        user_name: user_name || "Resident",
        timestamp: now(),
        redeemed_at: now(),
        is_verified: true,
      },
      makeId("red")
    );
    db.entities.PerkRedemption.push(record);
    await saveDatabase(db);
    res.status(201).json(record);
  });

  app.get("/api/insights/overview", (req, res) => {
    const totalTenants = db.entities.Tenant.length || db.entities.Building.reduce((sum, p) => sum + Number(p.tenants || 0), 0);
    const totalRedemptions = db.entities.PerkRedemption.length;
    const activePerks = db.entities.PerkLocation.filter((p) => p.is_active !== false && p.active !== false).length;
    res.json({ totalTenants, totalRedemptions, activePerks, propertiesCount: db.entities.Building.length });
  });

  app.get("/api/insights/trends", (req, res) => {
    const days = Number(req.query.days || 7);
    const today = new Date();
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const redemptions = db.entities.PerkRedemption.filter((r) => String(r.redeemed_at || r.timestamp || "").startsWith(dateStr)).length;
      data.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), fullDate: dateStr, redemptions });
    }
    res.json(data);
  });

  app.get("/api/insights/top-perks", (req, res) => {
    res.json([...db.entities.PerkLocation].sort((a, b) => Number(b.redemption_count || 0) - Number(a.redemption_count || 0)).slice(0, 5));
  });

  if (process.env.NODE_ENV !== "production" && !isServerless) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

if (!isServerless) {
  createApp()
    .then((app) => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Downtown Perks backend running on http://localhost:${PORT}`);
        console.log(`Persistent data: ${dbPath}`);
      });
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
