import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowUpDown,
  CalendarPlus,
  CheckCircle2,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  crm_notes?: any[];
  tasks?: any[];
  files?: any[];
  best_contact?: string;
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
  { key: 'json', label: 'JSON' },
  { key: 'airtable', label: 'Airtable' },
  { key: 'hubspot', label: 'HubSpot' },
  { key: 'salesforce', label: 'Salesforce' },
  { key: 'notion', label: 'Notion' },
  { key: 'google-sheets', label: 'Sheets' },
];
const savedViewsKey = 'dp-outreach-crm-saved-views';
const emailTemplatePresets: Record<string, { label: string; headline: string; subheadline: string; cta: string }> = {
  restaurant: { label: 'Restaurant outreach', headline: 'A dining idea for downtown residents', subheadline: 'A simple way to bring nearby residents and workers back at the right moment.', cta: 'Review dining setup' },
  bar: { label: 'Bar outreach', headline: 'A local nightlife idea', subheadline: 'A light resident offer or happy hour feature for people already nearby.', cta: 'Review bar setup' },
  coffee: { label: 'Coffee outreach', headline: 'A coffee stop residents can remember', subheadline: 'A practical morning or workday perk for downtown routines.', cta: 'Review coffee setup' },
  hotel: { label: 'Hotel outreach', headline: 'A better local guide for guests', subheadline: 'Help guests find nearby places without asking them to download another app.', cta: 'Review hotel setup' },
  property: { label: 'Property outreach', headline: 'A resident amenity for local discovery', subheadline: 'A useful way for residents to find nearby food, events, services, and perks.', cta: 'Review property setup' },
  retail: { label: 'Retail outreach', headline: 'A simple local shopping feature', subheadline: 'Put your shop in front of downtown residents and guests when they are deciding where to go.', cta: 'Review retail setup' },
  civic: { label: 'Civic outreach', headline: 'A clearer path to local programs', subheadline: 'Make events, resources, and downtown programs easier for people to find.', cta: 'Review community setup' },
  service: { label: 'Local service outreach', headline: 'A useful local service feature', subheadline: 'Help nearby residents find trusted local services when they need them.', cta: 'Review service setup' },
  brand: { label: 'Brand campaign outreach', headline: 'A grounded downtown campaign idea', subheadline: 'A focused way to connect with real downtown routines and local moments.', cta: 'Review campaign setup' },
  default: { label: 'General partner outreach', headline: 'A local idea for Downtown Perks', subheadline: 'A simple way to help the right people nearby discover what you offer.', cta: 'Review partner setup' },
};

function presetKeyForPartner(partner?: CrmPartner) {
  const type = String(partner?.type || '').toLowerCase();
  if (type.includes('restaurant')) return 'restaurant';
  if (type.includes('bar')) return 'bar';
  if (type.includes('coffee')) return 'coffee';
  if (type.includes('hotel')) return 'hotel';
  if (type.includes('property') || type.includes('residential') || type.includes('building')) return 'property';
  if (type.includes('retail')) return 'retail';
  if (type.includes('civic') || type.includes('community')) return 'civic';
  if (type.includes('service') || type.includes('wellness') || type.includes('fitness')) return 'service';
  if (type.includes('brand') || type.includes('campaign')) return 'brand';
  return 'default';
}

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
  const location = useLocation();
  const navigate = useNavigate();
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
  const [messageModal, setMessageModal] = useState<{ partner: CrmPartner; email: any; sms: any } | null>(null);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState('');
  const [taskDraft, setTaskDraft] = useState({ title: '', due_date: '', priority: 'Normal' });
  const [fileDraft, setFileDraft] = useState({ title: '', url: '' });
  const [actionNotice, setActionNotice] = useState('');

  async function load() {
    setLoading(true);
    const response = await fetch('/api/outreach-crm');
    const payload = await response.json();
    setPartners(payload.partners || []);
    setStatuses(payload.statuses || []);
    setFilters(payload.filters || ['All']);
    setGooglePlacesConfigured(Boolean(payload.google_places_configured));
    const routePartnerId = new URLSearchParams(location.search).get('partner') || '';
    setSelectedId((current) => routePartnerId || current || payload.partners?.[0]?.id || '');
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const routePartnerId = new URLSearchParams(location.search).get('partner') || '';
    if (routePartnerId && routePartnerId !== selectedId) setSelectedId(routePartnerId);
  }, [location.search, selectedId]);

  const selected = selectedId ? partners.find((partner) => partner.id === selectedId) : undefined;

  useEffect(() => {
    if (!selected?.message) {
      setTemplateDraft({});
      setTemplateEditorOpen(false);
      return;
    }
    setTemplateDraft({
      subject: selected.message.subject || '',
      email_headline: selected.message.email_headline || '',
      email_subheadline: selected.message.email_subheadline || '',
      banner_image_url: selected.message.banner_image_url || selected.message.partner_image_url || '',
      logo_url: selected.message.logo_url || '',
      cta_label: selected.message.cta_label || '',
      cta_href: selected.message.cta_href || '',
      secondary_cta_label: selected.message.secondary_cta_label || '',
      secondary_cta_href: selected.message.secondary_cta_href || '',
      footer_note: selected.message.footer_note || '',
    });
  }, [selected?.id, selected?.message?.id]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(savedViewsKey) || '[]');
      if (Array.isArray(stored)) setSavedViews(stored);
    } catch {
      setSavedViews([]);
    }
  }, []);

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
  const exportQuery = selectedIds.length ? `?ids=${encodeURIComponent(selectedIds.join(','))}` : '';

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
    setActionNotice('');
    try {
      const response = await fetch('/api/outreach-crm/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!response.ok) throw new Error('Import failed');
      const payload = await response.json();
      await load();
      setActionNotice(`Import complete: ${Number(payload.imported_count || 0).toLocaleString()} records processed.`);
    } catch {
      setActionNotice('Import could not finish. Check the source files and try again.');
    } finally {
      setWorking('');
    }
  }

  async function enrichMapData() {
    setWorking('enrich');
    setActionNotice('');
    try {
      const response = await fetch('/api/outreach-crm/enrich-map-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_map: true, google_places: true }),
      });
      if (!response.ok) throw new Error('Verification failed');
      const payload = await response.json();
      await load();
      setActionNotice(`Verification complete: ${Number(payload.updated_count || payload.enriched_count || 0).toLocaleString()} records updated.`);
    } catch {
      setActionNotice('Verification could not finish. Check map and Google Places configuration.');
    } finally {
      setWorking('');
    }
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

  function openPartner(partner: CrmPartner) {
    setSelectedId(partner.id);
    const params = new URLSearchParams(location.search);
    params.set('partner', partner.id);
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }

  function updatePartnerRow(updated: CrmPartner) {
    setPartners((items) => items.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function generateMessage(id: string, openModal = false) {
    setWorking('generate');
    const response = await fetch(`/api/outreach-crm/partners/${id}/generate-message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const payload = await response.json();
    await load();
    if (openModal) {
      const partner = partners.find((item) => item.id === id) || selected;
      if (partner) setMessageModal({ partner, email: payload.email, sms: payload.sms });
    }
    setWorking('');
  }

  async function markContacted(id: string) {
    setWorking(`contacted-${id}`);
    const response = await fetch(`/api/outreach-crm/partners/${id}/mark-contacted`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (response.ok) updatePartnerRow(await response.json());
    setWorking('');
  }

  async function scheduleFollowUp(id: string) {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const followUpAt = window.prompt('Follow-up date', tomorrow);
    if (!followUpAt) return;
    setWorking(`followup-${id}`);
    const response = await fetch(`/api/outreach-crm/partners/${id}/schedule-follow-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follow_up_at: followUpAt }),
    });
    if (response.ok) updatePartnerRow(await response.json());
    setWorking('');
  }

  async function archivePartner(id: string) {
    if (!window.confirm('Archive this partner? You can still keep the historical activity.')) return;
    setWorking(`archive-${id}`);
    const response = await fetch(`/api/outreach-crm/partners/${id}/archive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (response.ok) updatePartnerRow(await response.json());
    setWorking('');
  }

  async function deletePartner(id: string) {
    if (!window.confirm('Remove this partner from the active CRM view? This is a soft delete and preserves history.')) return;
    setWorking(`delete-${id}`);
    const response = await fetch(`/api/outreach-crm/partners/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setPartners((items) => items.filter((item) => item.id !== id));
      if (selectedId === id) setSelectedId('');
    }
    setWorking('');
  }

  async function addNote() {
    if (!selected?.id || !noteDraft.trim()) return;
    setWorking('note');
    await fetch(`/api/outreach-crm/partners/${selected.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Note', notes: noteDraft.trim() }),
    });
    setNoteDraft('');
    await load();
    setWorking('');
  }

  async function deleteNote(id: string) {
    if (!window.confirm('Delete this note?')) return;
    setWorking(`note-${id}`);
    await fetch(`/api/outreach-crm/notes/${id}`, { method: 'DELETE' });
    await load();
    setWorking('');
  }

  async function addTask() {
    if (!selected?.id || !taskDraft.title.trim()) return;
    setWorking('task');
    await fetch(`/api/outreach-crm/partners/${selected.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskDraft),
    });
    setTaskDraft({ title: '', due_date: '', priority: 'Normal' });
    await load();
    setWorking('');
  }

  async function updateTask(id: string, data: Record<string, any>) {
    setWorking(`task-${id}`);
    await fetch(`/api/outreach-crm/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await load();
    setWorking('');
  }

  async function deleteTask(id: string) {
    if (!window.confirm('Delete this task?')) return;
    setWorking(`task-${id}`);
    await fetch(`/api/outreach-crm/tasks/${id}`, { method: 'DELETE' });
    await load();
    setWorking('');
  }

  async function addFileLink() {
    if (!selected?.id || !fileDraft.url.trim()) return;
    setWorking('file');
    await fetch(`/api/outreach-crm/partners/${selected.id}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileDraft),
    });
    setFileDraft({ title: '', url: '' });
    await load();
    setWorking('');
  }

  async function uploadAsset(file?: File | null) {
    if (!selected?.id || !file) return;
    setWorking('asset-upload');
    setActionNotice('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });
      const uploadResponse = await fetch('/api/integrations/upload-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: file.name, data_url: dataUrl }),
      });
      const upload = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(upload.error || 'Upload failed');
      await fetch(`/api/outreach-crm/partners/${selected.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: file.name, url: upload.file_url, file_type: upload.content_type || 'asset' }),
      });
      setActionNotice(`${file.name} uploaded and linked.`);
      await load();
    } catch {
      setActionNotice('Asset upload failed. Use PNG, JPG, WebP, GIF, or PDF under 4MB.');
    } finally {
      setWorking('');
    }
  }

  async function deleteFileLink(id: string) {
    if (!window.confirm('Delete this file link?')) return;
    setWorking(`file-${id}`);
    await fetch(`/api/outreach-crm/files/${id}`, { method: 'DELETE' });
    await load();
    setWorking('');
  }

  async function saveTemplateEditor() {
    if (!selected?.message?.id) return;
    setWorking('template');
    await patchMessage(selected.message.id, templateDraft);
    setTemplateEditorOpen(false);
    setWorking('');
  }

  function applyTemplatePreset(key: string) {
    const preset = emailTemplatePresets[key] || emailTemplatePresets.default;
    setTemplateDraft((draft) => ({
      ...draft,
      email_headline: selected?.name ? `${clean(selected.name)}: ${preset.headline}` : preset.headline,
      email_subheadline: selected?.suggested_perk || selected?.suggested_campaign || preset.subheadline,
      cta_label: preset.cta,
      cta_href: draft.cta_href || '/partners/register',
      secondary_cta_label: draft.secondary_cta_label || 'View map idea',
      secondary_cta_href: draft.secondary_cta_href || selected?.downtown_perks_map_url || selected?.google_maps_url || '/map',
    }));
    setTemplateEditorOpen(true);
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

  const authLabel = !configured ? 'Supabase pending' : user ? 'Sign out' : 'Google login';
  const authValue = authLoading ? 'Checking' : user ? 'Connected' : configured ? 'Ready' : 'Setup';

  if (loading) {
    return <div className="p-8 text-sm font-semibold text-[#0B1F33]">Loading outreach CRM.</div>;
  }

  return (
    <div className="dp-outreach-crm-page w-full max-w-none space-y-3 p-4 text-left text-[#0B1F33] sm:p-5">
      <section className="grid gap-3 xl:grid-cols-[1fr_520px] xl:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Partner growth</p>
          <h1 className="mt-1 text-xl font-semibold tracking-normal sm:text-2xl">Outreach CRM</h1>
          <p className="mt-1 max-w-3xl text-[11px] leading-5 text-[rgba(11,31,51,0.62)]">
            Review partners, confirm contact details, create outreach, schedule follow-ups, and track every next step.
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
              <a key={format.key} href={`/api/outreach-crm/export.${format.key}${exportQuery}`} className="inline-flex min-h-8 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-2 text-[9.5px] font-semibold uppercase text-[#0B1F33] hover:border-[#C8A96A]">
                <Download className="h-3 w-3" /> {format.label}
              </a>
            ))}
          </div>
          {actionNotice && <p className="mt-1 text-[10px] font-semibold text-[rgba(11,31,51,0.58)]">{actionNotice}</p>}
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
                <a href={`/api/outreach-crm/export.json?ids=${encodeURIComponent(selectedIds.join(','))}`} className="inline-flex min-h-8 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-2 text-[9.5px] font-semibold uppercase text-[#0B1F33]"><Download className="h-3 w-3" /> JSON</a>
                <button onClick={() => setSelectedIds([])} type="button" className="inline-flex min-h-8 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-2 text-[9.5px] font-semibold uppercase"><X className="h-3 w-3" /> Clear</button>
              </div>
            </div>
          )}
          <div className="dp-crm-table-scroll overflow-x-auto" role="region" aria-label="Scrollable partner directory table" tabIndex={0}>
            <table className="dp-outreach-crm-table w-full min-w-[1804px] table-fixed text-left">
              <colgroup>
                <col className="w-[42px]" />
                <col className="w-[240px]" />
                <col className="w-[116px]" />
                <col className="w-[116px]" />
                <col className="w-[220px]" />
                <col className="w-[230px]" />
                <col className="w-[230px]" />
                <col className="w-[72px]" />
                <col className="w-[150px]" />
                <col className="w-[112px]" />
                <col className="w-[276px]" />
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
                  <th>Quick actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((partner) => (
                  <tr key={partner.id} className={`cursor-pointer border-t border-[rgba(11,31,51,0.045)] hover:bg-[#F8F9FB] ${selected?.id === partner.id ? 'bg-[#FBFAF6] outline outline-1 outline-[#C8A96A]/35' : ''}`} onClick={() => openPartner(partner)}>
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
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className="dp-crm-row-actions grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => markContacted(partner.id)}
                          className="inline-flex min-h-7 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-1.5 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                        >
                          <CheckCircle2 className={`h-3 w-3 ${working === `contacted-${partner.id}` ? 'animate-spin' : ''}`} /> Contacted
                        </button>
                        <button
                          type="button"
                          onClick={() => scheduleFollowUp(partner.id)}
                          className="inline-flex min-h-7 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-1.5 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                        >
                          <CalendarPlus className={`h-3 w-3 ${working === `followup-${partner.id}` ? 'animate-spin' : ''}`} /> Follow up
                        </button>
                        <button
                          type="button"
                          onClick={() => generateMessage(partner.id, true)}
                          className="inline-flex min-h-7 items-center gap-1 border border-[#C8A96A] px-1.5 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                        >
                          <Send className={`h-3 w-3 ${working === 'generate' ? 'animate-spin' : ''}`} /> Generate
                        </button>
                        <button
                          type="button"
                          onClick={() => copyText(partner.sms_message?.body || '')}
                          className="inline-flex min-h-7 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-1.5 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                        <a
                          href={`/api/outreach-crm/partners/${partner.id}/email.html`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-7 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-1.5 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                        >
                          <Eye className="h-3 w-3" /> Email
                        </a>
                        {partner.website && (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-7 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-1.5 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                          >
                            <ExternalLink className="h-3 w-3" /> Site
                          </a>
                        )}
                        {partner.google_maps_url && (
                          <a
                            href={partner.google_maps_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-7 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-1.5 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                          >
                            <MapPin className="h-3 w-3" /> Map
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => archivePartner(partner.id)}
                          className="inline-flex min-h-7 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-1.5 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                        >
                          <Archive className={`h-3 w-3 ${working === `archive-${partner.id}` ? 'animate-spin' : ''}`} /> Archive
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePartner(partner.id)}
                          className="inline-flex min-h-7 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-1.5 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                        >
                          <Trash2 className={`h-3 w-3 ${working === `delete-${partner.id}` ? 'animate-spin' : ''}`} /> Remove
                        </button>
                      </div>
                    </td>
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
            <section className="dp-crm-compact-edit mt-4 border-t border-[rgba(11,31,51,0.08)] pt-3">
              <p className="text-[9px] font-bold uppercase text-[#C8A96A]">Contact edits</p>
              <div className="mt-2 grid gap-1.5">
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
              {(selected.message?.strategy || selected.message?.intelligence) && (
                <div className="mb-2 border border-[rgba(11,31,51,0.08)] p-2.5">
                  <p className="text-[9px] font-bold uppercase text-[#C8A96A]">Message notes</p>
                  <div className="mt-2 grid gap-1.5 text-[11px] leading-5 text-[rgba(11,31,51,0.68)]">
                    <p><span className="font-semibold text-[#0B1F33]">Angle:</span> {clean(selected.message?.strategy?.angle || selected.message?.intelligence?.recommended_angle)}</p>
                    <p><span className="font-semibold text-[#0B1F33]">Audience:</span> {clean(selected.message?.strategy?.audience || selected.message?.intelligence?.audience)}</p>
                    <p><span className="font-semibold text-[#0B1F33]">Benefit:</span> {clean(selected.message?.strategy?.benefit || selected.message?.intelligence?.strategic_benefit)}</p>
                    <p><span className="font-semibold text-[#0B1F33]">Details used:</span> {clean(selected.message?.strategy?.specificity_score)}</p>
                    {selected.message?.guardrail && <p><span className="font-semibold text-[#0B1F33]">Writing note:</span> {selected.message.guardrail}</p>}
                  </div>
                </div>
              )}
              <div className="mt-3 overflow-hidden border border-[rgba(11,31,51,0.08)]">
                <div className="flex items-center justify-between gap-2 border-b border-[rgba(11,31,51,0.08)] px-3 py-1.5">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Downtown Perks HTML email</span>
                    <p className="mt-0.5 text-[10px] text-[rgba(11,31,51,0.5)]">Previewed with this partner’s name, type, perk, image, and CTA settings.</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/api/outreach-crm/partners/${selected.id}/email.html`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] font-semibold uppercase text-[#0B1F33] hover:text-[#C8A96A]"
                    >
                      Open HTML
                    </a>
                    <button
                      type="button"
                      onClick={() => copyText(selected.message?.html || '')}
                      className="min-h-6 text-[9px] font-semibold uppercase text-[#0B1F33]"
                    >
                      Copy HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateEditorOpen((value) => !value)}
                      className="min-h-6 text-[9px] font-semibold uppercase text-[#0B1F33]"
                    >
                      Edit template
                    </button>
                  </span>
                </div>
                <div className="grid gap-2 border-b border-[rgba(11,31,51,0.08)] p-2.5 sm:grid-cols-[150px_1fr_auto] sm:items-end">
                  <label className="grid gap-1">
                    <span className="text-[8.5px] font-semibold uppercase text-[rgba(11,31,51,0.46)]">Template</span>
                    <select
                      defaultValue={presetKeyForPartner(selected)}
                      onChange={(event) => applyTemplatePreset(event.target.value)}
                      className="min-h-7 border border-[rgba(11,31,51,0.1)] bg-white px-2 text-[10.5px] outline-none"
                    >
                      {Object.entries(emailTemplatePresets).map(([key, preset]) => (
                        <option key={key} value={key}>{preset.label}</option>
                      ))}
                    </select>
                  </label>
                  <p className="text-[10.5px] leading-4 text-[rgba(11,31,51,0.58)]">
                    The preview uses the saved email body plus template settings. Save changes to rebuild the production HTML.
                  </p>
                  <button
                    type="button"
                    onClick={() => generateMessage(selected.id)}
                    className="inline-flex min-h-7 items-center gap-1 border border-[#C8A96A] px-2 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                  >
                    <RefreshCw className={`h-3 w-3 ${working === 'generate' ? 'animate-spin' : ''}`} /> Refresh copy
                  </button>
                </div>
                {templateEditorOpen && (
                  <div className="grid gap-2 border-b border-[rgba(11,31,51,0.08)] p-2.5">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <TemplateInput label="Subject" value={templateDraft.subject} onChange={(value) => setTemplateDraft((draft) => ({ ...draft, subject: value }))} />
                      <TemplateInput label="Headline" value={templateDraft.email_headline} onChange={(value) => setTemplateDraft((draft) => ({ ...draft, email_headline: value }))} />
                      <TemplateInput label="Subheadline" value={templateDraft.email_subheadline} onChange={(value) => setTemplateDraft((draft) => ({ ...draft, email_subheadline: value }))} />
                      <TemplateInput label="Banner image URL" value={templateDraft.banner_image_url} onChange={(value) => setTemplateDraft((draft) => ({ ...draft, banner_image_url: value }))} />
                      <TemplateInput label="Logo URL" value={templateDraft.logo_url} onChange={(value) => setTemplateDraft((draft) => ({ ...draft, logo_url: value }))} />
                      <TemplateInput label="CTA label" value={templateDraft.cta_label} onChange={(value) => setTemplateDraft((draft) => ({ ...draft, cta_label: value }))} />
                      <TemplateInput label="CTA URL" value={templateDraft.cta_href} onChange={(value) => setTemplateDraft((draft) => ({ ...draft, cta_href: value }))} />
                      <TemplateInput label="Map link label" value={templateDraft.secondary_cta_label} onChange={(value) => setTemplateDraft((draft) => ({ ...draft, secondary_cta_label: value }))} />
                      <TemplateInput label="Map link URL" value={templateDraft.secondary_cta_href} onChange={(value) => setTemplateDraft((draft) => ({ ...draft, secondary_cta_href: value }))} />
                      <TemplateInput label="Footer note" value={templateDraft.footer_note} onChange={(value) => setTemplateDraft((draft) => ({ ...draft, footer_note: value }))} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={saveTemplateEditor}
                        className="inline-flex min-h-7 items-center gap-1 border border-[#C8A96A] px-2 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                      >
                        <Save className={`h-3 w-3 ${working === 'template' ? 'animate-spin' : ''}`} /> Save template
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateEditorOpen(false)}
                        className="inline-flex min-h-7 items-center gap-1 border border-[rgba(11,31,51,0.08)] px-2 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                      >
                        Close editor
                      </button>
                    </div>
                  </div>
                )}
                <iframe
                  title={`${clean(selected.name)} branded email preview`}
                  srcDoc={selected.message?.html || ''}
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                  className="h-[420px] w-full border-0 bg-white"
                />
              </div>
            </div>

            <section className="mt-4 border-t border-[rgba(11,31,51,0.08)] pt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase text-[#C8A96A]">Notes</p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase text-[rgba(11,31,51,0.42)]">{selected.crm_notes?.length || 0} saved</p>
                </div>
              </div>
              <div className="mt-2 grid gap-1.5">
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Add a note for this partner"
                  className="min-h-[72px] w-full resize-y border border-[rgba(11,31,51,0.1)] p-2 text-[11px] leading-4 outline-none"
                />
                <button
                  type="button"
                  onClick={addNote}
                  className="inline-flex min-h-7 w-fit items-center gap-1 border border-[#C8A96A] px-2 text-[8.5px] font-semibold uppercase text-[#0B1F33]"
                >
                  <Plus className={`h-3 w-3 ${working === 'note' ? 'animate-spin' : ''}`} /> Add note
                </button>
                {(selected.crm_notes || []).map((note) => (
                  <div key={note.id} className="border border-[rgba(11,31,51,0.08)] p-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-semibold text-[#0B1F33]">{clean(note.title)}</p>
                      <button type="button" onClick={() => deleteNote(note.id)} className="text-[8.5px] font-semibold uppercase text-[rgba(11,31,51,0.48)]">Delete</button>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[10.5px] leading-4 text-[rgba(11,31,51,0.62)]">{clean(note.notes)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-4 border-t border-[rgba(11,31,51,0.08)] pt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase text-[#C8A96A]">Tasks</p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase text-[rgba(11,31,51,0.42)]">{selected.tasks?.length || 0} active</p>
                </div>
              </div>
              <div className="mt-2 grid gap-1.5">
                <div className="grid gap-1.5 sm:grid-cols-[1fr_116px_92px_auto]">
                  <input
                    value={taskDraft.title}
                    onChange={(event) => setTaskDraft((draft) => ({ ...draft, title: event.target.value }))}
                    placeholder="Task title"
                    className="min-h-7 border border-[rgba(11,31,51,0.1)] px-2 text-[10.5px] outline-none"
                  />
                  <input
                    type="date"
                    value={taskDraft.due_date}
                    onChange={(event) => setTaskDraft((draft) => ({ ...draft, due_date: event.target.value }))}
                    className="min-h-7 border border-[rgba(11,31,51,0.1)] px-2 text-[10.5px] outline-none"
                  />
                  <select
                    value={taskDraft.priority}
                    onChange={(event) => setTaskDraft((draft) => ({ ...draft, priority: event.target.value }))}
                    className="min-h-7 border border-[rgba(11,31,51,0.1)] bg-white px-2 text-[10.5px] outline-none"
                  >
                    <option>Normal</option>
                    <option>High</option>
                    <option>Low</option>
                  </select>
                  <button type="button" onClick={addTask} className="inline-flex min-h-7 items-center gap-1 border border-[#C8A96A] px-2 text-[8.5px] font-semibold uppercase text-[#0B1F33]">
                    <Plus className={`h-3 w-3 ${working === 'task' ? 'animate-spin' : ''}`} /> Add
                  </button>
                </div>
                {(selected.tasks || []).map((task) => (
                  <div key={task.id} className="border border-[rgba(11,31,51,0.08)] p-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold text-[#0B1F33]">{clean(task.title)}</p>
                        <p className="mt-1 text-[9.5px] font-semibold uppercase text-[rgba(11,31,51,0.45)]">
                          {task.metadata?.due_date || 'No date'} · {task.metadata?.priority || 'Normal'} · {task.status || 'open'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => updateTask(task.id, { status: task.status === 'complete' ? 'open' : 'complete' })} className="text-[8.5px] font-semibold uppercase text-[#0B1F33]">
                          {task.status === 'complete' ? 'Reopen' : 'Complete'}
                        </button>
                        <button type="button" onClick={() => deleteTask(task.id)} className="text-[8.5px] font-semibold uppercase text-[rgba(11,31,51,0.48)]">Delete</button>
                      </div>
                    </div>
                    {task.notes && <p className="mt-1 text-[10.5px] leading-4 text-[rgba(11,31,51,0.62)]">{task.notes}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-4 border-t border-[rgba(11,31,51,0.08)] pt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase text-[#C8A96A]">Files</p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase text-[rgba(11,31,51,0.42)]">{selected.files?.length || 0} assets linked</p>
                </div>
                <label className="inline-flex min-h-7 cursor-pointer items-center gap-1 border border-[rgba(11,31,51,0.1)] px-2 text-[8.5px] font-semibold uppercase text-[#0B1F33] hover:border-[#C8A96A]">
                  <Upload className={`h-3 w-3 ${working === 'asset-upload' ? 'animate-spin' : ''}`} /> Upload
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" className="sr-only" onChange={(event) => void uploadAsset(event.target.files?.[0])} />
                </label>
              </div>
              <div className="mt-2 grid gap-1.5">
                <div className="grid gap-1.5 sm:grid-cols-[140px_1fr_auto]">
                  <input
                    value={fileDraft.title}
                    onChange={(event) => setFileDraft((draft) => ({ ...draft, title: event.target.value }))}
                    placeholder="File label"
                    className="min-h-7 border border-[rgba(11,31,51,0.1)] px-2 text-[10.5px] outline-none"
                  />
                  <input
                    value={fileDraft.url}
                    onChange={(event) => setFileDraft((draft) => ({ ...draft, url: event.target.value }))}
                    placeholder="https://..."
                    className="min-h-7 border border-[rgba(11,31,51,0.1)] px-2 text-[10.5px] outline-none"
                  />
                  <button type="button" onClick={addFileLink} className="inline-flex min-h-7 items-center gap-1 border border-[#C8A96A] px-2 text-[8.5px] font-semibold uppercase text-[#0B1F33]">
                    <FileText className={`h-3 w-3 ${working === 'file' ? 'animate-spin' : ''}`} /> Link
                  </button>
                </div>
                {(selected.files || []).map((file) => (
                  <div key={file.id} className="flex items-center justify-between gap-2 border border-[rgba(11,31,51,0.08)] p-2">
                    <a href={file.metadata?.url || '#'} target="_blank" rel="noreferrer" className="min-w-0 truncate text-[11px] font-semibold text-[#0B1F33] hover:text-[#C8A96A]">
                      {clean(file.title)}
                    </a>
                    <button type="button" onClick={() => deleteFileLink(file.id)} className="shrink-0 text-[8.5px] font-semibold uppercase text-[rgba(11,31,51,0.48)]">Delete</button>
                  </div>
                ))}
              </div>
            </section>

            <ActivityFeed activities={selected.activities || []} />
          </aside>
        )}
      </section>

      {messageModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0B1F33]/24 p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="Generated outreach message">
          <button className="fixed inset-0 cursor-default" type="button" aria-label="Close generated message" onClick={() => setMessageModal(null)} />
          <div className="relative mt-8 w-full max-w-2xl border border-[rgba(11,31,51,0.08)] bg-white p-4 text-left text-[#0B1F33]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase text-[#C8A96A]">Generated outreach</p>
                <h2 className="mt-1 text-[18px] font-semibold">{clean(messageModal.partner.name)}</h2>
                <p className="mt-1 text-[11px] leading-4 text-[rgba(11,31,51,0.58)]">Review, edit, copy, or open this partner to keep tuning before anything is sent.</p>
              </div>
              <button type="button" onClick={() => setMessageModal(null)} className="inline-flex h-8 w-8 items-center justify-center border border-[rgba(11,31,51,0.08)]" aria-label="Close generated outreach modal">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <EditableMessage
                icon={<MessageSquare className="h-4 w-4" />}
                title="Short text / DM"
                body={clean(messageModal.sms?.body)}
                onCopy={() => copyText(messageModal.sms?.body || '')}
                onSave={(value) => patchMessage(messageModal.sms?.id, { body: value })}
              />
              <EditableMessage
                icon={<Mail className="h-4 w-4" />}
                title={clean(messageModal.email?.subject)}
                body={clean(messageModal.email?.body)}
                onCopy={() => copyText(messageModal.email?.body || '')}
                onSave={(value) => patchMessage(messageModal.email?.id, { body: value })}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  openPartner(messageModal.partner);
                  setMessageModal(null);
                }}
                className="inline-flex min-h-8 items-center gap-1.5 border border-[#C8A96A] px-2.5 text-[9px] font-semibold uppercase text-[#0B1F33]"
              >
                Open partner
              </button>
              <button type="button" onClick={() => setMessageModal(null)} className="inline-flex min-h-8 items-center gap-1.5 border border-[rgba(11,31,51,0.08)] px-2.5 text-[9px] font-semibold uppercase text-[#0B1F33]">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
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
  const initialValue = clean(value) === missing ? '' : clean(value);
  const [draft, setDraft] = useState(initialValue);
  useEffect(() => setDraft(clean(value) === missing ? '' : clean(value)), [value]);
  return (
    <label className="grid gap-0.5">
      <span className="text-[8.5px] font-semibold uppercase text-[rgba(11,31,51,0.46)]">
        {label}
      </span>
      <div className="flex gap-1.5">
        <input value={draft} placeholder={needsVerify ? missing : ''} onChange={(event) => setDraft(event.target.value)} className="min-h-7 flex-1 border border-[rgba(11,31,51,0.1)] px-2 text-[10.5px] leading-4 outline-none placeholder:text-[rgba(11,31,51,0.34)]" />
        <button onClick={() => onSave(draft.trim())} type="button" className="min-h-7 border border-[#C8A96A] px-2 text-[8.5px] font-semibold uppercase">Save</button>
      </div>
    </label>
  );
}

function TemplateInput({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-[8.5px] font-semibold uppercase text-[rgba(11,31,51,0.46)]">{label}</span>
      <input
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-7 border border-[rgba(11,31,51,0.1)] px-2 text-[10.5px] leading-4 outline-none"
      />
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
