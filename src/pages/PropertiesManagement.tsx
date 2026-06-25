import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  DatabaseZap,
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
      if (!res.ok) throw new Error('Failed to ingest');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_properties'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(`Successfully ingested ${data.length} properties from AI`);
      setIsIngesting(false);
      setIngestText('');
    },
    onError: () => {
      toast.error('Failed to ingest data via AI. Check API Key.');
    }
  });

  const mapSyncMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/map-data/import', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to sync map data');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_properties'] });
      toast.success(`Map data synced: ${data.imported_count || 0} records checked`);
    },
    onError: () => {
      toast.error('Map data sync failed');
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
      { label: 'Properties', value: properties.length, detail: 'property-like records' },
      { label: 'Workspaces', value: workspaces, detail: 'tenant shells provisioned' },
      { label: 'Map Linked', value: mapLinked, detail: 'entities with map presence' },
      { label: 'Locations', value: locations, detail: 'managed locations' },
      { label: 'Campaigns', value: campaigns, detail: 'connected campaigns' },
    ];
  }, [properties]);

  const openWorkspace = (prop: Property) => {
    const slug = prop.workspacePath?.replace('/tenant/', '') || prop.workspace_id?.replace(/^workspace_/, '') || prop.tenant_id || '';
    window.location.href = slug ? `/workspace/home?workspace=${encodeURIComponent(slug)}` : '/workspace/home';
  };

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--dp-gold)]">Admin portfolio</p>
            <h1 className="mt-2 text-3xl font-bold text-[#11182B]">Properties</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-textMuted">
              Navigate every property, residential listing, building tenant, and real estate workspace connected to the Downtown Perks platform.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={() => mapSyncMut.mutate()} disabled={mapSyncMut.isPending} className="min-h-11 gap-2 text-[#0B1F33]">
              {mapSyncMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
              Sync map data
            </Button>
            <Button variant="outline" onClick={() => setIsIngesting(true)} className="min-h-11 gap-2 text-[#0B1F33]">
              <Sparkles className="h-4 w-4 text-[#C5A028]" />
              AI ingest
            </Button>
            <Button onClick={() => setIsAdding(true)} className="min-h-11 gap-2 text-[#0B1F33]">
              <Plus className="h-4 w-4" />
              Add property
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {portfolioStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-textMuted">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-[#11182B]">{stat.value}</p>
                <p className="mt-1 text-sm text-textMuted">{stat.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {isIngesting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-xl border border-[var(--border-subtle)] bg-white p-6 shadow-lg">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#11182B]">
                <Sparkles className="h-5 w-5 text-[#C5A028]" /> AI property ingestion
              </h2>
              <p className="mb-4 text-sm leading-6 text-textMuted">
                Paste property notes from an email, broker listing, or asset report. The system extracts the property record for review before it joins the admin portfolio.
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
              <h2 className="mb-2 text-lg font-bold text-[#11182B]">{isEditing ? 'Edit property record' : 'Add property record'}</h2>
              {isEditing?.source_type !== 'building' && (
                <p className="mb-6 text-sm leading-6 text-textMuted">
                  Imported tenant records are managed through workspace/profile data. Saving here creates a standalone admin property record instead of rewriting the imported tenant.
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

        <div className="mb-6 flex items-center border border-[var(--border-subtle)] bg-white p-2">
          <Search className="ml-3 h-4 w-4 text-textSecondary" />
          <input
            type="text"
            placeholder="Search by property, district, source, workspace, or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent px-4 py-2 text-sm outline-none"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-textMuted" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProps.map(prop => {
              const canEditBuilding = prop.source_type === 'building' && !prop.tenant_id;
              return (
                <article key={prop.id} className="group flex h-full flex-col border border-[var(--border-subtle)] bg-white">
                  <div className="border-b border-[var(--border-subtle)] p-5">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-textMuted">{prop.category || prop.type || 'Property'}</p>
                        <h3 className="mt-2 text-xl font-bold leading-tight text-[#11182B]">{prop.name}</h3>
                      </div>
                      <span className="shrink-0 border border-[var(--border-subtle)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0B1F33]">
                        {prop.status || 'active'}
                      </span>
                    </div>
                    <p className="flex gap-2 text-sm leading-6 text-textMuted">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#C8A96A]" />
                      <span>{prop.address || prop.district || 'No address listed'}</span>
                    </p>
                    <p className="mt-3 text-xs text-textMuted">
                      {prop.workspacePath ? `Workspace: ${prop.workspacePath.replace('/tenant/', '')}` : 'Workspace not linked'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-[var(--border-subtle)]">
                    {[
                      ['Units / listings', prop.totalUnits || prop.listings || 0],
                      ['Locations', prop.locations || 0],
                      ['Campaigns', prop.campaigns || 0],
                      ['Map links', prop.mapLinks || 0],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-textMuted">{label}</p>
                        <p className="mt-2 text-lg font-bold text-[#11182B]">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-5 flex flex-wrap gap-2">
                      <span className="border border-[var(--border-subtle)] px-2 py-1 text-xs text-textMuted">
                        {prop.source_type || 'platform'}
                      </span>
                      <span className="border border-[var(--border-subtle)] px-2 py-1 text-xs text-textMuted">
                        {prop.map_presence || 'map pending'}
                      </span>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-mono text-textMuted">ID: {prop.id.substring(0, 12)}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => openWorkspace(prop)} className="min-h-11 gap-2 text-[#0B1F33]">
                          <ExternalLink className="h-4 w-4" />
                          Workspace
                        </Button>
                        {canEditBuilding && (
                          <>
                            <Button variant="ghost" className="min-h-11 w-11 p-0 text-[#0B1F33]" onClick={() => setIsEditing(prop)} aria-label={`Edit ${prop.name}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" className="min-h-11 w-11 p-0 text-rose-600" onClick={() => {
                              if (confirm('Are you sure you want to delete this property?')) deletePropMut.mutate(prop.id);
                            }} aria-label={`Delete ${prop.name}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredProps.length === 0 && (
              <div className="col-span-full border border-dashed border-[var(--border-subtle)] bg-white p-12 text-center">
                <Building2 className="mx-auto mb-4 h-8 w-8 text-textMuted" />
                <p className="font-semibold text-[#11182B]">No properties found</p>
                <p className="mt-2 text-sm text-textMuted">Try a different search, or sync the latest map data.</p>
                <Button variant="outline" onClick={() => mapSyncMut.mutate()} className="mx-auto mt-5 min-h-11 gap-2 text-[#0B1F33]">
                  Sync map data
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
