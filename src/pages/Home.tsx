import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  LineChart,
  Megaphone,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
  Zap,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

type PlatformData = {
  health: any;
  tenantStatus: any;
  buildings: any[];
  residents: any[];
  partners: any[];
  perks: any[];
  events: any[];
  campaigns: any[];
  surveys: any[];
  surveyResponses: any[];
  reports: any[];
  redemptions: any[];
  broadcasts: any[];
  surveyProviderForms: any[];
  messagingJourneys: any[];
  integrationEndpoints: any[];
  automationRuns: any[];
  passportPrograms: any[];
  crmSegments: any[];
  aiInsights: any[];
};

const initialData: PlatformData = {
  health: null,
  tenantStatus: null,
  buildings: [],
  residents: [],
  partners: [],
  perks: [],
  events: [],
  campaigns: [],
  surveys: [],
  surveyResponses: [],
  reports: [],
  redemptions: [],
  broadcasts: [],
  surveyProviderForms: [],
  messagingJourneys: [],
  integrationEndpoints: [],
  automationRuns: [],
  passportPrograms: [],
  crmSegments: [],
  aiInsights: [],
};

const crmLayers = [
  ['Survey Engine', 'Tally / Jotform / SurveyJS', 'Resident onboarding, event feedback, perk redemption surveys, partner applications, and owned survey flows.'],
  ['Messaging', 'Twilio Verify + Messaging', 'Verified phone onboarding, SMS reminders, passport progress, campaign journeys, and partner follow-up.'],
  ['Database', 'Supabase + local report store', 'Resident profiles, survey responses, event feedback, redemptions, partner leads, and CRM segments.'],
  ['Analytics', 'Google Sheets + Reports DB', 'Live exports, report tables, partner summaries, building insights, and operator-ready evidence.'],
  ['AI Layer', 'OpenAI', 'Response summaries, sentiment, recommendations, resident segments, and operational next steps.'],
  ['Automation', 'n8n', 'Webhook routing, reminders, escalation rules, report generation, and cross-module workflow orchestration.'],
];

const architectureFlow = [
  {
    title: 'Property',
    body: 'Buildings and operators define access points, resident groups, unit inventory, amenities, and local operating context.',
  },
  {
    title: 'Residents',
    body: 'Residents are enrolled, segmented, and connected to access, cards, events, perks, surveys, and messaging.',
  },
  {
    title: 'Perks',
    body: 'Partners publish offers and experiences that can be tracked from visibility to redemption.',
  },
  {
    title: 'Events',
    body: 'Programming is distributed, RSVP tracked, followed up, and measured against building and partner activity.',
  },
  {
    title: 'Engagement',
    body: 'Campaigns, broadcasts, and surveys move residents and partners toward measurable actions.',
  },
  {
    title: 'Analytics',
    body: 'Performance is measured across residents, partners, buildings, offers, events, and campaigns.',
  },
  {
    title: 'Reporting',
    body: 'Operators and partners receive summaries, exports, monthly reports, and operational next steps.',
  },
];

const participants = [
  {
    name: 'Properties',
    contribute: 'Resident access, building context, unit inventory, lobby QR entry points.',
    receive: 'Engagement reporting, amenity value, retention signals, resident feedback.',
    manage: 'Residents, units, campaigns, surveys, amenities, reports.',
  },
  {
    name: 'Hotels',
    contribute: 'Guest-facing locations, local recommendations, concierge QR paths.',
    receive: 'Guest activity, local partner visibility, event and offer performance.',
    manage: 'Locations, events, recommendations, reports, staff access.',
  },
  {
    name: 'Venues',
    contribute: 'Offers, events, redemptions, booking or walk-in moments.',
    receive: 'Views, saves, directions, redemptions, campaign signals.',
    manage: 'Perks, campaigns, messages, reports, QR verification.',
  },
  {
    name: 'Brands',
    contribute: 'Sponsorships, activations, product moments, campaign assets.',
    receive: 'Audience activity, campaign performance, district-level visibility.',
    manage: 'Campaigns, placements, assets, reports, activation timing.',
  },
  {
    name: 'Civic Organizations',
    contribute: 'Programs, public events, district priorities, community surveys.',
    receive: 'Participation data, event reach, awareness and attendance reporting.',
    manage: 'Events, campaigns, surveys, civic reporting, partner coordination.',
  },
  {
    name: 'Residents',
    contribute: 'Enrollment, RSVPs, survey responses, card usage, redemptions.',
    receive: 'Relevant access, communications, offers, events, and building support.',
    manage: 'Preferences, access status, saved activity, survey participation.',
  },
];

const roadmap = [
  {
    phase: 'Phase 1',
    title: 'Core Operations',
    body: 'Properties, residents, perks, events, surveys, and reporting are connected as the operating base.',
  },
  {
    phase: 'Phase 2',
    title: 'Partner Intelligence',
    body: 'Partner workspaces, tenant users, monthly reports, campaign recommendations, and role-based permissions expand the operating model.',
  },
  {
    phase: 'Phase 3',
    title: 'Downtown Intelligence Layer',
    body: 'Cross-module analytics, predictive recommendations, civic reporting, and AI-assisted operations roll up across the platform.',
  },
];

const quickLinks = [
  { label: 'Workspace', to: '/admin', icon: Building2 },
  { label: 'Properties', to: '/admin/properties', icon: Building2 },
  { label: 'Buildings', to: '/admin/buildings', icon: Building2 },
  { label: 'Residents', to: '/admin/residents', icon: Users },
  { label: 'Segmentation', to: '/admin/segmentation', icon: ShieldCheck },
  { label: 'Partner Portal', to: '/admin/partner-portal', icon: Settings },
  { label: 'Perks', to: '/admin/perks', icon: Ticket },
  { label: 'Events', to: '/admin/events', icon: CalendarDays },
  { label: 'Engagement', to: '/admin/engagement', icon: Megaphone },
  { label: 'Surveys', to: '/admin/surveys', icon: FileText },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
  { label: 'Analytics', to: '/admin/analytics', icon: LineChart },
];

const automationRows = [
  ['Survey Processing', 'survey submitted', 'Summarize response, classify sentiment, route follow-up.'],
  ['Redemption Verification', 'perk scan submitted', 'Validate eligibility, protect duplicates, update redemption analytics.'],
  ['Resident Enrollment', 'resident invited or imported', 'Create resident profile, access state, card status, and segment record.'],
  ['Partner Provisioning', 'partner or map entity created', 'Create tenant, workspace, roles, analytics, reports, and audit records.'],
  ['Partner Perk Updates', 'offer changed', 'Sync active offers to partner workspace and reporting containers.'],
  ['Partner Message Handling', 'partner message received', 'Attach message to partner account and notify operators.'],
  ['Property Performance Reports', 'report requested or scheduled', 'Generate property engagement summary and export file.'],
  ['Partner Monthly Reports', 'monthly schedule', 'Generate partner performance summary and delivery log.'],
  ['Event Follow-Up', 'event completed', 'Queue feedback survey, RSVP review, and event report.'],
  ['Campaign Triggers', 'campaign created or segment updated', 'Resolve recipients and track sends, opens, clicks, conversions.'],
  ['Survey Escalations', 'low score submitted', 'Create management notification and follow-up task.'],
  ['Resident Bulk Updates', 'bulk action confirmed', 'Update selected resident records and write audit event.'],
];

function lastUpdated() {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date());
}

export default function Home() {
  const [data, setData] = useState<PlatformData>(initialData);

  useEffect(() => {
    let mounted = true;

    async function loadPlatformData() {
      try {
        const [
          health,
          tenantStatus,
          buildings,
          residents,
          partners,
          perks,
          events,
          campaigns,
          surveys,
          surveyResponses,
          reports,
          redemptions,
          broadcasts,
          surveyProviderForms,
          messagingJourneys,
          integrationEndpoints,
          automationRuns,
          passportPrograms,
          crmSegments,
          aiInsights,
        ] = await Promise.all([
          fetch('/api/health').then((res) => res.json()),
          fetch('/api/tenant-provisioning/status').then((res) => res.json()).catch(() => null),
          base44.entities.Building.list().catch(() => []),
          base44.entities.Tenant.list().catch(() => []),
          base44.entities.Partner.list().catch(() => []),
          base44.entities.PerkLocation.list().catch(() => []),
          base44.entities.Event.list().catch(() => []),
          base44.entities.Campaign.list().catch(() => []),
          base44.entities.Survey.list().catch(() => []),
          base44.entities.SurveyResponse.list().catch(() => []),
          base44.entities.PartnerReport.list().catch(() => []),
          base44.entities.PerkRedemption.list().catch(() => []),
          base44.entities.Broadcast.list().catch(() => []),
          base44.entities.SurveyProviderForm.list().catch(() => []),
          base44.entities.MessagingJourney.list().catch(() => []),
          base44.entities.IntegrationEndpoint.list().catch(() => []),
          base44.entities.AutomationRun.list().catch(() => []),
          base44.entities.PassportProgram.list().catch(() => []),
          base44.entities.CrmSegment.list().catch(() => []),
          base44.entities.AiInsight.list().catch(() => []),
        ]);

        if (!mounted) return;
        setData({
          health,
          tenantStatus,
          buildings,
          residents,
          partners,
          perks,
          events,
          campaigns,
          surveys,
          surveyResponses,
          reports,
          redemptions,
          broadcasts,
          surveyProviderForms,
          messagingJourneys,
          integrationEndpoints,
          automationRuns,
          passportPrograms,
          crmSegments,
          aiInsights,
        });
      } catch (error) {
        console.error('Platform welcome data failed to load:', error);
      }
    }

    loadPlatformData();
    return () => {
      mounted = false;
    };
  }, []);

  const moduleCards = useMemo(
    () => [
      { name: 'Residents', count: data.residents.length, link: '/admin/residents', description: 'Manage enrollment, cards, access, engagement, and communications.', status: 'Active', automations: 'Enrollment, bulk updates' },
      { name: 'Properties', count: data.buildings.length, link: '/admin/properties', description: 'Operate the property portfolio, workspaces, map links, units, amenities, access, surveys, and reports.', status: 'Active', automations: 'Property reporting' },
      { name: 'Partners', count: data.partners.length || data.tenantStatus?.tenants || 0, link: '/admin/partner-portal', description: 'Provision tenant workspaces, partner accounts, roles, and performance views.', status: 'Active', automations: 'Partner provisioning' },
      { name: 'Perks', count: data.perks.length, link: '/admin/perks', description: 'Manage offers, QR redemption, partner attribution, and performance signals.', status: 'Active', automations: 'Redemption verification' },
      { name: 'Events', count: data.events.length, link: '/admin/events', description: 'Coordinate programming, RSVP tracking, attendance, follow-up, and event reports.', status: 'Active', automations: 'Event follow-up' },
      { name: 'Campaigns', count: data.campaigns.length + data.broadcasts.length, link: '/admin/engagement', description: 'Manage broadcasts, campaign actions, audiences, and resident participation.', status: 'Active', automations: 'Campaign triggers' },
      { name: 'Surveys', count: data.surveys.length, link: '/admin/surveys', description: 'Capture resident, event, perk, and building feedback with response exports.', status: 'Active', automations: 'Survey processing' },
      { name: 'Reports', count: data.reports.length, link: '/admin/reports', description: 'Generate partner, property, campaign, event, and engagement summaries.', status: 'Active', automations: 'Monthly reports' },
      { name: 'Analytics', count: data.redemptions.length + data.surveyResponses.length, link: '/admin/analytics', description: 'Aggregate redemptions, responses, activity, and participation into platform signals.', status: 'Active', automations: 'Trend analysis' },
    ],
    [data],
  );

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#0B1F33]">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
        <section className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Downtown Perks Platform</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-[#0B1F33] md:text-5xl">One operating system for downtown engagement.</h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-[rgba(11,31,51,0.68)]">
                Downtown Perks connects residents, buildings, hotels, venues, brands, civic organizations, events, and perks through a shared intelligence layer.
                Everything is managed from a single platform with unified reporting, communications, analytics, automations, and partner workspaces.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/admin" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#0B1F33] bg-[#0B1F33] px-4 text-xs font-semibold text-white">
                  Open Workspace <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/admin/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[rgba(11,31,51,0.12)] bg-white px-4 text-xs font-semibold text-[#0B1F33]">
                  View Performance <BarChart3 className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="grid gap-3 rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-4">
              <Stat label="Platform Health" value={data.health ? 'Online' : 'Loading'} />
              <Stat label="Tenant Workspaces" value={data.tenantStatus?.tenants || 0} />
              <Stat label="Last Updated" value={lastUpdated()} />
            </div>
          </div>
        </section>

        <Section title="Platform overview" eyebrow="Live modules" description="Data-backed module status from the current admin dataset.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {moduleCards.map((module) => (
              <ModuleCard key={module.name} module={module} />
            ))}
          </div>
        </Section>

        <Section title="How Downtown Perks works" eyebrow="Operating flow" description="The platform connects property context to resident activity, partner participation, analytics, and reporting.">
          <div className="grid gap-3 lg:grid-cols-7">
            {architectureFlow.map((step, index) => (
              <article key={step.title} className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-4">
                <span className="text-[11px] font-bold text-[#C8A96A]">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-2 text-sm font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{step.body}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Connected participants" eyebrow="Ecosystem" description="Each participant contributes operational data and receives workspace value back from the platform.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {participants.map((participant) => (
              <article key={participant.name} className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
                <h3 className="text-base font-semibold">{participant.name}</h3>
                <ParticipantLine label="Contribute" value={participant.contribute} />
                <ParticipantLine label="Receive" value={participant.receive} />
                <ParticipantLine label="Manage" value={participant.manage} />
              </article>
            ))}
          </div>
        </Section>

        <Section title="Platform modules" eyebrow="Operations" description="Every module should open to an operational workflow with records, status, users, automations, and reports.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {moduleCards.map((module) => (
              <article key={`status-${module.name}`} className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-[#C8A96A]">{module.status}</p>
                    <h3 className="mt-1 text-lg font-semibold">{module.name}</h3>
                  </div>
                  <span className="text-2xl font-semibold">{module.count}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-[rgba(11,31,51,0.62)]">
                  <p><strong className="text-[#0B1F33]">Records:</strong> {module.count}</p>
                  <p><strong className="text-[#0B1F33]">Users:</strong> Platform operators and workspace members</p>
                  <p><strong className="text-[#0B1F33]">Automations:</strong> {module.automations}</p>
                  <p><strong className="text-[#0B1F33]">Last updated:</strong> {lastUpdated()}</p>
                </div>
                <Link to={module.link} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0B1F33] hover:text-[#C8A96A]">
                  Open module <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Platform automations" eyebrow="Workflow engine" description="Current and planned automation pathways that move platform data into action.">
          <div className="overflow-x-auto rounded-xl border border-[rgba(11,31,51,0.08)] bg-white">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-[rgba(11,31,51,0.08)] text-[11px] font-bold uppercase text-[rgba(11,31,51,0.56)]">
                <tr>
                  <th className="p-4">Automation</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Trigger</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Last run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(11,31,51,0.08)]">
                {automationRows.map(([name, trigger, action]) => (
                  <tr key={name}>
                    <td className="p-4 font-semibold">{name}</td>
                    <td className="p-4 text-[#C8A96A]">Active</td>
                    <td className="p-4 text-[rgba(11,31,51,0.62)]">{trigger}</td>
                    <td className="p-4 text-[rgba(11,31,51,0.62)]">{action}</td>
                    <td className="p-4 text-[rgba(11,31,51,0.62)]">{lastUpdated()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Survey + Messaging + CRM architecture" eyebrow="Resident intelligence" description="The feedback layer connects surveys, SMS, CRM segmentation, reporting, and AI recommendations instead of treating surveys as isolated forms.">
          <div className="grid gap-4 lg:grid-cols-3">
            {crmLayers.map(([layer, platform, purpose]) => (
              <article key={layer} className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
                <p className="text-[11px] font-bold uppercase text-[#C8A96A]">{layer}</p>
                <h3 className="mt-2 text-lg font-semibold">{platform}</h3>
                <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{purpose}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase text-[#C8A96A]">Launch stack</p>
                  <h3 className="mt-2 text-lg font-semibold">Tally + Twilio + Supabase + n8n + OpenAI</h3>
                </div>
                <Zap className="h-5 w-5 text-[#C8A96A]" />
              </div>
              <div className="mt-4 grid gap-3">
                {data.integrationEndpoints.map((endpoint) => (
                  <div key={endpoint.id || endpoint.name} className="flex flex-wrap items-start justify-between gap-3 border-t border-[rgba(11,31,51,0.08)] pt-3">
                    <div>
                      <p className="text-sm font-semibold">{endpoint.name}</p>
                      <p className="mt-1 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{endpoint.purpose}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase text-[rgba(11,31,51,0.52)]">{endpoint.status || 'pending'}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
              <p className="text-[11px] font-bold uppercase text-[#C8A96A]">Operating records</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Stat label="Survey provider forms" value={data.surveyProviderForms.length} />
                <Stat label="Messaging journeys" value={data.messagingJourneys.length} />
                <Stat label="CRM segments" value={data.crmSegments.length} />
                <Stat label="Passport programs" value={data.passportPrograms.length} />
                <Stat label="Automation runs" value={data.automationRuns.length} />
                <Stat label="AI insights" value={data.aiInsights.length} />
              </div>
              <p className="mt-5 text-sm leading-6 text-[rgba(11,31,51,0.62)]">
                Credentials are tracked as integration status records. External calls remain inactive until provider keys, webhook secrets, and service IDs are configured.
              </p>
            </article>
          </div>
        </Section>

        <Section title="Roadmap" eyebrow="Platform phases" description="The 3014 admin environment should scale from operations into partner intelligence and cross-module downtown analytics.">
          <div className="grid gap-4 lg:grid-cols-3">
            {roadmap.map((item) => (
              <article key={item.phase} className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
                <p className="text-[11px] font-bold uppercase text-[#C8A96A]">{item.phase}</p>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{item.body}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Quick access" eyebrow="Operator navigation" description="Open the core backend workflows without exposing public or resident-facing navigation.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.to} to={link.to} className="flex min-h-14 items-center justify-between rounded-xl border border-[rgba(11,31,51,0.08)] bg-white px-4 text-sm font-semibold text-[#0B1F33] hover:text-[#C8A96A]">
                  <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {link.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ eyebrow, title, description, children }: any) {
  return (
    <section className="py-10 md:py-14">
      <div className="mb-6 max-w-4xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#0B1F33] md:text-3xl">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)] md:text-base">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[rgba(11,31,51,0.08)] pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-[rgba(11,31,51,0.62)]">{label}</span>
      <strong className="text-sm font-semibold">{value}</strong>
    </div>
  );
}

function ModuleCard({ module }: any) {
  return (
    <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{module.name}</h3>
          <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{module.description}</p>
        </div>
        <span className="rounded-lg border border-[rgba(11,31,51,0.08)] px-3 py-2 text-sm font-semibold">{module.count}</span>
      </div>
      <Link to={module.link} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0B1F33] hover:text-[#C8A96A]">
        Open <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function ParticipantLine({ label, value }: any) {
  return (
    <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.62)]">
      <strong className="text-[#0B1F33]">{label}:</strong> {value}
    </p>
  );
}
