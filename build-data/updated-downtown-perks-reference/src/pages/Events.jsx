import { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, MapPin, Clock, Users, Search, X, ChevronRight, Sparkles, ArrowUpRight, Map as MapIcon, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import EventsMap from '@/components/EventsMap';
import EditorialHero from '@/components/editorial/EditorialHero';

// ── Demo events shown when DB is empty ──────────────────────────────────────
const DEMO_EVENTS = [
  {
    id: 'e1', title: 'Rooftop Sunset Social', category: 'social',
    date: '2026-06-25', time: '6:00 PM', location: 'Rooftop Terrace',
    description: 'Unwind with neighbors and enjoy panoramic city views. Light bites and craft cocktails provided.',
    capacity: 40, registered_count: 28, image_color: 'from-orange-400 to-pink-500',
    lat: 30.2632, lng: -97.7401,
  },
  {
    id: 'e2', title: 'Downtown Art Walk', category: 'community',
    date: '2026-06-28', time: '7:00 PM', location: 'Congress Ave Galleries',
    description: 'Guided tour of Austin\'s most celebrated galleries with exclusive resident access and artist meet-and-greets.',
    capacity: 20, registered_count: 14, image_color: 'from-purple-500 to-indigo-600',
    lat: 30.2701, lng: -97.7444,
  },
  {
    id: 'e3', title: 'Morning Yoga on the Lawn', category: 'wellness',
    date: '2026-06-30', time: '7:30 AM', location: 'Building Courtyard',
    description: 'Start your Thursday with an energizing flow session led by a certified instructor. Mats provided.',
    capacity: 15, registered_count: 9, image_color: 'from-emerald-400 to-teal-500',
    lat: 30.2672, lng: -97.7431,
  },
  {
    id: 'e4', title: 'Neighbors & Negronis', category: 'social',
    date: '2026-07-02', time: '7:00 PM', location: 'Banger\'s Sausage & Beer',
    description: 'Monthly residents-only happy hour at our featured Downtown Perks partner. First round on the house.',
    capacity: 50, registered_count: 37, image_color: 'from-amber-400 to-orange-500',
    lat: 30.2621, lng: -97.7395,
  },
  {
    id: 'e5', title: 'Food & Wine Pairing', category: 'dining',
    date: '2026-07-07', time: '7:30 PM', location: 'Uchi Austin',
    description: 'An intimate five-course dining experience curated for Shore residents. Limited seats — book early.',
    capacity: 12, registered_count: 10, image_color: 'from-rose-500 to-red-600',
    lat: 30.2505, lng: -97.7701,
  },
  {
    id: 'e6', title: 'Tech Networking Mixer', category: 'networking',
    date: '2026-07-10', time: '6:30 PM', location: 'Co-working Lounge, Floor 3',
    description: 'Meet fellow residents working in tech and startups. Demos, pitches, and connections.',
    capacity: 30, registered_count: 12, image_color: 'from-sky-500 to-blue-600',
    lat: 30.2672, lng: -97.7431,
  },
];

const CATEGORY_CONFIG = {
  social:        { label: 'Social',        color: 'bg-pink-50 text-pink-700' },
  community:     { label: 'Community',     color: 'bg-blue-50 text-blue-700' },
  wellness:      { label: 'Wellness',      color: 'bg-emerald-50 text-emerald-700' },
  dining:        { label: 'Dining',        color: 'bg-orange-50 text-orange-700' },
  networking:    { label: 'Networking',    color: 'bg-indigo-50 text-indigo-700' },
  entertainment: { label: 'Entertainment', color: 'bg-amber-50 text-amber-700' },
};

const ALL_CATS = ['All', ...Object.keys(CATEGORY_CONFIG)];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function spotsLeft(event) {
  const cap = event.capacity || 0;
  const reg = event.registered_count || event.registered || 0;
  return Math.max(0, cap - reg);
}

export default function Events() {
  const { buildingId, building } = useOutletContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [hideFull, setHideFull] = useState(false);
  const [hideCancelled, setHideCancelled] = useState(false);

  const { data: dbEvents = [], isLoading } = useQuery({
    queryKey: ['events', buildingId],
    queryFn: async () => {
      const all = await base44.entities.Event.list('-date');
      return buildingId
        ? all.filter(e => !e.building_id || e.building_id === buildingId)
        : all;
    },
    enabled: true,
  });

  const events = dbEvents.length > 0 ? dbEvents : DEMO_EVENTS;
  const isDemo = dbEvents.length === 0;

  const filtered = useMemo(() => {
    let list = [...events];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e =>
        e.title?.toLowerCase().includes(s) ||
        e.location?.toLowerCase().includes(s) ||
        e.description?.toLowerCase().includes(s)
      );
    }
    if (activeCategory !== 'All') {
      list = list.filter(e => e.category === activeCategory);
    }
    return list;
  }, [events, search, activeCategory]);

  const mapFiltered = useMemo(() => {
    let list = [...filtered];
    if (hideFull) {
      list = list.filter(e => !(e.capacity > 0 && (e.registered_count || 0) >= e.capacity));
    }
    if (hideCancelled) {
      list = list.filter(e => e.status !== 'cancelled');
    }
    return list;
  }, [filtered, hideFull, hideCancelled]);

  const featured = filtered[0] || null;
  const rest = filtered.slice(1);

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    navigate(`/buildings/${buildingId}/events/${event.id}`);
  };

  return (
    <div className="min-h-screen bg-bgMain">

      {/* ── Editorial Hero ── */}
      <EditorialHero
        eyebrow="Events"
        headline="Things worth showing up for."
        support="See what's happening nearby and make plans before everyone else does."
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-sm text-textMuted">{filtered.length} upcoming experiences</div>
          <div className="flex items-center gap-3 sm:ml-auto">
            {/* View toggle */}
            <div className="flex items-center bg-bgAlt rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', viewMode === 'grid' ? 'bg-white text-navy shadow-sm' : 'text-textMuted')}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', viewMode === 'map' ? 'bg-white text-navy shadow-sm' : 'text-textMuted')}
              >
                <MapIcon className="w-3.5 h-3.5" /> Map
              </button>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events…"
                className="w-full pl-9 pr-8 py-2.5 bg-bgAlt rounded-xl text-sm text-navy placeholder:text-textMuted border-0 outline-none focus:ring-2 focus:ring-gold/20"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-textMuted" />
                </button>
              )}
            </div>
          </div>
        </div>
      </EditorialHero>

      {/* Category pills bar */}
      <div className="bg-white border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {ALL_CATS.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                activeCategory === cat
                  ? 'bg-navy text-white'
                  : 'bg-bgAlt text-textSecondary hover:bg-bgHover'
              )}
            >
              {cat === 'All' ? 'All Experiences' : CATEGORY_CONFIG[cat]?.label || cat}
            </button>
          ))}
        </div>
      </div>

      {isDemo && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-bgAlt border border-[var(--border-default)] rounded-xl text-xs font-medium text-textSecondary">
            <Sparkles className="w-3.5 h-3.5" />
            Sample experiences — real events will appear once added
          </div>
        </div>
      )}

      {/* ── Map View ── */}
      {viewMode === 'map' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Quick filter toggles */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mr-1">Filters:</span>
            <button
              onClick={() => setHideFull(!hideFull)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                hideFull ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Users className="w-3 h-3" />
              {hideFull ? '✓ ' : ''}Hide full
            </button>
            <button
              onClick={() => setHideCancelled(!hideCancelled)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                hideCancelled ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <X className="w-3 h-3" />
              {hideCancelled ? '✓ ' : ''}Hide cancelled
            </button>
            {(hideFull || hideCancelled) && (
              <button
                onClick={() => { setHideFull(false); setHideCancelled(false); }}
                className="text-xs font-semibold text-gray-400 hover:text-navy transition-colors ml-1"
              >
                Reset
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
            {/* Map */}
            <div className="lg:col-span-2 h-full min-h-[400px]">
              <EventsMap
                events={mapFiltered}
                selectedEvent={selectedEvent}
                onEventSelect={handleEventSelect}
                building={building}
              />
            </div>

            {/* Side panel: event list */}
            <div className="bg-white rounded-xl border border-[var(--border-subtle)] shadow-soft overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-navy">
                <h3 className="text-sm font-bold text-white">On the Map</h3>
                <p className="text-xs text-white/50">{mapFiltered.filter(e => e.lat != null).length} plotted events</p>
              </div>
              <div className="overflow-y-auto flex-1">
                {mapFiltered.map(event => {
                  const catCfg = CATEGORY_CONFIG[event.category] || { label: event.category, color: 'bg-navy/10 text-navy' };
                  const left = spotsLeft(event);
                  return (
                    <button
                      key={event.id}
                      onClick={() => handleEventSelect(event)}
                      onMouseEnter={() => setHoveredId(event.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-[var(--border-subtle)] transition-colors',
                        hoveredId === event.id ? 'bg-bgAlt' : 'hover:bg-bgAlt/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-navy text-sm leading-tight">{event.title}</span>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0', catCfg.color)}>
                          {catCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-textMuted">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(event.date)}</span>
                        {event.location && <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {event.location}</span>}
                      </div>
                    </button>
                  );
                })}
                {mapFiltered.length === 0 && (
                  <p className="text-center py-8 text-textMuted text-sm">No events match filters</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Grid View ── */}
      {viewMode === 'grid' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* Featured event */}
          {featured && (
            <button
              onClick={() => navigate(`/buildings/${buildingId}/events/${featured.id}`)}
              className="w-full text-left group"
            >
              <div className="bg-white rounded-2xl overflow-hidden hover:shadow-[0_12px_48px_rgba(17,17,17,0.10)] transition-all duration-300">
                <div className={cn('h-56 bg-gradient-to-br relative', featured.image_color || featured.image_url || 'from-navy to-navySoft')}>
                  {featured.image_url && <img src={featured.image_url} alt={featured.title} className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="text-xs font-bold text-white/90 uppercase tracking-widest bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full">
                      Coming Up
                    </span>
                    {spotsLeft(featured) <= 5 && spotsLeft(featured) > 0 && (
                      <span className="text-xs font-bold text-white bg-red-500/80 backdrop-blur-sm px-3 py-1 rounded-full">
                        {spotsLeft(featured)} spots left
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <ArrowUpRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', CATEGORY_CONFIG[featured.category]?.color || 'bg-navy/10 text-navy')}>
                          {CATEGORY_CONFIG[featured.category]?.label || featured.category}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-navy mb-2 leading-tight">{featured.title}</h2>
                      <p className="text-sm text-[#6f6b65] leading-relaxed line-clamp-2">{featured.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-[#8d887f] mb-1">{formatDate(featured.date)}</div>
                      {featured.time && <div className="text-sm font-semibold text-navy">{featured.time}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                    {featured.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {featured.location}
                      </span>
                    )}
                    {featured.capacity > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 shrink-0" /> {featured.registered_count || 0}/{featured.capacity} attending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Rest of events */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rest.map(event => {
                const catCfg = CATEGORY_CONFIG[event.category] || { label: event.category, color: 'bg-navy/10 text-navy' };
                const left = spotsLeft(event);
                const pct = event.capacity > 0 ? Math.round(((event.registered_count || 0) / event.capacity) * 100) : 0;

                return (
                  <button
                    key={event.id}
                    onClick={() => navigate(`/buildings/${buildingId}/events/${event.id}`)}
                    onMouseEnter={() => setHoveredId(event.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="text-left group"
                  >
                    <div className={cn(
                      'bg-white rounded-2xl overflow-hidden transition-all duration-200',
                      hoveredId === event.id
                        ? 'shadow-[0_12px_40px_rgba(0,0,0,0.12)] -translate-y-0.5'
                        : 'shadow-[0_2px_12px_rgba(0,0,0,0.05)]'
                    )}>
                      <div className={cn('h-28 bg-gradient-to-br relative', event.image_color || 'from-gray-800 to-gray-900')}>
                        {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-navy/10" />
                        {left <= 3 && left > 0 && (
                          <div className="absolute top-3 right-3 text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                            {left} left
                          </div>
                        )}
                        {left === 0 && event.capacity > 0 && (
                          <div className="absolute top-3 right-3 text-xs font-bold bg-gray-500 text-white px-2 py-0.5 rounded-full">
                            Full
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', catCfg.color)}>
                            {catCfg.label}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(event.date)}</span>
                        </div>

                        <h3 className="font-bold text-navy text-base leading-snug mb-2 group-hover:text-navy/80 transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-4">
                          {event.description}
                        </p>

                        <div className="space-y-2 text-xs text-gray-400">
                          {event.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 shrink-0" /> {event.location}
                            </div>
                          )}
                          {event.time && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 shrink-0" /> {event.time}
                            </div>
                          )}
                        </div>

                        {event.capacity > 0 && (
                          <div className="mt-4 pt-4 border-t border-[#f0ede7]">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-gray-400 flex items-center gap-1">
                                <Users className="w-3 h-3" /> {event.registered_count || 0} attending
                              </span>
                              <span className={cn('font-semibold', pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-amber-600' : 'text-gray-600')}>
                                {left > 0 ? `${left} spots left` : 'Full'}
                              </span>
                            </div>
                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-500')}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs font-semibold text-navy group-hover:underline">View details</span>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-24">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-navy">No experiences found</p>
              <p className="text-sm text-gray-500">Try a different search or category</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}