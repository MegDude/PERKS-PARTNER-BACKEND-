import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft } from 'lucide-react';

import WorkspaceStats from '@/components/partner/WorkspaceStats';
import WorkspaceExportBar from '@/components/partner/WorkspaceExportBar';
import WorkspacePartnerList from '@/components/partner/WorkspacePartnerList';

export default function PartnerDashboard() {
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: user } = useQuery({
    queryKey: ['current_user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list('-joined_date'),
  });

  const { data: perks = [] } = useQuery({
    queryKey: ['perk_locations'],
    queryFn: () => base44.entities.PerkLocation.list(),
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['redemptions'],
    queryFn: () => base44.entities.PerkRedemption.list(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['partner_messages'],
    queryFn: () => base44.entities.PartnerMessage.list('-sent_at'),
  });

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-bgMain flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-navy/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-navy" />
          </div>
          <h2 className="text-xl font-bold text-navy mb-2">Access Restricted</h2>
          <p className="text-textSecondary text-sm mb-6">Only administrators can view the partner workspace.</p>
          <a href="/" className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-navySoft transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </a>
        </div>
      </div>
    );
  }

  const activePartners = partners.filter(p => p.is_active);
  const totalRedemptions = redemptions.length;
  const unreadMessages = messages.filter(m => m.status === 'unread').length;

  const exportAllCSV = () => {
    if (!activePartners.length) return;
    const lines = [['Partner Export', selectedMonth], ['Partner', 'Redemptions', 'Unique Users', 'Category']];
    activePartners.forEach(p => {
      const pp = perks.filter(pk => pk.partner_id === p.id);
      const pr = redemptions.filter(r => pp.some(pk => pk.id === r.perk_id))
        .filter(r => new Date(r.redeemed_at).toISOString().slice(0, 7) === selectedMonth);
      lines.push([p.business_name, pr.length, new Set(pr.map(r => r.user_email)).size, p.category || '']);
    });
    const csv = lines.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const el = document.createElement('a');
    el.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
    el.setAttribute('download', `all_partners_${selectedMonth}.csv`);
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  const exportPartnerCSV = (partner) => {
    const partnerPerks = perks.filter(p => p.partner_id === partner.id);
    const perkIds = partnerPerks.map(p => p.id);
    const partnerRedemptions = redemptions.filter(r => perkIds.includes(r.perk_id));
    const monthRedemptions = partnerRedemptions.filter(r => {
      const redemptionMonth = new Date(r.redeemed_at).toISOString().slice(0, 7);
      return redemptionMonth === selectedMonth;
    });
    const uniqueUsers = new Set(monthRedemptions.map(r => r.user_email)).size;
    const lines = [
      ['Partner Performance Report', selectedMonth],
      ['Partner Name', partner.business_name],
      ['Category', partner.category || ''],
      ['Contact', partner.contact_email],
      [],
      ['Total Redemptions', monthRedemptions.length],
      ['Unique Users', uniqueUsers],
      [],
      ['Date', 'Perk', 'User Name', 'User Email'],
      ...monthRedemptions.map(r => [
        new Date(r.redeemed_at).toLocaleDateString(),
        r.perk_name, r.user_name, r.user_email,
      ]),
    ];
    const csvContent = lines.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const el = document.createElement('a');
    el.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    el.setAttribute('download', `${partner.business_name}_${selectedMonth}.csv`);
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  return (
    <div className="min-h-screen bg-bgMain">
      {/* Header */}
      <div className="bg-navy text-white safe-area-top sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-4">
          <a href="/" className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </a>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[10px] text-gold uppercase tracking-widest font-bold mb-0.5">Admin Workspace</p>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Partner Dashboard</h1>
              <p className="text-white/50 text-sm mt-0.5">Monitor performance and engagement</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-xl text-navy text-sm bg-white border-0 focus:outline-none focus:ring-2 focus:ring-gold/50 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">
        {/* Stats */}
        <WorkspaceStats
          activePartners={activePartners.length}
          totalRedemptions={totalRedemptions}
          totalMessages={messages.length}
          unreadMessages={unreadMessages}
        />

        {/* Export Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[var(--border-subtle)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <h3 className="font-bold text-navy text-sm">Data Exports</h3>
            <p className="text-xs text-textMuted mt-0.5">Export survey data to Google Sheets or generate PDF reports for all partners</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={exportAllCSV}
              className="flex items-center justify-center gap-2 bg-white border border-[var(--border-subtle)] text-navy px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-bgAlt transition-colors"
            >
              <Building2 className="w-4 h-4" /> CSV Summary
            </button>
            <WorkspaceExportBar selectedMonth={selectedMonth} />
          </div>
        </motion.div>

        {/* Partner List */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-bold text-navy text-sm">Active Partners</h3>
            <span className="text-xs text-textMuted">{activePartners.length} in program</span>
          </div>
          <WorkspacePartnerList
            partners={activePartners}
            perks={perks}
            redemptions={redemptions}
            messages={messages}
            selectedPartner={selectedPartner}
            onSelect={setSelectedPartner}
            onExportCSV={exportPartnerCSV}
          />
        </div>
      </div>
    </div>
  );
}