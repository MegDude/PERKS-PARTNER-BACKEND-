import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building2, Users, TrendingUp, MessageSquare, Loader2 } from 'lucide-react';

const NAVY = '#0B1F33';
const GOLD = '#C8A96A';
const BORDER = 'rgba(11,31,51,0.08)';

function tenantBelongsToBuilding(tenant: any, building: any) {
  const buildingId = String(building?.id || '').trim();
  const buildingName = String(building?.name || '').trim().toLowerCase();
  const tenantBuildingId = String(tenant?.building_id || tenant?.buildingId || '').trim();
  const tenantBuildingName = String(tenant?.building_name || tenant?.buildingName || '').trim().toLowerCase();
  const flatId = String(tenant?.flat_id || '').trim();

  return Boolean(
    (buildingId && tenantBuildingId === buildingId) ||
    (buildingName && tenantBuildingName === buildingName) ||
    (buildingId && flatId.includes(buildingId))
  );
}

export default function DeveloperEngagement() {
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

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: broadcasts = [], isLoading: broadcastsLoading } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => base44.entities.Broadcast.list()
  });

  const isLoading = !user || buildingsLoading || tenantsLoading || broadcastsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="flex items-center gap-3 rounded-none border border-[rgba(11,31,51,0.08)] bg-white px-5 py-4 text-sm text-[rgba(11,31,51,0.68)]">
          <Loader2 className="h-5 w-5 animate-spin text-[#C8A96A]" />
          Loading developer engagement...
        </div>
      </div>
    );
  }

  const totalResidents = (tenants as any[]).length;
  const enrolledResidents = (tenants as any[]).filter(t => t.perks_enrolled).length;
  const overallEngagement = totalResidents > 0 ? Math.round((enrolledResidents / totalResidents) * 100) : 0;
  const sentMessages = (broadcasts as any[]).filter(b => b.delivery_status === 'sent').length;

  const buildingStats = (buildings as any[]).map(building => {
    const buildingTenants = (tenants as any[]).filter(t => tenantBelongsToBuilding(t, building));
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

  const metrics = [
    { label: 'Buildings', value: (buildings as any[]).length, helper: 'Connected properties', Icon: Building2 },
    { label: 'Residents', value: totalResidents, helper: 'Known resident records', Icon: Users },
    { label: 'Perks adoption', value: `${overallEngagement}%`, helper: `${enrolledResidents} residents enrolled`, Icon: TrendingUp },
    { label: 'Messages sent', value: sentMessages, helper: 'Broadcasts delivered', Icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-white px-4 py-5 text-[#0B1F33] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 border-b border-[rgba(11,31,51,0.08)] pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C8A96A]">Developer engagement</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-[#0B1F33] sm:text-3xl">Portfolio resident engagement</h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[rgba(11,31,51,0.68)]">
            Track building participation, resident enrollment, and messaging activity across connected Downtown Perks properties.
          </p>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(({ label, value, helper, Icon }) => (
            <section key={label} className="border border-[rgba(11,31,51,0.08)] bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(11,31,51,0.55)]">{label}</p>
                <Icon className="h-4 w-4 text-[#C8A96A]" />
              </div>
              <div className="text-2xl font-semibold tracking-normal text-[#0B1F33]">{value}</div>
              <p className="mt-1 text-xs leading-5 text-[rgba(11,31,51,0.58)]">{helper}</p>
            </section>
          ))}
        </div>

        {(tenants as any[]).length === 0 && (
          <Card className="mb-6 border-[rgba(11,31,51,0.08)] bg-white shadow-none">
            <CardContent className="pt-6">
              <p className="text-sm leading-6 text-[#0B1F33]">
                <strong>Data setup:</strong> Add resident records to populate enrollment, adoption, and building-level participation.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-[rgba(11,31,51,0.08)] bg-white shadow-none">
          <CardHeader>
            <CardTitle className="text-[#0B1F33]">Adoption snapshot</CardTitle>
            <CardDescription>Current resident enrollment once building data is connected.</CardDescription>
          </CardHeader>
          <CardContent>
            {portfolioTrend.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={portfolioTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="adoption" stroke={GOLD} name="Adoption rate (%)" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-sm leading-6 text-[rgba(11,31,51,0.58)]">No adoption trend is available yet. It will appear once residents are enrolled.</p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 border-[rgba(11,31,51,0.08)] bg-white shadow-none">
          <CardHeader>
            <CardTitle className="text-[#0B1F33]">Building participation</CardTitle>
            <CardDescription>Compare enrollment rates across properties when resident-to-building relationships are available.</CardDescription>
          </CardHeader>
          <CardContent>
            {buildingStats.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={buildingStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="residents" fill={NAVY} name="Total residents" />
                  <Bar dataKey="enrolled" fill={GOLD} name="Perks enrolled" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-sm leading-6 text-[rgba(11,31,51,0.58)]">No building performance chart is available yet. Add building records and resident assignments to populate this view.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-[rgba(11,31,51,0.08)] bg-white shadow-none">
          <CardHeader>
            <CardTitle className="text-[#0B1F33]">Building breakdown</CardTitle>
            <CardDescription>Building-level participation from connected records.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {buildingStats.length === 0 ? (
                <p className="text-sm leading-6 text-[rgba(11,31,51,0.58)]">No building breakdown is available yet.</p>
              ) : buildingStats.map((stat, idx) => {
                const isAboveAverage = stat.engagement >= overallEngagement;
                return (
                  <div key={idx} className={`flex flex-col gap-3 border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                    isAboveAverage ? 'border-[rgba(200,169,106,0.55)] bg-[rgba(200,169,106,0.08)]' : 'border-[rgba(11,31,51,0.08)] bg-white'
                  }`}>
                    <div>
                      <h3 className="font-semibold tracking-normal text-[#0B1F33]">{stat.name}</h3>
                      <p className="mt-1 text-sm leading-5 text-[rgba(11,31,51,0.62)]">{stat.residents} residents / {stat.enrolled} enrolled</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-2xl font-semibold text-[#0B1F33]">{stat.engagement}%</div>
                      <p className="text-xs text-[rgba(11,31,51,0.55)]">{isAboveAverage ? 'Above average' : 'Needs focus'}</p>
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
