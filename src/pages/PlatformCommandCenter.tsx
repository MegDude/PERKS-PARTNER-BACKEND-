import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Building2, CalendarDays, FileText, Megaphone, MessageSquare, ShieldCheck, Ticket, Users, Workflow } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const platformRoutes = [
  { label: 'Partners', to: '/admin/partner', icon: ShieldCheck },
  { label: 'Buildings', to: '/admin/buildings', icon: Building2 },
  { label: 'Events', to: '/admin/events', icon: CalendarDays },
  { label: 'Perks', to: '/admin/perks', icon: Ticket },
  { label: 'Campaigns', to: '/admin/engagement', icon: Megaphone },
  { label: 'Residents', to: '/admin/residents', icon: Users },
  { label: 'Reports', to: '/admin/reports', icon: FileText },
  { label: 'Settings', to: '/admin/settings', icon: BarChart3 },
];

export default function PlatformCommandCenter() {
  const [data, setData] = useState<any>({
    partners: [],
    buildings: [],
    residents: [],
    events: [],
    perks: [],
    campaigns: [],
    surveys: [],
    reports: [],
    integrations: [],
    automations: [],
    journeys: [],
    passports: [],
    insights: [],
    tenants: null,
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [partners, buildings, residents, events, perks, campaigns, surveys, reports, integrations, automations, journeys, passports, insights, tenants] = await Promise.all([
        base44.entities.Partner.list().catch(() => []),
        base44.entities.Building.list().catch(() => []),
        base44.entities.Tenant.list().catch(() => []),
        base44.entities.Event.list().catch(() => []),
        base44.entities.PerkLocation.list().catch(() => []),
        base44.entities.Campaign.list().catch(() => []),
        base44.entities.Survey.list().catch(() => []),
        base44.entities.PartnerReport.list().catch(() => []),
        base44.entities.IntegrationEndpoint.list().catch(() => []),
        base44.entities.AutomationRun.list().catch(() => []),
        base44.entities.MessagingJourney.list().catch(() => []),
        base44.entities.PassportProgram.list().catch(() => []),
        base44.entities.AiInsight.list().catch(() => []),
        fetch('/api/tenant-provisioning/status').then((res) => res.json()).catch(() => null),
      ]);
      if (mounted) setData({ partners, buildings, residents, events, perks, campaigns, surveys, reports, integrations, automations, journeys, passports, insights, tenants });
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = [
    { label: 'Active Partners', value: data.tenants?.tenants || data.partners.length, detail: 'Tenant workspaces and partner records' },
    { label: 'Active Buildings', value: data.buildings.length, detail: 'Property operations records' },
    { label: 'Residents', value: data.residents.length, detail: 'CRM and access records' },
    { label: 'Events', value: data.events.length, detail: 'Programming records' },
    { label: 'Perks', value: data.perks.length, detail: 'Offer and redemption network' },
    { label: 'Campaigns', value: data.campaigns.length, detail: 'Engagement actions' },
    { label: 'Surveys', value: data.surveys.length, detail: 'Feedback programs' },
    { label: 'Reports', value: data.reports.length, detail: 'Reporting containers' },
    { label: 'Integrations', value: data.integrations.length, detail: 'Tally, Twilio, Supabase, n8n, OpenAI, and Sheets readiness' },
    { label: 'Automations', value: data.automations.length, detail: 'Webhook, SMS, passport, and AI workflow records' },
    { label: 'Messaging Journeys', value: data.journeys.length, detail: 'Resident, event, passport, and partner intelligence flows' },
    { label: 'AI Insights', value: data.insights.length, detail: 'Recommendations and analysis generated for operators' },
  ];

  const topEntities = [
    ...data.buildings.map((item: any) => ({ name: item.name, type: 'Building', score: item.activityScore || item.walkScore || 0, to: '/admin/buildings' })),
    ...data.perks.map((item: any) => ({ name: item.name || item.title, type: 'Perk', score: item.redemption_count || 0, to: '/admin/perks' })),
    ...data.events.map((item: any) => ({ name: item.title, type: 'Event', score: item.registered_count || 0, to: '/admin/events' })),
  ]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#0B1F33]">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
        <section className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Super admin</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Platform Command Center</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-[rgba(11,31,51,0.68)]">
            Global visibility across partners, buildings, residents, events, perks, campaigns, surveys, reports, and platform health.
          </p>
        </section>

        <section className="py-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
                <p className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.52)]">{metric.label}</p>
                <strong className="mt-3 block text-3xl font-semibold">{metric.value}</strong>
                <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{metric.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 py-10 xl:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Platform routes</p>
            <h2 className="mt-2 text-2xl font-semibold">Super admin navigation.</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">These routes roll up the ecosystem and forward into the existing operational modules while the workspace hierarchy is expanded.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {platformRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <Link key={route.to} to={route.to} className="flex min-h-14 items-center justify-between rounded-xl border border-[rgba(11,31,51,0.08)] bg-white px-4 text-sm font-semibold hover:text-[#C8A96A]">
                  <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {route.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="py-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Live platform intelligence</p>
          <h2 className="mt-2 text-2xl font-semibold">Top performing entities.</h2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-[rgba(11,31,51,0.08)] bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[rgba(11,31,51,0.08)] text-[11px] font-bold uppercase text-[rgba(11,31,51,0.52)]">
                <tr><th className="p-4">Entity</th><th className="p-4">Type</th><th className="p-4">Score</th><th className="p-4">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-[rgba(11,31,51,0.08)]">
                {topEntities.map((entity) => (
                  <tr key={`${entity.type}-${entity.name}`}>
                    <td className="p-4 font-semibold">{entity.name}</td>
                    <td className="p-4 text-[rgba(11,31,51,0.62)]">{entity.type}</td>
                    <td className="p-4 text-[rgba(11,31,51,0.62)]">{entity.score}</td>
                    <td className="p-4"><Link to={entity.to} className="font-semibold text-[#0B1F33] hover:text-[#C8A96A]">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 py-10 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Survey + messaging operations</p>
            <h2 className="mt-2 text-2xl font-semibold">Resident intelligence stack.</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">
              The platform now tracks survey providers, Twilio messaging journeys, workflow automations, passport programs, and AI insight records as operating objects.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoLink icon={MessageSquare} label="Survey OS" value={`${data.surveys.length} surveys`} to="/admin/surveys" />
            <InfoLink icon={Workflow} label="Automations" value={`${data.automations.length} workflow records`} to="/admin/home" />
            <InfoLink icon={Ticket} label="Passport Programs" value={`${data.passports.length} programs`} to="/admin/perks" />
            <InfoLink icon={BarChart3} label="AI Insights" value={`${data.insights.length} recommendations`} to="/admin/analytics" />
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoLink({ icon: Icon, label, value, to }: any) {
  return (
    <Link to={to} className="flex min-h-16 items-center justify-between gap-4 rounded-xl border border-[rgba(11,31,51,0.08)] bg-white px-4 text-sm font-semibold hover:text-[#C8A96A]">
      <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
      <span className="text-xs font-semibold text-[rgba(11,31,51,0.52)]">{value}</span>
    </Link>
  );
}
