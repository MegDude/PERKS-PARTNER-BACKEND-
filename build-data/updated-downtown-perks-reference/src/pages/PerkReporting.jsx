import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, TrendingDown, TrendingUp, Lightbulb, Building2, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { H1, Body } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PerkReporting() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(),
  });

  const { data: perks = [] } = useQuery({
    queryKey: ['perk_locations'],
    queryFn: () => base44.entities.PerkLocation.list(),
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['redemptions'],
    queryFn: () => base44.entities.PerkRedemption.list(),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list(),
  });

  const { data: flats = [] } = useQuery({
    queryKey: ['flats'],
    queryFn: () => base44.entities.Flat.list(),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  // Set first building as default
  const activeBuilding = selectedBuilding
    ? buildings.find(b => b.id === selectedBuilding)
    : buildings[0];

  // Get building data
  const buildingFlats = activeBuilding ? flats.filter(f => f.building_id === activeBuilding.id) : [];
  const buildingTenants = activeBuilding ? tenants.filter(t => buildingFlats.some(f => f.id === t.flat_id)) : [];
  const buildingPerks = activeBuilding ? perks.filter(p => p.district === activeBuilding.district) : [];

  // Calculate monthly trends
  const monthlyTrends = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const data = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const monthStart = new Date(year, date.getMonth(), 1);
      const monthEnd = new Date(year, date.getMonth() + 1, 0);

      const monthRedemptions = redemptions.filter(r => {
        const redeemedDate = new Date(r.redeemed_at);
        return redeemedDate >= monthStart && redeemedDate <= monthEnd &&
          buildingTenants.some(t => t.email === r.user_email);
      });

      data.push({
        month: `${month}`,
        redemptions: monthRedemptions.length,
        users: new Set(monthRedemptions.map(r => r.user_email)).size,
      });
    }
    return data;
  }, [redemptions, buildingTenants]);

  // Identify underperforming venues
  const venuePerformance = useMemo(() => {
    return buildingPerks.map(perk => {
      const perkRedemptions = redemptions.filter(r => r.perk_id === perk.id);
      const avgMonthly = perkRedemptions.length / 12;
      const trend = perkRedemptions.length > 5 ? 'up' : 'down';

      return {
        ...perk,
        redemptionCount: perkRedemptions.length,
        avgMonthly: avgMonthly.toFixed(1),
        status: avgMonthly < 2 ? 'underperforming' : avgMonthly < 5 ? 'moderate' : 'strong',
        trend,
      };
    }).sort((a, b) => a.redemptionCount - b.redemptionCount);
  }, [buildingPerks, redemptions]);

  const underperformingCount = venuePerformance.filter(v => v.status === 'underperforming').length;
  const moderateCount = venuePerformance.filter(v => v.status === 'moderate').length;
  const strongCount = venuePerformance.filter(v => v.status === 'strong').length;

  // Generate recommendations
  const recommendations = useMemo(() => {
    const recs = [];

    if (underperformingCount > 0) {
      recs.push({
        type: 'warning',
        title: `${underperformingCount} Underperforming Venue${underperformingCount > 1 ? 's' : ''}`,
        description: `These venues have low redemption activity. Consider reaching out to ${underperformingCount > 1 ? 'these partners' : 'this partner'} to refresh offers or promote them more heavily.`,
        venues: venuePerformance.filter(v => v.status === 'underperforming').map(v => v.name),
      });
    }

    const avgRedemptionRate = buildingTenants.length > 0 
      ? Math.round((new Set(redemptions.filter(r => buildingTenants.some(t => t.email === r.user_email)).map(r => r.user_email)).size / buildingTenants.length) * 100)
      : 0;

    if (avgRedemptionRate < 30) {
      recs.push({
        type: 'warning',
        title: 'Low Perks Engagement',
        description: `Only ${avgRedemptionRate}% of residents have redeemed a perk. Launch a targeted campaign with featured venues or exclusive time-limited offers.`,
      });
    }

    const topPerformer = venuePerformance.filter(v => v.status === 'strong')[0];
    if (topPerformer) {
      recs.push({
        type: 'success',
        title: 'Spotlight Top Performers',
        description: `"${topPerformer.name}" is your top venue with ${topPerformer.redemptionCount} redemptions. Feature this in communications and ask other venues to match this success.`,
      });
    }

    const categoryGroups = buildingPerks.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});

    const categories = Object.entries(categoryGroups).sort((a, b) => b[1] - a[1]);
    if (categories.length > 0) {
      recs.push({
        type: 'info',
        title: 'Diversify Your Perks Mix',
        description: `Your portfolio is concentrated in ${categories[0][0]} (${categories[0][1]} venues). Consider recruiting partners in underrepresented categories to broaden resident appeal.`,
      });
    }

    return recs;
  }, [venuePerformance, buildingTenants, redemptions, buildingPerks, underperformingCount]);

  const statusColors = {
    strong: 'bg-green-100 text-green-800 border-green-300',
    moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    underperforming: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <div className="min-h-screen bg-bgMain p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="p-6 bg-gradient-to-r from-gold/10 to-transparent border border-gold/30 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-6 h-6 text-gold" />
            <H1 className="text-4xl font-bold text-navy">Perks Performance Report</H1>
          </div>
          <Body className="text-sm text-textSecondary leading-relaxed">
            Monthly redemption analytics, venue performance rankings, and data-driven recommendations to maximize community adoption.
          </Body>
        </div>
      </motion.div>

      {/* Building Selector */}
      {buildings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
          <label className="block text-sm font-semibold text-navy mb-3">Select Property</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {buildings.map(building => (
              <button
                key={building.id}
                onClick={() => setSelectedBuilding(building.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  activeBuilding?.id === building.id
                    ? 'border-gold bg-gold/5 shadow-gold'
                    : 'border-[var(--border-subtle)] bg-white hover:border-gold/50'
                }`}
              >
                <h3 className="font-semibold text-navy">{building.name}</h3>
                <p className="text-xs text-textMuted">{building.district}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {activeBuilding && (
        <>
          {/* Key Metrics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Total Redemptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{redemptions.filter(r => buildingTenants.some(t => t.email === r.user_email)).length}</div>
                <p className="text-xs text-textMuted">All time</p>
              </CardContent>
            </Card>

            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Active Venues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold">{buildingPerks.length}</div>
                <p className="text-xs text-textMuted">In {activeBuilding.district}</p>
              </CardContent>
            </Card>

            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">
                  {buildingTenants.length > 0 
                    ? Math.round((new Set(redemptions.filter(r => buildingTenants.some(t => t.email === r.user_email)).map(r => r.user_email)).size / buildingTenants.length) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-textMuted">Of residents</p>
              </CardContent>
            </Card>

            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Avg Monthly</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{Math.round(redemptions.filter(r => buildingTenants.some(t => t.email === r.user_email)).length / 12)}</div>
                <p className="text-xs text-textMuted">Redemptions</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Trends */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-soft border border-[var(--border-subtle)] p-6 mb-10">
            <h2 className="text-lg font-bold text-navy mb-6">12-Month Redemption Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="redemptions" stroke="#0B1F33" strokeWidth={2} name="Redemptions" />
                <Line type="monotone" dataKey="users" stroke="#C9A227" strokeWidth={2} name="Active Users" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Venue Performance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Status Breakdown */}
            <Card className="border-gold/20 bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-navy">Venue Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-textMuted">Strong Performers</span>
                    <Badge className="bg-green-100 text-green-800">{strongCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-textMuted">Moderate</span>
                    <Badge className="bg-yellow-100 text-yellow-800">{moderateCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-textMuted">Underperforming</span>
                    <Badge className="bg-red-100 text-red-800">{underperformingCount}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card className="border-gold/20 bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-navy">Top 3 Venues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {venuePerformance.slice(-3).reverse().map((venue, i) => (
                    <div key={venue.id} className="pb-2 border-b border-[var(--border-subtle)] last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold text-navy">{i + 1}. {venue.name}</p>
                          <p className="text-xs text-textMuted">{venue.category}</p>
                        </div>
                        <span className="text-sm font-bold text-gold">{venue.redemptionCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="border-gold/20 bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-navy">Category Mix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(buildingPerks.reduce((acc, p) => {
                    acc[p.category] = (acc[p.category] || 0) + 1;
                    return acc;
                  }, {})).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                    <div key={cat} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-textMuted">{cat}</span>
                        <span className="font-semibold text-navy">{count}</span>
                      </div>
                      <div className="bg-bgAlt rounded-full h-2 w-full">
                        <div className="bg-gold rounded-full h-2" style={{ width: `${(count / buildingPerks.length) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recommendations */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-bold text-navy">Actionable Recommendations</h2>
            </div>

            {recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border-l-4 ${
                    rec.type === 'warning'
                      ? 'bg-red-50 border-red-400'
                      : rec.type === 'success'
                      ? 'bg-green-50 border-green-400'
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 ${
                      rec.type === 'warning'
                        ? 'text-red-600'
                        : rec.type === 'success'
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }`}>
                      {rec.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                      {rec.type === 'success' && <TrendingUp className="w-5 h-5" />}
                      {rec.type === 'info' && <Lightbulb className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-sm mb-1 ${
                        rec.type === 'warning'
                          ? 'text-red-900'
                          : rec.type === 'success'
                          ? 'text-green-900'
                          : 'text-blue-900'
                      }`}>
                        {rec.title}
                      </h3>
                      <p className={`text-xs ${
                        rec.type === 'warning'
                          ? 'text-red-800'
                          : rec.type === 'success'
                          ? 'text-green-800'
                          : 'text-blue-800'
                      }`}>
                        {rec.description}
                      </p>
                      {rec.venues && rec.venues.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {rec.venues.map((venue, j) => (
                            <span key={j} className="text-xs bg-red-200 text-red-900 px-2 py-1 rounded-full">
                              {venue}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-900">✓ All metrics are healthy. Continue monitoring trends and maintain current partnerships.</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}