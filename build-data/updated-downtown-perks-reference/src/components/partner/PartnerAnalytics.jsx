import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, Users, Star, Activity } from 'lucide-react';

export default function PartnerAnalytics({ redemptions, perks }) {
  // Filter to last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const perkRedemptions = redemptions.filter(r => perks.some(p => p.id === r.perk_id));
  const recentRedemptions = perkRedemptions.filter(r => {
    if (!r.redeemed_at) return false;
    return new Date(r.redeemed_at) >= thirtyDaysAgo;
  });

  const uniqueUsers = new Set(recentRedemptions.map(r => r.user_email)).size;

  // Daily trend data (last 30 days)
  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = recentRedemptions.filter(r => {
      const rd = new Date(r.redeemed_at);
      const rdStr = rd.toISOString().split('T')[0];
      return rdStr === dateStr;
    }).length;
    return {
      date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      redemptions: count,
    };
  });

  // Weekly aggregation (last 4 weeks)
  const weeklyData = Array.from({ length: 4 }, (_, i) => {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    const count = recentRedemptions.filter(r => {
      const rd = new Date(r.redeemed_at);
      return rd >= weekStart && rd <= weekEnd;
    }).length;
    return {
      week: `Week ${4 - i}`,
      label: `${weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`,
      redemptions: count,
    };
  }).reverse();

  // Top perks by redemption count
  const topPerks = [...perks]
    .map(p => ({
      ...p,
      count: recentRedemptions.filter(r => r.perk_id === p.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Category breakdown
  const categoryCounts = {};
  for (const r of recentRedemptions) {
    const cat = r.perk_category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const categoryData = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const avgPerDay = recentRedemptions.length / 30;
  const bestDay = dailyData.reduce((best, d) => (d.redemptions > best.redemptions ? d : best), dailyData[0] || { date: '—', redemptions: 0 });

  const stats = [
    { label: '30-Day Redemptions', value: recentRedemptions.length, icon: Star, color: 'text-gold' },
    { label: 'Unique Customers', value: uniqueUsers, icon: Users, color: 'text-navy' },
    { label: 'Avg per Day', value: avgPerDay.toFixed(1), icon: TrendingUp, color: 'text-gold' },
    { label: 'Best Day', value: `${bestDay.redemptions}`, sub: bestDay.date, icon: Activity, color: 'text-navy' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-white border-[var(--border-subtle)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-textMuted uppercase tracking-wide font-semibold">{stat.label}</p>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-navy">{stat.value}</p>
                  {stat.sub && <p className="text-xs text-textMuted mt-0.5">{stat.sub}</p>}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Daily Trend — Area Chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <Card className="bg-white border-[var(--border-subtle)]">
          <CardHeader>
            <CardTitle className="text-navy flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              Daily Redemption Trend
            </CardTitle>
            <CardDescription>Redemptions per day over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="redemptionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A227" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#C9A227" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  interval={4}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1F33',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                  labelStyle={{ color: '#C9A227', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="redemptions"
                  stroke="#C9A227"
                  strokeWidth={2.5}
                  fill="url(#redemptionGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#C9A227' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Comparison + Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-white border-[var(--border-subtle)] h-full">
            <CardHeader>
              <CardTitle className="text-navy flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                Weekly Breakdown
              </CardTitle>
              <CardDescription>Redemptions by week (last 4 weeks)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1F33',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                    labelStyle={{ color: '#C9A227', fontWeight: 600 }}
                  />
                  <Bar dataKey="redemptions" fill="#0B1F33" radius={[8, 8, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-white border-[var(--border-subtle)] h-full">
            <CardHeader>
              <CardTitle className="text-navy flex items-center gap-2">
                <Activity className="w-5 h-5 text-gold" />
                Category Breakdown
              </CardTitle>
              <CardDescription>Redemptions by perk category (30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="h-[240px] flex items-center justify-center">
                  <p className="text-textMuted text-sm">No data in this period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      tick={{ fontSize: 12 }}
                      width={80}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0B1F33',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '13px',
                      }}
                      labelStyle={{ color: '#C9A227', fontWeight: 600 }}
                      cursor={{ fill: 'rgba(201, 162, 39, 0.05)' }}
                    />
                    <Bar dataKey="count" fill="#C9A227" radius={[0, 8, 8, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Performing Perks */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="bg-white border-[var(--border-subtle)]">
          <CardHeader>
            <CardTitle className="text-navy flex items-center gap-2">
              <Star className="w-5 h-5 text-gold" />
              Top Perks (30 Days)
            </CardTitle>
            <CardDescription>Most redeemed offers in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {topPerks.length === 0 || topPerks.every(p => p.count === 0) ? (
              <p className="text-center py-6 text-textMuted text-sm">No redemption data in this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topPerks} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={100}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1F33',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                    labelStyle={{ color: '#C9A227', fontWeight: 600 }}
                    cursor={{ fill: 'rgba(11, 31, 51, 0.04)' }}
                  />
                  <Bar dataKey="count" fill="#0B1F33" radius={[0, 8, 8, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}