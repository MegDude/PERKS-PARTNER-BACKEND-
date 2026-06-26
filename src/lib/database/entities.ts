import { getDb, type Queryable } from "./client";

export type StoredEntity = {
  id: string;
  entity_type?: string;
  type?: string;
  title?: string;
  name?: string;
  description?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  district?: string;
  partner_status?: string;
  status?: string;
  metadata?: Record<string, unknown>;
};

export async function getEntityById(id: string, db?: Queryable) {
  const client = await getDb(db);
  const result = await client.query<StoredEntity>(`/api/map/entities/${encodeURIComponent(id)}`);
  return result.rows[0] || null;
}

export async function getEntitiesByType(entityType: string, db?: Queryable) {
  const client = await getDb(db);
  const result = await client.query<StoredEntity>("/api/map/entities", { type: entityType });
  return result.rows;
}

export async function getNearbyEntities(params: { lat: number; lng: number; radiusMeters?: number; entityType?: string }, db?: Queryable) {
  const client = await getDb(db);
  const result = await client.query<StoredEntity>("/api/map/entities", {
    lat: params.lat,
    lng: params.lng,
    radius: params.radiusMeters || 400,
    type: params.entityType,
  });
  return result.rows;
}

export async function searchEntities(query: string, db?: Queryable) {
  const client = await getDb(db);
  const result = await client.query<StoredEntity>("/api/map/entities", { q: query });
  return result.rows;
}

export async function saveEntity(input: { userId?: string; residentId?: string; entityId: string; entityType: string }) {
  const response = await fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "entity_save",
      actor_id: input.userId || input.residentId,
      entity_id: input.entityId,
      entity_type: input.entityType,
      metadata: input,
    }),
  });
  if (!response.ok) throw new Error(`Save entity failed with ${response.status}`);
  return response.json();
}
