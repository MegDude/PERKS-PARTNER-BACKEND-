import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';

const BAR_COLORS = ['#0B1F33', '#C9A227', '#1A3151', '#CFAF5A', '#5A6B7D', '#E8C97A', '#8B9AAB', '#0B1F33', '#C9A227', '#1A3151'];

export default function TopPerksChart({ data, isLoading }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-navy text-sm">Most Redeemed Benefits</h3>
          <p className="text-xs text-textMuted mt-0.5">Top 10 by redemption count</p>
        </div>
      </div>
      {isLoading ? (
        <div className="h-72 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-textMuted" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-sm text-textMuted">No redemptions yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#8B9AAB' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#5A6B7D' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(201,162,39,0.06)' }}
              contentStyle={{ background: '#fff', border: '1px solid rgba(11,31,51,0.08)', borderRadius: 12, fontSize: 12 }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
              {data.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}