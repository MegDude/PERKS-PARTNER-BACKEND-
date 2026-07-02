import { apiRequest } from './apiClient';

export type BoardActionItem = {
  id: string;
  title?: string;
  owner?: string;
  due_date?: string;
  priority?: string;
  status?: string;
  notes?: string;
};

export type BoardDecision = {
  id: string;
  title?: string;
  decision?: string;
  owner?: string;
  status?: string;
  impact?: string;
};

export type BoardMeeting = {
  id: string;
  title?: string;
  board_name?: string;
  meeting_type?: string;
  status?: string;
  meeting_date?: string;
  location?: string;
  attendees?: string[];
  agenda?: string[];
  notes?: string;
  summary?: string;
  minutes?: string;
  follow_up_status?: string;
  decisions?: BoardDecision[];
  actionItems?: BoardActionItem[];
};

export type BoardMeetingMetrics = {
  meetings: number;
  upcoming: number;
  openActionItems: number;
  decisions: number;
};

export type BoardMeetingsResponse = {
  meetings: BoardMeeting[];
  metrics: BoardMeetingMetrics;
};

export type CreateBoardMeetingInput = {
  title: string;
  board_name?: string;
  meeting_date?: string;
  location?: string;
  attendees?: string | string[];
  agenda?: string | string[];
};

export const boardMeetingsService = {
  list: (filters: { status?: string; board?: string } = {}) =>
    apiRequest<BoardMeetingsResponse>('/api/board-meetings', { query: filters }),

  create: (input: CreateBoardMeetingInput) =>
    apiRequest<BoardMeeting>('/api/board-meetings', { method: 'POST', body: input }),

  update: (meetingId: string, patch: Partial<BoardMeeting>) =>
    apiRequest<BoardMeeting>(`/api/board-meetings/${encodeURIComponent(meetingId)}`, { method: 'PATCH', body: patch }),

  draftMinutes: (meetingId: string, input: { notes?: string; attendees?: string[]; decisions?: string[] }) =>
    apiRequest<BoardMeeting & { draft?: Record<string, unknown> }>(`/api/board-meetings/${encodeURIComponent(meetingId)}/minutes`, {
      method: 'POST',
      body: input,
    }),

  addDecision: (meetingId: string, input: { decision: string; owner?: string; title?: string; status?: string; impact?: string }) =>
    apiRequest<BoardDecision>(`/api/board-meetings/${encodeURIComponent(meetingId)}/decisions`, { method: 'POST', body: input }),

  addActionItem: (meetingId: string, input: { title: string; owner?: string; due_date?: string; status?: string; priority?: string; notes?: string }) =>
    apiRequest<BoardActionItem>(`/api/board-meetings/${encodeURIComponent(meetingId)}/action-items`, { method: 'POST', body: input }),

  updateActionItem: (itemId: string, patch: Partial<BoardActionItem>) =>
    apiRequest<BoardActionItem>(`/api/board-action-items/${encodeURIComponent(itemId)}`, { method: 'PATCH', body: patch }),
};
