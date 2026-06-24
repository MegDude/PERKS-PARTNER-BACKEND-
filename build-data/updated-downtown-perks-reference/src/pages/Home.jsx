import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, Users, Calendar, Star, FileText, BarChart3, MessageSquare,
  Loader2, Bell, TrendingUp, ChevronRight,
  LayoutDashboard, Home as HomeIcon, Settings, Zap, ArrowUpRight, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CommunityStories from '@/components/CommunityStories';

const MODULE_GROUPS = [
  {
    label: 'Operations',
    items: [
      { title: 'Residents', description: 'Directory & lease info', icon: Users, path: 'residents' },
      { title: 'Amenities', description: 'Reservations & scheduling', icon: HomeIcon, path: 'amenities' },
    ]
  },
  {
    label: 'Resident Experience',
    items: [
      { title: 'Events', description: 'Community events & RSVPs', icon: Calendar, path: 'events' },
      { title: 'Downtown Perks', description: 'Local merchant offers', icon: Star, path: 'perks' },
      { title: 'Announcements', description: 'Property-wide communications', icon: Bell, path: 'announcements-feed' },
    ]
  },
  {
    label: 'Engagement & Insights',
    items: [
      { title: 'Surveys', description: 'Resident feedback forms', icon: FileText, path: 'surveys' },
      { title: 'Engagement Hub', description: 'Participation metrics', icon: MessageSquare, path: 'engagement', adminOnly: true },
      { title: 'Segmentation', description: 'Audience analysis', icon: TrendingUp, path: 'segmentation', adminOnly: true },
      { title: 'Reports', description: 'Analytics & performance', icon: BarChart3, path: 'reports', adminOnly: true },
    ]
  }
];

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: buildings = [], isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (buildings.length > 0 && !selectedBuilding) {
      setSelectedBuilding(buildings[0]);
    }
  }, [buildings]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = (e) => { if (!e.target.closest('[data-dropdown]')) setDropdownOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [dropdownOpen]);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-bgMain">
      {/* Hero Banner */}
      <div className="relative bg-navy overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://media.base44.com/images/public/69d9dc12f3d4c38702f82b0c/e8dab71eb_generated_image.png"
            alt="Downtown Austin during golden hour"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/60" />
        <div className="relative max-w-6xl mx-auto px-6 py-16 sm:py-20">
          <div className="flex items-end justify-between gap-8">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-xs font-semibold text-white mb-5 tracking-wide uppercase border border-white/10">
                <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
                Downtown Perks Partner Dashboard
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-[1.05] tracking-tight">
                Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}.
              </h1>
              <p className="text-white/60 text-base sm:text-lg max-w-lg leading-relaxed">
                Manage your properties, engage residents, and power local partner perks — all from one place.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2 shrink-0 pb-1">
              <button
                onClick={() => navigate('/buildings')}
                className="flex items-center gap-2 bg-white text-navy px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Building2 className="w-4 h-4" />
                All Properties
              </button>
              {isAdmin && (
                <button
                  onClick={() => navigate('/partner-portal')}
                  className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors px-2 py-1"
                >
                  <Zap className="w-3.5 h-3.5 text-gold" />
                  Partner Portal
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-3 text-textMuted py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading properties…</span>
          </div>
        )}

        {/* No buildings */}
        {!isLoading && buildings.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-xl font-bold text-navy mb-2">No properties yet</h3>
            <p className="text-textSecondary mb-6">Add a building to start managing your portfolio.</p>
            <button
              onClick={() => navigate('/buildings')}
              className="bg-navy text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-navySoft transition-colors"
            >
              Add a Property
            </button>
          </div>
        )}

        {/* Buildings present */}
        {!isLoading && buildings.length > 0 && (
          <div className="space-y-10">

            {/* Property Picker */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs font-semibold text-textMuted uppercase tracking-widest">Property</span>
              <div className="relative" data-dropdown>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-[var(--border-subtle)] rounded-xl hover:border-navy/30 transition-all shadow-soft text-sm"
                >
                  <Building2 className="w-4 h-4 text-black shrink-0" />
                  <span className="font-semibold text-navy max-w-[200px] truncate">
                    {selectedBuilding?.name || 'Choose…'}
                  </span>
                  {selectedBuilding?.address && (
                    <span className="text-textMuted text-xs hidden sm:inline truncate max-w-[160px]">{selectedBuilding.address}</span>
                  )}
                  <ChevronRight className={cn('w-4 h-4 text-textMuted transition-transform', dropdownOpen && 'rotate-90')} />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 min-w-[280px] bg-white rounded-xl shadow-[0_8px_40px_rgba(11,31,51,0.14)] border border-[var(--border-subtle)] z-30 overflow-hidden">
                    <div className="p-2">
                      {buildings.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => { setSelectedBuilding(b); setDropdownOpen(false); }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors text-left',
                            selectedBuilding?.id === b.id ? 'bg-navy text-white' : 'hover:bg-bgAlt text-textSecondary'
                          )}
                        >
                          <MapPin className={cn('w-3.5 h-3.5 shrink-0', selectedBuilding?.id === b.id ? 'text-white' : 'text-textMuted')} />
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{b.name}</div>
                            {b.address && <div className={cn('text-xs truncate', selectedBuilding?.id === b.id ? 'text-white/60' : 'text-textMuted')}>{b.address}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-[var(--border-subtle)] p-2">
                      <button
                        onClick={() => { navigate('/buildings'); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-black hover:bg-gray-100 rounded-lg transition-colors font-medium"
                      >
                        <Building2 className="w-4 h-4" />
                        Manage all properties
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {selectedBuilding && (
                <button
                  onClick={() => navigate(`/buildings/${selectedBuilding.id}`)}
                  className="flex items-center gap-2 text-sm text-textSecondary hover:text-navy transition-colors ml-auto"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Full Dashboard
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Community Stories */}
            <CommunityStories buildingId={selectedBuilding?.id} />

            {/* Module Groups */}
            {selectedBuilding && (
              <div className="space-y-10">
                {MODULE_GROUPS.map((group) => {
                  const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
                  if (visibleItems.length === 0) return null;
                  return (
                    <div key={group.label}>
                      <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-4">{group.label}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {visibleItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.path}
                              onClick={() => navigate(`/buildings/${selectedBuilding.id}/${item.path}`)}
                              className="group flex items-center gap-4 px-5 py-4 bg-white rounded-2xl hover:bg-navy transition-all duration-300 text-left shadow-sm hover:shadow-lg hover:-translate-y-0.5 border border-[var(--border-subtle)] hover:border-navy"
                            >
                              <div className="p-2.5 rounded-xl bg-gold/10 group-hover:bg-white/10 transition-colors shrink-0">
                                <Icon className="w-5 h-5 text-gold group-hover:text-gold transition-colors" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-navy group-hover:text-white text-sm transition-colors">{item.title}</div>
                                <div className="text-xs text-textMuted group-hover:text-white/50 mt-0.5 transition-colors">{item.description}</div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-textMuted group-hover:text-white/50 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer links */}
            <div className="flex flex-wrap gap-6 pt-6 border-t border-[var(--border-subtle)]">
              <button onClick={() => navigate('/partner-portal')} className="flex items-center gap-2 text-sm text-textSecondary hover:text-navy transition-colors">
                <Zap className="w-4 h-4 text-black" /> Partner Portal
              </button>
              {isAdmin && (
                <button onClick={() => navigate('/Settings')} className="flex items-center gap-2 text-sm text-textSecondary hover:text-navy transition-colors">
                  <Settings className="w-4 h-4" /> Settings
                </button>
              )}
              <button onClick={() => navigate('/buildings')} className="flex items-center gap-2 text-sm text-textSecondary hover:text-navy transition-colors">
                <Building2 className="w-4 h-4" /> All Properties
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}