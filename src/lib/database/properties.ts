import { getDb, type Queryable } from "./client";

export async function getLegendsProperties(db?: Queryable) {
  const client = await getDb(db);
  const result = await client.query("/api/properties", { status: "active" });
  return result.rows;
}

export async function getPropertyListings(propertyId: string, db?: Queryable) {
  const client = await getDb(db);
  const result = await client.query("/api/map/entities", { property_id: propertyId, relationship_type: "listing" });
  return result.rows;
}
