import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Mail, Phone, Star, Ticket, Bell, Loader2, Building2, Calendar, TrendingUp, ChevronRight, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ResidentProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [flat, setFlat] = useState(null);
  const [building, setBuilding] = useState(null);
  const [redemptions, setRedemptions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Find tenant by email
      const tenants = await base44.entities.Tenant.filter({});
      const matchedTenant = tenants.find(t => t.email === currentUser.email) || tenants[0];
      setTenant(matchedTenant);

      if (matchedTenant) {
        // Fetch flat and building
        if (matchedTenant.flat_id) {
          const flats = await base44.entities.Flat.filter({ id: matchedTenant.flat_id });
          const matchedFlat = flats[0];
          setFlat(matchedFlat);

          if (matchedFlat?.building_id) {
            const buildings = await base44.entities.Building.filter({ id: matchedFlat.building_id });
            const matchedBuilding = buildings[0];
            setBuilding(matchedBuilding);

            // Fetch active announcements for this building
            const anns = await base44.entities.Announcement.filter(
              { building_id: matchedFlat.building_id, status: 'published' },
              '-published_at',
              10
            );
            setAnnouncements(anns);
          }
        }

        // Fetch redemption history by user email
        const userRedemptions = await base44.entities.PerkRedemption.filter(
          { user_email: currentUser.email },
          '-redeemed_at',
          50
        );
        setRedemptions(userRedemptions);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bgMain flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-textMuted" />
      </div>
    );
  }

  const announcementIcon = (type) => {
    const icons = {
      urgent: Bell,
      maintenance: Building2,
      community_news: Star,
      event: Calendar,
      reminder: Bell,
    };
    return icons[type] || Bell;
  };

  const announcementColor = (type) => {
    const colors = {
      urgent: 'bg-red-50 text-red-700 border-red-200',
      maintenance: 'bg-blue-50 text-blue-700 border-blue-200',
      community_news: 'bg-gold/10 text-gold border-gold/20',
      event: 'bg-purple-50 text-purple-700 border-purple-200',
      reminder: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-bgMain">
      {/* Header */}
      <div className="bg-navy safe-area-top">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-white/70 hover:text-white -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center font-bold text-gold text-xl">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] text-gold uppercase tracking-[0.22em] font-bold mb-1">My Profile</p>
                <h1 className="text-2xl font-bold text-white tracking-tight">{user?.full_name}</h1>
                <p className="text-white/50 text-sm mt-0.5">{user?.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white bg-transparent gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-[10px] text-white/40 uppercase tracking-wide font-semibold">Redemptions</p>
              <p className="text-xl font-bold text-white">{redemptions.length}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-[10px] text-white/40 uppercase tracking-wide font-semibold">Tier</p>
              <p className="text-xl font-bold text-gold capitalize">{tenant?.perks_tier || 'Standard'}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-[10px] text-white/40 uppercase tracking-wide font-semibold">Unit</p>
              <p className="text-xl font-bold text-white">{flat?.flat_number || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Perk Redemption History */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Ticket className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-bold text-navy tracking-tight">Perk Redemption History</h2>
          </div>

          {redemptions.length === 0 ? (
            <Card className="border-[var(--border-subtle)]">
              <CardContent className="p-8 text-center">
                <Ticket className="w-12 h-12 text-textMuted/40 mx-auto mb-3" />
                <p className="text-textSecondary font-medium mb-1">No redemptions yet</p>
                <p className="text-textMuted text-sm mb-4">Explore your building's perks to start redeeming.</p>
                {building && (
                  <Link to={`/buildings/${building.id}/perks`}>
                    <Button className="bg-navy hover:bg-navySoft text-white gap-2">
                      Browse Perks <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
              {redemptions.map((redemption, idx) => (
                <div
                  key={redemption.id}
                  className={cn(
                    'flex items-center gap-4 px-5 py-4 hover:bg-bgAlt transition-colors',
                    idx !== redemptions.length - 1 && 'border-b border-[var(--border-subtle)]'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy text-sm truncate">{redemption.perk_name}</p>
                    <p className="text-xs text-textMuted">
                      {redemption.perk_category || 'Perk'} · {redemption.redeemed_at ? format(new Date(redemption.redeemed_at), 'MMM d, yyyy · h:mm a') : '—'}
                    </p>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border-green-200 text-xs shrink-0">
                    Redeemed
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Building Announcements */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-bold text-navy tracking-tight">Building Announcements</h2>
            {building && (
              <span className="text-xs text-textMuted ml-1">· {building.name}</span>
            )}
          </div>

          {!building ? (
            <Card className="border-[var(--border-subtle)]">
              <CardContent className="p-8 text-center">
                <Building2 className="w-12 h-12 text-textMuted/40 mx-auto mb-3" />
                <p className="text-textSecondary font-medium">No building linked to your profile</p>
                <p className="text-textMuted text-sm">Contact your property manager to be added to a building.</p>
              </CardContent>
            </Card>
          ) : announcements.length === 0 ? (
            <Card className="border-[var(--border-subtle)]">
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 text-textMuted/40 mx-auto mb-3" />
                <p className="text-textMuted">No active announcements right now.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => {
                const Icon = announcementIcon(ann.type);
                return (
                  <Card key={ann.id} className="border-[var(--border-subtle)] hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border', announcementColor(ann.type))}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-navy text-sm">{ann.title}</h3>
                            <Badge variant="outline" className={cn('text-[10px] capitalize', announcementColor(ann.type))}>
                              {ann.type?.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-textSecondary line-clamp-2 leading-relaxed">{ann.message}</p>
                          {ann.published_at && (
                            <p className="text-xs text-textMuted mt-2">
                              {format(new Date(ann.published_at), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}