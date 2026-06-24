import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { 
  Building2, Users, Bell, LayoutDashboard, 
  Menu, X, MessageCircle, Home, Settings, Info, Star, BarChart3, FileText, User, Calendar, TrendingDown, CreditCard
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import UserMenu from '@/components/auth/UserMenu';
import { LanguageProvider, useLanguage } from '@/components/context/LanguageContext';
import { CurrencyProvider } from '@/components/CurrencyContext';

const mainNavItems = [
  { name: 'Home', icon: Home, page: '/' },
  { name: 'Properties', icon: Building2, page: '/buildings' },
  { name: 'My Profile', icon: User, page: '/profile' },
];

const adminNavItems = [
  { name: 'Perk Analytics', icon: BarChart3, page: '/perk-analytics' },
  { name: 'Offers', icon: Star, page: '/offers' },
  { name: 'Product Offerings', icon: CreditCard, page: '/product-offerings' },
  { name: 'Partner Workspace', icon: TrendingDown, page: '/partner-workspace' },
  { name: 'Partner Portal', icon: MessageCircle, page: '/partner-portal' },
  { name: 'Settings', icon: Settings, page: '/Settings' },
];

const residentNavItems = [];

function LayoutContent({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [businessName, setBusinessName] = useState('Downtown Perks Hub');
  const { t, isRTL, language } = useLanguage();

  useEffect(() => {
    loadUser();
    loadSettings();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      // User not logged in
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await base44.entities.GlobalSettings.list();
      if (settings && settings.length > 0) {
        const name = language === 'ar' && settings[0].business_name_ar 
          ? settings[0].business_name_ar 
          : settings[0].business_name;
        setBusinessName(name || 'Downtown Perks Hub');
      }
    } catch (error) {
      // Use default if no settings
    }
  };

  useEffect(() => {
    loadSettings();
  }, [language]);

  return (
    <div className="min-h-screen bg-bgMain">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border-subtle)] px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-navy shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-navy text-sm tracking-tight">{businessName}</span>
          </a>
          <div className="flex items-center gap-1">
            {user && <UserMenu user={user} />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-[280px] bg-white border-r border-[var(--border-subtle)] transform transition-transform duration-300 ease-smooth lg:translate-x-0 flex flex-col safe-area-top",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo — desktop only in sidebar, mobile gets close button */}
          <div className="hidden lg:flex items-center justify-between gap-3 px-6 py-5 border-b border-[var(--border-subtle)] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-navy shadow-sm">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-navy tracking-tight">{businessName}</h1>
                <p className="text-xs text-textMuted font-medium">Property & Engagement Hub</p>
              </div>
            </div>
          </div>

          {/* Mobile sidebar header */}
          <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
            <span className="font-bold text-navy text-sm">Menu</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-bgAlt rounded-lg transition-colors">
              <X className="w-4 h-4 text-textMuted" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 lg:py-6 mt-14 lg:mt-0 overflow-y-auto">
           {/* Main Navigation */}
           <div className="space-y-1 mb-4">
             {mainNavItems.map((item) => {
               const isActive = currentPageName === item.name || (item.page === '/' && currentPageName === 'Home');
               return (
                 <a
                   key={item.page}
                   href={item.page}
                   onClick={() => setSidebarOpen(false)}
                   className={cn(
                     "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap text-sm font-medium",
                     isActive
                        ? "bg-navy text-white shadow-sm"
                        : "text-textSecondary hover:bg-bgAlt hover:text-navy"
                   )}
                 >
                   <item.icon className={cn('w-[18px] h-[18px] transition-colors', isActive ? 'text-gold' : 'text-textMuted')} />
                   <span className="font-medium">{item.name || t(item.nameKey)}</span>
                 </a>
               );
             })}
           </div>

           {/* Admin Section */}
           {user?.role === 'admin' && adminNavItems.length > 0 && (
             <>
               <div className="text-[10px] font-bold text-textMuted uppercase tracking-widest px-4 mb-2 mt-4">Tools</div>
               <div className="space-y-1 mb-6">
                 {adminNavItems.map((item) => {
                   const isActive = currentPageName === item.page?.replace(/\//g, '');
                   return (
                     <a
                       key={item.page}
                       href={item.page}
                       onClick={() => setSidebarOpen(false)}
                       className={cn(
                         "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap text-sm font-medium",
                         isActive
                            ? "bg-navy text-white shadow-sm"
                            : "text-textSecondary hover:bg-bgAlt hover:text-navy"
                       )}
                     >
                       <item.icon className={cn('w-[18px] h-[18px] transition-colors', isActive ? 'text-gold' : 'text-textMuted')} />
                       <span className="font-medium">{item.name || t(item.nameKey)}</span>
                     </a>
                   );
                 })}
               </div>
             </>
           )}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-[var(--border-subtle)] space-y-3 flex-shrink-0">
            {user && (
              <div className="hidden lg:block pt-3 border-t border-[var(--border-subtle)]">
                <UserMenu user={user} />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={cn(
        "lg:ml-[280px] min-h-screen pt-16 lg:pt-0"
      )}>
        {children}
      </main>
    </div>
  );
}

export default function Layout(props) {
  return (
    <LanguageProvider>
      <LayoutContent {...props} />
    </LanguageProvider>
  );
}