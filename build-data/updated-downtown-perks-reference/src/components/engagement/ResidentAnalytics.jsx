import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function ResidentAnalytics({ building, tenants }) {
  if (!tenants || tenants.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-slate-500">No resident data available</p>
        </CardContent>
      </Card>
    );
  }

  const enrolled = tenants.filter(t => t.perks_enrolled).length;
  const notEnrolled = tenants.length - enrolled;

  const perksData = [
    { name: 'Enrolled', value: enrolled },
    { name: 'Not Enrolled', value: notEnrolled }
  ];

  const tierData = [
    { name: 'Standard', value: tenants.filter(t => t.perks_tier === 'standard').length },
    { name: 'Premium', value: tenants.filter(t => t.perks_tier === 'premium').length },
    { name: 'VIP', value: tenants.filter(t => t.perks_tier === 'vip').length }
  ];

  const paymentStatusData = [
    { name: 'Paid', value: tenants.filter(t => t.payment_status === 'paid').length },
    { name: 'Unpaid', value: tenants.filter(t => t.payment_status === 'unpaid').length }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Perks Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={perksData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {perksData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Membership Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tierData.map((tier, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-600">{tier.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-slate-800 h-2 rounded-full" 
                        style={{ width: `${tenants.length > 0 ? (tier.value / tenants.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-800 w-8 text-right">{tier.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1f2937" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}