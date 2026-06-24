import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Star, MapPin, Phone, Globe, Clock, Coffee, Utensils, Music,
  Dumbbell, ShoppingBag, Search, TrendingUp, Users, BarChart3,
  Filter, X, Loader2, ChevronRight, Sparkles, Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Demo fallback data ──────────────────────────────────────────────────────
const DEMO_PERKS = [
  {
    id: 'd1', name: 'Sixth Street Roasters', category: 'Coffee', category_key: 'coffee',
    address: '212 W 6th St, Austin, TX', district: 'seaholm',
    perk: '1 complimentary espresso drink daily with resident ID', perk_type: 'coffee',
    hours: 'Mon–Fri 6am–7pm, Sat–Sun 7am–6pm', contact_phone: '(512) 555-0181',
    website: 'https://sixthstreetroasters.com', is_featured: true, is_active: true,
    relevance_score: 98, lat: 30.269, lng: -97.752,
  },
  {
    id: 'd2', name: 'Lamberts Downtown BBQ', category: 'Restaurant', category_key: 'restaurant',
    address: '401 W 2nd St, Austin, TX', district: 'seaholm',
    perk: '15% off total bill + complimentary dessert on birthdays', perk_type: 'dining',
    hours: 'Daily 11am–10pm', contact_phone: '(512) 494-1500',
    website: 'https://lambertsaustin.com', is_featured: true, is_active: true,
    relevance_score: 94, lat: 30.264, lng: -97.748,
  },
  {
    id: 'd3', name: 'Uchi Austin', category: 'Restaurant', category_key: 'restaurant',
    address: '801 S Lamar Blvd, Austin, TX', district: 'seaholm',
    perk: 'Complimentary tasting course for two on reservation nights', perk_type: 'dining',
    hours: 'Mon–Thu 5pm–10pm, Fri–Sat 5pm–11pm', contact_phone: '(512) 916-4808',
    website: 'https://uchiaustin.com', is_featured: false, is_active: true,
    relevance_score: 90, lat: 30.256, lng: -97.758,
  },
  {
    id: 'd4', name: 'Black Swan Yoga', category: 'Fitness', category_key: 'fitness',
    address: '514 W 6th St, Austin, TX', district: 'seaholm',
    perk: '2 free classes per month + 20% off memberships', perk_type: 'wellness',
    hours: 'Daily 6am–9pm', contact_phone: '(512) 555-0233',
    website: 'https://blackswanyoga.com', is_featured: false, is_active: true,
    relevance_score: 87, lat: 30.270, lng: -97.754,
  },
  {
    id: 'd5', name: 'Banger\'s Sausage & Beer', category: 'Bar & Nightlife', category_key: 'bar_nightlife',
    address: '79 Rainey St, Austin, TX', district: 'rainey',
    perk: 'Free pint with any food purchase, skip-the-line priority entry', perk_type: 'drink',
    hours: 'Mon–Wed 4pm–2am, Thu–Sun 12pm–2am', contact_phone: '(512) 386-1656',
    website: 'https://bangersaustin.com', is_featured: true, is_active: true,
    relevance_score: 85, lat: 30.258, lng: -97.740,
  },
  {
    id: 'd6', name: 'Wanderlust Wine Bar', category: 'Bar & Nightlife', category_key: 'bar_nightlife',
    address: '83 Rainey St, Austin, TX', district: 'rainey',
    perk: 'Complimentary glass of house wine on first visit each month', perk_type: 'drink',
    hours: 'Tue–Sun 4pm–midnight', contact_phone: '(512) 555-0344',
    website: 'https://wanderlustwine.co', is_featured: false, is_active: true,
    relevance_score: 80, lat: 30.258, lng: -97.741,
  },
  {
    id: 'd7', name: 'Kendra Scott Flagship', category: 'Shopping', category_key: 'shopping',
    address: '203 W 2nd St, Austin, TX', district: 'seaholm',
    perk: '10% resident discount + early access to new collections', perk_type: 'retail',
    hours: 'Mon–Sat 10am–8pm, Sun 11am–6pm', contact_phone: '(512) 732-6661',
    website: 'https://kendrascott.com', is_featured: false, is_active: true,
    relevance_score: 76, lat: 30.263, lng: -97.747,
  },
  {
    id: 'd8', name: 'Houndstooth Coffee', category: 'Coffee', category_key: 'coffee',
    address: '401 Congress Ave, Austin, TX', district: 'cbd',
    perk: 'Loyalty stamp doubled — earn rewards twice as fast', perk_type: 'coffee',
    hours: 'Mon–Fri 7am–6pm, Sat 8am–5pm', contact_phone: '(512) 555-0455',
    website: 'https://houndstoothcoffee.com', is_featured: false, is_active: true,
    relevance_score: 73, lat: 30.267, lng: -97.743,
  },
];

const DEMO_REDEMPTIONS = [
  { id: 'r1', perk_id: 'd1', user_email: 'a@shore.com', perk_name: 'Sixth Street Roasters', redeemed_at: '2026-04-10T09:15:00' },
  { id: 'r2', perk_id: 'd1', user_email: 'b@shore.com', perk_name: 'Sixth Street Roasters', redeemed_at: '2026-04-11T08:30:00' },
  { id: 'r3', perk_id: 'd1', user_email: 'c@shore.com', perk_name: 'Sixth Street Roasters', redeemed_at: '2026-04-12T09:00:00' },
  { id: 'r4', perk_id: 'd2', user_email: 'a@shore.com', perk_name: 'Lamberts', redeemed_at: '2026-04-09T19:00:00' },
  { id: 'r5', perk_id: 'd2', user_email: 'd@shore.com', perk_name: 'Lamberts', redeemed_at: '2026-04-08T20:00:00' },
  { id: 'r6', perk_id: 'd5', user_email: 'e@shore.com', perk_name: 'Bangers', redeemed_at: '2026-04-13T21:00:00' },
  { id: 'r7', perk_id: 'd5', user_email: 'f@shore.com', perk_name: 'Bangers', redeemed_at: '2026-04-14T22:00:00' },
  { id: 'r8', perk_id: 'd4', user_email: 'b@shore.com', perk_name: 'Black Swan Yoga', redeemed_at: '2026-04-07T07:00:00' },
];

// ─── Category config ─────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  coffee:        { icon: Coffee,      bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  restaurant:    { icon: Utensils,    bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  bar_nightlife: { icon: Music,       bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  fitness:       { icon: Dumbbell,    bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200' },
  shopping:      { icon: ShoppingBag, bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200' },
};
const DEFAULT_CAT = { icon: Star, bg: 'bg-gold/10', text: 'text-gold', border: 'border-gold/20' };

function getCat(key) { return CATEGORY_CONFIG[key] || DEFAULT_CAT; }

const ALL_CATEGORIES = ['All', 'Coffee', 'Restaurant', 'Bar & Nightlife', 'Fitness', 'Shopping'];

// ─── Component ───────────────────────────────────────────────────────────────
export default function DowntownPerks() {
  const { buildingId, building } = useOutletContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const { data: dbPerks = [], isLoading } = useQuery({
    queryKey: ['perk_locations'],
    queryFn: () => base44.entities.PerkLocation.list('-relevance_score'),
  });

  const { data: dbRedemptions = [] } = useQuery({
    queryKey: ['redemptions'],
    queryFn: () => base44.entities.PerkRedemption.list(),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants', buildingId],
    queryFn: () => base44.entities.Tenant.list(),
  });

  const { data: flats = [] } = useQuery({
    queryKey: ['flats', buildingId],
    queryFn: () => base44.entities.Flat.filter({ building_id: buildingId }),
    enabled: !!buildingId,
  });

  // Use real data when available, otherwise demo data
  const perks = dbPerks.length > 0 ? dbPerks : DEMO_PERKS;
  const redemptions = dbRedemptions.length > 0 ? dbRedemptions : DEMO_REDEMPTIONS;

  // Building residents
  const buildingTenants = tenants.filter(t => flats.some(f => f.id === t.flat_id));
  const enrolled = buildingTenants.filter(t => t.perks_enrolled).length;
  const enrollmentRate = buildingTenants.length > 0 ? Math.round((enrolled / buildingTenants.length) * 100) : 64;

  // Redemptions for this building's residents
  const buildingEmails = new Set(buildingTenants.map(t => t.email));
  const buildingRedemptions = buildingTenants.length > 0
    ? redemptions.filter(r => buildingEmails.has(r.user_email))
    : redemptions; // demo: show all

  // Filter perks
  const filtered = useMemo(() => {
    let list = [...perks];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(s) || p.address?.toLowerCase().includes(s) || p.category?.toLowerCase().includes(s));
    }
    if (activeCategory !== 'All') {
      list = list.filter(p => p.category === activeCategory || p.category?.toLowerCase() === activeCategory.toLowerCase());
    }
    return list;
  }, [perks, search, activeCategory]);

  // Stats
  const totalRedemptions = buildingRedemptions.length;
  const uniqueRedeemers = new Set(buildingRedemptions.map(r => r.user_email)).size;

  // Top perks by redemptions
  const topPerks = [...perks]
    .map(p => ({ ...p, count: buildingRedemptions.filter(r => r.perk_id === p.id).length }))
    .filter(p => p.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const isDemo = dbPerks.length === 0;

  return (
    <div className="min-h-screen bg-bgMain">
      {/* Brand Header */}
      <div className="relative overflow-hidden bg-navy">
        <div className="absolute inset-0">
          <img
            src="https://media.base44.com/images/public/69d9dc12f3d4c38702f82b0c/321c3d86d_generated_image.png"
            alt="Austin dining experience"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-xs font-semibold text-white mb-4 tracking-wide uppercase border border-white/10">
            <Star className="w-3 h-3 text-gold" />
            Resident Perks Program
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-[1.1] tracking-tight max-w-2xl">
            Downtown Perks
          </h1>
          <p className="text-white/70 text-sm sm:text-base mt-3 max-w-xl leading-relaxed">
            Exclusive offers from local Austin businesses — curated for residents of {building?.name || 'your building'}.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Demo badge */}
        {isDemo && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gold/10 border border-gold/30 rounded-xl text-sm text-navy font-medium w-fit">
            <Sparkles className="w-4 h-4 text-gold" />
            Showing sample data — add real PerkLocations to replace this demo
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Perks', value: perks.filter(p => p.is_active !== false).length, icon: Star, gold: true },
            { label: 'Enrolled Residents', value: buildingTenants.length > 0 ? enrolled : 64, sub: `${enrollmentRate}% enrollment`, icon: Users },
            { label: 'Total Redemptions', value: totalRedemptions || buildingRedemptions.length, icon: TrendingUp },
            { label: 'Unique Redeemers', value: uniqueRedeemers || new Set(buildingRedemptions.map(r => r.user_email)).size, icon: BarChart3 },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-textMuted uppercase tracking-wide">{s.label}</span>
                  <Icon className={cn('w-4 h-4', s.gold ? 'text-gold' : 'text-navy')} />
                </div>
                <div className={cn('text-3xl font-bold', s.gold ? 'text-gold' : 'text-navy')}>{s.value}</div>
                {s.sub && <div className="text-xs text-textMuted mt-1">{s.sub}</div>}
              </div>
            );
          })}
        </div>

        {/* Top Redeemed */}
        {topPerks.length > 0 && (
          <div className="bg-white rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-4 h-4 text-gold" />
              <h3 className="font-bold text-navy">Most Redeemed This Month</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topPerks.map((p, i) => {
                const cat = getCat(p.category_key);
                const Icon = cat.icon;
                return (
                  <div key={p.id} className="flex items-center gap-3 p-4 bg-bgMain rounded-xl">
                    <div className="text-2xl font-black text-textMuted/20 w-7 shrink-0">#{i + 1}</div>
                    <div className={cn('p-2 rounded-xl shrink-0', cat.bg)}>
                      <Icon className={cn('w-4 h-4', cat.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy text-sm truncate">{p.name}</div>
                      <div className="text-xs text-textMuted">{p.count} redemptions</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <Input
              placeholder="Search venues…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white border-[var(--border-subtle)] text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap',
                  activeCategory === cat
                    ? 'bg-navy text-white'
                    : 'bg-white text-textSecondary hover:bg-bgAlt border border-[var(--border-subtle)]'
                )}
              >
                {cat}
              </button>
            ))}
            {(search || activeCategory !== 'All') && (
              <button
                onClick={() => { setSearch(''); setActiveCategory('All'); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-textMuted hover:text-navy transition-colors"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Count */}
        <p className="text-sm text-textMuted -mt-2">
          {filtered.length} {filtered.length === 1 ? 'venue' : 'venues'} with exclusive resident perks
        </p>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-textMuted" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Star className="w-10 h-10 text-textMuted/30 mx-auto mb-3" />
            <p className="text-textSecondary font-medium">No perks found</p>
            <p className="text-textMuted text-sm">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((loc) => {
              const redemptionCount = buildingRedemptions.filter(r => r.perk_id === loc.id).length;
              return (
                <PerkCard
                  key={loc.id}
                  loc={loc}
                  redemptionCount={redemptionCount}
                  buildingId={buildingId}
                  onClick={() => navigate(`/buildings/${buildingId}/perks/${loc.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Perk Card ───────────────────────────────────────────────────────────────
function PerkCard({ loc, redemptionCount, buildingId, onClick }) {
  const cat = getCat(loc.category_key);
  const Icon = cat.icon;

  return (
    <button
      onClick={onClick}
      className="group text-left bg-white rounded-2xl p-5 hover:shadow-[0_8px_32px_rgba(11,31,51,0.10)] transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn('p-2 rounded-xl shrink-0', cat.bg)}>
            <Icon className={cn('w-4 h-4', cat.text)} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-navy text-sm leading-tight truncate">{loc.name}</h3>
            <span className={cn('text-xs font-medium', cat.text)}>{loc.category}</span>
          </div>
        </div>
        {loc.is_featured && (
          <span className="text-xs bg-gold/15 text-gold font-semibold px-2 py-0.5 rounded-full shrink-0">Featured</span>
        )}
      </div>

      {/* Perk offer */}
      {loc.perk && (
        <div className="bg-gold/8 border border-gold/25 rounded-xl px-3 py-2.5">
          <p className="text-xs font-semibold text-navy leading-relaxed">{loc.perk}</p>
        </div>
      )}

      {/* Redemption badge */}
      {redemptionCount > 0 && (
        <div className="flex items-center gap-1.5 bg-navy/5 rounded-lg px-3 py-1.5">
          <TrendingUp className="w-3 h-3 text-navy" />
          <span className="text-xs font-semibold text-navy">{redemptionCount} redeemed here</span>
        </div>
      )}

      {/* Meta */}
      <div className="space-y-1 text-xs text-textMuted flex-1">
        {loc.address && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{loc.address}</span>
          </div>
        )}
        {loc.hours && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">{loc.hours}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
        {loc.website ? (
          <a
            href={loc.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-textMuted hover:text-navy transition-colors"
          >
            <Globe className="w-3 h-3" />
            Website
          </a>
        ) : <span />}
        <span className="flex items-center gap-1 text-xs text-gold font-semibold group-hover:gap-2 transition-all">
          View details <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}