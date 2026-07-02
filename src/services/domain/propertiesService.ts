import { apiRequest } from './apiClient';

export type PropertyRecord = Record<string, unknown> & { id: string; name?: string; status?: string };

export const propertiesService = {
  listAdmin: () => apiRequest<PropertyRecord[]>('/api/admin/properties'),

  list: () => apiRequest<PropertyRecord[]>('/api/properties'),

  create: (input: Record<string, unknown>) =>
    apiRequest<PropertyRecord>('/api/properties', { method: 'POST', body: input }),

  update: (propertyId: string, patch: Record<string, unknown>) =>
    apiRequest<PropertyRecord>(`/api/properties/${encodeURIComponent(propertyId)}`, { method: 'PUT', body: patch }),

  delete: (propertyId: string) =>
    apiRequest<{ ok?: boolean }>(`/api/properties/${encodeURIComponent(propertyId)}`, { method: 'DELETE' }),

  ingest: (input: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>('/api/properties/ingest', { method: 'POST', body: input }),
};
