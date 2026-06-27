import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { H1, Body } from '@/components/ui/Typography';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, CheckCircle2, Clock3, Download, Search, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { slugify } from '@/data/partnerWorkspaceCatalog';

export default function PartnerDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerType, setPartnerType] = useState('All');
  const [showAllPartners, setShowAllPartners] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current_user'],
    queryFn: async () => {
        try {
            return await base44.auth.me();
        } catch {
            return null;
        }
    },
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
        try {
            return await base44.entities.Partner.list();
        } catch {
            return [];
        }
    },
  });

  const { data: perks = [] } = useQuery({
    queryKey: ['perk_locations'],
    queryFn: async () => {
        try {
            return await base44.entities.PerkLocation.list();
        } catch {
            return [];
        }
    },
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['redemptions'],
    queryFn: async () => {
        try {
            return await base44.entities.PerkRedemption.list();
        } catch {
            return [];
        }
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['partner_messages'],
    queryFn: async () => {
        try {
            return await (base44.entities as any).PartnerMessage.list();
        } catch {
            return [];
        }
    },
  });

  if (user && user.role && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[#11182B] mb-2">This area is for the platform team</h2>
          <p className="text-slate-500 font-medium">Use the workspace link for partner-facing pages.</p>
        </div>
      </div>
    );
  }

  const getPartnerStats = (partnerId: string) => {
    const partnerPerks = (perks as any[]).filter((p: any) => p.partner_id === partnerId);
    const perkIds = partnerPerks.map((p: any) => p.id);
    const partnerRedemptions = (redemptions as any[]).filter((r: any) => perkIds.includes(r.perk_id));
    const partnerMessages = (messages as any[]).filter((m: any) => m.partner_id === partnerId);
    const unreadMessages = partnerMessages.filter((m: any) => m.status === 'unread');

    return {
      perks: partnerPerks.length,
      redemptions: partnerRedemptions.length,
      messages: partnerMessages.length,
      unread: unreadMessages.length,
    };
  };

  const activePartners = (partners as any[]).filter((p: any) => p.is_active !== false && p.status !== 'archived');
  const partnerTypes = useMemo(() => {
    const values = activePartners
      .map((partner: any) => partner.category || partner.type)
      .filter(Boolean)
      .map((value: string) => String(value).trim())
      .filter(Boolean);
    return ['All', ...Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))];
  }, [activePartners]);

  const filteredPartners = useMemo(() => {
    const needle = partnerSearch.trim().toLowerCase();
    return activePartners.filter((partner: any) => {
      const category = String(partner.category || partner.type || '').trim();
      const haystack = `${partner.business_name || ''} ${partner.name || ''} ${partner.contact_person || ''} ${partner.email || ''} ${category}`.toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      const matchesType = partnerType === 'All' || category === partnerType;
      return matchesSearch && matchesType;
    });
  }, [activePartners, partnerSearch, partnerType]);
  const hasPartnerFilters = partnerSearch.trim().length > 0 || partnerType !== 'All';
  const partnerPreviewLimit = 24;
  const visiblePartners = showAllPartners || hasPartnerFilters
    ? filteredPartners
    : filteredPartners.slice(0, partnerPreviewLimit);
  const hiddenPartnerCount = Math.max(filteredPartners.length - visiblePartners.length, 0);

  const partnerById = useMemo(() => {
    return Object.fromEntries((partners as any[]).map((partner: any) => [partner.id, partner]));
  }, [partners]);

  const perkById = useMemo(() => {
    return Object.fromEntries((perks as any[]).map((perk: any) => [perk.id, perk]));
  }, [perks]);

  const recentPartnerActivity = useMemo(() => {
    const messageActivity = (messages as any[]).map((message: any) => {
      const partner = partnerById[message.partner_id];
      return {
        id: `message-${message.id}`,
        partnerName: partner?.business_name || message.partner_name || 'Partner',
        type: message.status === 'unread' ? 'Unread message' : 'Partner message',
        related: message.subject || message.message || 'Workspace conversation',
        timestamp: message.created_date || message.created_at || message.updated_at || 'Recent',
        status: message.status || 'open',
        action: 'Open message',
        href: '/admin/engagement',
      };
    });

    const redemptionActivity = (redemptions as any[]).map((redemption: any) => {
      const perk = perkById[redemption.perk_id];
      const partner = partnerById[perk?.partner_id];
      return {
        id: `redemption-${redemption.id}`,
        partnerName: partner?.business_name || redemption.partner_name || 'Partner',
        type: 'Perk redemption',
        related: perk?.title || perk?.perk_title || 'Active perk',
        timestamp: redemption.created_date || redemption.created_at || redemption.redeemed_at || 'Recent',
        status: redemption.status || 'redeemed',
        action: 'View redemption',
        href: '/admin/perks',
      };
    });

    const perkActivity = (perks as any[]).map((perk: any) => {
      const partner = partnerById[perk.partner_id];
      return {
        id: `perk-${perk.id}`,
        partnerName: partner?.business_name || perk.partner_name || 'Partner',
        type: perk.is_active === false ? 'Perk paused' : 'Perk active',
        related: perk.title || perk.perk_title || perk.name || 'Partner perk',
        timestamp: perk.updated_at || perk.updated_date || perk.created_at || perk.created_date || 'Recent',
        status: perk.is_active === false ? 'paused' : 'active',
        action: 'Review perk',
        href: '/admin/perks',
      };
    });

    return [...messageActivity, ...redemptionActivity, ...perkActivity]
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
      .slice(0, 8);
  }, [messages, partnerById, perkById, perks, redemptions]);

  const formatActivityTime = (value: string) => {
    if (!value || value === 'Recent') return 'Recent';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  };

  const partnerWorkspacePath = (partner: any) => `/admin/workspaces/${slugify(
    partner.workspace_slug ||
    partner.slug ||
    partner.workspacePath?.replace('/tenant/', '') ||
    partner.tenant_id?.replace(/^tenant_/, '') ||
    partner.workspace_id?.replace(/^workspace_/, '') ||
    partner.business_name ||
    partner.name ||
    partner.id
  )}`;

  return (
    <div className="w-full max-w-none bg-white px-4 py-4 text-left text-[#0B1F33] sm:px-5 lg:px-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
      >
        <div>
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-normal text-[#C5A028]">Partner directory</p>
          <H1 className="mb-1 text-xl font-semibold leading-tight text-[#11182B] sm:text-2xl">Partner workspaces</H1>
          <Body className="max-w-3xl text-[11px] font-medium leading-5 text-[rgba(11,31,51,0.58)]">
            Open each partner workspace, check what is active, and export the month without leaving the platform.
          </Body>
        </div>
        <Button
          onClick={() => {
            const rows = filteredPartners.map((partner: any) => {
              const stats = getPartnerStats(partner.id);
              return [partner.business_name || partner.name || 'Partner', partner.category || '', stats.perks, stats.redemptions, stats.messages, stats.unread].join(',');
            });
            const csv = ['Partner,Category,Perks,Redemptions,Messages,Unread', ...rows].join('\n');
            const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `partner-summary-${selectedMonth}.csv`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          className="min-h-8 w-fit max-w-full text-[9px] font-semibold uppercase"
        >
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </motion.div>

      <div className="mb-4 grid gap-2 bg-white sm:grid-cols-[170px_minmax(220px,1fr)_180px] sm:items-end">
        <div>
          <label className="mb-1 block text-[9px] font-bold uppercase tracking-normal text-[#C5A028]">Report month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="min-h-8 border-0 border-b border-[rgba(11,31,51,0.18)] bg-white px-0 py-1 text-[12px] font-semibold text-[#11182B] outline-none focus:border-[#C5A028]"
          />
        </div>
        <label className="flex min-h-8 items-center gap-2 border-0 border-b border-[rgba(11,31,51,0.14)] bg-white py-1">
          <Search className="h-3.5 w-3.5 shrink-0 text-[#C5A028]" />
          <input
            value={partnerSearch}
            onChange={(event) => {
              setPartnerSearch(event.target.value);
              setShowAllPartners(false);
            }}
            placeholder="Search partners"
            className="w-full bg-transparent text-[11px] font-medium leading-none text-[#0B1F33] outline-none placeholder:text-[rgba(11,31,51,0.36)]"
          />
        </label>
        <label className="flex min-h-8 items-center gap-2 border-0 border-b border-[rgba(11,31,51,0.14)] bg-white py-1">
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-[#C5A028]" />
          <select
            value={partnerType}
            onChange={(event) => {
              setPartnerType(event.target.value);
              setShowAllPartners(false);
            }}
            className="w-full bg-transparent text-[11px] font-semibold text-[#0B1F33] outline-none"
          >
            {partnerTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
      </div>

      <section className="mb-5 overflow-x-auto [scrollbar-width:thin]" aria-label="Partner workspace summary">
        <table className="w-full min-w-[520px] table-fixed text-left">
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[68px]" />
            <col />
          </colgroup>
          <thead>
            <tr className="text-[9px] font-bold uppercase text-[rgba(11,31,51,0.46)]">
              <th className="py-1.5 pr-3">Area</th>
              <th className="py-1.5 pr-3 text-right">Total</th>
              <th className="py-2">Use this for</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(11,31,51,0.045)]">
            {[
              { label: 'Active partners', value: activePartners.length, detail: 'Partner profiles ready to review.' },
              { label: 'Perks used', value: (redemptions as any[]).length, detail: 'Offers residents have used.' },
              { label: 'Messages', value: (messages as any[]).length, detail: 'Partner notes and replies on file.' },
              { label: 'Unread notes', value: (messages as any[]).filter((m: any) => m.status === 'unread').length, detail: 'Items that still need a look.' },
            ].map((stat) => (
              <tr key={stat.label} className="align-middle">
                <td className="py-1.5 pr-3 text-[11px] font-semibold leading-4 text-[#0B1F33]">{stat.label}</td>
                <td className="py-1.5 pr-3 text-right text-[12px] font-semibold leading-none text-[#0B1F33]">{Number(stat.value || 0).toLocaleString()}</td>
                <td className="py-1.5 text-[10px] leading-4 text-[rgba(11,31,51,0.56)]">{stat.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card className="border-0 p-0 shadow-none">
          <CardHeader className="mb-2 border-0 p-0 pb-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <CardTitle className="text-[15px] font-semibold leading-5 text-[#11182B]">Active partners</CardTitle>
                <CardDescription className="mt-0 text-[11px] font-medium leading-4 text-[rgba(11,31,51,0.54)]">
                  {visiblePartners.length.toLocaleString()} of {filteredPartners.length.toLocaleString()} shown. Search, filter, or expand the full directory.
                </CardDescription>
              </div>
              {(partnerSearch || partnerType !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setPartnerSearch('');
                    setPartnerType('All');
                    setShowAllPartners(false);
                  }}
                  className="min-h-7 text-[9px] font-semibold uppercase text-[rgba(11,31,51,0.54)] transition-colors hover:text-[#C5A028]"
                >
                  Clear
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredPartners.length === 0 ? (
              <p className="py-8 text-[12px] font-medium text-[rgba(11,31,51,0.54)]">No partners match this view.</p>
            ) : (
              <div className="divide-y divide-[rgba(11,31,51,0.045)]">
                {visiblePartners.map((partner) => {
                  const stats = getPartnerStats(partner.id);
                  return (
                    <motion.div
                      key={partner.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="grid gap-2 bg-white py-2.5 transition-colors hover:bg-[rgba(197,160,40,0.025)] lg:grid-cols-[minmax(190px,1.25fr)_minmax(260px,1.45fr)_82px] lg:items-center"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-[12px] font-semibold leading-4 text-[#11182B]">{partner.business_name || partner.name || 'Partner'}</h3>
                        <p className="truncate text-[10px] font-medium leading-4 text-[rgba(11,31,51,0.48)]">{partner.contact_person || partner.email || partner.category || 'Workspace contact pending'}</p>
                        <Badge variant="outline" className="mt-1 max-w-full px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-normal text-[rgba(11,31,51,0.52)]">
                          <span className="truncate">{partner.category || partner.type || 'Partner'}</span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-x-2 gap-y-1">
                        {[
                          ['Perks', stats.perks],
                          ['Redemptions', stats.redemptions],
                          ['Messages', stats.messages],
                          ['Unread', stats.unread],
                        ].map(([label, value]) => (
                          <div key={label} className="min-w-0">
                            <span className="block truncate text-[8.5px] font-semibold uppercase leading-3 text-[rgba(11,31,51,0.4)]">{label}</span>
                            <strong className="block text-[11px] font-semibold leading-4 text-[#11182B]">{Number(value || 0).toLocaleString()}</strong>
                          </div>
                        ))}
                      </div>
                      <Link
                        to={partnerWorkspacePath(partner)}
                        className="inline-flex min-h-7 max-w-full items-center justify-center gap-1 border border-[rgba(11,31,51,0.10)] bg-white px-2 text-[8.5px] font-semibold uppercase leading-none text-[#0B1F33] transition-colors hover:border-[#C8A96A] hover:text-[#C8A96A]"
                      >
                        Open <ArrowUpRight className="h-3 w-3 shrink-0" />
                      </Link>
                    </motion.div>
                  );
                })}
                {(hiddenPartnerCount > 0 || (showAllPartners && !hasPartnerFilters && filteredPartners.length > partnerPreviewLimit)) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white py-3">
                    <p className="text-[10px] font-medium leading-4 text-[rgba(11,31,51,0.54)]">
                      {showAllPartners
                        ? `Full directory open: ${filteredPartners.length.toLocaleString()} partners.`
                        : `${hiddenPartnerCount.toLocaleString()} more partners are rolled up to keep this page easy to scan.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAllPartners((value) => !value)}
                      className="inline-flex min-h-7 items-center justify-center border border-[rgba(11,31,51,0.10)] bg-white px-2 text-[8.5px] font-semibold uppercase leading-none text-[#0B1F33] transition-colors hover:border-[#C8A96A] hover:text-[#C8A96A]"
                    >
                      {showAllPartners ? 'Collapse' : 'Show all'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-white"
      >
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[9px] font-semibold uppercase text-[#C8A96A]">Partner operations</p>
            <h2 className="text-[15px] font-semibold leading-5 text-[#0B1F33]">Recent partner activity</h2>
            <p className="mt-1 max-w-2xl text-[11px] leading-4 text-[rgba(11,31,51,0.56)]">
              Messages, redemptions, perk updates, and follow-up items ready to open.
            </p>
          </div>
          <Link to="/admin/engagement" className="inline-flex min-h-7 max-w-full items-center gap-1.5 border border-[rgba(11,31,51,0.10)] bg-white px-2 text-[8.5px] font-semibold uppercase leading-none text-[#0B1F33] transition-colors hover:border-[#C8A96A] hover:text-[#C8A96A]">
            <Activity className="w-3.5 h-3.5 shrink-0" /> Activity
          </Link>
        </div>

        {recentPartnerActivity.length === 0 ? (
          <div className="bg-white py-4 text-[11px] leading-5 text-[rgba(11,31,51,0.58)]">
            No partner activity has been recorded yet. Messages, perk redemptions, campaign changes, and workspace updates will appear here once partners start using the platform.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[660px] divide-y divide-[rgba(11,31,51,0.05)]">
              <div className="grid grid-cols-[1.1fr_.85fr_1.15fr_.75fr_.52fr_62px] gap-2 px-1 pb-2 text-[8px] font-semibold uppercase text-[rgba(11,31,51,0.46)]">
                <span>Partner</span>
                <span>Activity type</span>
                <span>Related item</span>
                <span>Timestamp</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {recentPartnerActivity.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.1fr_.85fr_1.15fr_.75fr_.52fr_62px] items-center gap-2 px-1 py-2 text-[9.5px] leading-4 text-[#0B1F33]">
                  <div className="truncate font-semibold">{item.partnerName}</div>
                  <div className="truncate text-[rgba(11,31,51,0.66)]">{item.type}</div>
                  <div className="truncate text-[rgba(11,31,51,0.66)]">{item.related}</div>
                  <div className="flex items-center gap-1 text-[rgba(11,31,51,0.56)]">
                    <Clock3 className="h-3 w-3 shrink-0 text-[#C8A96A]" />
                    {formatActivityTime(item.timestamp)}
                  </div>
                  <div>
                    <span className="inline-flex min-h-6 max-w-full items-center gap-1 border border-[rgba(11,31,51,0.08)] bg-white px-1.5 text-[8px] font-semibold uppercase leading-none text-[#0B1F33]">
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-[#C8A96A]" />
                      {item.status}
                    </span>
                  </div>
                  <div>
                    <Link to={item.href} className="inline-flex min-h-7 max-w-full items-center justify-center border border-transparent px-1 text-[8px] font-semibold uppercase leading-none text-[#0B1F33] transition-colors hover:border-[#C8A96A]">
                      {item.action}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
}
