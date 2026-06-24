import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { H1, H2 } from '@/components/ui/Typography';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/context/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Buildings() {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    address: '',
    address_ar: '',
    total_floors: ''
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      base44.auth.redirectToLogin();
    }
  };

  const { data: buildings = [], isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Building.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['buildings']);
      setShowModal(false);
      resetForm();
      toast.success('Building added successfully!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Building.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['buildings']);
      setShowModal(false);
      setEditingBuilding(null);
      resetForm();
      toast.success('Building updated successfully!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Building.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['buildings']);
      setDeleteConfirm(null);
      toast.success('Building deleted successfully!');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      address: '',
      address_ar: '',
      total_floors: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBuilding) {
      updateMutation.mutate({ id: editingBuilding.id, data: { ...formData, total_floors: parseInt(formData.total_floors) } });
    } else {
      createMutation.mutate({ ...formData, total_floors: parseInt(formData.total_floors) });
    }
  };

  const handleEdit = (building) => {
    setEditingBuilding(building);
    setFormData({
      name: building.name || '',
      name_ar: building.name_ar || '',
      address: building.address || '',
      address_ar: building.address_ar || '',
      total_floors: building.total_floors || ''
    });
    setShowModal(true);
  };

  const isAdmin = user?.role === 'admin';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <div className="text-center">
          <H2 className="text-2xl font-bold text-navy mb-2">Access Denied</H2>
          <p className="text-textSecondary">Only administrators can manage buildings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <H1 className="text-3xl font-bold text-navy">{t('buildings')}</H1>
          <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-gold text-navy hover:bg-goldSoft">
            <Plus className="w-4 h-4 mr-2" />
            {t('addBuilding')}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-navy" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((building) => (
              <Card key={building.id} className="hover:shadow-lg transition-shadow bg-white rounded-[var(--radius-lg)] border-gold/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-slate-600" />
                    {isRTL ? building.name_ar || building.name : building.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-2">
                    {t('address')}: {isRTL ? building.address_ar || building.address : building.address}
                  </p>
                  <p className="text-sm text-slate-600 mb-4">
                    {t('totalFloors')}: {building.total_floors}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(building)}>
                      <Edit className="w-4 h-4 mr-1" />
                      {t('edit')}
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteConfirm(building)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t('delete')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) { setEditingBuilding(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBuilding ? t('editBuilding') : t('addBuilding')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('buildingName')} (English)</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t('buildingName')} (عربي)</Label>
                <Input value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} dir="rtl" />
              </div>
              <div className="space-y-2">
                <Label>{t('address')} (English)</Label>
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t('address')} (عربي)</Label>
                <Input value={formData.address_ar} onChange={(e) => setFormData({ ...formData, address_ar: e.target.value })} dir="rtl" />
              </div>
              <div className="space-y-2">
                <Label>{t('totalFloors')}</Label>
                <Input type="number" min="1" value={formData.total_floors} onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditingBuilding(null); resetForm(); }}>
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t('save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Building?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deleteConfirm?.name}? This will also delete all flats in this building.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate(deleteConfirm.id)}>
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}