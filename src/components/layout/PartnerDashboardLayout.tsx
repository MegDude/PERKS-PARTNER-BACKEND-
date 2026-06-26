import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, LayoutDashboard, Users, Megaphone, Ticket, Settings, ArrowLeft, BarChart3, Presentation, ListTodo, Menu, X, Home as HomeIcon, CreditCard } from 'lucide-react';

export default function PartnerDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const links = [
    { section: 'Overview' },
    { to: '/', icon: <HomeIcon className="w-4 h-4" />, label: 'Home' },
    { to: '/admin', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Workspace' },
    { to: '/admin/home', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Platform Welcome' },
    { to: '/admin/platform', icon: <ShieldIcon />, label: 'Command Center' },
    { to: '/admin/platform/modules', icon: <Settings className="w-4 h-4" />, label: 'Module Audit' },
    { to: '/admin/partner-portal', icon: <Presentation className="w-4 h-4" />, label: 'Partner Portal' },
    { to: '/admin/dashboard', icon: <BarChart3 className="w-4 h-4" />, label: 'Performance Stats' },
    
    { section: 'Network' },
    { to: '/admin/partner', icon: <Building2 className="w-4 h-4" />, label: 'Partner Directory' },
    { to: '/admin/properties', icon: <Building2 className="w-4 h-4" />, label: 'Manage Properties' },
    { to: '/admin/buildings', icon: <Users className="w-4 h-4" />, label: 'Property Operations' },
    { to: '/admin/residents', icon: <Users className="w-4 h-4" />, label: 'Resident Directory' },
    { to: '/admin/segmentation', icon: <ListTodo className="w-4 h-4" />, label: 'Segmentation' },
    
    { section: 'Programs & Perks' },
    { to: '/admin/about', icon: <Ticket className="w-4 h-4" />, label: 'About Program' },
    { to: '/admin/developer-engagement', icon: <Building2 className="w-4 h-4" />, label: 'Sponsor Engagement' },
    { to: '/admin/perks', icon: <Ticket className="w-4 h-4" />, label: 'Downtown Perks' },
    { to: '/admin/events', icon: <Presentation className="w-4 h-4" />, label: 'Events' },
    
    { section: 'Communication' },
    { to: '/admin/engagement', icon: <Megaphone className="w-4 h-4" />, label: 'Engagement Hub' },
    { to: '/admin/announcements', icon: <Megaphone className="w-4 h-4" />, label: 'Announcements' },
    { to: '/admin/surveys', icon: <ListTodo className="w-4 h-4" />, label: 'Surveys' },
    
    { section: 'Insights' },
    { to: '/admin/reports', icon: <Settings className="w-4 h-4" />, label: 'Reports' },
    { to: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" />, label: 'Perk Analytics' },
    { to: '/admin/promotions', icon: <CreditCard className="w-4 h-4" />, label: 'Promotions & Billing' },
  ];

  return (
    <div className="dp-admin-shell min-h-screen bg-white font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#EFEFEF] flex-col hidden lg:flex">
        <div className="p-6 pb-2">
           <Link to="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 bg-[#11182B] flex items-center justify-center">
                 <Building2 className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold tracking-tight text-[#11182B] group-hover:text-[#C5A028] transition-colors uppercase text-[15px]">Downtown Perks</span>
           </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {links.map((link: any, idx) => {
            if (link.section) {
              return (
                <div key={idx} className="mt-6 mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  {link.section}
                </div>
              );
            }
            const isActive = location.pathname === link.to;
            return (
              <Link 
                key={link.to} 
                to={link.to}
                className={`flex items-center gap-3 px-3 py-3 font-bold text-sm leading-5 transition-colors rounded-none ${isActive ? 'text-[#11182B] bg-[#11182B]/5 border-l-2 border-[#C5A028]' : 'text-slate-600 hover:text-[#11182B] hover:bg-slate-50 border-l-2 border-transparent'}`}
              >
                {link.icon}
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-[#EFEFEF]">
          <Button variant="ghost" onClick={() => navigate('/')} className="w-full justify-start gap-2 text-[#0B1F33]">
            <HomeIcon className="w-4 h-4" /> Home
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-white">
        <div className="lg:hidden sticky top-0 z-40 p-4 bg-white border-b border-[#EFEFEF] flex items-center justify-between">
           <div className="flex items-center gap-2 text-[#11182B] ">
              <Button
                onClick={goBack}
                variant="ghost"
                className="mr-1 h-9 w-9 p-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-6 h-6 bg-[#11182B] flex items-center justify-center">
                 <Building2 className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold tracking-tight uppercase text-sm">Partner Platform</span>
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

        <Button
          onClick={() => setMobileOpen(true)}
          variant="outline"
          className="lg:hidden fixed bottom-5 right-5 z-40 h-12 w-12 p-0 bg-white shadow-[0_12px_35px_rgba(17,24,43,0.16)]"
          aria-label="Open partner platform navigation"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-[#11182B]/30" role="dialog" aria-modal="true">
            <button
              className="absolute inset-0 h-full w-full cursor-default"
              aria-label="Close navigation overlay"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-[min(92vw,390px)] border-l border-[#EFEFEF] bg-white shadow-none flex flex-col">
              <div className="p-4 border-b border-[#EFEFEF] flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Partner Platform</div>
                  <div className="text-sm font-bold text-[#11182B]">Platform Navigation</div>
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

              <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
                {links.map((link: any, idx) => {
                  if (link.section) {
                    return (
                      <div key={idx} className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {link.section}
                      </div>
                    );
                  }
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex min-h-11 items-center gap-3 px-3 py-2.5 font-bold text-xs transition-colors ${isActive ? 'text-[#11182B] bg-[#11182B]/5 border-l-2 border-[#C5A028]' : 'text-slate-500 hover:text-[#11182B] hover:bg-slate-50 border-l-2 border-transparent'}`}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-[#EFEFEF]">
                <Button variant="ghost" onClick={() => { setMobileOpen(false); navigate('/'); }} className="w-full justify-start gap-2 text-[#0B1F33]">
                  <HomeIcon className="w-4 h-4" /> Home
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="sticky top-0 z-30 hidden border-b border-[#EFEFEF] bg-white/96 px-6 py-3 backdrop-blur lg:block">
          <div className="flex items-center gap-4">
            <Button
              onClick={goBack}
              variant="ghost"
              className="h-9 gap-2 px-0 text-[11px] font-semibold text-[#11182B]"
              aria-label="Go back to previous platform page"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <span className="h-4 w-px bg-[rgba(11,31,51,0.12)]" aria-hidden="true" />
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
