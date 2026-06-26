import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Building2, CalendarDays, FileText, Megaphone, MessageSquare, ShieldCheck, Ticket, Users, Workflow } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const platformRoutes = [
  { label: 'Partners', to: '/admin/partner', icon: ShieldCheck, description: 'Open every business, brand, venue, hotel, civic group, and workspace connected to Downtown Perks.' },
  { label: 'Buildings', to: '/admin/buildings', icon: Building2, description: 'Manage properties, buildings, resident access, amenities, and building-level activity.' },
  { label: 'Events', to: '/admin/events', icon: CalendarDays, description: 'Review upcoming events, RSVPs, attendance, follow-up tasks, and event reporting.' },
  { label: 'Perks', to: '/admin/perks', icon: Ticket, description: 'Create and manage offers, redemption rules, partner links, scans, and redemptions.' },
  { label: 'Campaigns', to: '/admin/engagement', icon: Megaphone, description: 'Plan outreach, messages, placements, and partner campaigns from one area.' },
  { label: 'Residents', to: '/admin/residents', icon: Users, description: 'Find resident profiles, access status, building assignment, activity, and preferences.' },
  { label: 'Reports', to: '/admin/reports', icon: FileText, description: 'Open partner, property, event, campaign, resident, and platform reports.' },
  { label: 'Settings', to: '/admin/settings', icon: BarChart3, description: 'Manage account settings, notifications, user access, and connected services.' },
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
    { label: 'Active Partners', value: data.tenants?.tenants || data.partners.length, detail: 'Businesses and organizations you can open, review, and support.', area: 'Partners', to: '/admin/partner' },
    { label: 'Active Buildings', value: data.buildings.length, detail: 'Properties with resident, amenity, or building activity to manage.', area: 'Properties', to: '/admin/buildings' },
    { label: 'Residents', value: data.residents.length, detail: 'People with profiles, access status, building links, or saved activity.', area: 'Residents', to: '/admin/residents' },
    { label: 'Events', value: data.events.length, detail: 'Programming that can be promoted, tracked, and reported.', area: 'Events', to: '/admin/events' },
    { label: 'Perks', value: data.perks.length, detail: 'Offers that residents can discover, save, scan, and redeem.', area: 'Perks', to: '/admin/perks' },
    { label: 'Campaigns', value: data.campaigns.length, detail: 'Outreach efforts that connect partners, residents, offers, and events.', area: 'Campaigns', to: '/admin/engagement' },
    { label: 'Surveys', value: data.surveys.length, detail: 'Feedback forms used to learn what residents and partners need.', area: 'Surveys', to: '/admin/surveys' },
    { label: 'Reports', value: data.reports.length, detail: 'Saved report spaces for partners, properties, campaigns, and activity.', area: 'Reports', to: '/admin/reports' },
    { label: 'Integrations', value: data.integrations.length, detail: 'Connected tools and setup checks for forms, messages, reports, and AI.', area: 'Integrations', to: '/admin/settings' },
    { label: 'Automations', value: data.automations.length, detail: 'Follow-ups, reminders, and handoffs that help work keep moving.', area: 'Automation', to: '/admin/home' },
    { label: 'Messaging Journeys', value: data.journeys.length, detail: 'Message paths for residents, events, passports, and partner follow-up.', area: 'Messaging', to: '/admin/engagement' },
    { label: 'AI Insights', value: data.insights.length, detail: 'Suggested next steps and summaries ready for review.', area: 'Insights', to: '/admin/analytics' },
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
        <section className="border border-[rgba(11,31,51,0.08)] bg-white p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Platform overview</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Command Center</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-[rgba(11,31,51,0.68)]">
            Start here to open partners, buildings, residents, events, perks, campaigns, surveys, reports, connected tools, and platform activity.
          </p>
        </section>

        <section className="py-10">
          <SummaryTable
            eyebrow="Platform summary"
            title="What is active right now"
            description="Use each row to jump directly into the area you want to review."
            rows={metrics}
          />
        </section>

        <section className="grid gap-6 py-10 xl:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Main areas</p>
            <h2 className="mt-2 text-2xl font-semibold">Open the right workspace.</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">Each area below explains what it helps you review, manage, or share during a walkthrough.</p>
          </div>
          <div className="border border-[rgba(11,31,51,0.08)] bg-white">
            {platformRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <Link key={route.to} to={route.to} className="group grid gap-2 border-b border-[rgba(11,31,51,0.08)] px-4 py-4 text-sm last:border-b-0 hover:bg-[#F7F8FB]">
                  <span className="flex items-center justify-between gap-4 font-semibold text-[#0B1F33] group-hover:text-[#C8A96A]">
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {route.label}</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <span className="leading-6 text-[rgba(11,31,51,0.62)]">{route.description}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <details open className="dp-admin-collapsible py-3">
          <summary>
            <span>
              Top performing entities
              <span className="dp-admin-collapsible__meta">Quick access to the strongest partner, property, event, and campaign records.</span>
            </span>
          </summary>
          <div className="mt-5 overflow-x-auto border border-[rgba(11,31,51,0.08)] bg-white">
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
        </details>

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
    <Link to={to} className="flex min-h-16 items-center justify-between gap-4 border border-[rgba(11,31,51,0.08)] bg-white px-4 text-sm font-semibold hover:text-[#C8A96A]">
      <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
      <span className="text-xs font-semibold text-[rgba(11,31,51,0.52)]">{value}</span>
    </Link>
  );
}

function SummaryTable({ eyebrow, title, description, rows }: any) {
  const navigate = useNavigate();

  return (
    <details open className="dp-admin-collapsible overflow-hidden bg-white">
      <summary>
        <span>
          {title}
          <span className="dp-admin-collapsible__meta">{eyebrow}. {description}</span>
        </span>
      </summary>
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[rgba(11,31,51,0.08)] text-[11px] font-bold uppercase text-[rgba(11,31,51,0.52)]">
            <tr>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Use this for</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(11,31,51,0.08)]">
            {rows.map((row: any) => (
              <tr
                key={row.label}
                className="group cursor-pointer align-top transition-colors hover:bg-[#F7F8FB]"
                role="link"
                tabIndex={0}
                onClick={() => navigate(row.to)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(row.to);
                  }
                }}
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#0B1F33] group-hover:text-[#C8A96A]">{row.label}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-[rgba(11,31,51,0.46)]">{row.area}</p>
                </td>
                <td className="px-4 py-3 text-2xl font-semibold text-[#0B1F33]">{Number(row.value || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-[rgba(11,31,51,0.62)]">{row.detail}</td>
                <td className="px-4 py-3">
                  <Link
                    to={row.to}
                    className="inline-flex min-h-9 items-center gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-3 text-xs font-semibold text-[#0B1F33] hover:border-[#C8A96A] hover:text-[#C8A96A]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
