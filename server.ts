import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import { GoogleGenAI, Type } from "@google/genai";
import { enterpriseComponents, platformArchitecture, platformDomains, serializePlatformDomain } from "./src/platform/registry.js";

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
  | "IntegrationStatus";

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
  "AnalyticsEvent",
  "QrScan",
  "ReportRun",
  "IntegrationStatus",
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

const pricingImportSources = {
  productsCsv: "/Users/megdude/Downloads/PRODUCTS LIST/UPDATED NEW PRICING/products.csv",
  pricesCsv: "/Users/megdude/Downloads/PRODUCTS LIST/UPDATED NEW PRICING/prices (1).csv",
};

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

function normalizeProductName(name: string) {
  return String(name || "").trim();
}

function normalizeProductSlug(name: string) {
  return slug(normalizeProductName(name)).replace(/_/g, "-");
}

async function importPricingCatalog(entities: Database["entities"]) {
  const products = await readCsvIfExists(pricingImportSources.productsCsv);
  const prices = await readCsvIfExists(pricingImportSources.pricesCsv);
  const pricesByProduct = new Map<string, Record<string, any>[]>();
  prices.forEach((price) => {
    const productId = price["Product ID"];
    if (!pricesByProduct.has(productId)) pricesByProduct.set(productId, []);
    pricesByProduct.get(productId)?.push(price);
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
    ensureRecord(entities.ProductOffering, `product_${normalizeProductSlug(productId)}`, {
      product_id: productId,
      stripe_product_id: productId,
      stripe_price_id: primaryPrice["Price ID"] || "",
      name: productName,
      display_name: productName.replace(/^AddOn\//, "").replace(/^Tier\//, ""),
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

  return { products: products.length, prices: prices.length, imported };
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
    suggested_actions: ["Review map profile", "Confirm campaign visibility", "Add offer or event", "Review imported reporting signals"],
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
    summary: "The older intelligence build provided agent prompt bars, suggestion cards, map search overlays, campaign builder overlays, intelligence strips, partner scanners, resident profiles, relationship engine, live signals, and agent recommendation hooks. The current 3014 platform imports their operational data and records the module inventory without copying old UI.",
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
    if (isServerless) {
      const bundled = await loadBundledDatabase();
      if (bundled && platformRecordCount(bundled) > platformRecordCount(parsed)) {
        for (const entityName of entityNames) bundled.entities[entityName] ||= [];
        addOperationalDefaults(bundled.entities);
        await saveDatabase(bundled);
        return bundled;
      }
    }
    for (const entityName of entityNames) parsed.entities[entityName] ||= [];
    addOperationalDefaults(parsed.entities);
    await importPricingCatalog(parsed.entities);
    await saveDatabase(parsed);
    return parsed;
  } catch {
    if (isServerless) {
      const bundled = await loadBundledDatabase();
      if (bundled) {
        for (const entityName of entityNames) bundled.entities[entityName] ||= [];
        addOperationalDefaults(bundled.entities);
        await saveDatabase(bundled);
        return bundled;
      }
    }
    const seeded = createSeedDatabase();
    await importPricingCatalog(seeded.entities);
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

function getPartnerName(db: Database, partnerId?: string) {
  if (!partnerId) return "";
  return db.entities.Partner.find((partner) => partner.id === partnerId)?.business_name || db.entities.PartnerProfile.find((profile) => profile.partner_id === partnerId)?.display_name || "";
}

function mapEntityRows(db: Database) {
  const fromLinks = db.entities.MapEntityLink.map((link) => {
    const location = db.entities.PartnerLocation.find((item) => item.map_entity_id === link.entity_id || item.partner_id === link.partner_id || item.tenant_id === link.tenant_id);
    const profile = db.entities.PartnerProfile.find((item) => item.partner_id === link.partner_id || item.tenant_id === link.tenant_id);
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
    last_updated: perk.updated_at || perk.created_at || "",
  }));

  const merged = new Map<string, Record<string, any>>();
  [...fromLinks, ...fromPerks].forEach((record) => {
    const key = record.map_entity_id || record.id;
    if (!merged.has(key)) merged.set(key, record);
  });
  return [...merged.values()];
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
    writeAuditEvent(db, req, { action: "partner_lead_captured", entity_type: "partner_registration", entity_id: lead.id, after: lead });
    writeAnalyticsEvent(db, req, { event: "partner_lead_captured", entity_type: "partner_registration", entity_id: lead.id, metadata: { partner_type: lead.partner_type, interest: lead.interest } });
    await saveDatabase(db);
    res.status(201).json({ success: true, lead, export_csv_url: "/api/partner-leads/export.csv" });
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
    const products = db.entities.ProductOffering.filter((product) => selectedPriceIds.includes(product.stripe_price_id) || selectedPriceIds.some((priceId: string) => product.prices?.some((price: any) => price.stripe_price_id === priceId)));
    const billingEmail = body.customer_email || body.billing_email || body.email || "";
    const organizationName = body.organization_name || body.business_name || "Downtown Perks Partner";

    if (!selectedPriceIds.length) return res.status(400).json({ error: "At least one Stripe price ID is required." });

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
        products: products.map((product) => ({ id: product.id, name: product.name, stripe_product_id: product.stripe_product_id, stripe_price_id: product.stripe_price_id, amount: product.amount, interval: product.interval })),
        provider: process.env.STRIPE_SECRET_KEY ? "stripe" : "local_checkout_ready_for_stripe",
        status: process.env.STRIPE_SECRET_KEY ? "creating" : "pending_credentials",
        success_url: body.success_url || "http://localhost:5173/partners/provision?checkout=success",
        cancel_url: body.cancel_url || "http://localhost:5173/partners/checkout?checkout=cancelled",
      },
      makeId("checkout")
    );

    if (!process.env.STRIPE_SECRET_KEY) {
      ensureRecord(db.entities.PartnerInvoice, `invoice_${checkoutRecord.id}`, {
        tenant_id: checkoutRecord.tenant_id,
        workspace_id: checkoutRecord.workspace_id,
        billing_email: billingEmail,
        status: "pending_payment",
        provider: "local_checkout_ready_for_stripe",
        checkout_session_id: checkoutRecord.id,
        total: products.reduce((sum, product) => sum + Number(product.amount || 0), 0),
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
    selectedPriceIds.forEach((priceId: string, index: number) => {
      params.set(`line_items[${index}][price]`, priceId);
      params.set(`line_items[${index}][quantity]`, String(lineItems[index]?.quantity || 1));
    });
    params.set("metadata[organization_name]", organizationName);
    params.set("metadata[tenant_id]", checkoutRecord.tenant_id);

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
      total: products.reduce((sum, product) => sum + Number(product.amount || 0), 0),
      currency: products[0]?.currency || "usd",
    });
    writeAuditEvent(db, req, { action: "stripe_checkout_session_created", entity_type: "checkout", entity_id: checkoutRecord.id, after: checkoutRecord });
    await saveDatabase(db);
    res.status(201).json({ success: true, checkout_session: checkoutRecord, stripe: stripePayload, checkout_url: stripePayload.url });
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
    const defaults = [
      ["Tally Webhooks", "TALLY_WEBHOOK_SECRET"],
      ["Twilio Verify", "TWILIO_VERIFY_SERVICE_SID"],
      ["Twilio Messaging", "TWILIO_MESSAGING_SERVICE_SID"],
      ["Supabase Operational Store", "SUPABASE_URL"],
      ["n8n Workflow Orchestration", "N8N_WEBHOOK_URL"],
      ["OpenAI Insights", "OPENAI_API_KEY"],
      ["Google Sheets / Reports DB", "GOOGLE_SHEETS_CLIENT_EMAIL"],
      ["Google Maps", "GOOGLE_MAPS_API_KEY"],
      ["Stripe", "STRIPE_SECRET_KEY"],
      ["Storage Provider", "STORAGE_BUCKET"],
    ];
    const records = defaults.map(([provider, envKey]) => {
      const stored = db.entities.IntegrationStatus.find((item) => item.provider === provider) || db.entities.IntegrationEndpoint.find((item) => item.provider === provider || item.name === provider);
      return {
        id: stored?.id || `integration_${slug(provider)}`,
        provider,
        status: process.env[envKey] ? "configured" : stored?.status || "pending_credentials",
        required_env_vars: [envKey],
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

  app.post("/api/ai/ask-map", async (req, res) => {
    const visibleEntities = mapEntityRows(db).slice(0, 12);
    const insight = withTimestamps(
      {
        source: "ask_map",
        insight_type: "answer",
        title: req.body?.question || "Ask the Map",
        summary: `Found ${visibleEntities.length} visible Downtown Perks entities for ${req.body?.mode || "resident"} mode.`,
        recommended_action: visibleEntities[0]?.title ? `Start with ${visibleEntities[0].title}.` : "Open the map and select a nearby entity.",
        status: "generated",
        context: { mode: req.body?.mode || "resident", visible_entities: visibleEntities },
      },
      makeId("ai")
    );
    db.entities.AiInsight.push(insight);
    writeAnalyticsEvent(db, req, { event: "ai_request_created", entity_type: "ai", entity_id: insight.id, metadata: req.body || {} });
    await saveDatabase(db);
    res.json({ answer: insight.summary, recommendations: visibleEntities.slice(0, 5), insight });
  });

  app.post("/api/ai/recommendations", async (req, res) => {
    const recommendations = [
      ...db.entities.PerkLocation.filter((perk) => perk.active !== false && perk.is_active !== false).slice(0, 4),
      ...db.entities.Event.filter((event) => event.status !== "draft").slice(0, 3),
    ];
    writeAnalyticsEvent(db, req, { event: "ai_recommendations_requested", entity_type: "ai", entity_id: "recommendations", metadata: req.body || {} });
    await saveDatabase(db);
    res.json({ recommendations });
  });

  app.post("/api/ai/report-summary", async (req, res) => {
    const summary = {
      title: "Platform report summary",
      summary: `${db.entities.PerkRedemption.length} redemptions, ${db.entities.EventRSVP.length} RSVPs, and ${db.entities.Campaign.length} campaigns are available for the selected scope.`,
      generated_at: now(),
    };
    db.entities.AiInsight.push(withTimestamps({ source: "report_summary", insight_type: "summary", ...summary, status: "generated" }, makeId("ai")));
    await saveDatabase(db);
    res.json(summary);
  });

  app.post("/api/ai/survey-summary", async (req, res) => {
    const responses = db.entities.SurveyResponse.filter((response) => !req.body?.survey_id || response.survey_id === req.body.survey_id);
    const summary = {
      title: "Survey response summary",
      summary: `${responses.length} survey responses are stored. Sentiment and escalation routing are ready for configured AI credentials.`,
      generated_at: now(),
    };
    db.entities.AiInsight.push(withTimestamps({ source: "survey_summary", insight_type: "summary", ...summary, status: "generated" }, makeId("ai")));
    await saveDatabase(db);
    res.json(summary);
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
