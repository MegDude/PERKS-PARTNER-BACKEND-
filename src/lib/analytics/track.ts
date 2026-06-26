import { fireWorkflow, getWorkflowProfileId, getWorkflowSessionId } from "@/lib/backendWorkflows";

export type EventType =
  | "marker_click"
  | "drawer_open"
  | "drawer_close"
  | "search_submit"
  | "intent_mode_change"
  | "chip_toggle"
  | "save"
  | "unsave"
  | "directions"
  | "redeem"
  | "rsvp"
  | "filter_apply"
  | "building_anchor";

export interface TrackingEvent {
  type: EventType;
  entityId?: string;
  entityType?: "venue" | "event" | "building" | "perk" | string;
  campaign?: string;
  value?: unknown;
}

export function track(event: TrackingEvent) {
  fireWorkflow("/api/analytics/events", {
    event: event.type,
    entity_id: event.entityId,
    entity_type: event.entityType,
    campaign: event.campaign,
    value: event.value,
    sessionId: getWorkflowSessionId(),
    profileId: getWorkflowProfileId(),
    sourceType: "map_discovery",
  });
}

export const trackingEvents = {
  markerClick: (entityId: string, entityType: string) => track({ type: "marker_click", entityId, entityType }),
  drawerOpen: (entityId: string) => track({ type: "drawer_open", entityId }),
  drawerClose: (entityId: string) => track({ type: "drawer_close", entityId }),
  searchSubmit: (query: string) => track({ type: "search_submit", value: query }),
  intentModeChange: (mode: string) => track({ type: "intent_mode_change", value: mode }),
  save: (entityId: string) => track({ type: "save", entityId }),
  unsave: (entityId: string) => track({ type: "unsave", entityId }),
  directions: (entityId: string) => track({ type: "directions", entityId }),
  redeem: (entityId: string) => track({ type: "redeem", entityId }),
  rsvp: (entityId: string) => track({ type: "rsvp", entityId }),
  filterApply: (filter: string) => track({ type: "filter_apply", value: filter }),
  buildingAnchor: (buildingId: string) => track({ type: "building_anchor", entityId: buildingId }),
};
