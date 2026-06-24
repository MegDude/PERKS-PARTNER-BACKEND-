import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

export default function PerkLeaderboard({ data }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-gold" />
          <h3 className="font-bold text-navy text-sm">Leaderboard</h3>
        </div>
        <p className="text-sm text-textMuted text-center py-8">No redemptions yet</p>
      </div>
    );
  }

  const maxCount = data[0]?.count || 1;

  return (
    <div className="bg-white rounded-2xl p-6 border border-[var(--border-subtle)]">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-4 h-4 text-gold" />
        <h3 className="font-bold text-navy text-sm">Leaderboard</h3>
      </div>
      <div className="space-y-3">
        {data.map((perk, i) => (
          <motion.div
            key={perk.name}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              i === 0 ? 'bg-gold text-navy' : i === 1 ? 'bg-navy/10 text-navy' : i === 2 ? 'bg-orange-50 text-orange-600' : 'bg-bgAlt text-textMuted'
            }`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-navy truncate">{perk.name}</span>
                <span className="text-xs font-bold text-navy shrink-0">{perk.count}</span>
              </div>
              <div className="h-1.5 bg-bgAlt rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${i === 0 ? 'bg-gold' : 'bg-navy'}`}
                  style={{ width: `${(perk.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}