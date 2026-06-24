import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

export default function RedemptionTrendChart({ data, isLoading }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-navy text-sm">Redemption Trends</h3>
          <p className="text-xs text-textMuted mt-0.5">Monthly redemptions & unique redeemers</p>
        </div>
      </div>
      {isLoading ? (
        <div className="h-72 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-textMuted" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-sm text-textMuted">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="redemptionsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B1F33" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#0B1F33" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8B9AAB' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#8B9AAB' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid rgba(11,31,51,0.08)', borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="redemptions" stroke="#0B1F33" strokeWidth={2.5} dot={{ fill: '#0B1F33', r: 3 }} activeDot={{ r: 5 }} name="Redemptions" />
            <Line type="monotone" dataKey="users" stroke="#C9A227" strokeWidth={2.5} dot={{ fill: '#C9A227', r: 3 }} activeDot={{ r: 5 }} name="Unique Users" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}