import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Loader2, TrendingUp, Mail, MousePointer, Gift, Calendar, Eye, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EngagementCampaigns() {
  const navigate = useNavigate();
  const { buildingId } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      base44.auth.redirectToLogin();
    }
  };

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns', buildingId],
    queryFn: async () => {
      const allCampaigns = await base44.entities.Campaign.list();
      if (!buildingId) return allCampaigns;
      return allCampaigns.filter(c => c.building_id === buildingId);
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bgMain p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold text-navy mb-2">Access Restricted</h2>
            <p className="text-textSecondary">Only administrators can access campaign reporting.</p>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate aggregate metrics
  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter(c => ['sent', 'active', 'completed'].includes(c.status));
  const avgOpenRate = sentCampaigns.length > 0
    ? Math.round(sentCampaigns.reduce((sum, c) => sum + (c.open_rate || 0), 0) / sentCampaigns.length)
    : 0;
  const avgClickRate = sentCampaigns.length > 0
    ? Math.round(sentCampaigns.reduce((sum, c) => sum + (c.click_rate || 0), 0) / sentCampaigns.length)
    : 0;
  const avgConversionRate = sentCampaigns.length > 0
    ? Math.round(sentCampaigns.reduce((sum, c) => sum + (c.conversion_rate || 0), 0) / sentCampaigns.length)
    : 0;
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
  const totalRecipients = campaigns.reduce((sum, c) => sum + (c.recipients_count || 0), 0);

  // Prepare timeline data for chart
  const timelineData = sentCampaigns
    .filter(c => c.sent_at)
    .sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at))
    .map(c => ({
      name: format(new Date(c.sent_at), 'MMM d'),
      openRate: c.open_rate || 0,
      clickRate: c.click_rate || 0,
      conversionRate: c.conversion_rate || 0
    }));

  // Prepare segment performance data
  const segmentData = {};
  campaigns.forEach(c => {
    const segment = c.segment_target || 'Other';
    if (!segmentData[segment]) {
      segmentData[segment] = { opens: 0, clicks: 0, conversions: 0, count: 0 };
    }
    segmentData[segment].opens += c.opens || 0;
    segmentData[segment].clicks += c.clicks || 0;
    segmentData[segment].conversions += c.conversions || 0;
    segmentData[segment].count += 1;
  });

  const segmentChartData = Object.entries(segmentData).map(([segment, stats]) => ({
    segment,
    'Avg Opens': stats.count > 0 ? Math.round(stats.opens / stats.count) : 0,
    'Avg Clicks': stats.count > 0 ? Math.round(stats.clicks / stats.count) : 0,
    'Avg Conversions': stats.count > 0 ? Math.round(stats.conversions / stats.count) : 0
  }));

  const statusColor = {
    draft: 'bg-slate-100 text-slate-700',
    scheduled: 'bg-blue-100 text-blue-700',
    sent: 'bg-gold/20 text-gold',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-navy/10 text-navy'
  };

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-navy -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        {/* Header */}
        <div className="mb-10 p-6 bg-gradient-to-r from-gold/10 to-transparent border border-gold/30 rounded-2xl">
          <h2 className="text-lg font-semibold text-navy mb-2">Engagement Campaigns</h2>
          <p className="text-textSecondary text-sm leading-relaxed">
            Track campaign performance metrics including open rates, click-through rates, and conversion rates across resident segments.
          </p>
        </div>

        {/* Key Metrics Cards */}
        {!campaignsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Total Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{totalCampaigns}</div>
                <p className="text-xs text-textMuted">{sentCampaigns.length} sent</p>
              </CardContent>
            </Card>

            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Open Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold">{avgOpenRate}%</div>
                <p className="text-xs text-textMuted">average</p>
              </CardContent>
            </Card>

            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary flex items-center gap-1">
                  <MousePointer className="w-3 h-3" /> CTR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{avgClickRate}%</div>
                <p className="text-xs text-textMuted">click-through</p>
              </CardContent>
            </Card>

            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary flex items-center gap-1">
                  <Gift className="w-3 h-3" /> Conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{avgConversionRate}%</div>
                <p className="text-xs text-textMuted">conversion rate</p>
              </CardContent>
            </Card>

            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Total Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold">{totalConversions}</div>
                <p className="text-xs text-textMuted">from {totalRecipients} sent</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Over Time */}
          {timelineData.length > 0 && (
            <Card className="border-gold/20">
              <CardHeader>
                <CardTitle className="text-base">Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="var(--text-muted)" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => `${value}%`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="openRate" stroke="#CFAF5A" name="Open Rate" strokeWidth={2} />
                    <Line type="monotone" dataKey="clickRate" stroke="#0B1F33" name="CTR" strokeWidth={2} />
                    <Line type="monotone" dataKey="conversionRate" stroke="#EAD08E" name="Conversion" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Segment Performance */}
          {segmentChartData.length > 0 && (
            <Card className="border-gold/20">
              <CardHeader>
                <CardTitle className="text-base">Performance by Segment</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={segmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="segment" stroke="var(--text-muted)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="var(--text-muted)" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Avg Opens" fill="#CFAF5A" />
                    <Bar dataKey="Avg Clicks" fill="#0B1F33" />
                    <Bar dataKey="Avg Conversions" fill="#EAD08E" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Campaigns Table */}
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="text-base">Campaign History</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-navy" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-textSecondary">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No campaigns yet. Create your first campaign to start tracking engagement.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bgAlt border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-navy">Campaign</th>
                      <th className="px-4 py-3 text-left font-semibold text-navy">Segment</th>
                      <th className="px-4 py-3 text-left font-semibold text-navy">Sent</th>
                      <th className="px-4 py-3 text-right font-semibold text-navy">Open Rate</th>
                      <th className="px-4 py-3 text-right font-semibold text-navy">CTR</th>
                      <th className="px-4 py-3 text-right font-semibold text-navy">Conversions</th>
                      <th className="px-4 py-3 text-center font-semibold text-navy">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b border-[var(--border-subtle)] hover:bg-bgAlt transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-navy">{campaign.name}</p>
                            <p className="text-xs text-textMuted truncate">{campaign.subject}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-textSecondary">{campaign.segment_target || 'All'}</span>
                        </td>
                        <td className="px-4 py-3 text-textMuted text-xs">
                          {campaign.sent_at ? format(new Date(campaign.sent_at), 'MMM d, yyyy') : 'Not sent'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-navy">{campaign.open_rate || 0}%</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-navy">{campaign.click_rate || 0}%</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-gold">{campaign.conversions || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={cn('text-xs', statusColor[campaign.status] || statusColor.draft)}>
                            {campaign.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}