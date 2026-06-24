import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { H1, H2, Body } from '@/components/ui/Typography';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Star } from 'lucide-react';

export default function PerkAnalytics() {
  const [timeRange, setTimeRange] = useState('all');

  const { data: redemptions = [], isLoading } = useQuery({
    queryKey: ['perk_redemptions'],
    queryFn: async () => {
        try {
            return await base44.entities.PerkRedemption.list();
        } catch {
            return [];
        }
    },
  });

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

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[#11182B] mb-2">Access Restricted</h2>
          <p className="text-slate-500">Only administrators can view perk analytics.</p>
        </div>
      </div>
    );
  }

  // Filter by date range
  const now = new Date();
  const getFilteredRedemptions = () => {
    if (timeRange === 'all') return redemptions;
    
    const days = timeRange === '7' ? 7 : timeRange === '30' ? 30 : 1;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return (redemptions as any[]).filter((r: any) => new Date(r.redeemed_at) >= cutoff);
  };

  const filtered = getFilteredRedemptions();

  // Calculate top perks
  const perkCounts: any = {};
  filtered.forEach((r: any) => {
    const key = r.perk_name || 'Unknown';
    perkCounts[key] = (perkCounts[key] || 0) + 1;
  });

  const topPerks = Object.entries(perkCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (b as any).count - (a as any).count)
    .slice(0, 10);

  const stats = [
    {
      label: 'Total Redemptions',
      value: filtered.length,
      icon: Star,
      color: 'bg-slate-50 text-[#11182B] ',
    },
    {
      label: 'Unique Users',
      value: new Set(filtered.map((r: any) => r.user_email)).size,
      icon: Users,
      color: 'bg-slate-50 text-[#11182B] ',
    },
    {
      label: 'Top Perk',
      value: (topPerks[0] as any)?.name || 'N/A',
      icon: TrendingUp,
      color: 'bg-[#11182B]/10 text-[#11182B] ',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <H1 className="text-3xl font-bold text-[#11182B] mb-2">Perk Analytics</H1>
        <Body className="text-slate-500">Track which perks your residents love most</Body>
      </motion.div>

      {/* Time Range Filter */}
      <div className="mb-8 flex gap-3">
        {[
          { value: '1', label: 'Today' },
          { value: '7', label: 'Last 7 Days' },
          { value: '30', label: 'Last 30 Days' },
          { value: 'all', label: 'All Time' },
        ].map(range => (
          <Button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={`px-4 py-2 rounded-none text-sm font-bold transition-all ${
              timeRange === range.value
                ? 'bg-[#11182B] text-white shadow-none'
                : 'bg-white text-[#11182B] hover:bg-slate-50 border border-[#EFEFEF]'
            }`}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* Top Perks */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="  ">
            <CardHeader>
              <CardTitle className="text-[#11182B] font-bold">Top 10 Perks</CardTitle>
              <CardDescription>Most redeemed locations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-[#EFEFEF] border-t-[#C5A028] rounded-none animate-spin" />
                </div>
              ) : topPerks.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topPerks}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} angle={-45} textAnchor="end" height={80} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="#11182B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 font-medium">No data available</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
