import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building2, Pencil, Trash2, Link as LinkIcon, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Property {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  tenants: number;
  accessCode: string;
  status?: string;
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
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await fetch('/api/properties');
      if (!res.ok) throw new Error('Failed to fetch properties');
      return res.json();
    }
  });

  const deletePropMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
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
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(`Successfully ingested ${data.length} properties from AI`);
      setIsIngesting(false);
      setIngestText('');
    },
    onError: () => {
      toast.error('Failed to ingest data via AI. Check API Key.');
    }
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amenitiesSplit = formData.get('amenities')?.toString().split(',').map(s => s.trim()).filter(Boolean) || [];
    const photosSplit = formData.get('photos')?.toString().split(',').map(s => s.trim()).filter(Boolean) || [];
    
    savePropMut.mutate({
      id: isEditing?.id,
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      totalUnits: Number(formData.get('totalUnits')),
      status: formData.get('status') as string,
      amenities: amenitiesSplit,
      photos: photosSplit
    });
  };

  const filteredProps = properties.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#11182B]">Property Management</h1>
            <p className="text-sm text-textMuted mt-1">Manage global portfolio, units, photos, and status.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => setIsIngesting(true)} className="gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A028]" />
                Auto-Ingest via AI
             </Button>
             <Button onClick={() => setIsAdding(true)} className="bg-[#11182B] text-white hover:bg-[#1f2b4e]">
                <Plus className="w-4 h-4 mr-2" /> Add Property
             </Button>
          </div>
        </div>

        {/* AI Ingest Modals */}
        {isIngesting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-none p-6 w-full max-w-xl shadow-lg border border-[var(--border-subtle)] relative">
              <h2 className="text-xl font-bold text-[#11182B] mb-4 flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-[#C5A028]" /> AI Property Ingestion
              </h2>
              <p className="text-sm text-textMuted mb-4">
                 Paste property notes from an email, broker listing, or asset report. The system will extract the name, address, unit count, status, amenities, and media links for review.
              </p>
              <textarea 
                value={ingestText}
                onChange={(e) => setIngestText(e.target.value)}
                placeholder="The Quincy is at 91 Red River St with 220 units, a resident lounge, pool deck, coworking space, and active leasing."
                className="w-full h-40 p-3 border border-[var(--border-subtle)] text-sm mb-4 resize-none"
              />
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsIngesting(false)} disabled={ingestMut.isPending}>Cancel</Button>
                <Button onClick={() => ingestMut.mutate(ingestText)} disabled={!ingestText.trim() || ingestMut.isPending} className="bg-[#11182B] text-white gap-2">
                  {ingestMut.isPending && <Loader2 className="w-4 h-4 animate-spin"/>}
                  Review Property
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {(isAdding || isEditing) && (
          <Card className="mb-8 border-[var(--border-subtle)] bg-white rounded-none shadow-none">
            <CardContent className="p-6">
               <h2 className="text-lg font-bold text-[#11182B] mb-6">{isEditing ? 'Edit Property' : 'Add Property'}</h2>
               <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">Name</label>
                    <input name="name" defaultValue={isEditing?.name} required className="w-full p-3 border border-[var(--border-subtle)] text-sm bg-bgMain" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">Address</label>
                    <input name="address" defaultValue={isEditing?.address} required className="w-full p-3 border border-[var(--border-subtle)] text-sm bg-bgMain" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">Total Units</label>
                    <input name="totalUnits" type="number" defaultValue={isEditing?.totalUnits} required className="w-full p-3 border border-[var(--border-subtle)] text-sm bg-bgMain" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">Status</label>
                    <select name="status" defaultValue={isEditing?.status || 'available'} className="w-full p-3 border border-[var(--border-subtle)] text-sm bg-bgMain">
                       <option value="available">Available</option>
                       <option value="occupied">Occupied</option>
                       <option value="under maintenance">Under Maintenance</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">Amenities (comma separated)</label>
                    <input name="amenities" defaultValue={isEditing?.amenities?.join(', ')} placeholder="Rooftop pool, resident lounge, coworking studio" className="w-full p-3 border border-[var(--border-subtle)] text-sm bg-bgMain" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-textSecondary">Photos (comma separated URLs)</label>
                    <input name="photos" defaultValue={isEditing?.photos?.join(', ')} placeholder="Paste approved image URLs for the property profile" className="w-full p-3 border border-[var(--border-subtle)] text-sm bg-bgMain" />
                  </div>
                  <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
                    <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); setIsEditing(null); }}>Cancel</Button>
                    <Button type="submit" disabled={savePropMut.isPending} className="bg-[#11182B] text-white">
                      {savePropMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Property'}
                    </Button>
                  </div>
               </form>
            </CardContent>
          </Card>
        )}

        <div className="bg-white border border-[var(--border-subtle)] mb-6 p-2 flex items-center">
            <Search className="w-4 h-4 text-textSecondary ml-3" />
            <input 
              type="text" 
              placeholder="Search properties by name or address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-4 py-2 w-full text-sm outline-none bg-transparent"
            />
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
             <Loader2 className="w-6 h-6 animate-spin text-textMuted" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProps.map(prop => (
               <div key={prop.id} className="border border-[var(--border-subtle)] bg-white group flex flex-col h-full">
                  {/* Photo area */}
                  <div className="aspect-video w-full bg-[#FAFAFA] relative overflow-hidden border-b border-[var(--border-subtle)]">
                     {prop.photos && prop.photos.length > 0 ? (
                        <img src={prop.photos[0]} alt={prop.name} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-textMuted">
                           <Building2 className="w-8 h-8 opacity-20" />
                        </div>
                     )}
                     <div className="absolute top-3 left-3 px-2 py-1 bg-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {prop.status || 'available'}
                     </div>
                  </div>
                  
                  {/* Content area */}
                  <div className="p-5 flex-1 flex flex-col">
                     <h3 className="font-bold text-[#11182B] text-lg leading-tight mb-1">{prop.name}</h3>
                     <p className="text-textMuted text-sm mb-4 line-clamp-1">{prop.address}</p>
                     
                     <div className="grid grid-cols-2 gap-y-3 mb-6">
                        <div>
                           <div className="text-[10px] uppercase font-bold text-textMuted tracking-wider mb-1">Total Units</div>
                           <div className="text-sm font-medium">{prop.totalUnits || 0}</div>
                        </div>
                        <div>
                           <div className="text-[10px] uppercase font-bold text-textMuted tracking-wider mb-1">Tenants</div>
                           <div className="text-sm font-medium">{prop.tenants || 0}</div>
                        </div>
                        <div className="col-span-2">
                           <div className="text-[10px] uppercase font-bold text-textMuted tracking-wider mb-1">Amenities</div>
                           <div className="text-sm text-textSecondary line-clamp-1">
                              {prop.amenities?.length ? prop.amenities.join(', ') : 'None listed'}
                           </div>
                        </div>
                     </div>
                     
                     <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-xs font-mono text-textMuted bg-[#F1F3F7] px-2 py-1">ID: {prop.id.substring(0,8)}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditing(prop)}>
                              <Pencil className="w-4 h-4 text-textSecondary" />
                           </Button>
                           <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50" onClick={() => {
                              if(confirm('Are you sure you want to delete this property?')) deletePropMut.mutate(prop.id);
                           }}>
                              <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
            
            {filteredProps.length === 0 && (
               <div className="col-span-full p-12 text-center text-textMuted border border-dashed border-[var(--border-subtle)]">
                  No properties found.
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
