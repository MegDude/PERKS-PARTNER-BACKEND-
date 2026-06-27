import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Calendar, Check, Download, Eye, Loader2, Megaphone, Plus, Send, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

type EventRecord = {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  status?: string;
  date?: string;
  dateTime?: string;
  location?: string;
  capacity?: number;
  registered_count?: number;
  checked_in_count?: number;
  partner_id?: string;
  campaign_id?: string;
  follow_up_status?: string;
  published_at?: string;
};

const eventStatuses = ['draft', 'scheduled', 'active', 'completed', 'archived'];

function eventTitle(event: EventRecord) {
  return event.title || event.name || 'Untitled event';
}

function eventDate(event: EventRecord) {
  return event.dateTime || event.date || '';
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 250);
}

async function writeAnalytics(event: string, record: EventRecord, metadata: Record<string, any> = {}) {
  await base44.entities.AnalyticsEvent.create({
    event,
    entity_type: 'event',
    entity_id: record.id,
    metadata,
    created_at: new Date().toISOString(),
  }).catch(() => null);
}

export default function Events() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [shareNotice, setShareNotice] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: 'community',
    date: '',
    location: '',
    capacity: 40,
    description: '',
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin-events-workspace'],
    queryFn: () => base44.entities.Event.list().catch(() => []),
  });

  const { data: rsvps = [] } = useQuery({
    queryKey: ['admin-event-rsvps'],
    queryFn: () => base44.entities.EventRSVP.list().catch(() => []),
  });

  const sortedEvents = useMemo(() => [...events].sort((a: EventRecord, b: EventRecord) => {
    const aTime = new Date(eventDate(a) || a.published_at || 0).getTime();
    const bTime = new Date(eventDate(b) || b.published_at || 0).getTime();
    return bTime - aTime;
  }), [events]);

  const filteredEvents = selectedStatus === 'all'
    ? sortedEvents
    : sortedEvents.filter((event: EventRecord) => String(event.status || 'draft').toLowerCase() === selectedStatus);

  const selectedEvent = filteredEvents.find((event: EventRecord) => event.id === selectedEventId) || filteredEvents[0];
  const eventRsvps = selectedEvent ? rsvps.filter((rsvp: any) => rsvp.event_id === selectedEvent.id) : [];
  const checkedIn = eventRsvps.filter((rsvp: any) => rsvp.status === 'checked_in').length;
  const activeEvents = events.filter((event: EventRecord) => ['active', 'scheduled'].includes(String(event.status || '').toLowerCase())).length;
  const totalCapacity = events.reduce((sum: number, event: EventRecord) => sum + Number(event.capacity || 0), 0);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-events-workspace'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-event-rsvps'] }),
    ]);
  }

  async function createEvent(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('Add an event title first.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          name: form.title.trim(),
          category: form.category,
          date: form.date,
          dateTime: form.date,
          location: form.location,
          capacity: Number(form.capacity || 0),
          description: form.description,
          status: 'draft',
          source: 'admin_events_module',
        }),
      });
      if (!response.ok) throw new Error('Create event failed');
      const created = await response.json();
      setSelectedEventId(created.id);
      setForm({ title: '', category: 'community', date: '', location: '', capacity: 40, description: '' });
      toast.success('Event created as a draft.');
      await refresh();
    } catch {
      toast.error('Could not create this event.');
    } finally {
      setSaving(false);
    }
  }

  async function updateEvent(record: EventRecord, patch: Partial<EventRecord>) {
    setSaving(true);
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(record.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error('Update event failed');
      const updated = await response.json();
      setSelectedEventId(updated.id);
      await writeAnalytics('event_updated_from_admin', updated, patch);
      await refresh();
      return updated;
    } catch {
      toast.error('Could not save this event.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function publishEvent(record: EventRecord) {
    const updated = await updateEvent(record, { status: 'active', published_at: new Date().toISOString() });
    if (!updated) return;
    await base44.entities.AutomationRun.create({
      name: 'Event publish',
      status: 'completed',
      trigger: 'event_published',
      action: 'surface_event_to_residents',
      event_id: record.id,
      logs: [{ at: new Date().toISOString(), message: `${eventTitle(record)} is live.` }],
    }).catch(() => null);
    toast.success('Event is live.');
  }

  async function shareEvent(record: EventRecord) {
    setSaving(true);
    try {
      const broadcast = await base44.entities.Campaign.create({
        name: `${eventTitle(record)} resident share`,
        title: `${eventTitle(record)} resident share`,
        type: 'event_share',
        event_id: record.id,
        channel: 'workspace + resident guide',
        audience: 'Residents and nearby partners',
        status: 'active',
        send_status: 'live',
        linked_items: [record.id],
        sent_at: new Date().toISOString(),
      });
      await base44.entities.ManagementNotification.create({
        title: `Event shared: ${eventTitle(record)}`,
        message: `${eventTitle(record)} is ready for residents and partner follow-up.`,
        type: 'event_share',
        event_id: record.id,
        campaign_id: broadcast.id,
        status: 'sent',
      }).catch(() => null);
      await writeAnalytics('event_shared', record, { campaign_id: broadcast.id });
      setShareNotice(`${eventTitle(record)} was shared and added to broadcast activity.`);
      toast.success('Event shared.');
      await refresh();
    } catch {
      toast.error('Could not share this event.');
    } finally {
      setSaving(false);
    }
  }

  async function addRsvp(record: EventRecord) {
    const email = window.prompt('Resident email for RSVP');
    if (!email) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(record.id)}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resident_email: email }),
      });
      if (!response.ok) throw new Error('RSVP failed');
      toast.success('RSVP recorded.');
      await refresh();
    } catch {
      toast.error('Could not record RSVP. Check capacity and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function queueFollowUp(record: EventRecord) {
    setSaving(true);
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(record.id)}/follow-up`, { method: 'POST' });
      if (!response.ok) throw new Error('Follow-up failed');
      await updateEvent(record, { follow_up_status: 'queued' });
      toast.success('Follow-up queued.');
    } catch {
      toast.error('Could not queue follow-up.');
    } finally {
      setSaving(false);
    }
  }

  async function saveReport(record: EventRecord) {
    const report = {
      id: `event-report-${record.id}`,
      title: `${eventTitle(record)} report`,
      report_type: 'event',
      event_id: record.id,
      status: 'ready',
      summary: `${eventTitle(record)} has ${eventRsvps.length} RSVP${eventRsvps.length === 1 ? '' : 's'} and ${checkedIn} check-in${checkedIn === 1 ? '' : 's'}.`,
      metrics: {
        rsvps: eventRsvps.length,
        checked_in: checkedIn,
        capacity: Number(record.capacity || 0),
        fill_rate: Number(record.capacity || 0) ? Math.round((eventRsvps.length / Number(record.capacity)) * 100) : 0,
      },
      recommended_action: eventRsvps.length ? 'Share the recap and queue a follow-up note.' : 'Share the event with residents and add one clear RSVP path.',
      updated_at: new Date().toISOString(),
    };
    await base44.entities.PartnerReport.create(report).catch(() => base44.entities.PartnerReport.update(report.id, report));
    await writeAnalytics('event_report_generated', record, report.metrics);
    toast.success('Event report saved.');
  }

  function exportEvent(record: EventRecord) {
    const text = [
      `Downtown Perks event`,
      `Title: ${eventTitle(record)}`,
      `Status: ${record.status || 'draft'}`,
      `Date: ${eventDate(record) || 'Not set'}`,
      `Location: ${record.location || 'Not set'}`,
      `Capacity: ${record.capacity || 0}`,
      `RSVPs: ${eventRsvps.length}`,
      `Checked in: ${checkedIn}`,
      '',
      record.description || '',
    ].join('\n');
    downloadTextFile(`${eventTitle(record).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'event'}-summary.txt`, text);
    writeAnalytics('event_exported', record, { rsvps: eventRsvps.length });
  }

  return (
    <div className="min-h-screen bg-white p-5 text-[#0B1F33] sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#C8A96A]">Events</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight sm:text-[34px]">Plan, publish, share, and report events.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[rgba(11,31,51,0.64)]">
              Create resident and partner events, take them live, track RSVPs, queue follow-up, and save reports from one workspace.
            </p>
          </div>
          <div className="dp-summary-matrix">
            <div className="dp-summary-matrix__grid">
              <Metric label="Events" value={events.length} detail="Total event records" />
              <Metric label="Live soon" value={activeEvents} detail="Active or scheduled" />
              <Metric label="RSVPs" value={rsvps.length} detail="People who said yes" />
              <Metric label="Capacity" value={totalCapacity} detail="Seats or spots on file" />
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#C8A96A]" />
          </div>
        ) : (
          <main className="grid gap-7">
            <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
              <form onSubmit={createEvent} className="bg-white">
                <p className="text-[11px] font-bold uppercase text-[#C8A96A]">Create event</p>
                <h2 className="mt-2 text-xl font-semibold">Start with the basics.</h2>
                <div className="mt-5 grid gap-4">
                  <Field label="Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Category" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} />
                    <Field label="Date and time" type="datetime-local" value={form.date} onChange={(value) => setForm((current) => ({ ...current, date: value }))} />
                    <Field label="Location" value={form.location} onChange={(value) => setForm((current) => ({ ...current, location: value }))} />
                    <Field label="Capacity" type="number" value={form.capacity} onChange={(value) => setForm((current) => ({ ...current, capacity: Number(value) }))} />
                  </div>
                  <label className="grid gap-2 text-[11px] font-bold uppercase text-[rgba(11,31,51,0.58)]">
                    Description
                    <textarea className="dp-admin-input min-h-24" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
                  </label>
                  <button type="submit" disabled={saving} className="inline-flex min-h-9 w-fit items-center gap-2 text-[11px] font-semibold text-[#0B1F33] hover:text-[#C8A96A]">
                    <Plus className="h-4 w-4" /> Create draft
                  </button>
                </div>
              </form>

              <section>
                <div className="flex flex-wrap items-center gap-2">
                  {['all', ...eventStatuses].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedStatus(status)}
                      className={`min-h-8 text-[10px] font-semibold uppercase ${selectedStatus === status ? 'text-[#C8A96A]' : 'text-[rgba(11,31,51,0.62)] hover:text-[#0B1F33]'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className="mt-4 overflow-x-auto [scrollbar-width:thin]">
                  <table className="w-full min-w-[760px] table-fixed text-left">
                    <thead>
                      <tr>
                        <th className="w-[26%]">Event</th>
                        <th className="w-[15%]">Status</th>
                        <th className="w-[18%]">When</th>
                        <th className="w-[16%]">RSVP</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(11,31,51,0.045)]">
                      {filteredEvents.map((record: EventRecord) => {
                        const count = rsvps.filter((rsvp: any) => rsvp.event_id === record.id).length;
                        return (
                          <tr key={record.id} className="align-top">
                            <td>
                              <button type="button" onClick={() => setSelectedEventId(record.id)} className="text-left text-[12px] font-semibold leading-4 text-[#0B1F33] hover:text-[#C8A96A]">
                                {eventTitle(record)}
                              </button>
                              <p className="mt-1 text-[10px] uppercase text-[rgba(11,31,51,0.48)]">{record.category || 'community'}</p>
                            </td>
                            <td className="capitalize">{record.status || 'draft'}</td>
                            <td>{eventDate(record) ? new Date(eventDate(record)).toLocaleString() : 'Not set'}</td>
                            <td>{count} / {Number(record.capacity || 0) || 'open'}</td>
                            <td>
                              <button type="button" onClick={() => setSelectedEventId(record.id)} className="inline-flex min-h-7 items-center gap-1 text-[10px] font-semibold text-[#0B1F33] hover:text-[#C8A96A]">
                                Manage <ArrowRight className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>

            {selectedEvent ? (
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <article className="bg-white">
                  <p className="text-[11px] font-bold uppercase text-[#C8A96A]">Manage event</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Field label="Title" value={eventTitle(selectedEvent)} onChange={(value) => updateEvent(selectedEvent, { title: value, name: value })} />
                    <Field label="Status" value={selectedEvent.status || 'draft'} onChange={(value) => updateEvent(selectedEvent, { status: value })} />
                    <Field label="Date and time" type="datetime-local" value={String(eventDate(selectedEvent)).slice(0, 16)} onChange={(value) => updateEvent(selectedEvent, { date: value, dateTime: value })} />
                    <Field label="Location" value={selectedEvent.location || ''} onChange={(value) => updateEvent(selectedEvent, { location: value })} />
                    <Field label="Capacity" type="number" value={selectedEvent.capacity || 0} onChange={(value) => updateEvent(selectedEvent, { capacity: Number(value) })} />
                    <Field label="Category" value={selectedEvent.category || 'community'} onChange={(value) => updateEvent(selectedEvent, { category: value })} />
                    <label className="grid gap-2 text-[11px] font-bold uppercase text-[rgba(11,31,51,0.58)] sm:col-span-2">
                      Description
                      <textarea className="dp-admin-input min-h-24" value={selectedEvent.description || ''} onChange={(event) => updateEvent(selectedEvent, { description: event.target.value })} />
                    </label>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Action icon={Send} label="Go live" onClick={() => publishEvent(selectedEvent)} />
                    <Action icon={Share2} label="Share" onClick={() => shareEvent(selectedEvent)} />
                    <Action icon={Users} label="Add RSVP" onClick={() => addRsvp(selectedEvent)} />
                    <Action icon={Megaphone} label="Follow up" onClick={() => queueFollowUp(selectedEvent)} />
                    <Action icon={Eye} label="Report" onClick={() => saveReport(selectedEvent)} />
                    <Action icon={Download} label="Export" onClick={() => exportEvent(selectedEvent)} />
                  </div>
                  {shareNotice && <p className="mt-3 text-xs font-semibold text-[rgba(11,31,51,0.58)]">{shareNotice}</p>}
                </article>

                <aside className="bg-white">
                  <p className="text-[11px] font-bold uppercase text-[#C8A96A]">Event read</p>
                  <h2 className="mt-2 text-xl font-semibold leading-tight">{eventTitle(selectedEvent)}</h2>
                  <div className="dp-summary-matrix mt-4">
                    <div className="dp-summary-matrix__grid">
                      <Metric label="RSVPs" value={eventRsvps.length} detail="Registered residents" />
                      <Metric label="Checked in" value={checkedIn} detail="Attendance recorded" />
                      <Metric label="Capacity" value={selectedEvent.capacity || 0} detail="Configured spots" />
                      <Metric label="Fill" value={selectedEvent.capacity ? `${Math.round((eventRsvps.length / Number(selectedEvent.capacity)) * 100)}%` : 'Open'} detail="RSVP rate" />
                    </div>
                  </div>
                  <div className="mt-5 grid gap-2">
                    {eventRsvps.slice(0, 6).map((rsvp: any) => (
                      <div key={rsvp.id} className="grid grid-cols-[minmax(0,1fr)_88px] gap-3 py-1 text-[11px]">
                        <span className="truncate font-semibold">{rsvp.resident_email || rsvp.tenant_id || 'Resident'}</span>
                        <span className="text-[10px] font-semibold uppercase text-[rgba(11,31,51,0.48)]">{rsvp.status || 'registered'}</span>
                      </div>
                    ))}
                    {!eventRsvps.length && <p className="text-xs leading-5 text-[rgba(11,31,51,0.58)]">No RSVPs yet. Share the event or add a resident RSVP manually.</p>}
                  </div>
                </aside>
              </section>
            ) : (
              <section className="bg-white py-10 text-sm text-[rgba(11,31,51,0.62)]">No events yet. Create the first draft to start.</section>
            )}
          </main>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: any; detail: string }) {
  return (
    <div className="dp-summary-matrix__item">
      <p className="dp-summary-matrix__label">{label}</p>
      <strong className="dp-summary-matrix__value">{typeof value === 'number' ? value.toLocaleString() : value}</strong>
      <p className="dp-summary-matrix__detail">{detail}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-[11px] font-bold uppercase text-[rgba(11,31,51,0.58)]">
      {label}
      <input className="dp-admin-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Action({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-8 items-center gap-1.5 text-[10px] font-semibold text-[#0B1F33] hover:text-[#C8A96A]">
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
