import React from 'react';
import { Outlet, useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Calendar, Star, Home, MessageSquare, BarChart3, Building2, Bell, FileText, TrendingUp, ArrowLeft, MapPin } from 'lucide-react';
import BuildingBottomNav from '@/components/nav/BuildingBottomNav';

const TAB_CONFIG = {
  admin: [
    { path: '', label: 'Dashboard', icon: LayoutDashboard },
    { path: 'residents', label: 'Residents', icon: Users },
    { path: 'events', label: 'Events', icon: Calendar },
    { path: 'perks', label: 'Perks', icon: Star },
    { path: 'announcements', label: 'Announcements', icon: Bell },
    { path: 'surveys', label: 'Surveys', icon: FileText },
    { path: 'engagement', label: 'Engagement', icon: MessageSquare },
    { path: 'campaigns', label: 'Campaigns', icon: TrendingUp },
    { path: 'segmentation', label: 'Segmentation', icon: Users },
    { path: 'amenities', label: 'Amenities', icon: Home },
    { path: 'reports', label: 'Reports', icon: BarChart3 },
    { path: 'partners', label: 'Partners', icon: Building2 },
  ],
  resident: [
    { path: 'announcements-feed', label: 'Announcements', icon: Bell },
    { path: 'events', label: 'Events', icon: Calendar },
    { path: 'perks', label: 'Perks', icon: Star },
    { path: 'amenities', label: 'Amenities', icon: Home },
  ],
};

export default function BuildingLayout() {
  const { buildingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: buildings = [], isLoading } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: () => base44.entities.Building.list(),
    enabled: !!buildingId,
    select: (data) => data.filter(b => b.id === buildingId)
  });

  const building = buildings[0] || null;

  if (!buildingId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <div className="text-center">
          <p className="text-textSecondary mb-4">No property selected</p>
          <button onClick={() => navigate('/')} className="text-gold hover:underline font-medium">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while building data is being fetched — prevents
  // downstream pages from seeing building=null and showing "Building not found"
  if (isLoading || !building) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <div className="w-8 h-8 border-4 border-bgAlt border-t-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs = TAB_CONFIG[user?.role] || TAB_CONFIG.resident;
  const basePath = `/buildings/${buildingId}`;
  const currentPath = location.pathname.replace(basePath, '').replace(/^\//, '') || '';

  const isRootDashboard = currentPath === '';

  return (
    <div className="min-h-screen bg-bgMain">
      {/* Building Header */}
      <div className="bg-navy text-white safe-area-top sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            {!isRootDashboard ? (
              <button
                onClick={() => navigate(basePath)}
                className="flex items-center gap-1.5 text-sm text-white bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Home
              </button>
            )}
            <span className="text-xs text-white/40 uppercase tracking-widest hidden sm:block font-semibold">
              {isLoading ? 'Loading…' : building?.name || 'Property'}
            </span>
          </div>
          <div className="flex items-end justify-between gap-4 pb-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
                {isLoading ? 'Loading…' : building?.name || 'Property'}
              </h1>
              {building?.address && (
                <p className="text-white/50 text-sm flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {building.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Desktop/Tablet Tab Navigation */}
        <div className="border-b border-white/10 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-0 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => {
                const href = tab.path ? `${basePath}/${tab.path}` : basePath;
                const isActive = currentPath === tab.path || (tab.path === '' && currentPath === '');
                const Icon = tab.icon;

                return (
                  <Link
                    key={tab.path}
                    to={href}
                    className={cn(
                      'px-4 py-3.5 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                      isActive
                        ? 'border-gold text-white'
                        : 'border-transparent text-white/50 hover:text-white/80'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="pb-20 lg:pb-0">
        <Outlet context={{ buildingId, building, buildingName: building?.name }} />
      </div>

      {/* Mobile Bottom Navigation */}
      <BuildingBottomNav tabs={tabs} basePath={basePath} />
    </div>
  );
}