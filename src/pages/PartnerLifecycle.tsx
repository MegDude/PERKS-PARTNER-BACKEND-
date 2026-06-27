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
  addOns: Record<string, number>;
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
  { key: 'property_basic', vertical: 'Properties', partnerType: 'property', label: 'Basic Building', amount: 49, cadence: 'month', summary: 'Get the building on the map with a clean resident entry point.', limits: 'Best for a single building getting started', modules: ['Property profile', 'Map presence', 'Building QR', 'Basic reports'] },
  { key: 'property_resident_plus', vertical: 'Properties', partnerType: 'property', label: 'Resident Plus', amount: 99, cadence: 'month', summary: 'Add resident perks, community notes, and stronger building follow-up.', limits: 'Best for active resident programming', modules: ['Everything in Basic', 'Resident perks', 'Broadcasts', 'Monthly readout'] },
  { key: 'property_pro', vertical: 'Properties', partnerType: 'property', label: 'Property Pro', amount: 199, cadence: 'month', summary: 'Run the full resident layer with campaigns, reporting, and deeper support.', limits: 'Best for high-touch property teams', modules: ['Everything in Plus', 'Campaigns', 'Priority setup', 'Advanced reports'] },
  { key: 'venue_basic', vertical: 'Venues', partnerType: 'venue', label: 'Basic', amount: 30, cadence: 'month', summary: 'Show up on the map and give locals one clear reason to stop in.', limits: 'Best for getting discovered', modules: ['Venue profile', 'Map listing', 'One starter perk', 'Basic signals'] },
  { key: 'venue_growth', vertical: 'Venues', partnerType: 'venue', label: 'Growth', amount: 79, cadence: 'month', summary: 'Keep offers and events in the rotation with cleaner performance readouts.', limits: 'Best for steady local activity', modules: ['Everything in Basic', 'Events', 'Campaign notes', 'Readouts'] },
  { key: 'venue_pro', vertical: 'Venues', partnerType: 'venue', label: 'Pro', amount: 199, cadence: 'month', summary: 'Stay visible all year with stronger placement, reporting, and support.', limits: 'Best for go-to downtown spots', modules: ['Everything in Growth', 'Priority moments', 'Advanced reports', 'Support'] },
  { key: 'hotel_starter', vertical: 'Hotels', partnerType: 'hotel', label: 'Hotel Starter', amount: 99, cadence: 'month', summary: 'Give guests a simple local guide tied to lobby, room, and concierge moments.', limits: 'Best for one hotel property', modules: ['Hotel profile', 'Guest guide', 'Lobby QR', 'Local perks'] },
  { key: 'hotel_pro', vertical: 'Hotels', partnerType: 'hotel', label: 'Hotel Pro', amount: 199, cadence: 'month', summary: 'Turn guest discovery into measurable campaigns and partner reports.', limits: 'Best for active hospitality teams', modules: ['Everything in Starter', 'Campaigns', 'Guest reporting', 'Concierge support'] },
  { key: 'brand_access', vertical: 'Brands', partnerType: 'brand', label: 'Brand Access', amount: 99, cadence: 'month', summary: 'Create a local brand presence tied to real downtown behavior.', limits: 'Best for light sponsorship presence', modules: ['Brand profile', 'Map presence', 'Campaign access', 'Basic reporting'] },
  { key: 'brand_campaigns', vertical: 'Brands', partnerType: 'brand', label: 'Brand Campaigns', amount: 199, cadence: 'month', summary: 'Run campaigns, sponsored moments, and reporting from one partner workspace.', limits: 'Best for active brand programs', modules: ['Everything in Access', 'Campaign workspace', 'Sponsored moments', 'Reports'] },
  { key: 'civic_plus', vertical: 'Civic', partnerType: 'civic', label: 'Civic Plus', amount: 30, cadence: 'month', summary: 'Give residents a clear path to public programs, notes, and events.', limits: 'Best for local associations and programs', modules: ['Civic profile', 'Events', 'Surveys', 'Public notes'] },
  { key: 'civic_pro', vertical: 'Civic', partnerType: 'civic', label: 'Civic Pro', amount: 99, cadence: 'month', summary: 'Add richer programming, feedback, and reporting for community work.', limits: 'Best for active civic teams', modules: ['Everything in Plus', 'Campaigns', 'Feedback', 'Reports'] },
];

const addOns = [
  { key: 'perk_campaign', category: 'Campaigns', label: 'Perk Campaign', amount: 30, cadence: 'one_time', summary: 'Put one useful offer in front of people while they are deciding where to go.' },
  { key: 'featured_campaign', category: 'Campaigns', label: 'Featured Campaign', amount: 49, cadence: 'one_time', summary: 'Give a campaign better placement when timing matters.' },
  { key: 'sponsored_campaign', category: 'Campaigns', label: 'Sponsored Campaign', amount: 99, cadence: 'one_time', summary: 'Push a strong offer across a bigger downtown moment.' },
  { key: 'event_boost', category: 'Events', label: 'Event Boost', amount: 20, cadence: 'one_time', summary: 'Help people notice an event before they make other plans.' },
  { key: 'featured_event', category: 'Events', label: 'Featured Event', amount: 49, cadence: 'one_time', summary: 'Keep an event visible while people are still planning.' },
  { key: 'sponsored_event', category: 'Events', label: 'Sponsored Event', amount: 99, cadence: 'one_time', summary: 'Give a bigger event a broader downtown push.' },
  { key: 'single_survey', category: 'Surveys', label: 'Single Survey', amount: 30, cadence: 'one_time', summary: 'Ask one clean question and get a usable answer.' },
  { key: 'survey_series', category: 'Surveys', label: 'Survey Series', amount: 79, cadence: 'month', summary: 'Ask over time and see what changes.' },
  { key: 'broadcast_5m', category: 'Broadcast', label: 'Nearby Broadcast (5-min)', amount: 20, cadence: 'one_time', summary: 'Send a nudge to people close enough to walk over.' },
  { key: 'sms_500', category: 'Broadcast', label: 'SMS Broadcast (up to 500)', amount: 30, cadence: 'one_time', summary: 'Send one direct note to a smaller list.' },
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
  plan: plans[3],
  addOns: {},
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
  return <section className={`border border-[rgba(11,31,51,0.08)] bg-white p-5 text-left shadow-none sm:p-6 ${className}`}>{children}</section>;
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

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
}

function annualCost(plan: Record<string, any>) {
  return Number(plan.amount || 0) * 12;
}

function selectedAddOnItems(selected: Record<string, number>) {
  return addOns
    .map((item) => ({ ...item, quantity: Number(selected[item.key] || 0) }))
    .filter((item) => item.quantity > 0);
}

function pricingTotals(plan: Record<string, any>, selected: Record<string, number>, tax = 0) {
  const selectedAddOns = selectedAddOnItems(selected);
  const monthlyAddOns = selectedAddOns.filter((item) => item.cadence === 'month').reduce((sum, item) => sum + item.amount * item.quantity, 0);
  const oneTimeAddOns = selectedAddOns.filter((item) => item.cadence !== 'month').reduce((sum, item) => sum + item.amount * item.quantity, 0);
  const monthlyDue = Number(plan.amount || 0) + monthlyAddOns;
  const annualCommitment = monthlyDue * 12;
  const firstPayment = monthlyDue + oneTimeAddOns + Number(tax || 0);
  return { selectedAddOns, monthlyAddOns, oneTimeAddOns, monthlyDue, annualCommitment, firstPayment };
}

export default function PartnerLifecycle() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<LifecycleState>(() => loadState());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, any[]>>({});
  const workspaceParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

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
  const selectedWorkspaceKey = workspaceParams.get('tenant') || workspaceParams.get('workspace') || workspaceParams.get('workspaceId') || workspaceParams.get('tenantId') || '';
  const selectedPartnerId = workspaceParams.get('partner') || '';
  const selectedWorkspace = useMemo(() => {
    if (!selectedWorkspaceKey && !selectedPartnerId) return null;
    const normalizedKey = selectedWorkspaceKey.toLowerCase();
    const partner = (data.partners || []).find((item: any) => item.id === selectedPartnerId || item.tenant_id === selectedWorkspaceKey || item.workspace_id === selectedWorkspaceKey);
    const tenant = (data.tenants || []).find((item: any) => (
      item.id === selectedWorkspaceKey ||
      item.slug === selectedWorkspaceKey ||
      item.workspace_id === selectedWorkspaceKey ||
      String(item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalizedKey ||
      item.id === partner?.tenant_id
    ));
    const workspace = (data.workspaces || []).find((item: any) => (
      item.id === selectedWorkspaceKey ||
      item.tenant_id === selectedWorkspaceKey ||
      item.tenant_id === tenant?.id ||
      item.path === `/tenant/${selectedWorkspaceKey}` ||
      item.slug === selectedWorkspaceKey
    ));
    return { partner, tenant, workspace };
  }, [data.partners, data.tenants, data.workspaces, selectedPartnerId, selectedWorkspaceKey]);
  const selectedTenantId = selectedWorkspace?.tenant?.id || selectedWorkspace?.workspace?.tenant_id || selectedWorkspace?.partner?.tenant_id || (!selectedWorkspaceKey ? state.provision?.tenant?.id : '') || (!selectedWorkspaceKey ? data.tenants?.[0]?.id : '');
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
  const totals = useMemo(() => pricingTotals(state.plan, state.addOns || {}, Number(state.checkout.tax || 0)), [state.plan, state.addOns, state.checkout.tax]);

  const updateGroup = (group: keyof LifecycleState, key: string, value: any) => {
    setState((current) => ({ ...current, [group]: { ...(current[group] as Record<string, any>), [key]: value } }));
  };

  const setAddOnQuantity = (key: string, quantity: number) => {
    setState((current) => ({
      ...current,
      addOns: {
        ...(current.addOns || {}),
        [key]: Math.max(0, quantity),
      },
    }));
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
            subtotal: totals.firstPayment,
            total: totals.firstPayment,
            monthly_due: totals.monthlyDue,
            one_time_add_ons: totals.oneTimeAddOns,
            annual_commitment: totals.annualCommitment,
            selected_add_ons: totals.selectedAddOns,
          },
      };
      await fetch('/api/partner-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: payload.organization.name,
          business_name: payload.organization.name,
          partner_type: payload.organizationType,
          contact: payload.contact,
          email: payload.contact.email,
          name: payload.contact.name,
          phone: payload.contact.phone,
          plan: payload.plan,
          products: totals.selectedAddOns,
          checkout: payload.checkout,
          source_type: 'partner_registration',
          metadata: {
            annual_commitment: totals.annualCommitment,
            first_payment: totals.firstPayment,
            selected_add_ons: totals.selectedAddOns,
          },
        }),
      });
      await fetch('/api/google-sheets/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'partner_pricing_signup',
          lead: {
            organizationName: payload.organization.name,
            name: payload.contact.name,
            email: payload.contact.email,
            partner_name: payload.organization.name,
            partner_type: payload.organizationType,
            status: 'pricing_selected',
            plan: payload.plan.label,
            summary: `${payload.plan.label} at ${money(payload.plan.amount)}/mo; annual commitment ${money(totals.annualCommitment)}; first payment ${money(totals.firstPayment)}.`,
            selected_add_ons: totals.selectedAddOns,
          },
        }),
      }).catch(() => null);
      const checkoutLineItems = [
        {
          name: payload.plan.label,
          amount: Number(payload.plan.amount || 0),
          interval: 'month',
          cadence: 'month',
          quantity: 1,
        },
        ...totals.selectedAddOns.map((item) => ({
          name: item.label,
          amount: item.amount,
          interval: item.cadence === 'month' ? 'month' : 'one_time',
          cadence: item.cadence,
          quantity: item.quantity,
        })),
      ];
      const checkoutResponse = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: payload.organization.name,
          business_name: payload.checkout.business_name,
          customer_email: payload.checkout.billing_email,
          billing_email: payload.checkout.billing_email,
          partner_type: payload.organizationType,
          plan: payload.plan,
          plan_amount: totals.firstPayment,
          coupon: payload.checkout.coupon,
          line_items: checkoutLineItems,
          success_url: `${window.location.origin}/partners/provision?checkout=success`,
          cancel_url: `${window.location.origin}/partners/checkout?checkout=cancelled`,
        }),
      });
      const checkoutResult = await checkoutResponse.json();
      if (!checkoutResponse.ok) {
        throw new Error(checkoutResult?.error || 'Checkout failed');
      }
      const nextCheckout = {
        ...payload.checkout,
        checkout_session_id: checkoutResult.checkout_session?.id,
        checkout_status: checkoutResult.status,
        checkout_url: checkoutResult.checkout_url,
        billing_status: checkoutResult.checkout_session?.billing_status || checkoutResult.status,
        provider: checkoutResult.checkout_session?.provider || checkoutResult.status,
      };
      if (checkoutResult.checkout_url && /^https?:\/\//.test(checkoutResult.checkout_url) && checkoutResult.status !== 'promotional') {
        setState((current) => ({ ...current, checkout: nextCheckout }));
        window.location.href = checkoutResult.checkout_url;
        return;
      }
      const response = await base44.functions.invoke('provisionPartnerWorkspace', { ...payload, checkout: nextCheckout });
      setState((current) => ({ ...current, checkout: nextCheckout, provision: response.data || response }));
      navigate('/partners/provision');
    } finally {
      setLoading(false);
    }
  };

  if (location.pathname.startsWith('/workspace')) {
    return <WorkspaceView state={state} scoped={scoped} data={data} selectedWorkspace={selectedWorkspace} selectedTenantId={selectedTenantId} />;
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
                  plan: plans.find((plan) => plan.partnerType === type.key) || current.plan,
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
    const visiblePlans = plans.filter((plan) => plan.partnerType === state.organizationType);
    const plansByVertical = plans.reduce((groups, plan) => {
      if (!groups[plan.vertical]) groups[plan.vertical] = [];
      groups[plan.vertical].push(plan);
      return groups;
    }, {} as Record<string, typeof plans>);
    const addOnsByCategory = addOns.reduce((groups, item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
      return groups;
    }, {} as Record<string, typeof addOns>);
    return (
      <Shell eyebrow="Pricing" title="Partner with the neighborhood." body="Choose your annual plan, add what helps right now, capture the signup details, and move straight into checkout and workspace access.">
        <Progress active={4} />
        <section className="grid gap-6 text-left xl:grid-cols-[0.86fr_1.14fr]">
          <SectionCard className="xl:sticky xl:top-6 xl:self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Be where plans are made</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">Start with the plan that fits.</h2>
            <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.64)]">
              Downtown Perks is the digital layer for downtown Austin. People scan a code, find what is nearby, save what looks good, and partners see what worked.
            </p>
            <div className="mt-5 grid gap-3">
              {[
                ['No app to download', 'Residents open the guide from a simple QR or link.'],
                ['Real signal', 'See saves, scans, directions, joins, and redemptions.'],
                ['Local by design', 'Built for the places, properties, brands, and civic teams that make downtown useful.'],
              ].map(([title, copy]) => (
                <div key={title} className="border-t border-[rgba(11,31,51,0.06)] pt-3">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-[rgba(11,31,51,0.58)]">{copy}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-6">
            <SectionCard>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Annual subscription tiers</p>
                  <h2 className="mt-2 text-xl font-semibold">Monthly rate, annual commitment.</h2>
                </div>
                <p className="max-w-xl text-xs leading-5 text-[rgba(11,31,51,0.58)]">The monthly rate is used for billing. The annual cost shows the full twelve-month commitment.</p>
              </div>
              <div className="mt-5 overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full min-w-[720px] table-fixed text-left text-[12px]">
                  <thead className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.48)]">
                    <tr>
                      <th className="w-[22%] py-2 pr-4">Vertical</th>
                      <th className="w-[28%] py-2 pr-4">Tier</th>
                      <th className="w-[18%] py-2 pr-4 text-left">Monthly</th>
                      <th className="w-[20%] py-2 pr-4 text-left">Annual</th>
                      <th className="py-2 text-left">Choose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(11,31,51,0.06)]">
                    {Object.entries(plansByVertical).flatMap(([vertical, rows]) => rows.map((plan, index) => (
                      <tr key={plan.key} className="align-middle">
                        <td className="py-2.5 pr-4 text-[11px] font-semibold text-[rgba(11,31,51,0.58)]">{index === 0 ? vertical : ''}</td>
                        <td className="py-2.5 pr-4">
                          <button type="button" onClick={() => setState((current) => ({ ...current, organizationType: plan.partnerType, organization: { ...current.organization, industry: plan.vertical }, plan }))} className="text-left text-[12px] font-semibold leading-4 text-[#0B1F33] hover:text-[#C8A96A]">
                            {plan.label}
                          </button>
                        </td>
                        <td className="py-2.5 pr-4 text-left font-semibold">{money(plan.amount)}</td>
                        <td className="py-2.5 pr-4 text-left font-semibold">{money(annualCost(plan))}</td>
                        <td className="py-2.5 text-left">
                          <button type="button" onClick={() => setState((current) => ({ ...current, organizationType: plan.partnerType, plan }))} className={`min-h-7 px-0 text-left text-[10px] font-semibold uppercase ${state.plan.key === plan.key ? 'text-[#C8A96A]' : 'text-[#0B1F33]'}`}>
                            {state.plan.key === plan.key ? 'Selected' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <SectionCard>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Plan selector</p>
                <h2 className="mt-2 text-xl font-semibold">Recommended for {selectedType.label.toLowerCase()} partners.</h2>
                <div className="mt-4 grid gap-3">
                  {visiblePlans.map((plan) => (
                    <button key={plan.key} type="button" onClick={() => setState((current) => ({ ...current, plan }))} className={`border-t border-[rgba(11,31,51,0.06)] py-3 text-left ${state.plan.key === plan.key ? 'text-[#0B1F33]' : 'text-[rgba(11,31,51,0.66)]'}`}>
                      <span className="grid gap-1">
                        <strong className="text-sm">{plan.label}</strong>
                        <span className="text-xs font-semibold">{money(plan.amount)}/mo</span>
                      </span>
                      <span className="mt-1 block text-xs leading-5">{plan.summary}</span>
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Add things when needed</p>
                <h2 className="mt-2 text-xl font-semibold">Add-on modules.</h2>
                <div className="mt-4 grid gap-4">
                  {Object.entries(addOnsByCategory).map(([category, rows]) => (
                    <div key={category}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.48)]">{category}</p>
                      <div className="mt-2 grid gap-2">
                        {rows.map((item) => {
                          const quantity = Number(state.addOns?.[item.key] || 0);
                          return (
                            <div key={item.key} className="grid grid-cols-[1fr_auto] gap-3 border-t border-[rgba(11,31,51,0.05)] py-2">
                              <div>
                                <p className="text-[12px] font-semibold">{item.label} <span className="text-[rgba(11,31,51,0.48)]">· {money(item.amount)}{item.cadence === 'month' ? '/mo' : ''}</span></p>
                                <p className="mt-0.5 text-[11px] leading-4 text-[rgba(11,31,51,0.56)]">{item.summary}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button type="button" aria-label={`Remove ${item.label}`} onClick={() => setAddOnQuantity(item.key, quantity - 1)} className="h-7 w-7 text-sm font-semibold text-[#0B1F33]">-</button>
                                <span className="w-5 text-center text-xs font-semibold">{quantity}</span>
                                <button type="button" aria-label={`Add ${item.label}`} onClick={() => setAddOnQuantity(item.key, quantity + 1)} className="h-7 w-7 text-sm font-semibold text-[#0B1F33]">+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
              <SectionCard>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Signup details</p>
                <h2 className="mt-2 text-xl font-semibold">Create the partner record.</h2>
                <p className="mt-2 text-xs leading-5 text-[rgba(11,31,51,0.58)]">This captures the lead, attempts a Google Sheets sync, starts checkout, and opens the workspace after payment or an approved promotion.</p>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <Field label="Organization" required value={state.organization.name} onChange={(value) => updateGroup('organization', 'name', value)} />
                  <Field label="Website" value={state.organization.website} onChange={(value) => updateGroup('organization', 'website', value)} />
                  <Field label="Primary contact" required value={state.contact.name} onChange={(value) => updateGroup('contact', 'name', value)} />
                  <Field label="Email" required value={state.contact.email} onChange={(value) => updateGroup('contact', 'email', value)} />
                  <Field label="Phone" value={state.contact.phone} onChange={(value) => updateGroup('contact', 'phone', value)} />
                  <Field label="Address" value={state.location.address} onChange={(value) => updateGroup('location', 'address', value)} />
                  <Field label="Promotion code" value={state.checkout.coupon} onChange={(value) => updateGroup('checkout', 'coupon', value.toUpperCase())} placeholder="DUDE2026" />
                  <Field label="Billing email" value={state.checkout.billing_email || state.contact.email} onChange={(value) => updateGroup('checkout', 'billing_email', value)} />
                </div>
                <button disabled={loading || !state.organization.name || !state.contact.email} onClick={provisionWorkspace} className="mt-6 inline-flex min-h-9 items-center gap-2 bg-[#0B1F33] px-3 text-[11px] font-semibold uppercase text-white disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {state.checkout.coupon === 'DUDE2026' ? 'Create workspace' : 'Continue to checkout'}
                </button>
              </SectionCard>

              <SectionCard>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Your setup</p>
                <h2 className="mt-2 text-xl font-semibold">{state.plan.label}</h2>
                <Line label="Monthly plan" value={`${money(state.plan.amount)} / month`} />
                <Line label="Annual commitment" value={money(totals.annualCommitment)} />
                <Line label="One-time add-ons" value={money(totals.oneTimeAddOns)} />
                <Line label="First checkout" value={money(totals.firstPayment)} strong />
                {state.checkout.coupon === 'DUDE2026' && (
                  <p className="mt-4 text-xs leading-5 text-[#0B1F33]">DUDE2026 gives eligible partners a complimentary first year. No payment is required today, and the workspace opens immediately.</p>
                )}
                <div className="mt-4 border-t border-[rgba(11,31,51,0.06)] pt-4">
                  <p className="text-[11px] font-semibold uppercase text-[#C8A96A]">After checkout</p>
                  <p className="mt-2 text-xs leading-5 text-[rgba(11,31,51,0.58)]">The backend creates the organization, workspace, owner access, subscription, invoice record, starter reports, map presence, QR access, and audit trail.</p>
                </div>
              </SectionCard>
            </section>
          </div>
        </section>
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
            <Line label="Monthly plan" value={`${money(state.plan.amount)} / month`} />
            <Line label="Annual commitment" value={money(totals.annualCommitment)} />
            <Line label="One-time add-ons" value={money(totals.oneTimeAddOns)} />
            <Line label="Tax" value={money(Number(state.checkout.tax || 0))} />
            <Line label="First checkout" value={money(totals.firstPayment)} strong />
          </SectionCard>
        </div>
      </Shell>
    );
  }

  if (location.pathname === '/partners/provision') {
    const provisioned = Boolean(state.provision?.success);
    return (
      <Shell eyebrow="Workspace creation" title={provisioned ? 'Your workspace is ready.' : 'Create your workspace.'} body="This connects the organization, permissions, reports, billing, codes, map presence, and starter records.">
        <SectionCard>
          <div className="grid gap-3 md:grid-cols-2">
            {['Organization', 'Permissions', 'Reports', 'Billing', 'Codes', 'Map', 'Offers', 'Events'].map((item) => (
              <p key={item} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> {item}</p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {provisioned ? <ActionLink to="/workspace/home">Open workspace <ArrowRight className="h-4 w-4" /></ActionLink> : <button onClick={provisionWorkspace} className="inline-flex h-10 items-center gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-4 text-xs font-semibold text-[#0B1F33] hover:border-[#C8A96A]">Create workspace</button>}
            <ActionLink to="/partners/checkout">Review checkout</ActionLink>
          </div>
        </SectionCard>
      </Shell>
    );
  }

  return (
    <Shell eyebrow="Partner platform" title="Start your workspace." body="Move from partner type to registration, checkout, setup, and daily work without losing the thread.">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <SectionCard>
          <div className="grid gap-4 sm:grid-cols-2">
            {['First page', 'Partner type', 'Registration', 'Organization setup', 'Pricing', 'Checkout', 'Review', 'Workspace created', 'Partner view', 'Daily work'].map((step, index) => (
              <div key={step} className="border-t border-[rgba(11,31,51,0.08)] pt-4">
                <p className="text-xs font-semibold text-[#C8A96A]">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-1 text-sm font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard>
          <p className="text-lg font-semibold">Partner workspace</p>
          <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.62)]">The workspace is where partners keep offers, events, notes, codes, reports, billing, and team access in one place.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ActionLink to="/partners/start">Start your workspace <ArrowRight className="h-4 w-4" /></ActionLink>
            <ActionLink to="/partners/pricing">Compare plans</ActionLink>
          </div>
        </SectionCard>
      </div>
    </Shell>
  );
}

function Shell({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white text-left text-[#0B1F33]">
      <div className="w-full max-w-none px-4 py-6 sm:px-5 lg:px-6 lg:py-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(11,31,51,0.08)] pb-5">
          <Link to="/admin" className="text-sm font-semibold">Downtown Perks Platform</Link>
          <nav className="flex flex-wrap gap-3 text-xs font-semibold text-[rgba(11,31,51,0.62)]">
            <Link to="/partners">Partners</Link>
            <Link to="/partners/register">Register</Link>
            <Link to="/workspace/home">Workspace</Link>
            <Link to="/admin">Admin</Link>
          </nav>
        </div>
        <header className="mb-7 max-w-5xl text-left">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#C8A96A]">{eyebrow}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">{title}</h1>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[rgba(11,31,51,0.66)]">{body}</p>
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
    <div className="mt-4 grid gap-1 border-t border-[rgba(11,31,51,0.08)] pt-4 text-left text-sm sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
      <span className="text-[rgba(11,31,51,0.58)]">{label}</span>
      <span className={strong ? 'font-semibold text-[#0B1F33]' : 'font-medium'}>{value}</span>
    </div>
  );
}

function WorkspaceView({ state, scoped, data, selectedWorkspace, selectedTenantId }: { state: LifecycleState; scoped: Record<string, any[]>; data: Record<string, any[]>; selectedWorkspace: any; selectedTenantId: string }) {
  const location = useLocation();
  const [actionStatus, setActionStatus] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const moduleSlug = location.pathname.replace('/workspace/', '') || 'home';
  const orgName = selectedWorkspace?.tenant?.name || selectedWorkspace?.partner?.business_name || selectedWorkspace?.partner?.name || state.provision?.tenant?.name || state.organization.name || data.tenants?.[0]?.name || 'Partner Workspace';
  const tenantId = selectedTenantId || state.provision?.tenant?.id || data.tenants?.[0]?.id;
  const workspaceQuery = location.search || (tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : '');
  const analytics = scoped.analytics?.[0] || {};
  const snapshot = [
    { label: 'Views', value: analytics.views || 0, note: 'Profile and map visibility' },
    { label: 'Directions', value: analytics.directions || 0, note: 'Intent to visit' },
    { label: 'Offer Saves', value: analytics.saves || 0, note: 'Resident interest' },
    { label: 'Redemptions', value: analytics.redemptions || 0, note: 'Confirmed use' },
    { label: 'Events', value: scoped.events?.length || 0, note: 'Active programming' },
    { label: 'Visitors Nearby', value: analytics.guests_reached || 0, note: 'Local reach' },
    { label: 'Campaign Reach', value: scoped.campaigns?.reduce((sum, item) => sum + Number(item.reach || 0), 0) || 0, note: 'Audience coverage' },
    { label: 'Recommendations', value: 4, note: 'Next actions queued' },
  ];

  if (moduleSlug !== 'home') {
    return (
      <Shell eyebrow="Workspace area" title={moduleTitle(moduleSlug)} body={`Showing only ${orgName}, so each partner space stays easy to follow as you move through tabs.`}>
        <WorkspaceContextBar orgName={orgName} tenantId={tenantId} />
        <WorkspaceMetricStrip metrics={snapshot} compact />
        <WorkspaceNav query={workspaceQuery} />
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
    <Shell eyebrow="Workspace Home" title={orgName} body="Manage offers, events, notes, reports, team access, billing, QR codes, and results from one place.">
      <WorkspaceContextBar orgName={orgName} tenantId={tenantId} />
      <WorkspaceNav query={workspaceQuery} />
      <WorkspaceMetricStrip metrics={snapshot} />
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
          <p className="text-lg font-semibold">Workspace areas</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {workspaceGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{group.label}</p>
                <div className="mt-3 grid gap-2">
                  {group.items.map((item) => <Link key={item} to={`/workspace/${slugFor(item)}${workspaceQuery}`} className="flex items-center justify-between border-b border-[rgba(11,31,51,0.08)] py-2 text-sm font-semibold hover:text-[#C8A96A]">{item}<ArrowRight className="h-4 w-4" /></Link>)}
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

function WorkspaceContextBar({ orgName, tenantId }: { orgName: string; tenantId: string }) {
  return (
    <div className="mb-4 flex flex-col gap-2 border border-[rgba(11,31,51,0.08)] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#C8A96A]">Viewing workspace</p>
        <p className="text-sm font-semibold">{orgName}</p>
      </div>
      <p className="text-xs font-semibold text-[rgba(11,31,51,0.54)]">{tenantId ? 'Selected workspace' : 'No workspace selected'}</p>
    </div>
  );
}

function WorkspaceMetricStrip({ metrics, compact = false }: { metrics: Array<{ label: string; value: any; note: string }>; compact?: boolean }) {
  return (
    <section className={`dp-summary-matrix mb-6 ${compact ? 'mt-0' : ''}`}>
      <div className="flex flex-col gap-1 border-b border-[rgba(11,31,51,0.06)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase text-[#C8A96A]">Today at a glance</p>
          <h2 className="text-sm font-semibold">A quick read on what people are doing.</h2>
        </div>
        <p className="text-xs leading-5 text-[rgba(11,31,51,0.56)]">Shown on each workspace tab.</p>
      </div>
      <div className="dp-summary-matrix__grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="dp-summary-matrix__item">
            <p className="dp-summary-matrix__label">{metric.label}</p>
            <strong className="dp-summary-matrix__value">{Number(metric.value || 0).toLocaleString()}</strong>
            <p className="dp-summary-matrix__detail">{metric.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkspaceNav({ query = '' }: { query?: string }) {
  const links = ['home', 'map', 'offers', 'events', 'campaigns', 'reports', 'analytics', 'profile', 'team', 'billing', 'settings'];
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto border-b border-[rgba(11,31,51,0.08)] pb-3">
      {links.map((link) => (
        <Link key={link} to={`/workspace/${link}${query}`} className="whitespace-nowrap px-2 py-2 text-xs font-semibold capitalize text-[rgba(11,31,51,0.62)] hover:text-[#C8A96A]">{link}</Link>
      ))}
    </div>
  );
}

function moduleTitle(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase());
}

function ModuleTable({ slug, scoped }: { slug: string; scoped: Record<string, any[]> }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
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
  const filteredRows = query.trim()
    ? rows.filter((row: any) => `${row.title || row.name || row.display_name || row.module || row.plan_label || row.invoice_number || row.id} ${row.status || row.workspace_status || ''} ${row.email || row.partner_id || row.tenant_id || ''}`.toLowerCase().includes(query.trim().toLowerCase()))
    : rows;
  const createRoutes: Record<string, string> = {
    offers: '/admin/perks',
    events: '/admin/events',
    campaigns: '/admin/engagement',
    reports: '/admin/reports',
    analytics: '/admin/analytics',
    team: '/admin/settings',
    billing: '/admin/promotions',
    qr: '/admin/perks',
    map: '/map',
    profile: '/admin/partner',
    settings: '/admin/settings',
  };
  return (
    <SectionCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{moduleTitle(slug)}</p>
          <p className="mt-1 text-sm text-[rgba(11,31,51,0.62)]">{rows.length} items ready to review</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-h-9 items-center gap-2 border-b border-[rgba(11,31,51,0.12)] bg-white px-0 text-xs font-semibold">
            <Search className="h-4 w-4 text-[#C8A96A]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this list" className="w-[150px] bg-transparent py-1 text-xs outline-none" />
          </label>
          <button type="button" onClick={() => navigate(createRoutes[slug] || '/admin/partner')} className="inline-flex h-9 items-center gap-2 bg-white px-0 text-xs font-semibold"><Plus className="h-4 w-4" /> Create</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[rgba(11,31,51,0.08)] text-[11px] font-bold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.48)]">
            <tr><th className="py-3 pr-4">Record</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Owner</th><th className="py-3 pr-4">Updated</th></tr>
          </thead>
          <tbody className="divide-y divide-[rgba(11,31,51,0.08)]">
            {filteredRows.map((row: any) => (
              <tr key={row.id}>
                <td className="py-3 pr-4 font-semibold">{row.title || row.name || row.display_name || row.module || row.plan_label || row.invoice_number || row.id}</td>
                <td className="py-3 pr-4">{row.status || row.workspace_status || 'ready'}</td>
                <td className="py-3 pr-4 text-[rgba(11,31,51,0.62)]">{row.email || row.partner_id || row.tenant_id || 'workspace'}</td>
                <td className="py-3 pr-4 text-[rgba(11,31,51,0.52)]">{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : 'Not updated'}</td>
              </tr>
            ))}
            {filteredRows.length === 0 && <tr><td colSpan={4} className="py-8 text-[rgba(11,31,51,0.58)]">{rows.length === 0 ? 'Nothing here yet. Use Create to add the first item.' : 'No matching items in this list.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
