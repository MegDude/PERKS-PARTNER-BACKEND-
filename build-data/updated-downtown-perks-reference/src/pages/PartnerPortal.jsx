import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Gift, Mail, Ticket, Settings as SettingsIcon, Building2, Loader2, ArrowLeft, ScanLine, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import EditorialHero from '@/components/editorial/EditorialHero';

import PartnerOverview from '@/components/partner/PartnerOverview';
import PartnerPerks from '@/components/partner/PartnerPerks';
import PartnerMessages from '@/components/partner/PartnerMessages';
import PartnerRedemptions from '@/components/partner/PartnerRedemptions';
import PartnerProfile from '@/components/partner/PartnerProfile';
import PartnerScanner from '@/components/partner/PartnerScanner';
import PartnerAnalytics from '@/components/partner/PartnerAnalytics';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'scan', label: 'Scan', icon: ScanLine },
  { key: 'perks', label: 'My Perks', icon: Gift },
  { key: 'messages', label: 'Messages', icon: Mail },
  { key: 'redemptions', label: 'Redemptions', icon: Ticket },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'profile', label: 'Profile', icon: SettingsIcon },
];

export default function PartnerPortal() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: ctx, isLoading } = useQuery({
    queryKey: ['partner_context'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getPartnerContext', {});
      return res.data || res;
    },
  });

  const userPartner = ctx?.partner || null;
  const perks = ctx?.perks || [];
  const redemptions = ctx?.redemptions || [];
  const messages = ctx?.messages || [];
  const unreadCount = messages.filter(m => m.status === 'unread').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bgMain flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-textMuted" />
      </div>
    );
  }

  if (!userPartner) {
    return (
      <div className="min-h-screen bg-bgMain flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="relative w-40 h-40 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://media.base44.com/images/public/69d9dc12f3d4c38702f82b0c/919c6032f_elevatorqrcode2.png"
              alt="Downtown Perks QR Code"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-navy mb-2">No Partner Account Found</h2>
          <p className="text-textSecondary text-sm mb-6">
            Your account isn't linked to a partner business. Please contact an administrator to be added as a partner.
          </p>
          <a href="/" className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-navySoft transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </a>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <PartnerOverview perks={perks} redemptions={redemptions} userPartner={userPartner} />;
      case 'scan':
        return <PartnerScanner userPartner={userPartner} />;
      case 'perks':
        return <PartnerPerks perks={perks} redemptions={redemptions} />;
      case 'messages':
        return <PartnerMessages messages={messages} userPartner={userPartner} />;
      case 'redemptions':
        return <PartnerRedemptions perks={perks} redemptions={redemptions} />;
      case 'analytics':
        return <PartnerAnalytics perks={perks} redemptions={redemptions} />;
      case 'profile':
        return <PartnerProfile userPartner={userPartner} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bgMain">
      {/* Editorial Hero */}
      <div className="relative bg-navy overflow-hidden safe-area-top">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&h=600&fit=crop"
            alt="Hospitality venue interior"
            className="w-full h-full object-cover opacity-30"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/50" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
          <a href="/" className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </a>
          <p className="text-[11px] text-gold uppercase tracking-[0.22em] font-bold mb-2">Partner Dashboard</p>
          <h1 className="heading-serif text-3xl sm:text-4xl text-white leading-[1.1] tracking-tight mb-2">
            Welcome back.
          </h1>
          <p className="text-white/55 text-sm sm:text-base max-w-lg leading-relaxed mb-3">
            Manage offers, engage residents, and understand performance.
          </p>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">{userPartner.business_name}</h2>
            {userPartner.category && (
              <span className="text-sm text-white/40">{userPartner.category}</span>
            )}
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="border-t border-white/10 hidden lg:block">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-0">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap',
                      isActive ? 'border-gold text-white' : 'border-transparent text-white/50 hover:text-white/80'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.key === 'messages' && unreadCount > 0 && (
                      <span className="bg-gold text-navy text-xs px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 lg:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Tabs */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy border-t border-white/10 safe-area-bottom">
        <div className="flex">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold uppercase tracking-wide relative min-w-0',
                  isActive ? 'text-gold' : 'text-white/50'
                )}
              >
                <div className="relative">
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {tab.key === 'messages' && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-gold text-navy text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-full px-0.5">{tab.label}</span>
                {isActive && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gold rounded-full" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}