import { motion } from 'framer-motion';
import { Star, Users, Repeat, Award } from 'lucide-react';

export default function AnalyticsKPIs({ stats }) {
  const cards = [
    { label: 'Total Redemptions', value: stats.total, icon: Star, accent: 'gold' },
    { label: 'Unique Redeemers', value: stats.uniqueUsers, icon: Users, accent: 'navy' },
    { label: 'Active Benefits', value: stats.activePerks, icon: Repeat, accent: 'navy' },
    { label: 'Avg per Benefit', value: stats.avgPerPerk, icon: Award, accent: 'gold' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl p-5 border border-[var(--border-subtle)]"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.accent === 'gold' ? 'bg-gold/10' : 'bg-navy/5'}`}>
              <Icon className={`w-4 h-4 ${c.accent === 'gold' ? 'text-gold' : 'text-navy'}`} />
            </div>
            <div className={`text-2xl font-bold ${c.accent === 'gold' ? 'text-gold' : 'text-navy'}`}>{c.value}</div>
            <div className="text-[11px] text-textMuted font-medium uppercase tracking-wide mt-0.5">{c.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}