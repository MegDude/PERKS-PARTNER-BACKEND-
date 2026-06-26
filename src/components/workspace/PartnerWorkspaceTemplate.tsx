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
  QrCode,
  Send,
  Sparkles,
  Star,
  Users,
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

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.58)]">{label}</span>
      <input className="shore-input mt-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
      <div className="mb-4">
        <div className="text-[11px] font-bold uppercase text-[#C8A96A]">{eyebrow}</div>
        <h2 className="shore-editorial mt-1 text-2xl leading-tight text-[#0B1F33] sm:text-[28px]">{title}</h2>
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
  const [lead, setLead] = useState<PartnerLead>(() => loadPartnerLead(props.lead));
  const [favorites, setFavorites] = useState(() => loadFavoriteState(props.favorites));
  const [leadNotice, setLeadNotice] = useState('The Shore is ready to review.');
  const [coupon, setCoupon] = useState('');
  const [couponResult, setCouponResult] = useState<{ discount: number; totalDue: number; accepted: boolean } | null>(null);
  const [billingNotice, setBillingNotice] = useState('DUDE2026 covers the demo conversion when you want to show the close.');
  const setupProgress = calculateSetupProgress(props, lead);
  const activePerks = props.perks.filter((perk) => perk.status === 'Active').length;
  const upcomingEvents = props.events.filter((event) => event.status !== 'Draft').length;

  const activeModules = useMemo(
    () => [
      ['Profile', 'Ready'],
      ['Codes', 'Live'],
      ['Residents', 'Added'],
      ['Perks', `${activePerks} live`],
      ['Events', `${upcomingEvents} next up`],
      ['Reports', 'Current'],
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
    const submitted = submitPartnerLead(lead);
    setLead(submitted);
    setLeadNotice(`Saved. The next step is a quick approval for ${submitted.organizationName}.`);
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
    saveFavoriteState(next);
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
      `the-shore-${label.replace(' ', '-')}.txt`,
      [
        'The Shore Downtown Perks plan',
        `${props.billing.name}: ${money(props.billing.price)}/${props.billing.cadence}`,
        `Coupon: ${couponResult?.accepted ? coupon.toUpperCase() : 'none'}`,
        `Total due today: ${money(totalDue)}`,
        `Add-ons: ${props.billing.addOns.join(', ')}`,
      ].join('\n'),
    );
    setBillingNotice(action === 'quote' ? 'Quote downloaded. Neat, useful, and ready to send.' : 'Invoice request downloaded. The next step is finance, not guesswork.');
  }

  return (
    <div className="shore-workspace">
      <header className="shore-workspace-header sticky top-0 z-20 bg-white/95 backdrop-blur">
        <div className="shore-header-shell mx-auto max-w-6xl px-5 sm:px-8">
          <div className="shore-header-top">
            <div className="min-w-0">
              <div className="shore-header-eyebrow">
                <Building2 className="h-3.5 w-3.5" />
                The Shore
              </div>
              <div className="shore-header-title">Resident workspace</div>
            </div>
            <div className="shore-header-status">
              {props.partner.status}
            </div>
          </div>
          <nav className="shore-rail shore-scrollbar flex gap-1 overflow-x-auto" aria-label="The Shore workspace sections">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="shore-rail-link shrink-0">
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-1 px-5 py-4 sm:px-8 lg:py-6">
        <section id="home" className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="shore-card overflow-hidden">
            <div className="grid gap-6 md:grid-cols-[1fr_0.72fr]">
              <div className="py-2">
                <div className="text-[11px] font-bold uppercase text-[#C8A96A]">Start here</div>
                <h1 className="shore-editorial mt-2 text-[28px] leading-tight text-[#0B1F33] sm:text-[34px]">The Shore resident workspace</h1>
                <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.66)]">
                  {props.profile.residentFacingCopy} The workspace keeps the setup, resident view, QR links, perks, events, campaigns, reports, and billing in one place.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href="#setup" className="shore-button shore-button-primary">Set up The Shore</a>
                  <a href="#resident-preview" className="shore-button">See the resident view</a>
                </div>
              </div>
              <figure className="shore-hero-photo">
                <img src={props.profile.heroImage} alt="The Shore building in downtown Austin" />
                <figcaption>The Shore · 603 Davis Street</figcaption>
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
            <div className="mt-5 h-2 bg-[#F7F8FB]">
              <div className="h-full bg-[#C8A96A]" style={{ width: `${setupProgress}%` }} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-6">
              <MiniStat label="Seen this month" value="867" note="Resident notes opened" />
              <MiniStat label="Next step" value="Ready" note="Put it in the move-in email" />
            </div>
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {activeModules.map(([label, value]) => (
            <div key={label} className="shore-card p-4">
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
            <h2 className="shore-editorial mt-2 text-2xl leading-tight text-[#0B1F33] sm:text-[28px]">A short list worth keeping</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.64)]">Save the places, perks, and plans residents should see first.</p>
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
              What feels lively
            </div>
            <h2 className="shore-editorial mt-2 text-2xl leading-tight text-[#0B1F33] sm:text-[28px]">Nearby spots residents are already choosing</h2>
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
                  <p className="mt-3 text-xs leading-5 text-[rgba(11,31,51,0.66)]">{place.anonymizedCheckIns} anonymous check-ins. No names, just a useful read on what is moving.</p>
                  <button type="button" onClick={() => toggleFavorite(`fav-${place.id.replace('trend-', '')}`)} className="shore-button mt-3 w-full">
                    <Heart className="h-4 w-4" /> Save or remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Section id="setup" eyebrow="Setup" title="The few details we actually need">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr]">
            <form onSubmit={handleSubmit} className="shore-card grid gap-4 sm:grid-cols-2">
              <Field label="Organization name" value={lead.organizationName} onChange={(value) => updateLead('organizationName', value)} />
              <Field label="Partner type" value={lead.partnerType} onChange={(value) => updateLead('partnerType', value)} />
              <Field label="Contact name" value={lead.contactName} onChange={(value) => updateLead('contactName', value)} />
              <Field label="Email" value={lead.email} onChange={(value) => updateLead('email', value)} type="email" />
              <Field label="Phone" value={lead.phone} onChange={(value) => updateLead('phone', value)} />
              <Field label="Residents / units" value={lead.unitCount} onChange={(value) => updateLead('unitCount', value)} type="number" />
              <label className="block sm:col-span-2">
                <span className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.58)]">Property address</span>
                <input className="shore-input mt-2" value={lead.address} onChange={(event) => updateLead('address', event.target.value)} />
              </label>
              <Field label="Plan selection" value={lead.selectedPlan} onChange={(value) => updateLead('selectedPlan', value)} />
              <label className="block sm:col-span-2">
                <span className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.58)]">Notes</span>
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
                <div><strong>Who it is for:</strong> {props.profile.residentAudience}</div>
                <div><strong>Amenities:</strong> {props.profile.buildingAmenities.join(', ')}</div>
                <div><strong>Nearby:</strong> {props.profile.nearbyAnchors.join(', ')}</div>
                <div><strong>Best first move:</strong> {props.profile.managerNotes}</div>
              </div>
            </div>
          </div>
        </Section>

        <Section id="resident-preview" eyebrow="Resident view" title="What it feels like on their side">
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

        <Section id="qr" eyebrow="Codes" title="Put the entry points where residents already look">
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

        <Section id="perks" eyebrow="Perks" title="Small reasons to choose somewhere nearby">
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

        <Section id="events" eyebrow="Events" title="Plans residents can say yes to">
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
            {props.events.map((event) => (
              <div key={event.id} className="shore-card">
                <div className="text-[11px] font-bold uppercase text-[#C8A96A]">{event.status}</div>
                <h3 className="mt-1 text-lg font-semibold">{event.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.66)]">{event.description}</p>
                <div className="mt-3 text-xs text-[rgba(11,31,51,0.62)]">{new Date(event.dateTime).toLocaleString()} · {event.location}</div>
                <div className="mt-4 h-2 bg-[#F7F8FB]"><div className="h-full bg-[#C8A96A]" style={{ width: `${Math.min(100, Math.round((event.rsvpCount / event.capacity) * 100))}%` }} /></div>
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

        <Section id="campaigns" eyebrow="Notes" title="What The Shore sends out">
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

        <Section id="residents" eyebrow="Residents" title="A small sample, not a spreadsheet">
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {props.residents.map((resident) => (
              <div key={resident.id} className="shore-card">
                <div className="flex items-center justify-between gap-2">
                  <Users className="h-4 w-4 text-[#C8A96A]" />
                  <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.5)]">{resident.engagementStatus}</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold">{resident.name}</h3>
                <p className="text-xs leading-5 text-[rgba(11,31,51,0.62)]">Unit {resident.unit} · Move-in {resident.moveInDate}</p>
                <p className="mt-2 text-xs leading-5 text-[rgba(11,31,51,0.62)]">{resident.interests.join(', ')}</p>
                <div className="mt-3 text-xs font-semibold">{resident.savedPerks} saved perks · {resident.rsvps} RSVPs</div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="reports" eyebrow="Reports" title="What residents found, saved, joined, and used">
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

        <Section id="billing" eyebrow="Plan" title="Keep it running for the year">
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
                  setBillingNotice('DUDE2026 applied. The Shore is converted for the demo.');
                }}>
                  <Sparkles className="h-4 w-4" /> Keep The Shore live
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
