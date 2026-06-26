export type Queryable = {
  query<T = Record<string, unknown>>(resource: string, params?: Record<string, unknown>): Promise<{ rows: T[] }>;
};

export type OperationsClientConfig = {
  apiBaseUrl?: string;
};

function currentApiBaseUrl() {
  return (import.meta as any).env?.VITE_API_BASE_URL || "";
}

export function createOperationsClient(config: OperationsClientConfig = {}): Queryable {
  const apiBaseUrl = (config.apiBaseUrl || currentApiBaseUrl()).replace(/\/$/, "");

  return {
    async query<T = Record<string, unknown>>(resource: string, params: Record<string, unknown> = {}) {
      const url = new URL(`${apiBaseUrl}${resource}`, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
      });
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Operations query failed: ${response.status}`);
      const payload = await response.json();
      return { rows: Array.isArray(payload) ? (payload as T[]) : ((payload.items || payload.data || []) as T[]) };
    },
  };
}

export async function getDb(explicitDb?: Queryable) {
  return explicitDb || createOperationsClient();
}
