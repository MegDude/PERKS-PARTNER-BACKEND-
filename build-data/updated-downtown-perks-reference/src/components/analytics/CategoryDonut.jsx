import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

const COLORS = ['#0B1F33', '#C9A227', '#1A3151', '#CFAF5A', '#5A6B7D', '#E8C97A', '#8B9AAB'];

export default function CategoryDonut({ data, isLoading }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[var(--border-subtle)]">
      <div className="mb-5">
        <h3 className="font-bold text-navy text-sm">Category Breakdown</h3>
        <p className="text-xs text-textMuted mt-0.5">Redemptions by perk type</p>
      </div>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-textMuted" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-textMuted">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid rgba(11,31,51,0.08)', borderRadius: 12, fontSize: 12 }} />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              wrapperStyle={{ fontSize: 11, lineHeight: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}