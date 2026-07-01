export type SupabaseUser = {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
};

type SupabaseSession = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: SupabaseUser;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const sessionKey = "dp_supabase_session";

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function authUrl(path: string) {
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1${path}`;
}

function normalizeUser(user: any): SupabaseUser {
  const metadata = user?.user_metadata || {};
  return {
    id: user?.id || "",
    uid: user?.id || "",
    email: user?.email || null,
    displayName: metadata.full_name || metadata.name || user?.email || null,
    role: metadata.role || user?.app_metadata?.role || undefined,
  };
}

function saveSession(payload: any): SupabaseSession {
  const expiresIn = Number(payload?.expires_in || 3600);
  const session = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    user: normalizeUser(payload.user),
  };
  localStorage.setItem(sessionKey, JSON.stringify(session));
  localStorage.setItem("dp_auth_user", JSON.stringify(session.user));
  return session;
}

export function getStoredSupabaseSession(): SupabaseSession | null {
  const raw = localStorage.getItem(sessionKey);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as SupabaseSession;
    return session?.access_token && session?.user ? session : null;
  } catch {
    return null;
  }
}

export function clearSupabaseSession() {
  localStorage.removeItem(sessionKey);
  localStorage.removeItem("dp_auth_user");
}

async function request(path: string, options: RequestInit = {}) {
  if (!supabaseConfigured) throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  const response = await fetch(authUrl(path), {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.msg || payload?.message || payload?.error_description || "Supabase authentication failed.");
  return payload;
}

export async function signInWithSupabase(email: string, password: string) {
  const payload = await request("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return saveSession(payload).user;
}

export async function signUpWithSupabase(email: string, password: string, displayName?: string) {
  const payload = await request("/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, data: { full_name: displayName } }),
  });
  return saveSession(payload).user;
}

export async function resetSupabasePassword(email: string) {
  await request("/recover", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function signOutOfSupabase() {
  const session = getStoredSupabaseSession();
  if (session?.access_token && supabaseConfigured) {
    await request("/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => null);
  }
  clearSupabaseSession();
}

export function startSupabaseGoogleSignIn() {
  if (!supabaseConfigured) throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  const redirectTo = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  window.location.href = `${authUrl("/authorize")}?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
}

export async function hydrateSupabaseSessionFromUrl() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token") || undefined;
  const expiresIn = Number(hash.get("expires_in") || 3600);
  if (!accessToken) return getStoredSupabaseSession();

  const payload = await request("/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const session = saveSession({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    user: payload,
  });
  window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
  return session;
}
