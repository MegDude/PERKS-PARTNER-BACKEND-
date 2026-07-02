import { apiRequest } from './apiClient';

export type RegistryEntity = Record<string, unknown> & { id: string; name?: string; slug?: string; entityType?: string };

export const registryService = {
  listEntities: (filters: Record<string, string | number | boolean | null | undefined> = {}) =>
    apiRequest<RegistryEntity[]>('/api/registry/entities', { query: filters }),

  getEntity: (entityId: string) =>
    apiRequest<RegistryEntity>(`/api/registry/entity/${encodeURIComponent(entityId)}`),

  search: (query: string, filters: Record<string, string | number | boolean | null | undefined> = {}) =>
    apiRequest<{ results?: RegistryEntity[] }>('/api/registry/search', { query: { q: query, ...filters } }),

  campaigns: () => apiRequest<RegistryEntity[]>('/api/registry/campaigns'),

  collections: () => apiRequest<RegistryEntity[]>('/api/registry/collections'),

  layers: () => apiRequest<RegistryEntity[]>('/api/registry/layers'),

  relationships: (filters: Record<string, string | number | boolean | null | undefined> = {}) =>
    apiRequest<Record<string, unknown>[]>('/api/registry/relationships', { query: filters }),

  createEntity: (input: Record<string, unknown>) =>
    apiRequest<RegistryEntity>('/api/registry/entity', { method: 'POST', body: input }),

  updateEntity: (entityId: string, patch: Record<string, unknown>) =>
    apiRequest<RegistryEntity>(`/api/registry/entity/${encodeURIComponent(entityId)}`, { method: 'PUT', body: patch }),

  deleteEntity: (entityId: string) =>
    apiRequest<{ ok?: boolean }>(`/api/registry/entity/${encodeURIComponent(entityId)}`, { method: 'DELETE' }),
};
