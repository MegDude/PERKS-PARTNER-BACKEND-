import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { PartnerWorkspaceTemplate } from '@/components/workspace/PartnerWorkspaceTemplate';
import { buildWorkspaceFromRecords, getCuratedWorkspace, slugify } from '@/data/partnerWorkspaceCatalog';
import type { PartnerWorkspaceData } from '@/types/partnerWorkspace';

type WorkspaceDataState = {
  loading: boolean;
  workspace: PartnerWorkspaceData;
};

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function PartnerWorkspaceRoute() {
  const { slug = 'the-shore' } = useParams();
  const normalizedSlug = slugify(slug);
  const curated = useMemo(() => getCuratedWorkspace(normalizedSlug), [normalizedSlug]);
  const [state, setState] = useState<WorkspaceDataState>(() => ({
    loading: true,
    workspace:
      curated ||
      buildWorkspaceFromRecords(normalizedSlug, {
        tenant: { name: titleFromSlug(normalizedSlug), slug: normalizedSlug, type: 'partner' },
      }),
  }));

  useEffect(() => {
    let mounted = true;

    async function loadWorkspace() {
      try {
        const [partners, tenants, residents, profiles, locations, offers, perks, partnerEvents, events, campaigns, reports, analytics, qr, properties] = await Promise.all([
          base44.entities.Partner.list().catch(() => []),
          base44.entities.PlatformTenant.list().catch(() => []),
          base44.entities.Tenant.list().catch(() => []),
          base44.entities.PartnerProfile.list().catch(() => []),
          base44.entities.PartnerLocation.list().catch(() => []),
          base44.entities.PartnerOffer.list().catch(() => []),
          base44.entities.PerkLocation.list().catch(() => []),
          base44.entities.PartnerEvent.list().catch(() => []),
          base44.entities.Event.list().catch(() => []),
          base44.entities.Campaign.list().catch(() => []),
          base44.entities.PartnerReport.list().catch(() => []),
          base44.entities.PartnerAnalytics.list().catch(() => []),
          base44.entities.PartnerQrExperience.list().catch(() => []),
          fetch('/api/admin/properties').then((res) => (res.ok ? res.json() : [])).catch(() => []),
        ]);

        const tenant = (tenants as any[]).find((item) => slugify(item.slug || item.name || item.id) === normalizedSlug || item.id === `tenant_${normalizedSlug}`);
        const property = (properties as any[]).find((item) => (
          slugify(item.workspacePath?.replace('/tenant/', '') || '') === normalizedSlug ||
          slugify(item.workspace_id?.replace(/^workspace_/, '') || '') === normalizedSlug ||
          slugify(item.tenant_id?.replace(/^tenant_/, '') || '') === normalizedSlug ||
          slugify(item.name || '') === normalizedSlug ||
          slugify(item.address || '') === normalizedSlug ||
          item.id === normalizedSlug
        ));
        const partner = (partners as any[]).find((item) => (
          item.id === tenant?.source_id ||
          item.id === property?.partner_id ||
          item.tenant_id === tenant?.id ||
          item.tenant_id === property?.tenant_id ||
          item.workspace_id === tenant?.workspace_id ||
          item.workspace_id === property?.workspace_id ||
          slugify(item.business_name || item.name || item.id) === normalizedSlug
        ));
        const tenantId = tenant?.id || property?.tenant_id || partner?.tenant_id;
        const workspaceId = partner?.workspace_id || property?.workspace_id || tenant?.workspace_id || `workspace_${normalizedSlug}`;
        const matchesScope = (item: any) => (
          item.tenant_id === tenantId ||
          item.workspace_id === workspaceId ||
          item.workspace_slug === normalizedSlug ||
          item.partner_id === partner?.id ||
          item.partner_id === `partner-${normalizedSlug}` ||
          item.property_id === property?.id
        );
        const profile = (profiles as any[]).find((item) => item.tenant_id === tenantId || item.workspace_id === workspaceId || item.partner_id === partner?.id);
        const partnerLocations = (locations as any[]).filter((item) => (
          matchesScope(item) ||
          slugify(item.name || '') === normalizedSlug
        ));

        const workspace = buildWorkspaceFromRecords(normalizedSlug, {
          partner,
          tenant,
          profile,
          property,
          locations: partnerLocations,
          offers: [...(offers as any[]), ...(perks as any[])].filter(matchesScope),
          events: [...(partnerEvents as any[]), ...(events as any[])].filter(matchesScope),
          campaigns: (campaigns as any[]).filter(matchesScope),
          residents: (residents as any[]).filter(matchesScope),
          reports: (reports as any[]).filter(matchesScope),
          analytics: (analytics as any[]).find(matchesScope),
          qr: (qr as any[]).filter(matchesScope),
        });

        if (mounted) setState({ loading: false, workspace });
      } catch {
        if (mounted) setState((current) => ({ ...current, loading: false }));
      }
    }

    loadWorkspace();
    return () => {
      mounted = false;
    };
  }, [normalizedSlug]);

  return (
    <div>
      {state.loading && (
        <div className="fixed right-4 top-4 z-50 border border-[rgba(11,31,51,0.08)] bg-white px-3 py-2 text-[11px] font-semibold uppercase text-[#8A6A1F]">
          Loading workspace
        </div>
      )}
      <PartnerWorkspaceTemplate {...state.workspace} />
    </div>
  );
}
