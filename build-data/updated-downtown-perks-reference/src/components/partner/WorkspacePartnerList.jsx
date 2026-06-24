import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronDown, Mail, Reply, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WorkspacePartnerList({
  partners,
  perks,
  redemptions,
  messages,
  selectedPartner,
  onSelect,
  onExportCSV,
}) {
  const getPartnerStats = (partnerId) => {
    const partnerPerks = perks.filter(p => p.partner_id === partnerId);
    const perkIds = partnerPerks.map(p => p.id);
    const partnerRedemptions = redemptions.filter(r => perkIds.includes(r.perk_id));
    const partnerMessages = messages.filter(m => m.partner_id === partnerId);
    return {
      perks: partnerPerks.length,
      redemptions: partnerRedemptions.length,
      messages: partnerMessages.length,
      unread: partnerMessages.filter(m => m.status === 'unread').length,
    };
  };

  const selectedPartnerObj = partners.find(p => p.id === selectedPartner);
  const selectedPartnerMessages = messages.filter(m => m.partner_id === selectedPartner);

  if (partners.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--border-subtle)] p-12 text-center">
        <p className="text-textMuted text-sm">No active partners yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {partners.map((partner, idx) => {
        const stats = getPartnerStats(partner.id);
        const isExpanded = selectedPartner === partner.id;
        return (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={cn(
              'bg-white rounded-2xl border transition-all overflow-hidden',
              isExpanded ? 'border-navy/20 shadow-soft' : 'border-[var(--border-subtle)]'
            )}
          >
            {/* Partner Row */}
            <button
              onClick={() => onSelect(isExpanded ? null : partner.id)}
              className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-bgAlt/50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">{partner.business_name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy text-sm truncate">{partner.business_name}</div>
                <div className="text-xs text-textMuted truncate">{partner.category} · {partner.contact_email}</div>
              </div>
              <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                <div className="hidden sm:flex items-center gap-5">
                  <Stat label="Perks" value={stats.perks} />
                  <Stat label="Redemptions" value={stats.redemptions} gold />
                  <Stat label="Messages" value={stats.messages} />
                  {stats.unread > 0 && <Stat label="Unread" value={stats.unread} alert />}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onExportCSV(partner); }}
                  className="p-2 hover:bg-gold/10 rounded-lg transition-colors"
                  title="Export CSV"
                >
                  <Download className="w-4 h-4 text-gold" />
                </button>
                <ChevronDown className={cn('w-4 h-4 text-textMuted transition-transform shrink-0', isExpanded && 'rotate-180')} />
              </div>
            </button>

            {/* Mobile Stats Row */}
            <div className="sm:hidden flex items-center gap-4 px-4 pb-3 -mt-1">
              <Stat label="Perks" value={stats.perks} compact />
              <Stat label="Redemps" value={stats.redemptions} gold compact />
              <Stat label="Msgs" value={stats.messages} compact />
              {stats.unread > 0 && <Stat label="Unread" value={stats.unread} alert compact />}
            </div>

            {/* Expanded Detail */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-[var(--border-subtle)]"
                >
                  <div className="px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-navy text-sm">
                        Messages — {selectedPartnerObj?.business_name}
                      </h4>
                      <button onClick={() => onSelect(null)} className="p-1.5 hover:bg-bgAlt rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5 text-textMuted" />
                      </button>
                    </div>
                    {selectedPartnerMessages.length === 0 ? (
                      <p className="text-center py-6 text-textMuted text-sm">No messages for this partner</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {selectedPartnerMessages.map((msg) => (
                          <div key={msg.id} className={cn('rounded-xl p-3', msg.status === 'unread' ? 'bg-gold/5' : 'bg-bgAlt/50')}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                {msg.status === 'unread' ? (
                                  <Mail className="w-3.5 h-3.5 text-gold shrink-0" />
                                ) : msg.status === 'replied' ? (
                                  <Reply className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                ) : (
                                  <Mail className="w-3.5 h-3.5 text-textMuted shrink-0" />
                                )}
                                <span className="font-semibold text-navy text-sm truncate">{msg.subject}</span>
                              </div>
                              <span className="text-xs text-textMuted shrink-0">
                                {msg.sent_at ? new Date(msg.sent_at).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <p className="text-xs text-textMuted mb-1">from {msg.resident_name || 'Resident'}</p>
                            <p className="text-sm text-textSecondary">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

function Stat({ label, value, gold, alert, compact }) {
  return (
    <div className="text-center">
      <div className={cn(
        'font-bold',
        compact ? 'text-base' : 'text-lg',
        gold ? 'text-gold' : alert ? 'text-orange-500' : 'text-navy'
      )}>
        {value}
      </div>
      <div className="text-[10px] text-textMuted">{label}</div>
    </div>
  );
}