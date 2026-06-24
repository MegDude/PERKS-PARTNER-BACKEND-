import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { BarChart3, Calendar } from 'lucide-react';

import AnalyticsKPIs from '@/components/analytics/AnalyticsKPIs';
import TopPerksChart from '@/components/analytics/TopPerksChart';
import RedemptionTrendChart from '@/components/analytics/RedemptionTrendChart';
import CategoryDonut from '@/components/analytics/CategoryDonut';
import PerkLeaderboard from '@/components/analytics/PerkLeaderboard';

export default function PerkAnalytics() {
  const [timeRange, setTimeRange] = useState('all');

  const { data: redemptions = [], isLoading } = useQuery({
    queryKey: ['perk_redemptions'],
    queryFn: () => base44.entities.PerkRedemption.list('-redeemed_at'),
  });

  const { data: perkLocations = [] } = useQuery({
    queryKey: ['perk_locations'],
    queryFn: () => base44.entities.PerkLocation.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['current_user'],
    queryFn: () => base44.auth.me(),
  });

  // Filter by date range
  const now = new Date();
  const cutoff = useMemo(() => {
    if (timeRange === 'all') return null;
    const days = parseInt(timeRange);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }, [timeRange]);

  const filtered = useMemo(() => {
    if (!cutoff) return redemptions;
    return redemptions.filter(r => new Date(r.redeemed_at) >= cutoff);
  }, [redemptions, cutoff]);

  // Enrich with perk location data for category lookup
  const perkLocationMap = useMemo(() => {
    const map = {};
    perkLocations.forEach(p => { map[p.id] = p; });
    return map;
  }, [perkLocations]);

  // ── Top perks by redemption count ──────────────────────────────────
  const topPerks = useMemo(() => {
    const counts = {};
    filtered.forEach(r => {
      const key = r.perk_name || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filtered]);

  // ── Category breakdown (enriched from PerkLocation) ───────────────
  const categoryData = useMemo(() => {
    const counts = {};
    filtered.forEach(r => {
      const loc = perkLocationMap[r.perk_id];
      const key = loc?.category || r.perk_category || 'Other';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered, perkLocationMap]);

  // ── Monthly trend (last 6 months) ──────────────────────────────────
  const trendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthR = redemptions.filter(r => {
        const rd = new Date(r.redeemed_at);
        return rd >= start && rd <= end;
      });
      data.push({
        label: `${months[d.getMonth()]}`,
        redemptions: monthR.length,
        users: new Set(monthR.map(r => r.user_email)).size,
      });
    }
    return data;
  }, [redemptions, now]);

  // ── KPI stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const uniqueUsers = new Set(filtered.map(r => r.user_email)).size;
    const activePerks = new Set(filtered.map(r => r.perk_id)).size;
    return {
      total: filtered.length,
      uniqueUsers,
      activePerks,
      avgPerPerk: activePerks > 0 ? (filtered.length / activePerks).toFixed(1) : '0',
    };
  }, [filtered]);

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-bgMain flex items-center justify-center p-6">
        <div className="text-center">
          <BarChart3 className="w-10 h-10 text-textMuted/30 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-navy mb-1">Access Restricted</h2>
          <p className="text-textSecondary text-sm">Only administrators can view perk analytics.</p>
        </div>
      </div>
    );
  }

  const timeRanges = [
    { value: '7', label: '7 Days' },
    { value: '30', label: '30 Days' },
    { value: '90', label: '90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="min-h-screen bg-bgMain">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border-subtle)] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-gold" />
                </div>
                <h1 className="text-xl font-bold text-navy">Perk Analytics</h1>
              </div>
              <p className="text-sm text-textMuted mt-1 ml-10">Which resident benefits are driving the most engagement</p>
            </div>
            {/* Time range pills */}
            <div className="flex items-center gap-1.5 bg-bgAlt rounded-xl p-1">
              {timeRanges.map(r => (
                <button
                  key={r.value}
                  onClick={() => setTimeRange(r.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    timeRange === r.value ? 'bg-white text-navy shadow-sm' : 'text-textMuted hover:text-navy'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* KPIs */}
        <AnalyticsKPIs stats={stats} />

        {/* Charts row 1: top perks + category donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
            <TopPerksChart data={topPerks} isLoading={isLoading} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <CategoryDonut data={categoryData} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Charts row 2: trend + leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
            <RedemptionTrendChart data={trendData} isLoading={isLoading} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <PerkLeaderboard data={topPerks.slice(0, 7)} />
          </motion.div>
        </div>

        {/* Footer note */}
        <div className="flex items-center gap-1.5 text-xs text-textMuted justify-center pt-2">
          <Calendar className="w-3 h-3" />
          Data reflects {filtered.length} redemption{filtered.length !== 1 ? 's' : ''} across {timeRange === 'all' ? 'all time' : `the last ${timeRange} days`}
        </div>
      </div>
    </div>
  );
}