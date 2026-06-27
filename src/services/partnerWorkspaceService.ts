import type { Event, PartnerLead, PartnerWorkspaceData, Perk } from '@/types/partnerWorkspace';

function storageKey(base: string, workspaceId = 'the-shore') {
  return `${base}_${workspaceId}`;
}

export function submitPartnerLead(lead: PartnerLead, workspaceId?: string): PartnerLead {
  const nextLead: PartnerLead = {
    ...lead,
    id: lead.id || `lead-${Date.now()}`,
    status: 'Submitted',
    createdAt: lead.createdAt || new Date().toISOString(),
  };
  window.localStorage.setItem(storageKey('dp_partner_lead_v2', workspaceId), JSON.stringify(nextLead));
  return nextLead;
}

export function loadPartnerLead(fallback: PartnerLead, workspaceId?: string): PartnerLead {
  try {
    const saved = window.localStorage.getItem(storageKey('dp_partner_lead_v2', workspaceId));
    const parsed = saved ? JSON.parse(saved) : fallback;
    if (String(parsed.contactName || '').toLowerCase().includes('maya thompson')) parsed.contactName = '';
    if (String(parsed.email || '').toLowerCase().includes('maya.thompson')) parsed.email = '';
    if (String(parsed.phone || '') === '(512) 555-0148') parsed.phone = '';
    return parsed;
  } catch {
    return fallback;
  }
}

export function saveFavoriteState(favorites: PartnerWorkspaceData['favorites'], workspaceId?: string) {
  window.localStorage.setItem(storageKey('dp_partner_favorites', workspaceId), JSON.stringify(favorites));
}

export function loadFavoriteState(fallback: PartnerWorkspaceData['favorites'], workspaceId?: string) {
  try {
    const saved = window.localStorage.getItem(storageKey('dp_partner_favorites', workspaceId));
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function calculateSetupProgress(data: PartnerWorkspaceData, lead: PartnerLead) {
  const checks = [
    lead.status === 'Submitted' || lead.status === 'Workspace created' || lead.status === 'Converted to paid',
    Boolean(data.profile.propertyName && data.profile.description),
    data.qrs.some((qr) => qr.status === 'Active'),
    data.perks.some((perk) => perk.status === 'Active'),
    data.events.some((event) => event.status === 'Published'),
    data.campaigns.some((campaign) => campaign.sendStatus === 'Live' || campaign.sendStatus === 'Sent'),
    data.residents.length > 0,
    data.reports.length > 0,
    data.billing.conversionState === 'Founding Partner' || data.billing.conversionState === 'Active' || lead.status === 'Converted to paid',
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

function calendarDate(value: string, minutes = 90) {
  const start = new Date(value);
  const end = new Date(start.getTime() + minutes * 60 * 1000);
  const format = (date: Date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '');
  return `${format(start)}/${format(end)}`;
}

export function createGoogleCalendarUrl(item: Event | Perk, propertyName = 'The Shore') {
  const isEvent = 'title' in item;
  const title = isEvent ? item.title : item.offerTitle;
  const dateValue = isEvent ? item.dateTime : item.calendarDate || `${item.startDate}T15:00:00`;
  const details = isEvent
    ? `${item.description} Synced from Downtown Perks for ${propertyName}.`
    : `${item.description} Eligibility: ${item.eligibility}. Synced from Downtown Perks for ${propertyName}.`;
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', `${propertyName}: ${title}`);
  url.searchParams.set('dates', calendarDate(dateValue));
  url.searchParams.set('details', details);
  url.searchParams.set('location', item.location);
  return url.toString();
}

export function applyCoupon(code: string, total: number, couponCodes: Record<string, number>) {
  const discount = couponCodes[code.toUpperCase()] || 0;
  return {
    discount,
    totalDue: Math.max(0, Math.round(total * (1 - discount / 100))),
    accepted: discount > 0,
  };
}
