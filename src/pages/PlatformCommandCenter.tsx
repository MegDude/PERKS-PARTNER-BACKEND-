import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Building2, CalendarDays, FileText, Megaphone, MessageSquare, ShieldCheck, Ticket, Users, Workflow } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const platformRoutes = [
  { label: 'Partners', to: '/admin/partner', icon: ShieldCheck, description: 'Open the businesses, hotels, venues, brands, and civic groups in Downtown Perks.' },
  { label: 'Buildings', to: '/admin/buildings', icon: Building2, description: 'Review properties, residents, amenities, and building activity together.' },
  { label: 'Events', to: '/admin/events', icon: CalendarDays, description: 'See what is coming up, who is coming, and what needs a nudge.' },
  { label: 'Perks', to: '/admin/perks', icon: Ticket, description: 'Create offers residents can understand, save, and use.' },
  { label: 'Broadcasts', to: '/admin/engagement', icon: Megaphone, description: 'Send short notes that point people to nearby plans.' },
  { label: 'Residents', to: '/admin/residents', icon: Users, description: 'Find resident profiles, building links, saved perks, and event activity.' },
  { label: 'Reports', to: '/admin/reports', icon: FileText, description: 'Read what people found, saved, joined, and used.' },
  { label: 'Settings', to: '/admin/settings', icon: BarChart3, description: 'Manage access, messages, and connected accounts.' },
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
    { label: 'Partners', value: data.tenants?.tenants || data.partners.length, detail: 'Businesses and organizations you can open from here.', area: 'Partners', to: '/admin/partner' },
    { label: 'Buildings', value: data.buildings.length, detail: 'Properties with residents, amenities, or building activity.', area: 'Properties', to: '/admin/buildings' },
    { label: 'Residents', value: data.residents.length, detail: 'People with profiles, access, building links, or saved activity.', area: 'Residents', to: '/admin/residents' },
    { label: 'Events', value: data.events.length, detail: 'Plans that can be shared, followed up on, and reviewed.', area: 'Events', to: '/admin/events' },
    { label: 'Perks', value: data.perks.length, detail: 'Offers residents can understand, save, and use.', area: 'Perks', to: '/admin/perks' },
    { label: 'Broadcasts', value: data.campaigns.length, detail: 'Short notes that point people to offers and events.', area: 'Broadcasts', to: '/admin/engagement' },
    { label: 'Surveys', value: data.surveys.length, detail: 'Questions that help you hear what people need.', area: 'Surveys', to: '/admin/surveys' },
    { label: 'Reports', value: data.reports.length, detail: 'Plain summaries for partners, properties, and activity.', area: 'Reports', to: '/admin/reports' },
    { label: 'Connected work', value: data.integrations.length, detail: 'Forms, notes, and reports that are ready to work together.', area: 'Tools', to: '/admin/settings' },
    { label: 'Follow-ups', value: data.automations.length, detail: 'Reminders and handoffs ready for the next move.', area: 'Follow-ups', to: '/admin/home' },
    { label: 'Message paths', value: data.journeys.length, detail: 'Resident, event, passport, and partner notes in progress.', area: 'Messages', to: '/admin/engagement' },
    { label: 'Next steps', value: data.insights.length, detail: 'Useful suggestions ready to review.', area: 'Suggestions', to: '/admin/analytics' },
  ];

  const topEntities = [
    ...data.buildings.map((item: any) => ({ name: item.name, type: 'Building', score: item.activityScore || item.walkScore || 0, to: '/admin/buildings' })),
    ...data.perks.map((item: any) => ({ name: item.name || item.title, type: 'Perk', score: item.redemption_count || 0, to: '/admin/perks' })),
    ...data.events.map((item: any) => ({ name: item.title, type: 'Event', score: item.registered_count || 0, to: '/admin/events' })),
  ]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-white text-[#0B1F33]">
      <div className="mx-auto max-w-[1180px] px-5 py-7 sm:px-8">
        <section className="bg-white py-4 md:py-7">
          <p className="text-[11px] font-semibold uppercase text-[#C8A96A]">Today downtown</p>
          <h1 className="mt-3 text-[2rem] font-semibold leading-[1.08] md:text-[3.4rem]">A useful read on what is moving.</h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[rgba(11,31,51,0.68)]">
            Start here to open partners, buildings, residents, events, perks, broadcasts, surveys, and reports without hunting around.
          </p>
        </section>

        <section className="py-7">
          <SummaryRows
            eyebrow="Quick read"
            title="What is active right now"
            description="Tap a row to open the area."
            rows={metrics}
          />
        </section>

        <section className="grid gap-8 py-8 xl:grid-cols-[0.62fr_1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase text-[#C8A96A]">Main areas</p>
            <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight">Open the right place.</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[rgba(11,31,51,0.62)]">A short guide to where each piece of the day lives.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {platformRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <Link key={route.to} to={route.to} className="group grid gap-2 bg-white py-1 text-sm">
                  <span className="flex items-center gap-2 font-semibold text-[#0B1F33] group-hover:text-[#C8A96A]">
                    <Icon className="h-4 w-4" /> {route.label}
                  </span>
                  <span className="leading-6 text-[rgba(11,31,51,0.62)]">{route.description}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B1F33] group-hover:text-[#C8A96A]">Open <ArrowRight className="h-3.5 w-3.5" /></span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="py-8">
          <p className="text-[11px] font-semibold uppercase text-[#C8A96A]">Worth opening first</p>
          <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight">Places with momentum.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgba(11,31,51,0.62)]">The partners, places, events, and broadcasts worth opening next.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topEntities.map((entity) => (
              <Link key={`${entity.type}-${entity.name}`} to={entity.to} className="group grid gap-1 bg-white text-sm">
                <span className="font-semibold text-[#0B1F33] group-hover:text-[#C8A96A]">{entity.name}</span>
                <span className="text-xs text-[rgba(11,31,51,0.56)]">{entity.type} · {Number(entity.score || 0).toLocaleString()} recent actions</span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#0B1F33] group-hover:text-[#C8A96A]">Open <ArrowRight className="h-3.5 w-3.5" /></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-8 py-8 xl:grid-cols-[0.62fr_1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase text-[#C8A96A]">Listening and follow-up</p>
            <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight">What people tell us next.</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">
              Surveys, reminders, passports, and suggestions sit together so the next helpful move is easier to see.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
    <Link to={to} className="group grid gap-1 bg-white text-sm font-semibold hover:text-[#C8A96A]">
      <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
      <span className="text-xs font-semibold text-[rgba(11,31,51,0.52)]">{value}</span>
    </Link>
  );
}

function SummaryRows({ eyebrow, title, description, rows }: any) {
  const navigate = useNavigate();

  return (
    <section className="bg-white">
      <p className="text-[11px] font-semibold uppercase text-[#C8A96A]">{eyebrow}</p>
      <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgba(11,31,51,0.62)]">{description}</p>
      <div className="mt-5 grid gap-4">
        {rows.map((row: any) => (
          <button
            key={row.label}
            type="button"
            className="group grid w-full cursor-pointer grid-cols-1 gap-1 bg-white py-1 text-left sm:grid-cols-[1fr_84px_1.45fr_58px] sm:items-start sm:gap-5"
            onClick={() => navigate(row.to)}
          >
            <span>
              <span className="block text-sm font-semibold text-[#0B1F33] group-hover:text-[#C8A96A]">{row.label}</span>
              <span className="mt-0.5 block text-[11px] font-semibold uppercase text-[rgba(11,31,51,0.46)]">{row.area}</span>
            </span>
            <span className="text-[1.35rem] font-semibold leading-none text-[#0B1F33]">{Number(row.value || 0).toLocaleString()}</span>
            <span className="text-sm normal-case leading-6 text-[rgba(11,31,51,0.62)]">{row.detail}</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B1F33] group-hover:text-[#C8A96A]">Open <ArrowRight className="h-3.5 w-3.5" /></span>
          </button>
        ))}
      </div>
    </section>
  );
}
