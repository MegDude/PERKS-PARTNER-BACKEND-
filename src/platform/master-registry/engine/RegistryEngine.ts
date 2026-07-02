import type { RegistryEntity, RegistryFilters, RegistryImportPreview, RegistryImportRow, RegistryRelationship } from "../schemas/types";

type DbLike = {
  entities: Record<string, Array<Record<string, any>>>;
};

const missing = "";

function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function numberOrNull(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function first(row: Record<string, unknown>, keys: string[]) {
  const lowerEntries = Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[key.toLowerCase().replace(/[^a-z0-9]+/g, "_")] = value;
    return acc;
  }, {});
  for (const key of keys) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (lowerEntries[normalized] != null && text(lowerEntries[normalized])) return lowerEntries[normalized];
  }
  return "";
}

function analyticsFor(db: DbLike, entityId: string) {
  const events = db.entities.AnalyticsEvent || [];
  const matching = events.filter((event) => event.entity_id === entityId || event.metadata?.entity_id === entityId);
  return {
    views: matching.filter((event) => String(event.event || "").includes("view")).length,
    clicks: matching.filter((event) => String(event.event || "").includes("click")).length,
    directions: matching.filter((event) => String(event.event || "").includes("directions")).length,
    saves: matching.filter((event) => String(event.event || "").includes("save")).length,
    conversions: matching.filter((event) => String(event.event || "").includes("conversion") || String(event.event || "").includes("redeem")).length,
  };
}

export function normalizeContentEntity(db: DbLike, record: Record<string, any>): RegistryEntity {
  const name = text(record.name || record.title);
  const lat = numberOrNull(record.map?.latitude ?? record.map?.lat ?? record.latitude ?? record.lat);
  const lng = numberOrNull(record.map?.longitude ?? record.map?.lng ?? record.longitude ?? record.lng);
  const entitySlug = text(record.slug) || slugify(name);
  return {
    id: record.id,
    slug: entitySlug,
    name,
    status: record.status || "draft",
    active: record.active !== false && record.status !== "archived" && !record.deleted_at,
    entityType: text(record.entity_type || record.type || "entity"),
    primaryCategory: text(record.primaryCategory || record.category),
    secondaryCategory: text(record.secondaryCategory || record.secondary_category),
    subcategory: text(record.subcategory),
    summary: text(record.summary || record.content?.summary || record.description),
    description: text(record.description || record.content?.resident_body || record.content?.summary),
    address: text(record.address || record.location?.address),
    suite: text(record.suite),
    building: text(record.building || record.building_name),
    district: text(record.district),
    neighbourhood: text(record.neighbourhood || record.neighborhood),
    city: text(record.city || "Austin"),
    state: text(record.state || "TX"),
    postcode: text(record.postcode || record.zip),
    country: text(record.country || "US"),
    latitude: lat,
    longitude: lng,
    phone: text(record.phone),
    website: text(record.website || record.url),
    image: text(record.image || record.image_url || record.hero_image || record.content?.image_url),
    logo: text(record.logo || record.logo_url || record.content?.logo_url),
    partnerId: text(record.partner_id),
    source: text(record.source || record.source_file || "content_entity"),
    sourceRecordType: "ContentEntity",
    createdAt: text(record.created_at),
    updatedAt: text(record.updated_at || record.created_at),
    analytics: analyticsFor(db, record.id),
    routes: {
      entityRoute: `/registry/entity/${encodeURIComponent(record.id)}`,
      partnerRoute: record.partner_id ? `/partners/${encodeURIComponent(record.partner_id)}` : "",
      campaignRoute: record.campaign_id ? `/campaigns/${encodeURIComponent(record.campaign_id)}` : "",
      publicUrl: `/map?entity=${encodeURIComponent(record.id)}`,
      deeplink: `/map?entity=${encodeURIComponent(record.id)}`,
      mobileRoute: `/map?entity=${encodeURIComponent(record.id)}`,
    },
    raw: record,
  };
}

export function buildRegistryEntities(db: DbLike, mapRows: Array<Record<string, any>> = []) {
  const content = (db.entities.ContentEntity || [])
    .filter((record) => !record.deleted_at)
    .map((record) => normalizeContentEntity(db, record));

  const known = new Set(content.map((entity) => entity.id));
  const linked = mapRows
    .filter((row) => row.entity_id && !known.has(row.entity_id))
    .map((row) => {
      const name = text(row.title || row.name || row.entity_id);
      return {
        id: text(row.entity_id || row.map_entity_id || row.id),
        slug: slugify(name),
        name,
        status: row.status || "linked",
        active: row.status !== "archived",
        entityType: text(row.entity_type || "map_entity"),
        primaryCategory: text(row.category),
        secondaryCategory: "",
        subcategory: "",
        summary: text(row.description),
        description: text(row.description),
        address: text(row.address),
        suite: "",
        building: text(row.building),
        district: text(row.district),
        neighbourhood: "",
        city: "Austin",
        state: "TX",
        postcode: "",
        country: "US",
        latitude: numberOrNull(row.lat ?? row.latitude),
        longitude: numberOrNull(row.lng ?? row.longitude),
        phone: text(row.phone),
        website: text(row.website),
        image: text(row.image_url),
        logo: text(row.logo_url),
        partnerId: text(row.partner_id),
        source: "map_entity_link",
        sourceRecordType: "MapEntityLink",
        createdAt: text(row.created_at),
        updatedAt: text(row.last_updated || row.updated_at || row.created_at),
        analytics: row.analytics_summary || analyticsFor(db, row.entity_id),
        routes: {
          entityRoute: `/registry/entity/${encodeURIComponent(row.entity_id)}`,
          partnerRoute: row.partner_id ? `/partners/${encodeURIComponent(row.partner_id)}` : "",
          campaignRoute: row.campaign_id ? `/campaigns/${encodeURIComponent(row.campaign_id)}` : "",
          publicUrl: `/map?entity=${encodeURIComponent(row.entity_id)}`,
          deeplink: `/map?entity=${encodeURIComponent(row.entity_id)}`,
          mobileRoute: `/map?entity=${encodeURIComponent(row.entity_id)}`,
        },
        raw: row,
      } satisfies RegistryEntity;
    });

  return [...content, ...linked].sort((a, b) => a.name.localeCompare(b.name));
}

export function filterRegistryEntities(entities: RegistryEntity[], filters: RegistryFilters = {}) {
  const q = text(filters.q).toLowerCase();
  const type = text(filters.type).toLowerCase();
  const category = text(filters.category).toLowerCase();
  const district = text(filters.district).toLowerCase();
  const status = text(filters.status).toLowerCase();
  const limit = Math.min(Math.max(Number(filters.limit || 250), 1), 1000);
  return entities
    .filter((entity) => !q || `${entity.name} ${entity.summary} ${entity.description} ${entity.primaryCategory} ${entity.district} ${entity.website}`.toLowerCase().includes(q))
    .filter((entity) => !type || entity.entityType.toLowerCase() === type)
    .filter((entity) => !category || entity.primaryCategory.toLowerCase() === category)
    .filter((entity) => !district || entity.district.toLowerCase() === district)
    .filter((entity) => !status || String(entity.status).toLowerCase() === status)
    .slice(0, limit);
}

export function buildRegistryRelationships(db: DbLike): RegistryRelationship[] {
  return (db.entities.ContentRelationship || []).map((relationship) => ({
    id: relationship.id,
    sourceEntityId: relationship.source_entity_id || relationship.sourceEntityId,
    targetEntityId: relationship.target_entity_id || relationship.targetEntityId,
    relationshipType: relationship.relationship_type || relationship.relationshipType || "related",
    weight: Number(relationship.weight || relationship.score || 1),
    status: relationship.status || "active",
  }));
}

export function normalizeImportRow(row: RegistryImportRow) {
  const name = text(first(row, ["name", "entity name", "title", "company", "business name"]));
  const latitude = numberOrNull(first(row, ["latitude", "lat"]));
  const longitude = numberOrNull(first(row, ["longitude", "lng", "lon"]));
  const entity: Partial<RegistryEntity> = {
    id: text(first(row, ["id", "entity id", "map entity id"])),
    slug: text(first(row, ["slug"])) || slugify(name),
    name,
    status: text(first(row, ["status"])) || "draft",
    active: true,
    entityType: text(first(row, ["entity type", "type", "partner type"])) || "entity",
    primaryCategory: text(first(row, ["primary category", "category"])),
    secondaryCategory: text(first(row, ["secondary category"])),
    subcategory: text(first(row, ["subcategory"])),
    summary: text(first(row, ["summary", "description", "notes"])),
    description: text(first(row, ["description", "notes"])),
    address: text(first(row, ["address"])),
    suite: text(first(row, ["suite"])),
    building: text(first(row, ["building", "property"])),
    district: text(first(row, ["district", "neighborhood", "neighbourhood"])),
    neighbourhood: text(first(row, ["neighborhood", "neighbourhood"])),
    city: text(first(row, ["city"])) || "Austin",
    state: text(first(row, ["state"])) || "TX",
    postcode: text(first(row, ["postcode", "zip"])),
    country: text(first(row, ["country"])) || "US",
    latitude,
    longitude,
    phone: text(first(row, ["phone"])),
    website: text(first(row, ["website", "url"])),
    image: text(first(row, ["image", "image url", "hero image"])),
    logo: text(first(row, ["logo", "logo url"])),
    partnerId: text(first(row, ["partner id", "partner_id"])),
    source: text(first(row, ["source", "source file"])) || "registry_import",
    raw: row,
  };
  return entity;
}

export function previewRegistryImport(existing: RegistryEntity[], rows: RegistryImportRow[], source = "registry_import"): RegistryImportPreview {
  const byName = new Map(existing.map((entity) => [entity.name.toLowerCase(), entity]));
  const byWebsite = new Map(existing.filter((entity) => entity.website).map((entity) => [entity.website.toLowerCase(), entity]));
  const previewRows = rows.map((row, index) => {
    const entity = normalizeImportRow({ ...row, source });
    if (!entity.name) return { rowIndex: index, action: "skip" as const, entity, reason: "Missing name" };
    const match = byWebsite.get(text(entity.website).toLowerCase()) || byName.get(text(entity.name).toLowerCase());
    if (match) return { rowIndex: index, action: "update" as const, entity, matchedEntityId: match.id, reason: match.website === entity.website ? "Matched website" : "Matched name" };
    return { rowIndex: index, action: "create" as const, entity };
  });
  return {
    source,
    totalRows: rows.length,
    creates: previewRows.filter((row) => row.action === "create").length,
    updates: previewRows.filter((row) => row.action === "update").length,
    skipped: previewRows.filter((row) => row.action === "skip").length,
    duplicates: previewRows
      .filter((row) => row.action === "update")
      .map((row) => ({ rowIndex: row.rowIndex, matchedEntityId: row.matchedEntityId || "", name: text(row.entity.name), reason: row.reason || "Matched existing entity" })),
    rows: previewRows,
  };
}
