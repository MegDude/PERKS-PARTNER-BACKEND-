import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Edit2, Save, Upload, TrendingUp, Users, Star, Calendar, Loader2 } from 'lucide-react';

export default function PartnerPortal() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<any>(null);
  const [user, setUser] = useState<any>(null);
  const [editingPerk, setEditingPerk] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [uploading, setUploading] = useState(false);

  useQuery({
    queryKey: ['current_user'],
    queryFn: async () => {
      try {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
          return currentUser;
      } catch {
          return null;
      }
    },
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
        try {
            return await base44.entities.Partner.list();
        } catch {
            return [];
        }
    },
  });

  const { data: perks = [] } = useQuery({
    queryKey: ['partner_perks'],
    queryFn: async () => {
      try {
          if (!user) return [];
          const allPerks = await base44.entities.PerkLocation.list();
          const userPartner = (partners as any[]).find((p: any) => p.contact_email === user.email);
          return userPartner ? (allPerks as any[]).filter((p: any) => p.partner_id === userPartner.id) : [];
      } catch {
          return [];
      }
    },
    enabled: !!user,
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['redemptions'],
    queryFn: async () => {
        try {
            return await base44.entities.PerkRedemption.list();
        } catch {
            return [];
        }
    },
  });

  const updatePerkMutation = useMutation({
    mutationFn: ({ id, data }: any) => base44.entities.PerkLocation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['partner_perks']});
      setShowEditModal(false);
      setEditingPerk(null);
    },
  });

  const userPartner = (partners as any[]).find((p: any) => p.contact_email === user?.email);

  const perkRedemptions = (redemptions as any[]).filter((r: any) => (perks as any[]).some((p: any) => p.id === r.perk_id));
  const monthlyData = [
    { month: 'Jan', redemptions: 0 },
    { month: 'Feb', redemptions: 0 },
    { month: 'Mar', redemptions: 0 },
    { month: 'Apr', redemptions: 0 },
  ];

  perkRedemptions.forEach(r => {
    const month = new Date(r.redeemed_at).getMonth();
    if (month < 4) monthlyData[month].redemptions += 1;
  });

  const uniqueUsers = new Set(perkRedemptions.map(r => r.user_email)).size;
  const totalRedemptions = perkRedemptions.length;
  const avgPerPerk = (perks as any[]).length > 0 ? Math.round(totalRedemptions / (perks as any[]).length) : 0;

  const handleEditPerk = (perk: any) => {
    setEditingPerk(perk);
    setFormData(perk);
    setShowEditModal(true);
  };

  const handleSavePerk = async () => {
    if (!editingPerk) return;
    updatePerkMutation.mutate({
      id: editingPerk.id,
      data: {
        perk: formData.perk,
        specials: formData.specials,
        deals_offers: formData.deals_offers,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-[#11182B] mb-1">Partner Portal</h1>
        <p className="text-slate-500 mb-4 font-medium">Manage your perks and track performance</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Redemptions', value: totalRedemptions, icon: Star },
          { label: 'Unique Customers', value: uniqueUsers, icon: Users },
          { label: 'Active Perks', value: (perks as any[]).length, icon: Calendar },
          { label: 'Avg per Perk', value: avgPerPerk, icon: TrendingUp },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#C5A028]">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-[#C5A028]" /> {stat.label}
                </div>
                <div className="text-base font-medium tracking-tight text-[#11182B]">{stat.value}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-8">
        <Card className="  ">
          <CardHeader>
            <CardTitle className="text-[#11182B] font-bold">Monthly Redemptions</CardTitle>
            <CardDescription className="font-medium text-slate-500">Redemption trends for your perks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} dx={-10} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="redemptions" fill="#11182B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
