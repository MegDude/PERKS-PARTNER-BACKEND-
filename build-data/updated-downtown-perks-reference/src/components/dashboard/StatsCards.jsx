import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { useLanguage } from '@/components/context/LanguageContext';
import { useCurrency } from '@/components/CurrencyContext';

const StatCard = ({ title, value, subtitle, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card className="p-5 bg-white border-0 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-15`}>
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </Card>
  </motion.div>
);

export default function StatsCards({ tenants, flats }) {
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  
  const totalFlats = flats?.length || 0;
  const occupiedFlats = tenants.length;
  const paidCount = tenants.filter(t => t.payment_status === 'paid').length;
  const unpaidCount = tenants.filter(t => t.payment_status === 'unpaid').length;
  const totalRentCollected = tenants
    .filter(t => t.payment_status === 'paid')
    .reduce((sum, t) => sum + (t.rent_per_interval || 0), 0);
  const totalRentPending = tenants
    .filter(t => t.payment_status === 'unpaid')
    .reduce((sum, t) => sum + (t.rent_per_interval || 0), 0);
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title={t('totalFlats')}
        value={totalFlats}
        subtitle={`${occupiedFlats} ${t('occupied')}`}
        icon={Building2}
        color="bg-primary"
        delay={0}
      />
      <StatCard
        title={t('totalTenants')}
        value={occupiedFlats}
        subtitle={`${totalFlats - occupiedFlats} ${t('vacant')}`}
        icon={Users}
        color="bg-secondary"
        delay={0.1}
      />
      <StatCard
        title={t('paid')}
        value={paidCount}
        subtitle={formatAmount(totalRentCollected)}
        icon={CheckCircle}
        color="bg-primary"
        delay={0.2}
      />
      <StatCard
        title={t('unpaid')}
        value={unpaidCount}
        subtitle={formatAmount(totalRentPending)}
        icon={AlertCircle}
        color="bg-primary"
        delay={0.3}
      />
      <StatCard
        title={t('collection')}
        value={`${occupiedFlats > 0 ? Math.round((paidCount / occupiedFlats) * 100) : 0}%`}
        subtitle={t('monthly') || 'This month'}
        icon={DollarSign}
        color="bg-secondary"
        delay={0.4}
      />
    </div>
  );
}