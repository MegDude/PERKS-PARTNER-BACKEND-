import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
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
  { label: 'Platform Overview', to: '/admin/platform', icon: ShieldCheck },
  { label: 'Partners', to: '/admin/partner', icon: ShoppingBag },
  { label: 'Properties', to: '/admin/properties', icon: Building2 },
  { label: 'Hotels', to: '/admin/partner', icon: Hotel },
  { label: 'Venues', to: '/admin/partner', icon: Ticket },
  { label: 'Brands', to: '/admin/partner', icon: ShoppingBag },
  { label: 'Civic', to: '/admin/partner', icon: ShieldCheck },
  { label: 'Events', to: '/admin/events', icon: CalendarDays },
  { label: 'Perks', to: '/admin/perks', icon: Ticket },
  { label: 'Campaigns', to: '/admin/engagement', icon: Megaphone },
  { label: 'Reports', to: '/admin/reports', icon: FileText },
  { label: 'Users', to: '/admin/settings', icon: Users },
  { label: 'Notifications', to: '/admin/settings', icon: Bell },
  { label: 'System Health', to: '/admin/platform', icon: Activity },
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
    { label: 'Total Partners', value: data.partners.length || data.tenantsStatus?.tenants || 0 },
    { label: 'Active Properties', value: data.buildings.filter((building: any) => building.active !== false).length },
    { label: 'Active Hotels', value: tenantTypeCounts.hotel || tenantTypeCounts.hotel_group || 0 },
    { label: 'Active Venues', value: tenantTypeCounts.venue || tenantTypeCounts.venue_group || 0 },
    { label: 'Active Perks', value: activePerks },
    { label: 'Upcoming Events', value: upcomingEvents },
    { label: 'Campaigns Running', value: runningCampaigns },
    { label: 'Resident Profiles', value: data.residents.length },
    { label: 'Perk Saves', value: perkSaves },
    { label: 'Perk Redemptions', value: data.redemptions.length },
    { label: 'Event RSVPs', value: data.rsvps.length },
    { label: 'QR Scans', value: qrScans },
  ];

  const recentActivity = [...data.auditLogs, ...data.notifications]
    .sort((a: any, b: any) => new Date(b.created_at || b.sent_at || 0).getTime() - new Date(a.created_at || a.sent_at || 0).getTime())
    .slice(0, 8);

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
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Platform Owner View</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">Platform Operations Dashboard</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[rgba(11,31,51,0.66)]">
              Live operations across partners, properties, hotels, venues, brands, civic programs, events, perks, campaigns, residents, reports, notifications, and system health.
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-4">
            <StatusLine label="Runtime" value={data.health?.status || 'unknown'} />
            <StatusLine label="Entity tables" value={data.health?.entities ? Object.keys(data.health.entities).length : 0} />
            <StatusLine label="Tenant workspaces" value={data.tenantsStatus?.workspaces || 0} />
            <StatusLine label="Audit events" value={data.auditLogs.length} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((metric) => (
          <article key={metric.label} className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-4">
            <p className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.52)]">{metric.label}</p>
            <strong className="mt-2 block text-2xl font-semibold">{Number(metric.value || 0).toLocaleString()}</strong>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Required areas</p>
            <h2 className="mt-2 text-xl font-semibold">Admin platform modules.</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">Each module opens a real route and is backed by entity records, reporting relationships, permissions, or workflow status.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {moduleRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <Link key={route.label} to={route.to} className="flex min-h-14 items-center justify-between rounded-xl border border-[rgba(11,31,51,0.08)] bg-white px-4 text-sm font-semibold hover:text-[#C8A96A]">
                  <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {route.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </article>

        <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Recent activity</p>
          <h2 className="mt-2 text-xl font-semibold">Audit and notification feed.</h2>
          <div className="mt-5 grid gap-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-[rgba(11,31,51,0.58)]">No recent audit or notification records yet.</p>
            ) : recentActivity.map((item: any) => (
              <div key={item.id} className="border-t border-[rgba(11,31,51,0.08)] pt-3">
                <p className="text-sm font-semibold">{item.action ? String(item.action).replace(/_/g, ' ') : item.message || item.type || 'Platform activity'}</p>
                <p className="mt-1 text-xs text-[rgba(11,31,51,0.52)]">{item.actor_email || item.recipient_email || 'system'} · {new Date(item.created_at || item.sent_at || Date.now()).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Permissioned operating model</p>
          <h2 className="mt-2 text-xl font-semibold">Every visible action should resolve through the operating chain.</h2>
          <div className="mt-4 grid gap-2">
            {['UI', 'API', 'Database', 'Permissions', 'Audit Log', 'Reporting'].map((step, index) => (
              <div key={step} className="flex items-center justify-between border-t border-[rgba(11,31,51,0.08)] py-2 text-sm">
                <span className="font-semibold">{step}</span>
                <span className="text-xs font-semibold uppercase text-[rgba(11,31,51,0.48)]">Step {index + 1}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Operating loop</p>
          <h2 className="mt-2 text-xl font-semibold">Discovery to action.</h2>
          <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.62)]">
            {platformArchitecture.operatingLoop.join(' -> ')}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/admin/platform" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#0B1F33] bg-[#0B1F33] px-4 text-xs font-semibold text-white">
              Super Admin <Settings className="h-4 w-4" />
            </Link>
            <Link to="/admin/perks" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[rgba(11,31,51,0.12)] bg-white px-4 text-xs font-semibold text-[#0B1F33]">
              Perks Module <Ticket className="h-4 w-4" />
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
