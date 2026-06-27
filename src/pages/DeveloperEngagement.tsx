import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building2, Users, TrendingUp, MessageSquare, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/context/LanguageContext';

export default function DeveloperEngagement() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser({ id: 'user_admin', role: 'admin', email: 'admin@downtownperks.local' });
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const totalResidents = (tenants as any[]).length;
  const enrolledResidents = (tenants as any[]).filter(t => t.perks_enrolled).length;
  const overallEngagement = totalResidents > 0 ? Math.round((enrolledResidents / totalResidents) * 100) : 0;

  const buildingStats = (buildings as any[]).map(building => {
    const buildingTenants = (tenants as any[]).filter(t => t.flat_id?.includes(building.id));
    const enrolled = buildingTenants.filter(t => t.perks_enrolled).length;
    return {
      name: building.name,
      residents: buildingTenants.length,
      enrolled,
      engagement: buildingTenants.length > 0 ? Math.round((enrolled / buildingTenants.length) * 100) : 0
    };
  });

  const portfolioTrend = totalResidents > 0
    ? [{ month: 'Current', adoption: overallEngagement, residents: totalResidents }]
    : [];

  return (
    <div className="min-h-screen bg-bgMain p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A96A]">Sponsor view</p>
          <h1 className="mt-1.5 text-2xl font-semibold text-[#11182B] sm:text-3xl">Portfolio engagement</h1>
          <p className="mt-2 max-w-3xl text-[13px] leading-5 text-textSecondary">Track real resident enrollment and building participation once those records are connected.</p>
        </div>

        {/* Portfolio Metrics */}
        <div className="mb-7 grid grid-cols-2 gap-x-5 gap-y-3 md:grid-cols-4">
          <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#C5A028]">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-[#C5A028]" /> Buildings
            </div>
            <div className="text-xl font-medium tracking-tight text-[#11182B]">{(buildings as any[]).length}</div>
          </div>

          <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#C5A028]">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#C5A028]" /> Total Residents
            </div>
            <div className="text-xl font-medium tracking-tight text-[#11182B]">{totalResidents}</div>
          </div>

          <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#C5A028]">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#C5A028]" /> Perks Adoption
            </div>
            <div className="text-xl font-medium tracking-tight text-[#11182B]">{overallEngagement}%</div>
          </div>

          <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#C5A028]">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#C5A028]" /> Messages Sent
            </div>
            <div className="text-xl font-medium tracking-tight text-[#11182B]">{(broadcasts as any[]).filter(b => b.delivery_status === 'sent').length}</div>
          </div>
        </div>

        {/* Data Readiness Notice */}
        {(tenants as any[]).length === 0 && (
          <Card className="mb-6  ">
            <CardContent className="pt-6">
              <p className="text-sm text-[#11182B]"><strong>Data setup:</strong> Add resident records to populate enrollment, adoption, and building-level participation.</p>
            </CardContent>
          </Card>
        )}



        {/* Portfolio Engagement Trend */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-[#11182B]">Adoption trend</CardTitle>
            <CardDescription>Shows the current adoption snapshot when resident enrollment data is available.</CardDescription>
          </CardHeader>
          <CardContent>
            {portfolioTrend.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={portfolioTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="adoption" stroke="#C5A028" name="Adoption Rate (%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-sm text-[rgba(11,31,51,0.58)]">No adoption trend is available yet. It will appear once residents are enrolled.</p>
            )}
          </CardContent>
        </Card>

        {/* Building Performance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-[#11182B]">Building Performance</CardTitle>
            <CardDescription>Compare enrollment rates across properties when resident-to-building relationships are available.</CardDescription>
          </CardHeader>
          <CardContent>
            {buildingStats.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={buildingStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="residents" fill="#0B1F33" name="Total Residents" />
                  <Bar dataKey="enrolled" fill="#C5A028" name="Perks Enrolled" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-sm text-[rgba(11,31,51,0.58)]">No building performance chart is available yet. Add building records and resident assignments to populate this view.</p>
            )}
          </CardContent>
        </Card>

        {/* Building List with Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#11182B]">Building Breakdown</CardTitle>
            <CardDescription>Building-level participation from connected records.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {buildingStats.length === 0 ? (
                <p className="text-sm text-[rgba(11,31,51,0.58)]">No building breakdown is available yet.</p>
              ) : buildingStats.map((stat, idx) => {
                const isAboveAverage = stat.engagement >= overallEngagement;
                return (
                  <div key={idx} className={`flex items-center justify-between p-4 border rounded-none transition-all ${
                    isAboveAverage ? 'border-navy/30 bg-navy/5' : 'border-[#EFEFEF]'
                  }`}>
                    <div>
                      <h3 className="font-semibold text-[#11182B]">{stat.name}</h3>
                      <p className="text-sm text-textSecondary">{stat.residents} residents • {stat.enrolled} enrolled</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#11182B]">{stat.engagement}%</div>
                      <p className="text-xs text-textMuted">{isAboveAverage ? '✓ Above avg' : 'Needs focus'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
