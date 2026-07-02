import { apiRequest } from './apiClient';

export type EventRecord = Record<string, unknown> & { id: string; title?: string; name?: string; status?: string };

export const eventsService = {
  list: (filters: Record<string, string | number | boolean | null | undefined> = {}) =>
    apiRequest<EventRecord[]>('/api/events', { query: filters }),

  create: (input: Record<string, unknown>) =>
    apiRequest<EventRecord>('/api/events', { method: 'POST', body: input }),

  update: (eventId: string, patch: Record<string, unknown>) =>
    apiRequest<EventRecord>(`/api/events/${encodeURIComponent(eventId)}`, { method: 'PATCH', body: patch }),

  rsvp: (eventId: string, input: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(`/api/events/${encodeURIComponent(eventId)}/rsvp`, { method: 'POST', body: input }),

  checkIn: (eventId: string, input: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(`/api/events/${encodeURIComponent(eventId)}/check-in`, { method: 'POST', body: input }),

  followUp: (eventId: string, input: Record<string, unknown> = {}) =>
    apiRequest<Record<string, unknown>>(`/api/events/${encodeURIComponent(eventId)}/follow-up`, { method: 'POST', body: input }),
};
