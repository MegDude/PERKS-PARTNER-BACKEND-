import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Building2, Loader2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/context/AuthContext";

type DashboardOverview = {
  partners: number;
  contacts: number;
  activePerks: number;
  campaigns: number;
};

type PartnerPreview = {
  id: string;
  name: string;
  category: string;
  status: string;
  workspacePath: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, configured, error } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview>({ partners: 0, contacts: 0, activePerks: 0, campaigns: 0 });
  const [partners, setPartners] = useState<PartnerPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      setLoading(true);
      setLoadError(null);
      try {
        const [partnerRows, contacts, perks, campaigns] = await Promise.all([
          base44.entities.Partner.list(),
          base44.entities.PartnerOutreachContact.list().catch(() => []),
          base44.entities.PerkLocation.list(),
          base44.entities.Campaign.list(),
        ]);

        if (!active) return;
        setOverview({
          partners: partnerRows.length,
          contacts: contacts.length,
          activePerks: perks.filter((perk: any) => perk.is_active !== false && perk.active !== false && perk.status !== "archived").length,
          campaigns: campaigns.length,
        });
        setPartners(
          partnerRows.slice(0, 8).map((partner: any) => {
            const name = partner.business_name || partner.name || "Partner";
            const slug = String(partner.slug || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            return {
              id: partner.id,
              name,
              category: partner.partner_type || partner.category || partner.type || "Partner",
              status: partner.status || (partner.is_active === false ? "paused" : "active"),
              workspacePath: partner.workspacePath || `/admin/workspaces/${slug}`,
            };
          })
        );
      } catch (requestError) {
        if (!active) return;
        setLoadError(requestError instanceof Error ? requestError.message : "Dashboard data could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchData();
    return () => {
      active = false;
    };
  }, []);

  const matrix = useMemo(
    () => [
      { label: "Partners", value: overview.partners, note: "Workspaces and profiles ready to open.", to: "/admin/partner" },
      { label: "Contacts", value: overview.contacts, note: "People to verify, contact, or follow up.", to: "/admin/outreach-crm" },
      { label: "Perks", value: overview.activePerks, note: "Offers active or ready for residents.", to: "/admin/perks" },
      { label: "Campaigns", value: overview.campaigns, note: "Notes, offers, and outreach in motion.", to: "/admin/engagement" },
    ],
    [overview]
  );

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-[#11182B]" />
      </div>
    );
  }

  return (
    <div className="dp-page-surface mx-0 max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C5A028]">Performance</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-[#11182B] sm:text-3xl">Partner workspace overview</h1>
        <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.64)]">
          A clean view of partners, contacts, perks, and campaigns before the full directory table opens here.
        </p>
      </header>

      {(error || loadError || !configured) && (
        <section className="mb-5 bg-[#F9FAFB] px-4 py-3 text-sm leading-6 text-[#11182B]">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-[#C5A028]" />
            <div>
              <p className="font-semibold">{configured ? "Workspace notice" : "Firebase setup pending"}</p>
              <p className="text-[13px] text-[rgba(11,31,51,0.62)]">
                {error || loadError || "Add the VITE_FIREBASE_* app config to enable Firebase Authentication and Firestore realtime data."}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mb-6 overflow-hidden bg-white shadow-[0_18px_48px_rgba(11,31,51,0.06)]">
        <div className="grid grid-cols-2 divide-x divide-y divide-[rgba(11,31,51,0.08)] md:grid-cols-4 md:divide-y-0">
          {matrix.map((item) => (
            <Link key={item.label} to={item.to} className="group min-h-[112px] px-4 py-4 text-left transition-colors hover:bg-[#FAFAF8]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C5A028]">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#11182B]">{item.value.toLocaleString()}</p>
              <p className="mt-1 text-[12px] leading-5 text-[rgba(11,31,51,0.58)]">{item.note}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="overflow-hidden bg-white shadow-[0_18px_48px_rgba(11,31,51,0.06)]">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C5A028]">Partner directory</p>
              <h2 className="mt-1 text-lg font-semibold text-[#11182B]">Ready for the table build</h2>
            </div>
            <Button onClick={() => navigate("/admin/partner")} className="h-9 px-3 text-[10px]">
              Open partners
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-y border-[rgba(11,31,51,0.08)] text-[10px] uppercase tracking-[0.1em] text-[rgba(11,31,51,0.48)]">
                  <th className="px-4 py-3 font-semibold">Partner</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(11,31,51,0.06)] text-[13px]">
                {partners.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[13px] text-[rgba(11,31,51,0.58)]">
                      No partner records are loaded yet. Connect Firestore or import partner data to populate this table.
                    </td>
                  </tr>
                )}
                {partners.map((partner) => (
                  <tr key={partner.id} className="align-middle">
                    <td className="px-4 py-3 font-medium text-[#11182B]">{partner.name}</td>
                    <td className="px-4 py-3 text-[rgba(11,31,51,0.62)]">{partner.category}</td>
                    <td className="px-4 py-3 text-[rgba(11,31,51,0.62)]">{partner.status}</td>
                    <td className="px-4 py-3">
                      <Link className="text-[12px] font-semibold text-[#11182B] hover:text-[#C5A028]" to={partner.workspacePath}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="bg-[#FAFAF8] px-4 py-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C5A028]">
            <Sparkles className="h-4 w-4" />
            Workspace state
          </div>
          <div className="mt-4 space-y-4 text-sm leading-6 text-[rgba(11,31,51,0.66)]">
            <p>
              {user ? `Signed in as ${user.email || user.displayName || "a workspace user"}.` : "No Firebase user session is active yet."}
            </p>
            <p>
              The next table pass can attach realtime Firestore partners and contacts without changing the page structure.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="bg-white px-2 py-3">
              <Users className="mx-auto mb-1 h-4 w-4 text-[#C5A028]" />
              Contacts
            </div>
            <div className="bg-white px-2 py-3">
              <Building2 className="mx-auto mb-1 h-4 w-4 text-[#C5A028]" />
              Partners
            </div>
            <div className="bg-white px-2 py-3">
              <BarChart3 className="mx-auto mb-1 h-4 w-4 text-[#C5A028]" />
              Reports
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
