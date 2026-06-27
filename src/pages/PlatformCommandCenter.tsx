import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Building2, CalendarDays, FileText, Megaphone, MessageSquare, ShieldCheck, Ticket, Users, Workflow } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const platformRoutes = [
  { label: 'Partners', to: '/admin/partner', icon: ShieldCheck, description: 'Open the businesses, brands, venues, hotels, and civic groups in Downtown Perks.' },
  { label: 'Buildings', to: '/admin/buildings', icon: Building2, description: 'See properties, residents, amenities, and building activity in one place.' },
  { label: 'Events', to: '/admin/events', icon: CalendarDays, description: 'Review what is coming up, who said yes, and what needs a follow-up.' },
  { label: 'Perks', to: '/admin/perks', icon: Ticket, description: 'Create offers residents can understand, save, scan, and use.' },
  { label: 'Notes', to: '/admin/engagement', icon: Megaphone, description: 'Plan the short messages that help people know what is happening nearby.' },
  { label: 'Residents', to: '/admin/residents', icon: Users, description: 'Find resident profiles, building links, saved perks, and event activity.' },
  { label: 'Reports', to: '/admin/reports', icon: FileText, description: 'See what people found, saved, joined, and used.' },
  { label: 'Settings', to: '/admin/settings', icon: BarChart3, description: 'Adjust access, messages, and connected tools.' },
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
    { label: 'Partners', value: data.tenants?.tenants || data.partners.length, detail: 'Businesses and organizations you can open and support.', area: 'Partners', to: '/admin/partner' },
    { label: 'Buildings', value: data.buildings.length, detail: 'Properties with resident, amenity, or building activity.', area: 'Properties', to: '/admin/buildings' },
    { label: 'Residents', value: data.residents.length, detail: 'People with profiles, access status, building links, or saved activity.', area: 'Residents', to: '/admin/residents' },
    { label: 'Events', value: data.events.length, detail: 'Programming that can be shared, followed up on, and reviewed.', area: 'Events', to: '/admin/events' },
    { label: 'Perks', value: data.perks.length, detail: 'Offers residents can find, save, scan, and use.', area: 'Perks', to: '/admin/perks' },
    { label: 'Notes', value: data.campaigns.length, detail: 'Short messages that connect residents to offers and events.', area: 'Notes', to: '/admin/engagement' },
    { label: 'Surveys', value: data.surveys.length, detail: 'Feedback forms used to learn what residents and partners need.', area: 'Surveys', to: '/admin/surveys' },
    { label: 'Reports', value: data.reports.length, detail: 'Clear summaries for partners, properties, notes, and activity.', area: 'Reports', to: '/admin/reports' },
    { label: 'Connected tools', value: data.integrations.length, detail: 'Forms, messages, and reports that can talk to each other.', area: 'Tools', to: '/admin/settings' },
    { label: 'Follow-ups', value: data.automations.length, detail: 'Reminders and handoffs that keep people from missing the next step.', area: 'Follow-ups', to: '/admin/home' },
    { label: 'Message paths', value: data.journeys.length, detail: 'Resident, event, passport, and partner follow-up messages.', area: 'Messages', to: '/admin/engagement' },
    { label: 'Next steps', value: data.insights.length, detail: 'Recommended moves ready for review.', area: 'Suggestions', to: '/admin/analytics' },
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
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Today downtown</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">A clear read on what is moving</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-[rgba(11,31,51,0.68)]">
            Start here to open partners, buildings, residents, events, perks, notes, surveys, reports, and the tools that keep the day moving.
          </p>
        </section>

        <section className="py-10">
          <SummaryTable
            eyebrow="Quick read"
            title="What is active right now"
            description="Use each row to jump to the area you want to review."
            rows={metrics}
          />
        </section>

        <section className="grid gap-6 py-10 xl:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Main areas</p>
            <h2 className="mt-2 text-2xl font-semibold">Open the right area.</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">Each area below explains what it helps you review or share during a walkthrough.</p>
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
              Places with momentum
              <span className="dp-admin-collapsible__meta">Quick access to the partners, places, events, and notes worth opening first.</span>
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
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Listening and follow-up</p>
            <h2 className="mt-2 text-2xl font-semibold">What residents tell us, and what we do next.</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">
              Surveys, reminders, passports, and suggestions sit together so the next helpful move is easier to see.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoLink icon={MessageSquare} label="Surveys" value={`${data.surveys.length} live or saved`} to="/admin/surveys" />
            <InfoLink icon={Workflow} label="Follow-ups" value={`${data.automations.length} ready`} to="/admin/home" />
            <InfoLink icon={Ticket} label="Passports" value={`${data.passports.length} programs`} to="/admin/perks" />
            <InfoLink icon={BarChart3} label="Suggestions" value={`${data.insights.length} ready`} to="/admin/analytics" />
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
              <th className="px-4 py-3">Why it matters</th>
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
