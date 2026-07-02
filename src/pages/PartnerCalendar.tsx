import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Copy, ExternalLink, RefreshCw } from 'lucide-react';

type BookingLink = {
  id: string;
  title: string;
  description?: string;
  bookingUrl?: string;
  booking_url?: string;
  durationMinutes?: number;
  duration_minutes?: number;
  timezone: string;
  availabilityLabel?: string;
  availability_label?: string;
  audience: string;
  status: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  eventType?: string;
  event_type?: string;
  status: string;
};

type CalendarStatus = {
  status: string;
  configured: boolean;
  primary_calendar_id: string;
  timezone: string;
  connected_account?: string;
  missing_env?: string[];
};

function audienceLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatWhen(value?: string) {
  if (!value) return 'Needs scheduling';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

export default function PartnerCalendar() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [copiedId, setCopiedId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadCalendar() {
    setLoading(true);
    setError('');
    try {
      const [statusResponse, linksResponse, eventsResponse] = await Promise.all([
        fetch('/api/calendar/status'),
        fetch('/api/calendar/booking-links'),
        fetch('/api/calendar/events'),
      ]);
      if (!statusResponse.ok || !linksResponse.ok || !eventsResponse.ok) throw new Error('Calendar data could not be loaded.');
      setStatus(await statusResponse.json());
      setBookingLinks(await linksResponse.json());
      setEvents(await eventsResponse.json());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Calendar data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCalendar();
  }, []);

  const groupedEvents = useMemo(() => {
    const upcoming = events.filter((event) => event.status !== 'cancelled');
    return {
      meetings: upcoming.filter((event) => (event.eventType || event.event_type) === 'partner_meeting'),
      campaigns: upcoming.filter((event) => (event.eventType || event.event_type) === 'campaign'),
      perks: upcoming.filter((event) => (event.eventType || event.event_type) === 'perk'),
      events: upcoming.filter((event) => (event.eventType || event.event_type) === 'event'),
    };
  }, [events]);

  async function copyLink(link: BookingLink) {
    const url = link.bookingUrl || link.booking_url || '';
    if (!url) return;
    await navigator.clipboard?.writeText(url);
    setCopiedId(link.id);
    window.setTimeout(() => setCopiedId(''), 1800);
  }

  return (
    <main className="min-h-screen bg-white text-[#0B1F33]">
      <div className="w-full px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
        <header className="mb-5 border-b border-[rgba(11,31,51,0.08)] pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#C8A96A]">Partner operating system</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[30px] font-semibold leading-none tracking-normal sm:text-4xl">Partner Calendar</h1>
              <p className="mt-3 max-w-3xl text-[13px] leading-5 text-[rgba(11,31,51,0.66)]">
                Manage booking links, partner meetings, campaign dates, perk windows, and event planning from one workspace.
              </p>
            </div>
            <button onClick={loadCalendar} className="inline-flex min-h-9 items-center gap-2 border border-[rgba(11,31,51,0.12)] px-3 text-[12px] font-semibold">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync
            </button>
          </div>
        </header>

        {error ? <p className="mb-4 border border-red-200 p-3 text-[12px] font-semibold text-red-700">{error}</p> : null}

        <section className="mb-5 grid gap-3 border-y border-[rgba(11,31,51,0.08)] py-3 md:grid-cols-4">
          {[
            ['Connection', status?.status || 'Loading'],
            ['Calendar', status?.primary_calendar_id || 'partners@downtownperks.app'],
            ['Timezone', status?.timezone || 'America/Chicago'],
            ['Booking links', bookingLinks.length],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{label}</p>
              <p className="mt-1 truncate text-[13px] font-semibold">{String(value)}</p>
            </div>
          ))}
        </section>

        {status && !status.configured ? (
          <section className="mb-5 border border-[rgba(11,31,51,0.08)] p-4">
            <h2 className="text-[15px] font-semibold">Google Calendar setup needed</h2>
            <p className="mt-2 text-[12px] leading-5 text-[rgba(11,31,51,0.66)]">
              Add the missing Vercel environment variables before OAuth connection can start: {(status.missing_env || []).join(', ') || 'None'}.
            </p>
          </section>
        ) : null}

        <section className="mb-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#C8A96A]" />
            <h2 className="text-[15px] font-semibold">Booking links</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {bookingLinks.map((link) => {
              const url = link.bookingUrl || link.booking_url || '';
              return (
                <article key={link.id} className="border border-[rgba(11,31,51,0.08)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{audienceLabel(link.audience)}</p>
                      <h3 className="mt-1 text-[15px] font-semibold">{link.title}</h3>
                    </div>
                    <span className="border border-[rgba(11,31,51,0.1)] px-2 py-1 text-[10px] font-semibold capitalize">{link.status}</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-[rgba(11,31,51,0.66)]">{link.description || 'Partner booking link'}</p>
                  <dl className="mt-3 grid gap-1 text-[11px] text-[rgba(11,31,51,0.7)]">
                    <div className="flex justify-between gap-3"><dt>Availability</dt><dd className="font-semibold">{link.availabilityLabel || link.availability_label || 'Needs verification'}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Duration</dt><dd className="font-semibold">{link.durationMinutes || link.duration_minutes || 30} minutes</dd></div>
                    <div className="flex justify-between gap-3"><dt>Timezone</dt><dd className="font-semibold">{link.timezone}</dd></div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button disabled={!url} onClick={() => copyLink(link)} className="inline-flex min-h-8 items-center gap-2 border border-[#C8A96A] px-3 text-[11px] font-semibold disabled:opacity-50">
                      <Copy className="h-3.5 w-3.5" /> {copiedId === link.id ? 'Copied' : 'Copy link'}
                    </button>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-2 border border-[rgba(11,31,51,0.12)] px-3 text-[11px] font-semibold">
                        <ExternalLink className="h-3.5 w-3.5" /> View schedule
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {[
            ['Upcoming meetings', groupedEvents.meetings],
            ['Campaign calendar', groupedEvents.campaigns],
            ['Perk activation windows', groupedEvents.perks],
            ['Event calendar', groupedEvents.events],
          ].map(([title, list]) => (
            <article key={title as string} className="border-t border-[rgba(11,31,51,0.08)] pt-3">
              <h2 className="text-[15px] font-semibold">{title as string}</h2>
              {(list as CalendarEvent[]).length ? (
                <div className="mt-3 grid gap-2">
                  {(list as CalendarEvent[]).map((event) => (
                    <div key={event.id} className="flex justify-between gap-3 border border-[rgba(11,31,51,0.08)] p-3 text-[12px]">
                      <span className="font-semibold">{event.title}</span>
                      <span className="text-[rgba(11,31,51,0.62)]">{formatWhen(event.startTime || event.start_time)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[12px] text-[rgba(11,31,51,0.58)]">No scheduled records yet.</p>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
