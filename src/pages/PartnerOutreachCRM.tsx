import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  Copy,
  Database,
  Download,
  Mail,
  MessageSquare,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';

type CrmPartner = {
  id: string;
  name: string;
  type: string;
  district?: string;
  address?: string;
  website?: string;
  phone?: string;
  google_maps_url?: string;
  downtown_perks_map_url?: string;
  partner_fit?: string;
  resident_value?: string;
  business_value?: string;
  suggested_perk?: string;
  suggested_campaign?: string;
  recommended_plan?: string;
  priority_score?: number;
  outreach_stage?: string;
  last_contacted?: string;
  next_follow_up_date?: string;
  next_action?: string;
  notes?: string;
  verification_fields?: string[];
  verification_status?: string;
  contact?: any;
  campaign?: any;
  message?: any;
  sms_message?: any;
  step?: any;
  activities?: any[];
};

type SavedView = {
  id: string;
  name: string;
  query: string;
  filter: string;
  stage: string;
  district: string;
  priorityBand: string;
  verificationOnly: boolean;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
};

const missing = 'Needs verification';
const exportFormats = [
  { key: 'csv', label: 'CSV' },
  { key: 'xlsx', label: 'XLSX' },
  { key: 'airtable', label: 'Airtable' },
  { key: 'hubspot', label: 'HubSpot' },
  { key: 'salesforce', label: 'Salesforce' },
  { key: 'notion', label: 'Notion' },
  { key: 'google-sheets', label: 'Sheets' },
];
const savedViewsKey = 'dp-outreach-crm-saved-views';

function clean(value: any) {
  return String(value || '').trim() || missing;
}

function sortValue(partner: any, key: string) {
  if (key === 'name') return partner.name || '';
  if (key === 'contact_status') return (partner.verification_fields || []).length ? 'Needs verification' : partner.contact?.verification_status || '';
  if (key === 'priority_score') return Number(partner.priority_score || 0);
  if (key === 'last_contacted') return partner.last_contacted ? new Date(partner.last_contacted).getTime() : 0;
  return partner[key] || '';
}

export default function PartnerOutreachCRM() {
  const { user, configured, loading: authLoading, signInWithGoogle, logout } = useAuth();
  const [partners, setPartners] = useState<CrmPartner[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [filters, setFilters] = useState<string[]>(['All']);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [stage, setStage] = useState('All');
  const [district, setDistrict] = useState('All');
  const [priorityBand, setPriorityBand] = useState('All');
  const [verificationOnly, setVerificationOnly] = useState(false);
  const [sortKey, setSortKey] = useState('priority_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [googlePlacesConfigured, setGooglePlacesConfigured] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchStatus, setBatchStatus] = useState('Ready to contact');
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [viewName, setViewName] = useState('');

  async function load() {
    setLoading(true);
    const response = await fetch('/api/outreach-crm');
    const payload = await response.json();
    setPartners(payload.partners || []);
    setStatuses(payload.statuses || []);
    setFilters(payload.filters || ['All']);
    setGooglePlacesConfigured(Boolean(payload.google_places_configured));
    setSelectedId((current) => current || payload.partners?.[0]?.id || '');
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(savedViewsKey) || '[]');
      if (Array.isArray(stored)) setSavedViews(stored);
    } catch {
      setSavedViews([]);
    }
  }, []);

  const selected = selectedId ? partners.find((partner) => partner.id === selectedId) : undefined;
  const districts = useMemo(() => ['All', ...Array.from(new Set(partners.map((partner) => clean(partner.district)).filter((item) => item !== missing))).sort()], [partners]);
  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    const rows = partners.filter((partner) => {
      const haystack = `${partner.name} ${partner.type} ${partner.district} ${partner.suggested_perk} ${partner.suggested_campaign} ${partner.contact?.name} ${partner.contact?.role}`.toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesFilter = filter === 'All' || partner.type === filter || String(partner.type || '').toLowerCase().includes(filter.toLowerCase().replace(/s$/, ''));
      const matchesStage = stage === 'All' || partner.outreach_stage === stage;
      const matchesDistrict = district === 'All' || clean(partner.district) === district;
      const score = Number(partner.priority_score || 0);
      const matchesPriority = priorityBand === 'All' || (priorityBand === 'High priority' && score >= 70) || (priorityBand === 'Top priority' && score >= 90);
      const matchesVerification = !verificationOnly || (partner.verification_fields || []).length > 0;
      return matchesQuery && matchesFilter && matchesStage && matchesDistrict && matchesPriority && matchesVerification;
    });
    return rows.sort((a: any, b: any) => {
      const aValue = sortValue(a, sortKey);
      const bValue = sortValue(b, sortKey);
      const result = typeof aValue === 'number' && typeof bValue === 'number'
        ? aValue - bValue
        : String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? result : -result;
    });
  }, [partners, query, filter, stage, district, priorityBand, verificationOnly, sortKey, sortDirection]);

  const stats = useMemo(() => {
    const active = partners.filter((partner) => partner.outreach_stage === 'Active partner').length;
    const pending = partners.filter((partner) => ['Not started', 'Needs research', 'Ready to contact', 'Follow-up needed'].includes(partner.outreach_stage || '')).length;
    const meetings = partners.filter((partner) => ['Meeting requested', 'Meeting booked'].includes(partner.outreach_stage || '')).length;
    return [
      { label: 'Total partners', value: partners.length },
      { label: 'Active partnerships', value: active },
      { label: 'Pending outreach', value: pending },
      { label: 'Meeting bookings', value: meetings },
    ];
  }, [partners]);

  const visibleIds = useMemo(() => filtered.map((partner) => partner.id), [filtered]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function persistSavedViews(next: SavedView[]) {
    setSavedViews(next);
    localStorage.setItem(savedViewsKey, JSON.stringify(next));
  }

  function saveCurrentView() {
    const name = viewName.trim() || `${filter === 'All' ? 'All partners' : filter} view`;
    const view: SavedView = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      query,
      filter,
      stage,
      district,
      priorityBand,
      verificationOnly,
      sortKey,
      sortDirection,
    };
    persistSavedViews([view, ...savedViews].slice(0, 8));
    setViewName('');
  }

  function applySavedView(view: SavedView) {
    setQuery(view.query || '');
    setFilter(view.filter || 'All');
    setStage(view.stage || 'All');
    setDistrict(view.district || 'All');
    setPriorityBand(view.priorityBand || 'All');
    setVerificationOnly(Boolean(view.verificationOnly));
    setSortKey(view.sortKey || 'priority_score');
    setSortDirection(view.sortDirection || 'desc');
  }

  function removeSavedView(id: string) {
    persistSavedViews(savedViews.filter((view) => view.id !== id));
  }

  function toggleSelected(id: string) {
    setSelectedIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  }

  function toggleVisibleSelected() {
    if (allVisibleSelected) {
      setSelectedIds((items) => items.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((items) => Array.from(new Set([...items, ...visibleIds])));
  }

  async function importData() {
    setWorking('import');
    await fetch('/api/outreach-crm/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    await load();
    setWorking('');
  }

  async function enrichMapData() {
    setWorking('enrich');
    await fetch('/api/outreach-crm/enrich-map-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_map: true, google_places: true }),
    });
    await load();
    setWorking('');
  }

  async function patchPartner(id: string, data: Record<string, any>) {
    const response = await fetch(`/api/outreach-crm/partners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await response.json();
    setPartners((items) => items.map((item) => (item.id === id ? updated : item)));
  }

  async function patchContact(id: string, data: Record<string, any>) {
    if (!id) return;
    await fetch(`/api/outreach-crm/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await load();
  }

  async function patchMessage(id: string, data: Record<string, any>) {
    if (!id) return;
    await fetch(`/api/outreach-crm/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await load();
  }

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'name' ? 'asc' : 'desc');
  }

  async function generateMessage(id: string) {
    setWorking('generate');
    await fetch(`/api/outreach-crm/partners/${id}/generate-message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    await load();
    setWorking('');
  }

  async function applyBatchStatus() {
    if (!selectedIds.length) return;
    setWorking('batch');
    const response = await fetch('/api/outreach-crm/batch/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, status: batchStatus }),
    });
    const payload = await response.json();
    if (Array.isArray(payload.partners)) {
      setPartners((items) => items.map((item) => payload.partners.find((updated: CrmPartner) => updated.id === item.id) || item));
    } else {
      await load();
    }
    setWorking('');
  }

  function copyText(text: string) {
    navigator.clipboard?.writeText(text || '');
  }

  const authLabel = !configured ? 'Firebase pending' : user ? 'Sign out' : 'Google login';
  const authValue = authLoading ? 'Checking' : user ? 'Connected' : configured ? 'Ready' : 'Setup';

  if (loading) {
    return <div className="p-8 text-sm font-semibold text-[#0B1F33]">Loading outreach CRM.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-[1840px] space-y-3 p-4 text-[#0B1F33] sm:p-5">
      <section className="grid gap-3 xl:grid-cols-[1fr_520px] xl:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Partner growth</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">Outreach CRM</h1>
          <p className="mt-1 max-w-3xl text-[12px] leading-5 text-[rgba(11,31,51,0.64)]">
            One calm place to review partners, verify contacts, tune the angle, send the note, and move the relationship forward.
          </p>
        </div>
        <div className="min-w-0 justify-self-stretch xl:justify-self-end">
          <div className="dp-crm-action-rail flex items-center gap-1.5 overflow-x-auto pb-1 xl:max-w-[720px]">
            <button onClick={importData} className="inline-flex min-h-8 items-center gap-1.5 border border-[#C8A96A] px-2.5 text-[9.5px] font-semibold uppercase text-[#0B1F33]">
              <RefreshCw className={`h-3.5 w-3.5 ${working === 'import' ? 'animate-spin' : ''}`} /> Import
            </button>
            <button onClick={enrichMapData} className="inline-flex min-h-8 items-center gap-1.5 border border-[rgba(11,31,51,0.08)] px-2.5 text-[9.5px] font-semibold uppercase text-[#0B1F33]">
              <RefreshCw className={`h-3.5 w-3.5 ${working === 'enrich' ? 'animate-spin' : ''}`} /> Verify data
            </button>
            <span className="inline-flex min-h-8 items-center border border-[rgba(11,31,51,0.08)] px-2 text-[9px] font-semibold uppercase text-[rgba(11,31,51,0.52)]">
              Places {googlePlacesConfigured ? 'on' : 'pending'}
            </span>
            <span className="inline-flex min-h-8 items-center gap-1.5 border border-[rgba(11,31,51,0.08)] px-2.5 text-[9.5px] font-semibold uppercase text-[rgba(11,31,51,0.5)]">
              <Database className="h-3.5 w-3.5 text-[#C8A96A]" /> Export
            </span>
            {exportFormats.map((format) => (
              <a key={format.key} href={`/api/outreach-crm/export.${format.key}`} className="inline-flex min-h-8 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-2 text-[9.5px] font-semibold uppercase text-[#0B1F33] hover:border-[#C8A96A]">
                <Download className="h-3 w-3" /> {format.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="dp-crm-quick-view border border-[rgba(11,31,51,0.07)] bg-white">
        <div className="grid grid-cols-1 divide-y divide-[rgba(11,31,51,0.06)] sm:grid-cols-5 sm:divide-x sm:divide-y-0">
        {stats.map((stat) => (
          <div key={stat.label} className="dp-crm-kpi-tile">
            <p className="dp-crm-kpi-label">{stat.label}</p>
            <p className="dp-crm-kpi-value tabular-nums">{stat.value.toLocaleString()}</p>
          </div>
        ))}
          <button
            type="button"
            onClick={() => {
              if (!configured) return;
              void (user ? logout() : signInWithGoogle());
            }}
            className="dp-crm-kpi-tile dp-crm-kpi-auth text-left transition-colors hover:bg-[#FBFAF6]"
            aria-label={authLabel}
          >
            <span className="dp-crm-kpi-label">{authLabel}</span>
            <span className="dp-crm-kpi-value">{authValue}</span>
          </button>
        </div>
      </section>

      <section className={`grid gap-3 ${selected ? 'xl:grid-cols-[minmax(0,1fr)_390px]' : 'xl:grid-cols-1'}`}>
        <article className="min-w-0 border border-[rgba(11,31,51,0.07)] bg-white">
          <div className="grid gap-1.5 border-b border-[rgba(11,31,51,0.07)] p-3 lg:grid-cols-[minmax(260px,1fr)_150px_150px_150px_132px]">
            <label className="flex min-h-8 items-center gap-2 border border-[rgba(11,31,51,0.1)] px-2.5">
              <Search className="h-3.5 w-3.5 text-[#C8A96A]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-[12px] outline-none" placeholder="Search partners, contacts, perks, campaigns" />
            </label>
            <label className="dp-crm-filter-field">
              <span><SlidersHorizontal className="h-3 w-3 text-[#C8A96A]" /> Type</span>
              <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                {filters.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="dp-crm-filter-field">
              <span>Status</span>
              <select value={stage} onChange={(event) => setStage(event.target.value)}>
              <option>All</option>
              {statuses.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="dp-crm-filter-field">
              <span>District</span>
              <select value={district} onChange={(event) => setDistrict(event.target.value)}>
              {districts.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="dp-crm-filter-field">
              <span>Priority</span>
              <select value={priorityBand} onChange={(event) => setPriorityBand(event.target.value)}>
              <option>All</option>
              <option>High priority</option>
              <option>Top priority</option>
              </select>
            </label>
          </div>
          <div className="grid gap-2 border-b border-[rgba(11,31,51,0.07)] px-3 py-2 lg:grid-cols-[220px_1fr] lg:items-center">
            <label className="flex min-h-8 items-center gap-2 border border-[rgba(11,31,51,0.1)] px-2.5">
              <Save className="h-3.5 w-3.5 text-[#C8A96A]" />
              <input value={viewName} onChange={(event) => setViewName(event.target.value)} className="w-full bg-transparent text-[12px] outline-none" placeholder="Name this view" />
              <button onClick={saveCurrentView} type="button" className="min-h-6 px-1.5 text-[9px] font-semibold uppercase text-[#0B1F33]">Save</button>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9.5px] font-semibold uppercase text-[rgba(11,31,51,0.42)]">Saved views</span>
              {savedViews.length === 0 && <span className="text-[11px] text-[rgba(11,31,51,0.48)]">Save filters like High Priority Restaurants or Follow-up Needed.</span>}
              {savedViews.map((view) => (
                <span key={view.id} className="inline-flex min-h-7 items-center border border-[rgba(11,31,51,0.1)]">
                  <button onClick={() => applySavedView(view)} type="button" className="min-h-7 px-2 text-[9.5px] font-semibold uppercase text-[#0B1F33]">{view.name}</button>
                  <button onClick={() => removeSavedView(view.id)} type="button" className="min-h-7 px-1.5 text-[rgba(11,31,51,0.48)]" aria-label={`Delete ${view.name}`}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-[rgba(11,31,51,0.07)] px-3 py-1.5">
            <button onClick={() => setVerificationOnly((value) => !value)} className={`inline-flex min-h-7 items-center gap-1.5 border px-2.5 text-[10px] font-semibold uppercase ${verificationOnly ? 'border-[#C8A96A] bg-[#FBFAF6] text-[#0B1F33]' : 'border-[rgba(11,31,51,0.1)] text-[rgba(11,31,51,0.62)]'}`}>
              Needs verification
            </button>
            <span className="inline-flex min-h-7 items-center px-1 text-[9.5px] font-semibold uppercase text-[rgba(11,31,51,0.42)]">{filtered.length.toLocaleString()} shown</span>
            <span className="hidden min-h-7 items-center text-[9.5px] font-medium text-[rgba(11,31,51,0.45)] sm:inline-flex">Click any row to review and edit.</span>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C8A96A]/35 bg-[#FBFAF6] px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase text-[#0B1F33]">{selectedIds.length} selected</span>
                <select value={batchStatus} onChange={(event) => setBatchStatus(event.target.value)} className="min-h-8 border border-[rgba(11,31,51,0.12)] bg-white px-2 text-[12px]">
                  {statuses.map((item) => <option key={item}>{item}</option>)}
                </select>
                <button onClick={applyBatchStatus} type="button" className="inline-flex min-h-8 items-center gap-1.5 border border-[#C8A96A] px-2.5 text-[10px] font-semibold uppercase">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${working === 'batch' ? 'animate-spin' : ''}`} /> Update status
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <a href={`/api/outreach-crm/export.csv?ids=${encodeURIComponent(selectedIds.join(','))}`} className="inline-flex min-h-8 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-2 text-[9.5px] font-semibold uppercase text-[#0B1F33]"><Download className="h-3 w-3" /> CSV</a>
                <a href={`/api/outreach-crm/export.xlsx?ids=${encodeURIComponent(selectedIds.join(','))}`} className="inline-flex min-h-8 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-2 text-[9.5px] font-semibold uppercase text-[#0B1F33]"><Download className="h-3 w-3" /> XLSX</a>
                <button onClick={() => setSelectedIds([])} type="button" className="inline-flex min-h-8 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-2 text-[9.5px] font-semibold uppercase"><X className="h-3 w-3" /> Clear</button>
              </div>
            </div>
          )}
          <div className="dp-crm-table-scroll overflow-x-auto" role="region" aria-label="Scrollable partner directory table" tabIndex={0}>
            <table className="dp-outreach-crm-table w-full min-w-[2040px] table-fixed text-left">
              <colgroup>
                <col className="w-[48px]" />
                <col className="w-[250px]" />
                <col className="w-[155px]" />
                <col className="w-[155px]" />
                <col className="w-[235px]" />
                <col className="w-[410px]" />
                <col className="w-[410px]" />
                <col className="w-[82px]" />
                <col className="w-[175px]" />
                <col className="w-[120px]" />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelected} aria-label="Select visible partners" />
                  </th>
                  <th><SortButton label="Partner" sortKey="name" current={sortKey} direction={sortDirection} onClick={toggleSort} /></th>
                  <th>Type</th>
                  <th>District</th>
                  <th><SortButton label="Contact status" sortKey="contact_status" current={sortKey} direction={sortDirection} onClick={toggleSort} /></th>
                  <th>Suggested perk</th>
                  <th>Campaign</th>
                  <th><SortButton label="Score" sortKey="priority_score" current={sortKey} direction={sortDirection} onClick={toggleSort} /></th>
                  <th>Stage</th>
                  <th><SortButton label="Last contacted" sortKey="last_contacted" current={sortKey} direction={sortDirection} onClick={toggleSort} /></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((partner) => (
                  <tr key={partner.id} className={`cursor-pointer border-t border-[rgba(11,31,51,0.045)] hover:bg-[#F8F9FB] ${selected?.id === partner.id ? 'bg-[#FBFAF6] outline outline-1 outline-[#C8A96A]/35' : ''}`} onClick={() => setSelectedId(partner.id)}>
                    <td onClick={(event) => event.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.includes(partner.id)} onChange={() => toggleSelected(partner.id)} aria-label={`Select ${clean(partner.name)}`} />
                    </td>
                    <td><p className="dp-crm-cell-primary">{clean(partner.name)}</p><p className="dp-crm-cell-secondary">{clean(partner.website)}</p></td>
                    <td>{clean(partner.type)}</td>
                    <td>{clean(partner.district)}</td>
                    <td><p className="dp-crm-cell-primary">{clean(partner.best_contact || partner.contact?.name || partner.contact?.role)}</p>{(partner.verification_fields || []).length > 0 && <p className="dp-crm-cell-secondary dp-crm-cell-gold">{partner.verification_fields.length} fields to verify</p>}</td>
                    <td>{clean(partner.suggested_perk)}</td>
                    <td>{clean(partner.suggested_campaign)}</td>
                    <td><span className="dp-crm-score">{Math.round(Number(partner.priority_score || 0))}</span></td>
                    <td><StatusBadge value={partner.outreach_stage} /></td>
                    <td>{formatActivityDate(partner.last_contacted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {selected && (
          <aside className="self-start border border-[rgba(11,31,51,0.07)] bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase text-[#C8A96A]">{clean(selected.type)}</p>
                <h2 className="mt-0.5 text-xl font-semibold">{clean(selected.name)}</h2>
                <p className="mt-1 text-[12px] text-[rgba(11,31,51,0.6)]">{clean(selected.district)} · {clean(selected.address)}</p>
              </div>
              <button
                className="inline-flex h-8 w-8 items-center justify-center border border-[rgba(11,31,51,0.08)] text-[rgba(11,31,51,0.58)] transition-colors hover:border-[#C8A96A] hover:text-[#0B1F33]"
                onClick={() => setSelectedId('')}
                aria-label="Close detail panel"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 grid gap-2">
              <select value={selected.outreach_stage || 'Not started'} onChange={(event) => patchPartner(selected.id, { outreach_stage: event.target.value, status: event.target.value })} className="min-h-8 border border-[rgba(11,31,51,0.1)] bg-white px-2.5 text-[12px]">
                {statuses.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>

            <DetailSection title="Overview" rows={[
              ['Map link', clean(selected.google_maps_url)],
              ['DP map', clean(selected.downtown_perks_map_url)],
              ['Plan', clean(selected.recommended_plan)],
              ['Fit', clean(selected.partner_fit)],
            ]} />
            <section className="dp-crm-compact-edit mt-4 border-t border-[rgba(11,31,51,0.08)] pt-3">
              <p className="text-[9px] font-bold uppercase text-[#C8A96A]">Inline verification</p>
              <div className="mt-2 grid gap-1.5">
                <EditableField label="Website" value={selected.website} needsVerify={!selected.website} onSave={(value) => patchPartner(selected.id, { website: value })} />
                <EditableField label="Phone" value={selected.phone} needsVerify={!selected.phone} onSave={(value) => patchPartner(selected.id, { phone: value })} />
                <EditableField label="Google Maps URL" value={selected.google_maps_url} needsVerify={!selected.google_maps_url} onSave={(value) => patchPartner(selected.id, { google_maps_url: value })} />
              </div>
            </section>
            <DetailSection title="Contacts" rows={[
              ['LinkedIn', clean(selected.contact?.linkedin_url)],
              ['Confidence', clean(selected.contact?.confidence)],
              ['Verification', clean(selected.contact?.verification_status)],
            ]} />
            <section className="mt-4 border-t border-[rgba(11,31,51,0.08)] pt-3">
              <p className="text-[9px] font-bold uppercase text-[#C8A96A]">Contact edits</p>
              <div className="mt-2 grid gap-2">
                <EditableField label="Primary contact" value={selected.contact?.name || selected.contact?.contact_name} needsVerify={!selected.contact?.name || selected.contact?.name === missing} onSave={(value) => patchContact(selected.contact?.id, { name: value, contact_name: value })} />
                <EditableField label="Role" value={selected.contact?.role} needsVerify={!selected.contact?.role || selected.contact?.role === missing} onSave={(value) => patchContact(selected.contact?.id, { role: value })} />
                <EditableField label="Email or route" value={selected.contact?.email || selected.contact?.contact_route} needsVerify={!selected.contact?.email && !selected.contact?.contact_route} onSave={(value) => patchContact(selected.contact?.id, value.includes('@') ? { email: value, contact_route: value } : { contact_route: value })} />
                <EditableField label="Phone" value={selected.contact?.phone} needsVerify={!selected.contact?.phone || selected.contact?.phone === missing} onSave={(value) => patchContact(selected.contact?.id, { phone: value })} />
              </div>
            </section>
            <DetailSection title="Partnership Strategy" rows={[
              ['Recommended perk', clean(selected.suggested_perk)],
              ['Recommended campaign', clean(selected.suggested_campaign)],
              ['Resident value', clean(selected.resident_value)],
              ['Business value', clean(selected.business_value)],
              ['Next action', clean(selected.next_action)],
            ]} />

            <div className="mt-4 border-t border-[rgba(11,31,51,0.08)] pt-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase text-[#C8A96A]">Outreach</p>
                  <h3 className="text-[14px] font-semibold">Message preview</h3>
                </div>
                <button onClick={() => generateMessage(selected.id)} className="inline-flex min-h-7 items-center gap-1.5 text-[10px] font-semibold uppercase text-[#0B1F33]"><RefreshCw className={`h-3.5 w-3.5 ${working === 'generate' ? 'animate-spin' : ''}`} /> Generate</button>
              </div>
              <EditableMessage icon={<MessageSquare className="h-4 w-4" />} title="Short text / DM" body={clean(selected.sms_message?.body)} onCopy={() => copyText(selected.sms_message?.body || '')} onSave={(value) => patchMessage(selected.sms_message?.id, { body: value })} />
              <EditableMessage icon={<Mail className="h-4 w-4" />} title={clean(selected.message?.subject)} body={clean(selected.message?.body)} onCopy={() => copyText(selected.message?.body || '')} onSave={(value) => patchMessage(selected.message?.id, { body: value })} />
              <div className="mt-3 overflow-hidden border border-[rgba(11,31,51,0.08)]">
                <div className="border-b border-[rgba(11,31,51,0.08)] px-3 py-1.5 text-[9px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Branded email render</div>
                <iframe
                  title={`${clean(selected.name)} branded email preview`}
                  srcDoc={selected.message?.html || ''}
                  sandbox=""
                  className="h-[420px] w-full border-0 bg-white"
                />
              </div>
            </div>

            <ActivityFeed activities={selected.activities || []} />
          </aside>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ value }: { value?: string }) {
  return <span className="inline-flex min-h-5 items-center border border-[rgba(200,169,106,0.36)] px-1.5 text-[8.5px] font-semibold uppercase text-[#0B1F33]">{clean(value)}</span>;
}

function formatActivityDate(value?: string) {
  if (!value) return missing;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ActivityFeed({ activities }: { activities: any[] }) {
  const [expanded, setExpanded] = useState(false);
  const items = (expanded ? activities : activities.slice(0, 3)).slice(0, 24);
  const hasMore = activities.length > 3;
  return (
    <section className="mt-4 border-t border-[rgba(11,31,51,0.08)] pt-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase text-[#C8A96A]">Activity timeline</p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase text-[rgba(11,31,51,0.42)]">
            {activities.length} {activities.length === 1 ? 'event' : 'events'}
          </p>
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="min-h-7 border border-[rgba(11,31,51,0.08)] px-2 text-[9px] font-semibold uppercase text-[#0B1F33]"
            aria-expanded={expanded}
          >
            {expanded ? 'Collapse' : `Show all ${activities.length}`}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="mt-2 border border-[rgba(11,31,51,0.08)] p-2.5 text-[11px] text-[rgba(11,31,51,0.55)]">No activity yet. Edits, status changes, generated messages, and follow-ups will appear here.</p>
      ) : (
        <ol className="mt-2 grid gap-1.5">
          {items.map((activity) => (
            <li key={activity.id || `${activity.activity_type}_${activity.created_at}`} className="border border-[rgba(11,31,51,0.08)] p-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold leading-4 text-[#0B1F33]">{clean(activity.title || activity.activity_type)}</p>
                <span className="shrink-0 text-[9px] font-semibold uppercase text-[rgba(11,31,51,0.42)]">{formatActivityDate(activity.created_at || activity.updated_at)}</span>
              </div>
              {activity.status && <p className="mt-1 text-[9.5px] font-semibold uppercase text-[#A88947]">{activity.status}</p>}
              {activity.notes && <p className="mt-1 whitespace-pre-wrap text-[10.5px] leading-4 text-[rgba(11,31,51,0.62)]">{activity.notes}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function DetailSection({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section className="mt-4 border-t border-[rgba(11,31,51,0.08)] pt-3">
      <p className="text-[9px] font-bold uppercase text-[#C8A96A]">{title}</p>
      <div className="mt-2 grid gap-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[105px_1fr] gap-2 text-[12px]">
            <span className="text-[9.5px] font-semibold uppercase text-[rgba(11,31,51,0.44)]">{label}</span>
            <span className={value === missing ? 'text-[rgba(11,31,51,0.45)]' : 'text-[#0B1F33]'}>{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SortButton({ label, sortKey, current, direction, onClick }: { label: string; sortKey: string; current: string; direction: string; onClick: (key: string) => void }) {
  return (
    <button onClick={() => onClick(sortKey)} className="dp-crm-sort-button inline-flex items-center gap-1 text-[9px] font-bold uppercase text-[rgba(11,31,51,0.52)]">
      {label}
      <ArrowUpDown className={`h-3 w-3 ${current === sortKey ? 'text-[#C8A96A]' : 'text-[rgba(11,31,51,0.25)]'}`} />
      {current === sortKey && <span className="sr-only">Sorted {direction}</span>}
    </button>
  );
}

function EditableField({ label, value, needsVerify, onSave }: { label: string; value: any; needsVerify?: boolean; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(clean(value));
  useEffect(() => setDraft(clean(value)), [value]);
  const isMissing = needsVerify || draft === missing;
  return (
    <label className="grid gap-1">
      <span className="flex items-center justify-between gap-2 text-[9px] font-semibold uppercase text-[rgba(11,31,51,0.48)]">
        {label}
        {isMissing && <span className="text-[#C8A96A]">{missing}</span>}
      </span>
      <div className="flex gap-2">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-8 flex-1 border border-[rgba(11,31,51,0.1)] px-2.5 text-[12px] outline-none" />
        <button onClick={() => onSave(draft === missing ? '' : draft)} type="button" className="min-h-8 border border-[#C8A96A] px-2.5 text-[10px] font-semibold uppercase">Save</button>
      </div>
    </label>
  );
}

function EditableMessage({ icon, title, body, onCopy, onSave }: { icon: React.ReactNode; title: string; body: string; onCopy: () => void; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(body);
  useEffect(() => setDraft(body), [body]);
  return (
    <div className="mb-2 border border-[rgba(11,31,51,0.08)] p-2.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[12px] font-semibold">{icon}{title}</p>
        <div className="flex gap-2">
          <button onClick={onCopy} className="inline-flex min-h-7 items-center gap-1.5 text-[10px] font-semibold uppercase text-[#C8A96A]"><Copy className="h-3.5 w-3.5" /> Copy</button>
          <button onClick={() => onSave(draft)} className="inline-flex min-h-7 items-center gap-1.5 text-[10px] font-semibold uppercase text-[#0B1F33]">Save</button>
        </div>
      </div>
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-[118px] w-full resize-y border border-[rgba(11,31,51,0.08)] p-2.5 text-[12px] leading-5 outline-none" />
    </div>
  );
}
