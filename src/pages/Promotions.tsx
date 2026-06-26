import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/Button';
import {
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

const initialForm = {
  code: '',
  name: '',
  description: '',
  percentage: 100,
  duration: 'firstYear',
  status: 'active',
};

export default function Promotions() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [form, setForm] = useState(initialForm);
  const [validationResult, setValidationResult] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
      const [promotionRows, redemptionRows, subscriptionRows, invoiceRows, integrationRows] = await Promise.all([
        fetch('/api/promotions').then((res) => res.json()).catch(() => []),
        base44.entities.PromotionRedemption.list().catch(() => []),
        base44.entities.PartnerSubscription.list().catch(() => []),
        base44.entities.PartnerInvoice.list().catch(() => []),
        fetch('/api/integrations/status').then((res) => res.json()).catch(() => []),
      ]);
      setPromotions(Array.isArray(promotionRows) ? promotionRows : []);
      setRedemptions(Array.isArray(redemptionRows) ? redemptionRows : []);
      setSubscriptions(Array.isArray(subscriptionRows) ? subscriptionRows : []);
      setInvoices(Array.isArray(invoiceRows) ? invoiceRows : []);
      setIntegrations(Array.isArray(integrationRows) ? integrationRows : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const promotionalSubscriptions = subscriptions.filter((subscription) => subscription.billing_status === 'promotional' || subscription.payment_provider === 'promotion');
  const revenueImpact = invoices.reduce((sum, invoice) => sum + Number(invoice.discount || 0), 0);
  const stripeIntegration = integrations.find((item) => String(item.provider || item.name || '').toLowerCase().includes('stripe'));
  const stripeConfigured = stripeIntegration?.status === 'configured' || stripeIntegration?.configuration_status === 'configured';
  const promotionSummary = [
    { label: 'Live codes', value: promotions.filter((item) => item.status === 'active' && item.isActive !== false).length, detail: 'Ready to use at checkout.' },
    { label: 'Uses', value: redemptions.length, detail: 'Times a code has been used.' },
    { label: 'Free-year accounts', value: promotionalSubscriptions.length, detail: 'Partners opened without a payment today.' },
    { label: 'Discount value', value: `$${revenueImpact.toLocaleString()}`, detail: 'Value given through promotions.' },
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
    if (!form.code.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          name: form.name || `${form.code.toUpperCase()} Promotion`,
          description: form.description,
          status: form.status,
          discountType: 'percentage',
          percentage: Number(form.percentage || 0),
          duration: form.duration,
          applicablePlans: ['all'],
          applicablePartnerTypes: ['all'],
          isActive: true,
        }),
      });
      setForm(initialForm);
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
          subtotal: 149,
          plan: 'property-core',
          partner_type: 'property',
        }),
      }).then((res) => res.json());
      setValidationResult(result);
    } finally {
      setTesting(false);
    }
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
      <section className="border border-[rgba(11,31,51,0.08)] bg-white p-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">Promotions & billing</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">Promotion codes.</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[rgba(11,31,51,0.64)]">
              Create partner codes, check Stripe, and see what has been used.
            </p>
          </div>
          <div className="border-y border-[rgba(11,31,51,0.06)] bg-white py-4">
            <StatusLine label="Stripe" value={stripeConfigured ? 'Ready for paid checkout' : 'Setup needed'} tone={stripeConfigured ? 'ready' : 'pending'} />
            <StatusLine label="Provider" value={stripeIntegration?.provider || 'Stripe'} />
            <StatusLine label="Checkout" value={stripeConfigured ? 'Paid checkout is ready' : 'Free codes work now. Paid checkout needs Stripe keys.'} />
            {!stripeConfigured && (
              <p className="mt-3 text-xs leading-5 text-[rgba(11,31,51,0.62)]">
                Add the Stripe secret key and webhook secret when you are ready to take paid plans. Free first-year codes still open the partner workspace.
              </p>
            )}
            <Button onClick={load} variant="outline" className="mt-3 min-h-11 w-full gap-2 text-[#0B1F33]">
              <RefreshCw className="h-4 w-4" /> Check Stripe
            </Button>
          </div>
        </div>
      </section>

      <SummaryGrid rows={promotionSummary} />

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <article className="bg-white">
          <details open className="dp-admin-collapsible">
            <summary>
              <span>
                Codes
                <span className="dp-admin-collapsible__meta">Create, test, pause, copy, and review each promotion.</span>
              </span>
            </summary>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button onClick={testDude2026} disabled={testing} className="min-h-11 gap-2 bg-white text-[#0B1F33] border border-[rgba(11,31,51,0.14)]">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Test code
            </Button>
          </div>

          <div className="overflow-x-auto border-y border-[rgba(11,31,51,0.06)]">
            <table className="w-full min-w-[780px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[230px]" />
                <col className="w-[110px]" />
                <col className="w-[130px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[260px]" />
              </colgroup>
              <thead className="border-b border-[rgba(11,31,51,0.08)] text-[11px] font-bold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.52)]">
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Duration</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(11,31,51,0.08)]">
                {promotions.map((promotion) => (
                  <tr key={promotion.id} className="align-middle">
                    <td>
                      <p className="text-sm font-semibold leading-5 text-[#0B1F33]">{promotion.code}</p>
                      <p className="mt-0.5 text-xs leading-4 text-[rgba(11,31,51,0.56)]">{promotion.name || 'Promotion'}</p>
                    </td>
                    <td className="font-semibold text-[#0B1F33]">{promotion.discountType === 'fixedAmount' ? `$${promotion.fixedAmount || 0}` : `${promotion.percentage || 0}%`}</td>
                    <td className="capitalize text-[rgba(11,31,51,0.68)]">{formatStatus(String(promotion.duration || 'oneTime').replace(/([A-Z])/g, ' $1'))}</td>
                    <td className="text-[rgba(11,31,51,0.68)]">{usageByPromotion[promotion.id] || usageByPromotion[promotion.code] || promotion.currentUses || 0}{promotion.maxUses ? ` / ${promotion.maxUses}` : ' uses'}</td>
                    <td>
                      <span className="inline-flex min-h-7 items-center border border-[rgba(11,31,51,0.1)] px-2 text-[11px] font-semibold capitalize text-[#0B1F33]">{formatStatus(promotion.status || 'active')}</span>
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button onClick={() => patchPromotion(promotion.id, { status: promotion.status === 'active' ? 'disabled' : 'active', isActive: promotion.status !== 'active' })} variant="outline" className="h-9 min-h-9 px-2.5 text-[11px] text-[#0B1F33]">
                          {promotion.status === 'active' ? 'Disable' : 'Enable'}
                        </Button>
                        <Button onClick={() => patchPromotion(promotion.id, { status: 'expired', expiresAt: new Date().toISOString(), isActive: false })} variant="outline" className="h-9 min-h-9 px-2.5 text-[11px] text-[#0B1F33]">
                          Expire
                        </Button>
                        <Button onClick={() => duplicatePromotion(promotion)} variant="outline" className="h-9 min-h-9 gap-1.5 px-2.5 text-[11px] text-[#0B1F33]">
                          <Copy className="h-4 w-4" /> Copy
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </details>

          {validationResult && (
            <div className="mt-4 border border-[rgba(11,31,51,0.08)] bg-white p-4">
              <p className="text-sm font-semibold">{validationResult.valid ? 'Promotion Applied' : 'Promotion Invalid'}</p>
              <p className="mt-1 text-sm text-[rgba(11,31,51,0.62)]">
                {validationResult.message || validationResult.reason || 'Code checked.'} Before ${validationResult.subtotal || 0} · Saved ${validationResult.discount || 0} · Today ${validationResult.total || 0}
              </p>
            </div>
          )}
        </article>

        <article className="border border-[rgba(11,31,51,0.08)] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">Create promotion</p>
          <h2 className="mt-1 text-xl font-semibold">Add a code</h2>
          <div className="mt-5 grid gap-3">
            <Field label="Code" value={form.code} onChange={(value: string) => setForm({ ...form, code: value })} placeholder="FOUNDINGPARTNER" />
            <Field label="Name" value={form.name} onChange={(value: string) => setForm({ ...form, name: value })} placeholder="Founding Partner Promotion" />
            <Field label="Description" value={form.description} onChange={(value: string) => setForm({ ...form, description: value })} placeholder="Who this code is for" />
            <label className="grid gap-2 text-sm font-semibold">
              Percentage
              <input
                type="number"
                min="0"
                max="100"
                value={form.percentage}
                onChange={(event) => setForm({ ...form, percentage: Number(event.target.value) })}
                className="min-h-11 border border-[rgba(11,31,51,0.12)] px-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Duration
              <select
                value={form.duration}
                onChange={(event) => setForm({ ...form, duration: event.target.value })}
                className="min-h-11 border border-[rgba(11,31,51,0.12)] bg-white px-3 text-sm font-normal outline-none"
              >
                <option value="oneTime">One time</option>
                <option value="firstYear">First year</option>
                <option value="forever">Forever</option>
              </select>
            </label>
            <Button onClick={createPromotion} disabled={!form.code.trim() || saving} className="min-h-11 gap-2 bg-[#0B1F33] text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add code
            </Button>
          </div>
        </article>
      </section>
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

function formatStatus(value: any) {
  const text = String(value || 'Unknown').replace(/_/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function Field({ label, value, onChange, placeholder }: any) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 border border-[rgba(11,31,51,0.12)] px-3 text-sm font-normal outline-none"
      />
    </label>
  );
}
