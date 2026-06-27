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
import type { Campaign, Event, FavoriteItem, PartnerLead, PartnerWorkspaceData, Perk, Resident } from '@/types/partnerWorkspace';
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
type QrArtwork = {
  headline: string;
  bodyCopy: string;
  logoUrl: string;
  imageUrl: string;
  printSize: string;
};

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Setup', href: '#setup' },
  { label: 'Codes', href: '#qr' },
  { label: 'Perks', href: '#perks' },
  { label: 'Events', href: '#events' },
  { label: 'Broadcasts', href: '#campaigns' },
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

function absoluteUrl(destination: string) {
  if (/^https?:\/\//i.test(destination)) return destination;
  const origin = typeof window === 'undefined' ? 'https://downtownperks.com' : window.location.origin;
  return `${origin}${destination.startsWith('/') ? destination : `/${destination}`}`;
}

function qrImageUrl(destination: string, size = 320) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=16&data=${encodeURIComponent(absoluteUrl(destination))}`;
}

function cleanFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'qr-artwork';
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[character] || character));
}

function localDateTimeValue(value: string) {
  if (!value) return '';
  return value.slice(0, 16);
}

function QrArtworkPreview({ workspaceName, qr, artwork }: { workspaceName: string; qr: Props['qrs'][number]; artwork: QrArtwork }) {
  const destination = absoluteUrl(qr.destination);
  return (
    <div className="shore-qr-artwork" aria-label={`${qr.name} QR artwork preview`}>
      {artwork.imageUrl && <img className="shore-qr-artwork-image" src={artwork.imageUrl} alt="" />}
      <div className="shore-qr-artwork-top">
        {artwork.logoUrl ? <img className="shore-qr-logo" src={artwork.logoUrl} alt={`${workspaceName} logo`} /> : <span className="shore-qr-logo-text">{workspaceName.slice(0, 2).toUpperCase()}</span>}
        <span>{workspaceName}</span>
      </div>
      <img className="shore-qr-code-image" src={qrImageUrl(qr.destination)} alt={`QR code for ${qr.name}`} />
      <div className="shore-qr-artwork-copy">
        <strong>{artwork.headline}</strong>
        <span>{artwork.bodyCopy}</span>
        <small>{destination}</small>
      </div>
    </div>
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
  const [billingNotice, setBillingNotice] = useState(`${workspaceName} is on ${props.billing.name}. Add support when the building needs a little more lift.`);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [perks, setPerks] = useState<Perk[]>(props.perks);
  const [events, setEvents] = useState<Event[]>(props.events);
  const [campaigns, setCampaigns] = useState<Campaign[]>(props.campaigns);
  const [residents, setResidents] = useState<Resident[]>(props.residents);
  const [perkNotice, setPerkNotice] = useState<Record<string, string>>({});
  const [eventNotice, setEventNotice] = useState<Record<string, string>>({});
  const [campaignNotice, setCampaignNotice] = useState<Record<string, string>>({});
  const [residentNotice, setResidentNotice] = useState<Record<string, string>>({});
  const [qrNotice, setQrNotice] = useState<Record<string, string>>({});
  const [residentImport, setResidentImport] = useState('');
  const [qrArtwork, setQrArtwork] = useState<Record<string, QrArtwork>>(() =>
    Object.fromEntries(props.qrs.map((qr) => [qr.id, {
      headline: qr.headline || qr.name,
      bodyCopy: qr.bodyCopy || qr.conversionSignal || `Scan for ${workspaceName}.`,
      logoUrl: qr.logoUrl || '',
      imageUrl: qr.imageUrl || '',
      printSize: qr.printSize || '4 x 6 in',
    }]))
  );
  const setupProgress = calculateSetupProgress(props, lead);
  const activePerks = perks.filter((perk) => perk.status === 'Active').length;
  const upcomingEvents = events.filter((event) => event.status !== 'Draft').length;
  const previewAnchors = props.profile.nearbyAnchors.slice(0, 2).join(' and ');
  const previewPerk = perks.find((perk) => perk.status === 'Active') || perks[0];
  const previewEvent = events.find((event) => event.status === 'Published' || event.status === 'Scheduled') || events[0];
  const previewCode = props.qrs.find((qr) => qr.status === 'Active') || props.qrs[0];
  const reportSnapshot = useMemo(() => {
    const qrScans = props.qrs.reduce((total, qr) => total + qr.scans, 0);
    const residentActivations = Math.round(residents.length * 23.4);
    const perkSaves = perks.reduce((total, perk) => total + Number(perk.saves || 0), 0);
    const perkRedemptions = perks.reduce((total, perk) => total + Number(perk.redemptions || 0), 0);
    const eventRsvps = events.reduce((total, event) => total + Number(event.rsvpCount || 0), 0);
    const campaignViews = campaigns.reduce((total, campaign) => total + Number(campaign.opensViews || 0), 0);
    const nearbyOpenRate = Math.min(78, Math.max(24, Math.round((props.trendingLocations.reduce((total, place) => total + place.anonymizedCheckIns, 0) / Math.max(residents.length, 1)) * 0.42)));
    const participationRate = Math.min(92, Math.round(((residentActivations + eventRsvps + perkRedemptions) / Math.max(Number(lead.unitCount || 1), 1)) * 100));
    const topQr = [...props.qrs].sort((a, b) => b.scans - a.scans)[0];
    const topPerk = [...perks].sort((a, b) => (b.saves + b.redemptions) - (a.saves + a.redemptions))[0];
    const topEvent = [...events].sort((a, b) => b.rsvpCount - a.rsvpCount)[0];
    const topPlace = [...props.trendingLocations].sort((a, b) => b.anonymizedCheckIns - a.anonymizedCheckIns)[0];
    return {
      metrics: [
        { id: 'qr-scans', label: 'Code scans', value: String(qrScans), change: '+18%', explanation: `${topQr?.placement || 'Lobby'} is where residents are finding this first.` },
        { id: 'resident-activations', label: 'Residents joined', value: String(residentActivations), change: '+24%', explanation: 'New residents are saving their card after seeing a building sign.' },
        { id: 'perk-saves', label: 'Things saved', value: String(perkSaves), change: '+15%', explanation: `${topPerk?.partner || 'Nearby coffee'} is the clearest sign of interest.` },
        { id: 'perk-redemptions', label: 'Offers used', value: String(perkRedemptions), change: '+11%', explanation: 'People are moving from “that looks good” to actually using it.' },
        { id: 'event-rsvps', label: 'Event yeses', value: String(eventRsvps), change: '+20%', explanation: `${topEvent?.title || 'Resident events'} gives residents a simple reason to show up.` },
        { id: 'broadcast-views', label: 'Broadcasts opened', value: String(campaignViews), change: '+27%', explanation: 'Move-in and weekend broadcasts are starting to become useful habits.' },
        { id: 'nearby-open-rate', label: 'Nearby places opened', value: `${nearbyOpenRate}%`, change: '+9%', explanation: `${topPlace?.name || 'Nearby places'} is getting the most anonymous activity right now.` },
        { id: 'participation-rate', label: 'Residents taking part', value: `${participationRate}%`, change: '+6%', explanation: 'Enough residents are using this to make the program worth keeping.' },
      ],
      recommendation: topQr
        ? `${topQr.name} is doing the most work. Put the same link in the move-in email, elevator sign, and the next resident broadcast.`
        : 'Start with one lobby code, one useful offer, and one resident invite. Then let the report show what caught on.',
    };
  }, [campaigns, events, lead.unitCount, perks, props.qrs, props.trendingLocations, residents.length]);

  const activeModules = useMemo(
    () => [
      ['Profile', 'Ready'],
      ['Codes', 'Live'],
      ['Residents', `${residents.length} records`],
      ['Perks', `${activePerks} live`],
      ['Events', `${upcomingEvents} next up`],
      ['Broadcasts', `${campaigns.length} ready`],
      ['Reports', 'Fresh'],
      ['Plan', props.partner.status],
    ],
    [activePerks, campaigns.length, props.partner.status, residents.length, upcomingEvents],
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
    const perk = perks.find((item) => `fav-${item.id.replace('perk-', '')}` === id);
    const event = events.find((item) => `fav-${item.id.replace('event-', '')}` === id);
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

  function updateQrArtwork(qrId: string, key: keyof QrArtwork, value: string) {
    setQrArtwork((current) => ({
      ...current,
      [qrId]: {
        ...current[qrId],
        [key]: value,
      },
    }));
  }

  function updatePerk(perkId: string, key: keyof Perk, value: string) {
    setPerks((current) => current.map((perk) => (perk.id === perkId ? { ...perk, [key]: value } : perk)));
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

  function qrArtworkSvg(qr: Props['qrs'][number]) {
    const artwork = qrArtwork[qr.id];
    const destination = absoluteUrl(qr.destination);
    const logo = artwork.logoUrl ? `<image href="${escapeXml(artwork.logoUrl)}" x="48" y="44" width="48" height="48" preserveAspectRatio="xMidYMid slice" />` : `<rect x="48" y="44" width="48" height="48" fill="#0B1F33"/><text x="72" y="75" text-anchor="middle" fill="#fff" font-family="Inter, Arial" font-size="16" font-weight="800">${escapeXml(workspaceName.slice(0, 2).toUpperCase())}</text>`;
    const photo = artwork.imageUrl ? `<image href="${escapeXml(artwork.imageUrl)}" x="0" y="0" width="720" height="240" preserveAspectRatio="xMidYMid slice" opacity="0.9" />` : '';
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080">
  <rect width="720" height="1080" fill="#FFFFFF"/>
  ${photo}
  <rect x="0" y="0" width="720" height="1080" fill="rgba(255,255,255,0.86)"/>
  ${logo}
  <text x="116" y="65" fill="#0B1F33" font-family="Inter, Arial" font-size="24" font-weight="800">${escapeXml(workspaceName)}</text>
  <text x="116" y="90" fill="#C8A96A" font-family="Inter, Arial" font-size="14" font-weight="800">${escapeXml(qr.placement)}</text>
  <text x="48" y="184" fill="#0B1F33" font-family="Inter, Arial" font-size="44" font-weight="700">${escapeXml(artwork.headline)}</text>
  <foreignObject x="48" y="214" width="624" height="120"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Inter,Arial,sans-serif;font-size:22px;line-height:1.35;color:rgba(11,31,51,.68)">${escapeXml(artwork.bodyCopy)}</div></foreignObject>
  <image href="${escapeXml(qrImageUrl(qr.destination, 520))}" x="100" y="378" width="520" height="520"/>
  <text x="360" y="952" text-anchor="middle" fill="#0B1F33" font-family="Inter, Arial" font-size="18" font-weight="700">${escapeXml(destination)}</text>
  <text x="360" y="994" text-anchor="middle" fill="#8A6A1F" font-family="Inter, Arial" font-size="15" font-weight="800">Downtown Perks · ${escapeXml(artwork.printSize)}</text>
</svg>`;
  }

  function exportQrArtwork(qr: Props['qrs'][number]) {
    downloadTextFile(`${cleanFileName(workspaceName)}-${cleanFileName(qr.name)}.svg`, qrArtworkSvg(qr));
  }

  async function saveQrMaterial(qr: Props['qrs'][number]) {
    const artwork = qrArtwork[qr.id];
    const payload = {
      id: qr.id,
      label: qr.name,
      placement: qr.placement,
      destination_url: absoluteUrl(qr.destination),
      status: qr.status.toLowerCase(),
      scans: qr.scans,
      artwork,
      workspace_name: workspaceName,
      updated_at: new Date().toISOString(),
    };
    try {
      const patch = await fetch(`/api/entities/PartnerQrExperience/${encodeURIComponent(qr.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!patch.ok) {
        await fetch('/api/entities/PartnerQrExperience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setQrNotice((current) => ({ ...current, [qr.id]: 'Artwork saved to the workspace.' }));
    } catch {
      setQrNotice((current) => ({ ...current, [qr.id]: 'Saved locally. Backend is not reachable from this browser.' }));
    }
  }

  function printQrArtwork(qr: Props['qrs'][number]) {
    const svg = qrArtworkSvg(qr);
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100');
    if (!printWindow) {
      exportQrArtwork(qr);
      return;
    }
    printWindow.document.write(`<!doctype html><html><head><title>${qr.name}</title><style>@page{size:${qrArtwork[qr.id].printSize.includes('8.5') ? 'letter' : '4in 6in'};margin:0}body{margin:0;background:#fff}svg{display:block;width:100%;height:auto}</style></head><body>${svg}<script>window.onload=()=>{window.print()}</script></body></html>`);
    printWindow.document.close();
  }

  async function savePerkSetup(perk: Perk, nextStatus: Perk['status'] = perk.status) {
    const nextPerk = { ...perk, status: nextStatus };
    setPerks((current) => current.map((item) => (item.id === perk.id ? nextPerk : item)));
    const payload = {
      id: nextPerk.id,
      partner: nextPerk.partner,
      name: nextPerk.partner,
      title: nextPerk.offerTitle,
      offer_title: nextPerk.offerTitle,
      description: nextPerk.description,
      eligibility: nextPerk.eligibility,
      start_date: nextPerk.startDate,
      end_date: nextPerk.endDate,
      status: nextStatus.toLowerCase(),
      active: nextStatus === 'Active',
      is_active: nextStatus === 'Active',
      saves: nextPerk.saves,
      redemption_count: nextPerk.redemptions,
      scans: nextPerk.qrScans,
      location: nextPerk.location,
      address: nextPerk.location,
      workspace_name: workspaceName,
      updated_at: new Date().toISOString(),
    };
    try {
      const patch = await fetch(`/api/perks/${encodeURIComponent(nextPerk.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!patch.ok) {
        await fetch('/api/perks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setPerkNotice((current) => ({ ...current, [perk.id]: nextStatus === 'Active' ? 'Perk published and saved.' : 'Perk saved.' }));
    } catch {
      setPerkNotice((current) => ({ ...current, [perk.id]: 'Saved locally. Backend is not reachable from this browser.' }));
    }
  }

  function updateEvent(eventId: string, key: keyof Event, value: string | number) {
    setEvents((current) => current.map((item) => (item.id === eventId ? { ...item, [key]: value } : item)));
  }

  function addEvent() {
    const id = `event-${Date.now()}`;
    setEvents((current) => [
      {
        id,
        title: `${workspaceName} resident plan`,
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        location: props.profile.propertyName,
        description: 'A simple plan residents can say yes to.',
        rsvpCount: 0,
        capacity: 50,
        status: 'Draft',
        linkedQR: props.qrs[0]?.name || 'Lobby code',
        linkedCampaign: campaigns[0]?.name || 'Resident broadcast',
      },
      ...current,
    ]);
    setEventNotice((current) => ({ ...current, [id]: 'New event started. Add the details, then save it.' }));
  }

  async function saveEventSetup(event: Event, nextStatus: Event['status'] = event.status) {
    const nextEvent = { ...event, status: nextStatus };
    setEvents((current) => current.map((item) => (item.id === event.id ? nextEvent : item)));
    const payload = {
      id: nextEvent.id,
      title: nextEvent.title,
      description: nextEvent.description,
      date: nextEvent.dateTime,
      dateTime: nextEvent.dateTime,
      location: nextEvent.location,
      capacity: Number(nextEvent.capacity || 0),
      rsvp_count: Number(nextEvent.rsvpCount || 0),
      registered_count: Number(nextEvent.rsvpCount || 0),
      status: nextStatus.toLowerCase(),
      linked_qr: nextEvent.linkedQR,
      linked_campaign: nextEvent.linkedCampaign,
      workspace_name: workspaceName,
      updated_at: new Date().toISOString(),
    };
    try {
      const patch = await fetch(`/api/events/${encodeURIComponent(nextEvent.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!patch.ok) {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setEventNotice((current) => ({ ...current, [event.id]: nextStatus === 'Published' ? 'Event published and saved.' : 'Event saved.' }));
    } catch {
      setEventNotice((current) => ({ ...current, [event.id]: 'Saved locally. Backend is not reachable from this browser.' }));
    }
  }

  async function removeEvent(event: Event) {
    setEvents((current) => current.filter((item) => item.id !== event.id));
    try {
      await fetch(`/api/entities/Event/${encodeURIComponent(event.id)}`, { method: 'DELETE' });
    } catch {
      setEventNotice((current) => ({ ...current, [event.id]: 'Removed locally. Backend is not reachable from this browser.' }));
    }
  }

  function updateCampaign(campaignId: string, key: keyof Campaign, value: string | number | string[]) {
    setCampaigns((current) => current.map((item) => (item.id === campaignId ? { ...item, [key]: value } : item)));
  }

  function addCampaign() {
    const id = `campaign-${Date.now()}`;
    setCampaigns((current) => [
      {
        id,
        name: `${workspaceName} resident broadcast`,
        audience: 'All residents',
        channel: 'Email + building code',
        linkedItems: [],
        sendStatus: 'Draft',
        opensViews: 0,
        saves: 0,
        redemptions: 0,
        qrScans: 0,
      },
      ...current,
    ]);
    setCampaignNotice((current) => ({ ...current, [id]: 'Broadcast started. Add the audience, channel, and linked items.' }));
  }

  async function saveCampaignSetup(campaign: Campaign, nextStatus: Campaign['sendStatus'] = campaign.sendStatus) {
    const nextCampaign = { ...campaign, sendStatus: nextStatus };
    setCampaigns((current) => current.map((item) => (item.id === campaign.id ? nextCampaign : item)));
    const payload = {
      id: nextCampaign.id,
      title: nextCampaign.name,
      name: nextCampaign.name,
      audience: nextCampaign.audience,
      channel: nextCampaign.channel,
      linked_items: nextCampaign.linkedItems,
      status: nextStatus.toLowerCase(),
      opens: Number(nextCampaign.opensViews || 0),
      views: Number(nextCampaign.opensViews || 0),
      saves: Number(nextCampaign.saves || 0),
      redemptions: Number(nextCampaign.redemptions || 0),
      qr_scans: Number(nextCampaign.qrScans || 0),
      workspace_name: workspaceName,
      updated_at: new Date().toISOString(),
    };
    try {
      const patch = await fetch(`/api/campaigns/${encodeURIComponent(nextCampaign.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!patch.ok) {
        await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setCampaignNotice((current) => ({ ...current, [campaign.id]: nextStatus === 'Live' ? 'Broadcast is live and saved.' : 'Broadcast saved.' }));
    } catch {
      setCampaignNotice((current) => ({ ...current, [campaign.id]: 'Saved locally. Backend is not reachable from this browser.' }));
    }
  }

  async function removeCampaign(campaign: Campaign) {
    setCampaigns((current) => current.filter((item) => item.id !== campaign.id));
    try {
      await fetch(`/api/entities/Campaign/${encodeURIComponent(campaign.id)}`, { method: 'DELETE' });
    } catch {
      setCampaignNotice((current) => ({ ...current, [campaign.id]: 'Removed locally. Backend is not reachable from this browser.' }));
    }
  }

  function updateResident(residentId: string, key: keyof Resident, value: string | number | string[]) {
    setResidents((current) => current.map((item) => (item.id === residentId ? { ...item, [key]: value } : item)));
  }

  function addResident() {
    const id = `resident-${Date.now()}`;
    setResidents((current) => [
      {
        id,
        name: 'New resident',
        unit: '',
        email: '',
        moveInDate: new Date().toISOString().slice(0, 10),
        interests: [],
        savedPerks: 0,
        rsvps: 0,
        engagementStatus: 'New resident',
      },
      ...current,
    ]);
    setResidentNotice((current) => ({ ...current, [id]: 'Resident started. Add what you know, then save.' }));
  }

  async function saveResident(resident: Resident) {
    const payload = {
      id: resident.id,
      name: resident.name,
      unit: resident.unit,
      email: resident.email,
      move_in_date: resident.moveInDate,
      interests: resident.interests,
      saved_perks: Number(resident.savedPerks || 0),
      rsvps: Number(resident.rsvps || 0),
      engagement_status: resident.engagementStatus,
      workspace_name: workspaceName,
      updated_at: new Date().toISOString(),
    };
    try {
      const patch = await fetch(`/api/residents/${encodeURIComponent(resident.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!patch.ok) {
        await fetch('/api/residents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setResidentNotice((current) => ({ ...current, [resident.id]: 'Resident saved.' }));
    } catch {
      setResidentNotice((current) => ({ ...current, [resident.id]: 'Saved locally. Backend is not reachable from this browser.' }));
    }
  }

  async function removeResident(resident: Resident) {
    setResidents((current) => current.filter((item) => item.id !== resident.id));
    try {
      await fetch(`/api/entities/Tenant/${encodeURIComponent(resident.id)}`, { method: 'DELETE' });
    } catch {
      setResidentNotice((current) => ({ ...current, [resident.id]: 'Removed locally. Backend is not reachable from this browser.' }));
    }
  }

  async function importResidentsFromText() {
    const imported = residentImport
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [name = 'Resident', unit = '', email = '', interests = ''] = line.split(',').map((part) => part.trim());
        return {
          id: `resident-import-${Date.now()}-${index}`,
          name,
          unit,
          email,
          moveInDate: new Date().toISOString().slice(0, 10),
          interests: interests ? interests.split('|').map((item) => item.trim()).filter(Boolean) : [],
          savedPerks: 0,
          rsvps: 0,
          engagementStatus: 'New resident' as const,
        };
      });
    if (!imported.length) return;
    setResidents((current) => [...imported, ...current]);
    setResidentImport('');
    await Promise.all(imported.map((resident) => saveResident(resident)));
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
                  <span>{workspaceName}</span>
                </div>
                <h1 className="mt-2 text-[28px] leading-tight text-[#0B1F33] sm:text-[34px]">{workspaceName} workspace</h1>
                <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.66)]">
                  {props.profile.residentFacingCopy} Keep the building’s resident view, signs, perks, events, broadcasts, reports, and plan in one easy place.
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
              <MiniStat label="Seen this month" value="867" note="Resident broadcasts opened" />
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

        <Section id="resident-preview" eyebrow="Resident view" title="What residents see" description={`A quick look at the ${workspaceName} view: useful places, resident perks, plans worth joining, and the building signs that point people there.`}>
          <div className="shore-card grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="text-[11px] font-bold uppercase text-[#C8A96A]">{workspaceName} resident guide</div>
              <h3 className="mt-2 text-xl font-semibold">{props.profile.propertyName}</h3>
              <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.66)]">{props.profile.residentFacingCopy}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <span>Good first stop: {previewAnchors || props.profile.district}</span>
                <span>Resident perk: {previewPerk ? `${previewPerk.partner} · ${previewPerk.offerTitle}` : 'Add the first resident perk'}</span>
                <span>Plan to join: {previewEvent ? previewEvent.title : 'Add the next resident plan'}</span>
                <span>How residents find it: {previewCode ? previewCode.name : 'Add a building code'}</span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" className="shore-button justify-start" onClick={() => toggleFavorite('fav-van-zandt')}>
                <Heart className="h-4 w-4" /> Save this for later
              </button>
              <a href="/map?mode=resident&tab=map&filter=All" className="shore-button justify-start">
                <ArrowUpRight className="h-4 w-4" /> Open the neighborhood map
              </a>
              <a href="#perks" className="shore-button justify-start">
                <ArrowUpRight className="h-4 w-4" /> See The Shore perks
              </a>
              <a href="#events" className="shore-button justify-start">
                <ArrowUpRight className="h-4 w-4" /> See what’s coming up
              </a>
            </div>
          </div>
        </Section>

        <Section id="qr" eyebrow="Codes" title="Put the entry points where people already look" description="Each code now has artwork, editable copy, print sizing, scan context, and export controls for lobby signs, mailroom cards, elevator sheets, welcome emails, and partner campaign materials.">
          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
            {props.qrs.map((qr) => (
              <div key={qr.id} className="shore-card py-2">
                <div className="grid gap-5 sm:grid-cols-[190px_1fr]">
                  <QrArtworkPreview workspaceName={workspaceName} qr={qr} artwork={qrArtwork[qr.id]} />
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <QrCode className="h-5 w-5 text-[#C8A96A]" />
                      <span className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.52)]">{qr.status}</span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold">{qr.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-[rgba(11,31,51,0.62)]">{qr.placement} → {qr.destination}</p>
                    <div className="mt-3 text-2xl font-semibold">{qr.scans} scans</div>
                    <p className="text-xs text-[rgba(11,31,51,0.6)]">{qr.conversionSignal} · Last scan: {qr.lastScan}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Headline</span>
                        <input className="shore-input mt-1" value={qrArtwork[qr.id].headline} onChange={(event) => updateQrArtwork(qr.id, 'headline', event.target.value)} />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Print size</span>
                        <select className="shore-input mt-1" value={qrArtwork[qr.id].printSize} onChange={(event) => updateQrArtwork(qr.id, 'printSize', event.target.value)}>
                          <option>4 x 6 in</option>
                          <option>5 x 7 in</option>
                          <option>8.5 x 11 in</option>
                          <option>1080 x 1350 social</option>
                        </select>
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Sign copy</span>
                        <input className="shore-input mt-1" value={qrArtwork[qr.id].bodyCopy} onChange={(event) => updateQrArtwork(qr.id, 'bodyCopy', event.target.value)} />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Logo URL</span>
                        <input className="shore-input mt-1" placeholder="Add a logo image URL" value={qrArtwork[qr.id].logoUrl} onChange={(event) => updateQrArtwork(qr.id, 'logoUrl', event.target.value)} />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Background image URL</span>
                        <input className="shore-input mt-1" placeholder="Optional image URL" value={qrArtwork[qr.id].imageUrl} onChange={(event) => updateQrArtwork(qr.id, 'imageUrl', event.target.value)} />
                      </label>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <button type="button" className="shore-button" onClick={() => copyText(absoluteUrl(qr.destination))}>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                      <button type="button" className="shore-button" onClick={() => exportQrArtwork(qr)}>
                        <Download className="h-3.5 w-3.5" /> SVG
                      </button>
                      <button type="button" className="shore-button" onClick={() => printQrArtwork(qr)}>
                        <Download className="h-3.5 w-3.5" /> Print
                      </button>
                      <button type="button" className="shore-button" onClick={() => saveQrMaterial(qr)}>
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button type="button" className="shore-button" onClick={() => downloadTextFile(`${qr.id}.txt`, `${qr.name}\n${absoluteUrl(qr.destination)}\n${qrArtwork[qr.id].headline}\n${qrArtwork[qr.id].bodyCopy}`)}>
                        <Download className="h-3.5 w-3.5" /> Copy deck
                      </button>
                    </div>
                    {qrNotice[qr.id] && <p className="mt-2 text-xs font-semibold text-[rgba(11,31,51,0.58)]">{qrNotice[qr.id]}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="perks" eyebrow="Perks" title="Small reasons to choose somewhere nearby" description="Offers should be easy to understand, easy to save, and easy to use without making residents decode fine print.">
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
            {perks.map((perk) => (
              <div key={perk.id} className="shore-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <label className="block">
                      <span className="text-[11px] font-bold uppercase text-[#C8A96A]">Partner</span>
                      <input className="shore-input mt-1" value={perk.partner} onChange={(event) => updatePerk(perk.id, 'partner', event.target.value)} />
                    </label>
                    <label className="mt-2 block">
                      <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Offer title</span>
                      <input className="shore-input mt-1 text-lg font-semibold" value={perk.offerTitle} onChange={(event) => updatePerk(perk.id, 'offerTitle', event.target.value)} />
                    </label>
                  </div>
                  <label className="min-w-[110px]">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Status</span>
                    <select className="shore-input mt-1" value={perk.status} onChange={(event) => updatePerk(perk.id, 'status', event.target.value as Perk['status'])}>
                      <option>Active</option>
                      <option>Scheduled</option>
                      <option>Draft</option>
                    </select>
                  </label>
                </div>
                <label className="mt-3 block">
                  <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Resident-facing copy</span>
                  <textarea className="shore-input mt-1 min-h-20" value={perk.description} onChange={(event) => updatePerk(perk.id, 'description', event.target.value)} />
                </label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Eligibility</span>
                    <input className="shore-input mt-1" value={perk.eligibility} onChange={(event) => updatePerk(perk.id, 'eligibility', event.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Location</span>
                    <input className="shore-input mt-1" value={perk.location} onChange={(event) => updatePerk(perk.id, 'location', event.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Start date</span>
                    <input className="shore-input mt-1" type="date" value={perk.startDate} onChange={(event) => updatePerk(perk.id, 'startDate', event.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">End date</span>
                    <input className="shore-input mt-1" type="date" value={perk.endDate} onChange={(event) => updatePerk(perk.id, 'endDate', event.target.value)} />
                  </label>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <MiniStat label="Saved" value={String(perk.saves)} note="People kept it" />
                  <MiniStat label="Used" value={String(perk.redemptions)} note="People showed up" />
                  <MiniStat label="Scans" value={String(perk.qrScans)} note="How they found it" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="shore-button shore-button-primary" onClick={() => savePerkSetup(perk)}>
                    <Check className="h-4 w-4" /> Save perk
                  </button>
                  <button type="button" className="shore-button" onClick={() => savePerkSetup(perk, 'Active')}>
                    <Sparkles className="h-4 w-4" /> Publish
                  </button>
                  <button type="button" className="shore-button" onClick={() => toggleFavorite(`fav-${perk.id.replace('perk-', '')}`)}>
                    <Heart className="h-4 w-4" /> Save
                  </button>
                  <a href={createGoogleCalendarUrl(perk, props.profile.propertyName)} target="_blank" rel="noreferrer" className="shore-button">
                    <CalendarPlus className="h-4 w-4" /> Add to Google Calendar
                  </a>
                  <button type="button" className="shore-button" onClick={() => downloadTextFile(`${perk.id}-setup.json`, JSON.stringify(perk, null, 2))}>
                    <Download className="h-4 w-4" /> Export
                  </button>
                </div>
                {perkNotice[perk.id] && <p className="mt-2 text-xs font-semibold text-[rgba(11,31,51,0.58)]">{perkNotice[perk.id]}</p>}
              </div>
            ))}
          </div>
        </Section>

        <Section id="events" eyebrow="Events" title="Plans residents can say yes to" description="Create the invite, link the sign or broadcast, publish it, and keep the RSVP list close at hand.">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button type="button" className="shore-button shore-button-primary" onClick={addEvent}>
              <CalendarPlus className="h-4 w-4" /> Add event
            </button>
            <button type="button" className="shore-button" onClick={() => downloadTextFile(`${workspaceSlug}-events.json`, JSON.stringify(events, null, 2))}>
              <Download className="h-4 w-4" /> Export events
            </button>
          </div>
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
            {events.map((event) => (
              <div key={event.id} className="shore-card">
                <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase text-[#C8A96A]">Event name</span>
                    <input className="shore-input mt-1 text-lg font-semibold" value={event.title} onChange={(inputEvent) => updateEvent(event.id, 'title', inputEvent.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Status</span>
                    <select className="shore-input mt-1" value={event.status} onChange={(inputEvent) => updateEvent(event.id, 'status', inputEvent.target.value as Event['status'])}>
                      <option>Published</option>
                      <option>Scheduled</option>
                      <option>Draft</option>
                    </select>
                  </label>
                </div>
                <label className="mt-3 block">
                  <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Invite copy</span>
                  <textarea className="shore-input mt-1 min-h-20" value={event.description} onChange={(inputEvent) => updateEvent(event.id, 'description', inputEvent.target.value)} />
                </label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Date and time</span>
                    <input className="shore-input mt-1" type="datetime-local" value={localDateTimeValue(event.dateTime)} onChange={(inputEvent) => updateEvent(event.id, 'dateTime', inputEvent.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Place</span>
                    <input className="shore-input mt-1" value={event.location} onChange={(inputEvent) => updateEvent(event.id, 'location', inputEvent.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">RSVPs</span>
                    <input className="shore-input mt-1" type="number" value={event.rsvpCount} onChange={(inputEvent) => updateEvent(event.id, 'rsvpCount', Number(inputEvent.target.value))} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Capacity</span>
                    <input className="shore-input mt-1" type="number" value={event.capacity} onChange={(inputEvent) => updateEvent(event.id, 'capacity', Number(inputEvent.target.value))} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Linked code</span>
                    <input className="shore-input mt-1" value={event.linkedQR} onChange={(inputEvent) => updateEvent(event.id, 'linkedQR', inputEvent.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Linked broadcast</span>
                    <input className="shore-input mt-1" value={event.linkedCampaign} onChange={(inputEvent) => updateEvent(event.id, 'linkedCampaign', inputEvent.target.value)} />
                  </label>
                </div>
                <div className="shore-progress-track mt-4"><div className="h-full bg-[#C8A96A]" style={{ width: `${Math.min(100, Math.round((event.rsvpCount / event.capacity) * 100))}%` }} /></div>
                <div className="mt-2 text-xs font-semibold">{event.rsvpCount}/{event.capacity} people said yes · {event.linkedQR}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="shore-button shore-button-primary" onClick={() => saveEventSetup(event)}>
                    <Check className="h-4 w-4" /> Save event
                  </button>
                  <button type="button" className="shore-button" onClick={() => saveEventSetup(event, 'Published')}>
                    <Sparkles className="h-4 w-4" /> Publish
                  </button>
                  <button type="button" className="shore-button" onClick={() => downloadTextFile(`${event.id}-attendees.csv`, `event,rsvps,capacity\n"${event.title}",${event.rsvpCount},${event.capacity}\n`)}>
                    <Download className="h-4 w-4" /> Export list
                  </button>
                  <a href={createGoogleCalendarUrl(event, props.profile.propertyName)} target="_blank" rel="noreferrer" className="shore-button">
                    <CalendarPlus className="h-4 w-4" /> Add to Google Calendar
                  </a>
                  <button type="button" className="shore-button" onClick={() => removeEvent(event)}>
                    <X className="h-4 w-4" /> Remove
                  </button>
                </div>
                {eventNotice[event.id] && <p className="mt-2 text-xs font-semibold text-[rgba(11,31,51,0.58)]">{eventNotice[event.id]}</p>}
              </div>
            ))}
          </div>
        </Section>

        <Section id="campaigns" eyebrow="Broadcasts" title={`What ${workspaceName} sends out`} description="Write the note, choose who should get it, link the right perk or event, and see what people did next.">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button type="button" className="shore-button shore-button-primary" onClick={addCampaign}>
              <Send className="h-4 w-4" /> Add broadcast
            </button>
            <button type="button" className="shore-button" onClick={() => downloadTextFile(`${workspaceSlug}-broadcasts.json`, JSON.stringify(campaigns, null, 2))}>
              <Download className="h-4 w-4" /> Export broadcasts
            </button>
          </div>
          <div className="grid gap-x-8 gap-y-6 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="shore-card">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase text-[#C8A96A]">Broadcast</span>
                  <input className="shore-input mt-1 text-sm font-semibold" value={campaign.name} onChange={(inputEvent) => updateCampaign(campaign.id, 'name', inputEvent.target.value)} />
                </label>
                <div className="mt-3 grid gap-3">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Status</span>
                    <select className="shore-input mt-1" value={campaign.sendStatus} onChange={(inputEvent) => updateCampaign(campaign.id, 'sendStatus', inputEvent.target.value as Campaign['sendStatus'])}>
                      <option>Live</option>
                      <option>Scheduled</option>
                      <option>Sent</option>
                      <option>Draft</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Audience</span>
                    <input className="shore-input mt-1" value={campaign.audience} onChange={(inputEvent) => updateCampaign(campaign.id, 'audience', inputEvent.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Channel</span>
                    <input className="shore-input mt-1" value={campaign.channel} onChange={(inputEvent) => updateCampaign(campaign.id, 'channel', inputEvent.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Linked perks and events</span>
                    <input className="shore-input mt-1" value={campaign.linkedItems.join(', ')} onChange={(inputEvent) => updateCampaign(campaign.id, 'linkedItems', inputEvent.target.value.split(',').map((item) => item.trim()).filter(Boolean))} />
                  </label>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <label><span className="block text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Opened</span><input className="shore-input mt-1" type="number" value={campaign.opensViews} onChange={(inputEvent) => updateCampaign(campaign.id, 'opensViews', Number(inputEvent.target.value))} /></label>
                  <label><span className="block text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Saved</span><input className="shore-input mt-1" type="number" value={campaign.saves} onChange={(inputEvent) => updateCampaign(campaign.id, 'saves', Number(inputEvent.target.value))} /></label>
                  <label><span className="block text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Used</span><input className="shore-input mt-1" type="number" value={campaign.redemptions} onChange={(inputEvent) => updateCampaign(campaign.id, 'redemptions', Number(inputEvent.target.value))} /></label>
                  <label><span className="block text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Scanned</span><input className="shore-input mt-1" type="number" value={campaign.qrScans} onChange={(inputEvent) => updateCampaign(campaign.id, 'qrScans', Number(inputEvent.target.value))} /></label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="shore-button shore-button-primary" onClick={() => saveCampaignSetup(campaign)}>
                    <Check className="h-4 w-4" /> Save
                  </button>
                  <button type="button" className="shore-button" onClick={() => saveCampaignSetup(campaign, 'Live')}>
                    <Send className="h-4 w-4" /> Send
                  </button>
                  <a href="#reports" className="shore-button"><Eye className="h-4 w-4" /> Report</a>
                  <button type="button" className="shore-button" onClick={() => removeCampaign(campaign)}>
                    <X className="h-4 w-4" /> Remove
                  </button>
                </div>
                {campaignNotice[campaign.id] && <p className="mt-2 text-xs font-semibold text-[rgba(11,31,51,0.58)]">{campaignNotice[campaign.id]}</p>}
              </div>
            ))}
          </div>
        </Section>

        <Section id="residents" eyebrow="Residents" title="People, not a spreadsheet" description="Add residents one at a time or paste a short contact list. Keep the useful signals visible and the private details tidy.">
          <div className="shore-card mb-5 grid gap-4 lg:grid-cols-[1fr_0.42fr]">
            <label className="block">
              <span className="text-[11px] font-bold uppercase text-[#C8A96A]">Import contacts</span>
              <textarea className="shore-input mt-2 min-h-24" placeholder="Name, unit, email, Coffee|Yoga" value={residentImport} onChange={(event) => setResidentImport(event.target.value)} />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <button type="button" className="shore-button shore-button-primary" onClick={addResident}>
                <Users className="h-4 w-4" /> Add resident
              </button>
              <button type="button" className="shore-button" onClick={importResidentsFromText}>
                <Download className="h-4 w-4" /> Import
              </button>
              <button type="button" className="shore-button" onClick={() => downloadTextFile(`${workspaceSlug}-residents.csv`, residents.map((resident) => `"${resident.name}","${resident.unit}","${resident.email}","${resident.engagementStatus}"`).join('\n'))}>
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          </div>
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {residents.map((resident) => (
              <div key={resident.id} className="shore-card">
                <div className="flex items-center justify-between gap-2">
                  <Users className="h-4 w-4 text-[#C8A96A]" />
                  <select className="shore-input max-w-[155px]" value={resident.engagementStatus} onChange={(inputEvent) => updateResident(resident.id, 'engagementStatus', inputEvent.target.value as Resident['engagementStatus'])}>
                    <option>New resident</option>
                    <option>Active resident</option>
                    <option>Low engagement</option>
                    <option>Event attendee</option>
                    <option>Perk saver</option>
                  </select>
                </div>
                <label className="mt-3 block">
                  <span className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Name</span>
                  <input className="shore-input mt-1 text-sm font-semibold" value={resident.name} onChange={(inputEvent) => updateResident(resident.id, 'name', inputEvent.target.value)} />
                </label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label><span className="block text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Home</span><input className="shore-input mt-1" value={resident.unit} onChange={(inputEvent) => updateResident(resident.id, 'unit', inputEvent.target.value)} /></label>
                  <label><span className="block text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Move-in</span><input className="shore-input mt-1" type="date" value={resident.moveInDate} onChange={(inputEvent) => updateResident(resident.id, 'moveInDate', inputEvent.target.value)} /></label>
                  <label className="sm:col-span-2"><span className="block text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Email</span><input className="shore-input mt-1" type="email" value={resident.email} onChange={(inputEvent) => updateResident(resident.id, 'email', inputEvent.target.value)} /></label>
                  <label className="sm:col-span-2"><span className="block text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Interests</span><input className="shore-input mt-1" value={resident.interests.join(', ')} onChange={(inputEvent) => updateResident(resident.id, 'interests', inputEvent.target.value.split(',').map((item) => item.trim()).filter(Boolean))} /></label>
                  <label><span className="block text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Saved perks</span><input className="shore-input mt-1" type="number" value={resident.savedPerks} onChange={(inputEvent) => updateResident(resident.id, 'savedPerks', Number(inputEvent.target.value))} /></label>
                  <label><span className="block text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">RSVPs</span><input className="shore-input mt-1" type="number" value={resident.rsvps} onChange={(inputEvent) => updateResident(resident.id, 'rsvps', Number(inputEvent.target.value))} /></label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="shore-button shore-button-primary" onClick={() => saveResident(resident)}>
                    <Check className="h-4 w-4" /> Save
                  </button>
                  <button type="button" className="shore-button" onClick={() => removeResident(resident)}>
                    <X className="h-4 w-4" /> Remove
                  </button>
                </div>
                {residentNotice[resident.id] && <p className="mt-2 text-xs font-semibold text-[rgba(11,31,51,0.58)]">{residentNotice[resident.id]}</p>}
              </div>
            ))}
          </div>
        </Section>

        <Section id="reports" eyebrow="Reports" title="What residents found, saved, joined, and used" description="A quick read from the current workspace: codes, perks, events, broadcasts, residents, and anonymous map activity around downtown Austin.">
          <div className="shore-card">
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {reportSnapshot.metrics.map((metric) => (
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
              <p className="mt-1 text-sm leading-6 text-[rgba(11,31,51,0.66)]">{reportSnapshot.recommendation}</p>
              <p className="mt-2 text-xs leading-5 text-[rgba(11,31,51,0.58)]">Built from the live workspace data on this page, plus anonymous map activity for nearby downtown places.</p>
            </div>
          </div>
        </Section>

        <Section id="billing" eyebrow="Plan" title="Keep the building connected" description="See the current plan, add help when it is useful, and keep billing simple.">
          <div className="shore-card grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-[#C8A96A]"><CreditCard className="h-4 w-4" /> {props.billing.conversionState}</div>
              <h3 className="mt-2 text-2xl font-semibold">{props.billing.name}</h3>
              <div className="mt-2 text-2xl font-semibold">{money(props.billing.price)}<span className="text-sm font-normal text-[rgba(11,31,51,0.56)]">/{props.billing.cadence}</span></div>
              <div className="mt-4 flex gap-2">
                <input className="shore-input" placeholder="Partner credit" value={coupon} onChange={(event) => setCoupon(event.target.value)} />
                <button type="button" className="shore-button" onClick={() => setCouponResult(applyCoupon(coupon, props.billing.price, props.billing.couponCodes))}>Apply credit</button>
              </div>
              {couponResult && (
                <p className="mt-2 text-sm font-semibold text-[#0B1F33]">
                  {couponResult.accepted ? `${coupon.toUpperCase()} applied: ${couponResult.discount}% off. Total due ${money(couponResult.totalDue)}.` : 'Coupon not recognized.'}
                </p>
              )}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-[#C8A96A]">Add when useful</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {props.billing.addOns.map((addOn) => (
                  <button type="button" key={addOn} className="shore-plan-option" onClick={() => setBillingNotice(`${addOn} added to the next invoice draft.`)}>
                    <span>{addOn}</span>
                    <small>One-time or monthly support</small>
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button type="button" className="shore-plan-option" onClick={() => setBillingNotice('Resident Plus upgrade selected. The next invoice draft will include the higher plan.')}>
                  <span>Upgrade to Resident Plus</span>
                  <small>More broadcasts, deeper reporting, and event support</small>
                </button>
                <button type="button" className="shore-plan-option" onClick={() => setBillingNotice('Concierge setup added as a one-time service.')}>
                  <span>Concierge setup</span>
                  <small>One-time setup for signs, resident imports, and first campaign</small>
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className="shore-button shore-button-primary" onClick={() => {
                  setBillingNotice(`${workspaceName} is ready for the yearly plan.`);
                }}>
                  <Sparkles className="h-4 w-4" /> Activate yearly plan
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
