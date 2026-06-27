import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Hotel,
  Loader2,
  Megaphone,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Users,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { platformArchitecture } from '@/platform/registry';

const moduleRoutes = [
  { label: 'Today downtown', to: '/admin/platform', icon: ShieldCheck },
  { label: 'Partners', to: '/admin/partner', icon: ShoppingBag },
  { label: 'Properties', to: '/admin/properties', icon: Building2 },
  { label: 'Hotels', to: '/admin/partner', icon: Hotel },
  { label: 'Venues', to: '/admin/partner', icon: Ticket },
  { label: 'Brands', to: '/admin/partner', icon: ShoppingBag },
  { label: 'Civic', to: '/admin/partner', icon: ShieldCheck },
  { label: 'Events', to: '/admin/events', icon: CalendarDays },
  { label: 'Perks', to: '/admin/perks', icon: Ticket },
  { label: 'Notes to send', to: '/admin/engagement', icon: Megaphone },
  { label: 'Reports', to: '/admin/reports', icon: FileText },
  { label: 'Plans & billing', to: '/admin/promotions', icon: CreditCard },
  { label: 'People with access', to: '/admin/settings', icon: Users },
  { label: 'Messages', to: '/admin/settings', icon: Bell },
  { label: 'Health check', to: '/admin/platform', icon: Activity },
];

export default function BackendWorkspace() {
  const [data, setData] = useState<any>({
    health: null,
    tenantsStatus: null,
    partners: [],
    platformTenants: [],
    buildings: [],
    residents: [],
    perks: [],
    redemptions: [],
    events: [],
    rsvps: [],
    campaigns: [],
    reports: [],
    broadcasts: [],
    users: [],
    notifications: [],
    auditLogs: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [
          health,
          tenantsStatus,
          partners,
          platformTenants,
          buildings,
          residents,
          perks,
          redemptions,
          events,
          rsvps,
          campaigns,
          reports,
          broadcasts,
          users,
          notifications,
          auditLogs,
        ] = await Promise.all([
          fetch('/api/health').then((res) => res.json()).catch(() => null),
          fetch('/api/tenant-provisioning/status').then((res) => res.json()).catch(() => null),
          base44.entities.Partner.list().catch(() => []),
          base44.entities.PlatformTenant.list().catch(() => []),
          base44.entities.Building.list().catch(() => []),
          base44.entities.Tenant.list().catch(() => []),
          base44.entities.PerkLocation.list().catch(() => []),
          base44.entities.PerkRedemption.list().catch(() => []),
          base44.entities.Event.list().catch(() => []),
          base44.entities.EventRSVP.list().catch(() => []),
          base44.entities.Campaign.list().catch(() => []),
          base44.entities.PartnerReport.list().catch(() => []),
          base44.entities.Broadcast.list().catch(() => []),
          base44.entities.User.list().catch(() => []),
          base44.entities.ManagementNotification.list().catch(() => []),
          base44.entities.TenantAuditLog.list().catch(() => []),
        ]);

        if (mounted) {
          setData({ health, tenantsStatus, partners, platformTenants, buildings, residents, perks, redemptions, events, rsvps, campaigns, reports, broadcasts, users, notifications, auditLogs });
        }
      } catch (error) {
        console.error('Platform operations dashboard failed to load:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const tenantTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.platformTenants.forEach((tenant: any) => {
      const type = tenant.type || 'partner';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [data.platformTenants]);

  const activePerks = data.perks.filter((perk: any) => !perk.deleted_at && (perk.active || perk.is_active || perk.status === 'active')).length;
  const upcomingEvents = data.events.filter((event: any) => !event.date || new Date(event.date) >= new Date(new Date().toDateString())).length;
  const runningCampaigns = data.campaigns.filter((campaign: any) => campaign.status === 'active' || campaign.active || !campaign.status).length + data.broadcasts.length;
  const perkSaves = data.perks.reduce((sum: number, perk: any) => sum + Number(perk.saves || perk.save_count || 0), 0);
  const qrScans = data.perks.reduce((sum: number, perk: any) => sum + Number(perk.scans || perk.scan_count || 0), 0) + data.redemptions.length;

  const kpis = [
    { label: 'Partners', value: data.partners.length || data.tenantsStatus?.tenants || 0, detail: 'Partner profiles ready to open', area: 'Partners', to: '/admin/partner' },
    { label: 'Properties', value: data.buildings.filter((building: any) => building.active !== false).length, detail: 'Buildings ready to review', area: 'Properties', to: '/admin/properties' },
    { label: 'Hotels', value: tenantTypeCounts.hotel || tenantTypeCounts.hotel_group || 0, detail: 'Hotel partners in the mix', area: 'Hotels', to: '/admin/partner' },
    { label: 'Venues', value: tenantTypeCounts.venue || tenantTypeCounts.venue_group || 0, detail: 'Places ready for offers and events', area: 'Venues', to: '/admin/partner' },
    { label: 'Perks', value: activePerks, detail: 'Offers residents can see or use soon', area: 'Perks', to: '/admin/perks' },
    { label: 'Events', value: upcomingEvents, detail: 'Plans coming up downtown', area: 'Events', to: '/admin/events' },
    { label: 'Notes', value: runningCampaigns, detail: 'Messages and building notes in motion', area: 'Notes', to: '/admin/engagement' },
    { label: 'Residents', value: data.residents.length, detail: 'Resident profiles ready for support', area: 'Residents', to: '/admin/residents' },
    { label: 'Saved perks', value: perkSaves, detail: 'What residents wanted to keep', area: 'Perks', to: '/admin/perks' },
    { label: 'Perks used', value: data.redemptions.length, detail: 'Offers people actually used', area: 'Perks', to: '/admin/perks' },
    { label: 'Event RSVPs', value: data.rsvps.length, detail: 'People who said yes', area: 'Events', to: '/admin/events' },
    { label: 'Code scans', value: qrScans, detail: 'How residents found their way in', area: 'Codes', to: '/admin/perks' },
  ];

  const recentActivity = [...data.auditLogs, ...data.notifications]
    .sort((a: any, b: any) => new Date(b.created_at || b.sent_at || 0).getTime() - new Date(a.created_at || a.sent_at || 0).getTime())
    .slice(0, 8);

  const groupedModules = [
    {
      title: 'Operate',
      routes: moduleRoutes.filter((route) => ['Today downtown', 'Partners', 'Properties', 'Hotels', 'Venues', 'Brands', 'Civic'].includes(route.label)),
    },
    {
      title: 'Activate',
      routes: moduleRoutes.filter((route) => ['Events', 'Perks', 'Notes to send'].includes(route.label)),
    },
    {
      title: 'Measure',
      routes: moduleRoutes.filter((route) => ['Reports', 'Plans & billing', 'Health check'].includes(route.label)),
    },
    {
      title: 'Support',
      routes: moduleRoutes.filter((route) => ['People with access', 'Messages'].includes(route.label)),
    },
  ];

  const activeDirectory = [
    ...data.partners.map((partner: any) => ({
      id: partner.id,
      name: partner.business_name || partner.name || 'Partner',
      type: partner.category || partner.partner_type || 'partner',
      status: partner.status || (partner.is_active ? 'active' : 'review'),
      href: '/admin/partner',
    })),
    ...data.platformTenants.map((tenant: any) => ({
      id: tenant.id,
      name: tenant.name,
      type: tenant.type || 'workspace',
      status: tenant.status || 'active',
      href: tenant.workspace_path || '/admin/partner-portal',
    })),
    ...data.buildings.map((building: any) => ({
      id: building.id,
      name: building.name,
      type: building.type || 'property',
      status: building.active === false ? 'inactive' : 'active',
      href: '/admin/properties',
    })),
  ].slice(0, 14);

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0B1F33]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-5 text-[#0B1F33] sm:p-8">
      <section className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Start here</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">Downtown Perks, ready to run</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[rgba(11,31,51,0.66)]">
              Open the people, places, perks, events, notes, reports, and plans that keep downtown moving.
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-4">
            <StatusLine label="Site status" value={data.health?.status || 'unknown'} />
            <StatusLine label="Areas to open" value={data.health?.entities ? Object.keys(data.health.entities).length : 0} />
            <StatusLine label="Partner spaces" value={data.tenantsStatus?.workspaces || 0} />
            <StatusLine label="Recent changes" value={data.auditLogs.length} />
          </div>
        </div>
      </section>

      <SummaryTable
        eyebrow="Quick read"
        title="What is active right now"
        description="A compact view of the partners, properties, notes, resident activity, and reports ready to review."
        rows={kpis}
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Quick navigation</p>
            <h2 className="mt-2 text-xl font-semibold">Find the right area fast.</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">Use these groups to move through partners, properties, notes, reports, billing, and support without hunting through the sidebar.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {groupedModules.map((group) => (
              <div key={group.title} className="border border-[rgba(11,31,51,0.08)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.52)]">{group.title}</p>
                <div className="mt-3 grid gap-2">
                  {group.routes.map((route) => {
                    const Icon = route.icon;
                    return (
                      <Link key={route.label} to={route.to} className="flex min-h-11 items-center justify-between border-t border-[rgba(11,31,51,0.08)] py-2 text-sm font-semibold hover:text-[#C8A96A]">
                        <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {route.label}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Active directory</p>
          <h2 className="mt-2 text-xl font-semibold">Partners, businesses, and places.</h2>
          <div className="mt-5 grid gap-3">
            {activeDirectory.length === 0 ? (
              <p className="text-sm text-[rgba(11,31,51,0.58)]">No active partners or places yet.</p>
            ) : activeDirectory.map((item: any) => (
              <Link key={`${item.id}-${item.name}`} to={item.href} className="grid gap-1 border-t border-[rgba(11,31,51,0.08)] pt-3 text-sm hover:text-[#C8A96A]">
                <span className="font-semibold">{item.name}</span>
                <span className="text-xs font-semibold uppercase text-[rgba(11,31,51,0.52)]">{item.type} · {item.status}</span>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Recent activity</p>
        <h2 className="mt-2 text-xl font-semibold">Latest updates and messages.</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[rgba(11,31,51,0.58)]">No recent updates or messages yet.</p>
          ) : recentActivity.map((item: any) => (
            <div key={item.id} className="border-t border-[rgba(11,31,51,0.08)] pt-3">
              <p className="text-sm font-semibold">{item.action ? String(item.action).replace(/_/g, ' ') : item.message || item.type || 'Recent activity'}</p>
              <p className="mt-1 text-xs text-[rgba(11,31,51,0.52)]">{item.actor_email || item.recipient_email || 'Downtown Perks'} · {new Date(item.created_at || item.sent_at || Date.now()).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Action readiness</p>
          <h2 className="mt-2 text-xl font-semibold">Know what is ready to use.</h2>
          <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">Before a walkthrough, check that each part can open, save, show activity, and report back clearly.</p>
          <div className="mt-4 grid gap-2">
            {['Open', 'Edit', 'Save', 'Give access', 'See changes', 'Share results'].map((step, index) => (
              <div key={step} className="flex items-center justify-between border-t border-[rgba(11,31,51,0.08)] py-2 text-sm">
                <span className="font-semibold">{step}</span>
                <span className="text-xs font-semibold uppercase text-[rgba(11,31,51,0.48)]">{index < 3 ? 'Ready' : 'Next'}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">How the work flows</p>
          <h2 className="mt-2 text-xl font-semibold">Help people find, use, and improve what is downtown.</h2>
          <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.62)]">
            People find a place or offer, take part, and the results show up clearly enough to make the next note better.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Find it', 'Take part', 'See what happened', 'Share the result', 'Make it better'].map((item) => (
              <span key={item} className="border border-[rgba(11,31,51,0.08)] px-3 py-2 text-xs font-semibold text-[#0B1F33]">{item}</span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/admin/platform" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#0B1F33] bg-[#0B1F33] px-4 text-xs font-semibold text-white">
              See today <Settings className="h-4 w-4" />
            </Link>
            <Link to="/admin/perks" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[rgba(11,31,51,0.12)] bg-white px-4 text-xs font-semibold text-[#0B1F33]">
              Review perks <Ticket className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

function StatusLine({ label, value }: any) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[rgba(11,31,51,0.08)] py-2 first:pt-0 last:border-0 last:pb-0">
      <span className="text-sm text-[rgba(11,31,51,0.62)]">{label}</span>
      <strong className="text-sm font-semibold">{String(value)}</strong>
    </div>
  );
}

function SummaryTable({ eyebrow, title, description, rows }: any) {
  const navigate = useNavigate();

  return (
    <section className="overflow-hidden rounded-xl border border-[rgba(11,31,51,0.08)] bg-white">
      <div className="border-b border-[rgba(11,31,51,0.08)] px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{eyebrow}</p>
        <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-xl font-semibold text-[#0B1F33]">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-[rgba(11,31,51,0.62)]">{description}</p>
        </div>
      </div>
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
    </section>
  );
}
