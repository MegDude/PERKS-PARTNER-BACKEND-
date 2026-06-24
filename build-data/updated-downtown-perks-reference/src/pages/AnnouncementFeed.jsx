import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, Bell, AlertCircle, Wrench, Calendar, MessageSquare, Clock, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import moment from 'moment';
import EditorialHero from '@/components/editorial/EditorialHero';

const TYPE_CONFIG = {
  urgent:        { label: 'Urgent',         dot: 'bg-red-500',    chip: 'bg-red-50 text-red-700',        icon: AlertCircle },
  maintenance:   { label: 'Maintenance',    dot: 'bg-amber-400',  chip: 'bg-amber-50 text-amber-700',    icon: Wrench },
  community_news:{ label: 'Community',      dot: 'bg-blue-400',   chip: 'bg-blue-50 text-blue-700',      icon: MessageSquare },
  event:         { label: 'Event',          dot: 'bg-purple-400', chip: 'bg-purple-50 text-purple-700',  icon: Calendar },
  reminder:      { label: 'Reminder',       dot: 'bg-slate-400',  chip: 'bg-slate-100 text-slate-600',   icon: Clock },
};

const TYPE_FILTERS = ['all', 'urgent', 'maintenance', 'community_news', 'event', 'reminder'];

// Demo fallback
const DEMO_ANNOUNCEMENTS = [
  {
    id: 'a1', title: 'Rooftop Access Temporarily Suspended',
    message: 'The rooftop terrace will be closed April 18–20 for pressure washing and furniture maintenance. We apologize for any inconvenience and appreciate your patience.',
    type: 'maintenance', priority: 'high', status: 'published',
    published_at: new Date(Date.now() - 2 * 3600000).toISOString(), read_count: 42,
  },
  {
    id: 'a2', title: 'April Resident Happy Hour — This Saturday',
    message: 'Join your neighbors for the monthly rooftop social this Saturday at 6pm. Craft cocktails and light bites provided. RSVP in the Events tab.',
    type: 'event', priority: 'medium', status: 'published',
    published_at: new Date(Date.now() - 24 * 3600000).toISOString(), read_count: 67,
  },
  {
    id: 'a3', title: 'Package Room Hours Extended',
    message: 'The package room is now accessible 6am–11pm daily. Use your resident fob for 24/7 Amazon Hub access. See the front desk for setup.',
    type: 'community_news', priority: 'medium', status: 'published',
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(), read_count: 88,
  },
  {
    id: 'a4', title: 'Lease Renewal Reminders — May Expirations',
    message: 'Residents with leases expiring in May should contact management by April 25 to discuss renewal options and current pricing.',
    type: 'reminder', priority: 'medium', status: 'published',
    published_at: new Date(Date.now() - 5 * 86400000).toISOString(), read_count: 31,
  },
  {
    id: 'a5', title: '⚠ Water Shutoff — April 17, 9–11am',
    message: 'Emergency plumbing repairs require a building-wide water shutoff from 9:00am to 11:00am on April 17. Please plan accordingly.',
    type: 'urgent', priority: 'urgent', status: 'published',
    published_at: new Date(Date.now() - 6 * 3600000).toISOString(), read_count: 104,
  },
];

export default function AnnouncementFeed() {
  const ctx = useOutletContext();
  const buildingId = ctx?.buildingId;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const { data: dbAnnouncements = [], isLoading } = useQuery({
    queryKey: ['announcements-feed', buildingId],
    queryFn: () => buildingId
      ? base44.entities.Announcement.filter({ building_id: buildingId, status: 'published' }, '-published_at', 50)
      : base44.entities.Announcement.filter({ status: 'published' }, '-published_at', 50),
  });

  const announcements = dbAnnouncements.length > 0 ? dbAnnouncements : DEMO_ANNOUNCEMENTS;
  const isDemo = dbAnnouncements.length === 0;

  const filtered = announcements.filter(a => {
    const s = search.toLowerCase();
    return (!s || a.title?.toLowerCase().includes(s) || a.message?.toLowerCase().includes(s)) &&
      (typeFilter === 'all' || a.type === typeFilter);
  });

  const urgentCount = announcements.filter(a => a.priority === 'urgent').length;
  const recentCount = announcements.filter(a => moment(a.published_at).isAfter(moment().subtract(24, 'hours'))).length;

  return (
    <div className="min-h-screen bg-bgMain">

      {/* Editorial Hero */}
      <EditorialHero
        eyebrow="Announcements"
        headline="What residents should know."
        support="Important updates, maintenance notices, and community news from your property team."
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-sm text-textMuted">{filtered.length} update{filtered.length !== 1 ? 's' : ''}</div>
          <div className="relative w-full sm:w-64 sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search announcements…"
              className="w-full pl-9 pr-8 py-2.5 bg-bgAlt rounded-xl text-sm text-navy placeholder:text-textMuted border-0 outline-none focus:ring-2 focus:ring-gold/20"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-textMuted" />
              </button>
            )}
          </div>
        </div>
      </EditorialHero>

      {/* Type pills bar */}
      <div className="bg-white border-b border-[var(--border-subtle)]">
        <div className="max-w-3xl mx-auto px-6 pb-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {TYPE_FILTERS.map(t => {
            const cfg = TYPE_CONFIG[t];
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                  typeFilter === t ? 'bg-navy text-white' : 'bg-bgAlt text-textSecondary hover:bg-bgHover'
                )}
              >
                {t === 'all' ? 'All' : cfg?.label || t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-3">

        {/* Alert banners */}
        {(urgentCount > 0 || recentCount > 0) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {urgentCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 shrink-0">
                <AlertCircle className="w-3.5 h-3.5" /> {urgentCount} urgent update{urgentCount !== 1 ? 's' : ''}
              </div>
            )}
            {recentCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-700 shrink-0">
                <Bell className="w-3.5 h-3.5" /> {recentCount} new in past 24h
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-navy">No announcements</p>
            <p className="text-sm text-gray-500">Check back soon for updates</p>
          </div>
        ) : (
          filtered.map(announcement => {
            const cfg = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.community_news;
            const Icon = cfg.icon;
            const isExpanded = expandedId === announcement.id;
            const isUrgent = announcement.priority === 'urgent';

            return (
              <div
                key={announcement.id}
                className={cn(
                  'bg-white rounded-2xl overflow-hidden transition-shadow',
                  isUrgent ? 'ring-1 ring-red-200' : '',
                  'hover:shadow-[0_4px_24px_rgba(0,0,0,0.09)] shadow-[0_2px_12px_rgba(0,0,0,0.05)]'
                )}
              >
                <button
                  className="w-full text-left px-6 py-5"
                  onClick={() => setExpandedId(isExpanded ? null : announcement.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('w-2.5 h-2.5 rounded-full mt-1.5 shrink-0', cfg.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className={cn('font-bold text-base leading-snug', isUrgent ? 'text-red-700' : 'text-navy')}>
                          {announcement.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{announcement.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        <span className={cn('font-semibold px-2 py-0.5 rounded-full', cfg.chip)}>
                          {cfg.label}
                        </span>
                        {announcement.published_at && (
                          <span>{moment(announcement.published_at).fromNow()}</span>
                        )}
                        {announcement.read_count > 0 && (
                          <span>{announcement.read_count} views</span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform', isExpanded && 'rotate-180')} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-5 pt-1 border-t border-gray-100">
                    <p className="text-sm text-black leading-relaxed">{announcement.message}</p>
                    {announcement.published_at && (
                      <p className="text-xs text-gray-400 mt-3">
                        Published {moment(announcement.published_at).format('MMMM D, YYYY [at] h:mm A')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}