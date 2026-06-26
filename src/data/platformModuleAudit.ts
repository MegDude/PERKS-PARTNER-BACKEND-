export type PlatformModuleStatus = "installed" | "existing-backend" | "pending-configuration";

export type PlatformModuleAuditItem = {
  id: string;
  label: string;
  sourcePath: string;
  installedPath: string;
  status: PlatformModuleStatus;
  notes: string;
};

export const platformModuleAuditItems: PlatformModuleAuditItem[] = [
  {
    id: "agent-memory",
    label: "Agent memory",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/intelligence/agentMemory.ts",
    installedPath: "src/lib/intelligence/agentMemory.ts",
    status: "installed",
    notes: "Creates structured resident/partner agent memory records.",
  },
  {
    id: "ask-map",
    label: "Ask Map service",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/intelligence/askMapService.ts",
    installedPath: "src/lib/intelligence/askMapService.ts",
    status: "installed",
    notes: "Adapted to call the existing /api/ai/ask-map endpoint in this operations app.",
  },
  {
    id: "pulse-engine",
    label: "Pulse engine",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/intelligence/pulseEngine.ts",
    installedPath: "src/lib/intelligence/pulseEngine.ts",
    status: "installed",
    notes: "Generates demand, coverage, response-rate, and campaign opportunity signals.",
  },
  {
    id: "event-ingestion",
    label: "Event ingestion",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/events/eventIngestion.ts",
    installedPath: "src/lib/events/eventIngestion.ts",
    status: "installed",
    notes: "Normalizes Google Calendar, Eventbrite, Ticketmaster, Visit Austin, and custom partner events.",
  },
  {
    id: "database",
    label: "Database helper layer",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/database/*.ts",
    installedPath: "src/lib/database/*",
    status: "installed",
    notes: "Adapted from Cloud SQL helpers to this app's operations API and local entity backend.",
  },
  {
    id: "contracts",
    label: "Shared data contracts",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/contracts/index.ts",
    installedPath: "src/lib/contracts/index.ts",
    status: "installed",
    notes: "Shared map, venue, event, perk, building, campaign, resident, and analytics contracts.",
  },
  {
    id: "campaign-attribution",
    label: "Campaign attribution",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/campaigns/attribution.ts",
    installedPath: "src/lib/campaigns/attribution.ts",
    status: "installed",
    notes: "Maps campaign actions to attribution tables and timestamped events.",
  },
  {
    id: "analytics",
    label: "Analytics tracking",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/analytics/*.ts",
    installedPath: "src/lib/analytics/*",
    status: "installed",
    notes: "Dispatches browser analytics and mirrors tracked actions to /api/analytics/events.",
  },
  {
    id: "backend-workflows",
    label: "Backend workflows",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/backendWorkflows.ts",
    installedPath: "src/lib/backendWorkflows.ts",
    status: "installed",
    notes: "Mirrors workflow attempts/completions/failures into TenantAuditLog.",
  },
  {
    id: "campaign-types",
    label: "Campaign type system",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/campaign-types.ts",
    installedPath: "src/lib/campaign-types.ts",
    status: "installed",
    notes: "Reusable campaign placements, metrics, flows, and amplification point types.",
  },
  {
    id: "google-sheets",
    label: "Google Sheets connector",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/googleSheets.ts",
    installedPath: "src/lib/googleSheets.ts",
    status: "pending-configuration",
    notes: "Installed as a backend-ready function bridge. Real sync still needs Google service-account env vars.",
  },
  {
    id: "map-validation",
    label: "Map validation",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/mapValidation.ts",
    installedPath: "src/lib/mapValidation.ts",
    status: "installed",
    notes: "Prevents NaN and out-of-bounds Austin coordinates from reaching map rendering.",
  },
  {
    id: "notifications",
    label: "Management notifications",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/notifications.ts",
    installedPath: "src/lib/notifications.ts",
    status: "installed",
    notes: "Builds survey management messages and records in-app ManagementNotification entities.",
  },
  {
    id: "supabase",
    label: "Supabase server client",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/supabaseServer.js",
    installedPath: "src/lib/supabaseServer.js",
    status: "pending-configuration",
    notes: "Stubbed safely because this app currently uses the local JSON/API backend and does not include Supabase credentials.",
  },
  {
    id: "faq",
    label: "FAQ data",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/faq-data.js",
    installedPath: "src/lib/faq-data.ts",
    status: "installed",
    notes: "Core resident/property FAQ content installed as typed data.",
  },
  {
    id: "faq-partner",
    label: "Partner FAQ data",
    sourcePath: "/Users/megdude/Downloads/BASE44 2/src/lib/faq-partner-data.js",
    installedPath: "src/lib/faq-partner-data.ts",
    status: "installed",
    notes: "Partner and residential FAQ content installed as typed data.",
  },
  {
    id: "base44-entities",
    label: "Base44 entity schemas",
    sourcePath: "/Users/megdude/Downloads/BACKEND/harmony-homes-copy-02f82b0c (4)/base44/entities/*.jsonc",
    installedPath: "server.ts entity registry + src/api/base44Client.ts",
    status: "existing-backend",
    notes: "Broadcast, Building, Campaign, DANA, Event, RSVP, Partner, Perk, Product, Survey, Tenant, User, and related entities already exist in the operations backend registry/client.",
  },
  {
    id: "base44-google-sheets",
    label: "Base44 Google Sheets connector",
    sourcePath: "/Users/megdude/Downloads/BACKEND/harmony-homes-copy-02f82b0c (4)/base44/connectors/googlesheets.jsonc",
    installedPath: "src/lib/googleSheets.ts",
    status: "pending-configuration",
    notes: "Scopes are represented by the Google Sheets bridge; credentials and target spreadsheet IDs are still required.",
  },
  {
    id: "source-data-layer",
    label: "Export shared data layer",
    sourcePath: "/Users/megdude/Downloads/BACKEND/harmony-homes-copy-02f82b0c (4)/src/utils/dataLayer.js",
    installedPath: "src/utils/dataLayer.ts",
    status: "installed",
    notes: "Replaced the old two-event stub with building-scoped queries, public selectors, engagement metrics, partner performance, category breakdowns, and search helpers.",
  },
  {
    id: "source-engagement-segmentation",
    label: "Engagement segmentation utility",
    sourcePath: "/Users/megdude/Downloads/BACKEND/harmony-homes-copy-02f82b0c (4)/src/utils/engagementSegmentation.js",
    installedPath: "src/utils/engagementSegmentation.ts",
    status: "installed",
    notes: "Installed Power User, Occasional, and Inactive resident segmentation plus engagement statistics.",
  },
  {
    id: "source-survey-export-service",
    label: "Survey export service",
    sourcePath: "/Users/megdude/Downloads/BACKEND/harmony-homes-copy-02f82b0c (4)/src/services/surveyExportService.ts",
    installedPath: "src/services/surveyExportService.ts",
    status: "pending-configuration",
    notes: "Installed webhook-ready survey payload builder and exporter. It gracefully skips until VITE_GOOGLE_SHEETS_SURVEY_WEBHOOK_URL is configured.",
  },
  {
    id: "source-management-notification-service",
    label: "Management notification service",
    sourcePath: "/Users/megdude/Downloads/BACKEND/harmony-homes-copy-02f82b0c (4)/src/services/managementNotificationService.ts",
    installedPath: "src/services/managementNotificationService.ts",
    status: "pending-configuration",
    notes: "Installed webhook-ready management notification sender. It gracefully skips until VITE_MANAGEMENT_SURVEY_NOTIFICATION_WEBHOOK_URL is configured.",
  },
  {
    id: "source-route-coverage",
    label: "Export route coverage",
    sourcePath: "/Users/megdude/Downloads/BACKEND/harmony-homes-copy-02f82b0c (4)/src/ROUTES.md",
    installedPath: "src/App.tsx + src/components/layout/PartnerDashboardLayout.tsx",
    status: "existing-backend",
    notes: "Core admin equivalents are already routed: home, buildings/properties, residents, events, perks, reports, surveys, engagement, segmentation, partner portal, analytics, and settings. Duplicate legacy pages from the export were not blindly transplanted.",
  },
  {
    id: "source-page-set",
    label: "Export page set",
    sourcePath: "/Users/megdude/Downloads/BACKEND/harmony-homes-copy-02f82b0c (4)/src/pages/*.jsx",
    installedPath: "src/pages/*.tsx",
    status: "existing-backend",
    notes: "Most functional equivalents already exist as TSX pages in this app. Removed or legacy export pages such as Buildings, Tenants, Reminders, PerkReporting, and ResidentProfile map to current pages or remain intentionally unrouted.",
  },
  {
    id: "source-component-set",
    label: "Export component set",
    sourcePath: "/Users/megdude/Downloads/BACKEND/harmony-homes-copy-02f82b0c (4)/src/components/*",
    installedPath: "src/components/*",
    status: "existing-backend",
    notes: "The current app already includes the key shared components: PerkMap, Boop events, PartnerMessaging, ResidentProfileModal, survey components, tenant modals, dashboard stats, and UI primitives.",
  },
  {
    id: "source-docs",
    label: "Export architecture docs",
    sourcePath: "/Users/megdude/Downloads/BACKEND/harmony-homes-copy-02f82b0c (4)/src/*.md",
    installedPath: "docs/* + /admin/platform/modules",
    status: "existing-backend",
    notes: "The backend app already has extensive docs for routes, APIs, database, reporting, analytics, workflows, design, security, and production readiness. The module audit page now surfaces this export's implementation status in-app.",
  },
  {
    id: "source-base44-functions",
    label: "Base44 backend functions",
    sourcePath: "/Users/megdude/Downloads/BACKEND/harmony-homes-copy-02f82b0c (4)/base44/functions/*/entry.ts",
    installedPath: "server.ts /api/functions/:name",
    status: "existing-backend",
    notes: "The current server already handles seedDemoData, imports, survey export, PDF/report generation, partner reports, announcement notifications, survey processing, redemption verification, and partner updates.",
  },
];

export function summarizePlatformModuleAudit(items = platformModuleAuditItems) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1;
      summary[item.status] += 1;
      return summary;
    },
    { total: 0, installed: 0, "existing-backend": 0, "pending-configuration": 0 } as Record<PlatformModuleStatus | "total", number>,
  );
}
