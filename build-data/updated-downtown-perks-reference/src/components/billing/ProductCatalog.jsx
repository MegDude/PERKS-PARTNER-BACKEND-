import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Check, Sparkles, Radio, Megaphone, BarChart3, FileText, Calendar, Rocket, Star, MapPin, Building2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const FAMILY_CONFIG = {
  Subscription: { icon: Sparkles, color: 'text-gold', bg: 'bg-gold/10', label: 'Platform Subscription' },
  Tier: { icon: Building2, color: 'text-navy', bg: 'bg-navy/5', label: 'Membership Tiers' },
  Support: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Support & Services' },
  Sponsorship: { icon: Star, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Sponsorship' },
  Activation: { icon: Rocket, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Activations' },
  Analytics: { icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Analytics' },
  Surveys: { icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Surveys & Research' },
  Broadcast: { icon: Radio, color: 'text-red-600', bg: 'bg-red-50', label: 'Broadcast Messaging' },
  Events: { icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50', label: 'Event Promotions' },
  Campaigns: { icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Campaigns' },
  Placements: { icon: MapPin, color: 'text-teal-600', bg: 'bg-teal-50', label: 'Featured Placements' },
  Resident: { icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'Resident Access' },
};

const FAMILY_ORDER = ['Subscription', 'Tier', 'Broadcast', 'Campaigns', 'Events', 'Placements', 'Analytics', 'Surveys', 'Activation', 'Sponsorship', 'Support', 'Resident'];

function formatPrice(offering) {
  if (!offering.amount && offering.amount !== 0) return '—';
  if (offering.amount === 0) return 'Free';
  const amt = `$${offering.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (offering.interval === 'month') return `${amt}/mo`;
  if (offering.interval === 'year') return `${amt}/yr`;
  return amt;
}

function OfferingCard({ offering }) {
  const cfg = FAMILY_CONFIG[offering.family] || FAMILY_CONFIG.Support;
  const Icon = cfg.icon;
  return (
    <div className="bg-white rounded-2xl border border-[var(--border-subtle)] p-5 flex flex-col gap-3 hover:shadow-soft transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className={cn('p-2 rounded-xl shrink-0', cfg.bg)}>
          <Icon className={cn('w-4 h-4', cfg.color)} />
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-navy">{formatPrice(offering)}</div>
          {offering.partner_type && (
            <Badge variant="outline" className="text-[10px] capitalize mt-0.5">{offering.partner_type}</Badge>
          )}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-navy text-sm leading-tight">{offering.display_name}</h4>
        {offering.tier_id && (
          <p className="text-xs text-textMuted mt-0.5 capitalize">{offering.tier_id.replace(/_/g, ' ')}</p>
        )}
      </div>
      {offering.kind === 'subscription' && (
        <Badge className="bg-gold/15 text-gold text-[10px] w-fit">Annual Subscription</Badge>
      )}
      {offering.kind === 'tier' && (
        <Badge className="bg-navy/10 text-navy text-[10px] w-fit">Membership Tier</Badge>
      )}
    </div>
  );
}

export default function ProductCatalog() {
  const { data: offerings = [], isLoading } = useQuery({
    queryKey: ['product_offerings'],
    queryFn: () => base44.entities.ProductOffering.list(),
  });

  const grouped = useMemo(() => {
    const map = {};
    offerings.forEach(o => {
      const fam = o.family || 'Support';
      if (!map[fam]) map[fam] = [];
      map[fam].push(o);
    });
    return map;
  }, [offerings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-textMuted" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {FAMILY_ORDER.filter(f => grouped[f]?.length > 0).map(family => {
        const cfg = FAMILY_CONFIG[family] || FAMILY_CONFIG.Support;
        const Icon = cfg.icon;
        return (
          <div key={family}>
            <div className="flex items-center gap-2 mb-4">
              <div className={cn('p-1.5 rounded-lg', cfg.bg)}>
                <Icon className={cn('w-4 h-4', cfg.color)} />
              </div>
              <h3 className="font-bold text-navy text-sm">{cfg.label}</h3>
              <span className="text-xs text-textMuted">({grouped[family].length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {grouped[family].map(o => (
                <OfferingCard key={o.id} offering={o} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}