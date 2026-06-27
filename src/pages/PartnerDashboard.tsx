import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { H1, Body } from '@/components/ui/Typography';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Mail, TrendingUp, MessageSquare, Building2, Download, Activity, CheckCircle2, Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PartnerDashboard() {
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
  const partnerById = useMemo(() => {
    return Object.fromEntries((partners as any[]).map((partner: any) => [partner.id, partner]));
  }, [partners]);

  const perkById = useMemo(() => {
    return Object.fromEntries((perks as any[]).map((perk: any) => [perk.id, perk]));
  }, [perks]);

  const recentPartnerActivity = useMemo(() => {
    const messageActivity = (messages as any[]).map((message: any) => {
      const partner = partnerById[message.partner_id];
      return {
        id: `message-${message.id}`,
        partnerName: partner?.business_name || message.partner_name || 'Partner',
        type: message.status === 'unread' ? 'Unread message' : 'Partner message',
        related: message.subject || message.message || 'Workspace conversation',
        timestamp: message.created_date || message.created_at || message.updated_at || 'Recent',
        status: message.status || 'open',
        action: 'Open message',
      };
    });

    const redemptionActivity = (redemptions as any[]).map((redemption: any) => {
      const perk = perkById[redemption.perk_id];
      const partner = partnerById[perk?.partner_id];
      return {
        id: `redemption-${redemption.id}`,
        partnerName: partner?.business_name || redemption.partner_name || 'Partner',
        type: 'Perk redemption',
        related: perk?.title || perk?.perk_title || 'Active perk',
        timestamp: redemption.created_date || redemption.created_at || redemption.redeemed_at || 'Recent',
        status: redemption.status || 'redeemed',
        action: 'View redemption',
      };
    });

    const perkActivity = (perks as any[]).map((perk: any) => {
      const partner = partnerById[perk.partner_id];
      return {
        id: `perk-${perk.id}`,
        partnerName: partner?.business_name || perk.partner_name || 'Partner',
        type: perk.is_active === false ? 'Perk paused' : 'Perk active',
        related: perk.title || perk.perk_title || perk.name || 'Partner perk',
        timestamp: perk.updated_at || perk.updated_date || perk.created_at || perk.created_date || 'Recent',
        status: perk.is_active === false ? 'paused' : 'active',
        action: 'Review perk',
      };
    });

    return [...messageActivity, ...redemptionActivity, ...perkActivity]
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
      .slice(0, 8);
  }, [messages, partnerById, perkById, perks, redemptions]);

  const formatActivityTime = (value: string) => {
    if (!value || value === 'Recent') return 'Recent';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <H1 className="text-3xl font-bold text-[#11182B] mb-2">Partner reports</H1>
        <Body className="text-slate-500 font-medium">See what partners offered, residents used, and what needs a follow-up.</Body>
      </motion.div>

      <div className="flex items-center justify-between gap-4 mb-8 bg-white border border-[#EFEFEF] rounded-none p-6 shadow-none">
        <div>
          <label className="text-[10px] font-bold text-[#11182B] uppercase tracking-widest mb-2 block">Report month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-[#EFEFEF] rounded-none font-medium text-[#11182B] focus:outline-none focus:ring-2 focus:ring-[#11182B]"
          />
        </div>
        <div className="text-right">
          <Button className="bg-[#11182B] text-white hover:bg-[#11182B] text-white/90 font-bold tracking-widest uppercase text-xs">
             <Download className="w-4 h-4 mr-2" /> Export summary
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Active partners', value: activePartners.length, icon: Building2 },
          { label: 'Perks used', value: (redemptions as any[]).length, icon: TrendingUp },
          { label: 'Messages', value: (messages as any[]).length, icon: Mail },
          { label: 'Unread notes', value: (messages as any[]).filter((m: any) => m.status === 'unread').length, icon: MessageSquare },
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

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 rounded-2xl border border-[rgba(11,31,51,0.08)] bg-white p-6"
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase text-[#C8A96A]">Partner operations</p>
            <h2 className="text-[28px] font-semibold leading-tight text-[#0B1F33]">Recent Partner Activity</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[rgba(11,31,51,0.62)]">
              Track the latest partner messages, redemptions, perk updates, and follow-up items without relying on decorative map previews.
            </p>
          </div>
          <Button variant="outline">
            <Activity className="w-4 h-4" /> View all activity
          </Button>
        </div>

        {recentPartnerActivity.length === 0 ? (
          <div className="border border-dashed border-[rgba(11,31,51,0.14)] bg-white p-6 text-[15px] leading-6 text-[rgba(11,31,51,0.62)]">
            No partner activity has been recorded yet. Messages, perk redemptions, campaign changes, and workspace updates will appear here once partners start using the platform.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[760px] divide-y divide-[rgba(11,31,51,0.08)]">
              <div className="grid grid-cols-[1.1fr_.9fr_1.2fr_.7fr_.7fr_.65fr] gap-4 px-1 pb-3 text-[11px] font-semibold uppercase text-[rgba(11,31,51,0.52)]">
                <span>Partner</span>
                <span>Activity type</span>
                <span>Related item</span>
                <span>Timestamp</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {recentPartnerActivity.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.1fr_.9fr_1.2fr_.7fr_.7fr_.65fr] items-center gap-4 px-1 py-4 text-[14px] text-[#0B1F33]">
                  <div className="font-semibold">{item.partnerName}</div>
                  <div className="text-[rgba(11,31,51,0.68)]">{item.type}</div>
                  <div className="text-[rgba(11,31,51,0.68)]">{item.related}</div>
                  <div className="flex items-center gap-2 text-[rgba(11,31,51,0.58)]">
                    <Clock3 className="h-4 w-4 text-[#C8A96A]" />
                    {formatActivityTime(item.timestamp)}
                  </div>
                  <div>
                    <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[rgba(11,31,51,0.10)] bg-white px-2.5 text-[12px] font-semibold text-[#0B1F33]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#C8A96A]" />
                      {item.status}
                    </span>
                  </div>
                  <div>
                    <Button variant="ghost" className="min-h-10 px-2">
                      {item.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
}
