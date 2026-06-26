type JsonRecord = Record<string, unknown>;

const SESSION_KEY = "dp_session_id";
const PROFILE_KEY = "dp_profile_id";

function getOrCreateBrowserId(key: string, prefix: string) {
  if (typeof window === "undefined") return `${prefix}-server`;
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `${prefix}-${crypto.randomUUID()}`
        : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return `${prefix}-${Date.now()}`;
  }
}

export function getWorkflowSessionId() {
  return getOrCreateBrowserId(SESSION_KEY, "session");
}

export function getWorkflowProfileId() {
  return getOrCreateBrowserId(PROFILE_KEY, "profile");
}

export async function postWorkflow(endpoint: string, payload: JsonRecord) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : "Workflow request failed";
    throw new Error(message);
  }
  return body;
}

async function postOperationsAudit(endpoint: string, payload: JsonRecord, status: "attempted" | "completed" | "failed", error?: unknown) {
  const sessionId = typeof payload.sessionId === "string" ? payload.sessionId : getWorkflowSessionId();
  const profileId = typeof payload.profileId === "string" ? payload.profileId : getWorkflowProfileId();
  const action = typeof payload.type === "string" ? payload.type : endpoint.replace(/^\/api\//, "").replace(/\//g, ".");

  await fetch("/api/entities/TenantAuditLog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_id: typeof payload.tenantId === "string" ? payload.tenantId : "tenant_platform",
      workspace_id: typeof payload.workspaceId === "string" ? payload.workspaceId : "workspace_platform",
      actor_id: profileId,
      source: "3014-operations-app",
      action,
      status,
      target_endpoint: endpoint,
      session_id: sessionId,
      metadata: {
        ...payload,
        mirrored_from: "operations-app",
        error: error instanceof Error ? error.message : error ? String(error) : undefined,
      },
      created_by: "operations-app",
      updated_by: "operations-app",
    }),
  });
}

export function fireWorkflow(endpoint: string, payload: JsonRecord) {
  void postOperationsAudit(endpoint, payload, "attempted").catch(() => undefined);
  void postWorkflow(endpoint, payload)
    .then(() => void postOperationsAudit(endpoint, payload, "completed").catch(() => undefined))
    .catch((error) => void postOperationsAudit(endpoint, payload, "failed", error).catch(() => undefined));
}
