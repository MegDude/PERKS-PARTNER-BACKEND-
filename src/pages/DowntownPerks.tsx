import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Archive,
  ArrowDownToLine,
  BarChart3,
  Edit2,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Ticket,
  Trash2,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const categories = ['Dining', 'Coffee', 'Nightlife', 'Fitness', 'Retail', 'Services', 'Hotel', 'Residential', 'Events', 'Seasonal'];
const statuses = ['draft', 'scheduled', 'active', 'paused', 'expired', 'archived'];
const redemptionTypes = ['QR scan', 'Manual code', 'Partner verification', 'Directions CTA', 'Appointment request'];

const emptyForm = {
  title: '',
  description: '',
  partner_id: '',
  category: 'Dining',
  district: '',
  image_url: '',
  gallery_images: '',
  video_url: '',
  thumbnail_url: '',
  start_date: '',
  end_date: '',
  terms: '',
  redemption_type: 'QR scan',
  cta_label: 'Redeem perk',
  status: 'draft',
  active: false,
  campaign_id: '',
  event_id: '',
  property_id: '',
  hotel_id: '',
  venue_id: '',
  brand_id: '',
};

function nowIso() {
  return new Date().toISOString();
}

function downloadFile(fileName: string, contents: string, type = 'text/csv') {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: any) {
  const raw = value == null ? '' : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

export default function DowntownPerks() {
  const [perks, setPerks] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingPerk, setEditingPerk] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const canManage = ['super_admin', 'platform_admin', 'admin', 'editor'].includes(user?.role || 'admin');

  async function writeAudit(action: string, resourceId: string, before: any, after: any) {
    await base44.entities.TenantAuditLog.create({
      action,
      resource: 'PerkLocation',
      resource_id: resourceId,
      actor_id: user?.id || 'user_admin',
      actor_email: user?.email || 'admin@downtownperks.local',
      tenant_id: after?.tenant_id || before?.tenant_id || '',
      organization_id: after?.organization_id || before?.organization_id || '',
      before,
      after,
      created_at: nowIso(),
    }).catch(() => null);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [currentUser, perkRows, partnerRows, campaignRows, eventRows, redemptionRows, auditRows] = await Promise.all([
        base44.auth.me().catch(() => ({ id: 'user_admin', role: 'admin', email: 'admin@downtownperks.local' })),
        base44.entities.PerkLocation.list().catch(() => []),
        base44.entities.Partner.list().catch(() => []),
        base44.entities.Campaign.list().catch(() => []),
        base44.entities.Event.list().catch(() => []),
        base44.entities.PerkRedemption.list().catch(() => []),
        base44.entities.TenantAuditLog.list().catch(() => []),
      ]);
      setUser(currentUser);
      setPerks(perkRows.filter((perk: any) => !perk.deleted_at));
      setPartners(partnerRows);
      setCampaigns(campaignRows);
      setEvents(eventRows);
      setRedemptions(redemptionRows);
      setAuditLogs(auditRows.filter((log: any) => log.resource === 'PerkLocation').slice(-8).reverse());
    } catch (error) {
      console.error('Failed to load perk operations:', error);
      toast.error('Perks could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const partnerById = useMemo(() => new Map(partners.map((partner) => [partner.id, partner])), [partners]);

  const enrichedPerks = useMemo(() => {
    return perks.map((perk) => {
      const partner = partnerById.get(perk.partner_id);
      const perkRedemptions = redemptions.filter((redemption) => redemption.perk_id === perk.id || redemption.perkId === perk.id);
      const views = Number(perk.views || perk.view_count || 0);
      const saves = Number(perk.saves || perk.save_count || 0);
      const directions = Number(perk.directions || perk.direction_count || 0);
      const shares = Number(perk.shares || perk.share_count || 0);
      const scans = Number(perk.scans || perk.scan_count || perkRedemptions.length);
      const redemptionCount = Number(perk.redemption_count || perkRedemptions.length);
      const conversion = views > 0 ? Math.round((redemptionCount / views) * 1000) / 10 : 0;
      return {
        ...perk,
        partnerName: partner?.business_name || partner?.name || perk.partner_name || perk.name || 'Unassigned partner',
        views,
        saves,
        directions,
        shares,
        scans,
        redemptionCount,
        conversion,
      };
    });
  }, [perks, redemptions, partnerById]);

  const filteredPerks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return enrichedPerks.filter((perk) => {
      const matchesQuery = !needle || [perk.title, perk.description, perk.partnerName, perk.category, perk.district].join(' ').toLowerCase().includes(needle);
      const matchesStatus = statusFilter === 'all' || (perk.status || (perk.active ? 'active' : 'draft')) === statusFilter;
      const matchesCategory = categoryFilter === 'all' || perk.category === categoryFilter;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [enrichedPerks, query, statusFilter, categoryFilter]);

  const metrics = useMemo(() => {
    const active = enrichedPerks.filter((perk) => (perk.status || '').toLowerCase() === 'active' || perk.active).length;
    return {
      total: enrichedPerks.length,
      active,
      views: enrichedPerks.reduce((sum, perk) => sum + perk.views, 0),
      saves: enrichedPerks.reduce((sum, perk) => sum + perk.saves, 0),
      directions: enrichedPerks.reduce((sum, perk) => sum + perk.directions, 0),
      scans: enrichedPerks.reduce((sum, perk) => sum + perk.scans, 0),
      redemptions: enrichedPerks.reduce((sum, perk) => sum + perk.redemptionCount, 0),
    };
  }, [enrichedPerks]);

  const openCreate = () => {
    setFormOpen(true);
    setEditingPerk(null);
    setForm({ ...emptyForm });
  };

  const openEdit = (perk: any) => {
    setFormOpen(true);
    setEditingPerk(perk);
    setForm({
      ...emptyForm,
      ...perk,
      gallery_images: Array.isArray(perk.gallery_images) ? perk.gallery_images.join('\n') : perk.gallery_images || '',
      cta_label: perk.cta_label || perk.cta || 'Redeem perk',
      status: perk.status || (perk.active ? 'active' : 'draft'),
    });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingPerk(null);
    setForm({ ...emptyForm });
  };

  const updateField = (field: string, value: any) => setForm((current: any) => ({ ...current, [field]: value }));

  async function savePerk(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage) {
      toast.error('You do not have permission to manage perks.');
      return;
    }
    if (!form.title.trim() || !form.description.trim() || !form.partner_id || !form.start_date || !form.end_date || !form.terms.trim()) {
      toast.error('Complete the title, description, partner, dates, and terms before saving.');
      return;
    }

    setSaving(true);
    const partner = partnerById.get(form.partner_id);
    const payload = {
      ...form,
      partner_name: partner?.business_name || partner?.name || '',
      name: partner?.business_name || partner?.name || form.title,
      active: form.status === 'active',
      is_active: form.status === 'active',
      cta: form.cta_label,
      gallery_images: String(form.gallery_images || '').split('\n').map((item) => item.trim()).filter(Boolean),
      updated_at: nowIso(),
    };

    try {
      if (editingPerk?.id) {
        const updated = await base44.entities.PerkLocation.update(editingPerk.id, payload);
        await writeAudit('perk_updated', editingPerk.id, editingPerk, updated);
        toast.success('Perk updated.');
      } else {
        const created = await base44.entities.PerkLocation.create({ ...payload, created_at: nowIso(), views: 0, saves: 0, directions: 0, shares: 0, scans: 0, redemption_count: 0 });
        await writeAudit('perk_created', created.id, null, created);
        toast.success('Perk created.');
      }
      closeForm();
      await loadData();
    } catch (error) {
      console.error('Perk save failed:', error);
      toast.error('Perk could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function setPerkStatus(perk: any, status: string) {
    if (!canManage) return toast.error('You do not have permission to update perk status.');
    const before = perk;
    const after = await base44.entities.PerkLocation.update(perk.id, { status, active: status === 'active', is_active: status === 'active', updated_at: nowIso() });
    await writeAudit(`perk_status_${status}`, perk.id, before, after);
    toast.success(`Perk moved to ${status}.`);
    await loadData();
  }

  async function archivePerk(perk: any) {
    if (!canManage) return toast.error('You do not have permission to archive perks.');
    if (!window.confirm(`Archive "${perk.title || perk.partnerName}"? This is a soft delete and can be restored from the database.`)) return;
    const after = await base44.entities.PerkLocation.update(perk.id, { status: 'archived', active: false, is_active: false, deleted_at: nowIso(), updated_at: nowIso() });
    await writeAudit('perk_archived', perk.id, perk, after);
    toast.success('Perk archived.');
    await loadData();
  }

  async function syncTenantProvisioning() {
    setSyncing(true);
    try {
      const response = await fetch('/api/tenant-provisioning/sync', { method: 'POST' });
      if (!response.ok) throw new Error('Tenant sync failed');
      const result = await response.json();
      toast.success(`Partner spaces refreshed: ${result.after.tenants} partners and ${result.after.workspaces} spaces are ready.`);
      await loadData();
    } catch {
      toast.error('Partner spaces could not be refreshed. Please try again.');
    } finally {
      setSyncing(false);
    }
  }

  function exportReport() {
    const header = ['Perk', 'Partner', 'Category', 'District', 'Status', 'Views', 'Saves', 'Directions', 'Shares', 'Scans', 'Redemptions', 'Conversion'];
    const rows = filteredPerks.map((perk) => [
      perk.title,
      perk.partnerName,
      perk.category,
      perk.district,
      perk.status || 'draft',
      perk.views,
      perk.saves,
      perk.directions,
      perk.shares,
      perk.scans,
      perk.redemptionCount,
      `${perk.conversion}%`,
    ]);
    downloadFile('downtown-perks-perk-performance.csv', [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n'));
    toast.success('Perk report downloaded.');
  }

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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Perks</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">Small reasons to go somewhere nearby</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[rgba(11,31,51,0.66)]">
              Create offers residents can understand, save, scan, and use. Keep the partner, dates, results, and next move close at hand.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportReport} className="gap-2 border-[rgba(11,31,51,0.12)] bg-white text-[#0B1F33]">
              <ArrowDownToLine className="h-4 w-4" /> Export
            </Button>
            <Button variant="outline" onClick={syncTenantProvisioning} disabled={syncing} className="gap-2 border-[rgba(11,31,51,0.12)] bg-white text-[#0B1F33]">
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Refresh partners
            </Button>
            <Button onClick={openCreate} className="gap-1.5 text-[#11182B]" disabled={!canManage}>
              <Plus className="h-3.5 w-3.5" /> Add perk
            </Button>
          </div>
        </div>
      </section>

      <section className="dp-summary-matrix">
        <div className="dp-summary-matrix__grid">
        <Metric label="Total perks" value={metrics.total} />
        <Metric label="Active" value={metrics.active} />
        <Metric label="Views" value={metrics.views} />
        <Metric label="Saves" value={metrics.saves} />
        <Metric label="Directions" value={metrics.directions} />
        <Metric label="Scans" value={metrics.scans} />
        <Metric label="Redemptions" value={metrics.redemptions} />
        </div>
      </section>

      <section className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <label className="flex min-h-11 items-center gap-2 border-b border-[rgba(11,31,51,0.12)] px-1">
            <Search className="h-4 w-4 text-[#C8A96A]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search perks, partners, districts, categories" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="dp-admin-select">
            <option value="all">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="dp-admin-select">
            <option value="all">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
      </section>

      <details open className="dp-admin-collapsible bg-white">
        <summary>
          <span>
            Offers, partners, performance, and links
            <span className="dp-admin-collapsible__meta">Showing {filteredPerks.length} perks.</span>
          </span>
        </summary>

        <div className="overflow-x-auto [scrollbar-width:thin]" aria-label="Perk inventory table. Scroll horizontally to view all columns.">
        <table className="w-full min-w-[1180px] table-fixed border-collapse text-left text-sm lg:min-w-[1340px]">
          <colgroup>
            <col className="w-[250px] lg:w-[300px]" />
            <col className="w-[180px]" />
            <col className="w-[160px]" />
            <col className="w-[120px]" />
            <col className="w-[170px]" />
            <col className="w-[270px]" />
            <col className="w-[230px]" />
            <col className="w-[150px]" />
          </colgroup>
          <thead className="border-b border-[rgba(11,31,51,0.08)] bg-[#FBFCFD] text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">
            <tr>
              <th className="bg-[#FBFCFD] px-4 py-3 lg:sticky lg:left-0 lg:z-10 lg:px-5">Perk</th>
              <th className="border-l border-[rgba(11,31,51,0.06)] px-5 py-3">Partner</th>
              <th className="border-l border-[rgba(11,31,51,0.06)] px-5 py-3">Category</th>
              <th className="border-l border-[rgba(11,31,51,0.06)] px-5 py-3">Status</th>
              <th className="border-l border-[rgba(11,31,51,0.06)] px-5 py-3">Dates</th>
              <th className="border-l border-[rgba(11,31,51,0.06)] px-5 py-3">Performance</th>
              <th className="border-l border-[rgba(11,31,51,0.06)] px-5 py-3">Relationships</th>
              <th className="border-l border-[rgba(11,31,51,0.06)] px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(11,31,51,0.08)]">
            {filteredPerks.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[rgba(11,31,51,0.58)]">
                  Nothing matches this view. Add a perk, adjust the filters, or refresh partners.
                </td>
              </tr>
            ) : filteredPerks.map((perk) => {
              const status = perk.status || (perk.active ? 'active' : 'draft');
              const entityLabel = perk.property_id || perk.hotel_id || perk.venue_id || perk.brand_id || '';
              return (
              <tr key={perk.id} className="align-top transition-colors hover:bg-[#F7F8FB]/70">
                <td className="bg-white px-4 py-5 lg:sticky lg:left-0 lg:z-10 lg:px-5 lg:shadow-[8px_0_18px_rgba(11,31,51,0.035)]">
                  <p className="text-[14px] font-semibold leading-5 text-[#0B1F33]">{perk.title || 'Untitled perk'}</p>
                  <p className="mt-2 max-w-[210px] text-[12px] leading-5 text-[rgba(11,31,51,0.62)] lg:max-w-[255px]">{perk.description || 'No description added.'}</p>
                  <p className="mt-3 inline-flex border border-[rgba(11,31,51,0.08)] px-2 py-1 text-[11px] font-semibold text-[rgba(11,31,51,0.58)]">CTA: {perk.cta_label || perk.cta || 'Redeem perk'}</p>
                </td>
                <td className="border-l border-[rgba(11,31,51,0.06)] px-5 py-5">
                  <p className="text-[13px] font-semibold leading-5 text-[#0B1F33]">{perk.partnerName}</p>
                </td>
                <td className="border-l border-[rgba(11,31,51,0.06)] px-5 py-5">
                  <p className="text-[13px] font-semibold leading-5 text-[#0B1F33]">{perk.category || 'Uncategorized'}</p>
                  <p className="mt-2 text-[11px] font-semibold uppercase text-[rgba(11,31,51,0.46)]">{formatDistrict(perk.district)}</p>
                </td>
                <td className="border-l border-[rgba(11,31,51,0.06)] px-5 py-5">
                  <StatusPill status={status} />
                </td>
                <td className="border-l border-[rgba(11,31,51,0.06)] px-5 py-5">
                  <div className="grid gap-2">
                    <DateLine label="Start" value={perk.start_date || 'Not set'} />
                    <DateLine label="End" value={perk.end_date || 'Not set'} />
                  </div>
                </td>
                <td className="border-l border-[rgba(11,31,51,0.06)] px-5 py-5">
                  <div className="grid grid-cols-2 gap-px overflow-hidden border border-[rgba(11,31,51,0.08)] bg-[rgba(11,31,51,0.08)] text-[11px] leading-4 text-[rgba(11,31,51,0.58)]">
                    <MetricPair label="Views" value={perk.views} />
                    <MetricPair label="Saves" value={perk.saves} />
                    <MetricPair label="Directions" value={perk.directions} />
                    <MetricPair label="Scans" value={perk.scans} />
                  </div>
                  <p className="mt-3 border-t border-[rgba(11,31,51,0.08)] pt-3 text-[12px] font-semibold leading-5 text-[#0B1F33]">
                    {perk.redemptionCount} used · {perk.conversion}% follow-through
                  </p>
                </td>
                <td className="border-l border-[rgba(11,31,51,0.06)] px-5 py-5 text-[12px] leading-5 text-[rgba(11,31,51,0.58)]">
                  <RelationshipLine label="Campaign" value={campaigns.find((campaign) => campaign.id === perk.campaign_id)?.name || perk.campaign_id || 'None'} />
                  <RelationshipLine label="Event" value={events.find((event) => event.id === perk.event_id)?.title || perk.event_id || 'None'} />
                  <RelationshipLine label="Entity" value={entityLabel || 'Not linked'} />
                </td>
                <td className="border-l border-[rgba(11,31,51,0.06)] px-5 py-5">
                  <div className="grid grid-cols-2 gap-2">
                    <Button aria-label={`Edit ${perk.title || 'perk'}`} title="Edit perk" variant="outline" size="sm" onClick={() => openEdit(perk)} disabled={!canManage} className="h-9 w-9 border-[rgba(11,31,51,0.12)] bg-white p-0 text-[#0B1F33]"><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button aria-label={`Activate ${perk.title || 'perk'}`} title="Activate perk" variant="outline" size="sm" onClick={() => setPerkStatus(perk, 'active')} disabled={!canManage || status === 'active'} className="h-9 w-9 border-[rgba(11,31,51,0.12)] bg-white p-0 text-[#0B1F33]"><Ticket className="h-3.5 w-3.5" /></Button>
                    <Button aria-label={`Pause ${perk.title || 'perk'}`} title="Pause perk" variant="outline" size="sm" onClick={() => setPerkStatus(perk, 'paused')} disabled={!canManage || status === 'paused'} className="h-9 w-9 border-[rgba(11,31,51,0.12)] bg-white p-0 text-[#0B1F33]"><Archive className="h-3.5 w-3.5" /></Button>
                    <Button aria-label={`Archive ${perk.title || 'perk'}`} title="Archive perk" variant="outline" size="sm" onClick={() => archivePerk(perk)} disabled={!canManage} className="h-9 w-9 border-[rgba(11,31,51,0.12)] bg-white p-0 text-rose-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
        </div>
      </details>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel title="Perk analytics" eyebrow="Reporting relationships">
          <div className="grid gap-3">
            <InsightLine label="Top redeemed" value={topBy(enrichedPerks, 'redemptionCount')} />
            <InsightLine label="Most saved" value={topBy(enrichedPerks, 'saves')} />
            <InsightLine label="Best conversion" value={topBy(enrichedPerks, 'conversion', '%')} />
            <InsightLine label="Highest district engagement" value={topDistrict(enrichedPerks)} />
          </div>
        </Panel>

        <Panel title="Recent audit log" eyebrow="Audit trail">
          <div className="grid gap-3">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-[rgba(11,31,51,0.58)]">No perk updates yet.</p>
            ) : auditLogs.map((log) => (
              <div key={log.id} className="border-t border-[rgba(11,31,51,0.08)] pt-3">
                <p className="text-sm font-semibold">{String(log.action || '').replace(/_/g, ' ')}</p>
                <p className="mt-1 text-xs text-[rgba(11,31,51,0.52)]">{log.actor_email || 'operator'} · {new Date(log.created_at || Date.now()).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {formOpen && (
        <PerkModal
          form={form}
          partners={partners}
          campaigns={campaigns}
          events={events}
          saving={saving}
          editing={Boolean(editingPerk)}
          onClose={closeForm}
          onSubmit={savePerk}
          updateField={updateField}
        />
      )}
    </div>
  );
}

function PerkModal({ form, partners, campaigns, events, saving, editing, onClose, onSubmit, updateField }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/45 p-4" role="dialog" aria-modal="true">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-6 shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{editing ? 'Edit perk' : 'Create perk'}</p>
            <h2 className="mt-2 text-2xl font-semibold">Offer record</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">Add the details people need to understand the offer, use it, and see the results clearly.</p>
          </div>
          <Button type="button" variant="outline" onClick={onClose} className="border-[rgba(11,31,51,0.12)] bg-white text-[#0B1F33]">Cancel</Button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Field label="Title *"><input value={form.title} onChange={(event) => updateField('title', event.target.value)} className="dp-admin-input" /></Field>
          <Field label="Partner *">
            <select value={form.partner_id} onChange={(event) => updateField('partner_id', event.target.value)} className="dp-admin-select w-full">
              <option value="">Select partner</option>
              {partners.map((partner: any) => <option key={partner.id} value={partner.id}>{partner.business_name || partner.name}</option>)}
            </select>
          </Field>
          <Field label="Category *">
            <select value={form.category} onChange={(event) => updateField('category', event.target.value)} className="dp-admin-select w-full">
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </Field>
          <Field label="District"><input value={form.district} onChange={(event) => updateField('district', event.target.value)} className="dp-admin-input" /></Field>
          <Field label="Start date *"><input type="date" value={form.start_date} onChange={(event) => updateField('start_date', event.target.value)} className="dp-admin-input" /></Field>
          <Field label="End date *"><input type="date" value={form.end_date} onChange={(event) => updateField('end_date', event.target.value)} className="dp-admin-input" /></Field>
          <Field label="Redemption type">
            <select value={form.redemption_type} onChange={(event) => updateField('redemption_type', event.target.value)} className="dp-admin-select w-full">
              {redemptionTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="dp-admin-select w-full">
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>
          <Field label="CTA"><input value={form.cta_label} onChange={(event) => updateField('cta_label', event.target.value)} className="dp-admin-input" /></Field>
          <Field label="Primary image URL"><input value={form.image_url} onChange={(event) => updateField('image_url', event.target.value)} className="dp-admin-input" /></Field>
          <Field label="Thumbnail URL"><input value={form.thumbnail_url} onChange={(event) => updateField('thumbnail_url', event.target.value)} className="dp-admin-input" /></Field>
          <Field label="Video URL"><input value={form.video_url} onChange={(event) => updateField('video_url', event.target.value)} className="dp-admin-input" /></Field>
          <Field label="Campaign">
            <select value={form.campaign_id} onChange={(event) => updateField('campaign_id', event.target.value)} className="dp-admin-select w-full">
              <option value="">None</option>
              {campaigns.map((campaign: any) => <option key={campaign.id} value={campaign.id}>{campaign.name || campaign.title || campaign.id}</option>)}
            </select>
          </Field>
          <Field label="Event">
            <select value={form.event_id} onChange={(event) => updateField('event_id', event.target.value)} className="dp-admin-select w-full">
              <option value="">None</option>
              {events.map((event: any) => <option key={event.id} value={event.id}>{event.title || event.id}</option>)}
            </select>
          </Field>
          <Field label="Property / building ID"><input value={form.property_id} onChange={(event) => updateField('property_id', event.target.value)} className="dp-admin-input" /></Field>
          <Field label="Hotel ID"><input value={form.hotel_id} onChange={(event) => updateField('hotel_id', event.target.value)} className="dp-admin-input" /></Field>
          <Field label="Venue ID"><input value={form.venue_id} onChange={(event) => updateField('venue_id', event.target.value)} className="dp-admin-input" /></Field>
          <Field label="Brand ID"><input value={form.brand_id} onChange={(event) => updateField('brand_id', event.target.value)} className="dp-admin-input" /></Field>
          <Field label="Description *" full><textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} className="dp-admin-input min-h-[120px]" /></Field>
          <Field label="Terms *" full><textarea value={form.terms} onChange={(event) => updateField('terms', event.target.value)} className="dp-admin-input min-h-[96px]" /></Field>
          <Field label="Gallery image URLs" full><textarea value={form.gallery_images} onChange={(event) => updateField('gallery_images', event.target.value)} placeholder="One URL per line. Use Supabase Storage or S3 URLs, not local uploads." className="dp-admin-input min-h-[96px]" /></Field>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="border-[rgba(11,31,51,0.12)] bg-white text-[#0B1F33]">Cancel</Button>
          <Button type="submit" disabled={saving} className="gap-1.5 text-[#11182B]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
            {editing ? 'Save Changes' : 'Create Perk'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, full, children }: any) {
  return (
    <label className={full ? 'lg:col-span-2' : ''}>
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-normal text-[rgba(11,31,51,0.56)]">{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value }: any) {
  return (
    <article className="dp-summary-matrix__item">
      <p className="dp-summary-matrix__label">{label}</p>
      <strong className="dp-summary-matrix__value">{Number(value || 0).toLocaleString()}</strong>
    </article>
  );
}

function Panel({ eyebrow, title, children }: any) {
  return (
    <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{eyebrow}</p>
      <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold"><BarChart3 className="h-4 w-4 text-[#C8A96A]" /> {title}</h2>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function InsightLine({ label, value }: any) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-[rgba(11,31,51,0.08)] pt-3">
      <span className="text-sm text-[rgba(11,31,51,0.62)]">{label}</span>
      <strong className="text-right text-sm font-semibold">{value}</strong>
    </div>
  );
}

function MetricPair({ label, value }: any) {
  return (
    <div className="bg-white px-3 py-2">
      <span className="block text-[10px] font-semibold uppercase text-[rgba(11,31,51,0.42)]">{label}</span>
      <strong className="mt-0.5 block text-[13px] font-semibold text-[#0B1F33]">{Number(value || 0).toLocaleString()}</strong>
    </div>
  );
}

function DateLine({ label, value }: any) {
  return (
    <div className="grid grid-cols-[44px_1fr] gap-2 text-[12px] leading-5">
      <span className="font-semibold uppercase text-[10px] text-[rgba(11,31,51,0.42)]">{label}</span>
      <span className="font-medium text-[#0B1F33]">{value}</span>
    </div>
  );
}

function RelationshipLine({ label, value }: any) {
  return (
    <p className="grid grid-cols-[70px_1fr] gap-2 border-b border-[rgba(11,31,51,0.06)] py-1.5 last:border-b-0">
      <span className="w-16 shrink-0 text-[rgba(11,31,51,0.42)]">{label}</span>
      <span className="min-w-0 font-medium text-[#0B1F33]">{value}</span>
    </p>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = String(status || 'draft').toLowerCase();
  const tone = normalized === 'active'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : normalized === 'paused'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : normalized === 'expired' || normalized === 'archived'
        ? 'border-slate-200 bg-slate-50 text-slate-600'
        : 'border-[rgba(11,31,51,0.10)] bg-white text-[#0B1F33]';

  return (
    <span className={`inline-flex min-h-7 items-center border px-2.5 text-[10px] font-semibold uppercase ${tone}`}>
      {normalized}
    </span>
  );
}

function formatDistrict(value?: string) {
  if (!value) return 'No district';
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function topBy(rows: any[], key: string, suffix = '') {
  const top = [...rows].sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0))[0];
  if (!top) return 'No data';
  return `${top.title || top.partnerName} · ${Number(top[key] || 0).toLocaleString()}${suffix}`;
}

function topDistrict(rows: any[]) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    const district = row.district || 'Unassigned';
    totals.set(district, (totals.get(district) || 0) + row.views + row.saves + row.directions + row.redemptionCount);
  });
  const [district, total] = [...totals.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  return district ? `${district} · ${total.toLocaleString()} actions` : 'No data';
}
