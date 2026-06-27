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
import { curatedPartnerWorkspaces, getFeaturedWorkspaceSlugs, slugify } from '@/data/partnerWorkspaceCatalog';

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
  promotions: [],
};

const primaryModules = [
  { label: 'Partners', to: '/admin/partner', icon: Building2, key: 'partners' },
  { label: 'Properties', to: '/admin/properties', icon: Building2, key: 'properties' },
  { label: 'Buildings', to: '/admin/buildings', icon: Users, key: 'properties' },
  { label: 'Residents', to: '/admin/residents', icon: Users, key: 'residents' },
  { label: 'Perks', to: '/admin/perks', icon: Ticket, key: 'perks' },
  { label: 'Events', to: '/admin/events', icon: CalendarDays, key: 'events' },
  { label: 'Notes to send', to: '/admin/engagement', icon: Megaphone, key: 'campaigns' },
  { label: 'Reports', to: '/admin/reports', icon: FileText, key: 'reports' },
  { label: 'Perk results', to: '/admin/analytics', icon: BarChart3, key: 'reports' },
  { label: 'Plans & billing', to: '/admin/promotions', icon: CreditCard, key: 'promotions' },
  { label: 'Today downtown', to: '/admin/platform', icon: ShieldCheck, key: 'tenants' },
  { label: 'Partner view', to: '/admin/partner-portal', icon: Activity, key: 'workspaces' },
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
    const partnerSlug = (partner: any) => slugify(partner.slug || partner.workspace_slug || partner.tenant_id?.replace(/^tenant_/, '') || partner.workspace_id?.replace(/^workspace_/, '') || partner.business_name || partner.name || partner.id);
    const tenantSlug = (tenant: any) => slugify(tenant.slug || tenant.id?.replace(/^tenant_/, '') || tenant.name);
    const partnerRows = data.partners.map((partner) => ({
      id: partner.id,
      title: partner.business_name || partner.name || 'Partner',
      type: partner.category || partner.partner_type || 'partner',
      status: partner.status || (partner.is_active ? 'active' : 'review'),
      href: `/admin/workspaces/${partnerSlug(partner)}`,
    }));
    const tenantRows = data.tenants.map((tenant) => ({
      id: tenant.id,
      title: tenant.name,
      type: tenant.type || 'workspace',
      status: tenant.status || 'active',
      href: `/admin/workspaces/${tenantSlug(tenant)}`,
    }));
    const propertyRows = data.properties.map((property) => ({
      id: property.id,
      title: property.name,
      type: property.type || property.category || 'property',
      status: property.status || 'active',
      href: property.tenant_id
        ? `/admin/workspaces/${slugify(property.tenant_id.replace(/^tenant_/, '') || property.name || property.id)}`
        : property.workspacePath
          ? `/admin/workspaces/${slugify(property.workspacePath.replace('/tenant/', ''))}`
          : '/admin/properties',
    }));
    const rows = [...partnerRows, ...tenantRows, ...propertyRows];
    const needle = search.trim().toLowerCase();
    return needle ? rows.filter((row) => `${row.title} ${row.type} ${row.status}`.toLowerCase().includes(needle)) : rows;
  }, [data.partners, data.properties, data.tenants, search]);

  const workspaceLaunchRows = useMemo(() => {
    const curatedRows = getFeaturedWorkspaceSlugs().map((slug) => {
      const workspace = curatedPartnerWorkspaces[slug];
      return {
        id: `curated-${slug}`,
        title: workspace.name,
        type: workspace.type,
        status: 'Ready',
        href: `/admin/workspaces/${slug}`,
        featured: true,
      };
    });
    const merged = [...curatedRows, ...directories];
    const seen = new Set<string>();
    const deduped = merged.filter((row) => {
      const key = `${row.href}-${row.title}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return deduped.slice(0, search.trim() ? 60 : 28);
  }, [directories, search]);

  const tenantCount = data.tenantStatus?.tenants || data.tenants.length;
  const workspaceCount = data.tenantStatus?.workspaces || data.workspaces.length;
  const mapEntityCount = data.mapSummary?.entities || 0;
  const mappedPartnerCount = data.mapSummary?.partners || 0;
  const mappedCampaignCount = data.mapSummary?.campaigns || 0;
  const activePerkCount = data.perks.filter((perk) => perk.active || perk.is_active || perk.status === 'active').length;
  const upcomingEventCount = data.events.filter((event) => {
    const rawDate = event.date || event.dateTime || event.start_date || event.starts_at;
    return !rawDate || new Date(rawDate) >= new Date(new Date().toDateString());
  }).length;

  const stats = [
    { label: 'Partners', value: tenantCount, note: `${data.partners.length} profiles ready` },
    { label: 'Spaces', value: workspaceCount, note: tenantCount === workspaceCount ? 'Ready to open' : `${Math.max(tenantCount - workspaceCount, 0)} need a final check` },
    { label: 'Map', value: mapEntityCount, note: `${mappedPartnerCount} partners · ${mappedCampaignCount} notes` },
    { label: 'Properties', value: data.properties.length, note: 'Buildings ready to review' },
    { label: 'Residents', value: data.residents.length, note: 'Profiles available' },
    { label: 'Perks', value: data.perks.length, note: `${activePerkCount} active now` },
    { label: 'Events', value: data.events.length, note: `${upcomingEventCount} upcoming` },
    { label: 'Notes', value: data.campaigns.length, note: `${mappedCampaignCount} tied to the map` },
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
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">Start here</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Welcome to Downtown Perks</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgba(11,31,51,0.62)]">
                Find the partners, buildings, perks, events, notes, plans, and reports you need without wandering around the app.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <GatewayButton to="/admin/platform" label="See today" icon={ShieldCheck} primary />
              <GatewayButton to="/admin/partner" label="Partners" icon={Building2} />
              <GatewayButton to="/admin/properties" label="Properties" icon={MapPin} />
              <GatewayButton to="/admin/promotions" label="Plans" icon={CreditCard} />
            </div>
          </div>
        </header>

        <section className="my-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="border-y border-[rgba(11,31,51,0.08)] bg-white">
            <div className="flex flex-col gap-1 border-b border-[rgba(11,31,51,0.08)] py-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#C8A96A]">Quick read</p>
                <h2 className="text-sm font-semibold">What is ready to open right now</h2>
              </div>
              <p className="text-[11px] leading-4 text-[rgba(11,31,51,0.56)]">Live counts from partners, places, residents, perks, events, and notes.</p>
            </div>
            <div className="grid grid-cols-2 border-b border-[rgba(11,31,51,0.08)] sm:grid-cols-4 xl:grid-cols-8">
              {stats.map((stat) => (
                <Link key={stat.label} to={statHref(stat.label)} className="min-h-[58px] border-b border-r border-[rgba(11,31,51,0.06)] px-2.5 py-2 hover:text-[#C8A96A]">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">{stat.label}</p>
                    <p className="text-base font-semibold leading-none">{Number(stat.value || 0).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-[rgba(11,31,51,0.6)]">{stat.note}</p>
                </Link>
              ))}
            </div>
            <div className="py-2">
              <p className="mb-2 text-[10px] font-bold uppercase text-[rgba(11,31,51,0.48)]">Open an area</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {primaryModules.map((module) => {
                  const Icon = module.icon;
                  const count = Array.isArray((data as any)[module.key]) ? (data as any)[module.key].length : data.tenantStatus?.tenants || 0;
                  return (
                    <Link key={module.label} to={module.to} className="inline-flex min-h-9 flex-none items-center gap-2 border border-[rgba(11,31,51,0.08)] bg-white px-3 text-[11px] font-semibold hover:border-[#C8A96A] hover:text-[#C8A96A]">
                      <Icon className="h-3.5 w-3.5 text-[#C8A96A]" />
                      {module.label}
                      <span className="text-[10px] text-[rgba(11,31,51,0.5)]">{Number(count || 0).toLocaleString()}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-y border-[rgba(11,31,51,0.08)] bg-white">
            <div className="flex flex-col gap-2 border-b border-[rgba(11,31,51,0.08)] py-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#C8A96A]">Workspace jump</p>
                  <h2 className="text-sm font-semibold">Open a partner, brand, civic, or property page</h2>
                </div>
                <Link to="/admin/partner" className="text-[11px] font-semibold text-[#C8A96A]">All partners</Link>
              </div>
              <label className="flex min-h-9 items-center gap-2 border-b border-[rgba(11,31,51,0.12)]">
                <Search className="h-4 w-4 text-[rgba(11,31,51,0.44)]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search DANA, Waterloo, inKind, Legends, Whole Foods..."
                  className="w-full bg-transparent py-2 text-sm outline-none"
                />
              </label>
            </div>
            <div className="max-h-[282px] overflow-y-auto">
              {workspaceLaunchRows.map((row) => (
                <Link key={`${row.id}-${row.href}`} to={row.href} className="grid gap-2 border-b border-[rgba(11,31,51,0.06)] py-2.5 text-sm hover:text-[#C8A96A] sm:grid-cols-[1fr_112px_58px] sm:items-center">
                  <span className="font-semibold">{row.title}</span>
                  <span className="text-[10px] font-semibold uppercase text-[rgba(11,31,51,0.52)]">{row.type}</span>
                  <span className="text-[10px] font-semibold text-[#C8A96A]">{row.featured ? 'Built' : row.status}</span>
                </Link>
              ))}
              {workspaceLaunchRows.length === 0 && <p className="py-8 text-sm text-[rgba(11,31,51,0.58)]">Nothing matched. Try a partner, brand, civic group, or property name.</p>}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <Panel title="Ready for a walkthrough" eyebrow="Coverage">
            <div className="grid gap-3 md:grid-cols-2">
              <Readiness label="Partner profiles" value={`${data.tenants.length} profiles ready`} ready={data.tenants.length > 0} />
              <Readiness label="Partner spaces" value={`${data.workspaces.length} spaces to open`} ready={data.workspaces.length > 0} />
              <Readiness label="Map listings" value={`${data.mapSummary?.entities || 0} places and offers`} ready={(data.mapSummary?.entities || 0) > 0} />
              <Readiness label="Partner directory" value={`${data.partners.length} partners listed`} ready={data.partners.length > 0} />
              <Readiness label="Campaigns" value={`${data.campaigns.length} campaigns available`} ready={data.campaigns.length > 0} />
              <Readiness label="Plans and invoices" value={`${data.subscriptions.length} plans · ${data.invoices.length} invoices`} ready={data.subscriptions.length > 0} />
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

function statHref(label: string) {
  const routes: Record<string, string> = {
    Partners: '/admin/partner',
    Spaces: '/admin/partner',
    Map: '/map',
    Properties: '/admin/properties',
    Residents: '/admin/residents',
    Perks: '/admin/perks',
    Events: '/admin/events',
    Notes: '/admin/engagement',
  };
  return routes[label] || '/admin';
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
