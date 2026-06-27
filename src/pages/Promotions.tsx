import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';

const initialPromotionForm = {
  code: '',
  name: '',
  description: '',
  percentage: 100,
  duration: 'firstYear',
  status: 'active',
};

const initialAccountForm = {
  partnerName: '',
  billingEmail: '',
  partnerType: 'venue',
  planKey: 'venue_growth',
  coupon: '',
};

const planOptions = [
  { key: 'property_basic', type: 'property', label: 'Basic Building', amount: 49, note: 'Map presence, QR entry, and basic reports.' },
  { key: 'property_resident_plus', type: 'property', label: 'Resident Plus', amount: 99, note: 'Resident perks, broadcasts, and annual readout.' },
  { key: 'property_pro', type: 'property', label: 'Property Pro', amount: 199, note: 'Campaigns, priority setup, and deeper reports.' },
  { key: 'venue_basic', type: 'venue', label: 'Basic', amount: 30, note: 'Map listing and one starter offer.' },
  { key: 'venue_growth', type: 'venue', label: 'Growth', amount: 79, note: 'Offers, events, notes, and readouts.' },
  { key: 'venue_pro', type: 'venue', label: 'Pro', amount: 199, note: 'Priority placement, reporting, and support.' },
  { key: 'hotel_starter', type: 'hotel', label: 'Hotel Starter', amount: 99, note: 'Guest guide, lobby QR, and local perks.' },
  { key: 'hotel_pro', type: 'hotel', label: 'Hotel Pro', amount: 199, note: 'Guest campaigns, reporting, and concierge support.' },
  { key: 'brand_access', type: 'brand', label: 'Brand Access', amount: 99, note: 'Brand profile, map presence, and reporting.' },
  { key: 'brand_campaigns', type: 'brand', label: 'Brand Campaigns', amount: 199, note: 'Campaign workspace and sponsored moments.' },
  { key: 'civic_plus', type: 'civic', label: 'Civic Plus', amount: 30, note: 'Public programs, events, surveys, and notes.' },
  { key: 'civic_pro', type: 'civic', label: 'Civic Pro', amount: 99, note: 'Campaigns, feedback, and program reporting.' },
];

export default function Promotions() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState('');
  const [promotions, setPromotions] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [promotionForm, setPromotionForm] = useState(initialPromotionForm);
  const [accountForm, setAccountForm] = useState(initialAccountForm);
  const [validationResult, setValidationResult] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
      const [promotionRows, redemptionRows, subscriptionRows, invoiceRows, integrationRows, partnerRows, tenantRows, productRows] = await Promise.all([
        fetch('/api/promotions').then((res) => res.json()).catch(() => []),
        base44.entities.PromotionRedemption.list().catch(() => []),
        fetch('/api/billing/subscriptions').then((res) => res.json()).catch(() => []),
        fetch('/api/billing/invoices').then((res) => res.json()).catch(() => []),
        fetch('/api/integrations/status').then((res) => res.json()).catch(() => []),
        base44.entities.Partner.list().catch(() => []),
        base44.entities.PlatformTenant.list().catch(() => []),
        base44.entities.ProductOffering.list().catch(() => []),
      ]);
      setPromotions(Array.isArray(promotionRows) ? promotionRows : []);
      setRedemptions(Array.isArray(redemptionRows) ? redemptionRows : []);
      setSubscriptions(Array.isArray(subscriptionRows) ? subscriptionRows : []);
      setInvoices(Array.isArray(invoiceRows) ? invoiceRows : []);
      setIntegrations(Array.isArray(integrationRows) ? integrationRows : []);
      setPartners(Array.isArray(partnerRows) ? partnerRows : []);
      setTenants(Array.isArray(tenantRows) ? tenantRows : []);
      setProducts(Array.isArray(productRows) ? productRows : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stripeIntegration = integrations.find((item) => String(item.provider || item.name || '').toLowerCase().includes('stripe'));
  const stripeConfigured = stripeIntegration?.status === 'configured' || stripeIntegration?.configuration_status === 'configured';
  const plan = planOptions.find((item) => item.key === accountForm.planKey) || planOptions[0];
  const promotionalSubscriptions = subscriptions.filter((subscription) => subscription.billing_status === 'promotional' || subscription.payment_provider === 'promotion');
  const openInvoices = invoices.filter((invoice) => !['paid', 'void', 'cancelled'].includes(String(invoice.status || '').toLowerCase()));
  const paidInvoices = invoices.filter((invoice) => String(invoice.status || '').toLowerCase() === 'paid');
  const invoicedTotal = invoices.reduce((sum, invoice) => sum + Number(invoice.total || invoice.amount || 0), 0);
  const paidTotal = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total || invoice.amount || 0), 0);

  const accounts = useMemo(() => {
    const byTenant: Record<string, any> = {};
    tenants.forEach((tenant) => {
      byTenant[tenant.id] = {
        tenant,
        partner: partners.find((partner) => partner.id === tenant.partner_id || partner.id === tenant.source_id),
        subscriptions: [],
        invoices: [],
      };
    });
    subscriptions.forEach((subscription) => {
      const key = subscription.tenant_id || subscription.partner_id || subscription.workspace_id || subscription.id;
      if (!byTenant[key]) byTenant[key] = { tenant: null, partner: null, subscriptions: [], invoices: [] };
      byTenant[key].subscriptions.push(subscription);
    });
    invoices.forEach((invoice) => {
      const key = invoice.tenant_id || invoice.partner_id || invoice.workspace_id || invoice.id;
      if (!byTenant[key]) byTenant[key] = { tenant: null, partner: null, subscriptions: [], invoices: [] };
      byTenant[key].invoices.push(invoice);
    });
    return Object.values(byTenant)
      .map((account: any) => {
        const latestSubscription = account.subscriptions[0];
        const latestInvoice = account.invoices[0];
        return {
          ...account,
          name: account.tenant?.name || account.partner?.business_name || latestSubscription?.partner_name || latestInvoice?.partner_name || latestInvoice?.tenant_id || 'Partner account',
          email: latestSubscription?.billing_email || latestInvoice?.billing_email || account.partner?.contact_email || '',
          status: latestSubscription?.status || latestInvoice?.status || account.tenant?.status || 'review',
          plan: latestSubscription?.plan_label || latestSubscription?.plan || latestInvoice?.plan_label || 'No plan yet',
          total: account.invoices.reduce((sum: number, invoice: any) => sum + Number(invoice.total || 0), 0),
        };
      })
      .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)))
      .slice(0, 12);
  }, [invoices, partners, subscriptions, tenants]);

  const summary = [
    { label: 'Accounts', value: accounts.length, detail: 'Partner accounts with billing records or workspace data.' },
    { label: 'Active plans', value: subscriptions.filter((item) => String(item.status || '').toLowerCase() === 'active').length, detail: 'Subscriptions currently marked active.' },
    { label: 'Open invoices', value: openInvoices.length, detail: 'Invoices or requests still needing follow-up.' },
    { label: 'Paid total', value: money(paidTotal), detail: `Recorded across ${paidInvoices.length} paid invoice${paidInvoices.length === 1 ? '' : 's'}.` },
    { label: 'Promotions', value: promotions.filter((item) => item.status === 'active' && item.isActive !== false).length, detail: 'Codes ready to use at checkout.' },
    { label: 'Stripe', value: stripeConfigured ? 'Ready' : 'Setup needed', detail: stripeConfigured ? 'Paid checkout can hand off to Stripe.' : 'Local billing works; add Stripe keys for live card checkout.' },
  ];

  const usageByPromotion = useMemo(() => {
    const counts: Record<string, number> = {};
    redemptions.forEach((redemption) => {
      const key = redemption.promotion_id || redemption.code;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [redemptions]);

  async function createPromotion() {
    if (!promotionForm.code.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promotionForm.code,
          name: promotionForm.name || `${promotionForm.code.toUpperCase()} Promotion`,
          description: promotionForm.description,
          status: promotionForm.status,
          discountType: 'percentage',
          percentage: Number(promotionForm.percentage || 0),
          duration: promotionForm.duration,
          applicablePlans: ['all'],
          applicablePartnerTypes: ['all'],
          isActive: true,
        }),
      });
      setPromotionForm(initialPromotionForm);
      setNotice('Code added.');
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function patchPromotion(id: string, updates: Record<string, any>) {
    await fetch(`/api/promotions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setNotice('Code updated.');
    await load();
  }

  async function duplicatePromotion(promotion: any) {
    setSaving(true);
    try {
      await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...promotion,
          id: undefined,
          code: `${promotion.code}-COPY`,
          name: `${promotion.name || promotion.code} Copy`,
          currentUses: 0,
          current_uses: 0,
        }),
      });
      setNotice('Code copied.');
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function testDude2026() {
    setTesting(true);
    try {
      const result = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'DUDE2026',
          subtotal: plan.amount,
          plan: plan.key,
          partner_type: plan.type,
        }),
      }).then((res) => res.json());
      setValidationResult(result);
    } finally {
      setTesting(false);
    }
  }

  async function createAccountRecord(kind: 'subscription' | 'invoice' | 'checkout') {
    if (!accountForm.partnerName.trim()) return;
    setSaving(true);
    const slug = slugify(accountForm.partnerName);
    const tenantId = `tenant_${slug}`;
    const workspaceId = `workspace_${slug}`;
    const basePayload = {
      tenant_id: tenantId,
      workspace_id: workspaceId,
      partner_name: accountForm.partnerName,
      billing_email: accountForm.billingEmail,
      partner_type: accountForm.partnerType,
      plan: plan.key,
      plan_label: plan.label,
      cadence: 'annual',
      amount: plan.amount,
      subtotal: plan.amount,
      total: plan.amount,
      coupon: accountForm.coupon,
      promotion_code: accountForm.coupon,
      source: 'admin_billing_module',
    };

    try {
      if (kind === 'subscription') {
        await fetch('/api/billing/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePayload,
            id: `subscription_${slug}`,
            status: 'active',
            billing_status: accountForm.coupon ? 'promotional' : 'invoice_ready',
            renewal_date: nextYearIso(),
            annual_commitment: plan.amount,
          }),
        });
        setNotice('Plan saved to the account.');
      }

      if (kind === 'invoice') {
        await fetch('/api/billing/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePayload,
            id: `invoice_${slug}_${Date.now()}`,
            status: 'invoice_requested',
            invoice_number: `DP-${slug.toUpperCase().slice(0, 12)}-${new Date().getFullYear()}`,
          }),
        });
        setNotice('Invoice request saved.');
      }

      if (kind === 'checkout') {
        const result = await fetch('/api/checkout/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_name: accountForm.partnerName,
            business_name: accountForm.partnerName,
            billing_email: accountForm.billingEmail,
            partner_type: accountForm.partnerType,
            plan: plan.key,
            coupon: accountForm.coupon,
            checkout: {
              billing_email: accountForm.billingEmail,
              business_name: accountForm.partnerName,
              coupon: accountForm.coupon,
              annual_commitment: plan.amount,
            },
            line_items: [{ name: plan.label, display_name: plan.label, amount: plan.amount, currency: 'usd', interval: 'year' }],
          }),
        }).then((res) => res.json());
        setNotice(result.checkout_url ? 'Checkout record created.' : result.message || 'Checkout saved.');
      }

      await load();
    } finally {
      setSaving(false);
    }
  }

  async function patchSubscription(subscription: any, action: 'activate' | 'renew' | 'cancel') {
    await fetch(`/api/billing/subscriptions/${subscription.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setNotice(action === 'cancel' ? 'Plan cancelled.' : action === 'renew' ? 'Plan renewed.' : 'Plan activated.');
    await load();
  }

  async function markInvoicePaid(invoice: any) {
    await fetch(`/api/billing/invoices/${invoice.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_paid' }),
    });
    setNotice('Invoice marked paid.');
    await load();
  }

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#0B1F33]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 bg-white p-5 text-[#0B1F33] sm:p-8">
      <section className="bg-white">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">Billing and accounts</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">Plans, invoices, checkout, and credits.</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[rgba(11,31,51,0.64)]">
              Manage partner plans, invoice requests, complimentary credits, Stripe readiness, and account status from one place.
            </p>
            {notice && <p className="mt-3 text-sm font-semibold text-[#0B1F33]">{notice}</p>}
          </div>
          <div className="border-y border-[rgba(11,31,51,0.06)] bg-white py-4">
            <StatusLine label="Stripe" value={stripeConfigured ? 'Ready for paid checkout' : 'Setup needed'} tone={stripeConfigured ? 'ready' : 'pending'} />
            <StatusLine label="Provider" value={stripeIntegration?.provider || 'Stripe'} />
            <StatusLine label="Product plans" value={products.length || planOptions.length} />
            <Button onClick={load} variant="outline" className="mt-3 min-h-11 w-full gap-2 text-[#0B1F33]">
              <RefreshCw className="h-4 w-4" /> Refresh billing
            </Button>
          </div>
        </div>
      </section>

      <SummaryGrid rows={summary} />

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <article className="bg-white">
          <SectionTitle eyebrow="Accounts" title="Who is on a plan" body="Open partner accounts, check plan status, and move invoices or subscriptions forward." />
          <div className="mt-4 overflow-x-auto border-y border-[rgba(11,31,51,0.06)] [scrollbar-width:thin]">
            <table className="w-full min-w-[860px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[220px]" />
                <col className="w-[150px]" />
                <col className="w-[130px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[220px]" />
              </colgroup>
              <thead className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.52)]">
                <tr>
                  <th className="py-2 pr-4">Account</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Invoices</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(11,31,51,0.06)]">
                {accounts.map((account: any) => (
                  <tr key={`${account.name}-${account.email}`} className="align-middle">
                    <td className="py-2 pr-4">
                      <p className="text-[12px] font-semibold leading-4">{account.name}</p>
                      <p className="mt-0.5 truncate text-[10px] text-[rgba(11,31,51,0.52)]">{account.email || 'No billing email yet'}</p>
                    </td>
                    <td className="py-2 pr-4 text-[11px] font-semibold">{account.plan}</td>
                    <td className="py-2 pr-4 text-[11px]">{formatStatus(account.status)}</td>
                    <td className="py-2 pr-4 text-[11px]">{account.invoices.length}</td>
                    <td className="py-2 pr-4 text-[11px] font-semibold">{money(account.total)}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {account.subscriptions[0] && (
                          <>
                            <Button onClick={() => patchSubscription(account.subscriptions[0], 'renew')} variant="outline" className="h-8 min-h-8 px-2 text-[10px] text-[#0B1F33]">Renew</Button>
                            <Button onClick={() => patchSubscription(account.subscriptions[0], 'cancel')} variant="outline" className="h-8 min-h-8 px-2 text-[10px] text-[#0B1F33]">Cancel</Button>
                          </>
                        )}
                        {account.tenant?.workspace_path && (
                          <Link to={account.tenant.workspace_path} className="inline-flex h-8 min-h-8 items-center gap-1 px-2 text-[10px] font-semibold text-[#0B1F33] hover:text-[#C8A96A]">
                            Workspace <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-sm text-[rgba(11,31,51,0.58)]">No billing accounts yet. Create one from the panel.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="border-y border-[rgba(11,31,51,0.08)] bg-white py-4">
          <SectionTitle eyebrow="Create account" title="Add plan or checkout" body="Pick the partner type, choose a plan, then save a subscription, request an invoice, or create a checkout record." />
          <div className="mt-4 grid gap-3">
            <Field label="Partner name" value={accountForm.partnerName} onChange={(value: string) => setAccountForm({ ...accountForm, partnerName: value })} placeholder="Hotel Van Zandt" />
            <Field label="Billing email" value={accountForm.billingEmail} onChange={(value: string) => setAccountForm({ ...accountForm, billingEmail: value })} placeholder="billing@example.com" />
            <label className="grid gap-2 text-sm font-semibold">
              Partner type
              <select className="min-h-11 border border-[rgba(11,31,51,0.12)] bg-white px-3 text-sm font-normal outline-none" value={accountForm.partnerType} onChange={(event) => setAccountForm({ ...accountForm, partnerType: event.target.value, planKey: planOptions.find((item) => item.type === event.target.value)?.key || accountForm.planKey })}>
                {['property', 'venue', 'hotel', 'brand', 'civic'].map((type) => <option key={type} value={type}>{formatStatus(type)}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Plan
              <select className="min-h-11 border border-[rgba(11,31,51,0.12)] bg-white px-3 text-sm font-normal outline-none" value={accountForm.planKey} onChange={(event) => setAccountForm({ ...accountForm, planKey: event.target.value })}>
                {planOptions.filter((item) => item.type === accountForm.partnerType).map((option) => <option key={option.key} value={option.key}>{option.label} · {money(option.amount)}/yr</option>)}
              </select>
            </label>
            <Field label="Credit code" value={accountForm.coupon} onChange={(value: string) => setAccountForm({ ...accountForm, coupon: value.toUpperCase() })} placeholder="DUDE2026" />
            <div className="border-y border-[rgba(11,31,51,0.06)] py-3">
              <StatusLine label="Selected plan" value={`${plan.label} · ${money(plan.amount)}/yr`} />
              <p className="mt-2 text-xs leading-5 text-[rgba(11,31,51,0.58)]">{plan.note}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
              <Button onClick={() => createAccountRecord('subscription')} disabled={saving || !accountForm.partnerName.trim()} className="min-h-10 gap-2 bg-[#0B1F33] text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save plan
              </Button>
              <Button onClick={() => createAccountRecord('invoice')} disabled={saving || !accountForm.partnerName.trim()} variant="outline" className="min-h-10 gap-2 text-[#0B1F33]">
                <FileText className="h-4 w-4" /> Request invoice
              </Button>
              <Button onClick={() => createAccountRecord('checkout')} disabled={saving || !accountForm.partnerName.trim()} variant="outline" className="min-h-10 gap-2 text-[#0B1F33]">
                <CreditCard className="h-4 w-4" /> Create checkout
              </Button>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <article className="bg-white">
          <SectionTitle eyebrow="Invoices" title="Requests, payments, and credits" body="Mark invoices paid, review open requests, and keep billing follow-up out of the workspace copy." />
          <div className="mt-4 overflow-x-auto border-y border-[rgba(11,31,51,0.06)] [scrollbar-width:thin]">
            <table className="w-full min-w-[780px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[220px]" />
                <col className="w-[130px]" />
                <col className="w-[130px]" />
                <col className="w-[130px]" />
                <col className="w-[170px]" />
              </colgroup>
              <thead className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.52)]">
                <tr>
                  <th className="py-2 pr-4">Invoice</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Credit</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(11,31,51,0.06)]">
                {invoices.slice(0, 10).map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="py-2 pr-4">
                      <p className="text-[12px] font-semibold">{invoice.invoice_number || invoice.id}</p>
                      <p className="mt-0.5 truncate text-[10px] text-[rgba(11,31,51,0.52)]">{invoice.partner_name || invoice.billing_email || invoice.tenant_id}</p>
                    </td>
                    <td className="py-2 pr-4 text-[11px]">{formatStatus(invoice.status || invoice.billing_status)}</td>
                    <td className="py-2 pr-4 text-[11px] font-semibold">{money(invoice.total || invoice.amount || 0)}</td>
                    <td className="py-2 pr-4 text-[11px]">{invoice.coupon || invoice.promotion_code || '-'}</td>
                    <td className="py-2">
                      <Button onClick={() => markInvoicePaid(invoice)} disabled={String(invoice.status).toLowerCase() === 'paid'} variant="outline" className="h-8 min-h-8 px-2 text-[10px] text-[#0B1F33]">Mark paid</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="bg-white">
          <SectionTitle eyebrow="Promotion codes" title="Credits for checkout" body="Create codes, test eligibility, pause them, and see how often each one has been used." />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={testDude2026} disabled={testing} className="min-h-9 gap-2 bg-white text-[#0B1F33] border border-[rgba(11,31,51,0.14)]">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Test DUDE2026
            </Button>
          </div>
          {validationResult && (
            <p className="mt-3 text-xs leading-5 text-[rgba(11,31,51,0.62)]">
              {validationResult.valid ? 'Code works.' : 'Code did not apply.'} Before {money(validationResult.subtotal || 0)} · Saved {money(validationResult.discount || 0)} · Due {money(validationResult.total || 0)}
            </p>
          )}
          <div className="mt-4 grid gap-2">
            {promotions.slice(0, 6).map((promotion) => (
              <div key={promotion.id} className="grid gap-2 border-t border-[rgba(11,31,51,0.06)] py-2">
                <div>
                  <p className="text-[12px] font-semibold">{promotion.code}</p>
                  <p className="text-[10.5px] leading-4 text-[rgba(11,31,51,0.56)]">{promotion.name || 'Promotion'} · {usageByPromotion[promotion.id] || usageByPromotion[promotion.code] || promotion.currentUses || 0} uses</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button onClick={() => patchPromotion(promotion.id, { status: promotion.status === 'active' ? 'disabled' : 'active', isActive: promotion.status !== 'active' })} variant="outline" className="h-8 min-h-8 px-2 text-[10px] text-[#0B1F33]">
                    {promotion.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button onClick={() => duplicatePromotion(promotion)} variant="outline" className="h-8 min-h-8 gap-1 px-2 text-[10px] text-[#0B1F33]">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                  <Button onClick={() => patchPromotion(promotion.id, { status: 'expired', expiresAt: new Date().toISOString(), isActive: false })} variant="outline" className="h-8 min-h-8 gap-1 px-2 text-[10px] text-[#0B1F33]">
                    <X className="h-3.5 w-3.5" /> Expire
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-[rgba(11,31,51,0.06)] pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Add a code</p>
            <div className="mt-3 grid gap-3">
              <Field label="Code" value={promotionForm.code} onChange={(value: string) => setPromotionForm({ ...promotionForm, code: value })} placeholder="FOUNDINGPARTNER" />
              <Field label="Name" value={promotionForm.name} onChange={(value: string) => setPromotionForm({ ...promotionForm, name: value })} placeholder="Founding Partner Promotion" />
              <Field label="Description" value={promotionForm.description} onChange={(value: string) => setPromotionForm({ ...promotionForm, description: value })} placeholder="Who this code is for" />
              <Field label="Percentage" value={String(promotionForm.percentage)} onChange={(value: string) => setPromotionForm({ ...promotionForm, percentage: Number(value || 0) })} placeholder="100" />
              <Button onClick={createPromotion} disabled={!promotionForm.code.trim() || saving} className="min-h-10 gap-2 bg-[#0B1F33] text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add code
              </Button>
            </div>
          </div>
        </article>
      </section>

      <section className="bg-white">
        <SectionTitle eyebrow="Global wiring" title="Where billing now connects" body="This module uses the same records as partner signup, workspace plans, promotions, invoices, subscriptions, audit logs, analytics, and Stripe checkout readiness." />
        <div className="mt-4 grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Partner signup', '/partners/pricing'],
            ['Workspace plans', '/admin/workspaces/inkind#billing'],
            ['Reports', '/admin/reports'],
            ['Settings', '/admin/settings'],
          ].map(([label, to]) => (
            <Link key={label} to={to} className="grid grid-cols-[1fr_auto] items-center border-t border-[rgba(11,31,51,0.06)] py-2 text-[12px] font-semibold hover:text-[#C8A96A]">
              {label} <ArrowRight className="h-3.5 w-3.5 text-[#C8A96A]" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{body}</p>
    </div>
  );
}

function SummaryGrid({ rows }: { rows: Array<{ label: string; value: React.ReactNode; detail: string }> }) {
  return (
    <section className="dp-summary-matrix">
      <div className="dp-summary-matrix__grid">
        {rows.map((row) => (
          <div key={row.label} className="dp-summary-matrix__item">
            <p className="dp-summary-matrix__label">{row.label}</p>
            <strong className="dp-summary-matrix__value">{row.value}</strong>
            <p className="dp-summary-matrix__detail">{row.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusLine({ label, value, tone }: any) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[rgba(11,31,51,0.08)] py-2 first:pt-0 last:border-0">
      <span className="text-sm text-[rgba(11,31,51,0.62)]">{label}</span>
      <strong className={`max-w-[220px] text-right text-sm font-semibold ${tone === 'ready' ? 'text-emerald-700' : tone === 'pending' ? 'text-[#8A6A1F]' : 'text-[#0B1F33]'}`}>
        {formatStatus(value)}
      </strong>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: any) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-10 border border-[rgba(11,31,51,0.12)] px-3 text-sm font-normal outline-none"
      />
    </label>
  );
}

function formatStatus(value: any) {
  const text = String(value || 'Unknown').replace(/_/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'partner';
}

function nextYearIso() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString();
}

function money(value: number) {
  return `$${Number(value || 0).toLocaleString()}`;
}
