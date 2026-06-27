import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, LayoutDashboard, Users, Megaphone, Ticket, Settings, ArrowLeft, BarChart3, Presentation, ListTodo, Menu, X, Home as HomeIcon, CreditCard, Sparkles, MailCheck } from 'lucide-react';

export default function PartnerDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
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
    { to: '/admin', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Command center' },
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
    { to: '/admin/engagement', icon: <Megaphone className="w-4 h-4" />, label: 'Campaign notes' },
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
    { to: '/admin/promotions', icon: <CreditCard className="w-4 h-4" />, label: 'Plans and billing' },

    { section: 'About' },
    { to: '/admin/about', icon: <Ticket className="w-4 h-4" />, label: 'Program guide' },
    { to: '/admin/developer-engagement', icon: <Building2 className="w-4 h-4" />, label: 'Sponsor view' },
  ];

  const isActiveRoute = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
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
      <main className="flex-1 h-screen overflow-y-auto bg-white">
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

        <div className="sticky top-0 z-30 hidden bg-white/96 px-6 py-3 backdrop-blur lg:block">
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
