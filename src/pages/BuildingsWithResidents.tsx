import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Plus, Edit, Trash2, Loader2, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/context/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

export default function BuildingsWithResidents() {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    units: ''
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

  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: flats = [] } = useQuery({
    queryKey: ['flats'],
    queryFn: () => base44.entities.Flat.list()
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => base44.entities.Building.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setShowModal(false);
      resetForm();
      toast.success('Building added successfully!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => base44.entities.Building.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setShowModal(false);
      setEditingBuilding(null);
      resetForm();
      toast.success('Building updated successfully!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => base44.entities.Building.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setDeleteConfirm(null);
      toast.success('Building deleted successfully!');
    }
  });

  const resetForm = () => {
    setFormData({ name: '', address: '', units: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBuilding) {
      updateMutation.mutate({ 
        id: editingBuilding.id, 
        data: { 
          name: formData.name, 
          address: formData.address, 
          units: parseInt(formData.units) || editingBuilding.units 
        } 
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        address: formData.address,
        district: 'downtown',
        tier: 3,
        type: 'apartment',
        lat: 30.2672,
        lng: -97.7431,
        units: parseInt(formData.units) || 10,
        yearBuilt: 2020,
        priceTier: 'premium',
        walkScore: 85,
        perkDensity: 0.8,
        activityScore: 0.9,
      });
    }
  };

  const handleEdit = (building: any) => {
    setEditingBuilding(building);
    setFormData({
      name: building.name || '',
      address: building.address || '',
      units: building.units || ''
    });
    setShowModal(true);
  };

  const getResidentsForBuilding = (buildingId: string) => {
    const buildingFlats = (flats as any[]).filter((f: any) => f.building_id === buildingId);
    return (tenants as any[]).filter((t: any) => buildingFlats.some((f: any) => f.id === t.flat_id));
  };

  const filteredResidents = selectedBuilding 
    ? getResidentsForBuilding(selectedBuilding.id).filter((r: any) =>
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const isAdmin = user?.role === 'admin';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <Loader2 className="w-8 h-8 animate-spin text-textMuted" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#11182B] mb-2">Access Denied</h2>
          <p className="text-textSecondary">Only administrators can manage buildings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain p-6">
      <div className="max-w-7xl mx-auto">
        {/* Explanation Section */}
        <div className="mb-10 p-6 bg-gradient-to-r from-gold/10 to-transparent border border-navy/30 rounded-none">
          <h2 className="text-lg font-semibold text-[#11182B] mb-2">Portfolio Management Hub</h2>
          <p className="text-textSecondary text-sm leading-relaxed mb-3">
            <strong>Buildings:</strong> Manage your portfolio properties. View total units, active residents, and key metrics for each building. Add or edit building information to keep your portfolio data current and accessible.
          </p>
          <p className="text-textSecondary text-sm leading-relaxed">
            <strong>Residents:</strong> Search and filter residents across all buildings. Access contact information, lease details, and perks enrollment status. Use this view for targeted communications and resident engagement initiatives.
          </p>
        </div>

        <Tabs defaultValue="buildings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="buildings" className="gap-2">
              <Building2 className="w-4 h-4" />
              Buildings
            </TabsTrigger>
            <TabsTrigger value="residents" className="gap-2">
              <Users className="w-4 h-4" />
              Residents
            </TabsTrigger>
          </TabsList>

          {/* Buildings Tab */}
          <TabsContent value="buildings">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-[#11182B]">Buildings</h1>
              <Button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="bg-[#11182B] text-white hover:bg-navySoft"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Building
              </Button>
            </div>

            {buildingsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-textMuted" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(buildings as any[]).map((building: any) => {
                  const buildingResidents = getResidentsForBuilding(building.id);
                  return (
                    <Card 
                      key={building.id} 
                      className="hover:shadow-none transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedBuilding(building);
                        // Trigger residents tab - this would require a ref
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-[#11182B]" />
                            {building.name}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-textSecondary">
                          {building.address}
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-bgAlt">
                          <div>
                            <p className="text-xs text-textMuted">Units</p>
                            <p className="text-lg font-semibold text-[#11182B]">{building.units || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-textMuted">Residents</p>
                            <p className="text-lg font-semibold text-[#11182B]">{buildingResidents.length}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-3">
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(building); }}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-[#11182B] hover:text-[#11182B] " onClick={(e) => { e.stopPropagation(); setDeleteConfirm(building); }}>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Residents Tab */}
          <TabsContent value="residents">
            <div className="space-y-4">
              {/* Building Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <Button
                  variant={!selectedBuilding ? "default" : "outline"}
                  onClick={() => setSelectedBuilding(null)}
                  className={!selectedBuilding ? "bg-navy text-white " : ""}
                >
                  All Buildings
                </Button>
                {(buildings as any[]).map((building) => (
                  <Button
                    key={building.id}
                    variant={selectedBuilding?.id === building.id ? "default" : "outline"}
                    onClick={() => setSelectedBuilding(building)}
                    className={selectedBuilding?.id === building.id ? "bg-navy text-white " : ""}
                  >
                    {building.name}
                  </Button>
                ))}
              </div>

              {/* Search */}
              {selectedBuilding && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                  <Input
                    placeholder="Search residents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}

              {/* Residents Table */}
              {selectedBuilding ? (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-bgAlt">
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenantsLoading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto text-textMuted" />
                          </TableCell>
                        </TableRow>
                      ) : filteredResidents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-textMuted">
                            No residents assigned to this building
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredResidents.map((resident: any) => (
                          <TableRow key={resident.id} className="hover:bg-bgAlt">
                            <TableCell className="font-medium">{resident.name}</TableCell>
                            <TableCell className="text-sm text-textSecondary">{resident.email}</TableCell>
                            <TableCell className="text-sm text-textSecondary">{resident.mobile_number}</TableCell>
                            <TableCell>
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                resident.payment_status === 'paid' 
                                  ? 'bg-slate-50 text-[#11182B] ' 
                                  : 'bg-slate-50 text-[#11182B] '
                              }`}>
                                {resident.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <p className="text-textMuted">Select a building to view residents</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Building Dialog */}
        <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) { setEditingBuilding(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBuilding ? 'Edit Building' : 'Add Building'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Building Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Number of Units</Label>
                <Input type="number" min="1" value={formData.units} onChange={(e) => setFormData({ ...formData, units: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditingBuilding(null); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#11182B] text-white hover:bg-navySoft">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Building?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deleteConfirm?.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-slate-50 hover:bg-slate-50" onClick={() => deleteMutation.mutate(deleteConfirm.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
