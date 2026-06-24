import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Home, Plus, Edit, Trash2, Loader2, Building2 } from 'lucide-react';
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

const roomTypes = ['Studio', '1-Bedroom', '2-Bedroom', '3-Bedroom', '4-Bedroom', 'Penthouse'];

export default function Apartments() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFlat, setEditingFlat] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    building_id: '',
    flat_number: '',
    floor: '',
    room_type: '',
    layout_details: ''
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

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: apartments = [], isLoading } = useQuery({
    queryKey: ['apartments'],
    queryFn: () => base44.entities.Flat.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Flat.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['apartments']);
      setShowModal(false);
      resetForm();
      toast.success('Apartment added successfully!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Flat.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['apartments']);
      setShowModal(false);
      setEditingFlat(null);
      resetForm();
      toast.success('Apartment updated successfully!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Flat.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['apartments']);
      setDeleteConfirm(null);
      toast.success('Apartment deleted successfully!');
    }
  });

  const resetForm = () => {
    setFormData({
      building_id: '',
      flat_number: '',
      floor: '',
      room_type: '',
      layout_details: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, floor: parseInt(formData.floor) };
    if (editingFlat) {
      updateMutation.mutate({ id: editingFlat.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (apartment) => {
    setEditingFlat(apartment);
    setFormData({
      building_id: apartment.building_id || '',
      flat_number: apartment.flat_number || '',
      floor: apartment.floor || '',
      room_type: apartment.room_type || '',
      layout_details: apartment.layout_details || ''
    });
    setShowModal(true);
  };

  const getBuildingName = (buildingId) => {
    const building = buildings.find(b => b.id === buildingId);
    return building ? building.name : '-';
  };

  const isAdmin = user?.role === 'admin';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-600">Only administrators can manage apartments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain p-6">
      <div className="max-w-7xl mx-auto">
        {/* Explanation Section */}
        <div className="mb-10 p-6 bg-gradient-to-r from-gold/10 to-transparent border border-gold/30 rounded-2xl">
          <h2 className="text-lg font-semibold text-navy mb-2">Unit Inventory Management</h2>
          <p className="text-textSecondary text-sm leading-relaxed">
            Maintain a complete inventory of all residential units across your portfolio. Track unit details, occupancy status, and configurations. Add or edit units as your inventory changes. This is the foundation of your tenant and engagement tracking.
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-navy">{t('apartments')}</h1>
          <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-gold text-navy hover:bg-goldSoft">
            <Plus className="w-4 h-4 mr-2" />
            {t('addApartment')}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('buildingName')}</TableHead>
                  <TableHead>{t('flatNumber')}</TableHead>
                  <TableHead>{t('floor')}</TableHead>
                  <TableHead>{t('roomType')}</TableHead>
                  <TableHead>{t('layoutDetails')}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apartments.map((apartment) => (
                  <TableRow key={apartment.id}>
                    <TableCell className="font-medium">{getBuildingName(apartment.building_id)}</TableCell>
                    <TableCell>{apartment.flat_number}</TableCell>
                    <TableCell>{apartment.floor}</TableCell>
                    <TableCell>{apartment.room_type}</TableCell>
                    <TableCell className="text-sm text-slate-600">{apartment.layout_details || '-'}</TableCell>
                    <TableCell>
                      <Badge className={apartment.is_occupied ? 'bg-red-500' : 'bg-green-500'}>
                        {apartment.is_occupied ? t('occupied') : t('vacant')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(apartment)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeleteConfirm(apartment)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) { setEditingFlat(null); resetForm(); } }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFlat ? t('editApartment') : t('addApartment')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('buildingName')}</Label>
                  <Select value={formData.building_id} onValueChange={(val) => setFormData({ ...formData, building_id: val })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select building" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('flatNumber')}</Label>
                  <Input value={formData.flat_number} onChange={(e) => setFormData({ ...formData, flat_number: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('floor')}</Label>
                  <Input type="number" min="0" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('roomType')}</Label>
                  <Select value={formData.room_type} onValueChange={(val) => setFormData({ ...formData, room_type: val })} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('layoutDetails')}</Label>
                <Input value={formData.layout_details} onChange={(e) => setFormData({ ...formData, layout_details: e.target.value })} placeholder="e.g., 2 WC, Kitchen, Hall" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditingFlat(null); resetForm(); }}>
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-gold text-navy hover:bg-goldSoft">
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
              <AlertDialogTitle>Delete Apartment?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete Apartment #{deleteConfirm?.flat_number}?
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