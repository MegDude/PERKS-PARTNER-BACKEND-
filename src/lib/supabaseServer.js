export const supabaseServer = null;

export function getSupabaseServerStatus() {
  return {
    status: "pending_configuration",
    missing: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    note: "The operations app uses the local JSON/API backend by default. Configure Supabase before enabling the server client.",
  };
}
