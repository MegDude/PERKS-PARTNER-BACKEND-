import { getDb, type Queryable } from "./client";

export async function getActiveEvents(db?: Queryable) {
  const client = await getDb(db);
  const result = await client.query("/api/events", { status: "active" });
  return result.rows;
}

export async function getEventOccurrences(db?: Queryable) {
  const client = await getDb(db);
  const result = await client.query("/api/events", { occurrence: "scheduled" });
  return result.rows;
}
