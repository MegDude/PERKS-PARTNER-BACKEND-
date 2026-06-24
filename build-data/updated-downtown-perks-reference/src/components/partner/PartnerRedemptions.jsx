import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Search, Ticket, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PartnerRedemptions({ perks, redemptions }) {
  const [search, setSearch] = useState('');

  const perkRedemptions = redemptions.filter(r => perks.some(p => p.id === r.perk_id));
  const perkMap = new Map(perks.map(p => [p.id, p]));

  const filtered = perkRedemptions.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.user_name || '').toLowerCase().includes(q) ||
      (r.user_email || '').toLowerCase().includes(q) ||
      (r.perk_name || '').toLowerCase().includes(q)
    );
  }).sort((a, b) => new Date(b.redeemed_at) - new Date(a.redeemed_at));

  const exportCSV = () => {
    const lines = [
      ['Date', 'Perk Name', 'Category', 'User Name', 'User Email'],
      ...filtered.map(r => [
        r.redeemed_at ? new Date(r.redeemed_at).toLocaleDateString() : '',
        r.perk_name || '',
        perkMap.get(r.perk_id)?.category || '',
        r.user_name || '',
        r.user_email || '',
      ]),
    ];
    const csv = lines.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const el = document.createElement('a');
    el.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
    el.setAttribute('download', `redemptions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  return (
    <Card className="bg-white border-[var(--border-subtle)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-navy flex items-center gap-2">
              <Ticket className="w-5 h-5 text-gold" />
              Redemption History
            </CardTitle>
            <CardDescription>{perkRedemptions.length} total redemptions across your perks</CardDescription>
          </div>
          {perkRedemptions.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-navy text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-navySoft transition-colors shrink-0"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {perkRedemptions.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-10 h-10 text-textMuted/40 mx-auto mb-3" />
            <p className="text-textMuted text-sm">No redemptions yet</p>
          </div>
        ) : (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or perk..."
                className="pl-9"
              />
            </div>
            <div className="space-y-2">
              {filtered.map((r, i) => {
                const perk = perkMap.get(r.perk_id);
                return (
                  <motion.div
                    key={r.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border-subtle)] hover:bg-bgAlt/50 transition-all"
                  >
                    <div className="w-9 h-9 bg-gold/10 rounded-lg flex items-center justify-center shrink-0">
                      <Ticket className="w-4 h-4 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy text-sm truncate">{r.perk_name || perk?.name || 'Unknown Perk'}</p>
                      <div className="flex items-center gap-3 text-xs text-textMuted mt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {r.user_name || 'Anonymous'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {r.redeemed_at ? new Date(r.redeemed_at).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </div>
                    {perk?.category && (
                      <span className="text-xs text-textMuted bg-bgAlt px-2 py-1 rounded-lg shrink-0 hidden sm:block">
                        {perk.category}
                      </span>
                    )}
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center py-6 text-textMuted text-sm">No results found for "{search}"</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}