import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { GoogleGenAI, Type } from "@google/genai";

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
  | "GlobalSettings";

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
];

const now = () => new Date().toISOString();
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function withTimestamps<T extends Record<string, any>>(record: T, id: string): EntityRecord {
  const timestamp = now();
  return { id, created_at: timestamp, updated_at: timestamp, ...record };
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
