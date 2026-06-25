import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Map,
  MessageSquareText,
  Plus,
  QrCode,
  Search,
  Settings,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

type LifecycleState = {
  organizationType: string;
  organization: Record<string, any>;
  contact: Record<string, any>;
  location: Record<string, any>;
  plan: Record<string, any>;
  checkout: Record<string, any>;
  provision?: Record<string, any>;
};

const storageKey = 'dp_partner_lifecycle_state';

const partnerTypes = [
  { key: 'property', label: 'Property', description: 'Residential communities, apartments, condos, and managed portfolios.', template: 'Property workspace', modules: ['Residents', 'Perks', 'Events', 'Reports'] },
  { key: 'hotel', label: 'Hotel', description: 'Hotels and guest experience teams connecting visitors to nearby places.', template: 'Hotel workspace', modules: ['Guest map', 'Events', 'Offers', 'Reports'] },
  { key: 'venue', label: 'Venue', description: 'Restaurants, bars, coffee, wellness, retail, and local services.', template: 'Venue workspace', modules: ['Offers', 'Events', 'QR', 'Analytics'] },
  { key: 'restaurant', label: 'Restaurant', description: 'Dining teams promoting offers, events, and local discovery.', template: 'Restaurant workspace', modules: ['Offers', 'Menus', 'Campaigns', 'Reports'] },
  { key: 'retail', label: 'Retail', description: 'Shops and services reaching residents and nearby visitors.', template: 'Retail workspace', modules: ['Offers', 'Listings', 'QR', 'Reports'] },
  { key: 'brand', label: 'Brand', description: 'Brands activating around downtown behavior and real-world moments.', template: 'Brand workspace', modules: ['Campaigns', 'Sponsorships', 'Reports', 'Assets'] },
  { key: 'civic', label: 'Civic', description: 'Districts, nonprofits, associations, and public programs.', template: 'Civic workspace', modules: ['Programs', 'Events', 'Surveys', 'Reports'] },
  { key: 'real_estate', label: 'Real Estate', description: 'Developers, leasing teams, brokerages, and portfolio operators.', template: 'Real estate workspace', modules: ['Listings', 'Neighborhood context', 'Reports', 'Leads'] },
];

const plans = [
  { key: 'starter', label: 'Starter', amount: 99, cadence: 'annual', summary: 'Launch the workspace with profile, map presence, offers, events, QR, and reporting basics.', limits: 'Single location or starter program', modules: ['Workspace', 'Map presence', 'Offers', 'Events', 'QR', 'Reports'] },
  { key: 'growth', label: 'Growth', amount: 149, cadence: 'annual', summary: 'Add campaigns, richer analytics, exports, team access, and stronger reporting loops.', limits: 'Active partner operations', modules: ['Everything in Starter', 'Campaigns', 'Analytics', 'Team', 'Exports', 'AI assistant'] },
  { key: 'enterprise', label: 'Enterprise', amount: 0, cadence: 'custom', summary: 'Multi-location, sponsorship, integrations, custom reporting, and managed onboarding.', limits: 'Portfolio or district programs', modules: ['Multi-location', 'API', 'Custom research', 'Billing support', 'Advanced permissions'] },
];

const workspaceGroups = [
  { label: 'Operations', items: ['Offers', 'Events', 'Campaigns', 'QR', 'Listings'] },
  { label: 'Media', items: ['Gallery', 'Brand', 'Profile'] },
  { label: 'Customers', items: ['Audience', 'Followers', 'Saved', 'Reviews'] },
  { label: 'Analytics', items: ['Reports', 'Performance', 'Exports', 'Growth'] },
  { label: 'Admin', items: ['Team', 'Permissions', 'Billing', 'Integrations', 'Settings'] },
];

const setupTasks = ['Complete Profile', 'Upload Logo', 'Verify Address', 'Publish Offer', 'Publish Event', 'Generate QR', 'Invite Team', 'Complete Billing', 'Launch First Campaign'];

const initialState: LifecycleState = {
  organizationType: 'venue',
  organization: { name: '', website: '', industry: 'Venue' },
  contact: { name: '', email: '', phone: '', manager: '', owner: '' },
  location: { address: '', city: 'Austin', state: 'TX', socials: '', google_business: '', hours: '', amenities: '', description: '', categories: '' },
  plan: plans[0],
  checkout: { billing_email: '', business_name: '', coupon: '', tax: 0, provider: 'local_checkout_ready_for_stripe', status: 'active' },
};

function loadState(): LifecycleState {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
  } catch {
    return initialState;
  }
}

function Field({ label, value, onChange, required = false, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.56)]">{label}{required ? ' *' : ''}</span>
      <input
        value={value || ''}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border-0 border-b border-[rgba(11,31,51,0.16)] bg-white px-0 py-3 text-sm text-[#0B1F33] outline-none focus:border-[#C8A96A]"
      />
    </label>
  );
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`border border-[rgba(11,31,51,0.08)] bg-white p-5 shadow-none sm:p-6 ${className}`}>{children}</section>;
}

function ActionLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="inline-flex h-10 items-center justify-center gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-4 text-xs font-semibold text-[#0B1F33] transition hover:border-[#C8A96A] hover:text-[#C8A96A]">
      {children}
    </Link>
  );
}

function slugFor(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function PartnerLifecycle() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<LifecycleState>(() => loadState());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    let mounted = true;
    async function loadWorkspaceData() {
      const results = await Promise.all([
        base44.entities.Partner.list().catch(() => []),
        base44.entities.PlatformTenant.list().catch(() => []),
        base44.entities.TenantWorkspace.list().catch(() => []),
        base44.entities.PartnerWorkspaceModule.list().catch(() => []),
        base44.entities.PartnerOffer.list().catch(() => []),
        base44.entities.PerkLocation.list().catch(() => []),
        base44.entities.PartnerEvent.list().catch(() => []),
        base44.entities.Event.list().catch(() => []),
        base44.entities.Campaign.list().catch(() => []),
        base44.entities.PartnerReport.list().catch(() => []),
        base44.entities.PartnerAnalytics.list().catch(() => []),
        base44.entities.TenantUser.list().catch(() => []),
        base44.entities.PartnerSubscription.list().catch(() => []),
        base44.entities.PartnerInvoice.list().catch(() => []),
        base44.entities.PartnerQrExperience.list().catch(() => []),
        base44.entities.TenantAuditLog.list().catch(() => []),
      ]);
      if (mounted) {
        const [partners, tenants, workspaces, modules, offers, perks, partnerEvents, events, campaigns, reports, analytics, users, subscriptions, invoices, qr, activity] = results;
        setData({ partners, tenants, workspaces, modules, offers, perks, partnerEvents, events, campaigns, reports, analytics, users, subscriptions, invoices, qr, activity });
      }
    }
    loadWorkspaceData();
    return () => {
      mounted = false;
    };
  }, [state.provision?.tenant?.id]);

  const selectedType = partnerTypes.find((type) => type.key === state.organizationType) || partnerTypes[2];
  const selectedTenantId = state.provision?.tenant?.id || data.tenants?.[0]?.id;
  const scoped = useMemo(() => {
    const filter = (items: any[] = []) => items.filter((item) => !selectedTenantId || item.tenant_id === selectedTenantId || item.id === selectedTenantId);
    return {
      modules: filter(data.modules),
      offers: [...filter(data.offers), ...(data.perks || []).filter((item: any) => !selectedTenantId || item.tenant_id === selectedTenantId)],
      events: [...filter(data.partnerEvents), ...filter(data.events)],
      campaigns: filter(data.campaigns),
      reports: filter(data.reports),
      analytics: filter(data.analytics),
      users: filter(data.users),
      subscriptions: filter(data.subscriptions),
      invoices: filter(data.invoices),
      qr: filter(data.qr),
      activity: filter(data.activity),
    };
  }, [data, selectedTenantId]);

  const updateGroup = (group: keyof LifecycleState, key: string, value: any) => {
    setState((current) => ({ ...current, [group]: { ...(current[group] as Record<string, any>), [key]: value } }));
  };

  const provisionWorkspace = async () => {
    setLoading(true);
    try {
      const payload = {
        ...state,
        checkout: {
          ...state.checkout,
          billing_email: state.checkout.billing_email || state.contact.email,
          business_name: state.checkout.business_name || state.organization.name,
          subtotal: state.plan.amount,
          total: state.plan.amount,
        },
      };
      const response = await base44.functions.invoke('provisionPartnerWorkspace', payload);
      setState((current) => ({ ...current, checkout: payload.checkout, provision: response.data || response }));
      navigate('/partners/provision');
    } finally {
      setLoading(false);
    }
  };

  if (location.pathname.startsWith('/workspace')) {
    return <WorkspaceView state={state} scoped={scoped} data={data} />;
  }

  if (location.pathname === '/partners/start') {
    return (
      <Shell eyebrow="Partner type" title="Choose the workspace lane." body="Pick the closest operating model. We use this to recommend the right setup, modules, and workspace defaults.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {partnerTypes.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => {
                setState((current) => ({
                  ...current,
                  organizationType: type.key,
                  organization: { ...current.organization, industry: type.label },
                  plan: type.key === 'property' || type.key === 'hotel' ? plans[0] : current.plan,
                }));
                navigate('/partners/register');
              }}
              className={`min-h-[180px] border bg-white p-5 text-left transition hover:border-[#C8A96A] ${state.organizationType === type.key ? 'border-[#C8A96A]' : 'border-[rgba(11,31,51,0.08)]'}`}
            >
              <p className="text-base font-semibold">{type.label}</p>
              <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{type.description}</p>
              <p className="mt-4 text-xs font-semibold text-[#C8A96A]">{type.template}</p>
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  if (location.pathname === '/partners/register') {
    return (
      <Shell eyebrow="Registration" title="Enter the details that create the workspace." body="Registration captures the organization, contact, location, plan, and review details used to provision the operating center.">
        <Progress active={2} />
        <form
          className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]"
          onSubmit={(event) => {
            event.preventDefault();
            navigate('/partners/pricing');
          }}
        >
          <SectionCard>
            <p className="text-sm font-semibold">Workspace preview</p>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">This setup includes Live Map, Campaigns, Reporting, Offers, Events, Team, Billing, QR Experiences, API readiness, and the Downtown Assistant.</p>
            <div className="mt-5 grid gap-2">
              {selectedType.modules.map((module) => (
                <span key={module} className="flex items-center gap-2 text-sm text-[#0B1F33]"><CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> {module}</span>
              ))}
            </div>
          </SectionCard>
          <SectionCard>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Organization" required value={state.organization.name} onChange={(value) => updateGroup('organization', 'name', value)} />
              <Field label="Website" value={state.organization.website} onChange={(value) => updateGroup('organization', 'website', value)} />
              <Field label="Primary contact" required value={state.contact.name} onChange={(value) => updateGroup('contact', 'name', value)} />
              <Field label="Email" required value={state.contact.email} onChange={(value) => updateGroup('contact', 'email', value)} />
              <Field label="Phone" value={state.contact.phone} onChange={(value) => updateGroup('contact', 'phone', value)} />
              <Field label="Manager" value={state.contact.manager} onChange={(value) => updateGroup('contact', 'manager', value)} />
              <Field label="Owner" value={state.contact.owner} onChange={(value) => updateGroup('contact', 'owner', value)} />
              <Field label="Address" value={state.location.address} onChange={(value) => updateGroup('location', 'address', value)} />
              <Field label="Socials" value={state.location.socials} onChange={(value) => updateGroup('location', 'socials', value)} />
              <Field label="Google Business" value={state.location.google_business} onChange={(value) => updateGroup('location', 'google_business', value)} />
              <Field label="Opening Hours" value={state.location.hours} onChange={(value) => updateGroup('location', 'hours', value)} />
              <Field label="Categories" value={state.location.categories} onChange={(value) => updateGroup('location', 'categories', value)} />
            </div>
            <label className="mt-5 block">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.56)]">Description</span>
              <textarea value={state.location.description || ''} onChange={(event) => updateGroup('location', 'description', event.target.value)} className="mt-2 min-h-[120px] w-full border-0 border-b border-[rgba(11,31,51,0.16)] bg-white px-0 py-3 text-sm outline-none focus:border-[#C8A96A]" />
            </label>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="inline-flex h-10 items-center gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-4 text-xs font-semibold text-[#0B1F33] hover:border-[#C8A96A]" type="submit">Continue to pricing <ArrowRight className="h-4 w-4" /></button>
              <ActionLink to="/partners/start">Change type</ActionLink>
            </div>
          </SectionCard>
        </form>
      </Shell>
    );
  }

  if (location.pathname === '/partners/pricing') {
    return (
      <Shell eyebrow="Plan" title="Select the plan that matches the workspace." body="Pricing belongs in the onboarding flow here so the selected plan can carry directly into checkout and provisioning.">
        <Progress active={4} />
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <button key={plan.key} type="button" onClick={() => setState((current) => ({ ...current, plan }))} className={`border bg-white p-6 text-left transition hover:border-[#C8A96A] ${state.plan.key === plan.key ? 'border-[#C8A96A]' : 'border-[rgba(11,31,51,0.08)]'}`}>
              <p className="text-lg font-semibold">{plan.label}</p>
              <p className="mt-2 text-3xl font-semibold">{plan.amount ? `$${plan.amount}` : 'Custom'}<span className="text-sm font-normal text-[rgba(11,31,51,0.52)]"> / {plan.cadence}</span></p>
              <p className="mt-4 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{plan.summary}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#C8A96A]">{plan.limits}</p>
              <div className="mt-4 grid gap-2 text-sm">
                {plan.modules.map((module) => <span key={module}>• {module}</span>)}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <ActionLink to="/partners/checkout">Continue to checkout <ArrowRight className="h-4 w-4" /></ActionLink>
          <ActionLink to="/partners/register">Edit registration</ActionLink>
        </div>
      </Shell>
    );
  }

  if (location.pathname === '/partners/checkout') {
    return (
      <Shell eyebrow="Checkout" title="Confirm payment and create the workspace." body="This local checkout writes the billing, subscription, invoice, and workspace records. Stripe credentials can attach to the same records when enabled.">
        <Progress active={5} />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <SectionCard>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Business name" required value={state.checkout.business_name || state.organization.name} onChange={(value) => updateGroup('checkout', 'business_name', value)} />
              <Field label="Billing email" required value={state.checkout.billing_email || state.contact.email} onChange={(value) => updateGroup('checkout', 'billing_email', value)} />
              <Field label="Coupon" value={state.checkout.coupon} onChange={(value) => updateGroup('checkout', 'coupon', value)} />
              <Field label="Tax" value={String(state.checkout.tax || 0)} onChange={(value) => updateGroup('checkout', 'tax', Number(value || 0))} />
            </div>
            <button disabled={loading} onClick={provisionWorkspace} className="mt-6 inline-flex h-10 items-center gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-4 text-xs font-semibold text-[#0B1F33] hover:border-[#C8A96A] disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Confirm payment and create workspace
            </button>
          </SectionCard>
          <SectionCard>
            <p className="text-sm font-semibold">Invoice summary</p>
            <Line label="Plan" value={state.plan.label || 'Starter'} />
            <Line label="Cadence" value={state.plan.cadence || 'annual'} />
            <Line label="Subtotal" value={state.plan.amount ? `$${state.plan.amount}` : 'Custom'} />
            <Line label="Tax" value={`$${Number(state.checkout.tax || 0).toLocaleString()}`} />
            <Line label="Total" value={state.plan.amount ? `$${Number(state.plan.amount || 0) + Number(state.checkout.tax || 0)}` : 'Custom'} strong />
          </SectionCard>
        </div>
      </Shell>
    );
  }

  if (location.pathname === '/partners/provision') {
    const provisioned = Boolean(state.provision?.success);
    return (
      <Shell eyebrow="Workspace creation" title={provisioned ? 'Your workspace is ready.' : 'Create your workspace.'} body="Provisioning connects the organization, permissions, reports, billing, AI context, QR, map presence, and starter operating records.">
        <SectionCard>
          <div className="grid gap-3 md:grid-cols-2">
            {['Organization', 'Permissions', 'Reports', 'Billing', 'AI', 'Map', 'Offers', 'Events'].map((item) => (
              <p key={item} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> {item}</p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {provisioned ? <ActionLink to="/workspace/home">Open Workspace <ArrowRight className="h-4 w-4" /></ActionLink> : <button onClick={provisionWorkspace} className="inline-flex h-10 items-center gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-4 text-xs font-semibold text-[#0B1F33] hover:border-[#C8A96A]">Provision workspace</button>}
            <ActionLink to="/partners/checkout">Review checkout</ActionLink>
          </div>
        </SectionCard>
      </Shell>
    );
  }

  return (
    <Shell eyebrow="Partner platform" title="Start your workspace." body="Move from partner type to registration, checkout, provisioning, and daily operations without switching products or losing context.">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <SectionCard>
          <div className="grid gap-4 sm:grid-cols-2">
            {['Landing Page', 'Partner Type', 'Registration', 'Organization Setup', 'Pricing', 'Checkout', 'Verification', 'Workspace Creation', 'Partner Dashboard', 'Daily Operations'].map((step, index) => (
              <div key={step} className="border-t border-[rgba(11,31,51,0.08)] pt-4">
                <p className="text-xs font-semibold text-[#C8A96A]">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-1 text-sm font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard>
          <p className="text-lg font-semibold">Partner operating center</p>
          <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.62)]">The workspace is where partners manage offers, events, campaigns, QR, reporting, billing, team access, and optimization.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ActionLink to="/partners/start">Start Your Workspace <ArrowRight className="h-4 w-4" /></ActionLink>
            <ActionLink to="/partners/pricing">Compare Plans</ActionLink>
          </div>
        </SectionCard>
      </div>
    </Shell>
  );
}

function Shell({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white text-[#0B1F33]">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(11,31,51,0.08)] pb-5">
          <Link to="/admin" className="text-sm font-semibold">Downtown Perks Platform</Link>
          <nav className="flex flex-wrap gap-3 text-xs font-semibold text-[rgba(11,31,51,0.62)]">
            <Link to="/partners">Partners</Link>
            <Link to="/partners/register">Register</Link>
            <Link to="/workspace/home">Workspace</Link>
            <Link to="/admin">Admin</Link>
          </nav>
        </div>
        <header className="mb-8 grid gap-5 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#C8A96A]">{eyebrow}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">{title}</h1>
          </div>
          <p className="text-sm leading-6 text-[rgba(11,31,51,0.66)]">{body}</p>
        </header>
        {children}
      </div>
    </main>
  );
}

function Progress({ active }: { active: number }) {
  const steps = ['Organization', 'Contact', 'Location', 'Plan', 'Review'];
  return (
    <div className="mb-6 grid gap-2 sm:grid-cols-5">
      {steps.map((step, index) => (
        <div key={step} className={`border-b py-2 text-xs font-semibold ${index + 1 <= active ? 'border-[#C8A96A] text-[#0B1F33]' : 'border-[rgba(11,31,51,0.08)] text-[rgba(11,31,51,0.48)]'}`}>
          {index + 1}. {step}
        </div>
      ))}
    </div>
  );
}

function Line({ label, value, strong = false }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-4 border-t border-[rgba(11,31,51,0.08)] pt-4 text-sm">
      <span className="text-[rgba(11,31,51,0.58)]">{label}</span>
      <span className={strong ? 'font-semibold text-[#0B1F33]' : 'font-medium'}>{value}</span>
    </div>
  );
}

function WorkspaceView({ state, scoped, data }: { state: LifecycleState; scoped: Record<string, any[]>; data: Record<string, any[]> }) {
  const location = useLocation();
  const [actionStatus, setActionStatus] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const moduleSlug = location.pathname.replace('/workspace/', '') || 'home';
  const orgName = state.provision?.tenant?.name || state.organization.name || data.tenants?.[0]?.name || 'Partner Workspace';
  const tenantId = state.provision?.tenant?.id || data.tenants?.[0]?.id;
  const analytics = scoped.analytics?.[0] || {};
  const snapshot = [
    { label: 'Views', value: analytics.views || 0 },
    { label: 'Directions', value: analytics.directions || 0 },
    { label: 'Offer Saves', value: analytics.saves || 0 },
    { label: 'Redemptions', value: analytics.redemptions || 0 },
    { label: 'Events', value: scoped.events?.length || 0 },
    { label: 'Visitors Nearby', value: analytics.guests_reached || 0 },
    { label: 'Campaign Reach', value: scoped.campaigns?.reduce((sum, item) => sum + Number(item.reach || 0), 0) || 0 },
    { label: 'Recommendations', value: 4 },
  ];

  if (moduleSlug !== 'home') {
    return (
      <Shell eyebrow="Workspace module" title={moduleTitle(moduleSlug)} body={`${orgName} data is loaded from the platform workspace records and scoped to the selected organization where records are available.`}>
        <WorkspaceNav />
        <ModuleTable slug={moduleSlug} scoped={scoped} />
      </Shell>
    );
  }

  const runWorkspaceAction = async (actionType: string, title?: string) => {
    setActionStatus('Working...');
    try {
      const response = await base44.functions.invoke('createWorkspaceAction', {
        tenant_id: tenantId,
        action_type: actionType,
        title,
        actor: 'workspace-user@downtownperks.local',
      });
      const record = response.data?.record || response.record;
      setActionStatus(`${record?.title || record?.label || title || 'Workspace action'} created.`);
    } catch (error: any) {
      setActionStatus(error?.message || 'Action failed.');
    }
  };

  const askAssistant = async (prompt: string) => {
    setAssistantResponse('Thinking...');
    try {
      const response = await base44.functions.invoke('askWorkspaceAssistant', {
        tenant_id: tenantId,
        prompt,
        actor: 'workspace-user@downtownperks.local',
      });
      setAssistantResponse(response.data?.response || response.response || 'Assistant response saved.');
    } catch (error: any) {
      setAssistantResponse(error?.message || 'Assistant request failed.');
    }
  };

  return (
    <Shell eyebrow="Workspace Home" title={orgName} body="Manage campaigns, offers, events, reporting, team access, billing, QR experiences, and performance from one operating center.">
      <WorkspaceNav />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {snapshot.map((metric) => (
          <React.Fragment key={metric.label}>
            <SectionCard>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.52)]">{metric.label}</p>
              <strong className="mt-2 block text-2xl font-semibold">{Number(metric.value || 0).toLocaleString()}</strong>
            </SectionCard>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard>
          <p className="text-lg font-semibold">Quick actions</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['Create Offer', 'create_offer'],
              ['Create Event', 'create_event'],
              ['New Campaign', 'new_campaign'],
              ['Invite Team', 'invite_team'],
              ['Generate QR', 'generate_qr'],
              ['Update Profile', 'update_profile'],
              ['Launch Broadcast', 'launch_broadcast'],
            ].map(([action, actionType]) => (
              <button key={action} onClick={() => runWorkspaceAction(actionType, action)} className="inline-flex min-h-11 items-center justify-between border border-[rgba(11,31,51,0.08)] bg-white px-4 text-sm font-semibold hover:border-[#C8A96A]">
                {action} <Plus className="h-4 w-4" />
              </button>
            ))}
          </div>
          {actionStatus && <p className="mt-4 text-sm font-semibold text-[#0B1F33]">{actionStatus}</p>}
        </SectionCard>
        <SectionCard>
          <p className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="h-4 w-4 text-[#C8A96A]" /> Downtown Assistant</p>
          <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.62)]">Good morning. Your workspace has {scoped.offers?.length || 0} offers, {scoped.events?.length || 0} events, and {scoped.campaigns?.length || 0} campaigns ready to manage. Suggested next action: publish a timely offer, generate QR access, and invite a teammate.</p>
          <div className="mt-4 grid gap-2 text-sm">
            {['What should we promote today?', 'Create an event', 'Generate a report', 'Summarize this month'].map((prompt) => <button key={prompt} onClick={() => askAssistant(prompt)} className="border-b border-[rgba(11,31,51,0.08)] py-2 text-left hover:text-[#C8A96A]">{prompt}</button>)}
          </div>
          {assistantResponse && <p className="mt-4 border-t border-[rgba(11,31,51,0.08)] pt-4 text-sm leading-6 text-[#0B1F33]">{assistantResponse}</p>}
        </SectionCard>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <SectionCard>
          <p className="text-lg font-semibold">Workspace modules</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {workspaceGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{group.label}</p>
                <div className="mt-3 grid gap-2">
                  {group.items.map((item) => <Link key={item} to={`/workspace/${slugFor(item)}`} className="flex items-center justify-between border-b border-[rgba(11,31,51,0.08)] py-2 text-sm font-semibold hover:text-[#C8A96A]">{item}<ArrowRight className="h-4 w-4" /></Link>)}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard>
          <p className="text-lg font-semibold">Onboarding checklist</p>
          <p className="mt-2 text-sm text-[rgba(11,31,51,0.62)]">Completion 87%</p>
          <div className="mt-4 grid gap-2">
            {setupTasks.map((task, index) => <p key={task} className="flex items-center gap-2 text-sm"><CheckCircle2 className={`h-4 w-4 ${index < 7 ? 'text-[#C8A96A]' : 'text-[rgba(11,31,51,0.24)]'}`} /> {task}</p>)}
          </div>
        </SectionCard>
      </div>
      <SectionCard className="mt-6">
        <p className="text-lg font-semibold">Activity</p>
        <div className="mt-4 grid gap-3">
          {(scoped.activity || []).slice(0, 6).map((item: any) => (
            <div key={item.id} className="border-t border-[rgba(11,31,51,0.08)] pt-3 text-sm">
              <p className="font-semibold">{String(item.action || item.message || 'Workspace activity').replace(/_/g, ' ')}</p>
              <p className="mt-1 text-xs text-[rgba(11,31,51,0.52)]">{new Date(item.timestamp || item.created_at || Date.now()).toLocaleString()}</p>
            </div>
          ))}
          {(!scoped.activity || scoped.activity.length === 0) && <p className="text-sm text-[rgba(11,31,51,0.58)]">No workspace activity has been recorded yet.</p>}
        </div>
      </SectionCard>
    </Shell>
  );
}

function WorkspaceNav() {
  const links = ['home', 'map', 'offers', 'events', 'campaigns', 'reports', 'analytics', 'profile', 'team', 'billing', 'settings'];
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto border-b border-[rgba(11,31,51,0.08)] pb-3">
      {links.map((link) => (
        <Link key={link} to={`/workspace/${link}`} className="whitespace-nowrap px-2 py-2 text-xs font-semibold capitalize text-[rgba(11,31,51,0.62)] hover:text-[#C8A96A]">{link}</Link>
      ))}
    </div>
  );
}

function moduleTitle(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase());
}

function ModuleTable({ slug, scoped }: { slug: string; scoped: Record<string, any[]> }) {
  const rowsBySlug: Record<string, any[]> = {
    offers: scoped.offers,
    events: scoped.events,
    campaigns: scoped.campaigns,
    reports: scoped.reports,
    analytics: scoped.analytics,
    team: scoped.users,
    billing: [...(scoped.subscriptions || []), ...(scoped.invoices || [])],
    qr: scoped.qr,
    map: scoped.qr,
    profile: scoped.modules,
    settings: scoped.modules,
  };
  const rows = rowsBySlug[slug] || scoped.modules || [];
  return (
    <SectionCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{moduleTitle(slug)}</p>
          <p className="mt-1 text-sm text-[rgba(11,31,51,0.62)]">{rows.length} connected records</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex h-9 items-center gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-3 text-xs font-semibold"><Search className="h-4 w-4" /> Search</button>
          <button className="inline-flex h-9 items-center gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-3 text-xs font-semibold"><Plus className="h-4 w-4" /> Create</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[rgba(11,31,51,0.08)] text-[11px] font-bold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.48)]">
            <tr><th className="py-3 pr-4">Record</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Owner</th><th className="py-3 pr-4">Updated</th></tr>
          </thead>
          <tbody className="divide-y divide-[rgba(11,31,51,0.08)]">
            {rows.map((row: any) => (
              <tr key={row.id}>
                <td className="py-3 pr-4 font-semibold">{row.title || row.name || row.display_name || row.module || row.plan_label || row.invoice_number || row.id}</td>
                <td className="py-3 pr-4">{row.status || row.workspace_status || 'ready'}</td>
                <td className="py-3 pr-4 text-[rgba(11,31,51,0.62)]">{row.email || row.partner_id || row.tenant_id || 'workspace'}</td>
                <td className="py-3 pr-4 text-[rgba(11,31,51,0.52)]">{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : 'Not updated'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-[rgba(11,31,51,0.58)]">No records yet. Use Create to start this workflow.</td></tr>}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
