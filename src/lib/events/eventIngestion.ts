export type EventIngestionSource = "google_calendar" | "eventbrite" | "ticketmaster" | "visit_austin" | "partner_custom";

export type NormalizedEventOccurrence = {
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  venueName?: string;
  address?: string;
  lat?: number;
  lng?: number;
  source: EventIngestionSource;
  sourceUrl?: string;
  imageUrl?: string;
  category?: string;
  priceLabel?: string;
  status: "scheduled" | "active" | "cancelled";
  metadata?: Record<string, unknown>;
};

export function normalizeEventOccurrence(source: EventIngestionSource, item: Record<string, unknown>): NormalizedEventOccurrence {
  return {
    title: String(item.title || item.name || "Downtown event"),
    description: String(item.description || item.summary || ""),
    startTime: String(item.start_time || item.startTime || item.start || ""),
    endTime: String(item.end_time || item.endTime || item.end || ""),
    timezone: String(item.timezone || "America/Chicago"),
    venueName: String(item.venue_name || item.venueName || item.location || ""),
    address: String(item.address || ""),
    lat: Number(item.lat || item.latitude) || undefined,
    lng: Number(item.lng || item.longitude) || undefined,
    source,
    sourceUrl: String(item.source_url || item.url || ""),
    imageUrl: String(item.image_url || item.image || ""),
    category: String(item.category || ""),
    priceLabel: String(item.price_label || item.price || ""),
    status: item.status === "cancelled" ? "cancelled" : "scheduled",
    metadata: item,
  };
}

export async function ingestEventFeed(source: EventIngestionSource, items: Record<string, unknown>[]) {
  return items.map((item) => normalizeEventOccurrence(source, item));
}
