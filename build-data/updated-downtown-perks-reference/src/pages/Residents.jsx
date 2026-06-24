import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Search, Mail, Phone, Loader2, Star, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { cn } from "@/lib/utils";
import EditorialHero from '@/components/editorial/EditorialHero';

export default function Residents() {
  const { buildingId } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResidents, setSelectedResidents] = useState(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState({});
  const queryClient = useQueryClient();

  const { data: residents = [], isLoading } = useQuery({
    queryKey: ['residents', buildingId],
    queryFn: () => base44.entities.Tenant.list(),
    enabled: !!buildingId,
  });

  const { data: flats = [] } = useQuery({
    queryKey: ['flats', buildingId],
    queryFn: () => base44.entities.Flat.filter({ building_id: buildingId }),
    enabled: !!buildingId,
  });

  const enrichedResidents = residents
    .map(r => ({ ...r, flat: flats.find(f => f.id === r.flat_id) }))
    .filter(r => r.flat); // only residents in this building

  const filtered = enrichedResidents.filter(r =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.flat?.flat_number?.includes(searchTerm)
  );

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates) => {
      const res = await base44.functions.invoke('bulkUpdateResidents', { updates });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['residents', buildingId]);
      setSelectedResidents(new Set());
      setBulkEditMode(false);
      setBulkUpdates({});
      alert(`Successfully updated ${data.updated_count} resident(s)`);
    },
    onError: (error) => {
      alert('Failed to update residents: ' + (error.message || ''));
    },
  });

  const toggleResident = (residentId) => {
    const newSelected = new Set(selectedResidents);
    if (newSelected.has(residentId)) {
      newSelected.delete(residentId);
    } else {
      newSelected.add(residentId);
    }
    setSelectedResidents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedResidents.size === filtered.length) {
      setSelectedResidents(new Set());
    } else {
      setSelectedResidents(new Set(filtered.map(r => r.id)));
    }
  };

  const handleBulkUpdate = (field, value) => {
    setBulkUpdates(prev => ({ ...prev, [field]: value }));
  };

  const applyBulkUpdates = () => {
    const updates = [];
    selectedResidents.forEach(residentId => {
      Object.entries(bulkUpdates).forEach(([field, value]) => {
        updates.push({ id: residentId, field, value });
      });
    });
    bulkUpdateMutation.mutate(updates);
  };

  return (
    <div className="min-h-screen bg-bgMain">
      {/* Editorial Hero */}
      <EditorialHero
        eyebrow="Residents"
        headline="The people who make downtown feel like home."
        support="Your community directory — search residents, check perks enrollment, and view lease details."
      >
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-textMuted">{filtered.length} residents</div>
          <div className="flex items-center gap-3">
            {selectedResidents.size > 0 && (
              <span className="text-xs text-gold font-semibold">{selectedResidents.size} selected</span>
            )}
            <Button
              variant={bulkEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setBulkEditMode(!bulkEditMode)}
              disabled={selectedResidents.size === 0}
              className="gap-2"
            >
              {bulkEditMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              Bulk Edit
            </Button>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <Input
                placeholder="Search by name, email, unit…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-bgAlt border-[var(--border-subtle)] text-sm"
              />
            </div>
          </div>
        </div>
      </EditorialHero>

      {/* Bulk Edit Toolbar */}
      {bulkEditMode && selectedResidents.size > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-gold/10 border border-gold/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">Bulk Edit Mode</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setBulkEditMode(false); setBulkUpdates({}); setSelectedResidents(new Set()); }}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={applyBulkUpdates}
                  disabled={bulkUpdateMutation.isPending || Object.keys(bulkUpdates).length === 0}
                  className="bg-gold text-navy hover:bg-gold/90"
                >
                  {bulkUpdateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Apply to {selectedResidents.size} Resident{selectedResidents.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-navy mb-1.5 block">Payment Status</label>
                <select
                  value={bulkUpdates.payment_status || ''}
                  onChange={(e) => handleBulkUpdate('payment_status', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold"
                >
                  <option value="">No change</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-navy mb-1.5 block">Perks Tier</label>
                <select
                  value={bulkUpdates.perks_tier || ''}
                  onChange={(e) => handleBulkUpdate('perks_tier', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold"
                >
                  <option value="">No change</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-navy mb-1.5 block">Perks Enrolled</label>
                <select
                  value={bulkUpdates.perks_enrolled !== undefined ? String(bulkUpdates.perks_enrolled) : ''}
                  onChange={(e) => handleBulkUpdate('perks_enrolled', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold"
                >
                  <option value="">No change</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-navy mb-1.5 block">Notes</label>
                <input
                  type="text"
                  value={bulkUpdates.notes || ''}
                  onChange={(e) => handleBulkUpdate('notes', e.target.value)}
                  placeholder="Add note..."
                  className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-gold/20 focus:border-gold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-textMuted" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Users className="w-10 h-10 text-textMuted/40 mx-auto mb-3" />
            <p className="text-textSecondary font-medium">No residents found</p>
            <p className="text-textMuted text-sm">Try adjusting your search</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden">
            {filtered.map((resident, idx) => {
              const isSelected = selectedResidents.has(resident.id);
              return (
                <div
                  key={resident.id}
                  className={cn(
                    'flex items-center gap-4 px-6 py-4 hover:bg-bgAlt transition-colors',
                    idx !== filtered.length - 1 && 'border-b border-[var(--border-subtle)]',
                    isSelected && 'bg-gold/5'
                  )}
                >
                  {/* Checkbox for bulk edit */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleResident(resident.id)}
                    className="shrink-0"
                  />

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0 font-bold text-gold text-sm">
                    {resident.name?.charAt(0).toUpperCase()}
                  </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy text-sm">{resident.name}</span>
                    {resident.perks_enrolled && (
                      <span className="inline-flex items-center gap-1 text-xs bg-gold/10 text-gold px-1.5 py-0.5 rounded-full font-medium">
                        <Star className="w-3 h-3" /> Perks
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-textMuted">Unit {resident.flat?.flat_number}</span>
                    {resident.email && (
                      <a href={`mailto:${resident.email}`} onClick={e => e.stopPropagation()} className="text-xs text-textMuted hover:text-navy flex items-center gap-1 transition-colors">
                        <Mail className="w-3 h-3" /> {resident.email}
                      </a>
                    )}
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3 shrink-0">
                  {resident.mobile_number && (
                    <a href={`tel:${resident.mobile_number}`} onClick={e => e.stopPropagation()} className="hidden md:flex items-center gap-1 text-xs text-textMuted hover:text-navy transition-colors">
                      <Phone className="w-3 h-3" /> {resident.mobile_number}
                    </a>
                  )}
                  <Badge className={cn(
                    "text-xs",
                    resident.perks_tier === 'vip' && 'bg-gold/15 text-gold border-gold/20',
                    resident.perks_tier === 'premium' && 'bg-blue-50 text-blue-600 border-blue-100',
                    resident.perks_tier === 'standard' && 'bg-bgAlt text-textSecondary border-[var(--border-subtle)]'
                  )}>
                    {resident.perks_tier?.charAt(0).toUpperCase() + resident.perks_tier?.slice(1)}
                  </Badge>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    resident.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  )}>
                    {resident.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                  {resident.lease_end_date && (
                    <span className="text-xs text-textMuted hidden lg:block">
                      Lease ends {new Date(resident.lease_end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}