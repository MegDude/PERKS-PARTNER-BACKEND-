import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { H1, Body } from '@/components/ui/Typography';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Mail, TrendingUp, Users, MessageSquare, Building2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import UnifiedMapShell from '@/components/map/unified/UnifiedMapShell';

export default function PartnerDashboard() {
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: user } = useQuery({
    queryKey: ['current_user'],
    queryFn: async () => {
        try {
            return await base44.auth.me();
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
    queryKey: ['perk_locations'],
    queryFn: async () => {
        try {
            return await base44.entities.PerkLocation.list();
        } catch {
            return [];
        }
    },
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

  const { data: messages = [] } = useQuery({
    queryKey: ['partner_messages'],
    queryFn: async () => {
        try {
            return await (base44.entities as any).PartnerMessage.list();
        } catch {
            return [];
        }
    },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[#11182B] mb-2">Access Restricted</h2>
          <p className="text-slate-500 font-medium">Only administrators can view the partner dashboard.</p>
        </div>
      </div>
    );
  }

  const getPartnerStats = (partnerId: string) => {
    const partnerPerks = (perks as any[]).filter((p: any) => p.partner_id === partnerId);
    const perkIds = partnerPerks.map((p: any) => p.id);
    const partnerRedemptions = (redemptions as any[]).filter((r: any) => perkIds.includes(r.perk_id));
    const partnerMessages = (messages as any[]).filter((m: any) => m.partner_id === partnerId);
    const unreadMessages = partnerMessages.filter((m: any) => m.status === 'unread');

    return {
      perks: partnerPerks.length,
      redemptions: partnerRedemptions.length,
      messages: partnerMessages.length,
      unread: unreadMessages.length,
    };
  };

  const activePartners = (partners as any[]).filter((p: any) => p.is_active);

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <H1 className="text-3xl font-bold text-[#11182B] mb-2">Partner Dashboard</H1>
        <Body className="text-slate-500 font-medium">Monitor partner performance and resident engagement</Body>
      </motion.div>

      <div className="flex items-center justify-between gap-4 mb-8 bg-white border border-[#EFEFEF] rounded-none p-6 shadow-none">
        <div>
          <label className="text-[10px] font-bold text-[#11182B] uppercase tracking-widest mb-2 block">Report Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-[#EFEFEF] rounded-none font-medium text-[#11182B] focus:outline-none focus:ring-2 focus:ring-[#11182B]"
          />
        </div>
        <div className="text-right">
          <Button className="bg-[#11182B] text-white hover:bg-[#11182B] text-white/90 font-bold tracking-widest uppercase text-xs">
             <Download className="w-4 h-4 mr-2" /> Export Summary
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Active Partners', value: activePartners.length, icon: Building2 },
          { label: 'Total Redemptions', value: (redemptions as any[]).length, icon: TrendingUp },
          { label: 'Total Messages', value: (messages as any[]).length, icon: Mail },
          { label: 'Unread Messages', value: (messages as any[]).filter((m: any) => m.status === 'unread').length, icon: MessageSquare },
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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card className="  ">
          <CardHeader>
            <CardTitle className="text-[#11182B] font-bold">Active Partners</CardTitle>
            <CardDescription className="font-medium text-slate-500">View partner performance and recent activity</CardDescription>
          </CardHeader>
          <CardContent>
            {activePartners.length === 0 ? (
              <p className="text-center py-12 text-slate-500 font-medium">No active partners yet</p>
            ) : (
              <div className="space-y-4">
                {activePartners.map((partner) => {
                  const stats = getPartnerStats(partner.id);
                  return (
                    <motion.div
                      key={partner.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-6 border border-[#EFEFEF] rounded-none hover:shadow-none transition-all cursor-pointer bg-white"
                      onClick={() => setSelectedPartner(partner.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-[#11182B] ">{partner.business_name}</h3>
                          <p className="text-sm font-medium text-slate-500">{partner.contact_person}</p>
                        </div>
                        <Badge variant="outline" className="text-xs font-bold uppercase tracking-widest border-[#EFEFEF] text-slate-500 bg-slate-50 px-3 py-1">
                          {partner.category}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Perks</p>
                          <p className="text-xl font-bold text-[#11182B] ">{stats.perks}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Redemptions</p>
                          <p className="text-xl font-bold text-[#11182B] ">{stats.redemptions}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Messages</p>
                          <p className="text-xl font-bold text-[#11182B] ">{stats.messages}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Unread</p>
                          <p className="text-xl font-bold text-[#11182B] ">{stats.unread}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="mt-8 h-[400px] w-full rounded-none overflow-hidden shadow-none relative border border-[#EFEFEF]">
         <UnifiedMapShell mode="partner" entities={[]} onEntitySelect={() => {}} selectedEntity={null} />
      </div>
    </div>
  );
}
