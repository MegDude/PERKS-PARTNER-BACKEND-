import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, Users, Activity, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BuildingEngagement() {
  const { buildingId: ctxBuildingId } = useOutletContext<any>() || {};
  const { buildingId: paramBuildingId } = useParams();
  const buildingId = ctxBuildingId || paramBuildingId;

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: flats = [] } = useQuery({
    queryKey: ['flats'],
    queryFn: () => base44.entities.Flat.list()
  });

  if (!buildingId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <p className="text-textMuted">Select a building to view engagement</p>
      </div>
    );
  }

  const building = (buildings as any[]).find((b: any) => b.id === buildingId);

  // Mock engagement data tailored to the selected building
  const monthlyData = [
    { name: 'Jan', activeUsers: 45, eventsAttended: 12, perksRedeemed: 80 },
    { name: 'Feb', activeUsers: 52, eventsAttended: 18, perksRedeemed: 95 },
    { name: 'Mar', activeUsers: 68, eventsAttended: 24, perksRedeemed: 110 },
    { name: 'Apr', activeUsers: 74, eventsAttended: 28, perksRedeemed: 130 },
  ];

  return (
    <div className="min-h-screen bg-bgMain p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#11182B] mb-2">Engagement Metrics: {building?.name}</h2>
          <p className="text-textSecondary">Track resident participation and feature usage</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#C5A028]">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#C5A028]" /> Active Profiles
            </div>
            <div className="text-xl font-medium tracking-tight text-[#11182B]">142</div>
          </div>
          
          <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#C5A028]">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#C5A028]" /> Total RSVP
            </div>
            <div className="text-xl font-medium tracking-tight text-[#11182B]">89</div>
          </div>

          <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#C5A028]">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#C5A028]" /> Perks Used
            </div>
            <div className="text-xl font-medium tracking-tight text-[#11182B]">312</div>
          </div>
        </div>

        <Card className=" ">
          <CardHeader>
            <CardTitle className="text-[#11182B]">Activity Trends</CardTitle>
            <CardDescription>Monthly engagement over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="activeUsers" stroke="#0B1F33" strokeWidth={2} name="Active Users" />
                <Line type="monotone" dataKey="perksRedeemed" stroke="#C5A028" strokeWidth={2} name="Perks Redeemed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
