import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, Users, Calendar, TrendingUp, Gift, FileText, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function PartnerOverview({ perks, redemptions, userPartner }) {
  const [reportLoading, setReportLoading] = useState(false);

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const res = await base44.functions.invoke('generatePartnerReportOnDemand', {
        partner_id: userPartner.id,
      });
      const data = res.data || res;
      if (data?.file_url) {
        window.open(data.file_url, '_blank');
        toast.success(`Report for ${data.period_label || 'last month'} ready`);
      } else {
        toast.success('Report generated');
      }
    } catch (error) {
      toast.error('Failed to generate report: ' + (error.message || ''));
    } finally {
      setReportLoading(false);
    }
  };

  const perkRedemptions = redemptions.filter(r => perks.some(p => p.id === r.perk_id));
  const uniqueUsers = new Set(perkRedemptions.map(r => r.user_email)).size;
  const totalRedemptions = perkRedemptions.length;
  const avgPerPerk = perks.length > 0 ? Math.round(totalRedemptions / perks.length) : 0;

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString('en', { month: 'short' });
    const count = perkRedemptions.filter(r => {
      const rd = new Date(r.redeemed_at);
      return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
    }).length;
    return { month: label, redemptions: count };
  });

  const topPerks = [...perks]
    .map(p => ({ ...p, count: perkRedemptions.filter(r => r.perk_id === p.id).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const stats = [
    { label: 'Total Redemptions', value: totalRedemptions, icon: Star },
    { label: 'Unique Customers', value: uniqueUsers, icon: Users },
    { label: 'Active Perks', value: perks.length, icon: Calendar },
    { label: 'Avg per Perk', value: avgPerPerk, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Report Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-gradient-to-r from-navy to-navySoft rounded-2xl p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              Monthly Performance Report
            </h3>
            <p className="text-white/60 text-sm mt-1">Generate a detailed PDF with redemption analytics, engagement scores, and top perks.</p>
          </div>
          <button
            onClick={generateReport}
            disabled={reportLoading}
            className="flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-navy px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shrink-0"
          >
            {reportLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {reportLoading ? 'Generating...' : 'Download Report'}
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-white border-[var(--border-subtle)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-textMuted uppercase tracking-wide mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-navy">{stat.value}</p>
                    </div>
                    <div className="p-2 bg-gold/10 rounded-lg">
                      <Icon className="w-5 h-5 text-gold" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card className="bg-white border-[var(--border-subtle)]">
          <CardHeader>
            <CardTitle className="text-navy">Monthly Redemptions</CardTitle>
            <CardDescription>Last 6 months redemption trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="redemptions" fill="#0B1F33" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Perks */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card className="bg-white border-[var(--border-subtle)]">
          <CardHeader>
            <CardTitle className="text-navy flex items-center gap-2">
              <Gift className="w-5 h-5 text-gold" />
              Top Performing Perks
            </CardTitle>
            <CardDescription>Most redeemed offers this period</CardDescription>
          </CardHeader>
          <CardContent>
            {topPerks.length === 0 ? (
              <p className="text-center py-6 text-textMuted text-sm">No redemption data yet</p>
            ) : (
              <div className="space-y-3">
                {topPerks.map((perk, i) => (
                  <div key={perk.id} className="flex items-center gap-4 p-3 rounded-lg bg-bgAlt/50">
                    <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy text-sm truncate">{perk.name}</p>
                      <p className="text-xs text-textMuted">{perk.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gold">{perk.count}</p>
                      <p className="text-xs text-textMuted">redeemed</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}