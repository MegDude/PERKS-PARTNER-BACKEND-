import { getDb, type Queryable } from "./client";

export async function getActivePerks(db?: Queryable) {
  const client = await getDb(db);
  const result = await client.query("/api/perks", { status: "active" });
  return result.rows;
}

export async function getPerksForEntity(entityId: string, db?: Queryable) {
  const client = await getDb(db);
  const result = await client.query("/api/perks", { entity_id: entityId });
  return result.rows;
}
