import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { enterpriseComponents, platformArchitecture, platformDomains, serializePlatformDomain } from "./src/platform/registry.js";
import { createAgentStreamEnvelope, getProviderManager, listAgentTools, logOpenAIStatusOnce, routeAgentQuery } from "./backend/modules/ai/index.js";
import { getIntelligenceCredentialStatus, runIntelligenceAgent, type IntelligenceAgentAction } from "./src/services/intelligence/intelligenceAgent.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const dataDir = isServerless ? path.join("/tmp", "downtown-perks-backend") : path.join(__dirname, "data");
const dbPath = path.join(dataDir, "downtown-perks-db.json");
const bundledDbPath = path.join(__dirname, "data", "downtown-perks-db.json");
const PORT = Number(process.env.PORT || 3000);
const execFileAsync = promisify(execFile);

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
  | "Promotion"
  | "PromotionRedemption"
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
  | "MapEntityLink"
  | "AnalyticsEvent"
  | "QrScan"
  | "ReportRun"
  | "IntegrationStatus"
  | "Interaction"
  | "InteractionStep"
  | "GeneratedImage"
  | "ReferenceImage"
  | "BatchJob"
  | "ImageExport"
  | "ContentEntity"
  | "ContentCollection"
  | "ContentImageAsset"
  | "ContentRelationship"
  | "ContentPublishingWorkflow"
  | "ContentRevision"
  | "WalkingRoute"
  | "PartnerOutreachContact"
  | "PartnerOutreachCampaign"
  | "PartnerOutreachStep"
  | "PartnerOutreachMessage"
  | "Profile"
  | "Organization"
  | "Workspace"
  | "WorkspaceMember"
  | "Plan"
  | "WorkspaceAddon"
  | "BillingHistory";

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
  "Promotion",
  "PromotionRedemption",
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
  "AnalyticsEvent",
  "QrScan",
  "ReportRun",
  "IntegrationStatus",
  "Interaction",
  "InteractionStep",
  "GeneratedImage",
  "ReferenceImage",
  "BatchJob",
  "ImageExport",
  "ContentEntity",
  "ContentCollection",
  "ContentImageAsset",
  "ContentRelationship",
  "ContentPublishingWorkflow",
  "ContentRevision",
  "WalkingRoute",
  "PartnerOutreachContact",
  "PartnerOutreachCampaign",
  "PartnerOutreachStep",
  "PartnerOutreachMessage",
  "Profile",
  "Organization",
  "Workspace",
  "WorkspaceMember",
  "Plan",
  "WorkspaceAddon",
  "BillingHistory",
];

const now = () => new Date().toISOString();
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function verifyStripeWebhookSignature(rawBody: Buffer | undefined, signatureHeader: string | undefined) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return { ok: true, configured: false };
  if (!rawBody || !signatureHeader) return { ok: false, configured: true, error: "Stripe webhook signature is required." };

  const parts = Object.fromEntries(signatureHeader.split(",").map((part) => {
    const [key, value] = part.split("=");
    return [key, value];
  }));
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return { ok: false, configured: true, error: "Stripe webhook signature is malformed." };

  const payload = `${timestamp}.${rawBody.toString("utf8")}`;
  const actual = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");
  const actualBuffer = Buffer.from(actual, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return { ok: false, configured: true, error: "Stripe webhook signature verification failed." };
  }
  return { ok: true, configured: true };
}

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

const mapImportSources = {
  pinDetailsCsv: "/Users/megdude/Downloads/1. 20 JULY BUILD/downtown_perks_pin_details_mapped.csv",
  legendsCsv: "/Users/megdude/Downloads/1. 20 JULY BUILD/legends_property_extraction.csv",
  openApiSpec: "/Users/megdude/Downloads/1. 20 JULY BUILD/Downtown Perks-openapi-spec.json",
  googleMapZip: "/Users/megdude/Downloads/22 MAY /GOOGLE MAP 2.zip",
  civicDataZip: "/Users/megdude/Downloads/AUSTIN CIVIC DATA.zip",
  backendPagesZip: "/Users/megdude/Downloads/backend pages.zip",
  inkindZip: "/Users/megdude/Downloads/inkind.zip",
  inventoryZip: "/Users/megdude/Downloads/INVENTORY  2.zip",
  legendsListingsZip: "/Users/megdude/Downloads/LEGENDS LISTINGS.zip",
  legendsExtractedImagesZip: "/Users/megdude/Downloads/legends_extracted_visible_images.zip",
  legendsListingsAltZip: "/Users/megdude/Downloads/legends-listings.zip",
  legendsZip: "/Users/megdude/Downloads/LEGENDS.zip",
  locationCopyDeckZip: "/Users/megdude/Downloads/LOCATION DATA & COPY DECK.zip",
  locations2Zip: "/Users/megdude/Downloads/LOCATIONS 2.zip",
  locationsZip: "/Users/megdude/Downloads/LOCATIONS.zip",
  partnerBuildZip: "/Users/megdude/Downloads/partner downtown-perks (7) 2.zip",
  pagesBrandsZip: "/Users/megdude/Downloads/PAGES BRANDS.zip",
  legendsListings2Zip: "/Users/megdude/Downloads/LEGENDS LISTINGS 2.zip",
  updatedHarmonyZip: "/Users/megdude/Downloads/BACKEND/updatedharmony-homes-copy-02f82b0c.zip",
  intelligenceZip: "/Users/megdude/Downloads/BACKEND/WITH IMAGES downtown-perks-intelligence.zip",
};

const stage11Attractions = [
  {
    name: "Lady Bird Lake",
    category: "park",
    district: "Zilker / Barton Springs",
    description: "Austin's signature lake for paddleboarding, kayaking, trail walks, and skyline views.",
    hours: "Public access generally 5 a.m.-10 p.m.",
    photoIdeas: ["Skyline from Lamar Pedestrian Bridge", "Paddleboards on calm water", "Sunset over downtown"],
    tags: ["water", "skyline", "walks", "outdoor"],
  },
  {
    name: "Barton Springs Pool",
    category: "park",
    district: "Zilker",
    description: "Spring-fed swimming pool with year-round cool water and a classic Austin summer rhythm.",
    hours: "Usually 5 a.m.-10 p.m.; limited Thursday hours.",
    photoIdeas: ["Clear spring water", "Limestone edges", "Summer lifestyle scenes"],
    tags: ["swimming", "families", "outdoor", "summer"],
  },
  {
    name: "Texas State Capitol",
    category: "museum",
    district: "Downtown",
    description: "Historic Texas Capitol with public grounds, architecture, and free tours.",
    hours: "Mon-Fri 7 a.m.-8 p.m.; Sat-Sun 9 a.m.-8 p.m.",
    photoIdeas: ["Capitol dome", "Grand staircase", "Congress Avenue exterior"],
    tags: ["history", "architecture", "civic"],
  },
  {
    name: "Barton Creek Greenbelt",
    category: "park",
    district: "South Austin / Barton Creek",
    description: "Hiking, biking, limestone cliffs, and seasonal swimming close to the city.",
    hours: "Generally 5 a.m.-10 p.m.",
    photoIdeas: ["Twin Falls", "Limestone cliffs", "Trail crossing"],
    tags: ["hiking", "biking", "water", "outdoor"],
  },
  {
    name: "Peter Pan Mini Golf",
    category: "park",
    district: "South Lamar / Zilker",
    description: "Historic miniature golf course known for colorful sculptures and an easy-going Austin feel.",
    hours: "Sun-Thu 9 a.m.-11 p.m.; Fri-Sat 9 a.m.-midnight.",
    photoIdeas: ["Giant T-Rex", "Colorful course details", "Night shots"],
    tags: ["family", "date-night", "play"],
  },
  {
    name: "Chicken Shit Bingo at Little Longhorn Saloon",
    category: "music",
    district: "Burnet Road / North Austin",
    description: "A classic Sunday Austin tradition with live music, a small saloon, and a very local sense of humor.",
    hours: "Sunday 4 p.m.-8 p.m.",
    photoIdeas: ["Live country band", "Vintage saloon", "Crowd reactions"],
    tags: ["country", "local-favorite", "sunday"],
  },
  {
    name: "Congress Avenue Bat Bridge",
    category: "park",
    district: "Downtown",
    description: "A sunset gathering point to watch the urban bat colony emerge over Lady Bird Lake.",
    hours: "Sunset March-November.",
    photoIdeas: ["Bats against sunset", "Bridge silhouettes", "Crowd watching"],
    tags: ["sunset", "wildlife", "visitor-favorite"],
  },
  {
    name: "Austin City Limits Live Taping",
    category: "music",
    district: "Downtown",
    description: "Legendary TV music performances and special tapings in the heart of downtown.",
    hours: "Varies by taping.",
    photoIdeas: ["Stage lighting", "Marquee", "Audience atmosphere"],
    tags: ["live-music", "acl", "downtown"],
  },
  {
    name: "Waterloo Park",
    category: "park",
    district: "Downtown",
    description: "Downtown park with skyline views, Moody Amphitheater, trails, and public programming.",
    hours: "5 a.m.-10 p.m.",
    photoIdeas: ["Skyline reflections", "Moody Amphitheater", "Landscaped lawns"],
    tags: ["park", "events", "waterloo"],
  },
  {
    name: "Zilker Park",
    category: "park",
    district: "Zilker",
    description: "Austin's flagship urban park for festivals, picnics, trail access, and skyline views.",
    hours: "5 a.m.-10 p.m.",
    photoIdeas: ["Great Lawn", "Skyline", "Picnic scenes"],
    tags: ["festival", "family", "outdoor"],
  },
  {
    name: "Pease Park",
    category: "park",
    district: "Central Austin",
    description: "Shaded urban park with trails, play spaces, and public art.",
    hours: "5 a.m.-10 p.m.",
    photoIdeas: ["Treehouse", "Troll sculpture", "Shaded trails"],
    tags: ["family", "art", "walking"],
  },
  {
    name: "Mayfield Park & Preserve",
    category: "park",
    district: "West Austin",
    description: "Historic gardens and preserve known for resident peacocks and quiet paths.",
    hours: "Typical daylight hours.",
    photoIdeas: ["Peacocks", "Gardens", "Historic cottage"],
    tags: ["gardens", "quiet", "photography"],
  },
  {
    name: "Mount Bonnell",
    category: "park",
    district: "West Austin",
    description: "A classic overlook with panoramic views of the Colorado River and the city.",
    hours: "Generally sunrise to sunset.",
    photoIdeas: ["Sunset panorama", "River bend", "Overlook portraits"],
    tags: ["views", "sunset", "visitor-favorite"],
  },
  {
    name: "Austin Central Library",
    category: "museum",
    district: "Downtown / Seaholm",
    description: "Award-winning library with a rooftop garden, public gathering spaces, and downtown views.",
    hours: "Mon-Thu 9 a.m.-8 p.m.; Fri 9 a.m.-6 p.m.; Sat 10 a.m.-6 p.m.; Sun 12-6 p.m.",
    photoIdeas: ["Modern architecture", "Rooftop garden", "Interior staircase"],
    tags: ["architecture", "seaholm", "workday"],
  },
  {
    name: "The Continental Club",
    category: "music",
    district: "South Congress",
    description: "A legendary live music room with intimate shows and a deep Austin history.",
    hours: "Varies by performance.",
    photoIdeas: ["Neon sign", "Small stage", "Live performers"],
    tags: ["live-music", "south-congress", "nightlife"],
  },
  {
    name: "Broken Spoke",
    category: "music",
    district: "South Lamar",
    description: "Historic honky-tonk with dance lessons, country music, and a real Austin dance floor.",
    hours: "Varies.",
    photoIdeas: ["Dance floor", "Cowboy boots", "Neon exterior"],
    tags: ["country", "dancing", "local-favorite"],
  },
  {
    name: "Mohawk Austin",
    category: "music",
    district: "Red River District",
    description: "Indoor and outdoor music venue for touring acts and Austin nightlife.",
    hours: "Varies by event.",
    photoIdeas: ["Balcony crowd", "Outdoor stage", "Concert lighting"],
    tags: ["red-river", "live-music", "nightlife"],
  },
  {
    name: "Paramount Theatre",
    category: "music",
    district: "Downtown",
    description: "Historic 1915 theater hosting concerts, comedy, film, and special performances.",
    hours: "Varies by show.",
    photoIdeas: ["Historic marquee", "Ornate interior", "Evening exterior"],
    tags: ["theater", "downtown", "historic"],
  },
  {
    name: "Antone's Nightclub",
    category: "music",
    district: "Downtown",
    description: "Famous blues club with an intimate room and a long Austin music legacy.",
    hours: "Varies.",
    photoIdeas: ["Stage performance", "Blues club interior", "Crowd closeups"],
    tags: ["blues", "downtown", "nightlife"],
  },
  {
    name: "Hole in the Wall",
    category: "music",
    district: "UT Area",
    description: "Classic campus bar with live music and a casual Austin crowd.",
    hours: "Varies.",
    photoIdeas: ["Small stage", "Bar exterior", "College crowd"],
    tags: ["campus", "live-music", "bar"],
  },
  {
    name: "Donn's Depot",
    category: "music",
    district: "Downtown",
    description: "Beloved piano bar in a converted rail depot.",
    hours: "Varies.",
    photoIdeas: ["Train depot exterior", "Live piano", "Vintage details"],
    tags: ["piano", "local-favorite", "nightlife"],
  },
  {
    name: "The Parish",
    category: "music",
    district: "East Austin",
    description: "Modern live music venue with an intimate feel and strong touring calendar.",
    hours: "Varies by event.",
    photoIdeas: ["Concert crowd", "Industrial interior", "Stage lights"],
    tags: ["east-austin", "live-music", "concerts"],
  },
  {
    name: "Historic Scoot Inn",
    category: "music",
    district: "East Austin",
    description: "Outdoor concert venue with string lights, patio energy, and touring shows.",
    hours: "Varies.",
    photoIdeas: ["Outdoor stage", "String lights", "Crowd in courtyard"],
    tags: ["outdoor", "east-austin", "concerts"],
  },
  {
    name: "Elephant Room",
    category: "music",
    district: "Downtown",
    description: "Underground jazz club with cocktails and intimate nightly music.",
    hours: "Varies.",
    photoIdeas: ["Low-light jazz", "Intimate tables", "Band closeups"],
    tags: ["jazz", "downtown", "cocktails"],
  },
  {
    name: "Bullock Texas State History Museum",
    category: "museum",
    district: "Capitol District",
    description: "Museum exploring Texas history through exhibits, film, and public programming.",
    hours: "Daily 10 a.m.-5 p.m.; free first Sundays.",
    photoIdeas: ["Texas star sculpture", "Museum facade", "Exhibit details"],
    tags: ["history", "museum", "family"],
  },
  {
    name: "Blanton Museum of Art",
    category: "museum",
    district: "UT Campus",
    description: "Major art museum on the University of Texas campus with galleries and Ellsworth Kelly's Austin.",
    hours: "Tue-Sat 10 a.m.-5 p.m.; Sun 1-5 p.m.",
    photoIdeas: ["Ellsworth Kelly's Austin", "Gallery interiors", "Museum exterior"],
    tags: ["art", "museum", "campus"],
  },
  {
    name: "Canopy Austin",
    category: "museum",
    district: "East Austin",
    description: "Creative campus of artist studios, galleries, murals, and local makers.",
    hours: "Varies by gallery.",
    photoIdeas: ["Industrial studios", "Murals", "Artists at work"],
    tags: ["art", "east-austin", "creative"],
  },
  {
    name: "McLennon Pen Co.",
    category: "museum",
    district: "Downtown",
    description: "Contemporary art gallery with rotating exhibitions and a downtown point of view.",
    hours: "Varies.",
    photoIdeas: ["Minimal gallery interiors", "Exhibition details", "Street frontage"],
    tags: ["art", "gallery", "downtown"],
  },
  {
    name: "West Chelsea Contemporary",
    category: "museum",
    district: "Downtown",
    description: "Contemporary art gallery with museum-quality exhibitions and collector-focused programming.",
    hours: "Varies.",
    photoIdeas: ["Large-scale artwork", "Gallery walls", "Opening night"],
    tags: ["art", "gallery", "downtown"],
  },
  {
    name: "Creek Show",
    category: "museum",
    district: "Downtown",
    description: "Seasonal outdoor public art installation along Waller Creek.",
    hours: "Seasonal fall evenings.",
    photoIdeas: ["Illuminated installations", "Night walk", "Creek reflections"],
    tags: ["public-art", "seasonal", "night"],
  },
  {
    name: "Hope Outdoor Gallery",
    category: "park",
    district: "Airport Area",
    description: "Interactive outdoor graffiti park and mural destination.",
    hours: "Wed-Sun 10 a.m.-6 p.m.",
    photoIdeas: ["Colorful murals", "Artists painting", "Wide outdoor views"],
    tags: ["murals", "art", "photography"],
  },
] as const;

const stage11Collections = [
  { id: "collection_best_coffee", title: "Best coffee", filters: ["coffee", "workday", "morning"] },
  { id: "collection_happy_hour", title: "Happy hour", filters: ["food", "music", "nightlife"] },
  { id: "collection_dog_friendly", title: "Dog friendly", filters: ["park", "outdoor", "walking"] },
  { id: "collection_date_night", title: "Date night", filters: ["music", "food", "art"] },
  { id: "collection_family", title: "Family", filters: ["park", "museum", "family"] },
  { id: "collection_architecture", title: "Architecture", filters: ["architecture", "historic", "downtown"] },
  { id: "collection_music", title: "Music", filters: ["music", "live-music", "nightlife"] },
  { id: "collection_art", title: "Art", filters: ["museum", "art", "gallery", "public-art"] },
  { id: "collection_hidden_gems", title: "Hidden gems", filters: ["local-favorite", "quiet", "creative"] },
  { id: "collection_local_favourites", title: "Local favorites", filters: ["local-favorite", "downtown", "visitor-favorite"] },
];

const pricingImportSources = {
  productsCsv: process.env.STRIPE_PRODUCTS_CSV || path.join(__dirname, "data", "pricing", "products.csv"),
  pricesCsv: process.env.STRIPE_PRICES_CSV || path.join(__dirname, "data", "pricing", "prices.csv"),
  paymentLinksCsv: process.env.STRIPE_PAYMENT_LINKS_CSV || path.join(__dirname, "data", "pricing", "payment_links.csv"),
};

const partnerOutreachWorkbookPath = "/Users/megdude/Downloads/OUTREACH/downtown_perks_full_map_partner_crm (1).xlsx";
const partnerOutreachCsvSources = {
  "Lead List": "/Users/megdude/Downloads/OUTREACH/Lead_List.csv",
  "Message Templates": "/Users/megdude/Downloads/OUTREACH/Message_Templates.csv",
  Assumptions: "/Users/megdude/Downloads/OUTREACH/Assumptions.csv",
  "Master Entity Registry": "/Users/megdude/Downloads/OUTREACH/Master_Entity_Registry.csv",
  "Contact Directory": "/Users/megdude/Downloads/OUTREACH/Contact_Directory.csv",
  "Outreach Tracker": "/Users/megdude/Downloads/OUTREACH/Outreach_Tracker.csv",
  "Perk Campaign Matrix": "/Users/megdude/Downloads/OUTREACH/Perk_Campaign_Matrix.csv",
  Dashboard: "/Users/megdude/Downloads/OUTREACH/Dashboard.csv",
  "Source Log": "/Users/megdude/Downloads/OUTREACH/Source_Log.csv",
};
const needsVerification = "Needs verification";
const outreachStatuses = [
  "Not started",
  "Needs research",
  "Ready to contact",
  "Contacted",
  "Follow-up needed",
  "Meeting requested",
  "Meeting booked",
  "Interested",
  "Not now",
  "Onboarding",
  "Active partner",
  "Archived",
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

function parseCsv(content: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current || row.length) {
    row.push(current);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }

  const [headers = [], ...body] = rows;
  return body.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), String(cells[index] || "").trim()]))
  );
}

async function readCsvIfExists(filePath: string) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return parseCsv(content);
  } catch {
    return [];
  }
}

async function readZipEntryIfExists(zipPath: string, entryName: string) {
  try {
    await fs.stat(zipPath);
    const { stdout } = await execFileAsync("/usr/bin/unzip", ["-p", zipPath, entryName], { maxBuffer: 20 * 1024 * 1024 });
    return stdout;
  } catch {
    return "";
  }
}

function decodeXml(value: string) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function columnNumber(ref: string) {
  const letters = String(ref || "").replace(/[^A-Z]/gi, "").toUpperCase();
  return letters.split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function parseXmlAttributes(tag: string) {
  const attrs: Record<string, string> = {};
  tag.replace(/([\w:]+)="([^"]*)"/g, (_, key, value) => {
    attrs[key] = decodeXml(value);
    return "";
  });
  return attrs;
}

function parseSheetRows(xml: string, sharedStrings: string[] = []) {
  const rows: string[][] = [];
  const rowMatches = xml.matchAll(/<x:row\b[^>]*>([\s\S]*?)<\/x:row>/g);
  for (const rowMatch of rowMatches) {
    const row: string[] = [];
    const cellMatches = rowMatch[1].matchAll(/<x:c\b([^>]*)>([\s\S]*?)<\/x:c>/g);
    for (const cellMatch of cellMatches) {
      const attrs = parseXmlAttributes(cellMatch[1]);
      const cellIndex = columnNumber(attrs.r || "");
      const valueMatch = cellMatch[2].match(/<x:v>([\s\S]*?)<\/x:v>/);
      const inlineMatch = cellMatch[2].match(/<x:t[^>]*>([\s\S]*?)<\/x:t>/);
      let value = decodeXml(valueMatch?.[1] || inlineMatch?.[1] || "");
      if (attrs.t === "s") value = sharedStrings[Number(value)] || "";
      row[cellIndex >= 0 ? cellIndex : row.length] = value.trim();
    }
    if (row.some((cell) => String(cell || "").trim())) rows.push(row);
  }
  return rows;
}

function parseSharedStrings(xml: string) {
  return Array.from(xml.matchAll(/<x:si\b[^>]*>([\s\S]*?)<\/x:si>/g)).map((match) =>
    decodeXml(Array.from(match[1].matchAll(/<x:t[^>]*>([\s\S]*?)<\/x:t>/g)).map((part) => part[1]).join(""))
  );
}

async function readXlsxWorkbook(filePath = partnerOutreachWorkbookPath) {
  const workbookXml = await readZipEntryIfExists(filePath, "xl/workbook.xml");
  const relsXml = await readZipEntryIfExists(filePath, "xl/_rels/workbook.xml.rels");
  const sharedStrings = parseSharedStrings(await readZipEntryIfExists(filePath, "xl/sharedStrings.xml"));
  if (!workbookXml || !relsXml) return { filePath, sheets: [] as Array<{ name: string; rows: Record<string, string>[]; headers: string[] }> };

  const rels = new Map<string, string>();
  for (const match of relsXml.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const attrs = parseXmlAttributes(match[1]);
    if (attrs.Id && attrs.Target) rels.set(attrs.Id, attrs.Target.replace(/^\//, ""));
  }

  const sheets = [];
  for (const match of workbookXml.matchAll(/<x:sheet\b([^>]*)\/>/g)) {
    const attrs = parseXmlAttributes(match[1]);
    const target = rels.get(attrs["r:id"]);
    if (!target) continue;
    const sheetXml = await readZipEntryIfExists(filePath, target.startsWith("xl/") ? target : `xl/${target}`);
    const matrix = parseSheetRows(sheetXml, sharedStrings);
    const headers = (matrix[0] || []).map((header, index) => String(header || `Column ${index + 1}`).trim());
    const rows = matrix.slice(1).map((cells) =>
      Object.fromEntries(headers.map((header, index) => [header, String(cells[index] || "").trim()]))
    );
    sheets.push({ name: attrs.name || target, headers, rows: rows.filter((row) => Object.values(row).some(Boolean)) });
  }
  return { filePath, sheets };
}

async function readPartnerOutreachSource() {
  const csvSheets = await Promise.all(
    Object.entries(partnerOutreachCsvSources).map(async ([name, filePath]) => {
      const rows = await readCsvIfExists(filePath);
      return {
        name,
        filePath,
        headers: rows[0] ? Object.keys(rows[0]) : [],
        rows,
      };
    })
  );
  if (csvSheets.some((sheet) => sheet.rows.length > 0)) {
    return {
      filePath: "/Users/megdude/Downloads/OUTREACH/*.csv",
      sourceType: "csv",
      sheets: csvSheets,
    };
  }
  return { ...(await readXlsxWorkbook(partnerOutreachWorkbookPath)), sourceType: "xlsx" };
}

async function getMapImportSourceStatus() {
  const entries = await Promise.all(
    Object.entries(mapImportSources).map(async ([key, filePath]) => {
      try {
        const stat = await fs.stat(filePath);
        return [key, { path: filePath, exists: true, bytes: stat.size }];
      } catch {
        return [key, { path: filePath, exists: false, bytes: 0 }];
      }
    })
  );
  return Object.fromEntries(entries);
}

function normalizeMapEntityType(row: Record<string, any>) {
  const raw = [row.partner_type, row.entity_type, row.category, row.type]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .join(" ");
  if (raw.includes("hotel") || raw.includes("hospitality")) return "hotel";
  if (raw.includes("property") || raw.includes("residential") || raw.includes("real estate") || raw.includes("listing")) return "property";
  if (raw.includes("brand")) return "brand";
  if (raw.includes("civic") || raw.includes("district") || raw.includes("area")) return "civic";
  if (raw.includes("fitness") || raw.includes("wellness") || raw.includes("service")) return "service";
  return "venue";
}

function cleanCrmValue(value: any) {
  const text = String(value ?? "").trim();
  if (!text || /^(to verify|verify|needs verification|n\/a|na|tbd|unknown|null|undefined)$/i.test(text)) return "";
  return text;
}

function displayCrmValue(value: any) {
  return cleanCrmValue(value) || needsVerification;
}

function pickField(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const direct = cleanCrmValue(row[key]);
    if (direct) return direct;
    const foundKey = Object.keys(row).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    if (foundKey) {
      const value = cleanCrmValue(row[foundKey]);
      if (value) return value;
    }
  }
  return "";
}

function scorePriority(priority: string, leadScore?: string) {
  const numeric = Number(String(leadScore || "").replace(/[^0-9.]/g, ""));
  if (Number.isFinite(numeric) && numeric > 0) return Math.min(100, numeric);
  const raw = String(priority || "").toLowerCase();
  if (raw.includes("high")) return 90;
  if (raw.includes("medium")) return 65;
  if (raw.includes("low")) return 40;
  return 50;
}

function normalizeOutreachStage(value: string) {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("not contacted") || raw.includes("not started")) return "Not started";
  if (raw.includes("contacted")) return "Contacted";
  if (raw.includes("follow")) return "Follow-up needed";
  if (raw.includes("meeting booked")) return "Meeting booked";
  if (raw.includes("meeting")) return "Meeting requested";
  if (raw.includes("interested")) return "Interested";
  if (raw.includes("not now")) return "Not now";
  if (raw.includes("onboarding")) return "Onboarding";
  if (raw.includes("active")) return "Active partner";
  if (raw.includes("archive")) return "Archived";
  if (raw.includes("ready")) return "Ready to contact";
  if (raw.includes("research") || raw.includes("verify")) return "Needs research";
  return "Not started";
}

function classifyPartnerType(row: Record<string, any>) {
  const raw = `${pickField(row, ["Entity Type", "Type"])} ${pickField(row, ["Subtype", "Category"])} ${pickField(row, ["Partner Type"])}`.toLowerCase();
  if (raw.includes("coffee")) return "Coffee";
  if (raw.includes("bar") || raw.includes("cocktail") || raw.includes("nightlife")) return "Bars";
  if (raw.includes("restaurant") || raw.includes("dining") || raw.includes("venue")) return "Restaurants";
  if (raw.includes("hotel") || raw.includes("hospitality")) return "Hotels";
  if (raw.includes("residential")) return "Residential Buildings";
  if (raw.includes("office")) return "Office Buildings";
  if (raw.includes("property") || raw.includes("building")) return "Properties";
  if (raw.includes("civic") || raw.includes("community")) return "Civic";
  if (raw.includes("wellness")) return "Wellness";
  if (raw.includes("fitness")) return "Fitness";
  if (raw.includes("service")) return "Services";
  if (raw.includes("retail") || raw.includes("shop")) return "Retail";
  if (raw.includes("event")) return "Events";
  if (raw.includes("brand")) return "Brands";
  if (raw.includes("real estate") || raw.includes("listing")) return "Real Estate";
  if (raw.includes("campaign")) return "Campaigns";
  if (raw.includes("perk")) return "Perks";
  return pickField(row, ["Partner Type", "Entity Type", "Category"]) || "Partners";
}

function contactFirstName(contactName: string) {
  const cleaned = cleanCrmValue(contactName);
  if (!cleaned || /verif|needs|unknown|contact/i.test(cleaned)) return "there";
  return cleaned.split(/\s+/)[0];
}

function partnerAngle(type: string) {
  const raw = String(type || "").toLowerCase();
  if (raw.includes("hotel")) return "helping guests find better local places nearby without needing another app";
  if (raw.includes("residential") || raw.includes("property") || raw.includes("building")) return "a resident amenity that helps people find nearby food, events, services, and perks";
  if (raw.includes("retail")) return "a simple resident offer or featured local campaign";
  if (raw.includes("civic") || raw.includes("community")) return "making downtown events, civic programs, and local resources easier to find";
  if (raw.includes("coffee")) return "a morning or workday resident perk";
  if (raw.includes("bar")) return "a happy hour feature or after-work local route";
  if (raw.includes("event")) return "connecting event interest to nearby food, drinks, parking, and services";
  if (raw.includes("brand")) return "a local campaign that reaches downtown residents at the right moment";
  if (raw.includes("real estate")) return "a neighborhood guide and listings layer that makes downtown feel easier to understand";
  return "a resident perk or local discovery feature";
}

function districtInsight(district: string) {
  const raw = String(district || "").toLowerCase();
  if (raw.includes("rainey")) return "Rainey has dense residential towers, hotel traffic, trail access, and quick dinner/drink decisions.";
  if (raw.includes("red river")) return "Red River is event-led, music-driven, and strongest when visitors can connect venues with nearby food and drinks.";
  if (raw.includes("congress")) return "Congress works well for civic, hotel, office, and visitor discovery because it sits in the downtown decision path.";
  if (raw.includes("2nd") || raw.includes("second")) return "Second Street is a retail and dining corridor where resident offers and featured campaigns can feel timely.";
  if (raw.includes("warehouse")) return "The Warehouse District is strongest for after-work, dining, nightlife, and group plans.";
  if (raw.includes("east")) return "East downtown discovery benefits from simple map context because residents often move between food, wellness, and events.";
  return district ? `${district} benefits from practical local discovery at the moment people are choosing where to go.` : "Downtown discovery works best when the ask is practical and close to a real resident or visitor decision.";
}

function partnerStrategicLens(type: string) {
  const raw = String(type || "").toLowerCase();
  if (raw.includes("hotel")) {
    return {
      audience: "hotel guests and concierge/front desk teams",
      benefit: "make nearby recommendations easier without asking guests to download another app",
      ask: "review a guest-friendly listing and a simple local guide placement",
    };
  }
  if (raw.includes("property") || raw.includes("residential") || raw.includes("building")) {
    return {
      audience: "residents, leasing teams, and property managers",
      benefit: "turn local discovery into a useful resident amenity",
      ask: "review a building welcome route and confirm the right contact for setup",
    };
  }
  if (raw.includes("civic") || raw.includes("community")) {
    return {
      audience: "downtown residents, visitors, and nearby workers looking for local resources",
      benefit: "make civic programs, events, and resources easier to find in context",
      ask: "review the listing angle and identify the best program or event to feature first",
    };
  }
  if (raw.includes("brand") || raw.includes("campaign")) {
    return {
      audience: "downtown residents and guests who are close to a purchase or visit decision",
      benefit: "test a focused neighborhood campaign instead of broad untargeted awareness",
      ask: "look at one lightweight campaign concept and decide if it is worth piloting",
    };
  }
  if (raw.includes("event")) {
    return {
      audience: "eventgoers planning what to do before or after the event",
      benefit: "connect event interest to nearby food, drink, parking, and service decisions",
      ask: "review one event route or featured listing idea",
    };
  }
  if (raw.includes("retail")) {
    return {
      audience: "residents, hotel guests, and downtown workers shopping nearby",
      benefit: "surface the shop when people are already close enough to visit",
      ask: "review a simple resident offer or featured local campaign",
    };
  }
  if (raw.includes("coffee")) {
    return {
      audience: "morning residents, hybrid workers, and hotel guests",
      benefit: "capture repeat nearby routines without making the offer complicated",
      ask: "review a morning perk or workday listing idea",
    };
  }
  if (raw.includes("bar") || raw.includes("restaurant") || raw.includes("venue")) {
    return {
      audience: "residents, guests, and nearby workers choosing where to eat or meet",
      benefit: "show up during the decision moment for dining, happy hour, or group plans",
      ask: "review one resident dining perk or featured route idea",
    };
  }
  return {
    audience: "downtown residents, guests, and nearby workers",
    benefit: "make the partner easier to discover when people are deciding what to do nearby",
    ask: "review one simple listing and perk idea",
  };
}

function buildOutreachStrategyBrief(partner: Record<string, any>, contact: Record<string, any> = {}) {
  const partnerName = displayCrmValue(partner.name || partner.business_name);
  const type = displayCrmValue(partner.type || partner.partner_type || partner.category || "Partner");
  const district = cleanCrmValue(partner.district);
  const perk = cleanCrmValue(partner.suggested_perk || partner.recommended_perk) || "a simple resident-friendly perk";
  const campaign = cleanCrmValue(partner.suggested_campaign || partner.recommended_campaign) || "a focused local discovery campaign";
  const residentValue = cleanCrmValue(partner.resident_value || partner.description);
  const businessValue = cleanCrmValue(partner.business_value || partner.partner_fit);
  const notes = cleanCrmValue(partner.notes || partner.partner_fit);
  const contactRole = cleanCrmValue(contact.role || partner.contact_role || partner.best_contact_role);
  const lens = partnerStrategicLens(type);
  const insight = districtInsight(district);
  const priority = cleanCrmValue(partner.priority || String(partner.priority_score || ""));
  const recommendedAngle = `${partnerName} can use Downtown Perks to reach ${lens.audience}; the practical first step is ${perk}.`;
  const proofPoint = businessValue || residentValue || notes || `${type} in ${district || "downtown"} has a natural discovery moment.`;
  return {
    partner_name: partnerName,
    partner_type: type,
    district: district || "Downtown Austin",
    contact_role: contactRole || "partner decision maker",
    contact_name: cleanCrmValue(contact.name || contact.contact_name),
    suggested_perk: perk,
    suggested_campaign: campaign,
    resident_value: residentValue || lens.audience,
    business_value: businessValue || lens.benefit,
    existing_notes: notes,
    priority,
    district_insight: insight,
    audience: lens.audience,
    strategic_benefit: lens.benefit,
    recommended_angle: recommendedAngle,
    practical_ask: lens.ask,
    proof_point: proofPoint,
    quality_rules: [
      "Use the partner name naturally, not as a mail-merge token.",
      "Reference the partner type, district, perk, campaign, or notes in a specific way.",
      "Write in the Downtown Perks brand voice: clean, calm, direct, local, premium, and easy to understand.",
      "Use everyday language people actually say. Prefer short words and simple sentences.",
      "Sound like a thoughtful local operator, not a SaaS sales sequence or marketing deck.",
      "Avoid jargon like optimize, leverage, unlock, synergy, ecosystem, frictionless, maximize, seamless, hyperlocal, and omnichannel.",
      "Keep the text message under 70 words and the email under 170 words.",
      "Do not claim results, traffic, exclusivity, guaranteed revenue, or formal partnership status.",
      "End with a low-pressure quick-chat ask.",
    ],
  };
}

function stripTemplateArtifacts(value: string) {
  return String(value || "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function meaningfulTerms(value: string, max = 4) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 3 && !["with", "from", "that", "this", "into", "nearby", "simple", "downtown", "perks", "partner"].includes(term))
    .slice(0, max);
}

function outreachSpecificityScore(copy: { shortText?: string; subject?: string; body?: string }, brief: ReturnType<typeof buildOutreachStrategyBrief>) {
  const combined = `${copy.shortText || ""} ${copy.subject || ""} ${copy.body || ""}`.toLowerCase();
  let score = 0;
  const partnerTerms = meaningfulTerms(brief.partner_name, 3);
  if (partnerTerms.some((term) => combined.includes(term))) score += 2;
  if (meaningfulTerms(brief.suggested_perk, 5).some((term) => combined.includes(term))) score += 2;
  if (meaningfulTerms(brief.suggested_campaign, 5).some((term) => combined.includes(term))) score += 1;
  if (meaningfulTerms(brief.district, 2).some((term) => combined.includes(term))) score += 1;
  if (meaningfulTerms(brief.partner_type, 2).some((term) => combined.includes(term))) score += 1;
  if (meaningfulTerms(brief.audience, 4).some((term) => combined.includes(term))) score += 1;
  if (meaningfulTerms(brief.business_value, 5).some((term) => combined.includes(term))) score += 1;
  if (meaningfulTerms(brief.resident_value, 5).some((term) => combined.includes(term))) score += 1;
  return score;
}

function outreachCopyLooksGeneric(copy: { shortText?: string; subject?: string; body?: string }, brief: ReturnType<typeof buildOutreachStrategyBrief>) {
  const combined = `${copy.shortText || ""} ${copy.subject || ""} ${copy.body || ""}`.toLowerCase();
  const badPhrases = ["dear valued partner", "game changer", "revolutionize", "synergy", "unlock growth", "ai-powered outreach", "as a language model", "i hope this message finds you well", "transform your business", "maximize exposure", "optimize", "leverage", "ecosystem", "frictionless", "seamless", "omnichannel", "hyperlocal", "robust solution", "drive engagement", "conversion funnel"];
  const hasBadPhrase = badPhrases.some((phrase) => combined.includes(phrase));
  const score = outreachSpecificityScore(copy, brief);
  const bodyWords = String(copy.body || "").split(/\s+/).filter(Boolean).length;
  const textWords = String(copy.shortText || "").split(/\s+/).filter(Boolean).length;
  return score < 6 || hasBadPhrase || bodyWords > 180 || textWords > 85;
}

function curatedStrategistOutreachCopy(partner: Record<string, any>, contact: Record<string, any> = {}, brief = buildOutreachStrategyBrief(partner, contact)) {
  const firstName = contactFirstName(brief.contact_name);
  const reason = String(brief.proof_point || brief.district_insight).replace(/[.。]+$/, "");
  const subject = `${brief.partner_name}: ${brief.suggested_perk}`;
  const typeContext = `${brief.district} ${brief.partner_type.toLowerCase()}`.replace(/\s+/g, " ").trim();
  const shortText = `Hey ${firstName} - I’m building Downtown Perks for people who are already nearby. ${brief.partner_name} feels like a good fit for ${brief.suggested_perk}, especially around ${typeContext}. I’d love to show you the idea and see if it feels useful. Open to a quick chat?`;
  const body = `Hi ${firstName},

I’m building Downtown Perks, a simple local map for people who live, work, and stay downtown.

${brief.partner_name} stood out because ${reason}.

For a first step, I’d keep it simple: ${brief.suggested_perk}. That could pair well with ${brief.suggested_campaign} and give people nearby a clear reason to notice ${brief.partner_name}.

Would you be open to a quick 15-minute chat next week? No pressure either way.

Best,
Meg`;
  const html = buildDowntownPerksEmailTemplate({
    partnerName: brief.partner_name,
    subject,
    body,
    previewText: `${brief.suggested_perk} for ${brief.partner_name}.`,
  });
  return {
    shortText,
    subject,
    body,
    html,
    strategy: {
      angle: brief.recommended_angle,
      audience: brief.audience,
      benefit: brief.strategic_benefit,
      proof_point: brief.proof_point,
      ask: brief.practical_ask,
      quality: "curated_local_strategy",
      voice: "downtown_perks_plainspoken",
      specificity_score: outreachSpecificityScore({ shortText, subject, body }, brief),
    },
  };
}

function escapeHtml(value: any) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteAppUrl(pathOrUrl: string) {
  const value = cleanCrmValue(pathOrUrl);
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const base = process.env.PUBLIC_APP_URL || process.env.VITE_PUBLIC_APP_URL || "https://downtown-perks-backend.vercel.app";
  return `${base.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
}

function emailImageForPartner(partnerName: string, type = "") {
  const raw = `${partnerName} ${type}`.toLowerCase();
  if (raw.includes("hotel")) return "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";
  if (raw.includes("coffee")) return "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80";
  if (raw.includes("restaurant") || raw.includes("bar") || raw.includes("venue")) return "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80";
  if (raw.includes("retail") || raw.includes("brand")) return "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80";
  if (raw.includes("civic") || raw.includes("event")) return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80";
  return "https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=1200&q=80";
}

function buildDowntownPerksEmailTemplate(input: {
  partnerName: string;
  subject?: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  previewText?: string;
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  bannerImageUrl?: string;
  partnerImageUrl?: string;
  logoUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  footerNote?: string;
}) {
  const partnerName = displayCrmValue(input.partnerName);
  const subject = escapeHtml(input.subject || `Quick Downtown Perks idea for ${partnerName}`);
  const headline = escapeHtml(input.headline || `A local idea for ${partnerName}`);
  const eyebrow = escapeHtml(input.eyebrow || "Downtown Perks");
  const subheadline = escapeHtml(input.subheadline || "A simple partnership concept for downtown discovery.");
  const bodyHtml = escapeHtml(input.body).replace(/\n/g, "<br />");
  const ctaLabel = escapeHtml(input.ctaLabel || "Review partner setup");
  const ctaHref = escapeHtml(input.ctaHref || absoluteAppUrl("/partners/register"));
  const secondaryCtaLabel = escapeHtml(input.secondaryCtaLabel || "View map idea");
  const secondaryCtaHref = escapeHtml(input.secondaryCtaHref || absoluteAppUrl("/map"));
  const bannerImageUrl = escapeHtml(input.bannerImageUrl || input.partnerImageUrl || emailImageForPartner(partnerName));
  const logoUrl = cleanCrmValue(input.logoUrl);
  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" width="132" alt="Downtown Perks" style="display:block;max-width:132px;height:auto;border:0;" />`
    : `<p style="margin:0;color:#0B1F33;font-size:14px;line-height:1;font-weight:750;">Downtown Perks</p>`;
  const previewText = escapeHtml(input.previewText || `A simple Downtown Perks partnership idea for ${partnerName}.`);
  const footerNote = escapeHtml(input.footerNote || "Local discovery for downtown Austin residents, guests, and nearby workers.");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;color:#0B1F33;font-family:Inter,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;">
      <tr>
        <td align="center" style="padding:24px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;border-collapse:collapse;border:1px solid rgba(11,31,51,0.10);">
            <tr>
              <td style="padding:18px 20px;border-bottom:1px solid rgba(11,31,51,0.08);">
                ${logoHtml}
              </td>
            </tr>
            <tr>
              <td>
                <img src="${bannerImageUrl}" width="640" alt="${partnerName} local discovery" style="display:block;width:100%;max-width:640px;height:auto;max-height:250px;object-fit:cover;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:22px 22px 6px 22px;">
                <p style="margin:0;color:#C8A96A;font-size:10px;line-height:1.2;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${eyebrow}</p>
                <h1 style="margin:8px 0 0 0;color:#0B1F33;font-size:20px;line-height:1.2;font-weight:650;">${headline}</h1>
                <p style="margin:9px 0 0 0;color:rgba(11,31,51,0.64);font-size:13px;line-height:1.45;font-weight:400;">${subheadline}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 22px 0 22px;">
                <div style="margin:0;color:#24384B;font-size:14px;line-height:1.58;font-weight:400;">${bodyHtml}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 22px 24px 22px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 10px 8px 0;">
                      <a href="${ctaHref}" style="display:inline-block;background:#C8A96A;color:#0B1F33;text-decoration:none;padding:11px 15px;border-radius:4px;font-size:12px;line-height:1;font-weight:700;">${ctaLabel}</a>
                    </td>
                    <td style="padding:0 0 8px 0;">
                      <a href="${secondaryCtaHref}" style="display:inline-block;color:#0B1F33;text-decoration:none;padding:10px 0;border-bottom:1px solid #C8A96A;font-size:12px;line-height:1;font-weight:700;">${secondaryCtaLabel}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:15px 22px;background:#0B1F33;">
                <p style="margin:0;color:#ffffff;font-size:12px;line-height:1.45;font-weight:700;">Downtown Perks</p>
                <p style="margin:4px 0 0 0;color:rgba(255,255,255,0.72);font-size:11px;line-height:1.45;">${footerNote}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildOutreachEmailHtml(partner: Record<string, any>, message: Record<string, any>) {
  const partnerName = partner.name || partner.business_name;
  return buildDowntownPerksEmailTemplate({
    partnerName,
    subject: message.subject,
    body: message.body,
    headline: message.email_headline || `A local idea for ${partnerName}`,
    subheadline: message.email_subheadline || cleanCrmValue(partner.suggested_perk || partner.recommended_perk || message.strategy?.angle) || "A practical way to connect with people already nearby.",
    bannerImageUrl: message.banner_image_url || message.partner_image_url || emailImageForPartner(partnerName, partner.partner_type || partner.type),
    logoUrl: message.logo_url,
    ctaLabel: message.cta_label || "Review partner setup",
    ctaHref: message.cta_href || absoluteAppUrl("/partners/register"),
    secondaryCtaLabel: message.secondary_cta_label || "View map idea",
    secondaryCtaHref: message.secondary_cta_href || absoluteAppUrl(partner.downtown_perks_map_url || partner.google_maps_url || "/map"),
    footerNote: message.footer_note,
    previewText: `A simple Downtown Perks partnership idea for ${partnerName}.`,
  });
}

function generateOutreachCopy(partner: Record<string, any>, contact: Record<string, any> = {}) {
  const brief = buildOutreachStrategyBrief(partner, contact);
  return curatedStrategistOutreachCopy(partner, contact, brief);
}

async function generatePersonalizedOutreachCopy(partner: Record<string, any>, contact: Record<string, any> = {}) {
  const brief = buildOutreachStrategyBrief(partner, contact);
  const fallback = generateOutreachCopy(partner, contact);
  const provider = getProviderManager().primary;
  if (!provider.configured) return { ...fallback, provider: "local_strategy", intelligence: brief };
  try {
    const response = await provider.chat([
      {
        role: "system",
        content:
          "You are the Downtown Perks outreach intelligence layer. Think like a sharp local growth strategist, but write only in the Downtown Perks brand voice: clean, calm, direct, local, premium, human, and easy to understand. Use everyday language. No hype. No jargon. No SaaS language. No words like optimize, leverage, unlock, ecosystem, seamless, hyperlocal, omnichannel, synergy, maximize, or drive engagement. Every line must be traceable to this partner's type, district, perk, campaign, resident value, business value, notes, or contact role. Generic copy will be rejected. Return strict JSON only with keys: shortText, subject, body, strategy. strategy must include angle, audience, benefit, proof_point, ask, quality_notes, brand_voice_notes, and specificity_signals_used. The body must be plain text signed Best, Meg.",
      },
      {
        role: "user",
        content: `Craft one tailored short text and one email from this strategy brief. Follow every quality rule and the Downtown Perks voice. Use plain language a normal person would understand on first read. Use only the supplied facts. Required: mention the partner by name, use the specific suggested perk or campaign, reference the district/type/audience context, and explain one practical benefit. If contact_name is missing, write "Hi there," and "Hey there". Do not sound automated.\n\n${JSON.stringify(brief, null, 2)}`,
      },
    ]);
    const parsed = JSON.parse(response);
    const modelDraft = {
      shortText: stripTemplateArtifacts(cleanCrmValue(parsed.shortText)) || "",
      subject: stripTemplateArtifacts(cleanCrmValue(parsed.subject)) || "",
      body: stripTemplateArtifacts(cleanCrmValue(parsed.body)) || "",
      strategy: parsed.strategy && typeof parsed.strategy === "object" ? parsed.strategy : {},
    };
    if (modelDraft.shortText && modelDraft.subject && modelDraft.body && outreachCopyLooksGeneric(modelDraft, brief)) {
      return {
        ...fallback,
        provider: "local_strategy_guardrail",
        intelligence: brief,
        guardrail: "OpenAI output was missing partner-specific signals or contained generic language.",
      };
    }
    const generated = {
      ...fallback,
      strategy: {
        ...fallback.strategy,
        model_quality_notes: modelDraft.strategy?.quality_notes || "",
        model_specificity_signals: modelDraft.strategy?.specificity_signals_used || [],
      },
    };
    const html = buildDowntownPerksEmailTemplate({
      partnerName: partner.name || partner.business_name,
      subject: generated.subject,
      body: generated.body,
      previewText: `A simple Downtown Perks partnership idea for ${partner.name || partner.business_name}.`,
    });
    return { ...generated, html, provider: "openai_strategy_curated_copy", intelligence: brief };
  } catch (error) {
    return { ...fallback, provider: "local_strategy_fallback", intelligence: brief, error: error instanceof Error ? error.message : "AI generation failed" };
  }
}

function verificationFieldsForPartner(partner: Record<string, any>, contact: Record<string, any> = {}) {
  const checks = [
    ["website", partner.website],
    ["phone", partner.phone],
    ["contact_name", contact.name || contact.contact_name],
    ["contact_role", contact.role],
    ["contact_email", contact.email || contact.contact_route],
    ["contact_phone", contact.phone],
    ["linkedin_url", contact.linkedin_url],
    ["google_maps_url", partner.google_maps_url],
  ];
  return checks.filter(([, value]) => displayCrmValue(value) === needsVerification).map(([key]) => key);
}

function resolvedOutreachStage(partner: Record<string, any>) {
  const importedStage = partner.source_rows?.master?.["Lead Stage"] || partner.raw_fields?.["Lead Stage"] || "";
  const current = partner.outreach_stage || partner.status || importedStage;
  if (String(importedStage || current).toLowerCase().includes("not contacted")) return "Not started";
  return normalizeOutreachStage(current);
}

function getOutreachActivities(entities: Database["entities"], partnerId: string) {
  return entities.PartnerOutreachStep
    .filter((item) => item.partner_id === partnerId)
    .sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime());
}

function getOutreachItemsByType(entities: Database["entities"], partnerId: string, types: string[]) {
  return entities.PartnerOutreachStep
    .filter((item) => item.partner_id === partnerId && types.includes(String(item.activity_type || "")) && !item.deleted_at)
    .sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime());
}

function logOutreachActivity(entities: Database["entities"], input: Record<string, any>) {
  const id = input.id || `outreach_activity_${slug(input.partner_id || "partner")}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return ensureRecord(entities.PartnerOutreachStep, id, {
    partner_id: input.partner_id,
    contact_id: input.contact_id || "",
    activity_type: input.activity_type || "update",
    title: input.title || input.activity_type || "Update",
    notes: input.notes || "",
    status: input.status || "",
    metadata: input.metadata || {},
    created_at: now(),
  });
}

function findSheetRows(workbook: { sheets: Array<{ name: string; rows: Record<string, string>[]; headers: string[] }> }, name: string) {
  return workbook.sheets.find((sheet) => sheet.name.toLowerCase() === name.toLowerCase())?.rows || [];
}

function buildOutreachCrmRows(entities: Database["entities"]) {
  return entities.Partner
    .filter((partner) => partner.source_type === "partner_outreach_crm" && !partner.deleted_at)
    .map((partner) => {
      const contact = (entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id) || {}) as Record<string, any>;
      const campaign = (entities.PartnerOutreachCampaign.find((item) => item.partner_id === partner.id) || {}) as Record<string, any>;
      const message = (entities.PartnerOutreachMessage.find((item) => item.partner_id === partner.id && item.channel === "email") || {}) as Record<string, any>;
      const smsMessage = (entities.PartnerOutreachMessage.find((item) => item.partner_id === partner.id && item.channel === "sms") || {}) as Record<string, any>;
      const step = (entities.PartnerOutreachStep.find((item) => item.partner_id === partner.id) || {}) as Record<string, any>;
      const activities = getOutreachActivities(entities, partner.id);
      const crmNotes = getOutreachItemsByType(entities, partner.id, ["note"]);
      const tasks = getOutreachItemsByType(entities, partner.id, ["task"]);
      const files = getOutreachItemsByType(entities, partner.id, ["file"]);
      const emailMessage = message.id && !message.html ? { ...message, html: buildOutreachEmailHtml(partner, message) } : message;
      return {
        ...partner,
        name: partner.business_name || partner.name,
        type: partner.partner_type || partner.type || partner.category,
        contact,
        campaign,
        message: emailMessage,
        sms_message: smsMessage,
        step,
        activities,
        crm_notes: crmNotes,
        tasks,
        files,
        best_contact: displayCrmValue(contact.name || contact.contact_name || contact.role),
        outreach_stage: resolvedOutreachStage(partner),
        next_action: step.title || partner.next_action || "Verify contact and send first note",
        last_contacted: partner.last_contacted || "",
        verification_fields: verificationFieldsForPartner(partner, contact),
        verification_status: verificationFieldsForPartner(partner, contact).length ? "Needs verification" : partner.verification_status || "Verified enough",
      };
    })
    .sort((a: Record<string, any>, b: Record<string, any>) => Number(b.priority_score || 0) - Number(a.priority_score || 0));
}

async function importPartnerOutreachWorkbook(entities: Database["entities"]) {
  const workbook = await readPartnerOutreachSource();
  const masterRows = findSheetRows(workbook, "Master Entity Registry");
  const contactRows = findSheetRows(workbook, "Contact Directory");
  const trackerRows = findSheetRows(workbook, "Outreach Tracker");
  const perkRows = findSheetRows(workbook, "Perk Campaign Matrix");
  const templateRows = findSheetRows(workbook, "Message Templates");
  const contactsByEntity = new Map(contactRows.map((row) => [pickField(row, ["Entity ID"]), row]));
  const trackerByEntity = new Map(trackerRows.map((row) => [pickField(row, ["Entity ID"]), row]));
  const perkByEntity = new Map(perkRows.map((row) => [pickField(row, ["Entity ID"]), row]));
  const before = buildOutreachCrmRows(entities).length;
  const imported: string[] = [];

  masterRows.forEach((row, index) => {
    const entityId = pickField(row, ["Entity ID"]) || `DP-${String(index + 1).padStart(4, "0")}`;
    const name = pickField(row, ["Pin / Partner Name", "Entity name", "Partner Name", "Company name"]);
    if (!name) return;
    const contactRow = contactsByEntity.get(entityId) || {};
    const trackerRow = trackerByEntity.get(entityId) || {};
    const perkRow = perkByEntity.get(entityId) || {};
    const type = classifyPartnerType(row);
    const partnerId = `partner_outreach_${slug(entityId || name)}`;
    const suggestedPerk = pickField(row, ["Suggested perk", "Ideal Perk Offer"]) || pickField(perkRow, ["Suggested Perk", "Perk Idea", "Ideal Perk Offer"]);
    const suggestedCampaign = pickField(row, ["Suggested campaign", "Campaign Idea"]) || pickField(perkRow, ["Campaign Idea", "Suggested Campaign"]);
    const priority = pickField(row, ["Priority", "Outreach priority"]);
    const stage = normalizeOutreachStage(pickField(trackerRow, ["Lead Stage", "Outreach Stage", "Status"]) || pickField(row, ["Lead Stage", "Listing Status"]));
    const partner = ensureRecord(entities.Partner, partnerId, {
      external_entity_id: entityId,
      business_name: name,
      name,
      type,
      category: pickField(row, ["Subtype", "Category", "Entity Type"]) || type,
      partner_type: pickField(row, ["Partner Type"]) || type,
      district: pickField(row, ["District / neighborhood", "District"]),
      address: pickField(row, ["Address"]),
      website: pickField(row, ["Website"]),
      phone: pickField(row, ["Phone", "Contact Phone"]),
      google_maps_url: pickField(row, ["Google Maps URL", "Google Maps Url"]),
      company: pickField(row, ["Company / ownership group", "Company / Parent"]),
      property_manager: pickField(row, ["Property manager"]),
      leasing_team: pickField(row, ["Leasing team"]),
      description: pickField(row, ["Description", "Resident Value"]),
      partner_fit: pickField(row, ["Downtown Perks fit", "Partner Pitch", "Resident Value"]),
      resident_value: pickField(row, ["Resident Value"]),
      business_value: pickField(row, ["Business Value", "Partner Pitch"]),
      recommended_plan: pickField(row, ["Suggested annual plan", "Recommended Plan"]),
      suggested_perk: suggestedPerk,
      suggested_campaign: suggestedCampaign,
      priority,
      priority_score: scorePriority(priority, pickField(row, ["Lead score", "Priority score"])),
      contact_confidence: pickField(row, ["Contact confidence", "Contact Confidence"]),
      verification_status: pickField(row, ["Verification status", "Listing Status"]),
      notes: pickField(row, ["Notes"]),
      source_url: pickField(row, ["Source URL"]),
      last_updated: pickField(row, ["Last updated"]) || now(),
      status: stage,
      outreach_stage: stage,
      last_contacted: pickField(trackerRow, ["Last Contacted", "Last contacted"]),
      next_follow_up_date: pickField(trackerRow, ["Next Follow-up Date", "Next follow-up date"]),
      next_action: pickField(trackerRow, ["Next Action", "Next action"]) || "Verify contact and send first note",
      source_type: "partner_outreach_crm",
      source_workbook: workbook.filePath,
      raw_fields: row,
      source_rows: { master: row, contact: contactRow, tracker: trackerRow, perk: perkRow },
    });

    const contactName = pickField(row, ["Contact name", "Contact Name"]) || pickField(contactRow, ["Named Contact"]);
    const contactRole = pickField(row, ["Contact role", "Best Contact Role"]) || pickField(contactRow, ["Target Role"]);
    const contactEmail = pickField(row, ["Contact email", "Contact Email / URL"]) || pickField(contactRow, ["Contact Route"]);
    const contactPhone = pickField(row, ["Contact phone", "Contact Phone"]) || pickField(contactRow, ["Phone"]);
    const contact = ensureRecord(entities.PartnerOutreachContact, `outreach_contact_${slug(entityId)}`, {
      partner_id: partner.id,
      partner_name: name,
      name: displayCrmValue(contactName),
      contact_name: displayCrmValue(contactName),
      role: displayCrmValue(contactRole),
      email: cleanCrmValue(contactEmail).includes("@") ? contactEmail : "",
      contact_route: displayCrmValue(contactEmail),
      phone: displayCrmValue(contactPhone),
      linkedin_url: pickField(row, ["LinkedIn URL"]),
      confidence: displayCrmValue(pickField(row, ["Contact Confidence"]) || pickField(contactRow, ["Confidence"])),
      verification_status: displayCrmValue(pickField(row, ["Verification status", "Listing Status"]) || pickField(contactRow, ["Research Needed"])),
      source_url: pickField(row, ["Source URL"]),
      notes: pickField(contactRow, ["Research Needed"]),
      status: stage,
      priority,
      source: "partner_outreach_crm",
      raw_fields: contactRow,
    });

    const generated = generateOutreachCopy(partner, contact);
    const shortBody = pickField(row, ["Suggested message", "Suggested Initial Message"]) || pickField(contactRow, ["Suggested Message"]) || generated.shortText;
    ensureRecord(entities.PerkLocation, `outreach_perk_${slug(entityId)}`, {
      partner_id: partner.id,
      name,
      title: displayCrmValue(suggestedPerk),
      perk: displayCrmValue(suggestedPerk),
      description: displayCrmValue(suggestedPerk),
      perk_type: type,
      resident_value: displayCrmValue(partner.resident_value),
      business_value: displayCrmValue(partner.business_value),
      status: "draft",
      source_type: "partner_outreach_crm",
    });
    ensureRecord(entities.PartnerOutreachCampaign, `outreach_campaign_${slug(entityId)}`, {
      partner_id: partner.id,
      partner_name: name,
      category: type,
      campaign_title: displayCrmValue(suggestedCampaign),
      campaign_description: displayCrmValue(pickField(perkRow, ["Campaign Description"]) || suggestedCampaign),
      campaign_type: type,
      recommended_timing: displayCrmValue(pickField(perkRow, ["Recommended Timing"])),
      target_audience: displayCrmValue(pickField(perkRow, ["Target Audience"]) || "Downtown residents, guests, and nearby workers"),
      status: "draft",
      stage,
      objective: displayCrmValue(partner.partner_fit),
      recommended_subject: generated.subject,
      next_action: partner.next_action,
      raw_fields: perkRow,
    });
    ensureRecord(entities.PartnerOutreachMessage, `outreach_message_${slug(entityId)}_sms`, {
      partner_id: partner.id,
      contact_id: contact.id,
      channel: "sms",
      subject: "Short text / DM",
      body: shortBody,
      status: "draft",
      follow_up_at: partner.next_follow_up_date || "",
    });
    ensureRecord(entities.PartnerOutreachMessage, `outreach_message_${slug(entityId)}_email`, {
      partner_id: partner.id,
      contact_id: contact.id,
      channel: "email",
      subject: generated.subject,
      body: generated.body,
      html: generated.html,
      status: "draft",
      follow_up_at: partner.next_follow_up_date || "",
    });
    ensureRecord(entities.PartnerOutreachStep, `outreach_activity_${slug(entityId)}_next`, {
      partner_id: partner.id,
      contact_id: contact.id,
      activity_type: "next_action",
      title: partner.next_action,
      notes: displayCrmValue(pickField(trackerRow, ["Notes"]) || partner.notes),
      status: stage,
      created_at: now(),
      raw_fields: trackerRow,
    });
    imported.push(partner.id);
  });

  templateRows.forEach((template, index) => {
    const templateType = pickField(template, ["Template Type"]) || `Template ${index + 1}`;
    ensureRecord(entities.PartnerOutreachMessage, `outreach_template_${slug(templateType)}_${index + 1}`, {
      channel: "template",
      type: templateType,
      title: templateType,
      subject: pickField(template, ["Use When"]),
      body: pickField(template, ["Message"]),
      status: "template",
      source_type: "partner_outreach_crm",
    });
  });

  return {
    success: true,
    source: workbook.filePath,
    source_type: workbook.sourceType,
    sheets: workbook.sheets.map((sheet) => ({ name: sheet.name, rows: sheet.rows.length, columns: sheet.headers.length })),
    before,
    imported_count: imported.length,
    after: buildOutreachCrmRows(entities).length,
  };
}

function crmExportRows(entities: Database["entities"], ids: string[] = []) {
  const allowedIds = new Set(ids.filter(Boolean));
  return buildOutreachCrmRows(entities)
  .filter((partner: Record<string, any>) => allowedIds.size === 0 || allowedIds.has(partner.id))
  .map((partner: Record<string, any>) => ({
    "Partner ID": partner.external_entity_id || partner.id,
    "Company name": partner.name,
    "Contact name": displayCrmValue(partner.contact?.name || partner.contact?.contact_name),
    "Contact role": displayCrmValue(partner.contact?.role),
    Email: displayCrmValue(partner.contact?.email || partner.contact?.contact_route),
    Phone: displayCrmValue(partner.contact?.phone),
    Website: displayCrmValue(partner.website),
    Address: displayCrmValue(partner.address),
    Type: displayCrmValue(partner.type),
    District: displayCrmValue(partner.district),
    "Lead stage": displayCrmValue(partner.outreach_stage),
    Priority: displayCrmValue(partner.priority || String(partner.priority_score || "")),
    "Suggested perk": displayCrmValue(partner.suggested_perk),
    "Suggested campaign": displayCrmValue(partner.suggested_campaign),
    Message: displayCrmValue(partner.message?.body),
    Notes: displayCrmValue(partner.notes || partner.step?.notes),
    "Last contacted": displayCrmValue(partner.last_contacted),
    "Next follow-up date": displayCrmValue(partner.next_follow_up_date),
  }));
}

function canonicalMatchName(value: any) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(the|hotel|austin|downtown|tx|texas)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isMissingCrmField(value: any) {
  return displayCrmValue(value) === needsVerification;
}

function googleMapsSearchUrl(name: string, address = "") {
  const query = [name, address].filter(Boolean).join(" ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}

function isGeneratedGoogleMapsSearchUrl(value: any) {
  return String(value || "").includes("google.com/maps/search/?api=1");
}

function buildMapEnrichmentCandidates(entities: Database["entities"]) {
  const locations = entities.PartnerLocation.map((location) => {
    const partner = (entities.Partner.find((item) => item.id === location.partner_id) || {}) as Record<string, any>;
    const mapUrl = location.map_entity_id ? `/map?entity=${encodeURIComponent(location.map_entity_id)}` : "";
    return {
      id: location.id,
      name: location.name || partner.business_name || partner.name,
      address: location.address || partner.address || "",
      district: location.district || partner.district || "",
      website: location.website || partner.website || "",
      phone: location.phone || partner.phone || partner.contact_phone || "",
      google_maps_url: location.google_maps_url || partner.google_maps_url || "",
      downtown_perks_map_url: mapUrl,
      map_entity_id: location.map_entity_id || "",
      source_type: location.source_type || partner.source_type || "partner_location",
    };
  });

  const partners = entities.Partner
    .filter((partner) => partner.source_type !== "partner_outreach_crm")
    .map((partner) => ({
      id: partner.id,
      name: partner.business_name || partner.name,
      address: partner.address || "",
      district: partner.district || "",
      website: partner.website || "",
      phone: partner.phone || partner.contact_phone || "",
      google_maps_url: partner.google_maps_url || "",
      downtown_perks_map_url: partner.source_id ? `/map?entity=${encodeURIComponent(partner.source_id)}` : "",
      map_entity_id: partner.source_id || "",
      source_type: partner.source_type || "partner",
    }));

  return [...locations, ...partners].filter((item) => cleanCrmValue(item.name));
}

function scoreMapCandidate(partner: Record<string, any>, candidate: Record<string, any>) {
  const partnerName = canonicalMatchName(partner.name || partner.business_name);
  const candidateName = canonicalMatchName(candidate.name);
  if (!partnerName || !candidateName) return 0;
  let score = 0;
  if (partnerName === candidateName) score += 100;
  else if (partnerName.includes(candidateName) || candidateName.includes(partnerName)) score += Math.min(partnerName.length, candidateName.length) > 5 ? 78 : 38;

  const partnerAddress = canonicalMatchName(partner.address);
  const candidateAddress = canonicalMatchName(candidate.address);
  if (partnerAddress && candidateAddress) {
    if (partnerAddress === candidateAddress) score += 35;
    else if (partnerAddress.includes(candidateAddress) || candidateAddress.includes(partnerAddress)) score += 18;
  }

  const partnerDistrict = canonicalMatchName(partner.district);
  const candidateDistrict = canonicalMatchName(candidate.district);
  if (partnerDistrict && candidateDistrict && partnerDistrict === candidateDistrict) score += 10;
  if (candidate.website) score += 5;
  if (candidate.phone) score += 5;
  if (candidate.google_maps_url) score += 5;
  return score;
}

async function fetchGooglePlacesVerification(partner: Record<string, any>) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  const textQuery = [partner.name || partner.business_name, partner.address, partner.district, "Austin TX"].filter(Boolean).join(" ");
  if (!textQuery.trim()) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  let response: Response;
  try {
    response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.location",
      },
      body: JSON.stringify({ textQuery, maxResultCount: 1 }),
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    return {
      source_type: "google_places_api_error",
      error_status: response.status,
      error_text: response.statusText,
      error_detail: errorPayload?.error?.message || "",
    };
  }
  const payload = await response.json();
  const place = payload?.places?.[0];
  if (!place) {
    return {
      source_type: "google_places_api_no_match",
    };
  }
  return {
    name: place.displayName?.text || "",
    address: place.formattedAddress || "",
    phone: place.nationalPhoneNumber || "",
    website: place.websiteUri || "",
    google_maps_url: place.googleMapsUri || "",
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    source_type: "google_places_api",
    place_id: place.id,
  };
}

async function enrichOutreachCrmFromMapSources(entities: Database["entities"], options: Record<string, any> = {}) {
  const candidates = buildMapEnrichmentCandidates(entities);
  const updated: Array<Record<string, any>> = [];
  const skipped: Array<Record<string, any>> = [];
  const googleDiagnostics: Array<Record<string, any>> = [];
  const googleEnabled = Boolean(options.google_places && (process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY));

  for (const partner of entities.Partner.filter((item) => item.source_type === "partner_outreach_crm")) {
    const ranked = candidates
      .map((candidate) => ({ candidate, score: scoreMapCandidate(partner, candidate) }))
      .filter((item) => item.score >= 82)
      .sort((a, b) => b.score - a.score);
    const best = ranked[0]?.candidate || null;
    let google: Record<string, any> | null = null;
    if (googleEnabled) {
      try {
        const googleResult = await fetchGooglePlacesVerification(partner);
        if (googleResult?.source_type === "google_places_api") {
          google = googleResult;
        } else if (googleResult?.source_type) {
          googleDiagnostics.push({
            id: partner.id,
            name: partner.name || partner.business_name,
            reason: googleResult.source_type,
            status: googleResult.error_status || "",
            status_text: googleResult.error_text || "",
            detail: googleResult.error_detail || "",
          });
        }
      } catch (error) {
        googleDiagnostics.push({
          id: partner.id,
          name: partner.name || partner.business_name,
          reason: error instanceof Error && error.name === "AbortError" ? "google_places_timeout" : "google_places_request_failed",
        });
        google = null;
      }
    }

    const sources = [google, best].filter(Boolean) as Record<string, any>[];
    if (!sources.length) {
      skipped.push({ id: partner.id, name: partner.name || partner.business_name, reason: "no_confident_match" });
      continue;
    }

    const changes: Record<string, any> = {};
    const source = sources[0];
    const fallback = sources[1] || {};
    const candidateSource = source.source_type || fallback.source_type || "downtown_perks_map";
    const fill = (field: string, value: any, options: { allowUpgrade?: boolean } = {}) => {
      const cleaned = cleanCrmValue(value);
      if (!cleaned) return;
      if (isMissingCrmField(partner[field]) || options.allowUpgrade) changes[field] = cleaned;
    };

    fill("address", source.address || fallback.address);
    fill("district", source.district || fallback.district);
    fill("website", source.website || fallback.website);
    fill("phone", source.phone || fallback.phone);
    fill("google_maps_url", source.google_maps_url || fallback.google_maps_url, {
      allowUpgrade: source.source_type === "google_places_api" && isGeneratedGoogleMapsSearchUrl(partner.google_maps_url),
    });
    if (isMissingCrmField(partner.google_maps_url) && !changes.google_maps_url && (partner.address || source.address || fallback.address)) {
      changes.google_maps_url = googleMapsSearchUrl(partner.name || partner.business_name, partner.address || source.address || fallback.address);
    }
    if ((source.downtown_perks_map_url || fallback.downtown_perks_map_url) && !partner.downtown_perks_map_url) {
      changes.downtown_perks_map_url = source.downtown_perks_map_url || fallback.downtown_perks_map_url;
    }
    if ((source.map_entity_id || fallback.map_entity_id) && !partner.map_entity_id) {
      changes.map_entity_id = source.map_entity_id || fallback.map_entity_id;
    }

    if (!Object.keys(changes).length) {
      skipped.push({ id: partner.id, name: partner.name || partner.business_name, reason: "matched_but_no_missing_fields", source: candidateSource });
      continue;
    }

    Object.assign(partner, changes, {
      verification_status: "Partially verified",
      verification_source: candidateSource,
      updated_at: now(),
    });
    logOutreachActivity(entities, {
      partner_id: partner.id,
      contact_id: entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id)?.id || "",
      activity_type: "data_enriched",
      title: "Verification fields enriched",
      notes: `Updated ${Object.keys(changes).join(", ")} from ${candidateSource}.`,
      status: partner.outreach_stage || partner.status || "Not started",
      metadata: { changes, source: candidateSource, match_score: ranked[0]?.score || null },
    });
    updated.push({ id: partner.id, name: partner.name || partner.business_name, changes, source: candidateSource, match_score: ranked[0]?.score || null });
  }

  return {
    success: true,
    google_places_enabled: googleEnabled,
    google_places_configured: Boolean(process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY),
    google_places_diagnostics: {
      checked_count: googleDiagnostics.length,
      error_count: googleDiagnostics.filter((item) => item.reason === "google_places_api_error").length,
      no_match_count: googleDiagnostics.filter((item) => item.reason === "google_places_api_no_match").length,
      timeout_count: googleDiagnostics.filter((item) => item.reason === "google_places_timeout").length,
      failed_count: googleDiagnostics.filter((item) => item.reason === "google_places_request_failed").length,
      samples: googleDiagnostics.slice(0, 8),
    },
    candidates: candidates.length,
    updated_count: updated.length,
    skipped_count: skipped.length,
    updated,
    skipped: skipped.slice(0, 40),
  };
}

function splitList(value: any) {
  return String(value || "")
    .split(/[;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumberOrNull(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLocationDeck(content: string) {
  const match = content.match(/downtownPerksLocationDeck\s*=\s*(\[[\s\S]*?\])\s*(?:as\s+const)?\s*;/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

function parseExportedArray(content: string, exportName: string) {
  const match = content.match(new RegExp(`(?:export\\s+)?const\\s+${exportName}\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;`));
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

function parseAmount(value: any) {
  const numeric = Number(String(value || "0").replace(/[^0-9.]+/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizePromotionCode(value: any) {
  return String(value || "").trim().toUpperCase();
}

function addOneYearIso(date = new Date()) {
  const renewal = new Date(date);
  renewal.setFullYear(renewal.getFullYear() + 1);
  return renewal.toISOString();
}

function getPromotionStatus(promotion: Record<string, any>, at = new Date()) {
  if (!promotion) return { active: false, reason: "Promotion not found." };
  if (promotion.deleted_at) return { active: false, reason: "Promotion has been archived." };
  if (promotion.status && !["active", "scheduled"].includes(String(promotion.status).toLowerCase())) return { active: false, reason: "Promotion is not active." };
  if (promotion.isActive === false || promotion.is_active === false) return { active: false, reason: "Promotion is disabled." };
  if (promotion.startsAt || promotion.starts_at) {
    const startsAt = new Date(promotion.startsAt || promotion.starts_at);
    if (Number.isFinite(startsAt.getTime()) && startsAt > at) return { active: false, reason: "Promotion has not started yet." };
  }
  if (promotion.expiresAt || promotion.expires_at) {
    const expiresAt = new Date(promotion.expiresAt || promotion.expires_at);
    if (Number.isFinite(expiresAt.getTime()) && expiresAt < at) return { active: false, reason: "Promotion has expired." };
  }
  if (promotion.maxUses && Number(promotion.currentUses || promotion.current_uses || 0) >= Number(promotion.maxUses)) return { active: false, reason: "Promotion usage limit reached." };
  return { active: true, reason: "" };
}

function calculatePromotionDiscount(promotion: Record<string, any>, subtotal: number) {
  const discountType = String(promotion.discountType || promotion.discount_type || "percentage").toLowerCase();
  if (discountType === "fixed" || discountType === "fixed_amount") {
    return Math.min(subtotal, Number(promotion.fixedAmount || promotion.fixed_amount || 0));
  }
  return Math.min(subtotal, Math.round(subtotal * (Number(promotion.percentage || 0) / 100) * 100) / 100);
}

function validatePromotion(entities: Database["entities"], input: Record<string, any>) {
  const code = normalizePromotionCode(input.code || input.coupon || input.promotion_code);
  const promotion = entities.Promotion.find((item) => normalizePromotionCode(item.code) === code);
  const subtotal = Number(input.subtotal || input.amount || input.total || 0);
  const plan = String(input.plan || input.plan_key || input.planId || input.plan_id || "").toLowerCase();
  const partnerType = String(input.partner_type || input.partnerType || "").toLowerCase();
  const status = getPromotionStatus(promotion);

  if (!code) return { success: false, valid: false, code, promotion: null, reason: "Promotion code is required.", subtotal, discount: 0, total: subtotal };
  if (!promotion) return { success: false, valid: false, code, promotion: null, reason: "Promotion code was not found.", subtotal, discount: 0, total: subtotal };
  if (!status.active) return { success: false, valid: false, code, promotion, reason: status.reason, subtotal, discount: 0, total: subtotal };

  const applicablePlans = Array.isArray(promotion.applicablePlans) ? promotion.applicablePlans : Array.isArray(promotion.applicable_plans) ? promotion.applicable_plans : [];
  const applicablePartnerTypes = Array.isArray(promotion.applicablePartnerTypes) ? promotion.applicablePartnerTypes : Array.isArray(promotion.applicable_partner_types) ? promotion.applicable_partner_types : [];
  if (applicablePlans.length && !applicablePlans.map((item: any) => String(item).toLowerCase()).includes("all") && plan && !applicablePlans.map((item: any) => String(item).toLowerCase()).includes(plan)) {
    return { success: false, valid: false, code, promotion, reason: "Promotion does not apply to the selected plan.", subtotal, discount: 0, total: subtotal };
  }
  if (applicablePartnerTypes.length && !applicablePartnerTypes.map((item: any) => String(item).toLowerCase()).includes("all") && partnerType && !applicablePartnerTypes.map((item: any) => String(item).toLowerCase()).includes(partnerType)) {
    return { success: false, valid: false, code, promotion, reason: "Promotion does not apply to this partner type.", subtotal, discount: 0, total: subtotal };
  }

  const discount = calculatePromotionDiscount(promotion, subtotal);
  const total = Math.max(0, subtotal - discount);
  return {
    success: true,
    valid: true,
    code,
    promotion,
    promotion_id: promotion.id,
    discount,
    subtotal,
    total,
    duration: promotion.duration || "oneTime",
    message: total === 0 ? "Your first year is complimentary. No payment is required today." : "Promotion applied.",
  };
}

function redeemPromotion(entities: Database["entities"], input: Record<string, any>) {
  const validation = validatePromotion(entities, input);
  if (!validation.valid || !validation.promotion) return { validation, redemption: null };
  validation.promotion.currentUses = Number(validation.promotion.currentUses || validation.promotion.current_uses || 0) + 1;
  validation.promotion.current_uses = validation.promotion.currentUses;
  validation.promotion.updated_at = now();
  const redemption = withTimestamps(
    {
      promotion_id: validation.promotion.id,
      code: validation.code,
      organization_id: input.organization_id || input.tenant_id || "",
      tenant_id: input.tenant_id || input.organization_id || "",
      workspace_id: input.workspace_id || "",
      partner_id: input.partner_id || "",
      registration_id: input.registration_id || "",
      checkout_session_id: input.checkout_session_id || "",
      subscription_id: input.subscription_id || "",
      plan: input.plan || input.plan_key || "",
      partner_type: input.partner_type || input.partnerType || "",
      subtotal: validation.subtotal,
      discount: validation.discount,
      total: validation.total,
      status: "redeemed",
      redeemed_at: now(),
      metadata: input.metadata || {},
    },
    makeId("promotion_redemption")
  );
  entities.PromotionRedemption.push(redemption);
  return { validation, redemption };
}

function normalizeProductName(name: string) {
  return String(name || "").trim();
}

function normalizeProductSlug(name: string) {
  return slug(normalizeProductName(name)).replace(/_/g, "-");
}

function productDisplayName(name: string) {
  const cleaned = normalizeProductName(name);
  if (!cleaned.includes("/")) return cleaned;
  return cleaned.split("/").filter(Boolean).at(-1) || cleaned;
}

function productLookupKey(value: any) {
  return normalizeProductSlug(String(value || "").replace(/subscription$/i, "").replace(/\s+add\s+on$/i, ""));
}

function paymentLinkForProduct(productName: string, linksByName: Map<string, Record<string, any>>) {
  const candidates = [
    productName,
    productDisplayName(productName),
    productName.replace(/^AddOn\//, "").replace(/^Tier\//, ""),
    productName.replace(/^Hospitality /, "Hotel "),
    productName.replace(/^Hotel /, "Hospitality "),
  ];
  for (const candidate of candidates) {
    const match = linksByName.get(productLookupKey(candidate));
    if (match) return match;
  }
  return null;
}

async function importPricingCatalog(entities: Database["entities"]) {
  const products = await readCsvIfExists(pricingImportSources.productsCsv);
  const prices = await readCsvIfExists(pricingImportSources.pricesCsv);
  const paymentLinks = await readCsvIfExists(pricingImportSources.paymentLinksCsv);
  const pricesByProduct = new Map<string, Record<string, any>[]>();
  prices.forEach((price) => {
    const productId = price["Product ID"];
    if (!pricesByProduct.has(productId)) pricesByProduct.set(productId, []);
    pricesByProduct.get(productId)?.push(price);
  });
  const linksByName = new Map<string, Record<string, any>>();
  paymentLinks
    .filter((link) => String(link.Active || "").toLowerCase() !== "false" && link.Name && link.Url)
    .forEach((link) => {
      const key = productLookupKey(link.Name);
      if (!linksByName.has(key)) linksByName.set(key, link);
    });

  let imported = 0;
  products.forEach((product) => {
    const productId = product.id;
    const productName = normalizeProductName(product.Name);
    if (!productId || !productName) return;
    const matchingPrices = pricesByProduct.get(productId) || [];
    const primaryPrice = matchingPrices[0] || {};
    const amount = parseAmount(primaryPrice.Amount);
    const interval = primaryPrice.Interval || "one_time";
    const family = product["family (metadata)"] || productName.split("/")[1] || "Core";
    const kind = product["kind (metadata)"] || (productName.startsWith("Tier/") ? "tier" : productName.startsWith("AddOn/") ? "addon" : "product");
    const partnerType = product["partnerType (metadata)"] || productName.split("/")[1] || "";
    const paymentLink = paymentLinkForProduct(productName, linksByName);
    ensureRecord(entities.ProductOffering, `product_${normalizeProductSlug(productId)}`, {
      product_id: productId,
      stripe_product_id: productId,
      stripe_price_id: primaryPrice["Price ID"] || "",
      stripe_payment_link_id: paymentLink?.id || "",
      stripe_payment_link_url: paymentLink?.Url || "",
      name: productName,
      display_name: productDisplayName(productName),
      description: product.Description || primaryPrice.Description || "",
      family,
      kind,
      tier_id: product["tierId (metadata)"] || "",
      partner_type: partnerType,
      amount,
      currency: (primaryPrice.Currency || "usd").toLowerCase(),
      interval,
      interval_count: primaryPrice["Interval Count"] || "",
      billing_scheme: primaryPrice["Billing Scheme"] || "",
      tax_behavior: primaryPrice["Tax Behavior"] || "",
      prices: matchingPrices.map((price) => ({
        stripe_price_id: price["Price ID"],
        amount: parseAmount(price.Amount),
        currency: (price.Currency || "usd").toLowerCase(),
        interval: price.Interval || "one_time",
        interval_count: price["Interval Count"] || "",
      })),
      source_type: "stripe_pricing_csv",
      source_files: pricingImportSources,
      status: "active",
    });
    imported += 1;
  });

  return { products: products.length, prices: prices.length, payment_links: paymentLinks.length, imported };
}

const checkoutPlanAliases: Record<string, string> = {
  property_basic: "Property Basic Subscription",
  property_basic_building: "Property Basic Subscription",
  property_resident_plus: "Property Plus Subscription",
  property_plus: "Property Plus Subscription",
  property_pro: "Property Pro Subscription",
  venue_basic: "Venue Basic Subscription",
  venue_growth: "Venue Growth Subscription",
  venue_pro: "Venue Pro Subscription",
  hotel_starter: "Hospitality Starter",
  hotel_basic: "Hospitality Starter",
  hotel_pro: "Hospitality Pro",
  hospitality_basic: "Hospitality Starter",
  hospitality_pro: "Hospitality Pro",
  brand_access: "Brand Basic Subscription",
  brand_basic: "Brand Basic Subscription",
  brand_campaigns: "Brand Pro Subscription",
  brand_pro: "Brand Pro Subscription",
  civic_basic: "Civic Basic Subscription",
  civic_plus: "Civic Plus Subscription",
  civic_pro: "Civic Pro Subscription",
  perk_campaign: "Perk Campaign",
  featured_campaign: "Featured Campaign",
  sponsored_campaign: "Sponsored Campaign",
  event_boost: "Event Boost",
  featured_event: "Featured Event",
  sponsored_event: "Sponsored Event",
  single_survey: "Single Survey",
  survey_series: "Survey Series",
  custom_research_survey: "Custom Research Project",
  analytics_plus: "Analytics Plus Add On",
  analytics_pro: "Analytics Pro Add On",
  broadcast_5m: "Nearby Broadcast (5-min walk)",
  sms_500: "SMS Broadcast (up to 500)",
};

function productMatchesValue(product: Record<string, any>, value: any) {
  const key = productLookupKey(value);
  if (!key) return false;
  const fields = [
    product.id,
    product.product_id,
    product.stripe_product_id,
    product.stripe_price_id,
    product.stripe_payment_link_id,
    product.tier_id,
    product.name,
    product.display_name,
    checkoutPlanAliases[String(value || "").trim().toLowerCase()],
  ];
  return fields.some((field) => productLookupKey(field) === key);
}

function findCatalogProduct(entities: Database["entities"], source: Record<string, any>) {
  const values = [
    source.price,
    source.stripe_price_id,
    source.product,
    source.product_id,
    source.plan_key,
    source.key,
    source.name,
    source.display_name,
    source.label,
  ].filter(Boolean);
  const aliasValues = values.map((value) => checkoutPlanAliases[String(value).trim().toLowerCase()]).filter(Boolean);
  const searchValues = [...values, ...aliasValues];
  return entities.ProductOffering.find((product) => searchValues.some((value) => productMatchesValue(product, value)));
}

function ensureMapPartnerWorkspace(entities: Database["entities"], source: Record<string, any>) {
  const name = source.name || source.entity_name || source.property_name;
  if (!name) return null;

  const mapEntityId = source.map_entity_id || source.pin_id || source.id || `map_${slug(name)}`;
  const type = normalizeMapEntityType(source);
  const category = source.category || source.partner_type || type;
  const partnerSlug = slug(name).replace(/_/g, "-");
  const partnerId = `partner_${partnerSlug}`;
  const tenant = provisionPlatformTenant(entities, {
    name,
    type,
    category,
    address: source.address,
    status: source.status || "active",
    source_type: source.source_type || "map_import",
    source_id: mapEntityId,
    map_entity_id: mapEntityId,
    partner_id: partnerId,
    perk: source.perk || source.offer || undefined,
  });

  if (!tenant) return null;

  const workspaceId = `workspace_${tenant.slug}`;
  const partner = ensureRecord(entities.Partner, partnerId, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    business_name: name,
    contact_person: source.contact_person || "Workspace owner",
    contact_email: source.contact_email || `${tenant.slug}@downtownperks.local`,
    contact_phone: source.contact_phone || "",
    address: source.address || "",
    category,
    partner_type: type,
    status: "active",
    onboarding_stage: "workspace_created",
    source_type: source.source_type || "map_import",
    source_id: mapEntityId,
  });

  ensureRecord(entities.PartnerProfile, `profile_${tenant.slug}`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    display_name: name,
    type,
    category,
    address: source.address || "",
    district: source.district || "",
    status: "active",
    panel_eyebrow: source.panel_eyebrow || "",
    panel_title: source.panel_title || name,
    panel_summary: source.panel_summary || source.description || "",
    primary_cta: source.primary_cta || "View details",
    secondary_cta: source.secondary_cta || "Directions",
    panel_sections: splitList(source.panel_sections),
    image_status: source.image_status || "",
    data_quality_notes: source.data_quality_notes || "",
    source_status: source.source_status || "",
  });

  const lat = toNumberOrNull(source.latitude || source.lat);
  const lng = toNumberOrNull(source.longitude || source.lng);
  ensureRecord(entities.PartnerLocation, `location_${tenant.slug}_${slug(mapEntityId)}`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    map_entity_id: mapEntityId,
    name: source.property_name || name,
    address: source.address || "",
    district: source.district || "",
    latitude: lat,
    longitude: lng,
    category,
    partner_type: type,
    status: "active",
    map_presence: "enabled",
    source_type: source.source_type || "map_import",
  });

  ensureRecord(entities.MapEntityLink, `map_link_${mapEntityId}`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    entity_id: mapEntityId,
    entity_type: source.entity_type || type,
    source_type: source.source_type || "map_import",
    source_status: source.source_status || "imported",
    status: "linked",
  });

  ensureRecord(entities.Campaign, `campaign_${tenant.slug}_map_visibility`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    title: `${name} map visibility`,
    description: source.panel_summary || `Map visibility campaign generated from imported Downtown Perks map data for ${name}.`,
    type: source.entity_type === "district" ? "district_visibility" : "map_visibility",
    status: source.source_status?.includes("visible") ? "active" : "draft",
    related_entity_id: mapEntityId,
    primary_cta: source.primary_cta || "View details",
    secondary_cta: source.secondary_cta || "Directions",
    created_from: source.source_type || "map_import",
  });

  ensureRecord(entities.PartnerAiContext, `ai_context_${tenant.slug}`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    assistant_name: "Downtown Assistant",
    status: "active",
    context_summary: `${name} is connected to the Downtown Perks map as a ${category} partner in ${source.district || "Downtown Austin"}.`,
    suggested_actions: ["Review map profile", "Confirm campaign visibility", "Add offer or event", "Review imported reporting"],
    source_type: source.source_type || "map_import",
  });

  ensureRecord(entities.PartnerQrExperience, `qr_${tenant.slug}_map`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    label: `${name} map QR`,
    destination_url: `/map?entity=${encodeURIComponent(mapEntityId)}`,
    status: "active",
    scans: 0,
    source_type: source.source_type || "map_import",
  });

  ensureRecord(entities.TenantAuditLog, `audit_${tenant.slug}_${slug(mapEntityId)}_map_import`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    actor_id: "system",
    action: "map_entity_imported",
    resource: "map_entity",
    before: null,
    after: { map_entity_id: mapEntityId, name, type, category },
    timestamp: now(),
  });

  return { tenant, partner };
}

async function importDowntownPerksMapData(entities: Database["entities"]) {
  const sourceStatus = await getMapImportSourceStatus();
  const pinRows = await readCsvIfExists(mapImportSources.pinDetailsCsv);
  const legendsRows = await readCsvIfExists(mapImportSources.legendsCsv);
  const currentMapRows = parseCsv(
    await readZipEntryIfExists(mapImportSources.locationsZip, "LOCATIONS/downtown_perks_current_map_check_188.csv") ||
      (await readZipEntryIfExists(mapImportSources.locations2Zip, "LOCATIONS/downtown_perks_current_map_check_188.csv"))
  );
  const legendsAuditRows = parseCsv(
    (await readZipEntryIfExists(mapImportSources.legendsListingsZip, "LEGENDS LISTINGS/map_entity_icon_image_audit.csv")) ||
      (await readZipEntryIfExists(mapImportSources.legendsListings2Zip, "LEGENDS LISTINGS/map_entity_icon_image_audit.csv"))
  );
  const locationDeckRows = parseLocationDeck(await readZipEntryIfExists(mapImportSources.locationCopyDeckZip, "LOCATION DATA & COPY DECK/downtownPerksLocationDeck.ts"));
  const before = {
    tenants: entities.PlatformTenant.length,
    workspaces: entities.TenantWorkspace.length,
    partners: entities.Partner.length,
    locations: entities.PartnerLocation.length,
    campaigns: entities.Campaign.length,
    mapLinks: entities.MapEntityLink.length,
  };

  const imported: Array<Record<string, any>> = [];
  const skipped: Array<Record<string, any>> = [];

  pinRows.forEach((row) => {
    const name = row.entity_name || row.panel_title || row.visible_label;
    if (!name) {
      skipped.push({ source: "pin_details", reason: "missing_name", row });
      return;
    }
    const result = ensureMapPartnerWorkspace(entities, {
      ...row,
      name,
      source_type: "downtown_perks_pin_details",
      map_entity_id: row.pin_id || `pin_${slug(name)}`,
      status: "active",
    });
    if (result) imported.push({ source: "pin_details", name, tenant_id: result.tenant.id });
  });

  legendsRows.forEach((row) => {
    const name = row.brand || row.property_name || "Legends Property";
    const result = ensureMapPartnerWorkspace(entities, {
      ...row,
      name,
      type: "real_estate",
      partner_type: "Real Estate",
      category: row.category || "Residential",
      source_type: "legends_property_extraction",
      map_entity_id: `legends_${slug(row.property_name || name)}`,
      status: "active",
      panel_summary: `Connect ${row.property_name || name} to neighborhood context, resident discovery, listings, and Downtown Perks reporting.`,
      primary_cta: row.cta_primary || "Details",
      secondary_cta: row.cta_secondary || "Save",
      panel_sections: "Listings; Neighborhood; Perks; Contact",
    });
    if (result) {
      ensureRecord(entities.PartnerLocation, `location_${result.tenant.slug}_${slug(row.property_name || "property")}`, {
        tenant_id: result.tenant.id,
        workspace_id: `workspace_${result.tenant.slug}`,
        partner_id: result.partner.id,
        map_entity_id: `legends_${slug(row.property_name || name)}`,
        name: row.property_name || name,
        address: row.address || "",
        category: row.category || "Residential",
        listings: Number(row.listings || 0),
        price_range: row.price_range || "",
        status: "active",
        map_presence: "enabled",
        source_type: "legends_property_extraction",
      });
      imported.push({ source: "legends_property", name: row.property_name || name, tenant_id: result.tenant.id });
    }
  });

  currentMapRows.forEach((row) => {
    const name = row.current_map_name || row.resident_card_title || row.dp_id;
    if (!name) {
      skipped.push({ source: "current_map_check", reason: "missing_name", row });
      return;
    }
    const result = ensureMapPartnerWorkspace(entities, {
      name,
      entity_type: row.pin_type || row.dp_category,
      partner_type: row.dp_category,
      category: row.google_type || row.dp_category,
      district: row.dp_district,
      source_type: "current_map_check_188",
      map_entity_id: row.dp_id || `map_${slug(name)}`,
      source_status: row.map_status,
      panel_eyebrow: row.dp_category,
      panel_title: row.resident_card_title || name,
      panel_summary: row.resident_short_description || row.why_people_go || "",
      primary_cta: row.resident_cta || "View details",
      secondary_cta: "Directions",
      panel_sections: "Nearby; Perks; Events; Reporting",
      perk: row.recommended_perk,
      data_quality_notes: row.qa_notes,
      status: row.map_status?.toLowerCase().includes("keep") ? "active" : "draft",
    });
    if (result) {
      ensureRecord(entities.PartnerAnalytics, `analytics_${result.tenant.slug}`, {
        tenant_id: result.tenant.id,
        workspace_id: `workspace_${result.tenant.slug}`,
        google_rating: toNumberOrNull(row.google_rating),
        priority: row.priority || "",
        views: 0,
        saves: 0,
        directions: 0,
        redemptions: 0,
        status: "tracking_enabled",
      });
      imported.push({ source: "current_map_check", name, tenant_id: result.tenant.id });
    }
  });

  legendsAuditRows.forEach((row) => {
    const name = row.name || row.id;
    if (!name) {
      skipped.push({ source: "legends_image_audit", reason: "missing_name", row });
      return;
    }
    const result = ensureMapPartnerWorkspace(entities, {
      name,
      entity_type: row.type,
      partner_type: row.partnerType || "venue",
      category: row.category,
      district: row.district,
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address,
      source_type: "legends_image_audit",
      map_entity_id: row.id || `audit_${slug(name)}`,
      source_status: row.pinStatus,
      panel_eyebrow: row.category,
      panel_title: name,
      panel_summary: row.recommendedPanelCopy || "",
      primary_cta: "View details",
      secondary_cta: "Directions",
      image_status: row.imageStatus,
      data_quality_notes: row.sourceNotes || row.imageNotes,
      status: row.pinStatus === "OK" ? "active" : "draft",
    });
    if (result) imported.push({ source: "legends_image_audit", name, tenant_id: result.tenant.id });
  });

  locationDeckRows.forEach((row: any) => {
    const name = row.name || row.pinLabel || row.id;
    if (!name) {
      skipped.push({ source: "location_copy_deck", reason: "missing_name", row });
      return;
    }
    const result = ensureMapPartnerWorkspace(entities, {
      name,
      entity_type: row.type,
      partner_type: row.type,
      category: row.categoryLabel || row.category,
      latitude: row.lat,
      longitude: row.lng,
      source_type: "location_copy_deck",
      map_entity_id: row.id || `deck_${slug(name)}`,
      source_status: row.status,
      panel_eyebrow: row.panelEyebrow || row.categoryLabel,
      panel_title: row.panelHeadline || name,
      panel_summary: row.panelBody || "",
      primary_cta: row.primaryCta || "View details",
      secondary_cta: row.secondaryCta || "Save",
      panel_sections: "Nearby; Perks; Events; Reporting",
      perk: row.perksCardLine,
      data_quality_notes: row.importNote,
      status: row.status || "active",
    });
    if (result) imported.push({ source: "location_copy_deck", name, tenant_id: result.tenant.id });
  });

  const openApiEntities = sourceStatus.openApiSpec.exists
    ? { source: "Downtown Perks OpenAPI", status: "available_for_contract_validation" }
    : { source: "Downtown Perks OpenAPI", status: "missing" };

  const googleMapAssets = sourceStatus.googleMapZip.exists
    ? { source: "GOOGLE MAP 2.zip", status: "available_for_asset_mapping", note: "Zip retained as source reference; CSV rows drive backend entity provisioning." }
    : { source: "GOOGLE MAP 2.zip", status: "missing" };

  const attachedArchives = Object.entries(sourceStatus)
    .filter(([key]) => key.endsWith("Zip"))
    .map(([key, value]) => ({ source: key, ...(value as any) }));

  const after = {
    tenants: entities.PlatformTenant.length,
    workspaces: entities.TenantWorkspace.length,
    partners: entities.Partner.length,
    locations: entities.PartnerLocation.length,
    campaigns: entities.Campaign.length,
    mapLinks: entities.MapEntityLink.length,
  };

  return {
    success: true,
    sources: sourceStatus,
    imported_count: imported.length,
    skipped_count: skipped.length,
    imported,
    skipped,
    source_references: [openApiEntities, googleMapAssets, ...attachedArchives],
    before,
    after,
  };
}

async function importPartnerIntelligenceData(entities: Database["entities"]) {
  const sourceStatus = await getMapImportSourceStatus();
  const activationContent = await readZipEntryIfExists(mapImportSources.intelligenceZip, "src/data/partnerActivations.ts");
  const activations = parseExportedArray(activationContent, "partnerActivations");
  const imported: Array<Record<string, any>> = [];
  const skipped: Array<Record<string, any>> = [];

  activations.forEach((activation: any) => {
    const name = activation.name;
    if (!name || !activation.lat || !activation.lng) {
      skipped.push({ source: "partnerActivations", reason: "missing_name_or_coordinates", id: activation.id || "" });
      return;
    }
    const result = ensureMapPartnerWorkspace(entities, {
      name,
      entity_type: activation.type || "venue",
      partner_type: activation.type || "venue",
      category: activation.popularity || activation.type || "Partner",
      district: activation.neighborhood || "",
      latitude: activation.lat,
      longitude: activation.lng,
      source_type: "downtown_perks_intelligence_partner_activations",
      map_entity_id: activation.id || `intelligence_${slug(name)}`,
      source_status: activation.status || "LIVE",
      panel_eyebrow: activation.type || "Partner",
      panel_title: activation.resident?.headline || name,
      panel_summary: activation.resident?.description || activation.intelligence?.local?.context || "",
      primary_cta: activation.resident?.primaryAction || "View details",
      secondary_cta: activation.resident?.secondaryAction || "Save details",
      panel_sections: "Overview; Perks; Intelligence; Campaigns; Reports",
      perk: activation.offer,
      status: String(activation.status || "").toLowerCase() === "live" ? "active" : "draft",
    });
    if (!result) {
      skipped.push({ source: "partnerActivations", reason: "provision_failed", id: activation.id || name });
      return;
    }

    const tenantSlug = result.tenant.slug;
    const tenantId = result.tenant.id;
    const workspaceId = `workspace_${tenantSlug}`;
    const partner = result.partner;
    const intelligence = activation.intelligence || {};
    const analytics = intelligence.analytics || {};
    const local = intelligence.local || {};

    ensureRecord(entities.PartnerAnalytics, `analytics_${tenantSlug}`, {
      tenant_id: tenantId,
      workspace_id: workspaceId,
      partner_id: partner.id,
      views: Number(local.reach || 0),
      saves: Number(local.impact || 0),
      directions: Number(local.yield || 0),
      scans: Number(local.yield || 0),
      redemptions: Number(local.impact || 0),
      resident_index: analytics.resident_index || "",
      resident_index_delta: analytics.resident_index_delta || "",
      churn_signal: analytics.churn_signal || "",
      churn_trend: analytics.churn_trend || "",
      audience: analytics.audience || [],
      engagement_velocity: analytics.engagement_velocity || [],
      pulse: local.pulse || "",
      activity: local.activity || activation.liveActivity || "",
      context: local.context || "",
      competitor_overlap: local.competitor_overlap || "",
      dwell_time: local.dwell_time || "",
      status: "tracking_enabled",
      source_type: "downtown_perks_intelligence_partner_activations",
    });

    if (activation.offer) {
      ensureRecord(entities.PerkLocation, `perk_${tenantSlug}_activation`, {
        tenant_id: tenantId,
        workspace_id: workspaceId,
        partner_id: partner.id,
        name,
        title: activation.offer,
        description: activation.resident?.description || "",
        category: activation.type || "Partner",
        district: activation.neighborhood || "",
        lat: activation.lat,
        lng: activation.lng,
        perk: activation.offer,
        perk_type: activation.redemptionMethod || "Digital Scan",
        redemption_type: activation.redemptionMethod || "Digital Scan",
        eligibility_rules: activation.eligibility || "",
        timing: activation.timing || "",
        active: String(activation.status || "").toLowerCase() === "live",
        is_active: String(activation.status || "").toLowerCase() === "live",
        status: String(activation.status || "").toLowerCase() === "live" ? "active" : "draft",
        redemption_count: Number(local.impact || 0),
        source_type: "downtown_perks_intelligence_partner_activations",
      });
    }

    ensureRecord(entities.Campaign, `campaign_${tenantSlug}_intelligence`, {
      tenant_id: tenantId,
      workspace_id: workspaceId,
      partner_id: partner.id,
      title: `${name} intelligence campaign`,
      description: intelligence.advice?.strategic || local.context || `Partner intelligence campaign for ${name}.`,
      type: "partner_intelligence",
      status: String(activation.status || "").toLowerCase() === "live" ? "active" : "draft",
      audience: analytics.audience || [],
      goals: analytics.goals || [],
      target_bookings: analytics.target_bookings || "",
      reach_goal: analytics.reach_goal || "",
      tactical_advice: intelligence.advice?.tactical || "",
      related_entity_id: activation.id || `intelligence_${slug(name)}`,
      created_from: "downtown_perks_intelligence_partner_activations",
    });

    ensureRecord(entities.AiInsight, `ai_insight_${tenantSlug}_partner_intelligence`, {
      tenant_id: tenantId,
      workspace_id: workspaceId,
      partner_id: partner.id,
      source: "downtown_perks_intelligence_partner_activations",
      insight_type: "partner_intelligence",
      title: `${name} partner intelligence`,
      summary: intelligence.advice?.strategic || local.context || analytics.mission || "",
      recommended_action: intelligence.advice?.tactical || "Review campaign timing, offer performance, and resident audience overlap.",
      status: "open",
      context: activation,
    });

    imported.push({ id: activation.id || name, name, tenant_id: tenantId, partner_id: partner.id });
  });

  ensureRecord(entities.AiInsight, "ai_insight_agentic_modules_imported", {
    source: "downtown_perks_intelligence_zip",
    insight_type: "agentic_module_inventory",
    title: "Agentic map and partner intelligence modules imported",
    summary: "The older intelligence build provided agent prompt bars, suggestion cards, map search overlays, campaign builder overlays, partner scanners, resident profiles, relationship engine, live activity reads, and agent recommendation hooks. The current 3014 platform imports their operational data and records the module inventory without copying old UI.",
    recommended_action: "Keep current 3014 UI, use the imported partner intelligence records to power AI recommendations, campaign suggestions, reporting, and map entity context.",
    status: "open",
    source_files: {
      intelligenceZip: mapImportSources.intelligenceZip,
      updatedHarmonyZip: mapImportSources.updatedHarmonyZip,
    },
  });

  return {
    success: true,
    source: mapImportSources.intelligenceZip,
    source_status: sourceStatus.intelligenceZip,
    imported_count: imported.length,
    skipped_count: skipped.length,
    imported,
    skipped,
  };
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

const workspaceModules = [
  "overview",
  "profile",
  "locations",
  "map",
  "perks",
  "events",
  "campaigns",
  "qr",
  "messages",
  "surveys",
  "reports",
  "analytics",
  "team",
  "billing",
  "settings",
];

const partnerTypeLabels = ["Property", "Hotel", "Venue", "Brand", "Retail", "Restaurant", "Real Estate", "Civic", "Nonprofit", "Agency"];

function normalizePartnerTypeLabel(value: any) {
  const raw = String(value || "Partner").trim();
  const match = partnerTypeLabels.find((type) => slug(type) === slug(raw));
  return match || raw || "Partner";
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return { salt, hash, algorithm: "pbkdf2_sha512", iterations: 120000 };
}

function verifyPassword(password: string, auth: Record<string, any> = {}) {
  if (!auth.password_hash || !auth.password_salt) return false;
  const attempt = crypto.pbkdf2Sync(password, auth.password_salt, Number(auth.password_iterations || 120000), 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(attempt, "hex"), Buffer.from(auth.password_hash, "hex"));
}

function buildSessionToken(userId: string) {
  return crypto.createHash("sha256").update(`${userId}:${now()}:${crypto.randomBytes(16).toString("hex")}`).digest("hex");
}

function createWorkspaceBundle(entities: Database["entities"], tenant: EntityRecord) {
  const workspace = entities.TenantWorkspace.find((item) => item.tenant_id === tenant.id);
  return {
    organization: entities.Organization.find((item) => item.platform_tenant_id === tenant.id || item.slug === tenant.slug),
    tenant,
    workspace,
    profile: entities.PartnerProfile.find((item) => item.tenant_id === tenant.id),
    locations: entities.PartnerLocation.filter((item) => item.tenant_id === tenant.id),
    members: entities.WorkspaceMember.filter((item) => item.organization_id === tenant.id || item.workspace_id === workspace?.id),
    users: entities.TenantUser.filter((item) => item.tenant_id === tenant.id),
    subscription: entities.PartnerSubscription.find((item) => item.tenant_id === tenant.id),
    invoices: entities.PartnerInvoice.filter((item) => item.tenant_id === tenant.id),
    addons: entities.WorkspaceAddon.filter((item) => item.workspace_id === workspace?.id),
    campaigns: entities.Campaign.filter((item) => item.tenant_id === tenant.id),
    perks: entities.PerkLocation.filter((item) => item.tenant_id === tenant.id),
    events: entities.PartnerEvent.filter((item) => item.tenant_id === tenant.id),
    qr: entities.PartnerQrExperience.filter((item) => item.tenant_id === tenant.id),
    reports: entities.PartnerReport.filter((item) => item.tenant_id === tenant.id),
    analytics: entities.PartnerAnalytics.filter((item) => item.tenant_id === tenant.id),
    mapLinks: entities.MapEntityLink.filter((item) => item.tenant_id === tenant.id),
    modules: entities.PartnerWorkspaceModule.filter((item) => item.tenant_id === tenant.id),
    activity: entities.TenantAuditLog.filter((item) => item.tenant_id === tenant.id),
  };
}

function provisionCompletePartnerWorkspace(entities: Database["entities"], payload: Record<string, any>) {
  const contact = payload.contact || {};
  const organization = payload.organization || {};
  const location = payload.location || {};
  const selectedPlan = payload.plan || {};
  const billing = payload.billing || payload.checkout || {};
  const email = String(payload.email || contact.email || organization.billing_email || billing.billing_email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  const organizationName = String(payload.organization_name || organization.name || payload.business_name || payload.company || "").trim();
  const displayName = String(payload.name || contact.name || payload.display_name || email.split("@")[0] || "").trim();
  const partnerType = normalizePartnerTypeLabel(payload.partner_type || organization.partner_type || organization.type);

  if (!email) throw new Error("Email is required.");
  if (!organizationName) throw new Error("Organization name is required.");

  const tenantSlug = slug(organizationName).replace(/_/g, "-");
  const authUserId = `auth_${slug(email)}`;
  const profileId = `profile_${slug(email)}`;
  const ownerId = profileId;
  const tenantType = normalizeTenantType(partnerType);
  const passwordCredentials = password ? hashPassword(password) : null;

  const profile = ensureRecord(entities.Profile, profileId, {
    auth_user_id: authUserId,
    first_name: contact.first_name || displayName.split(" ")[0] || "",
    last_name: contact.last_name || displayName.split(" ").slice(1).join(" "),
    display_name: displayName || email,
    email,
    avatar: contact.avatar || "",
    phone: contact.phone || payload.phone || "",
    timezone: contact.timezone || payload.timezone || "America/Chicago",
    verification_status: "needs_verification",
    created_by: authUserId,
    updated_by: authUserId,
  });

  const user = ensureRecord(entities.User, authUserId, {
    profile_id: profile.id,
    auth_user_id: authUserId,
    name: profile.display_name,
    full_name: profile.display_name,
    email,
    role: "partner_owner",
    status: "email_verification_pending",
    email_verified: false,
    last_login: "",
    password_hash: passwordCredentials?.hash || "",
    password_salt: passwordCredentials?.salt || "",
    password_algorithm: passwordCredentials?.algorithm || "",
    password_iterations: passwordCredentials?.iterations || 0,
    preferences: { active_workspace_slug: tenantSlug },
    is_demo: false,
  });

  const tenant = provisionPlatformTenant(entities, {
    name: organizationName,
    type: tenantType,
    category: partnerType,
    address: location.address || organization.address,
    status: "provisioning",
    source_type: "partner_registration",
    source_id: user.id,
  });
  if (!tenant) throw new Error("Workspace setup couldn't be completed.");

  const workspaceId = `workspace_${tenant.slug}`;
  const organizationRecord = ensureRecord(entities.Organization, `org_${tenant.slug}`, {
    platform_tenant_id: tenant.id,
    slug: tenant.slug,
    name: organizationName,
    partner_type: partnerType,
    owner_id: ownerId,
    billing_email: billing.billing_email || organization.billing_email || email,
    logo: organization.logo || "",
    status: "active",
    verification_status: "needs_verification",
    created_by: user.id,
    updated_by: user.id,
    is_demo: false,
  });

  const workspace = ensureRecord(entities.Workspace, workspaceId, {
    organization_id: organizationRecord.id,
    platform_tenant_id: tenant.id,
    workspace_name: payload.workspace_name || `${organizationName} Workspace`,
    workspace_slug: tenant.slug,
    status: "active",
    onboarding_complete: false,
    created_by: user.id,
    updated_by: user.id,
    source_file: "partner_registration",
    verification_status: "needs_verification",
  });

  ensureRecord(entities.TenantWorkspace, workspaceId, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    slug: tenant.slug,
    workspace_name: workspace.workspace_name,
    path: `/partner-workspace/overview?workspace=${tenant.slug}`,
    default_route: `/partner-workspace/overview?provisioned=1&workspace=${tenant.slug}`,
    status: "active",
    workspace_status: "active",
    onboarding_complete: false,
    lifecycle_stage: "workspace_activated",
    modules: workspaceModules,
    is_demo: false,
  });

  ensureRecord(entities.WorkspaceMember, `member_${tenant.slug}_owner`, {
    workspace_id: workspaceId,
    organization_id: organizationRecord.id,
    profile_id: profile.id,
    user_id: user.id,
    role: "Owner",
    status: "active",
    created_by: user.id,
    updated_by: user.id,
    verification_status: "verified",
  });

  ensureRecord(entities.TenantUser, `tenant_user_${tenant.slug}_owner`, {
    tenant_id: tenant.id,
    workspace_id: workspaceId,
    profile_id: profile.id,
    auth_user_id: authUserId,
    name: profile.display_name,
    email,
    role: "Owner",
    status: "active",
    is_demo: false,
  });

  const partner = ensureRecord(entities.Partner, `partner_${tenant.slug}`, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    workspace_id: workspaceId,
    business_name: organizationName,
    contact_person: profile.display_name,
    contact_email: email,
    contact_phone: profile.phone,
    address: location.address || organization.address || "",
    category: partnerType,
    partner_type: tenantType,
    status: "active",
    onboarding_stage: "workspace_created",
    is_demo: false,
  });

  const partnerProfile = ensureRecord(entities.PartnerProfile, `profile_${tenant.slug}`, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    display_name: organizationName,
    business_description: organization.description || payload.description || "",
    website: organization.website || payload.website || "",
    phone: organization.phone || payload.phone || "",
    social_links: organization.social_links || payload.social_links || {},
    operating_hours: organization.operating_hours || payload.operating_hours || {},
    district: location.district || organization.district || payload.district || "",
    type: tenantType,
    category: partnerType,
    address: location.address || organization.address || "",
    brand_assets: organization.brand_assets || {},
    gallery: organization.gallery || [],
    locations: [],
    categories: organization.categories || [partnerType],
    tags: organization.tags || [],
    partner_settings: { map_visibility: "draft", onboarding_required: true },
    status: "active",
    verification_status: "needs_verification",
    is_demo: false,
  });

  const latitude = location.lat ?? location.latitude ?? null;
  const longitude = location.lng ?? location.longitude ?? null;
  const mapEntityId = `map_${tenant.slug}_primary`;
  const partnerLocation = ensureRecord(entities.PartnerLocation, `location_${tenant.slug}_primary`, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    map_entity_id: mapEntityId,
    title: location.title || organizationName,
    name: location.title || organizationName,
    address: location.address || organization.address || "",
    lat: latitude,
    lng: longitude,
    latitude,
    longitude,
    district: location.district || organization.district || "",
    hero_image: location.hero_image || organization.hero_image || "",
    active: Boolean(latitude && longitude),
    status: latitude && longitude ? "active" : "needs_coordinates",
    map_presence: latitude && longitude ? "enabled" : "pending_coordinates",
    verification_status: latitude && longitude ? "partially_verified" : "needs_verification",
    is_demo: false,
  });

  ensureRecord(entities.MapEntityLink, `map_link_${mapEntityId}`, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    location_id: partnerLocation.id,
    entity_id: mapEntityId,
    entity_type: tenantType,
    status: latitude && longitude ? "linked" : "pending_coordinates",
    source_type: "workspace_provisioning",
    is_demo: false,
  });

  const planKey = slug(selectedPlan.key || selectedPlan.name || selectedPlan.label || "starter");
  const plan = ensureRecord(entities.Plan, `plan_${planKey}`, {
    key: planKey,
    name: selectedPlan.name || selectedPlan.label || "Starter",
    tier: selectedPlan.tier || planKey,
    cadence: selectedPlan.cadence || "annual",
    annual_price: Number(selectedPlan.annual_price ?? selectedPlan.amount ?? selectedPlan.price ?? 0),
    features: selectedPlan.features || [],
    limits: selectedPlan.limits || {},
    status: "active",
    verification_status: "verified",
  });

  const subscription = ensureRecord(entities.PartnerSubscription, `subscription_${tenant.slug}`, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    plan_id: plan.id,
    plan: plan.key,
    plan_label: plan.name,
    status: billing.status || (billing.stripe_subscription ? "active" : "pending_checkout"),
    stripe_customer: billing.stripe_customer || "",
    stripe_subscription: billing.stripe_subscription || "",
    renewal_date: billing.renewal_date || "",
    trial_end: billing.trial_end || "",
    cancelled: false,
    billing_email: organizationRecord.billing_email,
    provider: billing.provider || (process.env.STRIPE_SECRET_KEY ? "stripe" : "pending_stripe_credentials"),
    verification_status: "needs_verification",
  });

  const addons = Array.isArray(payload.add_ons || payload.addons || billing.selected_add_ons)
    ? (payload.add_ons || payload.addons || billing.selected_add_ons)
    : [];
  addons.forEach((addon: any) => {
    const addonKey = slug(addon.key || addon.name || addon);
    ensureRecord(entities.WorkspaceAddon, `addon_${tenant.slug}_${addonKey}`, {
      workspace_id: workspaceId,
      organization_id: organizationRecord.id,
      subscription_id: subscription.id,
      addon_key: addonKey,
      name: addon.name || addon.label || String(addon),
      status: "active",
      price: Number(addon.price || addon.amount || 0),
      verification_status: "verified",
    });
  });

  ensureRecord(entities.BillingHistory, `billing_${tenant.slug}_provisioned`, {
    workspace_id: workspaceId,
    organization_id: organizationRecord.id,
    subscription_id: subscription.id,
    billing_email: organizationRecord.billing_email,
    event_type: "subscription_created",
    status: subscription.status,
    amount: plan.annual_price,
    provider: subscription.provider,
    created_by: user.id,
    verification_status: subscription.provider === "stripe" ? "verified" : "needs_verification",
  });

  ensureRecord(entities.PartnerInvoice, `invoice_${tenant.slug}_initial`, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    subscription_id: subscription.id,
    invoice_number: `DP-${tenant.slug.toUpperCase().slice(0, 12)}-${new Date().getFullYear()}`,
    status: billing.invoice_status || "pending_checkout",
    billing_status: billing.billing_status || "pending_checkout",
    provider: subscription.provider,
    subtotal: plan.annual_price,
    total: Number(billing.total ?? plan.annual_price),
    currency: "usd",
  });

  const defaultPerk = payload.perk || payload.suggested_perk || "";
  if (defaultPerk) {
    ensureRecord(entities.PerkLocation, `perk_${tenant.slug}_launch`, {
      tenant_id: tenant.id,
      organization_id: organizationRecord.id,
      workspace_id: workspaceId,
      partner_id: partner.id,
      campaign_id: `campaign_${tenant.slug}_launch`,
      name: organizationName,
      title: defaultPerk,
      description: payload.perk_description || defaultPerk,
      perk_type: payload.perk_type || "Partner launch perk",
      resident_value: payload.resident_value || "",
      business_value: payload.business_value || "",
      status: "draft",
      active: false,
      verification_status: "needs_verification",
    });
  }

  const campaign = ensureRecord(entities.Campaign, `campaign_${tenant.slug}_launch`, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    title: payload.campaign_title || `${organizationName} launch campaign`,
    description: payload.campaign_description || "Default campaign shell created during workspace provisioning.",
    type: payload.campaign_type || "launch",
    status: "draft",
    target_audience: payload.target_audience || "Downtown residents, guests, and nearby workers",
    created_from: "workspace_provisioning",
    verification_status: "needs_verification",
  });

  ensureRecord(entities.PartnerQrExperience, `qr_${tenant.slug}_welcome`, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    campaign_id: campaign.id,
    label: `${organizationName} welcome QR`,
    destination_url: `/map?entity=${encodeURIComponent(mapEntityId)}`,
    status: "draft",
    scans: 0,
    conversions: 0,
    verification_status: "needs_verification",
  });

  ensureRecord(entities.PartnerReport, `report_${tenant.slug}_overview`, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    report_type: "workspace_overview",
    status: "enabled",
    metrics: ["views", "saves", "directions", "visits", "redemptions", "scans", "campaigns", "events", "repeat_visits", "district_performance"],
    verification_status: "verified",
  });

  ensureRecord(entities.PartnerAnalytics, `analytics_${tenant.slug}`, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    views: 0,
    saves: 0,
    directions: 0,
    visits: 0,
    redemptions: 0,
    scans: 0,
    campaigns: 0,
    events: 0,
    repeat_visits: 0,
    district_performance: {},
    status: "tracking_enabled",
    verification_status: "verified",
  });

  workspaceModules.forEach((moduleName) => {
    ensureRecord(entities.PartnerWorkspaceModule, `module_${tenant.slug}_${moduleName}`, {
      tenant_id: tenant.id,
      organization_id: organizationRecord.id,
      workspace_id: workspaceId,
      partner_id: partner.id,
      module: moduleName,
      status: "ready",
      route: moduleName === "overview" ? `/partner-workspace/overview?workspace=${tenant.slug}` : `/partner-workspace/${moduleName}?workspace=${tenant.slug}`,
      is_demo: false,
    });
  });

  ensureRecord(entities.PartnerRegistration, `registration_${tenant.slug}`, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    workspace_id: workspaceId,
    partner_id: partner.id,
    profile_id: profile.id,
    contact: { name: profile.display_name, email, phone: profile.phone },
    organization: organizationRecord,
    plan,
    addons,
    status: "workspace_provisioned",
    lifecycle: ["marketing_site", "partner_type", "registration", "authentication", "email_verification", "organization_creation", "workspace_provisioning", "partner_profile", "plan_selection", "checkout", "subscription_created", "workspace_activated", "map_entity_created", "campaign_system_enabled", "reports_enabled", "analytics_enabled", "live_partner_workspace"],
    redirect: `/partner-workspace/overview?provisioned=1&workspace=${tenant.slug}`,
    submitted_at: now(),
    is_demo: false,
  });

  ensureRecord(entities.TenantAuditLog, `audit_${tenant.slug}_complete_provisioning`, {
    tenant_id: tenant.id,
    organization_id: organizationRecord.id,
    workspace_id: workspaceId,
    actor_id: user.id,
    action: "complete_partner_workspace_provisioned",
    resource: "partner_platform",
    before: null,
    after: { organization_id: organizationRecord.id, workspace_id: workspaceId, partner_id: partner.id, subscription_id: subscription.id, map_entity_id: mapEntityId },
    timestamp: now(),
  });

  tenant.status = "active";
  tenant.owner_id = ownerId;
  tenant.updated_at = now();
  partnerProfile.locations = [partnerLocation.id];

  return {
    success: true,
    redirect: `/partner-workspace/overview?provisioned=1&workspace=${tenant.slug}`,
    session: { token: buildSessionToken(user.id), user_id: user.id, profile_id: profile.id, workspace_id: workspaceId, organization_id: organizationRecord.id },
    user: { id: user.id, email: user.email, name: user.name, role: user.role, email_verified: user.email_verified },
    profile,
    organization: organizationRecord,
    tenant,
    workspace,
    partner,
    partnerProfile,
    subscription,
    mapEntity: entities.MapEntityLink.find((item) => item.entity_id === mapEntityId),
    campaign,
    bundle: createWorkspaceBundle(entities, tenant),
  };
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
  addContentManagementDefaults(entities);

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

  ensureRecord(entities.Promotion, "promotion_dude2026", {
    code: "DUDE2026",
    name: "Launch Promotion",
    description: "Complimentary first-year partner subscription for launch partners.",
    status: "active",
    discountType: "percentage",
    discount_type: "percentage",
    percentage: 100,
    fixedAmount: 0,
    fixed_amount: 0,
    duration: "firstYear",
    oneTime: false,
    firstYear: true,
    forever: false,
    applicablePlans: ["all"],
    applicable_plans: ["all"],
    applicablePartnerTypes: ["all"],
    applicable_partner_types: ["all"],
    maxUses: null,
    max_uses: null,
    currentUses: 0,
    current_uses: 0,
    startsAt: null,
    starts_at: null,
    expiresAt: null,
    expires_at: null,
    isActive: true,
    is_active: true,
    createdBy: "system",
    created_by: "system",
    campaign_attribution: "launch",
  });

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
      withTimestamps({ name: "OpenAI Insights", provider: "OpenAI", layer: "AI Layer", purpose: "Summaries, sentiment, recommendations, SMS concierge, and operator insights.", status: process.env.OPENAI_API_KEY ? "configured" : "pending_credentials", required_env: ["OPENAI_API_KEY"] }, "integration_openai"),
      withTimestamps({ name: "Email Delivery", provider: "Resend", layer: "Messaging", purpose: "Transactional email, partner onboarding, broadcasts, survey sends, and delivery logs.", status: process.env.RESEND_API_KEY ? "configured" : "pending_credentials", required_env: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"] }, "integration_resend_email")
    );
  }

  if (entities.PartnerOutreachContact.length === 0) {
    entities.PartnerOutreachContact.push(
      withTimestamps({
        partner_name: "Cozymeal",
        contact_name: "Sam Nasserian",
        role: "Founder & CEO",
        channel: "LinkedIn",
        email: "",
        phone: "",
        location: "San Francisco, CA",
        best_use: "Strategic partnership outreach and founder-level ecosystem positioning.",
        priority: "high",
        source: "public_contact_research",
        status: "ready",
      }, "outreach_contact_cozymeal_sam_nasserian"),
      withTimestamps({
        partner_name: "Cozymeal",
        contact_name: "Cozymeal Sales Team",
        role: "Sales Team",
        channel: "Email",
        email: "sales@cozymeal.com",
        phone: "",
        location: "US Headquarters",
        best_use: "Business partnerships, corporate opportunities, and growth discussions.",
        priority: "high",
        source: "public_contact_research",
        status: "ready",
      }, "outreach_contact_cozymeal_sales"),
      withTimestamps({
        partner_name: "Cozymeal",
        contact_name: "Cozymeal Operations",
        role: "General Operations Team",
        channel: "Email",
        email: "team@cozymeal.com",
        phone: "",
        location: "US Headquarters",
        best_use: "Internal routing if the correct department is unclear.",
        priority: "medium",
        source: "public_contact_research",
        status: "ready",
      }, "outreach_contact_cozymeal_team"),
      withTimestamps({
        partner_name: "Cozymeal",
        contact_name: "Main Company Line",
        role: "Business Development Routing",
        channel: "Phone",
        email: "",
        phone: "800-369-0157",
        location: "95 Third Street, 2nd Floor, San Francisco, CA 94103",
        best_use: "Ask for Partnerships, Business Development, or Founder Office.",
        priority: "medium",
        source: "public_contact_research",
        status: "ready",
      }, "outreach_contact_cozymeal_phone")
    );
  }

  if (entities.PartnerOutreachCampaign.length === 0) {
    entities.PartnerOutreachCampaign.push(
      withTimestamps({
        partner_name: "Cozymeal",
        category: "Experience marketplace",
        city_focus: "Austin",
        status: "draft",
        stage: "research_complete",
        owner: "Meg Dude",
        objective: "Explore ways to help more Austin residents discover Cozymeal culinary experiences through Downtown Perks.",
        positioning: "Complementary discovery and distribution channel, not an advertising or coupon pitch.",
        strategic_angle: "City-wide discovery distribution across residential communities, hotels, venues, brands, and civic organizations.",
        recommended_subject: "Exploring Ways to Help More Austin Residents Discover Cozymeal Experiences",
        primary_contact_id: "outreach_contact_cozymeal_sales",
        founder_contact_id: "outreach_contact_cozymeal_sam_nasserian",
        next_action: "Send founder-framed email to sales@cozymeal.com and connect with Sam Nasserian on LinkedIn.",
        tags: ["culinary", "experiences", "marketplace", "austin", "resident_discovery"],
      }, "outreach_campaign_cozymeal_austin")
    );
  }

  if (entities.PartnerOutreachStep.length === 0) {
    entities.PartnerOutreachStep.push(
      withTimestamps({
        campaign_id: "outreach_campaign_cozymeal_austin",
        sequence_order: 1,
        channel: "Email",
        title: "Send founder-framed partnership email",
        contact_id: "outreach_contact_cozymeal_sales",
        status: "ready",
        due_label: "Step 1",
        instructions: "Send to sales@cozymeal.com using the recommended subject and full partnership framing.",
      }, "outreach_step_cozymeal_email"),
      withTimestamps({
        campaign_id: "outreach_campaign_cozymeal_austin",
        sequence_order: 2,
        channel: "LinkedIn",
        title: "Connect with Sam Nasserian",
        contact_id: "outreach_contact_cozymeal_sam_nasserian",
        status: "ready",
        due_label: "Step 2",
        instructions: "Send the short founder note after or shortly before the email.",
      }, "outreach_step_cozymeal_linkedin"),
      withTimestamps({
        campaign_id: "outreach_campaign_cozymeal_austin",
        sequence_order: 3,
        channel: "Phone",
        title: "Call main company line",
        contact_id: "outreach_contact_cozymeal_phone",
        status: "ready",
        due_label: "Step 3",
        instructions: "Ask for the partnerships, business development, or founder office contact for Austin strategic partnership opportunities.",
      }, "outreach_step_cozymeal_call")
    );
  }

  if (entities.PartnerOutreachMessage.length === 0) {
    entities.PartnerOutreachMessage.push(
      withTimestamps({
        campaign_id: "outreach_campaign_cozymeal_austin",
        type: "email",
        title: "Founder partnership email",
        subject: "Exploring Ways to Help More Austin Residents Discover Cozymeal Experiences",
        body: `Hello Cozymeal Team,

My name is Meg Dude, and I'm the founder of Downtown Perks, a resident-first discovery platform designed to help people better experience Downtown Austin.

I recently came across Chef Megan's Stir Fry Thai Cuisine class and was genuinely impressed. The quality of the experience, the enthusiasm of the guest reviews, and the emphasis on creating meaningful, hands-on moments align closely with the type of experiences our community actively seeks out.

Downtown Perks exists to help residents and visitors discover what is happening around them in real time -- from restaurants and local businesses to events, wellness experiences, cultural programming, and unique experiences like Cozymeal classes.

We're currently building partnerships across residential communities, hotels, venues, brands, and civic organizations throughout Downtown Austin, creating a single discovery layer for both residents and visitors.

I believe there is a meaningful opportunity for Cozymeal to become one of the featured experience partners within Downtown Austin's emerging discovery ecosystem.

Potential areas of collaboration could include:
- Featuring Cozymeal experiences within the Downtown Perks discovery platform
- Introducing cooking classes and culinary experiences to downtown residents actively looking for things to do nearby
- Highlighting seasonal and neighborhood-specific experiences through curated campaigns
- Incorporating Cozymeal offerings into resident engagement programs, welcome initiatives, and community events
- Connecting Cozymeal with our growing network of residential, hospitality, venue, and civic partners

We are not building another directory or coupon platform. We are building the decision layer for Downtown Austin -- helping residents and visitors discover where to go, what to do, and who to support in real time.

I believe Cozymeal would be a natural fit within that vision and would welcome the opportunity to share more.

Warm regards,
Meg Dude
Founder, Downtown Perks
https://downtownperks.com`,
        status: "approved",
      }, "outreach_message_cozymeal_email"),
      withTimestamps({
        campaign_id: "outreach_campaign_cozymeal_austin",
        type: "linkedin",
        title: "Founder LinkedIn note",
        subject: "Short LinkedIn connection note",
        body: `Hi Sam,

I'm building Downtown Perks, a resident-first discovery platform focused on Downtown Austin. I recently came across Cozymeal and think there may be a natural alignment between what we're building and the experiences Cozymeal offers.

I'd love to share a quick overview and explore whether there may be opportunities to help more Austin residents discover Cozymeal experiences.

Best,
Meg Dude`,
        status: "approved",
      }, "outreach_message_cozymeal_linkedin"),
      withTimestamps({
        campaign_id: "outreach_campaign_cozymeal_austin",
        type: "call_script",
        title: "Phone routing script",
        subject: "Strategic partnership routing",
        body: "I'd like to speak with someone regarding a strategic partnership opportunity in Austin. Is there someone on the business development or partnerships team I should connect with?",
        status: "approved",
      }, "outreach_message_cozymeal_call")
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
        purpose: "Passport stamps, reward progress, and resident messages for multi-location programs.",
        status: "planned",
        trigger: "QR stamp added",
        flow: ["visit location", "scan QR", "stamp added", "progress SMS", "reward ready"],
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
        reward: "Reward ready after four verified location visits",
        channels: ["QR", "Twilio SMS", "Workspace report"],
        metrics: ["stamps", "completion_rate", "repeat_visits", "reward_ready"],
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
      withTimestamps({ name: "Passport Stamp Progress", provider: "Twilio", status: "ready_for_credentials", trigger: "QR stamp created", action: "Send progress and reward-ready SMS", last_run: "", target: "passport_stamps" }, "automation_passport_stamp"),
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

function addContentManagementDefaults(entities: Database["entities"]) {
  stage11Attractions.forEach((attraction, index) => {
    const entitySlug = slug(attraction.name).replace(/_/g, "-");
    const entityId = `attraction_${slug(attraction.name)}`;
    const lat = 30.2672 + (index % 7) * 0.004;
    const lng = -97.7431 - (index % 5) * 0.004;
    ensureRecord(entities.ContentEntity, entityId, {
      organization_id: "org_downtown_perks",
      workspace_id: "workspace_downtown_perks",
      name: attraction.name,
      title: attraction.name,
      slug: entitySlug,
      entity_type: "attraction",
      category: attraction.category,
      subcategory: attraction.tags[0] || attraction.category,
      district: attraction.district,
      status: "published",
      published: true,
      featured: index < 8,
      verified: true,
      priority: index + 1,
      map: {
        latitude: lat,
        longitude: lng,
        pin_icon: attraction.category,
        pin_colour: attraction.category === "music" ? "gold" : attraction.category === "museum" ? "navy" : "green",
        map_layer: "downtown_experience",
        visibility: "public",
        cluster_group: attraction.category,
        ordering: index + 1,
        search_weight: index < 8 ? 90 : 70,
      },
      images: {
        hero: "",
        gallery: [],
        thumbnail: "",
        social: "",
        mobile: "",
        night: "",
        seasonal: "",
        drone: "",
        portrait: "",
        landscape: "",
        photo_ideas: attraction.photoIdeas,
        crop_status: "ready_for_upload",
      },
      content: {
        resident_headline: `${attraction.name}, when it fits your day`,
        resident_body: attraction.description,
        partner_headline: `${attraction.name} as a Downtown Perks discovery moment`,
        partner_body: "Use this place as context for nearby offers, campaigns, resident recommendations, and sponsor-ready routes.",
        highlights: attraction.tags,
        good_for: attraction.tags,
        resident_tips: [`Best nearby context: ${attraction.district}.`, "Open the map before you go so nearby perks and events can follow the visit."],
        accessibility: "Review accessibility details before publishing a resident-facing recommendation.",
        parking: "Add current parking notes in the CMS before featured placement.",
        transit: "Add transit and walking guidance in the CMS before featured placement.",
        pricing: "Varies.",
        hours: attraction.hours,
        website: "",
        phone: "",
        booking: "",
      },
      relationships: {
        nearby_venues: [],
        nearby_hotels: [],
        nearby_parks: attraction.category === "park" ? [entityId] : [],
        nearby_restaurants: [],
        nearby_events: [],
        nearby_buildings: [],
        nearby_retail: [],
        nearby_art: attraction.category === "museum" ? [entityId] : [],
        nearby_music: attraction.category === "music" ? [entityId] : [],
        nearby_campaigns: [],
        nearby_perks: [],
      },
      publishing: {
        lifecycle: "published",
        future_publish_at: "",
        expires_at: "",
        seasonality: attraction.tags.map(String).includes("seasonal") ? "seasonal" : "evergreen",
        version: 1,
        preview_url: `/map?entity=${entitySlug}`,
        rollback_revision_id: "",
      },
      analytics: {
        events: ["pin_viewed", "drawer_opened", "save_clicked", "share_clicked", "directions_clicked"],
        reportable: true,
      },
      seo: {
        title: `${attraction.name} | Downtown Perks`,
        description: attraction.description,
        keywords: attraction.tags,
      },
      metadata: {
        source: "Stage 11 attachment",
        extracted_from: "Austin guide attraction CSV",
        best_photo_ideas: attraction.photoIdeas,
      },
    });

    ensureRecord(entities.ContentPublishingWorkflow, `workflow_${entityId}`, {
      entity_id: entityId,
      workflow_type: "content_publishing",
      state: "published",
      steps: ["draft", "review", "scheduled", "published", "archived"],
      current_step: "published",
      next_action: "Add live image assets and verify current hours.",
      owner: "platform_admin",
      automation_status: "ready",
    });

    ensureRecord(entities.ContentRevision, `revision_${entityId}_v1`, {
      entity_id: entityId,
      version: 1,
      status: "published",
      summary: "Initial Stage 11 attraction import.",
      snapshot: { name: attraction.name, category: attraction.category, district: attraction.district },
      created_by: "system_stage_11",
    });
  });

  stage11Collections.forEach((collection) => {
    const matching = entities.ContentEntity.filter((entity) => {
      const searchable = `${entity.category || ""} ${(entity.content?.highlights || []).join(" ")} ${(entity.metadata?.best_photo_ideas || []).join(" ")}`.toLowerCase();
      return collection.filters.some((filter) => searchable.includes(filter));
    }).map((entity) => entity.id);
    ensureRecord(entities.ContentCollection, collection.id, {
      organization_id: "org_downtown_perks",
      workspace_id: "workspace_downtown_perks",
      title: collection.title,
      slug: slug(collection.title).replace(/_/g, "-"),
      status: "published",
      pinned: matching.slice(0, 8),
      hidden: [],
      schedule: "",
      rules: { filters: collection.filters, generated: true, editable: true },
      entity_ids: matching,
      actions: ["pin", "remove", "override", "feature", "hide", "schedule"],
    });
  });

  ensureRecord(entities.WalkingRoute, "route_downtown_first_walk", {
    title: "Downtown first walk",
    status: "draft",
    entity_ids: ["attraction_austin_central_library", "attraction_lady_bird_lake", "attraction_congress_avenue_bat_bridge", "attraction_paramount_theatre"],
    purpose: "A simple first route from civic downtown to water, music, and evening plans.",
    estimated_time_minutes: 90,
    publishing: { lifecycle: "draft", preview_url: "/map?route=downtown-first-walk" },
  });

  ensureRecord(entities.AutomationRun, "automation_cms_relationship_refresh", {
    name: "CMS Relationship Refresh",
    provider: "platform",
    status: "ready",
    trigger: "content entity created or updated",
    action: "Refresh nearby relationships, collection membership, SEO preview, analytics targets, and map visibility.",
    last_run: "",
    target: "content_entities",
  });
}

async function ensureDatabase(): Promise<Database> {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Database;
    if (isServerless) {
      const bundled = await loadBundledDatabase();
      if (bundled && platformRecordCount(bundled) > platformRecordCount(parsed)) {
        for (const entityName of entityNames) bundled.entities[entityName] ||= [];
        addOperationalDefaults(bundled.entities);
        if (!bundled.entities.Partner.some((partner) => partner.source_type === "partner_outreach_crm")) {
          await importPartnerOutreachWorkbook(bundled.entities);
        }
        await saveDatabase(bundled);
        return bundled;
      }
    }
    for (const entityName of entityNames) parsed.entities[entityName] ||= [];
    addOperationalDefaults(parsed.entities);
    await importPricingCatalog(parsed.entities);
    if (!parsed.entities.Partner.some((partner) => partner.source_type === "partner_outreach_crm")) {
      await importPartnerOutreachWorkbook(parsed.entities);
    }
    await saveDatabase(parsed);
    return parsed;
  } catch {
    if (isServerless) {
      const bundled = await loadBundledDatabase();
      if (bundled) {
        for (const entityName of entityNames) bundled.entities[entityName] ||= [];
        addOperationalDefaults(bundled.entities);
        if (!bundled.entities.Partner.some((partner) => partner.source_type === "partner_outreach_crm")) {
          await importPartnerOutreachWorkbook(bundled.entities);
        }
        await saveDatabase(bundled);
        return bundled;
      }
    }
    const seeded = createSeedDatabase();
    await importPricingCatalog(seeded.entities);
    await importPartnerOutreachWorkbook(seeded.entities);
    await saveDatabase(seeded);
    return seeded;
  }
}

async function loadBundledDatabase(): Promise<Database | null> {
  try {
    const raw = await fs.readFile(bundledDbPath, "utf8");
    return JSON.parse(raw) as Database;
  } catch {
    return null;
  }
}

function platformRecordCount(db: Database) {
  return [
    "Partner",
    "PlatformTenant",
    "TenantWorkspace",
    "PartnerProfile",
    "PartnerLocation",
    "PartnerOffer",
    "Campaign",
    "MapEntityLink",
    "ProductOffering",
  ].reduce((sum, entityName) => sum + (db.entities[entityName as EntityName]?.length || 0), 0);
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

function isPropertyLike(value: any) {
  const raw = String(value || "").toLowerCase();
  return /property|real[_\s-]?estate|residential|apartment|condo|building|listing|tower|residence|homes?/.test(raw);
}

function getAdminPropertyPortfolio(db: Database) {
  const tenantRecords = db.entities.PlatformTenant
    .filter((tenant) => {
      const profile = db.entities.PartnerProfile.find((item) => item.tenant_id === tenant.id);
      const locations = db.entities.PartnerLocation.filter((item) => item.tenant_id === tenant.id);
      return (
        tenant.type === "property" ||
        tenant.type === "real_estate" ||
        isPropertyLike(tenant.name) ||
        isPropertyLike(profile?.category) ||
        isPropertyLike(profile?.type) ||
        locations.some((location) => isPropertyLike(location.category) || isPropertyLike(location.partner_type) || isPropertyLike(location.name))
      );
    })
    .map((tenant) => {
      const workspace = db.entities.TenantWorkspace.find((item) => item.tenant_id === tenant.id);
      const profile = db.entities.PartnerProfile.find((item) => item.tenant_id === tenant.id);
      const locations = db.entities.PartnerLocation.filter((item) => item.tenant_id === tenant.id);
      const primaryLocation = locations[0];
      const campaigns = db.entities.Campaign.filter((item) => item.tenant_id === tenant.id);
      const mapLinks = db.entities.MapEntityLink.filter((item) => item.tenant_id === tenant.id);
      const analytics = db.entities.PartnerAnalytics.find((item) => item.tenant_id === tenant.id);
      return {
        id: tenant.id,
        tenant_id: tenant.id,
        workspace_id: workspace?.id || `workspace_${tenant.slug}`,
        workspacePath: workspace?.path || `/tenant/${tenant.slug}`,
        name: profile?.display_name || tenant.name,
        address: primaryLocation?.address || profile?.address || "",
        district: primaryLocation?.district || profile?.district || "",
        type: tenant.type,
        category: profile?.category || primaryLocation?.category || tenant.type,
        totalUnits: Number(primaryLocation?.listings || primaryLocation?.units || 0),
        tenants: Number(analytics?.guests_reached || 0),
        listings: Number(primaryLocation?.listings || 0),
        status: tenant.status || "active",
        source_type: tenant.source_type || primaryLocation?.source_type || "platform_tenant",
        map_presence: primaryLocation?.map_presence || (mapLinks.length ? "enabled" : "not linked"),
        campaigns: campaigns.length,
        mapLinks: mapLinks.length,
        locations: locations.length,
        amenities: profile?.panel_sections || [],
        photos: [],
      };
    });

  const buildingRecords = db.entities.Building.map((building) => ({
    id: building.id,
    tenant_id: building.tenant_id || null,
    workspace_id: building.workspace_id || null,
    workspacePath: building.workspace_id ? `/tenant/${String(building.workspace_id).replace(/^workspace_/, "")}` : "",
    name: building.name,
    address: building.address || "",
    district: building.district || "",
    type: "property",
    category: building.type || "Building",
    totalUnits: Number(building.totalUnits || building.units || 0),
    tenants: Number(building.tenants || 0),
    listings: Number(building.listings || 0),
    status: building.status || "active",
    source_type: "building",
    map_presence: building.tenant_id ? "enabled" : "building record",
    campaigns: db.entities.Campaign.filter((item) => item.tenant_id === building.tenant_id).length,
    mapLinks: db.entities.MapEntityLink.filter((item) => item.tenant_id === building.tenant_id || item.entity_id === building.id).length,
    locations: 1,
    amenities: building.amenities || [],
    photos: building.photos || [],
    accessCode: building.accessCode,
  }));

  const merged = new Map<string, Record<string, any>>();
  [...tenantRecords, ...buildingRecords].forEach((record) => {
    const key = record.tenant_id || `building_${record.id}`;
    if (!merged.has(key)) merged.set(key, record);
  });

  return [...merged.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
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

function actorFromRequest(req: express.Request) {
  return String(req.headers["x-user-id"] || req.headers["x-actor-id"] || "user_admin");
}

function organizationContext(record: Record<string, any> = {}) {
  return {
    organization_id: record.organization_id || record.tenant_id || record.partner_id || "org_downtown_perks",
    workspace_id: record.workspace_id || (record.tenant_id ? `workspace_${String(record.tenant_id).replace(/^tenant_/, "")}` : "workspace_downtown_perks"),
  };
}

function writeAuditEvent(db: Database, req: express.Request, input: Record<string, any>) {
  const context = organizationContext(input.after || input.before || input);
  const audit = withTimestamps(
    {
      actor_id: input.actor_id || actorFromRequest(req),
      action: input.action,
      entity_type: input.entity_type || input.resource || "platform_record",
      entity_id: input.entity_id || input.resource_id || "",
      resource: input.resource || input.entity_type || "platform_record",
      before: input.before ?? null,
      after: input.after ?? null,
      timestamp: now(),
      correlation_id: input.correlation_id || makeId("corr"),
      metadata: input.metadata || {},
      tenant_id: context.organization_id,
      organization_id: context.organization_id,
      workspace_id: context.workspace_id,
    },
    makeId("audit")
  );
  db.entities.TenantAuditLog.push(audit);
  return audit;
}

function writeAnalyticsEvent(db: Database, req: express.Request, input: Record<string, any>) {
  const context = organizationContext(input);
  const event = withTimestamps(
    {
      event: input.event || input.name || "platform_event",
      entity_type: input.entity_type || "",
      entity_id: input.entity_id || "",
      mode: input.mode || req.query.mode || req.body?.mode || "",
      source: input.source || "api",
      actor_id: input.actor_id || actorFromRequest(req),
      timestamp: now(),
      metadata: input.metadata || {},
      tenant_id: context.organization_id,
      organization_id: context.organization_id,
      workspace_id: context.workspace_id,
    },
    makeId("analytics")
  );
  db.entities.AnalyticsEvent.push(event);
  return event;
}

async function sendEmailThroughResend(input: Record<string, any>) {
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!apiKey) {
    return {
      success: false,
      status: "pending_credentials",
      provider: "resend",
      error: "RESEND_API_KEY is required to send email.",
    };
  }

  const to = input.to || input.recipient || input.recipient_email || input.email;
  const subject = input.subject || input.title || "Downtown Perks";
  const html = input.html || input.html_body || "";
  const text = input.text || input.body || input.message || "";
  if (!to) return { success: false, status: "invalid_request", provider: "resend", error: "Email recipient is required." };
  if (!subject || (!html && !text)) return { success: false, status: "invalid_request", provider: "resend", error: "Email subject and body are required." };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from || process.env.RESEND_FROM_EMAIL || "Downtown Perks <hello@downtownperks.com>",
      to: Array.isArray(to) ? to : [to],
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
      reply_to: input.reply_to || input.replyTo || process.env.RESEND_REPLY_TO || undefined,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  return {
    success: response.ok,
    status: response.ok ? "sent" : "failed",
    provider: "resend",
    provider_response: payload,
    error: response.ok ? "" : payload?.message || payload?.error || "Resend email request failed.",
  };
}

function getPartnerName(db: Database, partnerId?: string) {
  if (!partnerId) return "";
  return db.entities.Partner.find((partner) => partner.id === partnerId)?.business_name || db.entities.PartnerProfile.find((profile) => profile.partner_id === partnerId)?.display_name || "";
}

function mapEntityRows(db: Database) {
  const fromContent = db.entities.ContentEntity
    .filter((entity) => entity.deleted_at ? false : entity.map?.latitude || entity.map?.lat || entity.latitude || entity.lat)
    .map((entity) => ({
      id: `cms_${entity.id}`,
      map_entity_id: entity.id,
      entity_type: entity.entity_type || entity.category || "attraction",
      entity_id: entity.id,
      title: entity.name || entity.title,
      category: entity.category || "",
      district: entity.district || "",
      lat: entity.map?.latitude ?? entity.map?.lat ?? entity.latitude ?? entity.lat ?? null,
      lng: entity.map?.longitude ?? entity.map?.lng ?? entity.longitude ?? entity.lng ?? null,
      status: entity.status || "draft",
      visibility: entity.published || entity.status === "published" ? "public" : "admin",
      partner_id: entity.partner_id || "",
      property_id: entity.property_id || "",
      building_id: entity.building_id || "",
      campaign_id: entity.campaign_id || "",
      perk_id: entity.perk_id || "",
      event_id: entity.event_id || "",
      organization_id: entity.organization_id || "org_downtown_perks",
      tenant_id: entity.tenant_id || "",
      workspace_id: entity.workspace_id || "workspace_downtown_perks",
      analytics_summary: {
        views: db.entities.AnalyticsEvent.filter((event) => event.entity_id === entity.id && event.event === "pin_viewed").length,
        saves: db.entities.AnalyticsEvent.filter((event) => event.entity_id === entity.id && event.event === "save_clicked").length,
        directions: db.entities.AnalyticsEvent.filter((event) => event.entity_id === entity.id && event.event === "directions_clicked").length,
        redemptions: 0,
      },
      content: entity.content || {},
      description: entity.description || entity.content?.resident_body || entity.content?.summary || "",
      resident_copy: entity.content?.resident_body || entity.description || "",
      partner_copy: entity.content?.partner_body || "",
      panel_headline: entity.content?.resident_headline || entity.name || entity.title || "",
      panel_body: entity.content?.resident_body || entity.description || "",
      drawer_copy: entity.content?.drawer_copy || entity.content?.resident_body || entity.description || "",
      popup_copy: entity.content?.popup_copy || entity.content?.resident_body || entity.description || "",
      icon: entity.icon || entity.pin_icon || entity.content?.icon || "",
      icon_url: entity.icon_url || entity.content?.icon_url || "",
      logo_url: entity.logo_url || entity.content?.logo_url || "",
      image_url: entity.image_url || entity.hero_image || entity.content?.image_url || entity.content?.hero_image || "",
      seo: entity.seo || {},
      publishing: entity.publishing || {},
      last_updated: entity.updated_at || entity.created_at || "",
    }));

  const fromLinks = db.entities.MapEntityLink.map((link) => {
    const locationByEntity = db.entities.PartnerLocation.find((item) => item.map_entity_id === link.entity_id);
    const locationByPartner = link.partner_id ? db.entities.PartnerLocation.find((item) => item.partner_id === link.partner_id) : undefined;
    const locationByTenant = link.tenant_id ? db.entities.PartnerLocation.find((item) => item.tenant_id === link.tenant_id) : undefined;
    const location = locationByEntity || locationByPartner || locationByTenant;
    const profile = link.partner_id
      ? db.entities.PartnerProfile.find((item) => item.partner_id === link.partner_id) || db.entities.PartnerProfile.find((item) => item.tenant_id === link.tenant_id)
      : db.entities.PartnerProfile.find((item) => item.tenant_id === link.tenant_id);
    const tenant = db.entities.PlatformTenant.find((item) => item.id === link.tenant_id);
    const analytics = db.entities.PartnerAnalytics.find((item) => item.tenant_id === link.tenant_id || item.workspace_id === link.workspace_id);
    return {
      id: link.id,
      map_entity_id: link.entity_id,
      entity_type: link.entity_type || location?.partner_type || profile?.type || tenant?.type || "partner",
      entity_id: link.entity_id,
      title: location?.name || profile?.display_name || tenant?.name || link.entity_id,
      category: location?.category || profile?.category || tenant?.type || "",
      district: location?.district || profile?.district || "",
      lat: location?.latitude ?? location?.lat ?? null,
      lng: location?.longitude ?? location?.lng ?? null,
      status: link.status || tenant?.status || "linked",
      visibility: link.status === "linked" ? "public" : "admin",
      partner_id: link.partner_id || location?.partner_id || profile?.partner_id || "",
      property_id: link.property_id || "",
      building_id: link.building_id || "",
      campaign_id: db.entities.Campaign.find((campaign) => campaign.related_entity_id === link.entity_id || campaign.tenant_id === link.tenant_id)?.id || "",
      perk_id: db.entities.PerkLocation.find((perk) => perk.partner_id === link.partner_id || perk.tenant_id === link.tenant_id)?.id || "",
      event_id: db.entities.Event.find((event) => event.partner_id === link.partner_id || event.tenant_id === link.tenant_id)?.id || "",
      organization_id: link.tenant_id || "",
      tenant_id: link.tenant_id || "",
      workspace_id: link.workspace_id || "",
      analytics_summary: {
        views: Number(analytics?.views || 0),
        saves: Number(analytics?.saves || 0),
        directions: Number(analytics?.directions || 0),
        redemptions: Number(analytics?.redemptions || 0),
      },
      description: profile?.description || tenant?.description || location?.description || "",
      resident_copy: profile?.resident_copy || profile?.description || tenant?.description || "",
      partner_copy: profile?.partner_copy || analytics?.summary || "",
      panel_headline: profile?.panel_headline || profile?.display_name || tenant?.name || "",
      panel_body: profile?.panel_body || profile?.description || tenant?.description || "",
      drawer_copy: profile?.drawer_copy || profile?.description || tenant?.description || "",
      popup_copy: profile?.popup_copy || profile?.short_description || profile?.description || "",
      icon: link.icon || profile?.icon || tenant?.icon || "",
      icon_url: link.icon_url || profile?.icon_url || tenant?.icon_url || "",
      logo_url: link.logo_url || profile?.logo_url || tenant?.logo_url || "",
      image_url: link.image_url || profile?.hero_image || profile?.image_url || tenant?.hero_image || "",
      last_updated: link.updated_at || link.created_at || "",
    };
  });

  const fromPerks = db.entities.PerkLocation.map((perk) => ({
    id: `map_perk_${perk.id}`,
    map_entity_id: perk.id,
    entity_type: "perk",
    entity_id: perk.id,
    title: perk.name || perk.title || "Perk",
    category: perk.category || "",
    district: perk.district || "",
    lat: perk.lat ?? null,
    lng: perk.lng ?? null,
    status: perk.active === false || perk.is_active === false ? "paused" : "active",
    visibility: perk.active === false || perk.is_active === false ? "admin" : "public",
    partner_id: perk.partner_id || "",
    property_id: perk.propertyId || "",
    building_id: perk.building_id || "",
    campaign_id: perk.campaign_id || "",
    perk_id: perk.id,
    event_id: perk.event_id || "",
    organization_id: perk.tenant_id || perk.partner_id || "",
    tenant_id: perk.tenant_id || "",
    workspace_id: perk.workspace_id || "",
    analytics_summary: {
      views: Number(perk.views || 0),
      saves: Number(perk.saves || 0),
      directions: Number(perk.directions || 0),
      redemptions: Number(perk.redemption_count || 0),
    },
    description: perk.description || perk.offer || perk.details || "",
    resident_copy: perk.resident_copy || perk.description || perk.offer || "",
    partner_copy: perk.partner_copy || perk.redemption_notes || "",
    panel_headline: perk.panel_headline || perk.name || perk.title || "Perk",
    panel_body: perk.panel_body || perk.description || perk.offer || "",
    drawer_copy: perk.drawer_copy || perk.description || perk.offer || "",
    popup_copy: perk.popup_copy || perk.short_description || perk.description || "",
    icon: perk.icon || "perk",
    icon_url: perk.icon_url || "",
    logo_url: perk.logo_url || perk.partner_logo_url || "",
    image_url: perk.image_url || perk.hero_image || "",
    last_updated: perk.updated_at || perk.created_at || "",
  }));

  const fromEvents = db.entities.Event.map((event, index) => ({
    id: `map_event_${event.id}`,
    map_entity_id: event.id,
    entity_type: "event",
    entity_id: event.id,
    title: event.title || event.name || "Event",
    category: event.category || "event",
    district: event.district || "Downtown Austin",
    lat: event.lat ?? event.latitude ?? 30.2672 + (index % 4) * 0.0018,
    lng: event.lng ?? event.longitude ?? -97.7431 - (index % 4) * 0.0018,
    status: event.status || "draft",
    visibility: event.status === "active" || event.status === "published" ? "public" : "admin",
    partner_id: event.partner_id || "",
    property_id: event.property_id || "",
    building_id: event.building_id || "",
    campaign_id: event.campaign_id || "",
    perk_id: event.perk_id || "",
    event_id: event.id,
    organization_id: event.tenant_id || event.partner_id || "org_downtown_perks",
    tenant_id: event.tenant_id || "",
    workspace_id: event.workspace_id || "",
    analytics_summary: {
      views: db.entities.AnalyticsEvent.filter((item) => item.entity_id === event.id && item.event === "pin_viewed").length,
      saves: db.entities.AnalyticsEvent.filter((item) => item.entity_id === event.id && item.event === "save_clicked").length,
      directions: db.entities.AnalyticsEvent.filter((item) => item.entity_id === event.id && item.event === "directions_clicked").length,
      redemptions: Number(event.registered_count || event.rsvp_count || 0),
    },
    description: event.description || event.summary || "",
    resident_copy: event.resident_copy || event.description || event.summary || "",
    partner_copy: event.partner_copy || event.internal_notes || "",
    panel_headline: event.panel_headline || event.title || event.name || "Event",
    panel_body: event.panel_body || event.description || event.summary || "",
    drawer_copy: event.drawer_copy || event.description || event.summary || "",
    popup_copy: event.popup_copy || event.short_description || event.description || "",
    icon: event.icon || "event",
    icon_url: event.icon_url || "",
    logo_url: event.logo_url || "",
    image_url: event.image_url || event.hero_image || "",
    last_updated: event.updated_at || event.created_at || "",
  }));

  const fromCampaigns = db.entities.Campaign.map((campaign, index) => ({
    id: `map_campaign_${campaign.id}`,
    map_entity_id: campaign.id,
    entity_type: "campaign",
    entity_id: campaign.id,
    title: campaign.title || campaign.name || "Campaign",
    category: "campaign",
    district: campaign.district || "Downtown Austin",
    lat: campaign.lat ?? campaign.latitude ?? 30.2662 + (index % 5) * 0.0015,
    lng: campaign.lng ?? campaign.longitude ?? -97.7442 - (index % 5) * 0.0015,
    status: campaign.status || "draft",
    visibility: campaign.status === "active" || campaign.status === "published" ? "public" : "admin",
    partner_id: campaign.partner_id || "",
    property_id: campaign.property_id || "",
    building_id: campaign.building_id || "",
    campaign_id: campaign.id,
    perk_id: campaign.perk_id || "",
    event_id: campaign.event_id || "",
    organization_id: campaign.tenant_id || campaign.partner_id || "org_downtown_perks",
    tenant_id: campaign.tenant_id || "",
    workspace_id: campaign.workspace_id || "",
    analytics_summary: {
      views: Number(campaign.views || campaign.opens || 0),
      saves: Number(campaign.saves || 0),
      directions: 0,
      redemptions: Number(campaign.redemptions || 0),
    },
    description: campaign.description || campaign.message || campaign.summary || "",
    resident_copy: campaign.resident_copy || campaign.message || campaign.description || "",
    partner_copy: campaign.partner_copy || campaign.operator_notes || "",
    panel_headline: campaign.panel_headline || campaign.title || campaign.name || "Campaign",
    panel_body: campaign.panel_body || campaign.message || campaign.description || "",
    drawer_copy: campaign.drawer_copy || campaign.message || campaign.description || "",
    popup_copy: campaign.popup_copy || campaign.short_description || campaign.message || "",
    icon: campaign.icon || "campaign",
    icon_url: campaign.icon_url || "",
    logo_url: campaign.logo_url || "",
    image_url: campaign.image_url || campaign.hero_image || "",
    last_updated: campaign.updated_at || campaign.created_at || "",
  }));

  const fromPassports = db.entities.PassportProgram.map((passport, index) => ({
    id: `map_passport_${passport.id}`,
    map_entity_id: passport.id,
    entity_type: "passport",
    entity_id: passport.id,
    title: passport.name || "Downtown Passport",
    category: "passport",
    district: passport.district || "Downtown Austin",
    lat: passport.lat ?? passport.latitude ?? 30.2654 + (index % 3) * 0.0012,
    lng: passport.lng ?? passport.longitude ?? -97.7421 - (index % 3) * 0.0012,
    status: passport.status || "planned",
    visibility: passport.status === "active" ? "public" : "admin",
    partner_id: passport.partner_id || "",
    property_id: passport.property_id || "",
    building_id: passport.building_id || "",
    campaign_id: passport.campaign_id || "",
    perk_id: "",
    event_id: "",
    organization_id: passport.tenant_id || passport.partner_id || "org_downtown_perks",
    tenant_id: passport.tenant_id || "",
    workspace_id: passport.workspace_id || "",
    analytics_summary: {
      views: Number(passport.views || 0),
      saves: Number(passport.stamps || 0),
      directions: 0,
      redemptions: Number(passport.completions || 0),
    },
    description: passport.description || passport.summary || "",
    resident_copy: passport.resident_copy || passport.description || passport.summary || "",
    partner_copy: passport.partner_copy || passport.operator_notes || "",
    panel_headline: passport.panel_headline || passport.name || "Downtown Passport",
    panel_body: passport.panel_body || passport.description || passport.summary || "",
    drawer_copy: passport.drawer_copy || passport.description || passport.summary || "",
    popup_copy: passport.popup_copy || passport.short_description || passport.description || "",
    icon: passport.icon || "passport",
    icon_url: passport.icon_url || "",
    logo_url: passport.logo_url || "",
    image_url: passport.image_url || passport.hero_image || "",
    last_updated: passport.updated_at || passport.created_at || "",
  }));

  const merged = new Map<string, Record<string, any>>();
  [...fromContent, ...fromLinks, ...fromPerks, ...fromEvents, ...fromCampaigns, ...fromPassports].forEach((record) => {
    const key = record.map_entity_id || record.id;
    if (!merged.has(key)) merged.set(key, record);
  });
  return [...merged.values()];
}

function mapSourceForRow(db: Database, row: Record<string, any>): { entityName: EntityName; id: string } | null {
  if (row.perk_id) return { entityName: "PerkLocation", id: row.perk_id };
  if (row.event_id) return { entityName: "Event", id: row.event_id };
  if (row.campaign_id) return { entityName: "Campaign", id: row.campaign_id };
  if (row.entity_type === "passport" || String(row.id || "").startsWith("map_passport_")) return { entityName: "PassportProgram", id: row.entity_id || row.map_entity_id };
  if (String(row.id || "").startsWith("cms_")) return { entityName: "ContentEntity", id: row.entity_id || row.map_entity_id };
  if (db.entities.MapEntityLink.some((item) => item.id === row.id)) return { entityName: "MapEntityLink", id: row.id };
  const content = db.entities.ContentEntity.find((item) => item.id === row.entity_id || item.id === row.map_entity_id);
  if (content) return { entityName: "ContentEntity", id: content.id };
  const link = db.entities.MapEntityLink.find((item) => item.entity_id === row.map_entity_id || item.entity_id === row.entity_id);
  if (link) return { entityName: "MapEntityLink", id: link.id };
  return null;
}

function findEntityById(collection: EntityRecord[], id: string) {
  return collection.find((item) => item.id === id);
}

function csvValue(value: any) {
  const raw = value === undefined || value === null ? "" : typeof value === "string" ? value : JSON.stringify(value);
  return `"${String(raw).replace(/"/g, '""')}"`;
}

function recordsToCsv(records: Record<string, any>[]) {
  const columns = Array.from(records.reduce<Set<string>>((set, record) => {
    Object.keys(record).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));
  return `${columns.join(",")}\n${records.map((record) => columns.map((column) => csvValue(record[column])).join(",")).join("\n")}\n`;
}

function googleSheetsConfig() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
  const privateKey = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEETS_REPORTS_SPREADSHEET_ID || "";
  return {
    clientEmail,
    privateKey,
    spreadsheetId,
    defaultRange: process.env.GOOGLE_SHEETS_DEFAULT_RANGE || "Downtown Perks Exports!A:Z",
    surveyRange: process.env.GOOGLE_SHEETS_SURVEY_RANGE || "Survey Responses!A:Z",
    leadRange: process.env.GOOGLE_SHEETS_LEAD_RANGE || "Partner Leads!A:Z",
    reportRange: process.env.GOOGLE_SHEETS_REPORT_RANGE || "Reports!A:Z",
  };
}

function googleSheetsReady() {
  const config = googleSheetsConfig();
  return Boolean(config.clientEmail && config.privateKey && config.spreadsheetId);
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getGoogleSheetsAccessToken() {
  const config = googleSheetsConfig();
  if (!config.clientEmail || !config.privateKey) {
    return { status: "pending_configuration" as const, error: "Google Sheets service-account email and private key are required." };
  }
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: issuedAt + 3600,
    iat: issuedAt,
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(config.privateKey);
  const assertion = `${unsigned}.${base64Url(signature)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    return { status: "failed" as const, error: payload.error_description || payload.error || `Google auth failed with ${response.status}` };
  }
  return { status: "configured" as const, accessToken: String(payload.access_token) };
}

function rangeForGoogleSheetPayload(type = "") {
  const config = googleSheetsConfig();
  const normalized = String(type).toLowerCase();
  if (normalized.includes("survey")) return config.surveyRange;
  if (normalized.includes("lead") || normalized.includes("contact")) return config.leadRange;
  if (normalized.includes("report")) return config.reportRange;
  return config.defaultRange;
}

function flattenForSheet(value: any) {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item))).join(" | ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function sheetRowsFromPayload(payload: Record<string, any>) {
  const source = payload.response || payload.lead || payload.report || payload.record || payload;
  const record = {
    exported_at: now(),
    export_type: payload.type || payload.function || payload.source || "downtown_perks_export",
    id: source.id || payload.id || "",
    name: source.name || source.title || source.resident_name || source.contactName || source.organizationName || "",
    email: source.email || source.resident_email || "",
    property: source.building_name || source.propertyName || source.organizationName || source.property || "",
    partner: source.partner_name || source.partner || "",
    status: source.status || payload.status || "",
    score: source.score ?? "",
    sentiment: source.sentiment || "",
    summary: source.answersSummary || source.message || source.description || source.notes || "",
    payload: source,
  };
  const headers = Object.keys(record);
  return {
    headers,
    values: [headers.map((key) => flattenForSheet((record as Record<string, any>)[key]))],
  };
}

async function appendRowsToGoogleSheet(payload: Record<string, any>) {
  const config = googleSheetsConfig();
  if (!config.spreadsheetId) {
    return { status: "pending_configuration" as const, error: "GOOGLE_SHEETS_SPREADSHEET_ID is required." };
  }
  const token = await getGoogleSheetsAccessToken();
  if (token.status !== "configured") return token;
  const range = payload.range || rangeForGoogleSheetPayload(payload.type || payload.function || payload.source);
  const rows = Array.isArray(payload.values) ? { values: payload.values } : sheetRowsFromPayload(payload);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rows),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { status: "failed" as const, error: result.error?.message || `Google Sheets append failed with ${response.status}`, details: result };
  }
  return {
    status: "success" as const,
    spreadsheetId: config.spreadsheetId,
    range,
    updatedRange: result.updates?.updatedRange,
    updatedRows: result.updates?.updatedRows,
    googleSheetRowId: result.updates?.updatedRange || "",
    details: result,
  };
}

function googleSheetExportRowId(result: Awaited<ReturnType<typeof appendRowsToGoogleSheet>>) {
  return result.status === "success" ? result.googleSheetRowId || result.updatedRange || "" : "";
}

function columnLetters(index: number) {
  let value = index + 1;
  let letters = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }
  return letters;
}

function xmlEscape(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function createSimpleXlsx(records: Record<string, any>[], fileName: string) {
  const tempRoot = path.join(dataDir, `xlsx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const xlDir = path.join(tempRoot, "xl");
  const relsDir = path.join(tempRoot, "_rels");
  const xlRelsDir = path.join(xlDir, "_rels");
  const worksheetsDir = path.join(xlDir, "worksheets");
  await fs.mkdir(relsDir, { recursive: true });
  await fs.mkdir(xlRelsDir, { recursive: true });
  await fs.mkdir(worksheetsDir, { recursive: true });
  const exportRows = records.length ? records : [{ Status: "No CRM records available" }];
  const headers = Object.keys(exportRows[0]);
  const rows = [headers, ...exportRows.map((record) => headers.map((header) => record[header] ?? ""))];
  const sheetRows = rows
    .map((row, rowIndex) => {
      const cells = row.map((cell, cellIndex) => `<c r="${columnLetters(cellIndex)}${rowIndex + 1}" t="inlineStr"><is><t>${xmlEscape(cell)}</t></is></c>`).join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  await fs.writeFile(path.join(tempRoot, "[Content_Types].xml"), `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`);
  await fs.writeFile(path.join(relsDir, ".rels"), `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  await fs.writeFile(path.join(xlDir, "workbook.xml"), `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="CRM Export" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  await fs.writeFile(path.join(xlRelsDir, "workbook.xml.rels"), `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`);
  await fs.writeFile(path.join(worksheetsDir, "sheet1.xml"), `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`);
  const outputPath = path.join(dataDir, fileName);
  await execFileAsync("/usr/bin/zip", ["-qr", outputPath, "."], { cwd: tempRoot, maxBuffer: 1024 * 1024 });
  return outputPath;
}

export async function createApp() {
  const app = express();
  let db = await ensureDatabase();
  logOpenAIStatusOnce();

  app.use(cors());
  app.use(express.json({
    limit: "5mb",
    verify: (req, _res, buf) => {
      (req as any).rawBody = Buffer.from(buf);
    },
  }));

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

  app.get("/api/intelligence/config-status", (_req, res) => {
    res.json(getIntelligenceCredentialStatus());
  });

  app.post("/api/intelligence/agent", async (req, res) => {
    const action = String(req.body?.action || "") as IntelligenceAgentAction;
    const allowedActions: IntelligenceAgentAction[] = [
      "enrich_company",
      "identify_decision_makers",
      "generate_partner_strategy",
      "generate_resident_offering",
      "generate_employee_offering",
      "generate_campaign_plan",
      "generate_pricing_recommendation",
      "generate_proposal",
      "generate_meeting_agenda",
      "generate_follow_up",
      "summarize_map_presence",
      "recommend_next_action",
    ];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({ error: "Unsupported Intelligence action." });
    }

    const context = {
      company: req.body?.company || req.body?.context?.company || {},
      contacts: req.body?.contacts || req.body?.context?.contacts || [],
      building: req.body?.building || req.body?.context?.building || {},
      mapPresence: req.body?.mapPresence || req.body?.context?.mapPresence || [],
      existingListings: req.body?.existingListings || req.body?.context?.existingListings || db.entities.MapEntityLink.slice(0, 25),
      existingPerks: req.body?.existingPerks || req.body?.context?.existingPerks || db.entities.PerkLocation.slice(0, 25),
      pricingCatalog: req.body?.pricingCatalog || req.body?.context?.pricingCatalog || db.entities.ProductOffering.slice(0, 25),
      campaignCatalog: req.body?.campaignCatalog || req.body?.context?.campaignCatalog || db.entities.Campaign.slice(0, 25),
      platformCapabilities: req.body?.platformCapabilities || req.body?.context?.platformCapabilities || platformDomains.map(serializePlatformDomain),
      workspaceStatus: req.body?.workspaceStatus || req.body?.context?.workspaceStatus || {},
      notes: req.body?.notes || req.body?.context?.notes || "",
    };

    const result = await runIntelligenceAgent(action, context);
    const status = result.ok ? 200 : result.status || 500;
    const resultData = "data" in result ? result.data : null;
    const insight = withTimestamps(
      {
        title: `Partner Intelligence: ${action.replace(/_/g, " ")}`,
        provider: "openai",
        status: result.ok ? "generated" : "failed",
        prompt_type: action,
        source_module: "partner_intelligence",
        company_id: String((context.company as any)?.id || ""),
        company_name: String((context.company as any)?.companyName || (context.company as any)?.name || ""),
        result: result.ok ? resultData : null,
        error: result.ok ? "" : result.error,
      },
      makeId("ai_insight")
    );
    db.entities.AiInsight.push(insight);
    writeAuditEvent(db, req, { action: `partner_intelligence_${action}`, entity_type: "ai_insight", entity_id: insight.id, after: insight });
    await saveDatabase(db);
    res.status(status).json({ ...result, insight_id: insight.id });
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

  const resolveTenant = (identifier?: string) => {
    if (!identifier || identifier === "current") return db.entities.PlatformTenant[0] || null;
    return db.entities.PlatformTenant.find((item) => item.id === identifier || item.slug === identifier || item.name === identifier) || null;
  };

  const getWorkspaceBundle = (identifier?: string) => {
    const tenant = resolveTenant(identifier);
    if (!tenant) return null;
    const workspace = db.entities.TenantWorkspace.find((item) => item.tenant_id === tenant.id);
    const partner = db.entities.Partner.find((item) => item.tenant_id === tenant.id || item.workspace_id === workspace?.id);
    return {
      tenant,
      workspace,
      partner,
      profile: db.entities.PartnerProfile.find((item) => item.tenant_id === tenant.id),
      locations: db.entities.PartnerLocation.filter((item) => item.tenant_id === tenant.id),
      modules: db.entities.PartnerWorkspaceModule.filter((item) => item.tenant_id === tenant.id),
      offers: db.entities.PartnerOffer.filter((item) => item.tenant_id === tenant.id),
      events: db.entities.PartnerEvent.filter((item) => item.tenant_id === tenant.id),
      campaigns: db.entities.Campaign.filter((item) => item.tenant_id === tenant.id),
      reports: db.entities.PartnerReport.filter((item) => item.tenant_id === tenant.id),
      analytics: db.entities.PartnerAnalytics.filter((item) => item.tenant_id === tenant.id),
      users: db.entities.TenantUser.filter((item) => item.tenant_id === tenant.id),
      roles: db.entities.TenantRole.filter((item) => item.tenant_id === tenant.id),
      subscriptions: db.entities.PartnerSubscription.filter((item) => item.tenant_id === tenant.id),
      invoices: db.entities.PartnerInvoice.filter((item) => item.tenant_id === tenant.id),
      qr: db.entities.PartnerQrExperience.filter((item) => item.tenant_id === tenant.id),
      aiContext: db.entities.PartnerAiContext.find((item) => item.tenant_id === tenant.id),
      notifications: db.entities.TenantNotification.filter((item) => item.tenant_id === tenant.id),
      auditLogs: db.entities.TenantAuditLog.filter((item) => item.tenant_id === tenant.id),
      mapLinks: db.entities.MapEntityLink.filter((item) => item.tenant_id === tenant.id),
    };
  };

  app.get("/api/workspace/:slug", (req, res) => {
    const bundle = getWorkspaceBundle(req.params.slug);
    if (!bundle) return res.status(404).json({ error: "Workspace not found" });
    res.json(bundle);
  });

  app.post("/api/agent-recommendations", async (req, res) => {
    const query = String(req.body?.query || "").toLowerCase();
    const partnerType = String(req.body?.partnerType || req.body?.mode || "partner");
    const candidates = [
      ...db.entities.PerkLocation.map((perk) => ({
        id: perk.id,
        type: "perk",
        name: perk.name || perk.title || perk.perk || "Downtown perk",
        score: Number(perk.redemption_count || 0) + Number(perk.scans || 0) + 70,
        district: perk.district || perk.address || "Downtown Austin",
        reason: `${perk.category || "Local"} offer with ${Number(perk.redemption_count || 0)} redemptions.`,
        action: "redeem",
        perk: { label: perk.perk || perk.title || "Resident offer", redemptionMethod: perk.redemption_type || "Show resident card" },
      })),
      ...db.entities.Event.map((event) => ({
        id: event.id,
        type: "event",
        name: event.title || event.name || "Downtown event",
        score: Number(event.rsvps || event.attendance || 0) + 60,
        district: event.district || event.location || "Downtown Austin",
        reason: `${event.category || "Event"} timing is relevant for nearby audiences.`,
        action: "rsvp",
      })),
      ...db.entities.PartnerOffer.map((offer) => ({
        id: offer.id,
        type: "offer",
        name: offer.title || "Partner offer",
        score: Number(offer.redemptions || 0) + 65,
        district: offer.source_type || "Partner workspace",
        reason: "Workspace offer is ready for activation and reporting.",
        action: "view",
        perk: { label: offer.title || "Partner offer", redemptionMethod: offer.redemption_rules || "Workspace managed" },
      })),
    ];
    const filtered = candidates
      .filter((item) => !query || `${item.name} ${item.type} ${item.district} ${item.reason}`.toLowerCase().includes(query) || query.includes(item.type))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item, index) => ({
        ...item,
        score: Math.min(99, Math.max(72, item.score - index * 3)),
        distanceLabel: item.district,
      }));

    const recommendations = filtered.length ? filtered : candidates.sort((a, b) => b.score - a.score).slice(0, 6).map((item, index) => ({ ...item, score: Math.min(99, item.score - index * 3), distanceLabel: item.district }));
    const insight = withTimestamps(
      {
        source: "workspace_agent",
        insight_type: "recommendation",
        prompt: req.body?.query || "",
        partner_type: partnerType,
        summary: `Returned ${recommendations.length} workspace recommendations from live entity records.`,
        recommendations,
        status: "generated",
      },
      makeId("ai_insight")
    );
    db.entities.AiInsight.push(insight);
    await saveDatabase(db);
    res.json({ intent: query || "workspace_recommendations", recommendations, insight_id: insight.id });
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

  app.post("/api/map-data/import", async (req, res) => {
    const result = await importDowntownPerksMapData(db.entities);
    await saveDatabase(db);
    res.json(result);
  });

  app.post("/api/intelligence/import", async (req, res) => {
    const result = await importPartnerIntelligenceData(db.entities);
    await saveDatabase(db);
    res.json(result);
  });

  app.post("/api/outreach-crm/import", async (req, res) => {
    const result = await importPartnerOutreachWorkbook(db.entities);
    writeAuditEvent(db, req, { action: "partner_outreach_crm_imported", entity_type: "partner", entity_id: "partner_outreach_crm", after: result });
    await saveDatabase(db);
    res.json(result);
  });

  app.post("/api/outreach-crm/enrich-map-data", async (req, res) => {
    const refreshMap = req.body?.refresh_map !== false;
    const mapImport = refreshMap ? await importDowntownPerksMapData(db.entities) : null;
    const result = await enrichOutreachCrmFromMapSources(db.entities, { google_places: Boolean(req.body?.google_places) });
    writeAuditEvent(db, req, { action: "partner_outreach_crm_enriched", entity_type: "partner", entity_id: "partner_outreach_crm", after: result });
    await saveDatabase(db);
    res.json({ ...result, map_import: mapImport });
  });

  app.get("/api/outreach-crm", (req, res) => {
    const partners = buildOutreachCrmRows(db.entities);
    res.json({
      partners,
      statuses: outreachStatuses,
      google_places_configured: Boolean(process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY),
      filters: ["All", "Restaurants", "Bars", "Coffee", "Retail", "Hotels", "Properties", "Residential Buildings", "Office Buildings", "Civic", "Services", "Wellness", "Fitness", "Events", "Brands", "Real Estate", "Campaigns", "Perks"],
      counts: partners.reduce((acc: Record<string, number>, partner) => {
        const type = String(partner.type || "Partners");
        acc[type] = (acc[type] || 0) + 1;
        acc.All = (acc.All || 0) + 1;
        return acc;
      }, {}),
      schema: {
        partners: ["id", "name", "type", "category", "district", "address", "website", "phone", "google_maps_url", "description", "partner_fit", "recommended_plan", "priority_score", "status", "created_at", "updated_at"],
        contacts: ["id", "partner_id", "name", "role", "email", "phone", "linkedin_url", "confidence", "verification_status", "source_url", "notes"],
        perks: ["id", "partner_id", "perk_title", "perk_description", "perk_type", "resident_value", "business_value", "status"],
        campaigns: ["id", "partner_id", "campaign_title", "campaign_description", "campaign_type", "recommended_timing", "target_audience", "status"],
        outreach_messages: ["id", "partner_id", "contact_id", "channel", "subject", "body", "status", "sent_at", "follow_up_at"],
        outreach_activity: ["id", "partner_id", "contact_id", "activity_type", "notes", "created_at"],
      },
    });
  });

  app.patch("/api/outreach-crm/partners/:id", async (req, res) => {
    const partner = findEntityById(db.entities.Partner, req.params.id);
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    const beforeStage = partner.outreach_stage || partner.status || "";
    Object.assign(partner, req.body || {}, { updated_at: now() });
    const nextStage = partner.outreach_stage || partner.status || "";
    logOutreachActivity(db.entities, {
      partner_id: partner.id,
      contact_id: db.entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id)?.id || "",
      activity_type: beforeStage !== nextStage ? "status_update" : "partner_update",
      title: beforeStage !== nextStage ? `Status changed to ${nextStage}` : "Partner details updated",
      notes: Object.keys(req.body || {}).join(", "),
      status: nextStage,
      metadata: { before_stage: beforeStage, changes: req.body || {} },
    });
    await saveDatabase(db);
    res.json(buildOutreachCrmRows(db.entities).find((item) => item.id === partner.id));
  });

  app.patch("/api/outreach-crm/contacts/:id", async (req, res) => {
    const contact = findEntityById(db.entities.PartnerOutreachContact, req.params.id);
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    Object.assign(contact, req.body || {}, { updated_at: now() });
    logOutreachActivity(db.entities, {
      partner_id: contact.partner_id,
      contact_id: contact.id,
      activity_type: "contact_update",
      title: "Contact details updated",
      notes: Object.keys(req.body || {}).join(", "),
      status: contact.status || "",
      metadata: { changes: req.body || {} },
    });
    await saveDatabase(db);
    res.json(contact);
  });

  app.patch("/api/outreach-crm/messages/:id", async (req, res) => {
    const message = findEntityById(db.entities.PartnerOutreachMessage, req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });
    Object.assign(message, req.body || {}, { updated_at: now() });
    const emailTemplateFields = [
      "body",
      "subject",
      "email_headline",
      "email_subheadline",
      "banner_image_url",
      "partner_image_url",
      "logo_url",
      "cta_label",
      "cta_href",
      "secondary_cta_label",
      "secondary_cta_href",
      "footer_note",
    ];
    if (message.channel === "email" && emailTemplateFields.some((field) => field in (req.body || {}))) {
      const partner = db.entities.Partner.find((item) => item.id === message.partner_id) || {};
      message.html = buildOutreachEmailHtml(partner, message);
    }
    logOutreachActivity(db.entities, {
      partner_id: message.partner_id,
      contact_id: message.contact_id || "",
      activity_type: "message_update",
      title: `${message.channel === "sms" ? "Short message" : "Email"} edited`,
      notes: Object.keys(req.body || {}).join(", "),
      status: message.status || "draft",
      metadata: { channel: message.channel, changes: req.body || {} },
    });
    await saveDatabase(db);
    res.json(message);
  });

  app.get("/api/outreach-crm/partners/:id/email.html", (req, res) => {
    const partner = findEntityById(db.entities.Partner, req.params.id);
    if (!partner) return res.status(404).send("Partner not found");
    const message = db.entities.PartnerOutreachMessage.find((item) => item.partner_id === partner.id && item.channel === "email");
    if (!message) return res.status(404).send("Email message not found");
    const html = message.html || buildOutreachEmailHtml(partner, message);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  app.post("/api/outreach-crm/partners/:id/generate-message", async (req, res) => {
    const partner = findEntityById(db.entities.Partner, req.params.id);
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    const contact = (db.entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id) || {}) as Record<string, any>;
    const useLocalStrategy = Boolean(req.body?.local_strategy_only);
    const generated = useLocalStrategy
      ? { ...generateOutreachCopy({ ...partner, ...(req.body || {}) }, contact), provider: "local_strategy", intelligence: buildOutreachStrategyBrief({ ...partner, ...(req.body || {}) }, contact) }
      : await generatePersonalizedOutreachCopy({ ...partner, ...(req.body || {}) }, contact);
    const guardrail = "guardrail" in generated ? generated.guardrail || "" : "";
    const emailDraft = {
      partner_id: partner.id,
      contact_id: contact.id || "",
      channel: "email",
      subject: generated.subject,
      body: generated.body,
      email_headline: generated.strategy?.angle ? `${partner.name || partner.business_name}: ${generated.strategy.angle}` : "",
      email_subheadline: generated.strategy?.benefit || "",
      html: "",
      status: "draft",
      strategy: generated.strategy || {},
      intelligence: generated.intelligence || {},
      provider: generated.provider || "local_strategy",
      guardrail,
    };
    const email = ensureRecord(db.entities.PartnerOutreachMessage, `outreach_message_${slug(partner.external_entity_id || partner.id)}_email`, {
      ...emailDraft,
      html: buildOutreachEmailHtml(partner, emailDraft),
    });
    const sms = ensureRecord(db.entities.PartnerOutreachMessage, `outreach_message_${slug(partner.external_entity_id || partner.id)}_sms`, {
      partner_id: partner.id,
      contact_id: contact.id || "",
      channel: "sms",
      subject: "Short text / DM",
      body: generated.shortText,
      status: "draft",
      strategy: generated.strategy || {},
      intelligence: generated.intelligence || {},
      provider: generated.provider || "local_strategy",
      guardrail,
    });
    logOutreachActivity(db.entities, {
      partner_id: partner.id,
      contact_id: contact.id || "",
      activity_type: "message_generated",
      title: "Personalized outreach generated",
      notes: `Generated ${generated.provider || "local"} email and short text draft.`,
      status: partner.outreach_stage || partner.status || "Not started",
      metadata: {
        provider: generated.provider || "local_strategy",
        strategy: generated.strategy || {},
        guardrail,
        intelligence: {
          partner_type: generated.intelligence?.partner_type,
          district: generated.intelligence?.district,
          suggested_perk: generated.intelligence?.suggested_perk,
          suggested_campaign: generated.intelligence?.suggested_campaign,
          recommended_angle: generated.intelligence?.recommended_angle,
        },
      },
    });
    await saveDatabase(db);
    res.json({ email, sms, generated });
  });

  app.post("/api/outreach-crm/partners/:id/mark-contacted", async (req, res) => {
    const partner = findEntityById(db.entities.Partner, req.params.id);
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    Object.assign(partner, { outreach_stage: "Contacted", status: "Contacted", last_contacted: now(), updated_at: now() });
    logOutreachActivity(db.entities, {
      partner_id: partner.id,
      contact_id: db.entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id)?.id || "",
      activity_type: "contacted",
      title: "Marked contacted",
      notes: req.body?.notes || "Marked contacted from Outreach CRM.",
      status: "Contacted",
    });
    await saveDatabase(db);
    res.json(buildOutreachCrmRows(db.entities).find((item) => item.id === partner.id));
  });

  app.post("/api/outreach-crm/partners/:id/schedule-follow-up", async (req, res) => {
    const partner = findEntityById(db.entities.Partner, req.params.id);
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    const followUpAt = req.body?.follow_up_at || req.body?.date || "";
    Object.assign(partner, { outreach_stage: "Follow-up needed", status: "Follow-up needed", next_follow_up_date: followUpAt, updated_at: now() });
    logOutreachActivity(db.entities, {
      partner_id: partner.id,
      contact_id: db.entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id)?.id || "",
      activity_type: "follow_up_scheduled",
      title: "Follow-up scheduled",
      notes: followUpAt ? `Next follow-up: ${followUpAt}` : "Follow-up date needs confirmation.",
      status: "Follow-up needed",
      metadata: { follow_up_at: followUpAt },
    });
    await saveDatabase(db);
    res.json(buildOutreachCrmRows(db.entities).find((item) => item.id === partner.id));
  });

  app.post("/api/outreach-crm/partners/:id/archive", async (req, res) => {
    const partner = findEntityById(db.entities.Partner, req.params.id);
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    Object.assign(partner, { outreach_stage: "Archived", status: "Archived", archived_at: now(), updated_at: now() });
    logOutreachActivity(db.entities, {
      partner_id: partner.id,
      contact_id: db.entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id)?.id || "",
      activity_type: "archived",
      title: "Partner archived",
      notes: req.body?.notes || "Archived from Outreach CRM.",
      status: "Archived",
    });
    await saveDatabase(db);
    res.json(buildOutreachCrmRows(db.entities).find((item) => item.id === partner.id));
  });

  app.delete("/api/outreach-crm/partners/:id", async (req, res) => {
    const partner = findEntityById(db.entities.Partner, req.params.id);
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    Object.assign(partner, { deleted_at: now(), outreach_stage: "Archived", status: "Archived", updated_at: now() });
    logOutreachActivity(db.entities, {
      partner_id: partner.id,
      contact_id: db.entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id)?.id || "",
      activity_type: "deleted",
      title: "Partner removed from active CRM",
      notes: req.body?.notes || "Soft deleted from Outreach CRM. Historical records remain in storage.",
      status: "Archived",
    });
    await saveDatabase(db);
    res.json({ success: true, id: partner.id });
  });

  app.post("/api/outreach-crm/partners/:id/notes", async (req, res) => {
    const partner = findEntityById(db.entities.Partner, req.params.id);
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    const note = logOutreachActivity(db.entities, {
      partner_id: partner.id,
      contact_id: db.entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id)?.id || "",
      activity_type: "note",
      title: req.body?.title || "Note",
      notes: req.body?.notes || req.body?.body || "",
      status: partner.outreach_stage || partner.status || "Not started",
      metadata: { pinned: Boolean(req.body?.pinned) },
    });
    await saveDatabase(db);
    res.status(201).json(note);
  });

  app.patch("/api/outreach-crm/notes/:id", async (req, res) => {
    const note = findEntityById(db.entities.PartnerOutreachStep, req.params.id);
    if (!note || note.activity_type !== "note") return res.status(404).json({ error: "Note not found" });
    Object.assign(note, {
      title: req.body?.title ?? note.title,
      notes: req.body?.notes ?? req.body?.body ?? note.notes,
      metadata: { ...(note.metadata || {}), pinned: req.body?.pinned ?? note.metadata?.pinned ?? false },
      updated_at: now(),
    });
    logOutreachActivity(db.entities, {
      partner_id: note.partner_id,
      contact_id: note.contact_id || "",
      activity_type: "note_update",
      title: "Note updated",
      notes: note.title || "Note",
      status: note.status || "",
      metadata: { note_id: note.id },
    });
    await saveDatabase(db);
    res.json(note);
  });

  app.delete("/api/outreach-crm/notes/:id", async (req, res) => {
    const note = findEntityById(db.entities.PartnerOutreachStep, req.params.id);
    if (!note || note.activity_type !== "note") return res.status(404).json({ error: "Note not found" });
    Object.assign(note, { deleted_at: now(), updated_at: now() });
    logOutreachActivity(db.entities, {
      partner_id: note.partner_id,
      contact_id: note.contact_id || "",
      activity_type: "note_deleted",
      title: "Note deleted",
      notes: note.title || "Note",
      status: note.status || "",
      metadata: { note_id: note.id },
    });
    await saveDatabase(db);
    res.json({ success: true, id: note.id });
  });

  app.post("/api/outreach-crm/partners/:id/tasks", async (req, res) => {
    const partner = findEntityById(db.entities.Partner, req.params.id);
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    const task = logOutreachActivity(db.entities, {
      partner_id: partner.id,
      contact_id: db.entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id)?.id || "",
      activity_type: "task",
      title: req.body?.title || "Follow up",
      notes: req.body?.notes || "",
      status: req.body?.status || "open",
      metadata: { due_date: req.body?.due_date || "", priority: req.body?.priority || "Normal" },
    });
    await saveDatabase(db);
    res.status(201).json(task);
  });

  app.patch("/api/outreach-crm/tasks/:id", async (req, res) => {
    const task = findEntityById(db.entities.PartnerOutreachStep, req.params.id);
    if (!task || task.activity_type !== "task") return res.status(404).json({ error: "Task not found" });
    Object.assign(task, {
      title: req.body?.title ?? task.title,
      notes: req.body?.notes ?? task.notes,
      status: req.body?.status ?? task.status,
      metadata: { ...(task.metadata || {}), due_date: req.body?.due_date ?? task.metadata?.due_date ?? "", priority: req.body?.priority ?? task.metadata?.priority ?? "Normal" },
      updated_at: now(),
    });
    logOutreachActivity(db.entities, {
      partner_id: task.partner_id,
      contact_id: task.contact_id || "",
      activity_type: "task_update",
      title: `Task ${task.status === "complete" ? "completed" : "updated"}`,
      notes: task.title || "Task",
      status: task.status || "",
      metadata: { task_id: task.id },
    });
    await saveDatabase(db);
    res.json(task);
  });

  app.delete("/api/outreach-crm/tasks/:id", async (req, res) => {
    const task = findEntityById(db.entities.PartnerOutreachStep, req.params.id);
    if (!task || task.activity_type !== "task") return res.status(404).json({ error: "Task not found" });
    Object.assign(task, { deleted_at: now(), updated_at: now() });
    logOutreachActivity(db.entities, {
      partner_id: task.partner_id,
      contact_id: task.contact_id || "",
      activity_type: "task_deleted",
      title: "Task deleted",
      notes: task.title || "Task",
      status: task.status || "",
      metadata: { task_id: task.id },
    });
    await saveDatabase(db);
    res.json({ success: true, id: task.id });
  });

  app.post("/api/outreach-crm/partners/:id/files", async (req, res) => {
    const partner = findEntityById(db.entities.Partner, req.params.id);
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    const file = logOutreachActivity(db.entities, {
      partner_id: partner.id,
      contact_id: db.entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id)?.id || "",
      activity_type: "file",
      title: req.body?.title || req.body?.name || "Linked file",
      notes: req.body?.notes || "",
      status: "linked",
      metadata: { url: req.body?.url || "", file_type: req.body?.file_type || "link" },
    });
    await saveDatabase(db);
    res.status(201).json(file);
  });

  app.delete("/api/outreach-crm/files/:id", async (req, res) => {
    const file = findEntityById(db.entities.PartnerOutreachStep, req.params.id);
    if (!file || file.activity_type !== "file") return res.status(404).json({ error: "File not found" });
    Object.assign(file, { deleted_at: now(), updated_at: now() });
    logOutreachActivity(db.entities, {
      partner_id: file.partner_id,
      contact_id: file.contact_id || "",
      activity_type: "file_deleted",
      title: "File link deleted",
      notes: file.title || "File",
      status: "",
      metadata: { file_id: file.id },
    });
    await saveDatabase(db);
    res.json({ success: true, id: file.id });
  });

  app.post("/api/outreach-crm/batch/status", async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((id: any) => String(id)) : [];
    const status = normalizeOutreachStage(req.body?.status || "");
    if (!outreachStatuses.includes(status)) return res.status(400).json({ error: "Unsupported outreach status" });
    const selected = db.entities.Partner.filter((partner) => ids.includes(partner.id) && partner.source_type === "partner_outreach_crm");
    selected.forEach((partner) => {
      Object.assign(partner, {
        outreach_stage: status,
        status,
        last_contacted: status === "Contacted" ? now() : partner.last_contacted || "",
        updated_at: now(),
      });
      logOutreachActivity(db.entities, {
        partner_id: partner.id,
        contact_id: db.entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id)?.id || "",
        activity_type: "batch_status_update",
        title: `Batch status changed to ${status}`,
        notes: `Updated from batch action for ${selected.length} selected partner${selected.length === 1 ? "" : "s"}.`,
        status,
        metadata: { selected_count: selected.length },
      });
    });
    await saveDatabase(db);
    res.json({
      success: true,
      updated_count: selected.length,
      partners: buildOutreachCrmRows(db.entities).filter((partner) => ids.includes(partner.id)),
    });
  });

  app.get("/api/outreach-crm/export.:format", async (req, res) => {
    const selectedIds = String(req.query.ids || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const rows = crmExportRows(db.entities, selectedIds);
    const format = String(req.params.format || "csv").toLowerCase();
    const fileBase = selectedIds.length ? `downtown-perks-outreach-selected-${format}` : `downtown-perks-outreach-${format}`;
    logOutreachActivity(db.entities, {
      partner_id: selectedIds[0] || "partner_outreach_crm",
      activity_type: "export",
      title: `CRM ${format.toUpperCase()} export`,
      notes: selectedIds.length ? `Exported ${selectedIds.length} selected partner${selectedIds.length === 1 ? "" : "s"}.` : `Exported ${rows.length} CRM row${rows.length === 1 ? "" : "s"}.`,
      status: "exported",
      metadata: { format, selected_ids: selectedIds, row_count: rows.length },
    });
    await saveDatabase(db);
    if (format === "json") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.json"`);
      return res.send(JSON.stringify(rows, null, 2));
    }
    if (format === "xlsx") {
      const outputPath = await createSimpleXlsx(rows, `${fileBase}.xlsx`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.xlsx"`);
      return res.sendFile(outputPath);
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.csv"`);
    res.send(recordsToCsv(rows));
  });

  app.post("/api/products/import-pricing-catalog", async (req, res) => {
    const result = await importPricingCatalog(db.entities);
    writeAuditEvent(db, req, { action: "pricing_catalog_imported", entity_type: "product_offering", entity_id: "pricing_catalog", after: result });
    await saveDatabase(db);
    res.json({ success: true, ...result });
  });

  app.get("/api/products", (req, res) => {
    res.json(db.entities.ProductOffering.filter((item) => !item.deleted_at));
  });

  app.get("/api/prices", (req, res) => {
    res.json(
      db.entities.ProductOffering.flatMap((product) =>
        Array.isArray(product.prices) && product.prices.length
          ? product.prices.map((price: any) => ({ ...price, product_id: product.product_id, product_name: product.name, product_offering_id: product.id }))
          : [{ product_id: product.product_id, product_name: product.name, product_offering_id: product.id, stripe_price_id: product.stripe_price_id, amount: product.amount, currency: product.currency, interval: product.interval }]
      )
    );
  });

  app.get("/api/promotions", (req, res) => {
    res.json(db.entities.Promotion.filter((item) => !item.deleted_at));
  });

  app.post("/api/promotions", async (req, res) => {
    const body = req.body || {};
    const code = normalizePromotionCode(body.code);
    if (!code) return res.status(400).json({ error: "Promotion code is required." });
    const record = withTimestamps(
      {
        ...body,
        code,
        status: body.status || "active",
        discountType: body.discountType || body.discount_type || "percentage",
        discount_type: body.discountType || body.discount_type || "percentage",
        percentage: Number(body.percentage || 0),
        duration: body.duration || "oneTime",
        applicablePlans: Array.isArray(body.applicablePlans) ? body.applicablePlans : ["all"],
        applicablePartnerTypes: Array.isArray(body.applicablePartnerTypes) ? body.applicablePartnerTypes : ["all"],
        currentUses: 0,
        current_uses: 0,
        isActive: body.isActive !== false,
        is_active: body.isActive !== false,
        createdBy: actorFromRequest(req),
        created_by: actorFromRequest(req),
      },
      body.id || `promotion_${slug(code).replace(/_/g, "-")}`
    );
    db.entities.Promotion.push(record);
    writeAuditEvent(db, req, { action: "promotion_created", entity_type: "promotion", entity_id: record.id, after: record });
    await saveDatabase(db);
    res.status(201).json(record);
  });

  app.patch("/api/promotions/:id", async (req, res) => {
    const promotion = findEntityById(db.entities.Promotion, req.params.id);
    if (!promotion) return res.status(404).json({ error: "Promotion not found" });
    const before = { ...promotion };
    Object.assign(promotion, req.body || {}, {
      code: req.body?.code ? normalizePromotionCode(req.body.code) : promotion.code,
      updated_at: now(),
    });
    writeAuditEvent(db, req, { action: "promotion_updated", entity_type: "promotion", entity_id: promotion.id, before, after: promotion });
    await saveDatabase(db);
    res.json(promotion);
  });

  app.delete("/api/promotions/:id", async (req, res) => {
    const promotion = findEntityById(db.entities.Promotion, req.params.id);
    if (!promotion) return res.status(404).json({ error: "Promotion not found" });
    const before = { ...promotion };
    Object.assign(promotion, { status: "archived", isActive: false, is_active: false, deleted_at: now(), updated_at: now() });
    writeAuditEvent(db, req, { action: "promotion_archived", entity_type: "promotion", entity_id: promotion.id, before, after: promotion });
    await saveDatabase(db);
    res.json({ success: true, promotion });
  });

  app.post("/api/promotions/validate", (req, res) => {
    const validation = validatePromotion(db.entities, req.body || {});
    writeAnalyticsEvent(db, req, { event: "promotion_validated", entity_type: "promotion", entity_id: validation.promotion_id || validation.code || "", metadata: { success: validation.success, reason: validation.reason } });
    res.status(validation.valid ? 200 : 422).json(validation);
  });

  app.post("/api/promotions/redeem", async (req, res) => {
    const { validation, redemption } = redeemPromotion(db.entities, req.body || {});
    if (!validation.valid) return res.status(422).json(validation);
    writeAuditEvent(db, req, { action: "promotion_redeemed", entity_type: "promotion", entity_id: validation.promotion_id, after: redemption });
    writeAnalyticsEvent(db, req, { event: "promotion_redeemed", entity_type: "promotion", entity_id: validation.promotion_id, metadata: redemption });
    await saveDatabase(db);
    res.status(201).json({ ...validation, redemption });
  });

  app.post("/api/partner-leads", async (req, res) => {
    const body = req.body || {};
    const organizationName = String(body.organization_name || body.organization?.name || body.business_name || "Partner lead").trim();
    const contactEmail = String(body.email || body.contact?.email || body.contact_email || "").trim().toLowerCase();
    if (!organizationName || !contactEmail) return res.status(400).json({ error: "Organization name and email are required." });
    const lead = ensureRecord(db.entities.PartnerRegistration, `lead_${slug(organizationName)}_${slug(contactEmail)}`, {
      organization_name: organizationName,
      contact_email: contactEmail,
      contact_name: body.name || body.primary_contact || body.contact?.name || "",
      phone: body.phone || body.contact?.phone || "",
      partner_type: body.partner_type || body.organization?.type || "",
      interest: body.interest || "",
      plan: body.plan || {},
      products: body.products || [],
      checkout: body.checkout || {},
      status: "lead_captured",
      source_type: body.source_type || "partner_signup",
      google_sheets_status: process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? "ready_for_export" : "pending_credentials",
      submitted_at: now(),
      metadata: body.metadata || {},
    });
    const sheetsExport = await appendRowsToGoogleSheet({
      type: "partner_lead",
      lead: {
        ...lead,
        name: lead.contact_name || organizationName,
        email: contactEmail,
        organizationName,
        partner_name: organizationName,
        summary: [
          `Partner type: ${lead.partner_type || "not selected"}`,
          `Plan: ${lead.plan?.label || lead.plan?.name || lead.plan?.key || "not selected"}`,
          `Source: ${lead.source_type}`,
        ].join(" | "),
      },
    });
    lead.google_sheets_status = sheetsExport.status === "success" ? "success" : sheetsExport.status === "pending_configuration" ? "pending_credentials" : "failed";
    lead.google_sheets_export_status = lead.google_sheets_status;
    lead.google_sheets_row_id = googleSheetExportRowId(sheetsExport);
    lead.google_sheets_error = sheetsExport.error || "";
    ensureRecord(db.entities.SurveyExportLog, makeId("lead_export"), {
      partner_registration_id: lead.id,
      status: lead.google_sheets_status === "success" ? "success" : lead.google_sheets_status === "pending_credentials" ? "pending" : "failed",
      destination: "google-sheets",
      attempted_at: now(),
      completed_at: lead.google_sheets_status === "success" ? now() : "",
      row_id: lead.google_sheets_row_id,
      error: lead.google_sheets_error,
      payload_type: "partner_lead",
    });
    writeAuditEvent(db, req, { action: "partner_lead_captured", entity_type: "partner_registration", entity_id: lead.id, after: lead });
    writeAnalyticsEvent(db, req, { event: "partner_lead_captured", entity_type: "partner_registration", entity_id: lead.id, metadata: { partner_type: lead.partner_type, interest: lead.interest } });
    await saveDatabase(db);
    res.status(201).json({ success: true, lead, google_sheets: sheetsExport, export_csv_url: "/api/partner-leads/export.csv" });
  });

  app.get("/api/partner-leads/export.csv", (req, res) => {
    const rows = db.entities.PartnerRegistration.map((lead) => ({
      id: lead.id,
      organization_name: lead.organization_name || lead.organization?.name || "",
      contact_email: lead.contact_email || lead.contact?.email || "",
      contact_name: lead.contact_name || lead.contact?.name || "",
      phone: lead.phone || lead.contact?.phone || "",
      partner_type: lead.partner_type || lead.organization?.type || "",
      interest: lead.interest || "",
      status: lead.status || "",
      submitted_at: lead.submitted_at || lead.created_at || "",
      plan: lead.plan?.label || lead.plan?.name || lead.plan || "",
    }));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"downtown-perks-partner-leads.csv\"");
    res.send(recordsToCsv(rows));
  });

  app.post("/api/checkout/session", async (req, res) => {
    const body = req.body || {};
    const lineItems = Array.isArray(body.line_items) ? body.line_items : [];
    const selectedPriceIds = lineItems.map((item: any) => item.price || item.stripe_price_id).filter(Boolean);
    const matchedProducts = lineItems
      .map((item: any) => findCatalogProduct(db.entities, { ...item, plan_key: body.plan?.key || body.plan_key || body.plan }))
      .filter(Boolean) as EntityRecord[];
    const products = (matchedProducts.length ? matchedProducts : lineItems.map((item: any, index: number) => ({
      id: item.product_id || `local_plan_${slug(item.name || body.plan?.label || body.plan || `plan_${index + 1}`)}`,
      name: item.name || body.plan?.label || body.plan || "Partner plan",
      display_name: item.display_name || item.name || body.plan?.label || "Partner plan",
      stripe_product_id: item.product || item.product_id || "",
      stripe_price_id: item.price || item.stripe_price_id || `local_price_${slug(item.name || body.plan?.key || body.plan || `plan_${index + 1}`)}`,
      amount: Number(item.amount ?? body.plan_amount ?? body.plan?.amount ?? 0),
      interval: item.interval || item.cadence || body.plan?.cadence || "annual",
      quantity: Math.max(1, Number(item.quantity || 1)),
      currency: item.currency || "usd",
    }))).map((product: any, index: number) => ({ ...product, quantity: Math.max(1, Number(lineItems[index]?.quantity || product.quantity || 1)) }));
    const billingEmail = body.customer_email || body.billing_email || body.email || "";
    const organizationName = body.organization_name || body.business_name || "Downtown Perks Partner";
    const subtotal = products.reduce((sum, product) => sum + Number(product.amount || 0) * Math.max(1, Number(product.quantity || 1)), 0);
    const recurringSubtotal = products
      .filter((product) => {
        const interval = String(product.interval || "").toLowerCase();
        return interval && interval !== "one_time" && interval !== "one-time";
      })
      .reduce((sum, product) => sum + Number(product.amount || 0) * Math.max(1, Number(product.quantity || 1)), 0);
    const promotionCode = normalizePromotionCode(body.promotion_code || body.coupon || body.checkout?.coupon);

    if (!products.length) return res.status(400).json({ error: "At least one plan or price is required." });
    const promotionValidation = promotionCode ? validatePromotion(db.entities, {
      code: promotionCode,
      subtotal,
      plan: body.plan || body.plan_key || products[0]?.tier_id || products[0]?.display_name || products[0]?.name,
      partner_type: body.partner_type,
    }) : null;
    if (promotionValidation && !promotionValidation.valid) return res.status(422).json(promotionValidation);

    const tenant = provisionPlatformTenant(db.entities, {
      name: organizationName,
      type: body.partner_type || "venue",
      category: body.partner_type || "Partner",
      source_type: "checkout_session",
      source_id: billingEmail || organizationName,
    });
    const workspaceId = tenant ? `workspace_${tenant.slug}` : "workspace_downtown-perks-partner";
    const checkoutRecord = withTimestamps(
      {
        tenant_id: tenant?.id || "",
        workspace_id: workspaceId,
        billing_email: billingEmail,
        organization_name: organizationName,
        selected_price_ids: selectedPriceIds,
        products: products.map((product) => ({ id: product.id, name: product.name, stripe_product_id: product.stripe_product_id, stripe_price_id: product.stripe_price_id, amount: product.amount, interval: product.interval, quantity: product.quantity || 1 })),
        subtotal,
        discount: promotionValidation?.discount || 0,
        total: promotionValidation ? promotionValidation.total : subtotal,
        promotion_code: promotionValidation?.code || "",
        promotion_id: promotionValidation?.promotion_id || "",
        provider: process.env.STRIPE_SECRET_KEY ? "stripe" : "local_checkout_ready_for_stripe",
        status: process.env.STRIPE_SECRET_KEY ? "creating" : "pending_credentials",
        success_url: body.success_url || "http://localhost:5173/partners/provision?checkout=success",
        cancel_url: body.cancel_url || "http://localhost:5173/partners/checkout?checkout=cancelled",
      },
      makeId("checkout")
    );

    if (promotionValidation?.valid && promotionValidation.total === 0) {
      const { redemption } = redeemPromotion(db.entities, {
        code: promotionValidation.code,
        subtotal,
        tenant_id: checkoutRecord.tenant_id,
        organization_id: checkoutRecord.tenant_id,
        workspace_id: checkoutRecord.workspace_id,
        checkout_session_id: checkoutRecord.id,
        plan: body.plan || products[0]?.display_name || products[0]?.name || "partner",
        partner_type: body.partner_type || "",
      });
      checkoutRecord.provider = "promotion";
      checkoutRecord.payment_provider = "promotion";
      checkoutRecord.status = "complete";
      checkoutRecord.billing_status = "promotional";
      checkoutRecord.promotion_redemption_id = redemption?.id || "";
      checkoutRecord.message = "Promotion applied. No Stripe payment is required today.";
      ensureRecord(db.entities.PartnerSubscription, `subscription_${checkoutRecord.tenant_id || checkoutRecord.id}`, {
        tenant_id: checkoutRecord.tenant_id,
        workspace_id: checkoutRecord.workspace_id,
        plan: body.plan || products[0]?.display_name || products[0]?.name || "partner",
        plan_label: products[0]?.display_name || products[0]?.name || "Partner Plan",
        cadence: products[0]?.interval || "annual",
        amount: recurringSubtotal || subtotal,
        first_payment_amount: subtotal,
        annual_commitment: Number(body.checkout?.annual_commitment || body.annual_commitment || recurringSubtotal || subtotal),
        selected_add_ons: body.checkout?.selected_add_ons || body.selected_add_ons || [],
        status: "active",
        billing_status: "promotional",
        provider: "promotion",
        payment_provider: "promotion",
        promotion_code: promotionValidation.code,
        promotion_id: promotionValidation.promotion_id,
        promotion_redemption_id: redemption?.id || "",
        amount_paid: 0,
        discount: promotionValidation.discount,
        renewal_date: addOneYearIso(),
        billing_email: billingEmail,
      });
      ensureRecord(db.entities.PartnerInvoice, `invoice_${checkoutRecord.id}`, {
        tenant_id: checkoutRecord.tenant_id,
        workspace_id: checkoutRecord.workspace_id,
        billing_email: billingEmail,
        status: "paid",
        billing_status: "promotional",
        provider: "promotion",
        checkout_session_id: checkoutRecord.id,
        promotion_code: promotionValidation.code,
        promotion_id: promotionValidation.promotion_id,
        subtotal,
        discount: promotionValidation.discount,
        total: 0,
        currency: products[0]?.currency || "usd",
        paid_at: now(),
      });
      writeAuditEvent(db, req, { action: "promotional_checkout_completed", entity_type: "checkout", entity_id: checkoutRecord.id, after: checkoutRecord });
      writeAnalyticsEvent(db, req, { event: "promotional_checkout_completed", entity_type: "promotion", entity_id: promotionValidation.promotion_id, metadata: { code: promotionValidation.code, subtotal, discount: promotionValidation.discount } });
      await saveDatabase(db);
      return res.status(201).json({
        success: true,
        status: "promotional",
        checkout_session: checkoutRecord,
        promotion: promotionValidation,
        redemption,
        checkout_url: "/partners/provision?checkout=promotional",
        message: "Your first year is complimentary. No payment is required today.",
      });
    }

    const paymentLinkProduct = products.length === 1 && !promotionValidation?.discount ? products.find((product) => product.stripe_payment_link_url) : null;
    if (paymentLinkProduct?.stripe_payment_link_url) {
      checkoutRecord.provider = "stripe_payment_link";
      checkoutRecord.payment_provider = "stripe_payment_link";
      checkoutRecord.status = "payment_link_ready";
      checkoutRecord.billing_status = "pending_payment";
      checkoutRecord.checkout_url = paymentLinkProduct.stripe_payment_link_url;
      checkoutRecord.stripe_payment_link_id = paymentLinkProduct.stripe_payment_link_id;
      checkoutRecord.stripe_payment_link_url = paymentLinkProduct.stripe_payment_link_url;
      ensureRecord(db.entities.PartnerInvoice, `invoice_${checkoutRecord.id}`, {
        tenant_id: checkoutRecord.tenant_id,
        workspace_id: checkoutRecord.workspace_id,
        billing_email: billingEmail,
        status: "pending_payment",
        provider: "stripe_payment_link",
        checkout_session_id: checkoutRecord.id,
        stripe_payment_link_id: paymentLinkProduct.stripe_payment_link_id,
        hosted_invoice_url: paymentLinkProduct.stripe_payment_link_url,
        subtotal,
        discount: 0,
        total: checkoutRecord.total,
        currency: products[0]?.currency || "usd",
      });
      writeAuditEvent(db, req, { action: "stripe_payment_link_checkout_created", entity_type: "checkout", entity_id: checkoutRecord.id, after: checkoutRecord });
      writeAnalyticsEvent(db, req, { event: "stripe_payment_link_checkout_created", entity_type: "checkout", entity_id: checkoutRecord.id, metadata: { product: paymentLinkProduct.name, url: paymentLinkProduct.stripe_payment_link_url } });
      await saveDatabase(db);
      return res.status(201).json({
        success: true,
        status: "payment_link_ready",
        checkout_session: checkoutRecord,
        checkout_url: paymentLinkProduct.stripe_payment_link_url,
        payment_link: {
          id: paymentLinkProduct.stripe_payment_link_id,
          url: paymentLinkProduct.stripe_payment_link_url,
          product_id: paymentLinkProduct.stripe_product_id,
          price_id: paymentLinkProduct.stripe_price_id,
        },
        message: "Stripe payment link ready.",
      });
    }

    const hasStripePriceIds = selectedPriceIds.length > 0 && matchedProducts.length > 0;
    if (!process.env.STRIPE_SECRET_KEY) {
      ensureRecord(db.entities.PartnerInvoice, `invoice_${checkoutRecord.id}`, {
        tenant_id: checkoutRecord.tenant_id,
        workspace_id: checkoutRecord.workspace_id,
        billing_email: billingEmail,
        status: "pending_payment",
        provider: "local_checkout_ready_for_stripe",
        checkout_session_id: checkoutRecord.id,
        subtotal,
        discount: promotionValidation?.discount || 0,
        total: checkoutRecord.total,
        currency: products[0]?.currency || "usd",
      });
      writeAuditEvent(db, req, { action: "checkout_session_created_pending_credentials", entity_type: "checkout", entity_id: checkoutRecord.id, after: checkoutRecord });
      await saveDatabase(db);
      return res.status(202).json({
        success: true,
        status: "pending_credentials",
        checkout_session: checkoutRecord,
        checkout_url: `/partners/checkout?session_id=${checkoutRecord.id}&status=pending_credentials`,
        message: "Stripe credentials are not configured. Local checkout record created and ready for Stripe activation.",
      });
    }

    const params = new URLSearchParams();
    params.set("mode", products.some((product) => product.interval && product.interval !== "one_time") ? "subscription" : "payment");
    params.set("success_url", checkoutRecord.success_url);
    params.set("cancel_url", checkoutRecord.cancel_url);
    if (billingEmail) params.set("customer_email", billingEmail);
    products.forEach((product, index) => {
      const sourceLine = lineItems[index] || {};
      const quantity = Math.max(1, Number(sourceLine.quantity || 1));
      const matchedPriceId = sourceLine.price || sourceLine.stripe_price_id || product.stripe_price_id;
      if (hasStripePriceIds && matchedPriceId && !String(matchedPriceId).startsWith("local_")) {
        params.set(`line_items[${index}][price]`, matchedPriceId);
        params.set(`line_items[${index}][quantity]`, String(quantity));
        return;
      }
      params.set(`line_items[${index}][price_data][currency]`, product.currency || "usd");
      params.set(`line_items[${index}][price_data][product_data][name]`, product.display_name || product.name || "Downtown Perks plan");
      if (product.description) params.set(`line_items[${index}][price_data][product_data][description]`, String(product.description).slice(0, 400));
      params.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(Number(product.amount || 0) * 100)));
      const interval = String(product.interval || sourceLine.interval || sourceLine.cadence || "one_time").toLowerCase();
      if (interval && interval !== "one_time" && interval !== "one-time") {
        params.set(`line_items[${index}][price_data][recurring][interval]`, interval === "annual" ? "year" : interval);
      }
      params.set(`line_items[${index}][quantity]`, String(quantity));
    });
    params.set("metadata[organization_name]", organizationName);
    params.set("metadata[tenant_id]", checkoutRecord.tenant_id);
    if (promotionValidation?.code) params.set("metadata[promotion_code]", promotionValidation.code);

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const stripePayload = await stripeResponse.json();
    if (!stripeResponse.ok) {
      writeAuditEvent(db, req, { action: "checkout_session_failed", entity_type: "checkout", entity_id: checkoutRecord.id, after: stripePayload });
      await saveDatabase(db);
      return res.status(502).json({ error: "Stripe checkout session failed", details: stripePayload });
    }

    checkoutRecord.status = "created";
    checkoutRecord.stripe_checkout_session_id = stripePayload.id;
    checkoutRecord.checkout_url = stripePayload.url;
    ensureRecord(db.entities.PartnerInvoice, `invoice_${checkoutRecord.id}`, {
      tenant_id: checkoutRecord.tenant_id,
      workspace_id: checkoutRecord.workspace_id,
      billing_email: billingEmail,
      status: "checkout_created",
      provider: "stripe",
      checkout_session_id: stripePayload.id,
      hosted_invoice_url: stripePayload.url,
      subtotal,
      discount: promotionValidation?.discount || 0,
      total: checkoutRecord.total,
      currency: products[0]?.currency || "usd",
    });
    writeAuditEvent(db, req, { action: "stripe_checkout_session_created", entity_type: "checkout", entity_id: checkoutRecord.id, after: checkoutRecord });
    await saveDatabase(db);
    res.status(201).json({ success: true, checkout_session: checkoutRecord, stripe: stripePayload, checkout_url: stripePayload.url });
  });

  app.post("/api/stripe/webhook", async (req, res) => {
    const verification = verifyStripeWebhookSignature((req as any).rawBody, req.header("stripe-signature") || undefined);
    if (!verification.ok) return res.status(400).json({ error: verification.error || "Stripe webhook verification failed." });

    const event = req.body || {};
    const eventType = String(event.type || "");
    const object = event.data?.object || event.object || event;
    const stripeCheckoutId = String(object.id || object.checkout_session || "");
    const stripePaymentLinkId = String(object.payment_link || object.paymentLink || "");
    const hostedUrl = String(object.hosted_invoice_url || object.url || "");
    const customerEmail = String(object.customer_details?.email || object.customer_email || object.receipt_email || "").toLowerCase();
    const paidAmount = Number(object.amount_total ?? object.amount_paid ?? object.amount_received ?? 0) / 100;
    const paidEvents = new Set(["checkout.session.completed", "payment_intent.succeeded", "invoice.payment_succeeded", "invoice.paid"]);

    if (!eventType) return res.status(400).json({ error: "Stripe event type is required." });

    const invoice = db.entities.PartnerInvoice.find((item) => {
      const emailMatches = customerEmail && String(item.billing_email || "").toLowerCase() === customerEmail;
      return (
        item.checkout_session_id === stripeCheckoutId ||
        item.stripe_checkout_session_id === stripeCheckoutId ||
        item.stripe_payment_link_id === stripePaymentLinkId ||
        item.hosted_invoice_url === hostedUrl ||
        (emailMatches && (item.status === "pending_payment" || item.billing_status === "pending_payment"))
      );
    });
    const subscription = db.entities.PartnerSubscription.find((item) => {
      const emailMatches = customerEmail && String(item.billing_email || "").toLowerCase() === customerEmail;
      return item.tenant_id === invoice?.tenant_id || item.workspace_id === invoice?.workspace_id || emailMatches;
    });

    if (paidEvents.has(eventType)) {
      if (invoice) {
        Object.assign(invoice, {
          status: "paid",
          billing_status: "paid",
          provider: invoice.provider || "stripe",
          stripe_checkout_session_id: stripeCheckoutId || invoice.stripe_checkout_session_id || "",
          stripe_payment_link_id: stripePaymentLinkId || invoice.stripe_payment_link_id || "",
          amount_paid: paidAmount || invoice.total || invoice.amount_paid || 0,
          paid_at: now(),
          updated_at: now(),
          stripe_event_id: event.id || invoice.stripe_event_id || "",
        });
      }
      if (subscription) {
        Object.assign(subscription, {
          status: "active",
          billing_status: "paid",
          provider: subscription.provider || "stripe",
          payment_provider: "stripe",
          amount_paid: paidAmount || subscription.amount_paid || subscription.amount || 0,
          renewal_date: subscription.renewal_date || addOneYearIso(),
          updated_at: now(),
          stripe_event_id: event.id || subscription.stripe_event_id || "",
        });
      }
    }

    writeAuditEvent(db, req, {
      action: `stripe_${eventType.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`,
      entity_type: "stripe_webhook",
      entity_id: event.id || stripeCheckoutId || stripePaymentLinkId || makeId("stripe_event"),
      after: { event_type: eventType, invoice_id: invoice?.id || "", subscription_id: subscription?.id || "", customer_email: customerEmail },
      metadata: { source: "stripe_webhook" },
    });
    writeAnalyticsEvent(db, req, {
      event: "stripe_webhook_received",
      entity_type: "stripe_webhook",
      entity_id: event.id || stripeCheckoutId || stripePaymentLinkId || "",
      metadata: { event_type: eventType, invoice_id: invoice?.id || "", subscription_id: subscription?.id || "" },
    });
    await saveDatabase(db);
    res.json({ received: true, event_type: eventType, invoice_id: invoice?.id || null, subscription_id: subscription?.id || null });
  });

  app.get("/api/auth/me", (req, res) => {
    res.json(db.entities.User[0] || { id: "user_admin", role: "admin", name: "Demo Admin", email: "admin@downtownperks.local" });
  });

  app.post("/api/auth/signup", async (req, res) => {
    const snapshot = JSON.parse(JSON.stringify(db)) as Database;
    try {
      const email = String(req.body?.email || req.body?.contact?.email || "").trim().toLowerCase();
      if (!email) return res.status(400).json({ error: "Email is required." });
      const existing = db.entities.User.find((user) => String(user.email || "").toLowerCase() === email && !user.is_demo);
      if (existing) return res.status(409).json({ error: "That email already has an account." });
      const provisioned = provisionCompletePartnerWorkspace(db.entities, req.body || {});
      writeAuditEvent(db, req, {
        action: "partner_auth_signup_provisioned",
        entity_type: "User",
        entity_id: provisioned.user.id,
        after: { user_id: provisioned.user.id, organization_id: provisioned.organization.id, workspace_id: provisioned.workspace.id },
      });
      writeAnalyticsEvent(db, req, {
        event: "partner_auth_signup_provisioned",
        entity_type: "Workspace",
        entity_id: provisioned.workspace.id,
        ...organizationContext(provisioned.workspace),
      });
      await saveDatabase(db);
      res.status(201).json(provisioned);
    } catch (error) {
      db = snapshot;
      await saveDatabase(db);
      res.status(422).json({
        success: false,
        error: error instanceof Error ? error.message : "Workspace setup couldn't be completed.",
        retry_url: "/api/partner-platform/provision",
      });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const user = db.entities.User.find((item) => String(item.email || "").toLowerCase() === email && !item.is_demo);
    if (!user || !verifyPassword(password, user)) return res.status(401).json({ error: "That email and password did not match an account." });
    user.last_login = now();
    user.updated_at = now();
    const tenantSlug = user.preferences?.active_workspace_slug;
    const tenant = db.entities.PlatformTenant.find((item) => item.slug === tenantSlug) ||
      db.entities.PlatformTenant.find((item) => item.owner_id === user.profile_id) ||
      null;
    await saveDatabase(db);
    res.json({
      success: true,
      session: { token: buildSessionToken(user.id), user_id: user.id, profile_id: user.profile_id, workspace_id: tenant ? `workspace_${tenant.slug}` : "" },
      user: { id: user.id, email: user.email, name: user.name, role: user.role, email_verified: user.email_verified },
      workspace: tenant ? createWorkspaceBundle(db.entities, tenant) : null,
    });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.json({ success: true });
  });

  app.post("/api/auth/password-reset", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const user = db.entities.User.find((item) => String(item.email || "").toLowerCase() === email && !item.is_demo);
    if (user) {
      ensureRecord(db.entities.TenantNotification, `notification_password_reset_${slug(email)}_${Date.now()}`, {
        user_id: user.id,
        channel: "email",
        rule: "password_reset",
        status: process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY ? "queued" : "pending_email_credentials",
        title: "Password reset requested",
        body: "Password reset email requested for Downtown Perks partner workspace.",
      });
      await saveDatabase(db);
    }
    res.json({ success: true, message: "If that email exists, a reset link will be sent." });
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    const userId = String(req.body?.user_id || req.body?.id || "");
    const email = String(req.body?.email || "").trim().toLowerCase();
    const user = db.entities.User.find((item) => item.id === userId || String(item.email || "").toLowerCase() === email);
    if (!user) return res.status(404).json({ error: "User not found." });
    user.email_verified = true;
    user.status = "active";
    user.updated_at = now();
    await saveDatabase(db);
    res.json({ success: true, user: { id: user.id, email: user.email, email_verified: true } });
  });

  app.post("/api/partner-platform/provision", async (req, res) => {
    const snapshot = JSON.parse(JSON.stringify(db)) as Database;
    try {
      const provisioned = provisionCompletePartnerWorkspace(db.entities, req.body || {});
      writeAuditEvent(db, req, {
        action: "complete_partner_platform_provisioned",
        entity_type: "Workspace",
        entity_id: provisioned.workspace.id,
        after: { organization_id: provisioned.organization.id, workspace_id: provisioned.workspace.id, partner_id: provisioned.partner.id },
      });
      await saveDatabase(db);
      res.status(201).json(provisioned);
    } catch (error) {
      db = snapshot;
      await saveDatabase(db);
      res.status(422).json({
        success: false,
        error: error instanceof Error ? error.message : "Workspace setup couldn't be completed.",
        retry_url: "/api/partner-platform/provision",
      });
    }
  });

  app.post("/api/partner-platform/register", async (req, res) => {
    req.url = "/api/partner-platform/provision";
    const snapshot = JSON.parse(JSON.stringify(db)) as Database;
    try {
      const provisioned = provisionCompletePartnerWorkspace(db.entities, req.body || {});
      await saveDatabase(db);
      res.status(201).json(provisioned);
    } catch (error) {
      db = snapshot;
      await saveDatabase(db);
      res.status(422).json({ success: false, error: error instanceof Error ? error.message : "Workspace setup couldn't be completed." });
    }
  });

  app.get("/api/partner-platform/workspaces/:slug", (req, res) => {
    const tenant = db.entities.PlatformTenant.find((item) => item.slug === req.params.slug || item.id === req.params.slug);
    if (!tenant || tenant.is_demo) return res.status(404).json({ error: "Workspace not found." });
    res.json(createWorkspaceBundle(db.entities, tenant));
  });

  app.get("/api/partner-platform/status/:slug", (req, res) => {
    const tenant = db.entities.PlatformTenant.find((item) => item.slug === req.params.slug || item.id === req.params.slug);
    if (!tenant || tenant.is_demo) return res.status(404).json({ error: "Workspace not found." });
    const bundle = createWorkspaceBundle(db.entities, tenant);
    res.json({
      success: true,
      organization: Boolean(bundle.organization),
      workspace: Boolean(bundle.workspace),
      partnerProfile: Boolean(bundle.profile),
      subscription: Boolean(bundle.subscription),
      mapEntity: Boolean(bundle.mapLinks.length),
      campaignShell: Boolean(bundle.campaigns.length),
      reports: Boolean(bundle.reports.length),
      analytics: Boolean(bundle.analytics.length),
      qr: Boolean(bundle.qr.length),
      modules: bundle.modules.length,
      redirect: `/partner-workspace/overview?provisioned=1&workspace=${tenant.slug}`,
    });
  });

  app.get("/api/partner-platform/schema", (_req, res) => {
    res.json({
      source_of_truth: "json_persistence_ready_for_supabase_migration",
      collections: ["profiles", "organizations", "workspaces", "workspace_members", "partner_profiles", "partner_locations", "plans", "subscriptions", "workspace_addons", "billing_history", "campaigns", "perks", "events", "qr_experiences", "reports", "analytics"],
      current_entities: ["Profile", "Organization", "Workspace", "WorkspaceMember", "PartnerProfile", "PartnerLocation", "Plan", "PartnerSubscription", "WorkspaceAddon", "BillingHistory", "Campaign", "PerkLocation", "PartnerEvent", "PartnerQrExperience", "PartnerReport", "PartnerAnalytics"],
      external_integrations: {
        supabase: process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "configured" : "pending_credentials",
        stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "pending_credentials",
        email: process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY ? "configured" : "pending_credentials",
      },
    });
  });

  app.get("/api/billing/invoices", (req, res) => {
    res.json(listEntity(db, "PartnerInvoice", req.query));
  });

  app.get("/api/billing/subscriptions", (req, res) => {
    res.json(listEntity(db, "PartnerSubscription", req.query));
  });

  app.post("/api/billing/invoices", async (req, res) => {
    const payload = req.body || {};
    const id = payload.id || makeId("partner_invoice");
    const status = payload.status || "invoice_requested";
    const invoice = ensureRecord(db.entities.PartnerInvoice, id, {
      ...payload,
      id,
      status,
      billing_status: payload.billing_status || (status === "quote_ready" ? "quote" : "requested"),
      source: payload.source || "partner_workspace",
    });

    const action = status === "quote_ready" ? "billing_quote_created" : "billing_invoice_requested";
    ensureRecord(db.entities.TenantNotification, `notification_${id}`, {
      tenant_id: payload.tenant_id || payload.partner_id || "",
      organization_id: payload.organization_id || payload.tenant_id || payload.partner_id || "org_downtown_perks",
      workspace_id: payload.workspace_id || "",
      partner_id: payload.partner_id || payload.tenant_id || "",
      type: "billing",
      status: status === "quote_ready" ? "ready" : "requested",
      title: status === "quote_ready" ? "Quote ready" : "Invoice requested",
      body: `${payload.partner_name || "Partner"} ${status === "quote_ready" ? "created a quote" : "requested an invoice"} for ${payload.plan_label || "a partner plan"}.`,
      entity_type: "PartnerInvoice",
      entity_id: id,
      invoice_id: id,
      metadata: { total: payload.total, coupon: payload.coupon || "", selected_module: payload.selected_module || "" },
    });
    writeAuditEvent(db, req, {
      action,
      entity_type: "PartnerInvoice",
      entity_id: id,
      after: invoice,
      metadata: { source: "partner_workspace_billing" },
    });
    writeAnalyticsEvent(db, req, {
      event: action,
      entity_type: "PartnerInvoice",
      entity_id: id,
      source: "partner_workspace_billing",
      ...organizationContext(invoice),
      metadata: { total: payload.total, status, selected_module: payload.selected_module || "" },
    });
    await saveDatabase(db);
    res.status(201).json({ success: true, invoice });
  });

  app.patch("/api/billing/invoices/:id", async (req, res) => {
    const invoice = findEntityById(db.entities.PartnerInvoice, req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    const before = { ...invoice };
    const payload = req.body || {};
    const nextStatus = payload.action === "mark_paid" ? "paid" : payload.status || invoice.status;
    Object.assign(invoice, {
      ...payload,
      status: nextStatus,
      billing_status: payload.billing_status || (nextStatus === "paid" ? "paid" : invoice.billing_status || nextStatus),
      paid_at: nextStatus === "paid" ? payload.paid_at || invoice.paid_at || now() : invoice.paid_at,
      updated_at: now(),
    });
    writeAuditEvent(db, req, {
      action: payload.action === "mark_paid" ? "billing_invoice_marked_paid" : "billing_invoice_updated",
      entity_type: "PartnerInvoice",
      entity_id: invoice.id,
      before,
      after: invoice,
      metadata: { source: "billing_account_management" },
    });
    writeAnalyticsEvent(db, req, {
      event: payload.action === "mark_paid" ? "billing_invoice_marked_paid" : "billing_invoice_updated",
      entity_type: "PartnerInvoice",
      entity_id: invoice.id,
      source: "billing_account_management",
      ...organizationContext(invoice),
    });
    await saveDatabase(db);
    res.json({ success: true, invoice });
  });

  app.post("/api/billing/subscriptions", async (req, res) => {
    const payload = req.body || {};
    const id = payload.id || makeId("partner_subscription");
    const subscription = ensureRecord(db.entities.PartnerSubscription, id, {
      ...payload,
      id,
      status: payload.status || "active",
      billing_status: payload.billing_status || "invoice_ready",
      source: payload.source || "partner_workspace",
    });
    writeAuditEvent(db, req, {
      action: "partner_subscription_saved",
      entity_type: "PartnerSubscription",
      entity_id: id,
      after: subscription,
      metadata: { source: "partner_workspace_billing" },
    });
    writeAnalyticsEvent(db, req, {
      event: "partner_subscription_saved",
      entity_type: "PartnerSubscription",
      entity_id: id,
      source: "partner_workspace_billing",
      ...organizationContext(subscription),
    });
    await saveDatabase(db);
    res.status(201).json({ success: true, subscription });
  });

  app.patch("/api/billing/subscriptions/:id", async (req, res) => {
    const subscription = findEntityById(db.entities.PartnerSubscription, req.params.id);
    if (!subscription) return res.status(404).json({ error: "Subscription not found" });
    const before = { ...subscription };
    const payload = req.body || {};
    const action = String(payload.action || "update");
    const nextStatus = action === "cancel" ? "cancelled" : action === "activate" ? "active" : action === "renew" ? "active" : payload.status || subscription.status;
    Object.assign(subscription, {
      ...payload,
      status: nextStatus,
      billing_status: payload.billing_status || (nextStatus === "active" ? subscription.billing_status || "active" : nextStatus),
      renewal_date: action === "renew" ? addOneYearIso() : payload.renewal_date || subscription.renewal_date,
      cancelled_at: action === "cancel" ? payload.cancelled_at || now() : subscription.cancelled_at,
      updated_at: now(),
    });
    writeAuditEvent(db, req, {
      action: action === "cancel" ? "partner_subscription_cancelled" : action === "renew" ? "partner_subscription_renewed" : "partner_subscription_updated",
      entity_type: "PartnerSubscription",
      entity_id: subscription.id,
      before,
      after: subscription,
      metadata: { source: "billing_account_management" },
    });
    writeAnalyticsEvent(db, req, {
      event: action === "cancel" ? "partner_subscription_cancelled" : action === "renew" ? "partner_subscription_renewed" : "partner_subscription_updated",
      entity_type: "PartnerSubscription",
      entity_id: subscription.id,
      source: "billing_account_management",
      ...organizationContext(subscription),
    });
    await saveDatabase(db);
    res.json({ success: true, subscription });
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
        const snapshot = JSON.parse(JSON.stringify(db)) as Database;
        try {
          const provisioned = provisionCompletePartnerWorkspace(db.entities, body);
          writeAuditEvent(db, req, {
            action: "legacy_function_partner_workspace_provisioned",
            entity_type: "Workspace",
            entity_id: provisioned.workspace.id,
            after: { organization_id: provisioned.organization.id, workspace_id: provisioned.workspace.id, partner_id: provisioned.partner.id },
          });
          await saveDatabase(db);
          return res.json({ data: provisioned });
        } catch (error) {
          db = snapshot;
          await saveDatabase(db);
          return res.status(422).json({
            data: {
              success: false,
              error: error instanceof Error ? error.message : "Workspace setup couldn't be completed.",
              retry_url: "/api/partner-platform/provision",
            },
          });
        }
      }

      if (functionName === "provisionPartnerWorkspaceLegacy") {
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
        const planSubtotal = Number(checkout.subtotal ?? selectedPlan.amount ?? selectedPlan.price ?? 0);
        const annualDue = Number(checkout.annual_total ?? checkout.annual_commitment ?? selectedPlan.amount ?? selectedPlan.price ?? 0);
        const promotionCode = normalizePromotionCode(checkout.promotion_code || checkout.coupon || body.promotion_code || body.coupon);
        const promotionValidation = promotionCode ? validatePromotion(db.entities, {
          code: promotionCode,
          subtotal: planSubtotal,
          plan: selectedPlan.key || selectedPlan.name || selectedPlan.label,
          partner_type: organization.type || body.organizationType,
        }) : null;
        if (promotionValidation && !promotionValidation.valid) return res.status(422).json({ error: promotionValidation.reason, promotion: promotionValidation });

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

        const isPromotional = Boolean(promotionValidation?.valid && promotionValidation.total === 0);
        const subscriptionId = `subscription_${tenant.slug}`;
        const redemptionResult = isPromotional && !checkout.promotion_redemption_id ? redeemPromotion(db.entities, {
          code: promotionValidation?.code,
          subtotal: planSubtotal,
          tenant_id: tenant.id,
          organization_id: tenant.id,
          workspace_id: workspaceId,
          partner_id: partner.id,
          registration_id: registration.id,
          subscription_id: subscriptionId,
          plan: selectedPlan.key || selectedPlan.name || selectedPlan.label || "starter",
          partner_type: organization.type || body.organizationType || "",
        }) : null;

        ensureRecord(db.entities.PartnerSubscription, subscriptionId, {
          tenant_id: tenant.id,
          workspace_id: workspaceId,
          partner_id: partner.id,
          plan: selectedPlan.key || selectedPlan.name || "starter",
          plan_label: selectedPlan.label || selectedPlan.name || "Starter",
          cadence: selectedPlan.cadence || "annual",
          amount: annualDue,
          first_payment_amount: planSubtotal,
          annual_commitment: Number(checkout.annual_commitment || annualDue),
          selected_add_ons: checkout.selected_add_ons || [],
          status: "active",
          billing_status: isPromotional ? "promotional" : checkout.billing_status || "paid",
          provider: isPromotional ? "promotion" : checkout.provider || "local_checkout_ready_for_stripe",
          payment_provider: isPromotional ? "promotion" : checkout.payment_provider || checkout.provider || "local_checkout_ready_for_stripe",
          promotion_code: isPromotional ? promotionValidation?.code : checkout.coupon || checkout.promotion_code || "",
          promotion_id: isPromotional ? promotionValidation?.promotion_id : checkout.promotion_id || "",
          promotion_redemption_id: redemptionResult?.redemption?.id || checkout.promotion_redemption_id || "",
          amount_paid: isPromotional ? 0 : Number(checkout.total ?? planSubtotal),
          discount: isPromotional ? promotionValidation?.discount : Number(checkout.discount || 0),
          renewal_date: checkout.renewal_date || (isPromotional ? addOneYearIso() : null),
          billing_email: checkout.billing_email || contactEmail,
        });

        ensureRecord(db.entities.PartnerInvoice, `invoice_${tenant.slug}_latest`, {
          tenant_id: tenant.id,
          workspace_id: workspaceId,
          partner_id: partner.id,
          subscription_id: `subscription_${tenant.slug}`,
          invoice_number: `DP-${tenant.slug.toUpperCase().slice(0, 12)}-${new Date().getFullYear()}`,
          status: checkout.invoice_status || "paid",
          billing_status: isPromotional ? "promotional" : checkout.billing_status || "paid",
          provider: isPromotional ? "promotion" : checkout.provider || "local_checkout_ready_for_stripe",
          subtotal: planSubtotal,
          tax: Number(checkout.tax || 0),
          discount: isPromotional ? promotionValidation?.discount : Number(checkout.discount || 0),
          total: isPromotional ? 0 : Number(checkout.total ?? selectedPlan.amount ?? selectedPlan.price ?? 0),
          coupon: isPromotional ? promotionValidation?.code : checkout.coupon || "",
          promotion_code: isPromotional ? promotionValidation?.code : checkout.promotion_code || checkout.coupon || "",
          promotion_id: isPromotional ? promotionValidation?.promotion_id : checkout.promotion_id || "",
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

      if (functionName === "importDowntownPerksMapData") {
        const result = await importDowntownPerksMapData(db.entities);
        await saveDatabase(db);
        return res.json({ data: result });
      }

      if (functionName === "createWorkspaceAction") {
        const bundle = getWorkspaceBundle(body.tenant_id || body.tenant_slug || body.workspace_slug || "current");
        if (!bundle?.tenant || !bundle.workspace) return res.status(404).json({ error: "Workspace not found" });
        const actionType = String(body.action_type || body.type || "task").toLowerCase().replace(/[^a-z0-9]+/g, "_");
        const actor = body.actor || body.actor_email || "workspace@downtownperks.local";
        let record: EntityRecord;

        if (actionType === "create_offer" || actionType === "offer") {
          record = withTimestamps(
            {
              tenant_id: bundle.tenant.id,
              workspace_id: bundle.workspace.id,
              partner_id: bundle.partner?.id || null,
              title: body.title || "New workspace offer",
              description: body.description || "Offer created from the workspace action bar.",
              status: body.status || "draft",
              redemption_rules: body.redemption_rules || "Show resident card",
              source_type: "workspace_action",
            },
            makeId("partner_offer")
          );
          db.entities.PartnerOffer.push(record);
        } else if (actionType === "create_event" || actionType === "event") {
          record = withTimestamps(
            {
              tenant_id: bundle.tenant.id,
              workspace_id: bundle.workspace.id,
              partner_id: bundle.partner?.id || null,
              title: body.title || "New workspace event",
              status: body.status || "draft",
              event_types: body.event_types || ["Partner event"],
              source_type: "workspace_action",
            },
            makeId("partner_event")
          );
          db.entities.PartnerEvent.push(record);
        } else if (actionType === "new_campaign" || actionType === "launch_broadcast" || actionType === "campaign") {
          record = withTimestamps(
            {
              tenant_id: bundle.tenant.id,
              workspace_id: bundle.workspace.id,
              partner_id: bundle.partner?.id || null,
              title: body.title || (actionType === "launch_broadcast" ? "Workspace broadcast" : "New workspace campaign"),
              description: body.description || "Campaign created from the workspace action bar.",
              status: body.status || "draft",
              type: actionType === "launch_broadcast" ? "broadcast" : "campaign",
              reach: Number(body.reach || 0),
            },
            makeId("campaign")
          );
          db.entities.Campaign.push(record);
        } else if (actionType === "invite_team" || actionType === "team") {
          record = withTimestamps(
            {
              tenant_id: bundle.tenant.id,
              workspace_id: bundle.workspace.id,
              name: body.name || "Invited teammate",
              email: body.email || `invite-${Date.now()}@downtownperks.local`,
              role: body.role || "Manager",
              status: "pending",
            },
            makeId("tenant_user")
          );
          db.entities.TenantUser.push(record);
        } else if (actionType === "generate_qr" || actionType === "qr") {
          record = withTimestamps(
            {
              tenant_id: bundle.tenant.id,
              workspace_id: bundle.workspace.id,
              partner_id: bundle.partner?.id || null,
              label: body.label || "Workspace QR",
              destination_url: body.destination_url || "/workspace/home",
              status: "active",
              scans: 0,
            },
            makeId("qr")
          );
          db.entities.PartnerQrExperience.push(record);
        } else if (actionType === "update_profile" || actionType === "profile") {
          record = ensureRecord(db.entities.PartnerProfile, `profile_${bundle.tenant.slug}`, {
            tenant_id: bundle.tenant.id,
            workspace_id: bundle.workspace.id,
            partner_id: bundle.partner?.id || null,
            display_name: body.display_name || bundle.profile?.display_name || bundle.tenant.name,
            type: body.type || bundle.profile?.type || bundle.tenant.type,
            category: body.category || bundle.profile?.category || bundle.tenant.type,
            address: body.address || bundle.profile?.address || "",
            status: "active",
          });
        } else if (actionType === "generate_report" || actionType === "report") {
          record = withTimestamps(
            {
              tenant_id: bundle.tenant.id,
              workspace_id: bundle.workspace.id,
              report_types: ["Workspace Summary", "Campaign Performance", "Offer Activity"],
              status: "ready",
              generated_at: now(),
            },
            makeId("partner_report")
          );
          db.entities.PartnerReport.push(record);
        } else {
          record = withTimestamps(
            {
              tenant_id: bundle.tenant.id,
              workspace_id: bundle.workspace.id,
              channel: "workspace",
              rule: actionType,
              status: "active",
              message: body.message || "Workspace action recorded.",
            },
            makeId("tenant_notification")
          );
          db.entities.TenantNotification.push(record);
        }

        const audit = withTimestamps(
          {
            tenant_id: bundle.tenant.id,
            workspace_id: bundle.workspace.id,
            actor_id: actor,
            action: `workspace_action_${actionType}`,
            resource: record.id,
            before: null,
            after: record,
            timestamp: now(),
          },
          makeId("audit")
        );
        db.entities.TenantAuditLog.push(audit);
        await saveDatabase(db);
        return res.json({ data: { success: true, action_type: actionType, record, audit, workspace: getWorkspaceBundle(bundle.tenant.id) } });
      }

      if (functionName === "askWorkspaceAssistant") {
        const bundle = getWorkspaceBundle(body.tenant_id || body.tenant_slug || body.workspace_slug || "current");
        if (!bundle?.tenant || !bundle.workspace) return res.status(404).json({ error: "Workspace not found" });
        const prompt = String(body.prompt || "What should we do next?");
        const totals = {
          offers: bundle.offers.length,
          events: bundle.events.length,
          campaigns: bundle.campaigns.length,
          reports: bundle.reports.length,
          qr: bundle.qr.length,
          users: bundle.users.length,
          redemptions: Number(bundle.analytics?.[0]?.redemptions || 0),
          views: Number(bundle.analytics?.[0]?.views || 0),
        };
        const suggestedActions = [
          totals.offers === 0 ? "Create the first offer so the workspace has something residents can save or redeem." : "Review top offers and refresh the one with the lowest conversion.",
          totals.events === 0 ? "Create an event or activation tied to the next high-traffic window." : "Promote the next event with QR and resident messaging.",
          totals.qr === 0 ? "Generate a QR experience for the lobby, venue, event, or campaign." : "Check QR scans and move the strongest placement into a campaign.",
          totals.users <= 1 ? "Invite one teammate so operations are not tied to a single owner." : "Review permissions and keep reporting access limited to the right roles.",
        ];
        const responseText = `For ${bundle.tenant.name}, the workspace currently has ${totals.offers} offers, ${totals.events} events, ${totals.campaigns} campaigns, ${totals.qr} QR experiences, and ${totals.reports} report containers. Recommended next move: ${suggestedActions[0]}`;
        const insight = withTimestamps(
          {
            tenant_id: bundle.tenant.id,
            workspace_id: bundle.workspace.id,
            source: "workspace_assistant",
            insight_type: "assistant_response",
            prompt,
            summary: responseText,
            recommendations: suggestedActions,
            status: "generated",
          },
          makeId("ai_insight")
        );
        db.entities.AiInsight.push(insight);
        db.entities.TenantAuditLog.push(
          withTimestamps(
            {
              tenant_id: bundle.tenant.id,
              workspace_id: bundle.workspace.id,
              actor_id: body.actor || "workspace_assistant",
              action: "workspace_assistant_prompt",
              resource: insight.id,
              after: { prompt, response: responseText },
              timestamp: now(),
            },
            makeId("audit")
          )
        );
        await saveDatabase(db);
        return res.json({ data: { success: true, response: responseText, suggested_actions: suggestedActions, insight } });
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
        const sheetsExport = await appendRowsToGoogleSheet({ type: "survey_response", response: surveyResponse });
        const exportLog = withTimestamps(
          {
            survey_response_id: surveyResponse.id,
            status: sheetsExport.status === "success" ? "success" : sheetsExport.status === "pending_configuration" ? "pending" : "failed",
            destination: "google-sheets",
            attempted_at: now(),
            completed_at: sheetsExport.status === "success" ? now() : "",
            row_id: googleSheetExportRowId(sheetsExport),
            error: sheetsExport.error || "",
          },
          makeId("survey_export")
        );
        db.entities.SurveyExportLog.push(exportLog);
        surveyResponse.exported_to_google_sheets = sheetsExport.status === "success";
        surveyResponse.google_sheets_export_status = sheetsExport.status;
        await saveDatabase(db);
        return res.json({ data: { success: true, surveyResponse, notification, google_sheets: sheetsExport } });
      }

      if (functionName === "retryPendingSurveyExports") {
        const pending = db.entities.SurveyExportLog.filter((log) => log.status === "pending" || log.status === "failed");
        for (const log of pending) {
          const response = db.entities.SurveyResponse.find((item) => item.id === log.survey_response_id);
          const sheetsExport = await appendRowsToGoogleSheet({ type: "survey_response", response: response || log });
          log.status = sheetsExport.status === "success" ? "success" : sheetsExport.status === "pending_configuration" ? "pending" : "failed";
          log.completed_at = sheetsExport.status === "success" ? now() : "";
          log.row_id = googleSheetExportRowId(sheetsExport) || log.row_id || "";
          log.error = sheetsExport.error || "";
          log.updated_at = now();
          if (response) {
            response.exported_to_google_sheets = sheetsExport.status === "success";
            response.google_sheets_export_status = sheetsExport.status;
            response.updated_at = now();
          }
        }
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

      if (functionName === "exportSurveyDataToSheets") {
        const sheetsExport = await appendRowsToGoogleSheet({ type: body.type || "survey_response", ...body });
        const log = withTimestamps(
          {
            survey_response_id: body.response?.id || body.survey_response_id || "",
            status: sheetsExport.status === "success" ? "success" : sheetsExport.status === "pending_configuration" ? "pending" : "failed",
            destination: "google-sheets",
            attempted_at: now(),
            completed_at: sheetsExport.status === "success" ? now() : "",
            row_id: googleSheetExportRowId(sheetsExport),
            error: sheetsExport.error || "",
            payload_type: body.type || "survey_response",
          },
          makeId("survey_export")
        );
        db.entities.SurveyExportLog.push(log);
        await saveDatabase(db);
        return res.json({ data: { success: sheetsExport.status === "success", google_sheets: sheetsExport, export_log: log } });
      }

      if (["exportWeeklyResidentEngagement", "monthlyPartnerRedemptionReport", "sendMonthlyPartnerReports", "sendWeeklyPartnerSummary", "generatePartnerMonthlyReport", "generatePartnerReportOnDemand"].includes(functionName)) {
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

  app.post("/api/integrations/send-email", async (req, res) => {
    const body = req.body || {};
    const result = await sendEmailThroughResend(body);
    const notification = withTimestamps(
      {
        type: body.type || "email",
        title: body.subject || body.title || "Downtown Perks email",
        message: body.text || body.body || body.message || "",
        html: body.html || body.html_body || "",
        channel: "email",
        recipient_email: body.to || body.recipient || body.recipient_email || body.email || "",
        status: result.status,
        provider: result.provider,
        provider_message_id: result.provider_response?.id || "",
        provider_response: result.provider_response || null,
        error: result.error || "",
        queued_at: now(),
        sent_at: result.status === "sent" ? now() : "",
        tenant_id: body.tenant_id || body.organization_id || "",
        partner_id: body.partner_id || "",
        campaign_id: body.campaign_id || "",
      },
      makeId("notification")
    );
    db.entities.ManagementNotification.push(notification);
    writeAuditEvent(db, req, {
      action: result.status === "sent" ? "email_sent" : "email_send_pending",
      entity_type: "management_notification",
      entity_id: notification.id,
      after: notification,
      metadata: { provider: result.provider, status: result.status },
    });
    writeAnalyticsEvent(db, req, {
      event: "email_delivery_attempted",
      entity_type: "management_notification",
      entity_id: notification.id,
      metadata: { provider: result.provider, status: result.status, partner_id: body.partner_id || "" },
    });
    await saveDatabase(db);
    res.status(result.status === "invalid_request" ? 400 : result.status === "failed" ? 502 : result.status === "pending_credentials" ? 202 : 200).json({
      success: result.success,
      status: result.status,
      provider: result.provider,
      notification,
      error: result.error || "",
    });
  });

  app.get("/api/admin/properties", (req, res) => {
    res.json(getAdminPropertyPortfolio(db));
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
    const { rawData } = req.body || {};
    if (!rawData) return res.status(400).json({ error: "No raw data provided." });
    const provider = getProviderManager();
    if (!provider.metadata.configured) {
      return res.status(503).json({
        error: "OPENAI_API_KEY is not set on the server.",
        provider: provider.metadata.name,
        configured: false,
      });
    }

    try {
      const responseText = await provider.primary.chat([
        {
          role: "system",
          content: [
            "You extract property records for Downtown Perks.",
            "Return JSON only. No markdown.",
            "The response must be an array of objects.",
            "Each object must include: name, address, totalUnits, status, amenities, photos.",
            "Use status values only from: active, available, occupied, under maintenance, archived.",
            "If total units are not stated, use 0.",
            "If amenities or photos are not stated, return empty arrays.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Extract property records from this source text:\n\n${String(rawData).slice(0, 20000)}`,
        },
      ]);
      const cleaned = responseText.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      const parsed = cleaned ? JSON.parse(cleaned) : [];
      const records = (Array.isArray(parsed) ? parsed : [parsed]).map((item) => withTimestamps(upsertPropertyCompatibility(item), makeId("prop")));
      db.entities.Building.push(...records);
      writeAnalyticsEvent(db, req, { event: "properties_ai_ingested", entity_type: "property", entity_id: "properties_ingest", metadata: { provider: provider.metadata.name, model: provider.metadata.model, count: records.length } });
      writeAuditEvent(db, req, { action: "properties_ai_ingested", entity_type: "property", entity_id: "properties_ingest", after: { provider: provider.metadata.name, model: provider.metadata.model, count: records.length } });
      await saveDatabase(db);
      res.json({ records, count: records.length, provider: provider.metadata.name, model: provider.metadata.model });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to ingest data.", provider: provider.metadata.name });
    }
  });

  app.get("/api/cms/entities", (req, res) => {
    const q = String(req.query.q || "").toLowerCase();
    const category = String(req.query.category || "").toLowerCase();
    const status = String(req.query.status || "").toLowerCase();
    const records = db.entities.ContentEntity
      .filter((entity) => !entity.deleted_at)
      .filter((entity) => !q || `${entity.name || ""} ${entity.title || ""} ${entity.description || ""} ${entity.district || ""}`.toLowerCase().includes(q))
      .filter((entity) => !category || String(entity.category || "").toLowerCase() === category)
      .filter((entity) => !status || String(entity.status || "").toLowerCase() === status)
      .sort((a, b) => Number(a.priority || 999) - Number(b.priority || 999));
    res.json(records);
  });

  app.post("/api/cms/entities", async (req, res) => {
    const payload = req.body || {};
    if (!payload.name && !payload.title) return res.status(400).json({ error: "Name is required." });
    const record = withTimestamps(
      {
        organization_id: payload.organization_id || "org_downtown_perks",
        workspace_id: payload.workspace_id || "workspace_downtown_perks",
        status: payload.status || "draft",
        published: payload.published === true,
        verified: payload.verified === true,
        featured: payload.featured === true,
        priority: Number(payload.priority || db.entities.ContentEntity.length + 1),
        slug: payload.slug || slug(payload.name || payload.title).replace(/_/g, "-"),
        entity_type: payload.entity_type || "attraction",
        category: payload.category || "place",
        metadata: payload.metadata || {},
        ...payload,
      },
      payload.id || makeId("content")
    );
    db.entities.ContentEntity.push(record);
    writeAuditEvent(db, req, { action: "content_entity_created", entity_type: "content_entity", entity_id: record.id, after: record });
    writeAnalyticsEvent(db, req, { event: "content_entity_created", entity_type: "content_entity", entity_id: record.id, metadata: { category: record.category } });
    await saveDatabase(db);
    res.status(201).json(record);
  });

  app.get("/api/cms/entities/:id", (req, res) => {
    const entity = db.entities.ContentEntity.find((item) => item.id === req.params.id || item.slug === req.params.id);
    if (!entity || entity.deleted_at) return res.status(404).json({ error: "Content entity not found" });
    const relationships = db.entities.ContentRelationship.filter((item) => item.source_entity_id === entity.id || item.target_entity_id === entity.id);
    const collections = db.entities.ContentCollection.filter((collection) => Array.isArray(collection.entity_ids) && collection.entity_ids.includes(entity.id));
    const revisions = db.entities.ContentRevision.filter((revision) => revision.entity_id === entity.id);
    const workflow = db.entities.ContentPublishingWorkflow.find((item) => item.entity_id === entity.id);
    const analytics = db.entities.AnalyticsEvent.filter((event) => event.entity_id === entity.id);
    res.json({ ...entity, relationships, collections, revisions, workflow, analytics });
  });

  app.patch("/api/cms/entities/:id", async (req, res) => {
    const entity = db.entities.ContentEntity.find((item) => item.id === req.params.id || item.slug === req.params.id);
    if (!entity || entity.deleted_at) return res.status(404).json({ error: "Content entity not found" });
    const before = { ...entity };
    Object.assign(entity, req.body || {}, { updated_at: now() });
    const revision = withTimestamps(
      {
        entity_id: entity.id,
        version: db.entities.ContentRevision.filter((item) => item.entity_id === entity.id).length + 1,
        status: entity.status,
        summary: req.body?.revision_summary || "Content entity updated.",
        snapshot: entity,
        created_by: actorFromRequest(req),
      },
      makeId("revision")
    );
    db.entities.ContentRevision.push(revision);
    writeAuditEvent(db, req, { action: "content_entity_updated", entity_type: "content_entity", entity_id: entity.id, before, after: entity });
    writeAnalyticsEvent(db, req, { event: "content_entity_updated", entity_type: "content_entity", entity_id: entity.id, metadata: { status: entity.status } });
    await saveDatabase(db);
    res.json({ entity, revision });
  });

  app.post("/api/cms/entities/:id/publish", async (req, res) => {
    const entity = db.entities.ContentEntity.find((item) => item.id === req.params.id || item.slug === req.params.id);
    if (!entity || entity.deleted_at) return res.status(404).json({ error: "Content entity not found" });
    const before = { ...entity };
    entity.status = req.body?.scheduled_at ? "scheduled" : "published";
    entity.published = !req.body?.scheduled_at;
    entity.published_at = req.body?.scheduled_at ? "" : now();
    entity.updated_at = now();
    const workflow = ensureRecord(db.entities.ContentPublishingWorkflow, `workflow_${entity.id}`, {
      entity_id: entity.id,
      workflow_type: "content_publishing",
      state: entity.status,
      current_step: entity.status,
      scheduled_at: req.body?.scheduled_at || "",
      steps: ["draft", "review", "scheduled", "published", "archived"],
      next_action: entity.status === "scheduled" ? "Publish when the schedule opens." : "Watch performance and keep details current.",
    });
    workflow.state = entity.status;
    workflow.current_step = entity.status;
    workflow.updated_at = now();
    writeAuditEvent(db, req, { action: "content_entity_published", entity_type: "content_entity", entity_id: entity.id, before, after: entity });
    writeAnalyticsEvent(db, req, { event: "content_entity_published", entity_type: "content_entity", entity_id: entity.id });
    await saveDatabase(db);
    res.json({ entity, workflow });
  });

  app.post("/api/cms/entities/:id/archive", async (req, res) => {
    const entity = db.entities.ContentEntity.find((item) => item.id === req.params.id || item.slug === req.params.id);
    if (!entity || entity.deleted_at) return res.status(404).json({ error: "Content entity not found" });
    const before = { ...entity };
    entity.status = "archived";
    entity.published = false;
    entity.archived_at = now();
    entity.updated_at = now();
    writeAuditEvent(db, req, { action: "content_entity_archived", entity_type: "content_entity", entity_id: entity.id, before, after: entity });
    writeAnalyticsEvent(db, req, { event: "content_entity_archived", entity_type: "content_entity", entity_id: entity.id });
    await saveDatabase(db);
    res.json(entity);
  });

  app.get("/api/cms/collections", (req, res) => {
    res.json(db.entities.ContentCollection.filter((collection) => !collection.deleted_at));
  });

  app.post("/api/cms/collections", async (req, res) => {
    if (!req.body?.title) return res.status(400).json({ error: "Title is required." });
    const record = withTimestamps(
      {
        organization_id: req.body.organization_id || "org_downtown_perks",
        workspace_id: req.body.workspace_id || "workspace_downtown_perks",
        status: req.body.status || "draft",
        slug: req.body.slug || slug(req.body.title).replace(/_/g, "-"),
        entity_ids: Array.isArray(req.body.entity_ids) ? req.body.entity_ids : [],
        rules: req.body.rules || {},
        ...req.body,
      },
      req.body.id || makeId("collection")
    );
    db.entities.ContentCollection.push(record);
    writeAuditEvent(db, req, { action: "content_collection_created", entity_type: "content_collection", entity_id: record.id, after: record });
    await saveDatabase(db);
    res.status(201).json(record);
  });

  app.patch("/api/cms/collections/:id", async (req, res) => {
    const collection = db.entities.ContentCollection.find((item) => item.id === req.params.id || item.slug === req.params.id);
    if (!collection || collection.deleted_at) return res.status(404).json({ error: "Collection not found" });
    const before = { ...collection };
    Object.assign(collection, req.body || {}, { updated_at: now() });
    writeAuditEvent(db, req, { action: "content_collection_updated", entity_type: "content_collection", entity_id: collection.id, before, after: collection });
    await saveDatabase(db);
    res.json(collection);
  });

  app.post("/api/cms/relationships/generate", async (req, res) => {
    const sourceId = req.body?.entity_id || req.body?.source_entity_id;
    const source = db.entities.ContentEntity.find((item) => item.id === sourceId || item.slug === sourceId);
    if (!source) return res.status(404).json({ error: "Source entity not found" });
    const candidates = db.entities.ContentEntity
      .filter((item) => item.id !== source.id && !item.deleted_at)
      .map((target) => {
        const sameDistrict = source.district && source.district === target.district;
        const sameCategory = source.category && source.category === target.category;
        const score = (sameDistrict ? 50 : 0) + (sameCategory ? 25 : 0) + Math.max(0, 25 - Math.abs(Number(source.priority || 0) - Number(target.priority || 0)));
        return { target, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(req.body?.limit || 8));
    const relationships = candidates.map(({ target, score }) =>
      ensureRecord(db.entities.ContentRelationship, `rel_${source.id}_${target.id}`, {
        source_entity_id: source.id,
        target_entity_id: target.id,
        relationship_type: source.category === target.category ? "related_category" : "nearby_context",
        score,
        status: "suggested",
        editable: true,
      })
    );
    writeAuditEvent(db, req, { action: "content_relationships_generated", entity_type: "content_entity", entity_id: source.id, after: { count: relationships.length } });
    await saveDatabase(db);
    res.json({ source, relationships });
  });

  app.get("/api/cms/workflows", (req, res) => {
    res.json({
      publishing: db.entities.ContentPublishingWorkflow,
      automations: db.entities.AutomationRun.filter((item) => String(item.target || "").includes("content") || String(item.name || "").toLowerCase().includes("cms")),
      requiredStates: ["draft", "review", "scheduled", "published", "archived"],
      conditionalLogic: [
        "If status is draft, hide from public map and resident panels.",
        "If scheduled_at is in the future, keep admin preview active and public visibility off.",
        "If published, include in map entities, collections, search, analytics, and reports.",
        "If archived, preserve revisions and analytics while hiding from public surfaces.",
      ],
    });
  });

  app.get("/api/map/entities", (req, res) => {
    res.json(mapEntityRows(db));
  });

  app.get("/api/map/pins", (req, res) => {
    res.json(
      mapEntityRows(db).map((entity) => ({
        id: entity.map_entity_id || entity.id,
        entity_id: entity.entity_id,
        entity_type: entity.entity_type,
        lat: entity.lat,
        lng: entity.lng,
        title: entity.title,
        category: entity.category,
        district: entity.district,
        status: entity.status,
        visibility: entity.visibility,
        partner_id: entity.partner_id,
        analytics_summary: entity.analytics_summary,
      }))
    );
  });

  app.get("/api/map/entities/:id", (req, res) => {
    const entity = mapEntityRows(db).find((item) => item.id === req.params.id || item.entity_id === req.params.id || item.map_entity_id === req.params.id);
    if (!entity) return res.status(404).json({ error: "Map entity not found" });
    const partner = entity.partner_id ? db.entities.Partner.find((item) => item.id === entity.partner_id) : null;
    const perks = db.entities.PerkLocation.filter((item) => item.id === entity.perk_id || item.partner_id === entity.partner_id || item.tenant_id === entity.tenant_id);
    const events = db.entities.Event.filter((item) => item.id === entity.event_id || item.partner_id === entity.partner_id || item.tenant_id === entity.tenant_id);
    const campaigns = db.entities.Campaign.filter((item) => item.id === entity.campaign_id || item.partner_id === entity.partner_id || item.tenant_id === entity.tenant_id);
    res.json({ ...entity, partner, perks, events, campaigns });
  });

  app.post("/api/map/events", async (req, res) => {
    const payload = req.body || {};
    const analytics = writeAnalyticsEvent(db, req, {
      event: payload.event || "map_interaction",
      entity_type: payload.entity_type || "map_entity",
      entity_id: payload.entity_id || payload.map_entity_id || "",
      mode: payload.mode,
      tenant_id: payload.tenant_id || payload.organization_id,
      workspace_id: payload.workspace_id,
      metadata: payload,
    });
    const audit = writeAuditEvent(db, req, {
      action: analytics.event,
      entity_type: analytics.entity_type,
      entity_id: analytics.entity_id,
      after: analytics,
      metadata: { source: "product_map" },
    });
    await saveDatabase(db);
    res.status(201).json({ success: true, analytics, audit });
  });

  app.get("/api/events", (req, res) => {
    res.json(db.entities.Event.filter((event) => !event.deleted_at));
  });

  app.post("/api/events", async (req, res) => {
    const record = withTimestamps({ status: "draft", registered_count: 0, ...req.body }, makeId("event"));
    db.entities.Event.push(record);
    writeAuditEvent(db, req, { action: "event_created", entity_type: "event", entity_id: record.id, after: record });
    writeAnalyticsEvent(db, req, { event: "record_created", entity_type: "event", entity_id: record.id, ...organizationContext(record) });
    await saveDatabase(db);
    res.status(201).json(record);
  });

  app.patch("/api/events/:id", async (req, res) => {
    const event = findEntityById(db.entities.Event, req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const before = { ...event };
    Object.assign(event, req.body || {}, { updated_at: now() });
    writeAuditEvent(db, req, { action: "event_updated", entity_type: "event", entity_id: event.id, before, after: event });
    writeAnalyticsEvent(db, req, { event: "record_updated", entity_type: "event", entity_id: event.id, ...organizationContext(event) });
    await saveDatabase(db);
    res.json(event);
  });

  app.post("/api/events/:id/rsvp", async (req, res) => {
    const event = findEntityById(db.entities.Event, req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (Number(event.capacity || 0) > 0 && Number(event.registered_count || 0) >= Number(event.capacity)) {
      return res.status(409).json({ error: "Event capacity reached", status: "full" });
    }
    const rsvp = withTimestamps(
      {
        event_id: event.id,
        event_name: event.title,
        event_date: event.date,
        tenant_id: req.body?.tenant_id || req.body?.resident_id || "",
        resident_email: req.body?.resident_email || req.body?.email || "",
        status: "registered",
        registered_at: now(),
      },
      makeId("rsvp")
    );
    db.entities.EventRSVP.push(rsvp);
    event.registered_count = Number(event.registered_count || 0) + 1;
    event.updated_at = now();
    writeAnalyticsEvent(db, req, { event: "event_rsvp", entity_type: "event", entity_id: event.id, ...organizationContext(event), metadata: rsvp });
    writeAuditEvent(db, req, { action: "event_rsvp_created", entity_type: "event", entity_id: event.id, after: rsvp });
    await saveDatabase(db);
    res.status(201).json({ success: true, rsvp, event });
  });

  app.post("/api/events/:id/check-in", async (req, res) => {
    const event = findEntityById(db.entities.Event, req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const rsvp = db.entities.EventRSVP.find((item) => item.id === req.body?.rsvp_id || (item.event_id === event.id && item.resident_email === req.body?.resident_email));
    if (rsvp) Object.assign(rsvp, { status: "checked_in", checked_in_at: now(), updated_at: now() });
    writeAnalyticsEvent(db, req, { event: "event_check_in", entity_type: "event", entity_id: event.id, ...organizationContext(event), metadata: req.body || {} });
    writeAuditEvent(db, req, { action: "event_check_in_recorded", entity_type: "event", entity_id: event.id, after: rsvp || req.body });
    await saveDatabase(db);
    res.json({ success: true, event, rsvp: rsvp || null });
  });

  app.post("/api/events/:id/follow-up", async (req, res) => {
    const event = findEntityById(db.entities.Event, req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const run = withTimestamps(
      { name: "Event Follow-Up", status: "queued", trigger: "event_completed", action: "send_follow_up_survey", event_id: event.id, last_run: now(), logs: [{ at: now(), message: "Follow-up survey queued" }] },
      makeId("automation")
    );
    db.entities.AutomationRun.push(run);
    writeAuditEvent(db, req, { action: "event_follow_up_queued", entity_type: "event", entity_id: event.id, after: run });
    await saveDatabase(db);
    res.json({ success: true, automation_run: run });
  });

  app.get("/api/campaigns", (req, res) => {
    res.json(db.entities.Campaign.filter((campaign) => !campaign.deleted_at));
  });

  app.post("/api/campaigns", async (req, res) => {
    const record = withTimestamps({ status: "draft", opens: 0, clicks: 0, conversions: 0, ...req.body }, makeId("campaign"));
    db.entities.Campaign.push(record);
    writeAuditEvent(db, req, { action: "campaign_created", entity_type: "campaign", entity_id: record.id, after: record });
    writeAnalyticsEvent(db, req, { event: "record_created", entity_type: "campaign", entity_id: record.id, ...organizationContext(record) });
    await saveDatabase(db);
    res.status(201).json(record);
  });

  app.patch("/api/campaigns/:id", async (req, res) => {
    const campaign = findEntityById(db.entities.Campaign, req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    const before = { ...campaign };
    Object.assign(campaign, req.body || {}, { updated_at: now() });
    writeAuditEvent(db, req, { action: "campaign_updated", entity_type: "campaign", entity_id: campaign.id, before, after: campaign });
    writeAnalyticsEvent(db, req, { event: "record_updated", entity_type: "campaign", entity_id: campaign.id, ...organizationContext(campaign) });
    await saveDatabase(db);
    res.json(campaign);
  });

  const updateCampaignStatus = async (req: express.Request, res: express.Response, status: string) => {
    const campaign = findEntityById(db.entities.Campaign, req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    const before = { ...campaign };
    Object.assign(campaign, { status, updated_at: now(), published_at: status === "active" ? now() : campaign.published_at });
    writeAuditEvent(db, req, { action: `campaign_${status}`, entity_type: "campaign", entity_id: campaign.id, before, after: campaign });
    writeAnalyticsEvent(db, req, { event: `campaign_${status}`, entity_type: "campaign", entity_id: campaign.id, ...organizationContext(campaign) });
    await saveDatabase(db);
    return res.json(campaign);
  };

  app.post("/api/campaigns/:id/publish", (req, res) => updateCampaignStatus(req, res, "active"));
  app.post("/api/campaigns/:id/pause", (req, res) => updateCampaignStatus(req, res, "paused"));
  app.post("/api/campaigns/:id/archive", (req, res) => updateCampaignStatus(req, res, "archived"));

  app.get("/api/residents", (req, res) => {
    res.json(db.entities.Tenant.filter((tenant) => !tenant.deleted_at));
  });

  app.post("/api/residents", async (req, res) => {
    const record = withTimestamps({ status: "active", perks_enrolled: false, ...req.body }, makeId("resident"));
    db.entities.Tenant.push(record);
    writeAuditEvent(db, req, { action: "resident_created", entity_type: "resident", entity_id: record.id, after: record });
    await saveDatabase(db);
    res.status(201).json(record);
  });

  app.patch("/api/residents/:id", async (req, res) => {
    const resident = findEntityById(db.entities.Tenant, req.params.id);
    if (!resident) return res.status(404).json({ error: "Resident not found" });
    const before = { ...resident };
    Object.assign(resident, req.body || {}, { updated_at: now() });
    writeAuditEvent(db, req, { action: "resident_updated", entity_type: "resident", entity_id: resident.id, before, after: resident });
    await saveDatabase(db);
    res.json(resident);
  });

  app.post("/api/residents/:id/segment", async (req, res) => {
    const resident = findEntityById(db.entities.Tenant, req.params.id);
    if (!resident) return res.status(404).json({ error: "Resident not found" });
    const segments = Array.isArray(resident.segments) ? resident.segments : [];
    const segmentId = req.body?.segment_id || req.body?.segment || "segment_manual";
    if (!segments.includes(segmentId)) segments.push(segmentId);
    resident.segments = segments;
    resident.updated_at = now();
    writeAuditEvent(db, req, { action: "resident_segment_assigned", entity_type: "resident", entity_id: resident.id, after: { segment_id: segmentId } });
    await saveDatabase(db);
    res.json({ success: true, resident });
  });

  app.get("/api/residents/:id/activity", (req, res) => {
    const resident = findEntityById(db.entities.Tenant, req.params.id);
    if (!resident) return res.status(404).json({ error: "Resident not found" });
    res.json({
      resident,
      redemptions: db.entities.PerkRedemption.filter((item) => item.user_email === resident.email || item.tenant_id === resident.id),
      rsvps: db.entities.EventRSVP.filter((item) => item.tenant_id === resident.id || item.resident_email === resident.email),
      surveys: db.entities.SurveyResponse.filter((item) => item.resident_id === resident.id || item.resident_email === resident.email),
      analytics: db.entities.AnalyticsEvent.filter((item) => item.actor_id === resident.id || item.metadata?.resident_id === resident.id),
    });
  });

  app.get("/api/partners", (req, res) => {
    res.json(db.entities.Partner.filter((partner) => !partner.deleted_at));
  });

  app.post("/api/partners", async (req, res) => {
    const record = withTimestamps({ status: "active", onboarding_stage: "created", ...req.body }, makeId("partner"));
    db.entities.Partner.push(record);
    const tenant = provisionPlatformTenant(db.entities, { ...record, name: record.business_name || record.name, type: record.category, source_type: "partner", source_id: record.id, partner_id: record.id });
    writeAuditEvent(db, req, { action: "partner_created", entity_type: "partner", entity_id: record.id, after: record });
    await saveDatabase(db);
    res.status(201).json({ partner: record, tenant });
  });

  app.patch("/api/partners/:id", async (req, res) => {
    const partner = findEntityById(db.entities.Partner, req.params.id);
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    const before = { ...partner };
    Object.assign(partner, req.body || {}, { updated_at: now() });
    writeAuditEvent(db, req, { action: "partner_updated", entity_type: "partner", entity_id: partner.id, before, after: partner });
    await saveDatabase(db);
    res.json(partner);
  });

  app.post("/api/partners/:id/provision-workspace", async (req, res) => {
    const partner = findEntityById(db.entities.Partner, req.params.id);
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    const tenant = provisionPlatformTenant(db.entities, { ...partner, name: partner.business_name || partner.name, type: partner.category, source_type: "partner", source_id: partner.id, partner_id: partner.id });
    writeAuditEvent(db, req, { action: "partner_workspace_provisioned", entity_type: "partner", entity_id: partner.id, after: tenant });
    await saveDatabase(db);
    res.json({ success: true, tenant, workspace: db.entities.TenantWorkspace.find((item) => item.tenant_id === tenant?.id) || null });
  });

  app.get("/api/reports", (req, res) => {
    res.json(db.entities.PartnerReport);
  });

  app.post("/api/reports/run", async (req, res) => {
    const payload = {
      report_type: req.body?.report_type || "platform_summary",
      requested_by: actorFromRequest(req),
      status: "completed",
      generated_at: now(),
      totals: {
        partners: db.entities.Partner.length,
        properties: getAdminPropertyPortfolio(db).length,
        perks: db.entities.PerkLocation.length,
        events: db.entities.Event.length,
        campaigns: db.entities.Campaign.length,
        redemptions: db.entities.PerkRedemption.length,
      },
    };
    const run = withTimestamps(payload, makeId("report_run"));
    db.entities.ReportRun.push(run);
    writeAuditEvent(db, req, { action: "report_generated", entity_type: "report", entity_id: run.id, after: run });
    await saveDatabase(db);
    res.status(201).json(run);
  });

  app.get("/api/reports/:id/export", (req, res) => {
    const report = findEntityById(db.entities.ReportRun, req.params.id) || findEntityById(db.entities.PartnerReport, req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json({ id: report.id, export_type: "json", generated_at: now(), data: report });
  });

  app.get("/api/analytics/summary", (req, res) => {
    const events = db.entities.AnalyticsEvent;
    res.json({
      map_views: events.filter((event) => event.event === "pin_viewed" || event.event === "map_interaction").length,
      pin_views: events.filter((event) => event.event === "pin_viewed").length,
      drawer_opens: events.filter((event) => event.event === "drawer_opened").length,
      directions_clicks: events.filter((event) => event.event === "directions_clicked").length,
      saves: events.filter((event) => event.event === "save_clicked").length,
      shares: events.filter((event) => event.event === "share_clicked").length,
      perk_redemptions: db.entities.PerkRedemption.length,
      event_rsvps: db.entities.EventRSVP.length,
      qr_scans: db.entities.QrScan.length,
      ai_interactions: events.filter((event) => String(event.event).startsWith("ai_")).length,
      campaigns: db.entities.Campaign.length,
      reports: db.entities.ReportRun.length + db.entities.PartnerReport.length,
    });
  });

  app.post("/api/analytics/events", async (req, res) => {
    const event = writeAnalyticsEvent(db, req, req.body || {});
    await saveDatabase(db);
    res.status(201).json(event);
  });

  app.get("/api/automations", (req, res) => {
    res.json(db.entities.AutomationRun);
  });

  app.get("/api/automations/runs", (req, res) => {
    res.json(db.entities.AutomationRun);
  });

  app.post("/api/automations/:id/run", async (req, res) => {
    const existing = findEntityById(db.entities.AutomationRun, req.params.id);
    const run = withTimestamps(
      {
        name: existing?.name || req.params.id,
        provider: existing?.provider || "local",
        status: "completed",
        trigger: existing?.trigger || "manual",
        action: existing?.action || "manual_run",
        last_run: now(),
        success_count: Number(existing?.success_count || 0) + 1,
        failure_count: Number(existing?.failure_count || 0),
        logs: [{ at: now(), message: "Manual automation run completed in local operations platform." }],
      },
      makeId("automation")
    );
    db.entities.AutomationRun.push(run);
    writeAuditEvent(db, req, { action: "automation_run_completed", entity_type: "automation", entity_id: run.id, after: run });
    await saveDatabase(db);
    res.status(201).json(run);
  });

  app.get("/api/integrations/status", (req, res) => {
    const defaults: Array<{ provider: string; groups: string[][] }> = [
      { provider: "Tally Webhooks", groups: [["TALLY_WEBHOOK_SECRET"]] },
      { provider: "Twilio Verify", groups: [["TWILIO_ACCOUNT_SID"], ["TWILIO_AUTH_TOKEN", "TWILIO_API_SECRET"], ["TWILIO_VERIFY_SERVICE_SID"]] },
      { provider: "Twilio Messaging", groups: [["TWILIO_ACCOUNT_SID"], ["TWILIO_AUTH_TOKEN", "TWILIO_API_SECRET"], ["TWILIO_PHONE_NUMBER", "TWILIO_MESSAGING_SERVICE_SID"]] },
      { provider: "Supabase Auth / Operational Store", groups: [["SUPABASE_URL", "VITE_SUPABASE_URL"], ["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"], ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY"]] },
      { provider: "n8n Workflow Orchestration", groups: [["N8N_WEBHOOK_URL", "N8N_BASE_URL"], ["N8N_API_KEY", "N8N_AUTH_TOKEN"]] },
      { provider: "OpenAI Insights", groups: [["OPENAI_API_KEY"]] },
      { provider: "Email Delivery", groups: [["RESEND_API_KEY"]] },
      { provider: "Google Sheets / Reports DB", groups: [["GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_EMAIL"], ["GOOGLE_SHEETS_PRIVATE_KEY", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "GOOGLE_SERVICE_ACCOUNT_JSON"], ["GOOGLE_SHEETS_SPREADSHEET_ID", "GOOGLE_SHEETS_REPORTS_SPREADSHEET_ID"]] },
      { provider: "Google Maps / Places", groups: [["GOOGLE_MAPS_API_KEY", "GOOGLE_PLACES_API_KEY", "VITE_GOOGLE_MAPS_API_KEY"]] },
      { provider: "Stripe", groups: [["STRIPE_SECRET_KEY"], ["STRIPE_WEBHOOK_SECRET"]] },
      { provider: "Storage Provider", groups: [["STORAGE_BUCKET", "BLOB_READ_WRITE_TOKEN", "VERCEL_BLOB_READ_WRITE_TOKEN", "S3_BUCKET", "AWS_S3_BUCKET", "SUPABASE_STORAGE_BUCKET"]] },
    ];
    const records = defaults.map(({ provider, groups }) => {
      const envKeys = groups.flat();
      const configured = groups.every((group) => group.some((key) => Boolean(process.env[key])));
      const missingGroups = groups
        .filter((group) => !group.some((key) => Boolean(process.env[key])))
        .map((group) => group.join(" or "));
      const stored = db.entities.IntegrationStatus.find((item) => item.provider === provider)
        || db.entities.IntegrationEndpoint.find((item) => item.name === provider || item.provider === provider);
      return {
        id: stored?.id || `integration_${slug(provider)}`,
        provider,
        status: configured ? "configured" : stored?.status || "pending_credentials",
        required_env_vars: envKeys,
        accepted_env_groups: groups,
        missing_env_groups: missingGroups,
        last_tested: stored?.last_tested || "",
        last_success: stored?.last_success || "",
        logs: stored?.logs || [],
        responsible_module: stored?.responsible_module || "platform",
      };
    });
    res.json(records);
  });

  app.post("/api/integrations/:id/test", async (req, res) => {
    const id = req.params.id;
    const status = withTimestamps(
      {
        provider: req.body?.provider || id,
        status: req.body?.env_key && process.env[req.body.env_key] ? "configured" : "pending_credentials",
        last_tested: now(),
        last_success: req.body?.env_key && process.env[req.body.env_key] ? now() : "",
        logs: [{ at: now(), message: "Local credential availability checked. External provider call skipped unless credentials are configured." }],
      },
      `integration_${slug(id)}`
    );
    ensureRecord(db.entities.IntegrationStatus, status.id, status);
    writeAuditEvent(db, req, { action: "integration_tested", entity_type: "integration", entity_id: status.id, after: status });
    await saveDatabase(db);
    res.json(status);
  });

  app.get("/api/google-sheets/status", (req, res) => {
    const config = googleSheetsConfig();
    res.json({
      provider: "Google Sheets",
      status: googleSheetsReady() ? "configured" : "pending_credentials",
      spreadsheet_id: config.spreadsheetId ? "configured" : "",
      default_range: config.defaultRange,
      survey_range: config.surveyRange,
      lead_range: config.leadRange,
      report_range: config.reportRange,
      required_env_vars: ["GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_SHEETS_PRIVATE_KEY", "GOOGLE_SHEETS_SPREADSHEET_ID"],
      missing_env_vars: [
        !config.clientEmail ? "GOOGLE_SHEETS_CLIENT_EMAIL" : "",
        !config.privateKey ? "GOOGLE_SHEETS_PRIVATE_KEY" : "",
        !config.spreadsheetId ? "GOOGLE_SHEETS_SPREADSHEET_ID" : "",
      ].filter(Boolean),
    });
  });

  app.post("/api/google-sheets/test", async (req, res) => {
    const result = await appendRowsToGoogleSheet({
      type: "integration_test",
      range: req.body?.range,
      record: {
        id: makeId("sheets_test"),
        name: "Downtown Perks Google Sheets test",
        status: "test",
        notes: "Credential and append test from the operations app.",
      },
    });
    const status = withTimestamps(
      {
        provider: "Google Sheets / Reports DB",
        status: result.status === "success" ? "configured" : result.status === "pending_configuration" ? "pending_credentials" : "failed",
        last_tested: now(),
        last_success: result.status === "success" ? now() : "",
        responsible_module: "reports",
        logs: [{ at: now(), message: result.status === "success" ? "Google Sheets append test completed." : result.error || "Google Sheets setup is incomplete." }],
      },
      "integration_google_sheets_reports_db"
    );
    ensureRecord(db.entities.IntegrationStatus, status.id, status);
    await saveDatabase(db);
    res.status(result.status === "failed" ? 502 : 200).json({ ...result, integration: status });
  });

  app.post("/api/google-sheets/append", async (req, res) => {
    const result = await appendRowsToGoogleSheet(req.body || {});
    const log = withTimestamps(
      {
        survey_response_id: req.body?.response?.id || req.body?.survey_response_id || "",
        status: result.status === "success" ? "success" : result.status === "pending_configuration" ? "pending" : "failed",
        destination: "google-sheets",
        attempted_at: now(),
        completed_at: result.status === "success" ? now() : "",
        row_id: googleSheetExportRowId(result),
        error: result.error || "",
        payload_type: req.body?.type || "manual_append",
      },
      makeId("survey_export")
    );
    db.entities.SurveyExportLog.push(log);
    await saveDatabase(db);
    res.status(result.status === "failed" ? 502 : 200).json({ ...result, export_log: log });
  });

  app.post("/api/google-sheets/export-surveys", async (_req, res) => {
    const pendingResponses = db.entities.SurveyResponse.filter((response) => !response.exported_to_google_sheets);
    const results = [];
    for (const response of pendingResponses) {
      const result = await appendRowsToGoogleSheet({ type: "survey_response", response });
      response.exported_to_google_sheets = result.status === "success";
      response.google_sheets_export_status = result.status;
      response.updated_at = now();
      db.entities.SurveyExportLog.push(withTimestamps({
        survey_response_id: response.id,
        status: result.status === "success" ? "success" : result.status === "pending_configuration" ? "pending" : "failed",
        destination: "google-sheets",
        attempted_at: now(),
        completed_at: result.status === "success" ? now() : "",
        row_id: googleSheetExportRowId(result),
        error: result.error || "",
      }, makeId("survey_export")));
      results.push({ survey_response_id: response.id, status: result.status, error: result.error || "" });
    }
    await saveDatabase(db);
    res.json({ success: true, attempted: pendingResponses.length, results });
  });

  app.get("/api/qr/:id", (req, res) => {
    const qr = findEntityById(db.entities.PartnerQrExperience, req.params.id);
    if (!qr) return res.status(404).json({ error: "QR code not found" });
    res.json(qr);
  });

  app.post("/api/qr/scan", async (req, res) => {
    const qrId = req.body?.qr_id || req.body?.id;
    const qr = qrId ? findEntityById(db.entities.PartnerQrExperience, qrId) : null;
    if (!qr) {
      const failed = withTimestamps({ qr_id: qrId || "", status: "invalid", scanned_at: now(), source: req.body?.source || "unknown" }, makeId("qr_scan"));
      db.entities.QrScan.push(failed);
      await saveDatabase(db);
      return res.status(404).json({ error: "QR code not found", scan: failed });
    }
    const scan = withTimestamps(
      {
        qr_id: qr.id,
        organization_id: qr.tenant_id,
        tenant_id: qr.tenant_id,
        workspace_id: qr.workspace_id,
        entity_id: qr.entity_id || qr.partner_id || "",
        entity_type: qr.entity_type || "partner_qr",
        campaign_id: qr.campaign_id || "",
        status: qr.status === "active" ? "routed" : "inactive",
        scan_time: now(),
        scanned_at: now(),
        device: req.body?.device || "",
        location: req.body?.location || "",
        source: req.body?.source || "qr",
        referrer: req.body?.referrer || "",
      },
      makeId("qr_scan")
    );
    db.entities.QrScan.push(scan);
    qr.scans = Number(qr.scans || 0) + 1;
    qr.updated_at = now();
    writeAnalyticsEvent(db, req, { event: "qr_scanned", entity_type: scan.entity_type, entity_id: scan.entity_id, ...organizationContext(scan), metadata: scan });
    writeAuditEvent(db, req, { action: "qr_scan_recorded", entity_type: "qr", entity_id: qr.id, after: scan });
    await saveDatabase(db);
    res.status(201).json({ success: true, destination_url: qr.destination_url, scan, qr });
  });

  const runAgentGateway = async (req: express.Request, res: express.Response, overrides: Record<string, any> = {}) => {
    const started = Date.now();
    const payload = {
      ...(req.body || {}),
      ...overrides,
      message: overrides.message || req.body?.message || req.body?.question || req.body?.query || "",
      context: {
        ...(req.body?.context || {}),
        visibleEntities: req.body?.context?.visibleEntities || mapEntityRows(db).slice(0, 25),
      },
    };
    const { response, conversation } = await routeAgentQuery(payload, { entities: db.entities });
    db.entities.Interaction.push(conversation);
    db.entities.AiInsight.push(
      withTimestamps(
        {
          source: "agent_gateway",
          insight_type: response.intent,
          title: payload.message || "Agent query",
          summary: response.answer,
          recommended_action: response.nextSuggestions?.[0] || "",
          status: "generated",
          context: response,
        },
        makeId("ai")
      )
    );
    writeAnalyticsEvent(db, req, {
      event: "ai_request_completed",
      entity_type: "agent",
      entity_id: response.id,
      mode: response.mode,
      source: "agent_gateway",
      metadata: { intent: response.intent, latency_ms: Date.now() - started, provider: response.provider },
    });
    writeAuditEvent(db, req, {
      action: "agent_query_completed",
      entity_type: "agent_interaction",
      entity_id: response.id,
      after: conversation,
      metadata: { mode: response.mode, intent: response.intent },
    });
    await saveDatabase(db);
    res.json(response);
  };

  app.post("/api/agent/query", async (req, res) => {
    try {
      await runAgentGateway(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Agent query failed" });
    }
  });

  app.post("/api/agent/stream", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    try {
      const chunks: any[] = [];
      const responseProxy = {
        json: (payload: any) => chunks.push(payload),
      } as unknown as express.Response;
      await runAgentGateway(req, responseProxy);
      const payload = chunks[0] || {};
      res.write(createAgentStreamEnvelope({ type: "agent_start", sessionId: payload.sessionId }));
      res.write(createAgentStreamEnvelope({ type: "agent_response", payload }));
      res.write(createAgentStreamEnvelope({ type: "agent_done" }));
      res.end();
    } catch (err: any) {
      res.write(createAgentStreamEnvelope({ type: "agent_error", error: err.message || "Agent stream failed" }));
      res.end();
    }
  });

  app.get("/api/agent/conversations", (req, res) => {
    const sessionId = String(req.query.sessionId || "");
    const rows = db.entities.Interaction.filter((item) => !sessionId || item.session_id === sessionId).slice(-50);
    res.json(rows);
  });

  app.get("/api/agent/suggestions", (req, res) => {
    res.json({
      suggestions: [
        "What should I do nearby tonight?",
        "Show partner performance this week.",
        "Summarize campaign results.",
        "Find perks with low conversion.",
      ],
    });
  });

  app.post("/api/agent/feedback", async (req, res) => {
    const record = withTimestamps(
      {
        interaction_id: req.body?.interactionId || "",
        rating: req.body?.rating || "",
        comment: req.body?.comment || "",
        status: "received",
      },
      makeId("interaction_feedback")
    );
    db.entities.InteractionStep.push(record);
    writeAnalyticsEvent(db, req, { event: "ai_feedback_submitted", entity_type: "agent", entity_id: record.interaction_id, metadata: record });
    await saveDatabase(db);
    res.status(201).json(record);
  });

  app.get("/api/agent/tools", (req, res) => {
    res.json({ tools: listAgentTools() });
  });

  app.post("/api/agent/tools/execute", async (req, res) => {
    try {
      const { response } = await routeAgentQuery(
        {
          ...req.body,
          intent: req.body?.tool || "searchKnowledge",
          message: req.body?.message || req.body?.query || req.body?.tool || "",
        },
        { entities: db.entities }
      );
      writeAnalyticsEvent(db, req, { event: "agent_tool_executed", entity_type: "agent_tool", entity_id: req.body?.tool || "tool", metadata: response });
      await saveDatabase(db);
      res.json(response.toolCalls);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Tool execution failed" });
    }
  });

  app.post("/api/agent/images", async (req, res) => {
    try {
      const provider = getProviderManager();
      const prompt = String(req.body?.prompt || "");
      if (!prompt) return res.status(400).json({ error: "Prompt is required." });
      const result = await provider.primary.image(prompt);
      const record = withTimestamps({ prompt, provider: provider.metadata.name, model: provider.metadata.imageModel, result, status: "generated" }, makeId("generated_image"));
      db.entities.GeneratedImage.push(record);
      writeAnalyticsEvent(db, req, { event: "ai_image_generated", entity_type: "generated_image", entity_id: record.id, metadata: { model: provider.metadata.imageModel } });
      await saveDatabase(db);
      res.status(201).json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Image generation failed" });
    }
  });

  app.post("/api/agent/campaigns", async (req, res) => {
    await runAgentGateway(req, res, { mode: "campaign", intent: "campaign_planning" });
  });

  app.post("/api/agent/reports", async (req, res) => {
    await runAgentGateway(req, res, { mode: "reports", intent: "report_analysis" });
  });

  app.post("/api/ai/ask-map", async (req, res) => {
    try {
      await runAgentGateway(req, res, { mode: req.body?.mode || "resident", intent: "ask_map", message: req.body?.message || req.body?.question || "Ask the Map" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Ask the Map failed" });
    }
  });

  app.post("/api/ai/recommendations", async (req, res) => {
    try {
      await runAgentGateway(req, res, { intent: "recommendations", message: req.body?.message || "Recommend Downtown Perks next actions" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Recommendations failed" });
    }
  });

  app.post("/api/ai/report-summary", async (req, res) => {
    try {
      await runAgentGateway(req, res, { mode: "reports", intent: "report_summary", message: req.body?.message || "Summarize platform reports" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Report summary failed" });
    }
  });

  app.post("/api/ai/survey-summary", async (req, res) => {
    try {
      await runAgentGateway(req, res, { mode: "reports", intent: "survey_summary", message: req.body?.message || "Summarize survey responses" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Survey summary failed" });
    }
  });

  const updatePerkStatus = async (req: express.Request, res: express.Response, status: string) => {
    const perk = findEntityById(db.entities.PerkLocation, req.params.id);
    if (!perk) return res.status(404).json({ error: "Perk not found" });
    const before = { ...perk };
    Object.assign(perk, {
      status,
      active: status === "active",
      is_active: status === "active",
      updated_at: now(),
    });
    writeAuditEvent(db, req, { action: `perk_${status}`, entity_type: "perk", entity_id: perk.id, before, after: perk });
    writeAnalyticsEvent(db, req, { event: `perk_${status}`, entity_type: "perk", entity_id: perk.id, ...organizationContext(perk) });
    await saveDatabase(db);
    return res.json(perk);
  };

  app.post("/api/perks/:id/activate", (req, res) => updatePerkStatus(req, res, "active"));
  app.post("/api/perks/:id/pause", (req, res) => updatePerkStatus(req, res, "paused"));
  app.post("/api/perks/:id/archive", (req, res) => updatePerkStatus(req, res, "archived"));

  app.post("/api/perks/:id/redeem", async (req, res) => {
    const perk = findEntityById(db.entities.PerkLocation, req.params.id);
    if (!perk) return res.status(404).json({ error: "Perk not found" });
    if (perk.active === false || perk.is_active === false || perk.status === "paused") return res.status(409).json({ error: "Perk is not currently redeemable", status: "paused" });
    const residentEmail = req.body?.user_email || req.body?.resident_email || "resident@example.com";
    const duplicate = db.entities.PerkRedemption.some((item) => item.perk_id === perk.id && item.user_email === residentEmail && Date.now() - new Date(item.redeemed_at || item.timestamp || 0).getTime() < 24 * 60 * 60 * 1000);
    if (duplicate) return res.status(409).json({ error: "Duplicate redemption blocked by eligibility rule", status: "duplicate" });
    const redemption = withTimestamps(
      {
        perk_id: perk.id,
        perkId: perk.id,
        propertyId: req.body?.propertyId || req.body?.property_id || "",
        partner_id: perk.partner_id || "",
        tenant_id: perk.tenant_id || "",
        workspace_id: perk.workspace_id || "",
        perk_name: perk.name || perk.title || "Perk",
        perk_category: perk.category || "General",
        user_email: residentEmail,
        user_name: req.body?.user_name || req.body?.resident_name || "Resident",
        timestamp: now(),
        redeemed_at: now(),
        is_verified: true,
      },
      makeId("red")
    );
    db.entities.PerkRedemption.push(redemption);
    perk.redemption_count = Number(perk.redemption_count || 0) + 1;
    perk.updated_at = now();
    writeAnalyticsEvent(db, req, { event: "perk_redeemed", entity_type: "perk", entity_id: perk.id, ...organizationContext(perk), metadata: redemption });
    writeAuditEvent(db, req, { action: "perk_redeemed", entity_type: "perk", entity_id: perk.id, after: redemption });
    await saveDatabase(db);
    res.status(201).json({ success: true, redemption, perk });
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
