import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Star, TrendingUp, Users, Activity, RefreshCw, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import TenantModal from '@/components/tenants/TenantModal';
import TenantDetailsSheet from '@/components/tenants/TenantDetailsSheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import SurveyActivity from '@/components/surveys/SurveyActivity';

const TREND_DATA = [
  { month: 'Jan', enrolled: 45, redeemed: 32 },
  { month: 'Feb', enrolled: 52, redeemed: 38 },
  { month: 'Mar', enrolled: 68, redeemed: 48 },
  { month: 'Apr', enrolled: 85, redeemed: 62 },
];

export default function Dashboard() {
  const { buildingId, building } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tenants = [], isLoading, refetch } = useQuery({
    queryKey: ['tenants', buildingId],
    queryFn: () => base44.entities.Tenant.list(),
    enabled: !!buildingId,
  });

  const { data: flats = [] } = useQuery({
    queryKey: ['flats', buildingId],
    queryFn: () => base44.entities.Flat.filter({ building_id: buildingId }),
    enabled: !!buildingId,
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list()
  });

  const { data: perks = [] } = useQuery({
    queryKey: ['perk_locations'],
    queryFn: () => base44.entities.PerkLocation.list()
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['redemptions'],
    queryFn: () => base44.entities.PerkRedemption.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tenant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants', buildingId]);
      setShowAddModal(false);
      setSelectedFlat(null);
      toast.success('Resident added');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tenant.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants', buildingId]);
      setShowAddModal(false);
      setEditingTenant(null);
      setShowDetailsSheet(false);
      toast.success('Resident updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tenant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants', buildingId]);
      setDeleteConfirm(null);
      setShowDetailsSheet(false);
      setSelectedTenant(null);
      toast.success('Resident removed');
    }
  });

  const markPaidMutation = useMutation({
    mutationFn: async (tenant) => {
      const lastPaymentDate = new Date().toISOString().split('T')[0];
      const cycleMonths = tenant.rent_interval_months || 6;
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + cycleMonths);
      const nextPaymentDate = nextDate.toISOString().split('T')[0];
      await base44.entities.Tenant.update(tenant.id, {
        payment_status: 'paid',
        last_payment_date: lastPaymentDate,
        next_payment_date: nextPaymentDate
      });
      const message = `Thank you! Payment received. Next payment due: ${new Date(nextPaymentDate).toLocaleDateString()}`;
      const phone = tenant.mobile_number?.replace(/\D/g, '');
      if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants', buildingId]);
      toast.success('Receipt sent');
    }
  });

  const handleSaveTenant = (data) => {
    if (editingTenant) {
      updateMutation.mutate({ id: editingTenant.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isAdmin = user?.role === 'admin';
  const buildingTenants = tenants.filter(t => flats.some(f => f.id === t.flat_id));
  const perksEnrolled = buildingTenants.filter(t => t.perks_enrolled).length;
  const premiumTier = buildingTenants.filter(t => t.perks_tier === 'premium' || t.perks_tier === 'vip').length;
  const occupancyRate = flats.length > 0 ? Math.round((buildingTenants.length / flats.length) * 100) : 0;

  const filteredTenants = buildingTenants.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Total Residents', value: buildingTenants.length, sub: `${flats.length} units total`, icon: Users, color: 'text-navy' },
    { label: 'Perks Enrolled', value: perksEnrolled, sub: `${buildingTenants.length > 0 ? Math.round((perksEnrolled / buildingTenants.length) * 100) : 0}% enrollment`, icon: Star, color: 'text-gold' },
    { label: 'Premium Members', value: premiumTier, sub: 'VIP & Premium tier', icon: Activity, color: 'text-navy' },
    { label: 'Occupancy', value: `${occupancyRate}%`, sub: `${buildingTenants.length} of ${flats.length} units`, icon: TrendingUp, color: 'text-navy' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <Loader2 className="w-8 h-8 animate-spin text-textMuted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-soft">
<div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-textMuted uppercase tracking-wide">{stat.label}</span>
                  <Icon className={cn('w-4 h-4', stat.color)} />
                </div>
                <div className={cn('text-3xl font-bold mb-1', stat.color)}>{stat.value}</div>
                <div className="text-xs text-textMuted">{stat.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-navy">Perks Enrollment Trend</h3>
              <p className="text-sm text-textMuted mt-0.5">Monthly enrollment vs redemptions</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8A97A6' }} />
              <YAxis tick={{ fontSize: 12, fill: '#8A97A6' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="enrolled" stroke="#C9A227" strokeWidth={2.5} dot={false} name="Enrolled" />
              <Line type="monotone" dataKey="redeemed" stroke="#0B1F33" strokeWidth={2.5} dot={false} name="Redeemed" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Residents Section */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-navy">Residents</h3>
              <p className="text-sm text-textMuted">{filteredTenants.length} residents in this building</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <Input
                  placeholder="Search residents…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-52 bg-bgMain border-0 text-sm"
                />
              </div>
              <button onClick={() => refetch()} className="p-2 hover:bg-bgAlt rounded-lg transition-colors">
                <RefreshCw className={cn('w-4 h-4 text-textMuted', isLoading && 'animate-spin')} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => { setSelectedFlat(null); setEditingTenant(null); setShowAddModal(true); }}
                  className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-navySoft transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Resident
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-textMuted" />
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-textMuted/40 mx-auto mb-3" />
              <p className="text-textSecondary font-medium">No residents found</p>
              <p className="text-textMuted text-sm">
                {searchQuery ? 'Try a different search term' : 'Add residents to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTenants.map((tenant) => {
                const flat = flats.find(f => f.id === tenant.flat_id);
                return (
                  <button
                    key={tenant.id}
                    onClick={() => { setSelectedTenant(tenant); setShowDetailsSheet(true); }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-bgAlt transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0 font-bold text-gold">
                      {tenant.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy text-sm">{tenant.name}</div>
                      <div className="text-xs text-textMuted">
                        {flat ? `Unit ${flat.flat_number}` : ''}{tenant.email ? ` · ${tenant.email}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {tenant.perks_enrolled && (
                        <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Star className="w-3 h-3" /> Perks
                        </span>
                      )}
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        tenant.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      )}>
                        {tenant.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-textMuted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Partner Performance */}
        {partners.length > 0 && (
          <div className="bg-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-navy">Partner Performance</h3>
                <p className="text-sm text-textMuted">Active partners and redemptions</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partners.slice(0, 4).map((partner) => {
                const partnerPerks = perks.filter(p => p.partner_id === partner.id);
                const partnerRedemptions = redemptions.filter(r => partnerPerks.some(p => p.id === r.perk_id));
                const uniqueUsers = new Set(partnerRedemptions.map(r => r.user_email)).size;

                return (
                  <div key={partner.id} className="flex items-center gap-4 p-4 bg-bgMain rounded-xl">
                    <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">{partner.business_name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy text-sm truncate">{partner.business_name}</div>
                      <div className="text-xs text-textMuted">{partner.category}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-gold">{partnerRedemptions.length}</div>
                      <div className="text-xs text-textMuted">{uniqueUsers} users</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Survey Activity */}
      <SurveyActivity buildingId={buildingId} />

      <TenantModal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setSelectedFlat(null); setEditingTenant(null); }}
        tenant={editingTenant}
        flatId={selectedFlat?.id}
        flatNumber={selectedFlat?.flat_number}
        onSave={handleSaveTenant}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <TenantDetailsSheet
        open={showDetailsSheet}
        onClose={() => { setShowDetailsSheet(false); setSelectedTenant(null); }}
        tenant={selectedTenant}
        onEdit={() => {
          if (!isAdmin) { toast.error('Only admins can edit residents'); return; }
          setEditingTenant(selectedTenant);
          setShowDetailsSheet(false);
          setShowAddModal(true);
        }}
        onDelete={() => {
          if (!isAdmin) { toast.error('Only admins can remove residents'); return; }
          setDeleteConfirm(selectedTenant);
        }}
        onMarkPaid={() => markPaidMutation.mutate(selectedTenant)}
        isUpdating={markPaidMutation.isPending}
        isAdmin={isAdmin}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Resident</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {deleteConfirm?.name} from the building? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate(deleteConfirm.id)}>
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}