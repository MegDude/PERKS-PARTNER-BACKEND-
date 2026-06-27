import type { AgentContext, AgentDataAccess, AgentQueryPayload } from "./types.js";

const fallbackSession = () => `agent_session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function buildAgentContext(payload: AgentQueryPayload, data: AgentDataAccess): AgentContext {
  const entities = data.entities || {};
  const mode = String(payload.mode || payload.context?.mode || "resident");
  const organizationId = String(payload.organizationId || payload.context?.organizationId || payload.context?.tenant_id || "org_downtown_perks");
  const visibleEntities = Array.isArray(payload.context?.visibleEntities) ? payload.context.visibleEntities : [];
  const mapEntities = Array.isArray(entities.MapEntityLink) ? entities.MapEntityLink : [];
  const perkEntities = Array.isArray(entities.PerkLocation) ? entities.PerkLocation : [];
  const eventEntities = Array.isArray(entities.Event) ? entities.Event : [];
  const campaignEntities = Array.isArray(entities.Campaign) ? entities.Campaign : [];
  const reports = Array.isArray(entities.PartnerReport) ? entities.PartnerReport : [];
  const organization =
    (Array.isArray(entities.PlatformTenant) ? entities.PlatformTenant : []).find((item: any) => item.id === organizationId || item.organization_id === organizationId) ||
    (Array.isArray(entities.Partner) ? entities.Partner : []).find((item: any) => item.id === organizationId || item.tenant_id === organizationId) ||
    null;

  return {
    sessionId: String(payload.sessionId || payload.context?.sessionId || fallbackSession()),
    userId: String(payload.userId || payload.context?.userId || "anonymous"),
    organizationId,
    mode,
    intent: String(payload.intent || payload.context?.intent || "general"),
    message: String(payload.message || payload.context?.question || payload.context?.query || ""),
    location: payload.location || payload.context?.location || {},
    map: {
      viewport: payload.context?.viewport || {},
      selectedEntityId: payload.context?.selectedEntityId || "",
      visibleEntities,
    },
    filters: payload.context?.filters || {},
    entities: visibleEntities.length ? visibleEntities : mapEntities.slice(0, 25),
    events: eventEntities.slice(0, 12),
    perks: perkEntities.filter((perk: any) => perk.active !== false && perk.is_active !== false).slice(0, 12),
    campaigns: campaignEntities.slice(0, 12),
    reports: reports.slice(0, 8),
    organization,
    history: Array.isArray(payload.history) ? payload.history : [],
    memory: payload.context?.memory || {},
    environment: {
      requestedAt: new Date().toISOString(),
      frontendRoute: payload.context?.route || "",
      source: payload.context?.source || "api",
    },
  };
}
