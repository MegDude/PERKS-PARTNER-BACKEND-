import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  MapPin,
  Megaphone,
  Search,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

type GatewayData = {
  health: any;
  tenantStatus: any;
  mapSummary: any;
  partners: any[];
  tenants: any[];
  workspaces: any[];
  properties: any[];
  residents: any[];
  perks: any[];
  events: any[];
  campaigns: any[];
  reports: any[];
  subscriptions: any[];
  invoices: any[];
  auditLogs: any[];
  promotions: any[];
};

const initialData: GatewayData = {
  health: null,
  tenantStatus: null,
  mapSummary: null,
  partners: [],
  tenants: [],
  workspaces: [],
  properties: [],
  residents: [],
  perks: [],
  events: [],
  campaigns: [],
  reports: [],
  subscriptions: [],
  invoices: [],
  auditLogs: [],
  promotions: [],
};

const primaryModules = [
  { label: 'Partner Directory', to: '/admin/partner', icon: Building2, key: 'partners' },
  { label: 'Properties', to: '/admin/properties', icon: Building2, key: 'properties' },
  { label: 'Property Operations', to: '/admin/buildings', icon: Users, key: 'properties' },
  { label: 'Residents', to: '/admin/residents', icon: Users, key: 'residents' },
  { label: 'Perks', to: '/admin/perks', icon: Ticket, key: 'perks' },
  { label: 'Events', to: '/admin/events', icon: CalendarDays, key: 'events' },
  { label: 'Campaigns', to: '/admin/engagement', icon: Megaphone, key: 'campaigns' },
  { label: 'Reports', to: '/admin/reports', icon: FileText, key: 'reports' },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3, key: 'reports' },
  { label: 'Promotions & Billing', to: '/admin/promotions', icon: CreditCard, key: 'promotions' },
  { label: 'Command Center', to: '/admin/platform', icon: ShieldCheck, key: 'tenants' },
  { label: 'Partner Portal', to: '/admin/partner-portal', icon: Activity, key: 'workspaces' },
];

export default function Home() {
  const [data, setData] = useState<GatewayData>(initialData);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadGateway() {
      try {
        const [
          health,
          tenantStatus,
          mapEntities,
          partners,
          tenants,
          workspaces,
          properties,
          residents,
          perks,
          events,
          campaigns,
          reports,
          subscriptions,
          invoices,
          auditLogs,
          promotions,
        ] = await Promise.all([
          fetch('/api/health').then((res) => res.json()).catch(() => null),
          fetch('/api/tenant-provisioning/status').then((res) => res.json()).catch(() => null),
          fetch('/api/map/entities').then((res) => res.json()).catch(() => []),
          base44.entities.Partner.list().catch(() => []),
          base44.entities.PlatformTenant.list().catch(() => []),
          base44.entities.TenantWorkspace.list().catch(() => []),
          fetch('/api/admin/properties').then((res) => res.json()).catch(() => []),
          base44.entities.Tenant.list().catch(() => []),
          base44.entities.PerkLocation.list().catch(() => []),
          base44.entities.Event.list().catch(() => []),
          base44.entities.Campaign.list().catch(() => []),
          base44.entities.PartnerReport.list().catch(() => []),
          base44.entities.PartnerSubscription.list().catch(() => []),
          base44.entities.PartnerInvoice.list().catch(() => []),
          base44.entities.TenantAuditLog.list().catch(() => []),
          base44.entities.Promotion.list().catch(() => []),
        ]);

        if (!mounted) return;
        const mapRows = Array.isArray(mapEntities) ? mapEntities : [];
        setData({
          health,
          tenantStatus,
          mapSummary: {
            entities: mapRows.length,
            partners: new Set(mapRows.map((row: any) => row.partner_id).filter(Boolean)).size,
            campaigns: new Set(mapRows.map((row: any) => row.campaign_id).filter(Boolean)).size,
            types: Array.from(new Set(mapRows.map((row: any) => row.entity_type).filter(Boolean))).sort(),
          },
          partners,
          tenants,
          workspaces,
          properties,
          residents,
          perks,
          events,
          campaigns,
          reports,
          subscriptions,
          invoices,
          auditLogs,
          promotions,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadGateway();
    return () => {
      mounted = false;
    };
  }, []);

  const directories = useMemo(() => {
    const partnerTenantKey = (partner: any) => partner.tenant_id || partner.organization_id || partner.workspace_id || partner.id;
    const partnerRows = data.partners.map((partner) => ({
      id: partner.id,
      title: partner.business_name || partner.name || 'Partner',
      type: partner.category || partner.partner_type || 'partner',
      status: partner.status || (partner.is_active ? 'active' : 'review'),
      href: `/workspace/home?tenant=${encodeURIComponent(partnerTenantKey(partner))}&partner=${encodeURIComponent(partner.id)}`,
    }));
    const tenantRows = data.tenants.map((tenant) => ({
      id: tenant.id,
      title: tenant.name,
      type: tenant.type || 'workspace',
      status: tenant.status || 'active',
      href: `/workspace/home?tenant=${encodeURIComponent(tenant.id)}&workspace=${encodeURIComponent(tenant.slug || tenant.id)}`,
    }));
    const propertyRows = data.properties.map((property) => ({
      id: property.id,
      title: property.name,
      type: property.type || property.category || 'property',
      status: property.status || 'active',
      href: property.tenant_id
        ? `/workspace/home?tenant=${encodeURIComponent(property.tenant_id)}&property=${encodeURIComponent(property.id)}`
        : property.workspacePath
          ? `/workspace/home?workspace=${encodeURIComponent(property.workspacePath.replace('/tenant/', ''))}&property=${encodeURIComponent(property.id)}`
          : '/admin/properties',
    }));
    const rows = [...partnerRows, ...tenantRows, ...propertyRows];
    const needle = search.trim().toLowerCase();
    return needle ? rows.filter((row) => `${row.title} ${row.type} ${row.status}`.toLowerCase().includes(needle)) : rows;
  }, [data.partners, data.properties, data.tenants, search]);

  const tenantCount = data.tenantStatus?.tenants || data.tenants.length;
  const workspaceCount = data.tenantStatus?.workspaces || data.workspaces.length;
  const mapEntityCount = data.mapSummary?.entities || 0;
  const mappedPartnerCount = data.mapSummary?.partners || 0;
  const mappedCampaignCount = data.mapSummary?.campaigns || 0;

  const stats = [
    { label: 'Partners', value: tenantCount, note: tenantCount === workspaceCount ? 'Each partner has a workspace' : `${Math.max(tenantCount - workspaceCount, 0)} need workspace review` },
    { label: 'Workspaces', value: workspaceCount, note: 'Ready for teams to manage' },
    { label: 'Map entities', value: mapEntityCount, note: `${mappedPartnerCount} partner-linked records` },
    { label: 'Partners', value: data.partners.length, note: 'Directory records available' },
    { label: 'Properties', value: data.properties.length, note: 'Portfolio navigation records' },
    { label: 'Campaigns', value: data.campaigns.length, note: `${mappedCampaignCount} tied to map presence` },
    { label: 'Subscriptions', value: data.subscriptions.length, note: 'Plans ready for review' },
    { label: 'Promotions', value: data.promotions.length, note: 'Launch offer configured' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#0B1F33]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0B1F33]">
      <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8">
        <header className="border-b border-[rgba(11,31,51,0.08)] pb-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">Workspace gateway</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Downtown Perks Partner Platform</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgba(11,31,51,0.62)]">
                Start here to find partners, properties, map listings, campaigns, plans, reports, and the tools you need for a walkthrough.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <GatewayButton to="/admin/platform" label="Command Center" icon={ShieldCheck} primary />
              <GatewayButton to="/admin/partner" label="Partners" icon={Building2} />
              <GatewayButton to="/admin/properties" label="Properties" icon={MapPin} />
              <GatewayButton to="/admin/promotions" label="Promotions" icon={CreditCard} />
            </div>
          </div>
        </header>

        <section className="my-5 border border-[rgba(11,31,51,0.08)] bg-white">
          <div className="flex flex-col gap-1 border-b border-[rgba(11,31,51,0.08)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">Platform snapshot</p>
              <h2 className="text-base font-semibold">What is active right now</h2>
            </div>
            <p className="text-xs leading-5 text-[rgba(11,31,51,0.56)]">Quick read before opening a partner, property, or campaign.</p>
          </div>
          <div className="grid divide-y divide-[rgba(11,31,51,0.08)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 xl:grid-cols-8">
            {stats.map((stat) => (
              <div key={stat.label} className="min-h-[92px] px-3 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.52)]">{stat.label}</p>
                  <p className="text-xl font-semibold leading-none">{Number(stat.value || 0).toLocaleString()}</p>
                </div>
                <p className="mt-3 text-[11px] leading-4 text-[rgba(11,31,51,0.58)]">{stat.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title="Active directories" eyebrow="Navigate people and places" action={<Link to="/admin/partner" className="text-xs font-semibold text-[#C8A96A]">Open full directory</Link>}>
            <div className="mb-4 flex items-center gap-2 border border-[rgba(11,31,51,0.08)] px-3">
              <Search className="h-4 w-4 text-[rgba(11,31,51,0.44)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search partners, properties, tenants, brands, venues..."
                className="h-11 w-full bg-transparent text-sm outline-none"
              />
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {directories.slice(0, 18).map((row) => (
                <Link key={`${row.id}-${row.href}`} to={row.href} className="grid gap-2 border-t border-[rgba(11,31,51,0.08)] py-3 sm:grid-cols-[1fr_120px_90px] sm:items-center">
                  <span className="font-semibold">{row.title}</span>
                  <span className="text-xs font-semibold uppercase text-[rgba(11,31,51,0.52)]">{row.type}</span>
                  <span className="text-xs font-semibold text-[#C8A96A]">{row.status}</span>
                </Link>
              ))}
              {directories.length === 0 && <p className="py-8 text-sm text-[rgba(11,31,51,0.58)]">No matching directory records.</p>}
            </div>
          </Panel>

          <Panel title="Open a workspace area" eyebrow="Shortcuts">
            <div className="grid gap-3 sm:grid-cols-2">
              {primaryModules.map((module) => {
                const Icon = module.icon;
                const count = Array.isArray((data as any)[module.key]) ? (data as any)[module.key].length : data.tenantStatus?.tenants || 0;
                return (
                  <Link key={module.label} to={module.to} className="flex min-h-16 items-center justify-between border border-[rgba(11,31,51,0.08)] bg-white p-4 hover:border-[#C8A96A]">
                    <span className="flex items-center gap-3 text-sm font-semibold"><Icon className="h-4 w-4 text-[#C8A96A]" /> {module.label}</span>
                    <span className="text-sm font-semibold">{Number(count || 0).toLocaleString()}</span>
                  </Link>
                );
              })}
            </div>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
          <Panel title="Ready for walkthrough" eyebrow="Coverage">
            <div className="grid gap-3 md:grid-cols-2">
              <Readiness label="Partner profiles" value={`${data.tenants.length} profiles available`} ready={data.tenants.length > 0} />
              <Readiness label="Workspaces" value={`${data.workspaces.length} partner workspaces`} ready={data.workspaces.length > 0} />
              <Readiness label="Map listings" value={`${data.mapSummary?.entities || 0} places and offers`} ready={(data.mapSummary?.entities || 0) > 0} />
              <Readiness label="Partner directory" value={`${data.partners.length} partners listed`} ready={data.partners.length > 0} />
              <Readiness label="Campaigns" value={`${data.campaigns.length} campaigns available`} ready={data.campaigns.length > 0} />
              <Readiness label="Plans and invoices" value={`${data.subscriptions.length} plans · ${data.invoices.length} invoices`} ready={data.subscriptions.length > 0} />
            </div>
          </Panel>

          <Panel title="Recent changes" eyebrow="Activity">
            <div className="grid gap-3">
              {data.auditLogs.slice(-7).reverse().map((item) => (
                <div key={item.id} className="border-t border-[rgba(11,31,51,0.08)] pt-3">
                  <p className="text-sm font-semibold">{String(item.action || item.resource || 'Platform activity').replace(/_/g, ' ')}</p>
                  <p className="mt-1 text-xs text-[rgba(11,31,51,0.52)]">{item.actor_id || 'system'} · {new Date(item.timestamp || item.created_at || Date.now()).toLocaleString()}</p>
                </div>
              ))}
              {data.auditLogs.length === 0 && <p className="text-sm text-[rgba(11,31,51,0.58)]">No audit activity yet.</p>}
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function GatewayButton({ to, label, icon: Icon, primary = false }: any) {
  return (
    <Link to={to} className={`inline-flex min-h-11 items-center gap-2 border px-4 text-xs font-semibold ${primary ? 'border-[#0B1F33] bg-[#0B1F33] text-white' : 'border-[rgba(11,31,51,0.12)] bg-white text-[#0B1F33]'}`}>
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

function Panel({ eyebrow, title, action, children }: any) {
  return (
    <section className="border border-[rgba(11,31,51,0.08)] bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Readiness({ label, value, ready }: any) {
  return (
    <div className="flex items-start gap-3 border border-[rgba(11,31,51,0.08)] p-4">
      <CheckCircle2 className={`mt-0.5 h-4 w-4 ${ready ? 'text-[#C8A96A]' : 'text-[rgba(11,31,51,0.28)]'}`} />
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs text-[rgba(11,31,51,0.56)]">{value}</p>
      </div>
    </div>
  );
}
