import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users, Target, Activity, Zap, TrendingUp, PieChart, Sparkles, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { base44 } from '@/api/base44Client';

export default function Dashboard() {
  const [overview, setOverview] = useState({ totalTenants: 0, totalRedemptions: 0, activePerks: 0, propertiesCount: 0 });
  const [chartData, setChartData] = useState([
    { name: 'Mon', value: 45 },
    { name: 'Tue', value: 52 },
    { name: 'Wed', value: 68 },
    { name: 'Thu', value: 74 },
    { name: 'Fri', value: 105 },
    { name: 'Sat', value: 142 },
    { name: 'Sun', value: 130 }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tenants, perks, redemptions, properties] = await Promise.all([
          base44.entities.Tenant.list(),
          base44.entities.PerkLocation.list(),
          base44.entities.PerkRedemption.list(),
          base44.entities.Building.list(),
        ]);

        setOverview({
          totalTenants: tenants.length,
          totalRedemptions: redemptions.length,
          activePerks: perks.filter((perk: any) => perk.is_active !== false && perk.active !== false).length,
          propertiesCount: properties.length,
        });

        const trendMap = new Map<string, number>();
        redemptions.forEach((redemption: any) => {
          const label = new Date(redemption.redeemed_at || redemption.timestamp || Date.now()).toLocaleDateString('en-US', { weekday: 'short' });
          trendMap.set(label, (trendMap.get(label) || 0) + 1);
        });
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        setChartData(days.map((day) => ({ name: day, value: trendMap.get(day) || 0 })));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#11182B] " />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#11182B] tracking-tight">Performance Dashboard</h1>
        <p className="text-slate-500 font-medium mt-1">Live platform performance, resident activity, and partner engagement.</p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#11182B]">
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Users className="w-3.5 h-3.5 text-[#11182B]" /> Total Reach</div>
           <div className="text-xl font-medium tracking-tight text-[#11182B] ">{overview.totalTenants.toLocaleString()}</div>
        </div>
        <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#11182B]">
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Target className="w-3.5 h-3.5 text-[#11182B]" /> Redemptions</div>
           <div className="text-xl font-medium tracking-tight text-[#11182B] ">{overview.totalRedemptions.toLocaleString()}</div>
        </div>
        <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#11182B]">
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-[#11182B]" /> Active Perks</div>
           <div className="text-xl font-medium tracking-tight text-[#11182B] ">{overview.activePerks}</div>
        </div>
        <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#11182B]">
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-[#11182B]" /> Properties</div>
           <div className="text-xl font-medium tracking-tight text-[#11182B] ">{overview.propertiesCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white border border-[#EFEFEF] rounded-none p-6 shadow-none">
          <div className="flex flex-col items-start justify-between gap-4 mb-8 sm:flex-row sm:items-center">
             <div>
                <h2 className="text-lg font-bold text-[#11182B] ">Engagement Momentum</h2>
                <p className="text-sm text-slate-500">Total redemptions & saves over time</p>
             </div>
             <div className="flex flex-wrap items-center gap-3 border-b border-[#EFEFEF]">
                <button className="pb-2 text-[10px] font-bold uppercase tracking-widest text-[#11182B] border-b-2 border-[#11182B]">Daily</button>
                <button className="pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#11182B]">Weekly</button>
                <button className="pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#11182B]">Monthly</button>
             </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} dx={-10} />
                <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '0px', border: '1px solid #EFEFEF', boxShadow: 'none'}} />
                <Bar dataKey="value" fill="#11182B" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intelligence Agent Panel */}
        <div className="bg-[#F5F7FA] border border-[#EFEFEF] rounded-none p-6 flex flex-col relative overflow-hidden shadow-none">
           <div className="flex items-center gap-2 text-[#11182B] mb-6 font-bold uppercase tracking-widest text-[10px]">
             <Sparkles className="w-4 h-4 text-[#C5A028]" /> Partner Opportunity
           </div>
           
           <h3 className="text-xl font-bold mb-4 leading-tight text-[#11182B]">Weekend demand is surging near The Shore.</h3>
           <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 flex-1">
             Our model indicates a 32% increase in foot traffic and app activity from residents at 603 Davis St during late afternoons. 
             You currently have no active campaigns capturing this segment.
           </p>
           
           <Button className="w-full bg-[#11182B] text-white hover:bg-[#1a243d] py-3 rounded-none font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center justify-center gap-2">
             <Zap className="w-4 h-4" /> Launch Campaign
           </Button>
        </div>

      </div>

    </div>
  )
}
