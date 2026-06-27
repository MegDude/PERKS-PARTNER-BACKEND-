import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  DatabaseZap,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { slugify } from '@/data/partnerWorkspaceCatalog';
import { toast } from 'sonner';

interface Property {
  id: string;
  tenant_id?: string | null;
  workspace_id?: string | null;
  workspacePath?: string;
  name: string;
  address: string;
  district?: string;
  type?: string;
  category?: string;
  totalUnits: number;
  tenants: number;
  listings?: number;
  accessCode?: string;
  status?: string;
  source_type?: string;
  map_presence?: string;
  campaigns?: number;
  mapLinks?: number;
  locations?: number;
  amenities?: string[];
  photos?: string[];
}

export default function PropertiesManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState<Property | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestText, setIngestText] = useState('');

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ['admin_properties'],
    queryFn: async () => {
      const res = await fetch('/api/admin/properties');
      if (!res.ok) throw new Error('Failed to fetch property portfolio');
      return res.json();
    }
  });

  const deletePropMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_properties'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property deleted');
    }
  });

  const savePropMut = useMutation({
    mutationFn: async (prop: Partial<Property>) => {
      const isUpdate = !!prop.id;
      const res = await fetch(`/api/properties${isUpdate ? `/${prop.id}` : ''}`, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prop)
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_properties'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(isEditing?.id ? 'Property updated' : 'Property added');
      setIsEditing(null);
      setIsAdding(false);
    }
  });

  const ingestMut = useMutation({
    mutationFn: async (rawData: string) => {
      const res = await fetch('/api/properties/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawData })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to ingest');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_properties'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(`Reviewed ${data.count || data.records?.length || 0} properties.`);
      setIsIngesting(false);
      setIngestText('');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Those notes could not be reviewed. Please try again.');
    }
  });

  const mapSyncMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/map-data/import', { method: 'POST' });
      if (!res.ok) throw new Error('Map refresh failed');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_properties'] });
      toast.success(`Map refreshed: ${data.imported_count || 0} places checked`);
    },
    onError: () => {
      toast.error('The map could not be refreshed.');
    }
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amenitiesSplit = formData.get('amenities')?.toString().split(',').map(s => s.trim()).filter(Boolean) || [];
    const photosSplit = formData.get('photos')?.toString().split(',').map(s => s.trim()).filter(Boolean) || [];

    savePropMut.mutate({
      id: isEditing?.source_type === 'building' ? isEditing?.id : undefined,
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      totalUnits: Number(formData.get('totalUnits')),
      status: formData.get('status') as string,
      amenities: amenitiesSplit,
      photos: photosSplit
    });
  };

  const filteredProps = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return properties;
    return properties.filter((p) =>
      [
        p.name,
        p.address,
        p.district,
        p.type,
        p.category,
        p.source_type,
        p.workspacePath,
        p.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [properties, search]);

  const portfolioStats = useMemo(() => {
    const workspaces = new Set(properties.map((p) => p.workspace_id).filter(Boolean)).size;
    const mapLinked = properties.filter((p) => Number(p.mapLinks || 0) > 0 || p.map_presence === 'enabled').length;
    const locations = properties.reduce((sum, p) => sum + Number(p.locations || 0), 0);
    const campaigns = properties.reduce((sum, p) => sum + Number(p.campaigns || 0), 0);
    return [
      { label: 'Properties', value: properties.length, detail: 'Places, buildings, and listings available to review', to: '/admin/properties' },
      { label: 'Workspaces', value: workspaces, detail: 'Partner workspaces connected to property records', to: '/admin' },
      { label: 'Map linked', value: mapLinked, detail: 'Properties visible through map or location data', to: '/map' },
      { label: 'Locations', value: locations, detail: 'Managed places attached to property groups', to: '/admin/buildings' },
      { label: 'Campaigns', value: campaigns, detail: 'Campaign activity connected to properties', to: '/admin/engagement' },
    ];
  }, [properties]);

  const openWorkspace = (prop: Property) => {
    const slug = slugify(prop.workspacePath?.replace('/tenant/', '') || prop.workspace_id?.replace(/^workspace_/, '') || prop.tenant_id?.replace(/^tenant_/, '') || prop.name || prop.id);
    window.location.href = slug ? `/admin/workspaces/${encodeURIComponent(slug)}` : '/admin';
  };

  const buildingHref = (prop: Property) => `/admin/buildings/profile?property=${encodeURIComponent(prop.id)}`;

  const exportProperties = () => {
    const rows = filteredProps.map((prop) => ({
      name: prop.name,
      address: prop.address,
      type: prop.category || prop.type || '',
      status: prop.status || '',
      workspace: prop.workspacePath || prop.workspace_id || '',
      map_presence: prop.map_presence || '',
      units: prop.totalUnits || prop.listings || 0,
      locations: prop.locations || 0,
      campaigns: prop.campaigns || 0,
      map_links: prop.mapLinks || 0,
    }));
    const headers = Object.keys(rows[0] || { name: '', address: '', type: '', status: '', workspace: '', map_presence: '', units: '', locations: '', campaigns: '', map_links: '' });
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => `"${String((row as any)[header] ?? '').replaceAll('"', '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'downtown-perks-properties.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 border border-[rgba(11,31,51,0.08)] bg-white p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--dp-gold)]">Property directory</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#11182B]">Properties</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-textMuted">
              Find every property, residential listing, building, and real estate space connected to Downtown Perks. Open the record, map source, or building view from one place.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={() => mapSyncMut.mutate()} disabled={mapSyncMut.isPending} className="min-h-11 gap-2 text-[#0B1F33]">
              {mapSyncMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
              Refresh map
            </Button>
            <Button variant="outline" onClick={() => setIsIngesting(true)} className="min-h-11 gap-2 text-[#0B1F33]">
              <Sparkles className="h-4 w-4 text-[#C5A028]" />
              Review notes
            </Button>
            <Button onClick={() => setIsAdding(true)} className="min-h-11 gap-2 text-[#0B1F33]">
              <Plus className="h-4 w-4" />
              Add property
            </Button>
          </div>
          </div>
        </section>

        <SummaryTable rows={portfolioStats} />

        {isIngesting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-xl border border-[var(--border-subtle)] bg-white p-6 shadow-lg">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#11182B]">
                <Sparkles className="h-5 w-5 text-[#C5A028]" /> Review property notes
              </h2>
              <p className="mb-4 text-sm leading-6 text-textMuted">
                Paste notes from an email, broker listing, or asset report. Downtown Perks will turn them into a clean property draft for review.
              </p>
              <textarea
                value={ingestText}
                onChange={(e) => setIngestText(e.target.value)}
                placeholder="The Quincy is at 91 Red River St with 220 units, a resident lounge, pool deck, coworking space, and active leasing."
                className="mb-4 h-40 w-full resize-none border border-[var(--border-subtle)] bg-white p-3 text-sm"
              />
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsIngesting(false)} disabled={ingestMut.isPending}>Cancel</Button>
                <Button onClick={() => ingestMut.mutate(ingestText)} disabled={!ingestText.trim() || ingestMut.isPending} className="gap-2 text-[#0B1F33]">
                  {ingestMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Review property
                </Button>
              </div>
            </div>
          </div>
        )}

        {(isAdding || isEditing) && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="mb-2 text-lg font-bold text-[#11182B]">{isEditing ? 'Edit property' : 'Add property'}</h2>
              {isEditing?.source_type !== 'building' && (
                <p className="mb-6 text-sm leading-6 text-textMuted">
                  Imported profiles stay connected to their partner space. Saving here creates a separate property profile for your admin directory.
                </p>
              )}
              <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">Name</label>
                  <input name="name" defaultValue={isEditing?.name} required className="w-full border border-[var(--border-subtle)] bg-white p-3 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">Address</label>
                  <input name="address" defaultValue={isEditing?.address} required className="w-full border border-[var(--border-subtle)] bg-white p-3 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">Total units</label>
                  <input name="totalUnits" type="number" defaultValue={isEditing?.totalUnits || 0} required className="w-full border border-[var(--border-subtle)] bg-white p-3 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">Status</label>
                  <select name="status" defaultValue={isEditing?.status || 'active'} className="w-full border border-[var(--border-subtle)] bg-white p-3 text-sm">
                    <option value="active">Active</option>
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="under maintenance">Under maintenance</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">Amenities or profile sections</label>
                  <input name="amenities" defaultValue={isEditing?.amenities?.join(', ')} placeholder="Rooftop pool, resident lounge, coworking studio" className="w-full border border-[var(--border-subtle)] bg-white p-3 text-sm" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">Photos</label>
                  <input name="photos" defaultValue={isEditing?.photos?.join(', ')} placeholder="Paste approved image URLs for the property profile" className="w-full border border-[var(--border-subtle)] bg-white p-3 text-sm" />
                </div>
                <div className="col-span-1 mt-4 flex justify-end gap-3 md:col-span-2">
                  <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); setIsEditing(null); }}>Cancel</Button>
                  <Button type="submit" disabled={savePropMut.isPending} className="text-[#0B1F33]">
                    {savePropMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save property'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <section className="mb-6 border border-[rgba(11,31,51,0.08)] bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <label className="flex min-h-11 items-center gap-2 border-b border-[rgba(11,31,51,0.12)] px-1">
              <Search className="h-4 w-4 text-[#C8A96A]" />
              <input
                type="text"
                placeholder="Search property, district, source, workspace, or address"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent px-2 py-2 text-sm outline-none"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportProperties} className="min-h-11 gap-2 text-[#0B1F33]">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Link to="/admin/buildings" className="inline-flex min-h-11 items-center gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-4 text-sm font-semibold text-[#0B1F33] hover:border-[#C8A96A] hover:text-[#C8A96A]">
                Building operations <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-textMuted" />
          </div>
        ) : (
          <section className="overflow-hidden border border-[rgba(11,31,51,0.08)] bg-white">
            <div className="border-b border-[rgba(11,31,51,0.08)] px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">Properties</p>
              <h2 className="mt-1 text-xl font-semibold text-[#11182B]">Directory and workspace links</h2>
            </div>
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full min-w-[1180px] table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[290px]" />
                  <col className="w-[190px]" />
                  <col className="w-[170px]" />
                  <col className="w-[260px]" />
                  <col className="w-[190px]" />
                  <col className="w-[210px]" />
                </colgroup>
                <thead className="border-b border-[rgba(11,31,51,0.08)] bg-[#FBFCFD] text-[10px] font-bold uppercase tracking-[0.08em] text-textMuted">
                  <tr>
                    <th className="px-5 py-3">Property</th>
                    <th className="border-l border-[rgba(11,31,51,0.06)] px-5 py-3">Status</th>
                    <th className="border-l border-[rgba(11,31,51,0.06)] px-5 py-3">Coverage</th>
                    <th className="border-l border-[rgba(11,31,51,0.06)] px-5 py-3">Workspace</th>
                    <th className="border-l border-[rgba(11,31,51,0.06)] px-5 py-3">Activity</th>
                    <th className="border-l border-[rgba(11,31,51,0.06)] px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(11,31,51,0.08)]">
                  {filteredProps.map(prop => {
                    const canEditBuilding = prop.source_type === 'building' && !prop.tenant_id;
                    return (
                      <tr key={prop.id} className="align-top hover:bg-[#F7F8FB]">
                        <td className="px-5 py-5">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-textMuted">{prop.category || prop.type || 'Property'}</p>
                          <h3 className="mt-1 text-base font-semibold leading-5 text-[#11182B]">{prop.name}</h3>
                          <p className="mt-2 flex gap-2 text-xs leading-5 text-textMuted">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C8A96A]" />
                            <span>{prop.address || prop.district || 'No address listed'}</span>
                          </p>
                        </td>
                        <td className="border-l border-[rgba(11,31,51,0.06)] px-5 py-5">
                          <span className="inline-flex border border-[rgba(11,31,51,0.10)] px-2 py-1 text-[10px] font-bold uppercase text-[#0B1F33]">{prop.status || 'active'}</span>
                          <p className="mt-3 text-xs text-textMuted">{prop.source_type || 'platform'} source</p>
                        </td>
                        <td className="border-l border-[rgba(11,31,51,0.06)] px-5 py-5">
                          <MiniLine label="Units" value={prop.totalUnits || prop.listings || 0} />
                          <MiniLine label="Locations" value={prop.locations || 0} />
                          <MiniLine label="Map links" value={prop.mapLinks || 0} />
                        </td>
                        <td className="border-l border-[rgba(11,31,51,0.06)] px-5 py-5">
                          <p className="text-sm font-semibold text-[#11182B]">{prop.workspacePath ? prop.workspacePath.replace('/tenant/', '') : prop.workspace_id || 'Not linked'}</p>
                          <p className="mt-2 text-xs text-textMuted">{prop.map_presence || 'map pending'}</p>
                        </td>
                        <td className="border-l border-[rgba(11,31,51,0.06)] px-5 py-5">
                          <MiniLine label="Campaigns" value={prop.campaigns || 0} />
                          <MiniLine label="Amenities" value={prop.amenities?.length || 0} />
                          <MiniLine label="Photos" value={prop.photos?.length || 0} />
                        </td>
                        <td className="border-l border-[rgba(11,31,51,0.06)] px-5 py-5">
                          <div className="grid gap-2">
                            <Button variant="outline" onClick={() => openWorkspace(prop)} className="min-h-10 justify-start gap-2 text-[#0B1F33]">
                              <ExternalLink className="h-4 w-4" />
                              Workspace
                            </Button>
                            <Link to={buildingHref(prop)} className="inline-flex min-h-10 items-center justify-start gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-3 text-xs font-semibold text-[#0B1F33] hover:border-[#C8A96A] hover:text-[#C8A96A]">
                              <Building2 className="h-4 w-4" />
                              Building ops
                            </Link>
                            {canEditBuilding && (
                              <div className="flex gap-2">
                                <Button variant="ghost" className="min-h-10 w-10 p-0 text-[#0B1F33]" onClick={() => setIsEditing(prop)} aria-label={`Edit ${prop.name}`}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" className="min-h-10 w-10 p-0 text-rose-600" onClick={() => {
                                  if (confirm('Are you sure you want to delete this property?')) deletePropMut.mutate(prop.id);
                                }} aria-label={`Delete ${prop.name}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredProps.length === 0 && (
              <div className="border border-dashed border-[var(--border-subtle)] bg-white p-12 text-center">
                <Building2 className="mx-auto mb-4 h-8 w-8 text-textMuted" />
                <p className="font-semibold text-[#11182B]">No properties found</p>
                <p className="mt-2 text-sm text-textMuted">Try a different search, or refresh the latest map places.</p>
                <Button variant="outline" onClick={() => mapSyncMut.mutate()} className="mx-auto mt-5 min-h-11 gap-2 text-[#0B1F33]">
                  Refresh map
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function SummaryTable({ rows }: { rows: Array<{ label: string; value: number; detail: string; to: string }> }) {
  return (
    <section className="mb-6 overflow-hidden border border-[rgba(11,31,51,0.08)] bg-white">
      <div className="border-b border-[rgba(11,31,51,0.08)] px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">Portfolio summary</p>
        <h2 className="mt-1 text-xl font-semibold text-[#11182B]">What is ready right now</h2>
      </div>
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[rgba(11,31,51,0.08)] bg-[#FBFCFD] text-[10px] font-bold uppercase tracking-[0.08em] text-textMuted">
            <tr>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">What it means</th>
              <th className="px-4 py-3">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(11,31,51,0.08)]">
            {rows.map((row) => (
              <tr key={row.label} className="hover:bg-[#F7F8FB]">
                <td className="px-4 py-3 font-semibold text-[#11182B]">{row.label}</td>
                <td className="px-4 py-3 text-2xl font-semibold text-[#11182B]">{Number(row.value || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-textMuted">{row.detail}</td>
                <td className="px-4 py-3">
                  <Link to={row.to} className="inline-flex min-h-9 items-center gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-3 text-xs font-semibold text-[#0B1F33] hover:border-[#C8A96A] hover:text-[#C8A96A]">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MiniLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <p className="grid grid-cols-[78px_1fr] gap-2 border-b border-[rgba(11,31,51,0.06)] py-1.5 text-xs last:border-b-0">
      <span className="font-semibold uppercase text-[rgba(11,31,51,0.46)]">{label}</span>
      <span className="font-semibold text-[#11182B]">{value}</span>
    </p>
  );
}
