import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, LayoutDashboard, Users, Megaphone, Ticket, Settings, ArrowLeft, BarChart3, Presentation, ListTodo, Menu, X, Home as HomeIcon, CreditCard, Sparkles, MailCheck, Search } from 'lucide-react';

export default function PartnerDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalPartners, setGlobalPartners] = useState<any[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const isLandingPage = location.pathname === '/';
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const links = [
    { section: 'Start' },
    { to: '/', icon: <HomeIcon className="w-4 h-4" />, label: 'Home' },
    { to: '/admin', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Admin' },
    { to: '/admin/platform', icon: <ShieldIcon />, label: 'Today downtown' },

    { section: 'Network' },
    { to: '/admin/outreach-crm', icon: <MailCheck className="w-4 h-4" />, label: 'Outreach CRM' },
    { to: '/admin/partner', icon: <Building2 className="w-4 h-4" />, label: 'Partner workspaces' },
    { to: '/admin/properties', icon: <Building2 className="w-4 h-4" />, label: 'Properties' },
    { to: '/admin/buildings', icon: <Users className="w-4 h-4" />, label: 'Buildings' },
    { to: '/admin/residents', icon: <Users className="w-4 h-4" />, label: 'Residents' },
    { to: '/admin/segmentation', icon: <ListTodo className="w-4 h-4" />, label: 'Resident groups' },

    { section: 'Programs' },
    { to: '/admin/perks', icon: <Ticket className="w-4 h-4" />, label: 'Perks' },
    { to: '/admin/events', icon: <Presentation className="w-4 h-4" />, label: 'Events' },
    { to: '/admin/engagement', icon: <Megaphone className="w-4 h-4" />, label: 'Broadcasts' },
    { to: '/admin/surveys', icon: <ListTodo className="w-4 h-4" />, label: 'Surveys' },

    { section: 'Messages' },
    { to: '/admin/announcements', icon: <Megaphone className="w-4 h-4" />, label: 'Building notes' },
    { to: '/admin/partner-portal', icon: <Presentation className="w-4 h-4" />, label: 'Partner preview' },

    { section: 'Insights' },
    { to: '/admin/dashboard', icon: <BarChart3 className="w-4 h-4" />, label: 'Performance' },
    { to: '/admin/reports', icon: <Settings className="w-4 h-4" />, label: 'Reports' },
    { to: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" />, label: 'Perk results' },
    { to: '/admin/platform/modules', icon: <Sparkles className="w-4 h-4" />, label: 'AI and tools' },

    { section: 'Account' },
    { to: '/partners/pricing', icon: <CreditCard className="w-4 h-4" />, label: 'Pricing' },
    { to: '/admin/promotions', icon: <CreditCard className="w-4 h-4" />, label: 'Billing and accounts' },

    { section: 'About' },
    { to: '/admin/about', icon: <Ticket className="w-4 h-4" />, label: 'About' },
    { to: '/admin/developer-engagement', icon: <Building2 className="w-4 h-4" />, label: 'Sponsor view' },
  ];

  const isActiveRoute = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  useEffect(() => {
    fetch('/api/outreach-crm')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Search index unavailable')))
      .then((payload) => setGlobalPartners(payload.partners || []))
      .catch(() => setGlobalPartners([]));
  }, []);

  const globalResults = useMemo(() => {
    const needle = globalQuery.trim().toLowerCase();
    if (needle.length < 2) return [];
    return globalPartners
      .filter((partner) => {
        const haystack = `${partner.name || ''} ${partner.type || ''} ${partner.partner_type || ''} ${partner.contact?.name || ''} ${partner.best_contact || ''}`.toLowerCase();
        return haystack.includes(needle);
      })
      .slice(0, 8);
  }, [globalPartners, globalQuery]);

  const openSearchResult = (partner: any) => {
    setGlobalQuery('');
    setSearchFocused(false);
    navigate(`/admin/outreach-crm?partner=${encodeURIComponent(partner.id)}`);
  };

  return (
    <div className="dp-admin-shell min-h-screen bg-white font-sans flex">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col bg-white lg:flex">
        <div className="px-6 pb-2 pt-6">
           <Link to="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 bg-[#11182B] flex items-center justify-center">
                 <Building2 className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold tracking-tight text-[#11182B] group-hover:text-[#C5A028] transition-colors uppercase text-[15px]">Downtown Perks</span>
           </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {links.map((link: any, idx) => {
            if (link.section) {
              return (
                <div key={idx} className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C5A028] first:mt-2">
                  {link.section}
                </div>
              );
            }
            const isActive = isActiveRoute(link.to);
            return (
              <Link 
                key={link.to} 
                to={link.to}
                className={`flex min-h-9 items-center gap-2.5 px-3 py-2 text-[13px] font-semibold leading-5 transition-colors ${isActive ? 'text-[#11182B]' : 'text-[rgba(11,31,51,0.58)] hover:text-[#11182B]'}`}
              >
                <span className={isActive ? 'text-[#C5A028]' : 'text-[rgba(11,31,51,0.36)]'}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen flex-1 overflow-x-hidden bg-white">
        <div className="sticky top-0 z-40 flex items-center justify-between bg-white p-4 lg:hidden">
           <div className="flex items-center gap-2 text-[#11182B] ">
              <Button
                onClick={isLandingPage ? () => navigate('/') : goBack}
                variant="ghost"
                className="mr-1 h-9 w-9 p-0"
                aria-label={isLandingPage ? 'Go home' : 'Go back'}
              >
                {isLandingPage ? <HomeIcon className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              </Button>
              <div className="w-6 h-6 bg-[#11182B] flex items-center justify-center">
                 <Building2 className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold tracking-tight uppercase text-sm">Downtown Perks</span>
           </div>
           <div className="flex items-center gap-2">
             <Button
               onClick={() => navigate('/')}
               variant="ghost"
               className="h-10 w-10 p-0"
               aria-label="Go home"
             >
               <HomeIcon className="w-5 h-5" />
             </Button>
             <Button
               onClick={() => setMobileOpen(true)}
               variant="outline"
               className="h-10 w-10 p-0"
               aria-label="Open partner platform navigation"
             >
               <Menu className="w-5 h-5" />
             </Button>
           </div>
        </div>

        <div className="relative border-b border-[rgba(11,31,51,0.06)] bg-white px-4 pb-3 lg:hidden">
          <label className="flex min-h-9 items-center gap-2 border border-[rgba(11,31,51,0.08)] bg-white px-3">
            <Search className="h-3.5 w-3.5 text-[#C8A96A]" />
            <input
              value={globalQuery}
              onChange={(event) => setGlobalQuery(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              className="w-full bg-transparent text-[12px] font-medium text-[#0B1F33] outline-none placeholder:text-[rgba(11,31,51,0.36)]"
              placeholder="Search partners"
              aria-label="Global partner search"
            />
            {globalQuery && (
              <button type="button" onClick={() => setGlobalQuery('')} className="text-[9px] font-semibold uppercase text-[rgba(11,31,51,0.48)]">
                Clear
              </button>
            )}
          </label>
          {searchFocused && globalQuery.trim().length >= 2 && (
            <div className="absolute left-4 right-4 top-[calc(100%-6px)] z-40 border border-[rgba(11,31,51,0.08)] bg-white p-1.5">
              {globalResults.length === 0 ? (
                <p className="px-2 py-2 text-[11px] text-[rgba(11,31,51,0.55)]">No partners found.</p>
              ) : (
                <div className="grid gap-1">
                  {globalResults.map((partner) => (
                    <button
                      key={partner.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => openSearchResult(partner)}
                      className="grid gap-0.5 px-2 py-2 text-left hover:bg-[#FBFAF6]"
                    >
                      <span className="text-[12px] font-semibold text-[#0B1F33]">{partner.name || 'Needs verification'}</span>
                      <span className="text-[10px] text-[rgba(11,31,51,0.55)]">{partner.best_contact || partner.contact?.name || 'No contact yet'} · {partner.type || 'Partner'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-[#11182B]/30" role="dialog" aria-modal="true">
            <button
              className="absolute inset-0 h-full w-full cursor-default"
              aria-label="Close navigation overlay"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 flex h-full w-[min(92vw,390px)] flex-col bg-white shadow-none">
              <div className="flex items-center justify-between p-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase text-slate-400">Downtown Perks</div>
                </div>
                <Button
                  onClick={() => setMobileOpen(false)}
                  variant="ghost"
                  className="h-10 w-10 p-0"
                  aria-label="Close partner platform navigation"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-5">
                {links.map((link: any, idx) => {
                  if (link.section) {
                    return (
                      <div key={idx} className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C5A028] first:mt-2">
                        {link.section}
                      </div>
                    );
                  }
                  const isActive = isActiveRoute(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex min-h-10 items-center gap-2.5 px-3 py-2 text-[13px] font-semibold transition-colors ${isActive ? 'text-[#11182B]' : 'text-[rgba(11,31,51,0.58)] hover:text-[#11182B]'}`}
                    >
                      <span className={isActive ? 'text-[#C5A028]' : 'text-[rgba(11,31,51,0.36)]'}>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <div className="sticky top-0 z-30 hidden border-b border-[rgba(11,31,51,0.06)] bg-white px-6 py-3 lg:block">
          <div className="flex items-center gap-4">
            {!isLandingPage && (
              <>
                <Button
                  onClick={goBack}
                  variant="ghost"
                  className="h-9 gap-2 px-0 text-[11px] font-semibold text-[#11182B]"
                  aria-label="Go back to previous platform page"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <span className="h-4 w-px bg-[rgba(11,31,51,0.12)]" aria-hidden="true" />
              </>
            )}
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="h-9 gap-2 px-0 text-[11px] font-semibold text-[#11182B]"
              aria-label="Go to platform home"
            >
              <HomeIcon className="w-4 h-4" /> Home
            </Button>
            <div className="relative ml-2 w-full max-w-[680px]">
              <label className="flex min-h-9 items-center gap-2 border border-[rgba(11,31,51,0.08)] bg-white px-3">
                <Search className="h-3.5 w-3.5 text-[#C8A96A]" />
                <input
                  value={globalQuery}
                  onChange={(event) => setGlobalQuery(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="w-full bg-transparent text-[12px] font-medium text-[#0B1F33] outline-none placeholder:text-[rgba(11,31,51,0.36)]"
                  placeholder="Search partners by name, contact, or type"
                  aria-label="Global partner search"
                />
                {globalQuery && (
                  <button type="button" onClick={() => setGlobalQuery('')} className="text-[9px] font-semibold uppercase text-[rgba(11,31,51,0.48)]">
                    Clear
                  </button>
                )}
              </label>
              {searchFocused && globalQuery.trim().length >= 2 && (
                <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-full border border-[rgba(11,31,51,0.08)] bg-white p-1.5">
                  {globalResults.length === 0 ? (
                    <p className="px-2 py-2 text-[11px] text-[rgba(11,31,51,0.55)]">No partners found.</p>
                  ) : (
                    <div className="grid gap-1">
                      {globalResults.map((partner) => (
                        <button
                          key={partner.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => openSearchResult(partner)}
                          className="grid gap-0.5 px-2 py-2 text-left hover:bg-[#FBFAF6]"
                        >
                          <span className="text-[12px] font-semibold text-[#0B1F33]">{partner.name || 'Needs verification'}</span>
                          <span className="text-[10px] text-[rgba(11,31,51,0.55)]">{partner.best_contact || partner.contact?.name || 'No contact yet'} · {partner.type || 'Partner'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Outlet />
      </main>
    </div>
  )
}

function ShieldIcon() {
  return <Settings className="w-4 h-4" />;
}
