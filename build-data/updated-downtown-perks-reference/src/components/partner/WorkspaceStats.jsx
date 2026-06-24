import React from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, Mail, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WorkspaceStats({ activePartners, totalRedemptions, totalMessages, unreadMessages }) {
  const stats = [
    { label: 'Active Partners', value: activePartners, icon: Building2, color: 'text-navy' },
    { label: 'Total Redemptions', value: totalRedemptions, icon: TrendingUp, color: 'text-navy' },
    { label: 'Total Messages', value: totalMessages, icon: Mail, color: 'text-navy' },
    { label: 'Unread', value: unreadMessages, icon: MessageSquare, color: unreadMessages > 0 ? 'text-gold' : 'text-navy', highlight: unreadMessages > 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-[var(--border-subtle)] shadow-soft"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-semibold text-textMuted uppercase tracking-wide">{stat.label}</span>
              <Icon className={cn('w-4 h-4', stat.color)} />
            </div>
            <div className={cn('text-2xl sm:text-3xl font-bold', stat.highlight && stat.value > 0 ? 'text-gold' : 'text-navy')}>
              {stat.value}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}