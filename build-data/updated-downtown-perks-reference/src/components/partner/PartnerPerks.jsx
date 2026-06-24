import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Edit2, Save, Upload, Loader2, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PartnerPerks({ perks, redemptions }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [editingPerk, setEditingPerk] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);

  const updatePerkMutation = useMutation({
    mutationFn: ({ id, data }) => base44.functions.invoke('updatePartnerPerk', { perk_id: id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner_context'] });
      setShowEditModal(false);
      setEditingPerk(null);
      toast.success('Perk updated successfully!');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => base44.functions.invoke('updatePartnerPerk', { perk_id: id, data: { is_active: !isActive } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner_context'] });
      toast.success('Perk status updated');
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }) => base44.functions.invoke('updatePartnerPerk', { perk_id: id, data: { is_featured: !isFeatured } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner_context'] });
      toast.success('Featured status updated');
    },
  });

  const handleEditPerk = (perk) => {
    setEditingPerk(perk);
    setFormData(perk);
    setShowEditModal(true);
  };

  const handleSavePerk = () => {
    if (!editingPerk) return;
    updatePerkMutation.mutate({
      id: editingPerk.id,
      data: {
        perk: formData.perk,
        specials: formData.specials,
        deals_offers: formData.deals_offers,
        hours: formData.hours,
        contact_phone: formData.contact_phone,
      },
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editingPerk) return;
    setUploading(true);
    try {
      const uploadedFile = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, events_available: uploadedFile.file_url });
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error('Failed to upload image: ' + (error.message || ''));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Card className="bg-white border-[var(--border-subtle)]">
        <CardHeader>
          <CardTitle className="text-navy">Your Perks</CardTitle>
          <CardDescription>Manage and update your perk listings</CardDescription>
        </CardHeader>
        <CardContent>
          {perks.length === 0 ? (
            <p className="text-center py-8 text-textMuted">No perks listed yet. Contact support to add your perks.</p>
          ) : (
            <div className="space-y-3">
              {perks.map((perk, i) => {
                const perkRedemptionCount = redemptions.filter(r => r.perk_id === perk.id).length;
                return (
                  <motion.div
                    key={perk.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      'p-4 border rounded-xl transition-all',
                      perk.is_active
                        ? 'border-[var(--border-subtle)] hover:bg-bgAlt/50'
                        : 'border-[var(--border-subtle)] bg-bgAlt/30 opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-navy">{perk.name}</h3>
                          {perk.is_featured && (
                            <span className="flex items-center gap-1 text-xs bg-gold/15 text-gold px-2 py-0.5 rounded-full font-medium">
                              <Star className="w-3 h-3" /> Featured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-textMuted">{perk.category}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFeaturedMutation.mutate({ id: perk.id, isFeatured: perk.is_featured })}
                          className="p-2 hover:bg-gold/10 rounded-lg transition-colors"
                          title={perk.is_featured ? 'Unfeature' : 'Mark as featured'}
                        >
                          {perk.is_featured
                            ? <ToggleRight className="w-5 h-5 text-gold" />
                            : <ToggleLeft className="w-5 h-5 text-textMuted" />}
                        </button>
                        <button
                          onClick={() => toggleActiveMutation.mutate({ id: perk.id, isActive: perk.is_active })}
                          className="p-2 hover:bg-bgAlt rounded-lg transition-colors"
                          title={perk.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <span className={cn('text-xs font-semibold', perk.is_active ? 'text-green-600' : 'text-textMuted')}>
                            {perk.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditPerk(perk)} className="text-gold hover:bg-gold/10">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-textMuted mb-1">Current Offer</p>
                        <p className="text-sm text-navy font-medium">{perk.perk || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-textMuted mb-1">Redemptions</p>
                        <p className="text-sm text-gold font-bold">{perkRedemptionCount}</p>
                      </div>
                    </div>

                    <div className="text-xs text-textSecondary space-y-1">
                      {perk.specials && <p><strong>Specials:</strong> {perk.specials}</p>}
                      {perk.deals_offers && <p><strong>Deals:</strong> {perk.deals_offers}</p>}
                      {perk.hours && <p><strong>Hours:</strong> {perk.hours}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Perk Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Edit Perk</DialogTitle>
            <DialogDescription>{editingPerk?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-navy uppercase mb-1 block">Main Offer</label>
              <Input
                value={formData.perk || ''}
                onChange={(e) => setFormData({ ...formData, perk: e.target.value })}
                placeholder="e.g., 20% off all items"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-navy uppercase mb-1 block">Specials</label>
              <Input
                value={formData.specials || ''}
                onChange={(e) => setFormData({ ...formData, specials: e.target.value })}
                placeholder="e.g., Happy hour 5-7pm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-navy uppercase mb-1 block">Deals & Offers</label>
              <Input
                value={formData.deals_offers || ''}
                onChange={(e) => setFormData({ ...formData, deals_offers: e.target.value })}
                placeholder="e.g., Buy one get one 50% off"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-navy uppercase mb-1 block">Operating Hours</label>
              <Input
                value={formData.hours || ''}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="e.g., Mon-Fri 5pm-2am"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-navy uppercase mb-1 block">Contact Phone</label>
              <Input
                value={formData.contact_phone || ''}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="e.g., (512) 555-0100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-navy uppercase mb-2 block">Perk Image</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border-subtle)] rounded-lg p-4 text-center cursor-pointer hover:bg-bgAlt transition-all"
              >
                {formData.events_available ? (
                  <img src={formData.events_available} alt="Perk" className="w-full h-32 object-cover rounded mb-2" />
                ) : (
                  <Upload className="w-6 h-6 mx-auto text-textMuted mb-1" />
                )}
                <p className="text-xs text-textMuted">Click to upload image</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button
                onClick={handleSavePerk}
                disabled={updatePerkMutation.isPending || uploading}
                className="bg-gold hover:bg-gold/90 text-navy"
              >
                {updatePerkMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Save className="w-4 h-4 mr-1" /> Save</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}