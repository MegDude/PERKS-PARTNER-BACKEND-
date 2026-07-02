type EntityClient = {
  list: (filters?: Record<string, any>) => Promise<any[]>;
  filter: (filters?: Record<string, any>) => Promise<any[]>;
  create: (data?: Record<string, any>) => Promise<any>;
  update: (id: string, data?: Record<string, any>) => Promise<any>;
  delete: (id: string) => Promise<any>;
};

const entityNames = [
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
  "Promotion",
  "PromotionRedemption",
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
  "PartnerOutreachContact",
  "PartnerOutreachCampaign",
  "PartnerOutreachStep",
  "PartnerOutreachMessage",
  "BoardMeeting",
  "BoardDecision",
  "BoardActionItem",
] as const;

const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || "";

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "object" && payload?.error ? payload.error : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function buildEntityClient(entityName: string): EntityClient {
  return {
    list: async (filters = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
      });
      const query = params.toString();
      return request(`/api/entities/${entityName}${query ? `?${query}` : ""}`);
    },
    filter: async (filters = {}) =>
      request(`/api/entities/${entityName}/filter`, {
        method: "POST",
        body: JSON.stringify(filters),
      }),
    create: async (data = {}) =>
      request(`/api/entities/${entityName}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: async (id: string, data = {}) =>
      request(`/api/entities/${entityName}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: async (id: string) =>
      request(`/api/entities/${entityName}/${id}`, {
        method: "DELETE",
      }),
  };
}

const entities = Object.fromEntries(entityNames.map((entityName) => [entityName, buildEntityClient(entityName)]));

export const base44 = {
  auth: {
    me: async () => request("/api/auth/me"),
    redirectToLogin: () => {},
    updateMe: async (data: any) =>
      request("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  entities: entities as Record<(typeof entityNames)[number], EntityClient>,
  integrations: {
    Core: {
      UploadFile: async (data?: any) =>
        request("/api/integrations/upload-file", {
          method: "POST",
          body: JSON.stringify(data || {}),
        }),
      SendEmail: async (data?: any) =>
        request("/api/integrations/send-email", {
          method: "POST",
          body: JSON.stringify(data || {}),
        }),
    },
  },
  functions: {
    invoke: async (name: string, payload?: any) =>
      request(`/api/functions/${name}`, {
        method: "POST",
        body: JSON.stringify(payload || {}),
      }),
  },
};
