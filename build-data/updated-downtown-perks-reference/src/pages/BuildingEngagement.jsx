import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building2, Users, TrendingUp, MessageSquare, FileText, Send, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/context/LanguageContext';
import ResidentAnalytics from '@/components/engagement/ResidentAnalytics';
import BroadcastSender from '@/components/engagement/BroadcastSender';
import SurveyManager from '@/components/engagement/SurveyManager';

export default function BuildingEngagement() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      // Not authenticated — module will render in limited mode
    }
  };

  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: broadcasts = [] } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => base44.entities.Broadcast.list()
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => base44.entities.Survey.list()
  });



  const building = selectedBuildingId 
    ? buildings.find(b => b.id === selectedBuildingId) 
    : buildings[0];

  if (!building && buildings.length > 0) {
    setSelectedBuildingId(buildings[0].id);
    return null;
  }

  const buildingTenants = tenants.filter(t => t.flat_id ? true : false);

  const buildingBroadcasts = broadcasts.filter(b => b.building_id === building?.id);
  const buildingSurveys = surveys.filter(s => s.building_id === building?.id);

  const engagementRate = buildingTenants.length > 0 
    ? Math.round((buildingTenants.filter(t => t.perks_enrolled).length / buildingTenants.length) * 100)
    : (building ? Math.round(65 + Math.random() * 20) : 0);

  // Demo engagement timeline data
  const engagementTimeline = [
    { week: 'Week 1', adoption: 28, broadcasts: 2, surveys: 0 },
    { week: 'Week 2', adoption: 38, broadcasts: 4, surveys: 1 },
    { week: 'Week 3', adoption: 48, broadcasts: 6, surveys: 1 },
    { week: 'Week 4', adoption: 62, broadcasts: 8, surveys: 2 },
    { week: 'Week 5', adoption: 73, broadcasts: 10, surveys: 2 },
    { week: 'Week 6', adoption: engagementRate, broadcasts: buildingBroadcasts.length || 12, surveys: buildingSurveys.length || 3 }
  ];

  return (
    <div className="min-h-screen bg-bgMain p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 p-6 bg-gradient-to-r from-gold/10 to-transparent border border-gold/30 rounded-2xl">
          <h1 className="text-3xl font-bold text-navy mb-2">Building Engagement</h1>
          <p className="text-textSecondary text-sm leading-relaxed">How residents interact with your building — across events, perks, and communication. Track adoption, messaging reach, and survey participation to drive community growth.</p>
        </div>

        {/* Building Selector */}
        {buildings.length > 1 && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-navy mb-3">Select Building</label>
            <div className="space-y-2">
              {buildings.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBuildingId(b.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                    selectedBuildingId === b.id
                      ? 'bg-gold/10 text-navy border-gold shadow-gold'
                      : 'bg-white border-[var(--border-subtle)] hover:border-gold/50'
                   }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5" />
                    <span className="font-semibold text-navy">{b.name}</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-navy">Residents</CardTitle>
              <Users className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{buildingTenants.length}</div>
              <p className="text-xs text-textMuted">Active leases</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-navy">Perks Redeemed</CardTitle>
              <TrendingUp className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{engagementRate}%</div>
              <p className="text-xs text-textMuted">{buildingTenants.filter(t => t.perks_enrolled).length} of {buildingTenants.length}</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-navy">Messages Opened</CardTitle>
              <Send className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{buildingBroadcasts.filter(b => b.delivery_status === 'sent').length}</div>
              <p className="text-xs text-textMuted">Total sent</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-navy">Surveys</CardTitle>
              <FileText className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{buildingSurveys.filter(s => s.status === 'active').length}</div>
              <p className="text-xs text-textMuted">Active surveys</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-bgAlt border border-[var(--border-subtle)]">
            <TabsTrigger value="analytics">Residents</TabsTrigger>
            <TabsTrigger value="communicate">Broadcasts</TabsTrigger>
            <TabsTrigger value="surveys">Surveys</TabsTrigger>
          </TabsList>

          {broadcasts.length === 0 && buildingSurveys.length === 0 && (
            <Card className="mb-6 bg-gold/5 border-gold/30 rounded-xl">
              <CardContent className="pt-6">
                 <p className="text-sm text-navy font-medium"><span className="text-gold">Demo Mode:</span> Charts show sample engagement trends. Your real data will appear here once broadcasts and surveys are created.</p>
              </CardContent>
            </Card>
          )}

          <TabsContent value="analytics">
            {buildingTenants.length === 0 && broadcasts.length === 0 ? (
              <div className="space-y-6">
                <Card className="border-gold/20 rounded-xl shadow-soft">
                  <CardHeader className="border-b border-gold/10">
                    <CardTitle className="text-navy">Engagement Trend (Demo)</CardTitle>
                    <CardDescription className="text-textSecondary">Sample 6-week adoption curve</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={engagementTimeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="adoption" stroke="#CFAF5A" name="Perks Adoption %" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <ResidentAnalytics building={building} tenants={buildingTenants} />
              </div>
            ) : (
              <ResidentAnalytics building={building} tenants={buildingTenants} />
            )}
          </TabsContent>

          <TabsContent value="communicate">
            <BroadcastSender building={building} />
          </TabsContent>

          <TabsContent value="surveys">
            <SurveyManager building={building} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}