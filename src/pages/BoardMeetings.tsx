import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Download, FileText, Loader2, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { boardMeetingsService, type BoardActionItem, type BoardMeeting, type BoardMeetingMetrics } from '@/services/domain/boardMeetingsService';

const emptyMetrics: BoardMeetingMetrics = { meetings: 0, upcoming: 0, openActionItems: 0, decisions: 0 };

function meetingTitle(meeting?: BoardMeeting) {
  return meeting?.title || 'Board meeting';
}

function listToTextarea(value?: string[]) {
  return Array.isArray(value) ? value.join('\n') : '';
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

export default function BoardMeetings() {
  const [meetings, setMeetings] = useState<BoardMeeting[]>([]);
  const [metrics, setMetrics] = useState<BoardMeetingMetrics>(emptyMetrics);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [createForm, setCreateForm] = useState({
    title: '',
    board_name: 'Civic board',
    meeting_date: '',
    location: '',
    attendees: '',
    agenda: '',
  });
  const [workForm, setWorkForm] = useState({
    notes: '',
    minutes: '',
    decision: '',
    decisionOwner: '',
    actionTitle: '',
    actionOwner: '',
    actionDue: '',
  });

  const selectedMeeting = useMemo(
    () => meetings.find((meeting) => meeting.id === selectedId) || meetings[0],
    [meetings, selectedId],
  );

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selectedMeeting) return;
    setWorkForm((current) => ({
      ...current,
      notes: selectedMeeting.notes || '',
      minutes: selectedMeeting.minutes || '',
      decision: '',
      decisionOwner: '',
      actionTitle: '',
      actionOwner: '',
      actionDue: '',
    }));
  }, [selectedMeeting?.id]);

  const visibleMeetings = useMemo(() => {
    if (statusFilter === 'all') return meetings;
    return meetings.filter((meeting) => String(meeting.status || 'draft').toLowerCase() === statusFilter);
  }, [meetings, statusFilter]);

  async function refresh() {
    setLoading(true);
    try {
      const payload = await boardMeetingsService.list();
      setMeetings(payload.meetings || []);
      setMetrics(payload.metrics || emptyMetrics);
      if (!selectedId && payload.meetings?.[0]) setSelectedId(payload.meetings[0].id);
    } catch {
      toast.error('Could not load board meetings.');
    } finally {
      setLoading(false);
    }
  }

  async function createMeeting(event: React.FormEvent) {
    event.preventDefault();
    if (!createForm.title.trim()) {
      toast.error('Add a meeting title first.');
      return;
    }
    setSaving(true);
    try {
      const created = await boardMeetingsService.create(createForm);
      setSelectedId(created.id);
      setCreateForm({ title: '', board_name: 'Civic board', meeting_date: '', location: '', attendees: '', agenda: '' });
      toast.success('Board meeting created.');
      await refresh();
    } catch {
      toast.error('Could not create this meeting.');
    } finally {
      setSaving(false);
    }
  }

  async function saveMeeting(patch: Partial<BoardMeeting>) {
    if (!selectedMeeting) return;
    setSaving(true);
    try {
      const updated = await boardMeetingsService.update(selectedMeeting.id, patch);
      setSelectedId(updated.id);
      toast.success('Meeting saved.');
      await refresh();
    } catch {
      toast.error('Could not save this meeting.');
    } finally {
      setSaving(false);
    }
  }

  async function draftMinutes() {
    if (!selectedMeeting) return;
    setSaving(true);
    try {
      const updated = await boardMeetingsService.draftMinutes(selectedMeeting.id, { notes: workForm.notes });
      setWorkForm((current) => ({ ...current, minutes: updated.minutes || current.minutes }));
      toast.success('Minutes draft created.');
      await refresh();
    } catch {
      toast.error('Could not create the minutes draft.');
    } finally {
      setSaving(false);
    }
  }

  async function addDecision(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedMeeting || !workForm.decision.trim()) return;
    setSaving(true);
    try {
      await boardMeetingsService.addDecision(selectedMeeting.id, { decision: workForm.decision, owner: workForm.decisionOwner || 'Needs verification' });
      setWorkForm((current) => ({ ...current, decision: '', decisionOwner: '' }));
      toast.success('Decision saved.');
      await refresh();
    } catch {
      toast.error('Could not save this decision.');
    } finally {
      setSaving(false);
    }
  }

  async function addActionItem(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedMeeting || !workForm.actionTitle.trim()) return;
    setSaving(true);
    try {
      await boardMeetingsService.addActionItem(selectedMeeting.id, {
        title: workForm.actionTitle,
        owner: workForm.actionOwner || 'Needs verification',
        due_date: workForm.actionDue,
        status: 'open',
      });
      setWorkForm((current) => ({ ...current, actionTitle: '', actionOwner: '', actionDue: '' }));
      toast.success('Action item added.');
      await refresh();
    } catch {
      toast.error('Could not add this action item.');
    } finally {
      setSaving(false);
    }
  }

  async function completeActionItem(item: BoardActionItem) {
    setSaving(true);
    try {
      await boardMeetingsService.updateActionItem(item.id, { status: 'done' });
      toast.success('Action item marked done.');
      await refresh();
    } catch {
      toast.error('Could not update this action item.');
    } finally {
      setSaving(false);
    }
  }

  function exportMinutes() {
    if (!selectedMeeting) return;
    const body = workForm.minutes || selectedMeeting.minutes || selectedMeeting.summary || '';
    downloadTextFile(`${meetingTitle(selectedMeeting).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-minutes.txt`, body);
  }

  return (
    <main className="min-h-screen bg-white text-left text-[#0B1F33]">
      <div className="w-full max-w-none px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
        <header className="mb-5 border-b border-[rgba(11,31,51,0.08)] pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#C8A96A]">Civic operations</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[clamp(1.85rem,3vw,3.1rem)] font-semibold leading-none tracking-normal">Board meetings</h1>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[rgba(11,31,51,0.66)]">
                Keep agendas, rough notes, minutes, decisions, and follow-up in one place.
              </p>
            </div>
            <button
              type="button"
              onClick={exportMinutes}
              disabled={!selectedMeeting}
              className="inline-flex min-h-9 items-center gap-2 border border-[rgba(11,31,51,0.12)] bg-white px-3 text-[11px] font-semibold uppercase text-[#0B1F33] hover:border-[#C8A96A] disabled:opacity-45"
            >
              <Download className="h-3.5 w-3.5" />
              Export minutes
            </button>
          </div>
        </header>

        <section className="mb-5 overflow-x-auto border border-[rgba(11,31,51,0.08)]">
          <div className="grid min-w-[620px] grid-cols-4 divide-x divide-[rgba(11,31,51,0.08)] bg-white">
            {[
              ['Meetings', metrics.meetings, 'Records in this workspace'],
              ['Upcoming', metrics.upcoming, 'Scheduled and not archived'],
              ['Open items', metrics.openActionItems, 'Follow-up still active'],
              ['Decisions', metrics.decisions, 'Recorded board decisions'],
            ].map(([label, value, helper]) => (
              <div key={label} className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.52)]">{label}</p>
                <p className="mt-1 text-2xl font-semibold leading-none">{value}</p>
                <p className="mt-1 text-[11px] leading-4 text-[rgba(11,31,51,0.58)]">{helper}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <aside className="space-y-4">
            <section className="border border-[rgba(11,31,51,0.08)] bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold">New meeting</h2>
                {saving && <Loader2 className="h-4 w-4 animate-spin text-[#C8A96A]" />}
              </div>
              <form onSubmit={createMeeting} className="grid gap-3">
                <input
                  value={createForm.title}
                  onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                  className="min-h-9 border border-[rgba(11,31,51,0.1)] px-3 text-[12px] outline-none focus:border-[#C8A96A]"
                  placeholder="Meeting title"
                />
                <input
                  value={createForm.board_name}
                  onChange={(event) => setCreateForm((current) => ({ ...current, board_name: event.target.value }))}
                  className="min-h-9 border border-[rgba(11,31,51,0.1)] px-3 text-[12px] outline-none focus:border-[#C8A96A]"
                  placeholder="Board or committee"
                />
                <input
                  type="datetime-local"
                  value={createForm.meeting_date}
                  onChange={(event) => setCreateForm((current) => ({ ...current, meeting_date: event.target.value }))}
                  className="min-h-9 border border-[rgba(11,31,51,0.1)] px-3 text-[12px] outline-none focus:border-[#C8A96A]"
                />
                <input
                  value={createForm.location}
                  onChange={(event) => setCreateForm((current) => ({ ...current, location: event.target.value }))}
                  className="min-h-9 border border-[rgba(11,31,51,0.1)] px-3 text-[12px] outline-none focus:border-[#C8A96A]"
                  placeholder="Location"
                />
                <textarea
                  value={createForm.attendees}
                  onChange={(event) => setCreateForm((current) => ({ ...current, attendees: event.target.value }))}
                  className="min-h-20 border border-[rgba(11,31,51,0.1)] px-3 py-2 text-[12px] leading-5 outline-none focus:border-[#C8A96A]"
                  placeholder="Attendees, one per line"
                />
                <textarea
                  value={createForm.agenda}
                  onChange={(event) => setCreateForm((current) => ({ ...current, agenda: event.target.value }))}
                  className="min-h-20 border border-[rgba(11,31,51,0.1)] px-3 py-2 text-[12px] leading-5 outline-none focus:border-[#C8A96A]"
                  placeholder="Agenda, one item per line"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-9 items-center justify-center gap-2 bg-[#0B1F33] px-3 text-[11px] font-semibold uppercase text-white disabled:opacity-45"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create meeting
                </button>
              </form>
            </section>

            <section className="border border-[rgba(11,31,51,0.08)] bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-[rgba(11,31,51,0.08)] p-3">
                <h2 className="text-[15px] font-semibold">Meetings</h2>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="min-h-8 border border-[rgba(11,31,51,0.1)] bg-white px-2 text-[11px] font-semibold outline-none"
                >
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="minutes_drafted">Minutes drafted</option>
                  <option value="approved">Approved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {loading ? (
                  <div className="flex min-h-32 items-center justify-center text-[12px] text-[rgba(11,31,51,0.58)]">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading meetings
                  </div>
                ) : visibleMeetings.length === 0 ? (
                  <p className="p-4 text-[12px] text-[rgba(11,31,51,0.58)]">No meetings match this filter.</p>
                ) : (
                  visibleMeetings.map((meeting) => (
                    <button
                      key={meeting.id}
                      type="button"
                      onClick={() => setSelectedId(meeting.id)}
                      className={`block w-full border-b border-[rgba(11,31,51,0.06)] p-3 text-left hover:bg-[#F7F8FB] ${meeting.id === selectedMeeting?.id ? 'bg-[#F7F8FB]' : ''}`}
                    >
                      <span className="block text-[13px] font-semibold">{meetingTitle(meeting)}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[rgba(11,31,51,0.58)]">
                        <CalendarDays className="h-3.5 w-3.5 text-[#C8A96A]" />
                        {meeting.meeting_date || 'Date needed'}
                        <span>{meeting.status || 'draft'}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>
          </aside>

          <section className="min-w-0 border border-[rgba(11,31,51,0.08)] bg-white">
            {!selectedMeeting ? (
              <div className="p-6 text-[13px] text-[rgba(11,31,51,0.62)]">Create or select a meeting to begin.</div>
            ) : (
              <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
                <div className="min-w-0 p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(11,31,51,0.08)] pb-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A96A]">{selectedMeeting.board_name || 'Civic board'}</p>
                      <h2 className="mt-1 text-2xl font-semibold leading-tight">{meetingTitle(selectedMeeting)}</h2>
                      <p className="mt-1 text-[12px] text-[rgba(11,31,51,0.58)]">{selectedMeeting.location || 'Location needs verification'}</p>
                    </div>
                    <select
                      value={selectedMeeting.status || 'draft'}
                      onChange={(event) => saveMeeting({ status: event.target.value })}
                      className="min-h-9 border border-[rgba(11,31,51,0.1)] bg-white px-3 text-[11px] font-semibold uppercase outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="minutes_drafted">Minutes drafted</option>
                      <option value="approved">Approved</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.52)]">Attendees</label>
                      <textarea
                        defaultValue={listToTextarea(selectedMeeting.attendees)}
                        onBlur={(event) => saveMeeting({ attendees: event.target.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean) })}
                        className="mt-2 min-h-28 w-full border border-[rgba(11,31,51,0.1)] px-3 py-2 text-[12px] leading-5 outline-none focus:border-[#C8A96A]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.52)]">Agenda</label>
                      <textarea
                        defaultValue={listToTextarea(selectedMeeting.agenda)}
                        onBlur={(event) => saveMeeting({ agenda: event.target.value.split(/\n|;/).map((item) => item.trim()).filter(Boolean) })}
                        className="mt-2 min-h-28 w-full border border-[rgba(11,31,51,0.1)] px-3 py-2 text-[12px] leading-5 outline-none focus:border-[#C8A96A]"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.52)]">Rough notes</label>
                      <button
                        type="button"
                        onClick={draftMinutes}
                        disabled={saving}
                        className="inline-flex min-h-8 items-center gap-2 border border-[#C8A96A] px-2.5 text-[10px] font-semibold uppercase disabled:opacity-45"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Create minutes draft
                      </button>
                    </div>
                    <textarea
                      value={workForm.notes}
                      onChange={(event) => setWorkForm((current) => ({ ...current, notes: event.target.value }))}
                      onBlur={() => saveMeeting({ notes: workForm.notes })}
                      className="min-h-36 w-full border border-[rgba(11,31,51,0.1)] px-3 py-2 text-[12px] leading-5 outline-none focus:border-[#C8A96A]"
                      placeholder="Paste meeting notes, transcript highlights, motions, and follow-up items."
                    />
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(11,31,51,0.52)]">Minutes</label>
                      <button
                        type="button"
                        onClick={() => saveMeeting({ minutes: workForm.minutes })}
                        disabled={saving}
                        className="inline-flex min-h-8 items-center gap-2 bg-[#0B1F33] px-2.5 text-[10px] font-semibold uppercase text-white disabled:opacity-45"
                      >
                        Save minutes
                      </button>
                    </div>
                    <textarea
                      value={workForm.minutes}
                      onChange={(event) => setWorkForm((current) => ({ ...current, minutes: event.target.value }))}
                      className="min-h-72 w-full border border-[rgba(11,31,51,0.1)] px-3 py-2 font-mono text-[12px] leading-5 outline-none focus:border-[#C8A96A]"
                    />
                  </div>
                </div>

                <aside className="border-t border-[rgba(11,31,51,0.08)] p-4 lg:border-l lg:border-t-0">
                  <div className="mb-4">
                    <h3 className="flex items-center gap-2 text-[14px] font-semibold">
                      <Users className="h-4 w-4 text-[#C8A96A]" />
                      Decisions
                    </h3>
                    <div className="mt-3 grid gap-2">
                      {(selectedMeeting.decisions || []).map((decision) => (
                        <div key={decision.id} className="border border-[rgba(11,31,51,0.08)] p-3">
                          <p className="text-[12px] font-semibold leading-5">{decision.decision || decision.title}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[rgba(11,31,51,0.48)]">{decision.owner || 'Needs verification'} · {decision.status || 'draft'}</p>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={addDecision} className="mt-3 grid gap-2">
                      <textarea
                        value={workForm.decision}
                        onChange={(event) => setWorkForm((current) => ({ ...current, decision: event.target.value }))}
                        className="min-h-20 border border-[rgba(11,31,51,0.1)] px-3 py-2 text-[12px] leading-5 outline-none focus:border-[#C8A96A]"
                        placeholder="Decision or motion"
                      />
                      <input
                        value={workForm.decisionOwner}
                        onChange={(event) => setWorkForm((current) => ({ ...current, decisionOwner: event.target.value }))}
                        className="min-h-9 border border-[rgba(11,31,51,0.1)] px-3 text-[12px] outline-none focus:border-[#C8A96A]"
                        placeholder="Owner"
                      />
                      <button type="submit" disabled={saving} className="min-h-8 bg-[#0B1F33] px-2.5 text-[10px] font-semibold uppercase text-white disabled:opacity-45">
                        Add decision
                      </button>
                    </form>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 text-[14px] font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-[#C8A96A]" />
                      Action items
                    </h3>
                    <div className="mt-3 grid gap-2">
                      {(selectedMeeting.actionItems || []).map((item) => (
                        <div key={item.id} className="border border-[rgba(11,31,51,0.08)] p-3">
                          <p className="text-[12px] font-semibold leading-5">{item.title}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[rgba(11,31,51,0.48)]">{item.owner || 'Needs verification'} · {item.due_date || 'No due date'} · {item.status || 'open'}</p>
                          {item.status !== 'done' && (
                            <button
                              type="button"
                              onClick={() => completeActionItem(item)}
                              className="mt-2 min-h-7 border border-[rgba(11,31,51,0.12)] px-2 text-[10px] font-semibold uppercase"
                            >
                              Mark done
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <form onSubmit={addActionItem} className="mt-3 grid gap-2">
                      <input
                        value={workForm.actionTitle}
                        onChange={(event) => setWorkForm((current) => ({ ...current, actionTitle: event.target.value }))}
                        className="min-h-9 border border-[rgba(11,31,51,0.1)] px-3 text-[12px] outline-none focus:border-[#C8A96A]"
                        placeholder="Action item"
                      />
                      <input
                        value={workForm.actionOwner}
                        onChange={(event) => setWorkForm((current) => ({ ...current, actionOwner: event.target.value }))}
                        className="min-h-9 border border-[rgba(11,31,51,0.1)] px-3 text-[12px] outline-none focus:border-[#C8A96A]"
                        placeholder="Owner"
                      />
                      <input
                        type="date"
                        value={workForm.actionDue}
                        onChange={(event) => setWorkForm((current) => ({ ...current, actionDue: event.target.value }))}
                        className="min-h-9 border border-[rgba(11,31,51,0.1)] px-3 text-[12px] outline-none focus:border-[#C8A96A]"
                      />
                      <button type="submit" disabled={saving} className="min-h-8 bg-[#0B1F33] px-2.5 text-[10px] font-semibold uppercase text-white disabled:opacity-45">
                        Add action item
                      </button>
                    </form>
                  </div>
                </aside>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
