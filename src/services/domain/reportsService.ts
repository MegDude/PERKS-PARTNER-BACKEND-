import { apiRequest } from './apiClient';

export type ReportRecord = Record<string, unknown> & { id: string; title?: string; status?: string };

export const reportsService = {
  list: (filters: Record<string, string | number | boolean | null | undefined> = {}) =>
    apiRequest<ReportRecord[]>('/api/reports', { query: filters }),

  run: (input: Record<string, unknown>) =>
    apiRequest<ReportRecord>('/api/reports/run', { method: 'POST', body: input }),

  exportUrl: (reportId: string) => `/api/reports/${encodeURIComponent(reportId)}/export`,
};
