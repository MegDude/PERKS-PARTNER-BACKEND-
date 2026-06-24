import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLanguage } from '@/components/context/LanguageContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, Search, Users, MoreVertical, Edit, Trash2, 
  MessageCircle, Phone, Building2, Loader2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import TenantModal from '@/components/tenants/TenantModal';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Tenants() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  const danaMembers = [
    { id: '1', name: 'Jorge Barajas', title: 'Assistant Building Manager', building: '360 Condominiums', email: 'jbarajas@somersetassociations.com', phone: '512-904-5602', address: '360 Nueces St.' },
    { id: '2', name: 'Terry Arterburn', title: 'General Manager', building: '360 Condominiums', email: 'tarterburn@somersetassociations.com', phone: '512-904-5601', address: '360 Nueces St.' },
    { id: '3', name: 'Anna Anami', title: 'Property Manager', building: '904 West', email: 'anna@theboutiquerealestate.com', phone: '637-9500', address: 'Austin' },
    { id: '4', name: 'Paula Rothermal', title: 'General Manager', building: 'Austin City Lofts', email: 'aclmgr@gmail.com', phone: '512-473-8555', address: 'Austin' },
    { id: '5', name: 'Robert Kim', title: 'Building Manager', building: '210 Lavaca', email: 'rkim@lavaca.com', phone: '512-555-0201', address: '210 Lavaca St' },
    { id: '6', name: 'Maria Garcia', title: 'Assistant Manager', building: '210 Lavaca', email: 'mgarcia@lavaca.com', phone: '512-555-0202', address: '210 Lavaca St' },
    { id: '7', name: 'James Thompson', title: 'Property Manager', building: '84 East Ave', email: 'jthompson@eastave.com', phone: '512-555-0301', address: '84 East Ave' },
    { id: '8', name: 'Lisa Chen', title: 'Building Manager', building: '610 Davis', email: 'lchen@davis.com', phone: '512-555-0401', address: '610 Davis St' },
    { id: '9', name: 'David Park', title: 'General Manager', building: '1800 Lavaca', email: 'dpark@lavaca1800.com', phone: '512-555-0501', address: '1800 Lavaca St' },
  ];

  const mockTenants = danaMembers;

  const { data: tenants = mockTenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => Promise.resolve(mockTenants)
  });

  const buildings = [...new Set(tenants.map(t => t.building))].sort();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tenant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants']);
      setShowAddModal(false);
      toast.success(t('tenantAdded'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tenant.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants']);
      setShowAddModal(false);
      setEditingTenant(null);
      toast.success(t('tenantUpdated'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tenant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants']);
      setDeleteConfirm(null);
      toast.success(t('tenantRemoved'));
    }
  });



  const handleSaveTenant = (data) => {
    if (editingTenant) {
      updateMutation.mutate({ id: editingTenant.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredTenants = tenants
    .filter(t => {
      const matchesSearch = t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.building?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBuilding = selectedBuilding === 'all' || t.building === selectedBuilding;
      return matchesSearch && matchesBuilding;
    })
    .sort((a, b) => a.name?.localeCompare(b.name));

  const isAdmin = user?.role === 'admin';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-navy">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">{t('allTenants')}</h1>
              <p className="text-sm text-textMuted">{tenants.length} {t('tenantsRegistered')}</p>
            </div>
          </div>
          
          {isAdmin && (
            <Button 
              onClick={() => {
                setEditingTenant(null);
                setShowAddModal(true);
              }}
              className="bg-gold text-navy hover:bg-goldSoft"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Manager
            </Button>
          )}
        </motion.div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <Input
                placeholder={`${t('search')}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="w-48">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select Building" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buildings</SelectItem>
                {buildings.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-bgAlt">
                <TableHead>Building</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-textMuted">
                    No building managers found
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {filteredTenants.map((tenant, idx) => (
                    <motion.tr
                      key={tenant.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-bgAlt"
                    >
                      <TableCell className="font-semibold text-navy">{tenant.building}</TableCell>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell className="text-sm text-textSecondary">{tenant.title}</TableCell>
                      <TableCell>
                        <a 
                          href={`mailto:${tenant.email}`}
                          className="flex items-center gap-1.5 text-textSecondary hover:text-navy"
                        >
                          {tenant.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`tel:${tenant.phone}`}
                          className="flex items-center gap-1.5 text-textSecondary hover:text-navy"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {tenant.phone}
                        </a>
                      </TableCell>
                      <TableCell className="text-sm text-textSecondary">{tenant.address}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.location.href = `mailto:${tenant.email}`}>
                              <MessageCircle className="w-4 h-4 mr-2 text-blue-600" />
                              Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.location.href = `tel:${tenant.phone}`}>
                              <Phone className="w-4 h-4 mr-2 text-green-600" />
                              Call
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {isAdmin && (
        <>
          <TenantModal
            open={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setEditingTenant(null);
            }}
            tenant={editingTenant}
            onSave={handleSaveTenant}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />

          <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('removeTenant')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('confirmRemove')} {deleteConfirm?.name}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                >
                  {t('remove')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}