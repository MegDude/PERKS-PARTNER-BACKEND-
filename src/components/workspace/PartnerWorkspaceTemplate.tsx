import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  CalendarPlus,
  Check,
  Copy,
  CreditCard,
  Download,
  Eye,
  Heart,
  MapPin,
  Menu,
  QrCode,
  Send,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import type { FavoriteItem, PartnerLead, PartnerWorkspaceData } from '@/types/partnerWorkspace';
import {
  applyCoupon,
  calculateSetupProgress,
  createGoogleCalendarUrl,
  loadFavoriteState,
  loadPartnerLead,
  saveFavoriteState,
  submitPartnerLead,
} from '@/services/partnerWorkspaceService';
import './partnerWorkspace.css';

type Props = PartnerWorkspaceData;

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Setup', href: '#setup' },
  { label: 'Codes', href: '#qr' },
  { label: 'Perks', href: '#perks' },
  { label: 'Events', href: '#events' },
  { label: 'Notes', href: '#campaigns' },
  { label: 'Residents', href: '#residents' },
  { label: 'Reports', href: '#reports' },
  { label: 'Plan', href: '#billing' },
];

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.58)]">{label}</span>
      <input className="shore-input mt-2" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Section({ id, eyebrow, title, description, children }: { id: string; eyebrow: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="shore-section scroll-mt-32">
      <div className="shore-section-heading">
        <div className="text-[11px] font-bold uppercase text-[#C8A96A]">{eyebrow}</div>
        <h2 className="mt-1 text-2xl leading-tight text-[#0B1F33] sm:text-[28px]">{title}</h2>
        {description && <p className="shore-section-copy">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function MiniStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="shore-card p-4">
      <div className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.5)]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#0B1F33]">{value}</div>
      <p className="mt-1 text-xs leading-5 text-[rgba(11,31,51,0.62)]">{note}</p>
    </div>
  );
}

function ToggleFavorite({ item, onToggle }: { item: FavoriteItem; onToggle: (id: string) => void }) {
  return (
    <button type="button" onClick={() => onToggle(item.id)} className="shore-card flex w-full items-center justify-between gap-3 p-3 text-left">
      <span>
        <span className="block text-[11px] font-bold uppercase text-[#C8A96A]">{item.type}</span>
        <span className="block text-sm font-semibold text-[#0B1F33]">{item.name}</span>
        <span className="block text-xs leading-5 text-[rgba(11,31,51,0.62)]">{item.detail}</span>
      </span>
      <Heart className={`h-5 w-5 shrink-0 ${item.saved ? 'fill-[#C8A96A] text-[#C8A96A]' : 'text-[rgba(11,31,51,0.34)]'}`} />
    </button>
  );
}

export function PartnerWorkspaceTemplate(props: Props) {
  const workspaceName = props.partner.name || props.profile.propertyName || 'Partner';
  const workspaceSlug = props.partner.id || workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const [lead, setLead] = useState<PartnerLead>(() => loadPartnerLead(props.lead, workspaceSlug));
  const [favorites, setFavorites] = useState(() => loadFavoriteState(props.favorites, workspaceSlug));
  const [leadNotice, setLeadNotice] = useState(`${workspaceName} is ready for a quick review.`);
  const [coupon, setCoupon] = useState('');
  const [couponResult, setCouponResult] = useState<{ discount: number; totalDue: number; accepted: boolean } | null>(null);
  const [billingNotice, setBillingNotice] = useState('Use DUDE2026 when you want the demo to end with a clean $0 checkout.');
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const setupProgress = calculateSetupProgress(props, lead);
  const activePerks = props.perks.filter((perk) => perk.status === 'Active').length;
  const upcomingEvents = props.events.filter((event) => event.status !== 'Draft').length;

  const activeModules = useMemo(
    () => [
      ['Profile', 'Ready'],
      ['Codes', 'Live'],
      ['Residents', 'Ready'],
      ['Perks', `${activePerks} live`],
      ['Events', `${upcomingEvents} next up`],
      ['Reports', 'Fresh'],
      ['Plan', props.partner.status],
    ],
    [activePerks, props.partner.status, upcomingEvents],
  );

  function updateLead(key: keyof PartnerLead, value: string) {
    setLead((current) => ({
      ...current,
      [key]: key === 'unitCount' ? Number(value) : value,
      status: current.status === 'New lead' ? 'Registration started' : current.status,
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const submitted = submitPartnerLead(lead, workspaceSlug);
    setLead(submitted);
    setLeadNotice(`Saved. ${submitted.organizationName} is ready for the next pass.`);
  }

  function toggleFavorite(id: string) {
    const existing = favorites.some((favorite) => favorite.id === id);
    const perk = props.perks.find((item) => `fav-${item.id.replace('perk-', '')}` === id);
    const event = props.events.find((item) => `fav-${item.id.replace('event-', '')}` === id);
    const next = existing
      ? favorites.map((favorite) => (favorite.id === id ? { ...favorite, saved: !favorite.saved } : favorite))
      : [
          ...favorites,
          ...(perk
            ? [{
                id,
                type: 'Perk' as const,
                name: `${perk.partner}: ${perk.offerTitle}`,
                detail: `${perk.saves} residents saved it`,
                saved: true,
              }]
            : []),
          ...(event
            ? [{
                id,
                type: 'Event' as const,
                name: event.title,
                detail: `${event.rsvpCount} people said yes`,
                saved: true,
              }]
            : []),
          ...props.trendingLocations
            .filter((place) => `fav-${place.id.replace('trend-', '')}` === id)
            .map((place) => ({
              id,
              type: 'Venue' as const,
              name: place.name,
              detail: `${place.trend} · ${place.distance}`,
              saved: true,
            })),
        ];
    setFavorites(next);
    saveFavoriteState(next, workspaceSlug);
  }

  async function copyText(text: string) {
    await navigator.clipboard?.writeText(text);
  }

  function downloadTextFile(filename: string, text: string) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function writeBillingSummary(action: 'quote' | 'invoice') {
    const totalDue = couponResult?.accepted ? couponResult.totalDue : props.billing.price;
    const label = action === 'quote' ? 'quote' : 'invoice request';
    downloadTextFile(
      `${workspaceSlug.replace(/^partner-/, '')}-${label.replace(' ', '-')}.txt`,
      [
        `${workspaceName} Downtown Perks plan`,
        `${props.billing.name}: ${money(props.billing.price)}/${props.billing.cadence}`,
        `Coupon: ${couponResult?.accepted ? coupon.toUpperCase() : 'none'}`,
        `Total due today: ${money(totalDue)}`,
        `Add-ons: ${props.billing.addOns.join(', ')}`,
      ].join('\n'),
    );
    setBillingNotice(action === 'quote' ? 'Quote downloaded. Short, tidy, and ready to send.' : 'Invoice request downloaded. Finance has what it needs.');
  }

  return (
    <div className="shore-workspace">
      <header className="shore-workspace-header sticky top-0 z-20 bg-white/95 backdrop-blur">
        <div className="shore-header-shell mx-auto max-w-6xl px-5 sm:px-8">
          <div className="shore-header-top">
            <a href="/admin" className="shore-brand" aria-label="Downtown Perks home">
              <span className="shore-brand-mark">DP</span>
              <span className="shore-brand-word">Downtown Perks</span>
            </a>
            <div className="shore-header-actions">
              <span className="shore-header-title">Partner workspace</span>
              <div className="shore-header-status">{props.partner.status}</div>
              <button
                type="button"
                className="shore-menu-button"
                aria-label={workspaceMenuOpen ? 'Close workspace menu' : 'Open workspace menu'}
                aria-expanded={workspaceMenuOpen}
                onClick={() => setWorkspaceMenuOpen((open) => !open)}
              >
                {workspaceMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {workspaceMenuOpen && (
            <div className="shore-menu-panel" role="dialog" aria-label={`${workspaceName} workspace menu`}>
              <a href="#home" onClick={() => setWorkspaceMenuOpen(false)} className="shore-menu-link">{workspaceName} overview</a>
              <a href="/admin" onClick={() => setWorkspaceMenuOpen(false)} className="shore-menu-link">Main portal</a>
              <a href="/admin/platform" onClick={() => setWorkspaceMenuOpen(false)} className="shore-menu-link">Today downtown</a>
              <a href="#reports" onClick={() => setWorkspaceMenuOpen(false)} className="shore-menu-link">Reports</a>
              <a href="#billing" onClick={() => setWorkspaceMenuOpen(false)} className="shore-menu-link">Plan</a>
            </div>
          )}
          <nav className="shore-rail shore-scrollbar flex gap-1 overflow-x-auto" aria-label={`${workspaceName} workspace sections`}>
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="shore-rail-link shrink-0">
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="shore-main mx-auto max-w-6xl px-5 py-4 sm:px-8 lg:py-6">
        <section id="home" className="shore-hero grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="shore-card shore-hero-copy overflow-hidden">
            <div className="grid gap-6 md:grid-cols-[1fr_0.72fr]">
              <div className="py-2">
                <div className="shore-partner-kicker">
                  <Building2 className="h-4 w-4" />
                  <span>{props.partner.type}</span>
                  <span>{props.partner.district}</span>
                </div>
                <h1 className="mt-2 text-[28px] leading-tight text-[#0B1F33] sm:text-[34px]">{workspaceName} workspace</h1>
                <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.66)]">
                  {props.profile.residentFacingCopy} Keep the building’s resident view, signs, perks, events, notes, reports, and plan in one easy place.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href="#setup" className="shore-button shore-button-primary">Finish setup</a>
                  <a href="#resident-preview" className="shore-button">Preview the resident view</a>
                </div>
              </div>
              <figure className="shore-hero-photo">
                <img src={props.profile.heroImage} alt={`${workspaceName} in Downtown Austin`} />
                <figcaption>{workspaceName} · {props.profile.address || props.partner.district}</figcaption>
              </figure>
            </div>
          </div>
          <div className="shore-card py-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.5)]">Workspace setup</div>
                <div className="mt-2 text-2xl font-semibold text-[#0B1F33]">{setupProgress}%</div>
              </div>
              <div className="flex h-16 w-16 items-center justify-center border border-[rgba(11,31,51,0.08)] bg-[#F7F8FB]">
                <Check className="h-7 w-7 text-[#C8A96A]" />
              </div>
            </div>
            <div className="shore-progress-track mt-5">
              <div className="h-full bg-[#C8A96A]" style={{ width: `${setupProgress}%` }} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-6">
              <MiniStat label="Seen this month" value="867" note="Resident notes opened" />
              <MiniStat label="Best next move" value="Ready" note="Add the lobby link to the move-in email" />
            </div>
          </div>
        </section>

        <section className="shore-status-strip grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={`${workspaceName} workspace status`}>
          {activeModules.map(([label, value]) => (
            <div key={label} className="shore-module-item">
              <div className="text-xs font-semibold text-[#0B1F33]">{label}</div>
              <div className="mt-2 text-[11px] font-bold uppercase text-[#C8A96A]">{value}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="shore-card">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-[#C8A96A]">
              <Star className="h-4 w-4" />
              My favorites
            </div>
            <h2 className="mt-2 text-2xl leading-tight text-[#0B1F33] sm:text-[28px]">A short list worth keeping</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.64)]">Save the places, perks, and plans residents should see first. Tap once to keep something, tap again to clear it.</p>
            <div className="mt-4 space-y-2">
              {favorites.map((item) => (
                <div key={item.id}>
                  <ToggleFavorite item={item} onToggle={toggleFavorite} />
                </div>
              ))}
            </div>
          </div>
          <div className="shore-card">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-[#C8A96A]">
              <MapPin className="h-4 w-4" />
              Buzz nearby
            </div>
            <h2 className="mt-2 text-2xl leading-tight text-[#0B1F33] sm:text-[28px]">Nearby spots residents are already choosing</h2>
            <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {props.trendingLocations.map((place) => (
                <div key={place.id} className="py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#0B1F33]">{place.name}</div>
                      <div className="text-xs text-[rgba(11,31,51,0.58)]">{place.category} · {place.distance}</div>
                    </div>
                    <span className="text-[11px] font-bold uppercase text-[#C8A96A]">{place.trend}</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[rgba(11,31,51,0.66)]">{place.anonymizedCheckIns} anonymous check-ins. No names, just a quick read on what feels lively.</p>
                  <button type="button" onClick={() => toggleFavorite(`fav-${place.id.replace('trend-', '')}`)} className="shore-button mt-3 w-full">
                    <Heart className="h-4 w-4" /> Save or remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Section id="setup" eyebrow="Setup" title={`The details that make ${workspaceName} feel ready`} description="Start with the basics people notice first: the place, the neighborhood, the right contact, and the first note worth sending.">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr]">
            <form onSubmit={handleSubmit} className="shore-card grid gap-4 sm:grid-cols-2">
              <Field label="Organization name" value={lead.organizationName} onChange={(value) => updateLead('organizationName', value)} />
              <Field label="Partner type" value={lead.partnerType} onChange={(value) => updateLead('partnerType', value)} />
              <Field label="Contact name" value={lead.contactName} placeholder="Add the property contact" onChange={(value) => updateLead('contactName', value)} />
              <Field label="Email" value={lead.email} placeholder="name@theshore.com" onChange={(value) => updateLead('email', value)} type="email" />
              <Field label="Phone" value={lead.phone} placeholder="Add a direct line" onChange={(value) => updateLead('phone', value)} />
              <Field label="Homes / residents" value={lead.unitCount} onChange={(value) => updateLead('unitCount', value)} type="number" />
              <label className="block sm:col-span-2">
                <span className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.58)]">Property address</span>
                <input className="shore-input mt-2" value={lead.address} onChange={(event) => updateLead('address', event.target.value)} />
              </label>
              <Field label="Plan selection" value={lead.selectedPlan} onChange={(value) => updateLead('selectedPlan', value)} />
              <label className="block sm:col-span-2">
                <span className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.58)]">Helpful note</span>
                <textarea className="shore-input mt-2 min-h-24" value={lead.notes || ''} onChange={(event) => updateLead('notes', event.target.value)} />
              </label>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                <button type="submit" className="shore-button shore-button-primary"><Send className="h-4 w-4" /> Save setup</button>
                <span className="text-xs font-semibold text-[rgba(11,31,51,0.58)]">{leadNotice}</span>
              </div>
            </form>
            <div className="shore-card">
              <div className="text-[11px] font-bold uppercase text-[#C8A96A]">Building note</div>
              <h3 className="mt-2 text-xl font-semibold text-[#0B1F33]">{props.profile.propertyName}</h3>
              <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.66)]">{props.profile.description}</p>
              <div className="mt-4 space-y-3 text-sm">
                <div><strong>Who it helps:</strong> {props.profile.residentAudience}</div>
                <div><strong>Amenities:</strong> {props.profile.buildingAmenities.join(', ')}</div>
                <div><strong>Nearby:</strong> {props.profile.nearbyAnchors.join(', ')}</div>
                <div><strong>Best first move:</strong> {props.profile.managerNotes}</div>
              </div>
            </div>
          </div>
        </Section>

        <Section id="resident-preview" eyebrow="Resident view" title="What residents see" description="A quick preview of the card, map links, nearby places, and one-tap actions residents can use from the lobby, elevator, or move-in email.">
          <div className="shore-card grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="text-[11px] font-bold uppercase text-[#C8A96A]">Resident card</div>
              <h3 className="mt-2 text-xl font-semibold">{props.profile.propertyName}</h3>
              <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.66)]">{props.profile.residentFacingCopy}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <span>Nearby: Hotel Van Zandt, Rainey Street</span>
                <span>Next up: Mixer, Rainey Night Out</span>
                <span>Resident card: Ready</span>
                <span>Entry point: Lobby code</span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" className="shore-button justify-start" onClick={() => toggleFavorite('fav-van-zandt')}>
                <Heart className="h-4 w-4" /> Save a nearby place
              </button>
              <a href="/map?mode=resident&tab=map&filter=All" className="shore-button justify-start">
                <ArrowUpRight className="h-4 w-4" /> Open the resident map
              </a>
              <a href="#perks" className="shore-button justify-start">
                <ArrowUpRight className="h-4 w-4" /> See resident perks
              </a>
              <a href="#events" className="shore-button justify-start">
                <ArrowUpRight className="h-4 w-4" /> See events
              </a>
            </div>
          </div>
        </Section>

        <Section id="qr" eyebrow="Codes" title="Put the entry points where residents already look" description="Each code has a real place, a clear destination, scan activity, and one job: help residents find something worth doing nearby.">
          <div className="grid gap-x-10 gap-y-6 lg:grid-cols-3">
            {props.qrs.map((qr) => (
              <div key={qr.id} className="shore-card py-2">
                <div className="flex items-start justify-between gap-3">
                  <QrCode className="h-5 w-5 text-[#C8A96A]" />
                  <span className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.52)]">{qr.status}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold">{qr.name}</h3>
                <p className="mt-1 text-xs leading-5 text-[rgba(11,31,51,0.62)]">{qr.placement} → {qr.destination}</p>
                <div className="mt-3 text-2xl font-semibold">{qr.scans} scans</div>
                <p className="text-xs text-[rgba(11,31,51,0.6)]">{qr.conversionSignal} · Last scan: {qr.lastScan}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" className="shore-button" onClick={() => copyText(`${window.location.origin}${qr.destination}`)}>
                    <Copy className="h-3.5 w-3.5" /> Copy link
                  </button>
                  <button type="button" className="shore-button" onClick={() => downloadTextFile(`${qr.id}.txt`, `${qr.name}\n${window.location.origin}${qr.destination}`)}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="perks" eyebrow="Perks" title="Small reasons to choose somewhere nearby" description="Offers should be easy to understand, easy to save, and easy to use without making residents decode fine print.">
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
            {props.perks.map((perk) => (
              <div key={perk.id} className="shore-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase text-[#C8A96A]">{perk.partner}</div>
                    <h3 className="mt-1 text-lg font-semibold">{perk.offerTitle}</h3>
                  </div>
                  <span className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.5)]">{perk.status}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.66)]">{perk.description}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <MiniStat label="Saved" value={String(perk.saves)} note="People kept it" />
                  <MiniStat label="Used" value={String(perk.redemptions)} note="People showed up" />
                  <MiniStat label="Scans" value={String(perk.qrScans)} note="How they found it" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="shore-button" onClick={() => toggleFavorite(`fav-${perk.id.replace('perk-', '')}`)}>
                    <Heart className="h-4 w-4" /> Save
                  </button>
                  <a href={createGoogleCalendarUrl(perk, props.profile.propertyName)} target="_blank" rel="noreferrer" className="shore-button">
                    <CalendarPlus className="h-4 w-4" /> Add to Google Calendar
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="events" eyebrow="Events" title="Plans residents can say yes to" description="Simple invites with the count, the place, the linked sign, and a calendar tap for anyone who wants the reminder.">
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
            {props.events.map((event) => (
              <div key={event.id} className="shore-card">
                <div className="text-[11px] font-bold uppercase text-[#C8A96A]">{event.status}</div>
                <h3 className="mt-1 text-lg font-semibold">{event.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.66)]">{event.description}</p>
                <div className="mt-3 text-xs text-[rgba(11,31,51,0.62)]">{new Date(event.dateTime).toLocaleString()} · {event.location}</div>
                <div className="shore-progress-track mt-4"><div className="h-full bg-[#C8A96A]" style={{ width: `${Math.min(100, Math.round((event.rsvpCount / event.capacity) * 100))}%` }} /></div>
                <div className="mt-2 text-xs font-semibold">{event.rsvpCount}/{event.capacity} RSVPs · {event.linkedQR} · {event.linkedCampaign}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="shore-button" onClick={() => downloadTextFile(`${event.id}-attendees.csv`, `event,rsvps,capacity\n"${event.title}",${event.rsvpCount},${event.capacity}\n`)}>
                    <Download className="h-4 w-4" /> Export list
                  </button>
                  <a href={createGoogleCalendarUrl(event, props.profile.propertyName)} target="_blank" rel="noreferrer" className="shore-button">
                    <CalendarPlus className="h-4 w-4" /> Add to Google Calendar
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="campaigns" eyebrow="Notes" title={`What ${workspaceName} sends out`} description="Short, useful notes for welcome moments, weekends, campaigns, partner updates, and the monthly roundup.">
          <div className="grid gap-x-8 gap-y-6 lg:grid-cols-3">
            {props.campaigns.map((campaign) => (
              <div key={campaign.id} className="shore-card">
                <div className="text-[11px] font-bold uppercase text-[#C8A96A]">{campaign.sendStatus}</div>
                <h3 className="mt-2 text-sm font-semibold">{campaign.name}</h3>
                <p className="mt-2 text-xs leading-5 text-[rgba(11,31,51,0.62)]">{campaign.audience} · {campaign.channel}</p>
                <div className="mt-3 text-xs">Opened {campaign.opensViews} · Saved {campaign.saves} · Used {campaign.redemptions} · Scanned {campaign.qrScans}</div>
                <a href="#reports" className="shore-button mt-4 w-full"><Eye className="h-4 w-4" /> See the report</a>
              </div>
            ))}
          </div>
        </Section>

        <Section id="residents" eyebrow="Residents" title="People, not a spreadsheet" description="A light resident view for the workspace. It keeps the useful signals visible while leaving private details out of the way.">
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {props.residents.map((resident) => (
              <div key={resident.id} className="shore-card">
                <div className="flex items-center justify-between gap-2">
                  <Users className="h-4 w-4 text-[#C8A96A]" />
                  <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.5)]">{resident.engagementStatus}</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold">{resident.name}</h3>
                <p className="text-xs leading-5 text-[rgba(11,31,51,0.62)]">Home {resident.unit} · Since {resident.moveInDate}</p>
                <p className="mt-2 text-xs leading-5 text-[rgba(11,31,51,0.62)]">{resident.interests.join(', ')}</p>
                <div className="mt-3 text-xs font-semibold">{resident.savedPerks} saved perks · {resident.rsvps} RSVPs</div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="reports" eyebrow="Reports" title="What residents found, saved, joined, and used" description="A plain 30-day read on whether the building is helping people use the neighborhood more often.">
          <div className="shore-card">
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {props.reports.map((metric) => (
                <div key={metric.id}>
                  <div className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.52)]">{metric.label}</div>
                  <div className="mt-2 text-2xl font-semibold">{metric.value}</div>
                  <div className="text-xs font-bold text-[#C8A96A]">{metric.change}</div>
                  <p className="mt-2 text-xs leading-5 text-[rgba(11,31,51,0.62)]">{metric.explanation}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 border-l-2 border-[#C8A96A] bg-[#F7F8FB] p-4">
              <div className="text-sm font-semibold">What we would do next</div>
              <p className="mt-1 text-sm leading-6 text-[rgba(11,31,51,0.66)]">The lobby code is doing the most work. Put the same link in the move-in email and on the elevator sign.</p>
            </div>
          </div>
        </Section>

        <Section id="billing" eyebrow="Plan" title="Keep it running for the year" description="One yearly plan, optional help, invoice support, and a demo coupon when it is time to show the close.">
          <div className="shore-card grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-[#C8A96A]"><CreditCard className="h-4 w-4" /> {props.billing.conversionState}</div>
              <h3 className="mt-2 text-2xl font-semibold">{props.billing.name}</h3>
              <div className="mt-2 text-2xl font-semibold">{money(props.billing.price)}<span className="text-sm font-normal text-[rgba(11,31,51,0.56)]">/{props.billing.cadence}</span></div>
              <div className="mt-4 flex gap-2">
                <input className="shore-input" placeholder="Coupon code" value={coupon} onChange={(event) => setCoupon(event.target.value)} />
                <button type="button" className="shore-button" onClick={() => setCouponResult(applyCoupon(coupon, props.billing.price, props.billing.couponCodes))}>Apply</button>
              </div>
              {couponResult && (
                <p className="mt-2 text-sm font-semibold text-[#0B1F33]">
                  {couponResult.accepted ? `${coupon.toUpperCase()} applied: ${couponResult.discount}% off. Total due ${money(couponResult.totalDue)}.` : 'Coupon not recognized.'}
                </p>
              )}
            </div>
            <div>
              <div className="grid gap-2 sm:grid-cols-2">
                {props.billing.addOns.map((addOn) => (
                  <div key={addOn} className="border border-[rgba(11,31,51,0.08)] bg-[#F7F8FB] p-3 text-sm font-semibold">{addOn}</div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className="shore-button shore-button-primary" onClick={() => {
                  setCoupon('DUDE2026');
                  setCouponResult(applyCoupon('DUDE2026', props.billing.price, props.billing.couponCodes));
                  setBillingNotice(`DUDE2026 applied. ${workspaceName} can stay live for the demo.`);
                }}>
                  <Sparkles className="h-4 w-4" /> Keep workspace live
                </button>
                <button type="button" className="shore-button" onClick={() => writeBillingSummary('quote')}>Download quote</button>
                <button type="button" className="shore-button" onClick={() => writeBillingSummary('invoice')}>Request invoice</button>
              </div>
              <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.64)]">{billingNotice}</p>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
