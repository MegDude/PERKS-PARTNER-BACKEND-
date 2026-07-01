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
  DollarSign,
  FileText,
  Hotel,
  Loader2,
  MailCheck,
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
  { label: 'Outreach CRM', to: '/admin/outreach-crm', icon: MailCheck },
  { label: 'Partners', to: '/admin/partner', icon: ShoppingBag },
  { label: 'Properties', to: '/admin/properties', icon: Building2 },
  { label: 'Hotels', to: '/admin/partner', icon: Hotel },
  { label: 'Venues', to: '/admin/partner', icon: Ticket },
  { label: 'Brands', to: '/admin/partner', icon: ShoppingBag },
  { label: 'Civic', to: '/admin/partner', icon: ShieldCheck },
  { label: 'Events', to: '/admin/events', icon: CalendarDays },
  { label: 'Perks', to: '/admin/perks', icon: Ticket },
  { label: 'Broadcasts', to: '/admin/engagement', icon: Megaphone },
  { label: 'Reports', to: '/admin/reports', icon: FileText },
  { label: 'Pricing', to: '/partners/pricing', icon: DollarSign },
  { label: 'Billing and accounts', to: '/admin/promotions', icon: CreditCard },
  { label: 'People with access', to: '/admin/settings', icon: Users },
  { label: 'Messages', to: '/admin/settings', icon: Bell },
  { label: 'Health check', to: '/admin/platform', icon: Activity },
];

export default function BackendWorkspace() {
  const [directoryExpanded, setDirectoryExpanded] = useState(false);
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
    { label: 'Broadcasts', value: runningCampaigns, detail: 'Messages and building broadcasts in motion', area: 'Broadcasts', to: '/admin/engagement' },
    { label: 'Residents', value: data.residents.length, detail: 'Resident profiles ready for support', area: 'Residents', to: '/admin/residents' },
    { label: 'Saved perks', value: perkSaves, detail: 'What residents wanted to keep', area: 'Perks', to: '/admin/perks' },
    { label: 'Perks used', value: data.redemptions.length, detail: 'Offers people actually used', area: 'Perks', to: '/admin/perks' },
    { label: 'Event RSVPs', value: data.rsvps.length, detail: 'People who said yes', area: 'Events', to: '/admin/events' },
    { label: 'Code scans', value: qrScans, detail: 'How residents found their way in', area: 'Codes', to: '/admin/perks' },
  ];

  const recentActivity = [...data.auditLogs, ...data.notifications]
    .sort((a: any, b: any) => new Date(b.created_at || b.sent_at || 0).getTime() - new Date(a.created_at || a.sent_at || 0).getTime());
  const recentActivityPreview = recentActivity.slice(0, 2);

  const groupedModules = [
    {
      title: 'Operate',
      routes: moduleRoutes.filter((route) => ['Today downtown', 'Outreach CRM', 'Partners', 'Properties', 'Hotels', 'Venues', 'Brands', 'Civic'].includes(route.label)),
    },
    {
      title: 'Activate',
      routes: moduleRoutes.filter((route) => ['Events', 'Perks', 'Broadcasts'].includes(route.label)),
    },
    {
      title: 'Measure',
      routes: moduleRoutes.filter((route) => ['Reports', 'Pricing', 'Billing and accounts', 'Health check'].includes(route.label)),
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
      href: partner.workspace_path || (partner.slug ? `/admin/workspaces/${partner.slug}` : '/admin/partner'),
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
  ].filter((item) => item.name);
  const visibleDirectory = directoryExpanded ? activeDirectory : activeDirectory.slice(0, 14);

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0B1F33]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-5 px-4 py-4 text-left text-[#0B1F33] sm:px-5 lg:px-6">
      <section className="bg-white py-1">
        <div className="grid gap-5 xl:grid-cols-[1fr_340px] xl:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Start here</p>
            <h1 className="dp-admin-home-headline mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">Downtown Perks, ready to run</h1>
            <p className="mt-2 max-w-4xl text-[12px] leading-5 text-[rgba(11,31,51,0.62)] sm:text-sm sm:leading-6">
              Open the people, places, perks, events, broadcasts, reports, and plans that keep downtown moving.
            </p>
          </div>
          <div className="border-y border-[rgba(11,31,51,0.08)] bg-white py-2">
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
        description="A compact view of the partners, properties, broadcasts, resident activity, and reports ready to review."
        rows={kpis}
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <article className="bg-white p-0">
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Quick navigation</p>
            <h2 className="mt-2 text-xl font-semibold">Find the right area fast.</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">Use these groups to move through partners, properties, broadcasts, reports, billing, and support without hunting through the sidebar.</p>
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

        <article className="bg-white p-0">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[9px] font-semibold uppercase text-[#C8A96A]">Directory preview</p>
              <h2 className="mt-1 text-[15px] font-semibold leading-tight">Partners, businesses, and places.</h2>
              <p className="mt-1 text-[11px] leading-4 text-[rgba(11,31,51,0.56)]">
                Showing {visibleDirectory.length} of {activeDirectory.length}. Expand when you need the full loaded list.
              </p>
            </div>
            {activeDirectory.length > 14 && (
              <button
                type="button"
                className="inline-flex min-h-8 items-center gap-1 text-[10px] font-semibold text-[#0B1F33] hover:text-[#C8A96A]"
                onClick={() => setDirectoryExpanded((expanded) => !expanded)}
              >
                {directoryExpanded ? 'Show less' : 'Show full directory'}
                <ArrowRight className={`h-3 w-3 transition-transform ${directoryExpanded ? '-rotate-90' : 'rotate-90'}`} />
              </button>
            )}
          </div>
          <div className="mt-3 grid gap-0">
            {activeDirectory.length === 0 ? (
              <p className="text-[12px] text-[rgba(11,31,51,0.58)]">No active partners or places yet.</p>
            ) : visibleDirectory.map((item: any) => (
              <Link key={`${item.id}-${item.name}`} to={item.href} className="grid gap-x-3 gap-y-0.5 border-b border-[rgba(11,31,51,0.035)] py-1.5 text-[12px] leading-tight hover:text-[#C8A96A] sm:grid-cols-[minmax(0,1fr)_112px] sm:items-baseline">
                <span className="truncate font-semibold">{item.name}</span>
                <span className="truncate text-[9.5px] font-semibold uppercase text-[rgba(11,31,51,0.5)]">{item.type} · {item.status}</span>
              </Link>
            ))}
          </div>
          <Link to="/admin/partner" className="mt-3 inline-flex min-h-8 items-center gap-1 text-[10px] font-semibold text-[#0B1F33] hover:text-[#C8A96A]">
            Open full partner table <ArrowRight className="h-3 w-3" />
          </Link>
        </article>
      </section>

      <section className="grid gap-5">
        <article className="bg-white p-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">How the work flows</p>
          <h2 className="mt-2 text-xl font-semibold">Help people find, use, and improve what is downtown.</h2>
          <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.62)]">
            People find a place or offer, take part, and the results show up clearly enough to make the next note better.
          </p>
          <div className="mt-4 grid gap-0">
            {[
              { label: 'Find it', detail: 'Open the live downtown view.', to: '/admin/platform' },
              { label: 'Take part', detail: 'Review events and resident actions.', to: '/admin/events' },
              { label: 'See what happened', detail: 'Read performance and activity.', to: '/admin/dashboard' },
              { label: 'Share the result', detail: 'Open reports for partner-ready summaries.', to: '/admin/reports' },
              { label: 'Make it better', detail: 'Adjust offers, notes, and follow-ups.', to: '/admin/perks' },
            ].map((item) => (
              <Link key={item.label} to={item.to} className="grid min-h-9 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 border-t border-[rgba(11,31,51,0.045)] py-1.5 text-left text-[12px] hover:text-[#C8A96A] first:border-t-0 sm:grid-cols-[130px_minmax(0,1fr)_auto] sm:items-center sm:gap-3">
                <span className="font-semibold text-[#0B1F33]">{item.label}</span>
                <span className="text-[11px] leading-4 text-[rgba(11,31,51,0.58)] sm:col-start-2 sm:row-start-1">{item.detail}</span>
                <ArrowRight className="row-span-2 h-3.5 w-3.5 self-center text-[#C8A96A] sm:col-start-3 sm:row-span-1 sm:row-start-1" />
              </Link>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/admin/platform" className="inline-flex min-h-8 items-center gap-2 border border-[#0B1F33] bg-[#0B1F33] px-3 text-[10px] font-semibold text-white">
              See today <Settings className="h-4 w-4" />
            </Link>
            <Link to="/admin/perks" className="inline-flex min-h-8 items-center gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-3 text-[10px] font-semibold text-[#0B1F33]">
              Review perks <Ticket className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </section>

      <section className="bg-white p-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Activity roll-up</p>
        <h2 className="mt-2 text-xl font-semibold">Latest updates, kept short.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgba(11,31,51,0.62)]">
          Showing the two newest updates from {recentActivity.length} recent records. Open the related area when you need the full trail.
        </p>
        <div className="mt-4 grid gap-0 md:grid-cols-2 md:gap-x-8">
          {recentActivityPreview.length === 0 ? (
            <p className="text-sm text-[rgba(11,31,51,0.58)]">No recent updates or messages yet.</p>
          ) : recentActivityPreview.map((item: any) => (
            <div key={item.id} className="border-t border-[rgba(11,31,51,0.06)] py-3 first:border-t-0 md:first:border-t">
              <p className="text-[12px] font-semibold leading-4">{item.action ? String(item.action).replace(/_/g, ' ') : item.message || item.type || 'Recent activity'}</p>
              <p className="mt-1 text-[10.5px] leading-4 text-[rgba(11,31,51,0.52)]">{item.actor_email || item.recipient_email || 'Downtown Perks'} · {new Date(item.created_at || item.sent_at || Date.now()).toLocaleString()}</p>
            </div>
          ))}
        </div>
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
    <section className="overflow-hidden bg-white">
      <div className="px-0 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{eyebrow}</p>
        <div className="mt-1 grid gap-1">
          <h2 className="text-xl font-semibold text-[#0B1F33]">{title}</h2>
          <p className="max-w-4xl text-sm leading-6 text-[rgba(11,31,51,0.62)]">{description}</p>
        </div>
      </div>
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full min-w-[760px] table-fixed text-left text-sm">
          <thead className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">
            <tr>
              <th className="w-[26%] py-2 pr-4">Area</th>
              <th className="w-[12%] py-2 pr-4 text-right">Total</th>
              <th className="py-2 pr-4">Why it matters</th>
              <th className="w-[86px] py-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(11,31,51,0.045)]">
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
                <td className="py-2 pr-4">
                  <p className="text-[13px] font-semibold leading-5 text-[#0B1F33] group-hover:text-[#C8A96A]">{row.label}</p>
                  {row.area && row.area !== row.label && <p className="mt-0.5 text-[9.5px] font-semibold uppercase text-[rgba(11,31,51,0.42)]">{row.area}</p>}
                </td>
                <td className="py-2 pr-4 text-right text-[14px] font-semibold text-[#0B1F33]">{Number(row.value || 0).toLocaleString()}</td>
                <td className="py-2 pr-4 text-[12px] leading-5 text-[rgba(11,31,51,0.62)]">{row.detail}</td>
                <td className="py-2">
                  <Link
                    to={row.to}
                    className="inline-flex min-h-8 items-center gap-1.5 bg-white px-0 text-[10.5px] font-semibold text-[#0B1F33] hover:text-[#C8A96A]"
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
