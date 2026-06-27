const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

export function getSupabaseServerStatus() {
  const missing = [
    !supabaseUrl ? "SUPABASE_URL" : "",
    !supabaseServiceKey ? "SUPABASE_SERVICE_ROLE_KEY" : "",
  ].filter(Boolean);

  return {
    status: missing.length ? "pending_configuration" : "configured",
    missing,
    urlConfigured: Boolean(supabaseUrl),
    serviceRoleConfigured: Boolean(supabaseServiceKey),
  };
}

function requireSupabaseConfig() {
  const status = getSupabaseServerStatus();
  if (status.status !== "configured") {
    throw new Error(`Supabase is not configured. Missing: ${status.missing.join(", ")}`);
  }
}

async function supabaseRequest(table, options = {}) {
  requireSupabaseConfig();
  const search = options.query ? `?${new URLSearchParams(options.query).toString()}` : "";
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${encodeURIComponent(table)}${search}`, {
    method: options.method || "GET",
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Supabase request failed with ${response.status}`);
  }
  return payload;
}

export const supabaseServer = {
  configured: getSupabaseServerStatus().status === "configured",
  status: getSupabaseServerStatus,
  from(table) {
    return {
      select: (query = {}) => supabaseRequest(table, { query }),
      insert: (body) => supabaseRequest(table, { method: "POST", body }),
      update: (match, body) => supabaseRequest(table, { method: "PATCH", query: match, body }),
      delete: (match) => supabaseRequest(table, { method: "DELETE", query: match, prefer: "return=minimal" }),
    };
  },
  request: supabaseRequest,
};
