import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Compass,
  FileText,
  House,
  Landmark,
  Loader2,
  Presentation,
  Receipt,
  Search,
  Send,
  Store,
  UserRound,
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
  { label: 'Partners', to: '/admin/partner', icon: Store, key: 'partners' },
  { label: 'Properties', to: '/admin/properties', icon: Landmark, key: 'properties' },
  { label: 'Buildings', to: '/admin/buildings', icon: House, key: 'properties' },
  { label: 'Residents', to: '/admin/residents', icon: UserRound, key: 'residents' },
  { label: 'Perks', to: '/admin/perks', icon: BadgePercent, key: 'perks' },
  { label: 'Events', to: '/admin/events', icon: CalendarDays, key: 'events' },
  { label: 'Notes to send', to: '/admin/engagement', icon: Send, key: 'campaigns' },
  { label: 'Reports', to: '/admin/reports', icon: FileText, key: 'reports' },
  { label: 'Perk results', to: '/admin/analytics', icon: BarChart3, key: 'reports' },
  { label: 'Plans & billing', to: '/admin/promotions', icon: Receipt, key: 'promotions' },
  { label: 'Today downtown', to: '/admin/platform', icon: Compass, key: 'tenants' },
  { label: 'Partner view', to: '/admin/partner-portal', icon: Presentation, key: 'workspaces' },
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
    { label: 'Billing', value: data.invoices.length, note: `${data.subscriptions.length} plans on file` },
  ];

  const moduleCount = (module: (typeof primaryModules)[number]) => {
    const value = (data as any)[module.key];
    return Array.isArray(value) ? value.length : data.tenantStatus?.tenants || 0;
  };

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
                Find the partners, buildings, perks, events, notes, reports, invoices, and plans you need without wandering around.
              </p>
            </div>
            <div className="dp-home-module-rail flex max-w-full gap-2 overflow-x-auto pb-1 xl:max-w-[560px] xl:justify-end">
              {primaryModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.label}
                    to={module.to}
                    className="group inline-flex min-h-8 flex-none items-center gap-1.5 bg-white px-0 text-[10.5px] font-semibold leading-none transition-colors hover:text-[#C8A96A]"
                  >
                    <Icon className="h-3 w-3 shrink-0 text-[#C8A96A]" />
                    <span>{module.label}</span>
                    <span className="text-[9.5px] font-semibold text-[rgba(11,31,51,0.42)] group-hover:text-[#8A6A1F]">
                      {Number(moduleCount(module) || 0).toLocaleString()}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        <section className="my-5 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <div className="overflow-hidden bg-white">
            <div className="px-0 py-2.5">
              <p className="text-[9px] font-semibold uppercase text-[#C8A96A]">Quick read</p>
              <h2 className="mt-0.5 text-[13px] font-semibold leading-tight">What is ready to open</h2>
              <p className="mt-1 max-w-full text-[10px] leading-4 text-[rgba(11,31,51,0.52)]">
                Live counts from partners, places, residents, perks, events, notes, invoices, and plans.
              </p>
            </div>
            <div className="overflow-x-auto py-1 [scrollbar-width:thin]">
              <table className="w-full min-w-[560px] table-fixed text-left">
                <thead>
                  <tr className="text-[8px] font-semibold uppercase leading-3 text-[rgba(11,31,51,0.42)]">
                    <th className="w-[34%] py-1.5 pr-3 font-semibold">Area</th>
                    <th className="w-[16%] py-1.5 pr-3 text-right font-semibold">Total</th>
                    <th className="py-1.5 pr-1 font-semibold">Use this for</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={stat.label} className="border-t border-[rgba(11,31,51,0.045)] align-middle">
                      <td className="py-1.5 pr-3">
                        <Link to={statHref(stat.label)} className="inline-flex min-h-7 items-center text-[10.5px] font-semibold leading-none text-[#0B1F33] transition-colors hover:text-[#C8A96A]">
                          {stat.label}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-3 text-right text-[12px] font-semibold leading-none text-[#0B1F33]">
                        {Number(stat.value || 0).toLocaleString()}
                      </td>
                      <td className="py-1.5 pr-1 text-[9.5px] leading-4 text-[rgba(11,31,51,0.56)]">
                        {stat.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden border-y border-[rgba(11,31,51,0.08)] bg-white">
            <div className="flex flex-col gap-2 px-0 py-2.5">
              <div className="grid gap-1.5">
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase text-[#C8A96A]">Workspace jump</p>
                  <h2 className="text-[13px] font-semibold leading-tight">Open a partner, brand, civic, or property page</h2>
                </div>
              </div>
              <label className="flex min-h-8 flex-nowrap items-center gap-2 border-b border-[rgba(11,31,51,0.1)]">
                <Search className="h-3.5 w-3.5 text-[rgba(11,31,51,0.42)]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search DANA, Waterloo, inKind, Legends, Whole Foods..."
                  className="w-full bg-transparent py-1.5 text-[12px] outline-none placeholder:text-[rgba(11,31,51,0.38)]"
                />
              </label>
            </div>
            <div className="max-h-[286px] overflow-y-auto pr-1 [scrollbar-width:thin]">
              {workspaceLaunchRows.map((row) => (
                <div key={`${row.id}-${row.href}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5 border-b border-[rgba(11,31,51,0.035)] px-0 py-1.5 text-[11px] leading-tight sm:grid-cols-[minmax(0,1fr)_116px_54px]">
                  <Link to={row.href} className="min-w-0 truncate font-semibold text-[#0B1F33] transition-colors hover:text-[#C8A96A]">
                    {row.title}
                  </Link>
                  <span className="col-start-1 min-w-0 truncate text-[9.5px] font-semibold uppercase leading-4 text-[rgba(11,31,51,0.48)] sm:col-start-auto">{row.type}</span>
                  <span className="row-start-1 text-[9.5px] font-semibold uppercase leading-4 text-[#9A7A2F] sm:row-start-auto">{row.featured ? 'Built' : row.status}</span>
                </div>
              ))}
              {workspaceLaunchRows.length === 0 && <p className="py-6 text-[12px] text-[rgba(11,31,51,0.58)]">Nothing matched. Try a partner, brand, civic group, or property name.</p>}
              <Link to="/admin/partner" className="inline-flex min-h-7 items-center gap-1 px-0 pt-2 text-[10.5px] font-semibold text-[#0B1F33] hover:text-[#C8A96A]">
                Open full partner directory <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
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
    Billing: '/admin/promotions',
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
