import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Building2, Calendar, FileText, Search, Sparkles } from 'lucide-react';
import { frostTowerPartnerTargets, getPlatformAssessment, type IntelligenceCompany, type PlatformAssessment } from '@/data/intelligence/frostTowerPartnerTargets';

const statuses: Record<IntelligenceCompany['status'], string> = {
  identified: 'Identified',
  researching: 'Researching',
  qualified: 'Qualified',
  proposal_generated: 'Proposal generated',
  proposal_sent: 'Proposal sent',
  meeting_requested: 'Meeting requested',
  meeting_scheduled: 'Meeting scheduled',
  meeting_completed: 'Meeting completed',
  registration_started: 'Registration started',
  workspace_created: 'Workspace created',
  campaign_live: 'Campaign live',
  perk_live: 'Perk live',
  active_partner: 'Active partner',
  renewal: 'Renewal',
};

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function companyValue(company: IntelligenceCompany) {
  const base = company.priority === 'high' ? 1200 : company.priority === 'medium' ? 650 : 300;
  return base + company.recommendedAddOns.length * 49;
}

function getCompany(id = '') {
  return frostTowerPartnerTargets.find((company) => company.id === id);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white text-[#0B1F33]">
      <div className="w-full px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
        {children}
      </div>
    </main>
  );
}

function IntelligenceHeader({ title = 'Intelligence', support = 'Turn target companies into partner strategies, proposals, meetings, and workspaces.' }) {
  return (
    <header className="mb-5 border-b border-[rgba(11,31,51,0.08)] pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="border border-[#C8A96A]/60 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em]">Partner development</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">OpenAI agent ready</span>
      </div>
      <h1 className="mt-2 text-[30px] font-semibold leading-none tracking-normal sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-[13px] leading-5 text-[rgba(11,31,51,0.66)]">{support}</p>
    </header>
  );
}

function KpiRail() {
  const highPriority = frostTowerPartnerTargets.filter((company) => company.priority === 'high').length;
  const projectedArr = frostTowerPartnerTargets.reduce((sum, company) => sum + companyValue(company), 0);
  const metrics = [
    ['Companies tracked', frostTowerPartnerTargets.length],
    ['High-priority targets', highPriority],
    ['Proposals generated', 0],
    ['Meetings requested', 0],
    ['Workspaces created', 0],
    ['Projected ARR', money(projectedArr)],
  ];
  return (
    <section className="mb-5 grid gap-2 border-y border-[rgba(11,31,51,0.08)] py-3 sm:grid-cols-3 xl:grid-cols-6">
      {metrics.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{label}</p>
          <p className="mt-1 truncate text-[15px] font-semibold">{value}</p>
        </div>
      ))}
    </section>
  );
}

function RecommendationPanel() {
  const recommendations = [
    'Prioritize Houndstooth, JuiceLand, SoulCycle, Modern Market, and One Taco for the first resident-facing launch.',
    'Create employer proposals for Frost Bank, EY, PIMCO, Rapid7, and Vista Equity Partners.',
    'Use Frost Tower as the first building-wide anchor before expanding to nearby Congress Avenue targets.',
    'Package parking, lunch, wellness, and coffee into a simple launch sequence.',
  ];
  return (
    <section className="mb-5 border border-[rgba(11,31,51,0.08)] bg-white p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#C8A96A]" />
        <h2 className="text-[15px] font-semibold">What Intelligence recommends next</h2>
      </div>
      <ol className="mt-3 grid gap-2 text-[12.5px] leading-5 text-[rgba(11,31,51,0.72)]">
        {recommendations.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}
      </ol>
      <p className="mt-3 border-t border-[rgba(11,31,51,0.08)] pt-3 text-[11px] font-semibold text-[rgba(11,31,51,0.58)]">
        Next phase wires this panel to the server-side OpenAI Intelligence Agent so recommendations are generated from live context.
      </p>
    </section>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="mt-1 h-1.5 bg-[rgba(11,31,51,0.08)]">
        <div className="h-full bg-[#C8A96A]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function PlatformIntelligenceSection({ assessment }: { assessment: PlatformAssessment }) {
  const scores = [
    ['Digital Experience', assessment.experienceScore],
    ['Technology Maturity', assessment.digitalMaturityScore],
    ['Commercial Opportunity', assessment.commercialOpportunityScore],
    ['Strategic Fit', assessment.strategicFitScore],
  ] as const;
  return (
    <section className="border-t border-[#C8A96A] pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#C8A96A]">Platform Intelligence</p>
          <h2 className="mt-1 text-[17px] font-semibold">Digital ecosystem assessment</h2>
        </div>
        <button className="border border-[rgba(11,31,51,0.12)] px-3 py-2 text-[11px] font-semibold hover:border-[#C8A96A]">Refresh research</button>
      </div>
      <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[rgba(11,31,51,0.68)]">
        This assessment positions Downtown Perks as a complement to existing technology: it extends current systems into local discovery, campaigns, map presence, and AI-guided recommendations.
      </p>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-3">
          {scores.map(([label, value]) => <ScoreBar key={label} label={label} value={value} />)}
          <p className="text-[11px] text-[rgba(11,31,51,0.56)]">Research confidence: {assessment.confidenceScore}/100 · {assessment.researchSource}</p>
        </div>
        <div className="overflow-x-auto border border-[rgba(11,31,51,0.08)] [scrollbar-width:thin]">
          <table className="w-full min-w-[640px] table-fixed text-left">
            <thead>
              <tr>
                {['Existing capability', 'Downtown Perks extension', 'Combined experience', 'Business outcome'].map((header) => (
                  <th key={header} className="px-3 py-2 text-[9px] font-bold uppercase text-[rgba(11,31,51,0.52)]">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assessment.complementMatrix.map((row) => (
                <tr key={row.existing} className="border-t border-[rgba(11,31,51,0.06)]">
                  <td className="px-3 py-2 text-[12px] font-semibold">{row.existing}</td>
                  <td className="px-3 py-2 text-[12px]">{row.downtownPerks}</td>
                  <td className="px-3 py-2 text-[12px]">{row.combined}</td>
                  <td className="px-3 py-2 text-[12px]">{row.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div>
          <h3 className="text-[13px] font-semibold">Technology stack</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {assessment.technologyPartners.map((item) => <span key={item} className="border border-[rgba(11,31,51,0.08)] px-2 py-1 text-[11px]">{item}</span>)}
          </div>
        </div>
        <div>
          <h3 className="text-[13px] font-semibold">Capability matrix</h3>
          <div className="mt-2 grid gap-1.5">
            {assessment.capabilities.map((capability) => (
              <p key={capability.name} className="flex justify-between gap-3 border-b border-[rgba(11,31,51,0.06)] pb-1 text-[11px]">
                <span>{capability.name}</span>
                <span className="font-semibold">{capability.status}</span>
              </p>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-[13px] font-semibold">Integration opportunities</h3>
          <div className="mt-2 grid gap-1.5">
            {assessment.integrationOpportunities.map((item) => <p key={item} className="border-b border-[rgba(11,31,51,0.06)] pb-1 text-[11px]">{item}</p>)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-[rgba(11,31,51,0.08)] pt-3 lg:grid-cols-3">
        {assessment.opportunities.map((item) => (
          <div key={item.category} className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{item.category}</p>
            <p className="mt-1 text-[12px] font-semibold">{item.value}</p>
            <p className="mt-1 text-[11px] text-[rgba(11,31,51,0.58)]">Impact {item.impact} · Effort {item.effort} · {item.complexity}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-[rgba(11,31,51,0.08)] pt-3">
        <h3 className="text-[13px] font-semibold">Customer journey</h3>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {['Discover', 'Arrive', 'Enter building', 'Work', 'Lunch', 'Meet', 'Shop', 'Events', 'Home'].map((step, index) => (
            <div key={step} className="min-w-[118px] border border-[rgba(11,31,51,0.08)] px-2 py-2">
              <p className="text-[10px] font-bold uppercase text-[#C8A96A]">{index < 3 ? 'Shared' : index < 6 ? 'Downtown Perks' : 'Partner'}</p>
              <p className="mt-1 text-[12px] font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CompaniesView() {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('all');
  const [partnerType, setPartnerType] = useState('all');
  const companies = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return frostTowerPartnerTargets.filter((company) => {
      const matchesQuery = !needle || `${company.companyName} ${company.industry} ${company.proposedPerk} ${company.campaignStrategy}`.toLowerCase().includes(needle);
      const matchesPriority = priority === 'all' || company.priority === priority;
      const matchesType = partnerType === 'all' || company.partnerType === partnerType;
      return matchesQuery && matchesPriority && matchesType;
    });
  }, [partnerType, priority, query]);

  return (
    <Shell>
      <IntelligenceHeader />
      <KpiRail />
      <RecommendationPanel />
      <section className="mb-4 flex flex-col gap-2 border-b border-[rgba(11,31,51,0.08)] pb-3 lg:flex-row lg:items-center">
        <label className="flex min-h-9 flex-1 items-center gap-2 border border-[rgba(11,31,51,0.08)] px-3">
          <Search className="h-3.5 w-3.5 text-[#C8A96A]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, industry, perk, or campaign" className="w-full bg-transparent text-[12px] outline-none" />
        </label>
        <select value={priority} onChange={(event) => setPriority(event.target.value)} className="min-h-9 border border-[rgba(11,31,51,0.08)] bg-white px-3 text-[12px] font-semibold">
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={partnerType} onChange={(event) => setPartnerType(event.target.value)} className="min-h-9 border border-[rgba(11,31,51,0.08)] bg-white px-3 text-[12px] font-semibold">
          <option value="all">All partner types</option>
          <option value="venue">Venue</option>
          <option value="employer">Employer</option>
          <option value="brand">Brand</option>
          <option value="service">Service</option>
          <option value="real_estate">Real estate</option>
        </select>
      </section>
      <section className="overflow-x-auto border border-[rgba(11,31,51,0.08)] bg-white [scrollbar-width:thin]">
        <table className="w-full min-w-[1180px] table-fixed text-left">
          <thead>
            <tr className="border-b border-[rgba(11,31,51,0.08)]">
              {['Company', 'Industry', 'Building', 'Priority', 'Status', 'Suggested perk', 'Suggested plan', 'Proposal', 'Meeting', 'Workspace', 'Next action'].map((header) => (
                <th key={header} className="px-3 py-2 text-[9px] font-bold uppercase text-[rgba(11,31,51,0.52)]">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="border-b border-[rgba(11,31,51,0.06)] align-top">
                <td className="px-3 py-2 text-[12px] font-semibold"><Link to={`/partner/intelligence/companies/${company.id}`}>{company.companyName}</Link></td>
                <td className="px-3 py-2 text-[12px]">{company.industry}</td>
                <td className="px-3 py-2 text-[12px]">{company.building}</td>
                <td className="px-3 py-2 text-[12px] capitalize">{company.priority}</td>
                <td className="px-3 py-2 text-[12px]">{statuses[company.status]}</td>
                <td className="px-3 py-2 text-[12px]">{company.proposedPerk}</td>
                <td className="px-3 py-2 text-[12px]">{company.suggestedPricingTier}</td>
                <td className="px-3 py-2 text-[12px]">{company.proposalGenerated ? 'Ready' : 'Draft needed'}</td>
                <td className="px-3 py-2 text-[12px]">{company.meetingBooked ? 'Booked' : 'Not booked'}</td>
                <td className="px-3 py-2 text-[12px]">{company.workspaceCreated ? 'Created' : 'Not created'}</td>
                <td className="px-3 py-2 text-[12px]"><Link className="font-semibold text-[#0B1F33] hover:text-[#C8A96A]" to={`/partner/intelligence/companies/${company.id}`}>Open <ArrowRight className="inline h-3 w-3" /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}

function CompanyWorkspace({ company }: { company: IntelligenceCompany }) {
  const assessment = getPlatformAssessment(company);
  const sections = [
    ['Overview', company.summary],
    ['Contacts', company.recommendedDecisionMakerRoles.join(', ')],
    ['Research', company.whyDowntownPerks],
    ['Map Presence', `Recommended map pin, listing, perk, campaign, and Ask the Map placement for ${company.building}.`],
    ['Resident Offering', company.residentValue],
    ['Employee Offering', company.employeeValue],
    ['Campaign Strategy', company.campaignStrategy],
    ['Pricing', `${company.suggestedPricingTier}; estimated first-year value ${money(companyValue(company))}.`],
    ['Activity', `Imported from Frost Tower seed data on ${new Date(company.createdAt).toLocaleDateString()}.`],
  ];
  return (
    <Shell>
      <IntelligenceHeader title={company.companyName} support={`${company.industry} · ${company.building} · ${statuses[company.status]}`} />
      <div className="mb-5 flex flex-wrap gap-2">
        <Link to={`/partner/intelligence/proposals/${company.id}`} className="inline-flex min-h-9 items-center gap-2 border border-[#C8A96A] px-3 text-[12px] font-semibold"><FileText className="h-3.5 w-3.5" /> Generate Executive Proposal</Link>
        <Link to={`/partner/intelligence/meetings/book?companyId=${company.id}`} className="inline-flex min-h-9 items-center gap-2 border border-[rgba(11,31,51,0.12)] px-3 text-[12px] font-semibold"><Calendar className="h-3.5 w-3.5" /> Book meeting</Link>
        <Link to={`/partners/pricing?partnerTarget=${company.id}`} className="inline-flex min-h-9 items-center gap-2 border border-[rgba(11,31,51,0.12)] px-3 text-[12px] font-semibold"><Building2 className="h-3.5 w-3.5" /> Start self-service</Link>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          <PlatformIntelligenceSection assessment={assessment} />
          {sections.map(([title, body]) => (
            <div key={title} className="border-t border-[rgba(11,31,51,0.08)] pt-3">
              <h2 className="text-[15px] font-semibold">{title}</h2>
              <p className="mt-2 text-[13px] leading-5 text-[rgba(11,31,51,0.68)]">{body}</p>
            </div>
          ))}
        </section>
        <aside className="border border-[rgba(11,31,51,0.08)] p-4">
          <h2 className="text-[15px] font-semibold">AI Assistant actions</h2>
          {['Enrich company', 'Identify decision makers', 'Recommend pricing', 'Create follow-up', 'Prepare launch checklist'].map((action) => (
            <button key={action} className="mt-2 block w-full border-b border-[rgba(11,31,51,0.08)] py-2 text-left text-[12px] font-semibold hover:text-[#C8A96A]">{action}</button>
          ))}
        </aside>
      </div>
    </Shell>
  );
}

function ProposalView({ company }: { company: IntelligenceCompany }) {
  const assessment = getPlatformAssessment(company);
  return (
    <Shell>
      <article className="mx-auto max-w-4xl bg-white print:max-w-none">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#C8A96A]">Downtown Perks proposal</p>
        <h1 className="mt-2 text-[34px] font-semibold leading-none sm:text-5xl">{company.companyName} x Downtown Perks</h1>
        <p className="mt-4 max-w-3xl text-[14px] leading-6 text-[rgba(11,31,51,0.68)]">{company.whyDowntownPerks}</p>
        {[
          ['Executive summary', company.summary],
          ['Current digital ecosystem', `Current platform signals include ${assessment.technologyPartners.join(', ') || 'website and basic business presence'}. The goal is to increase the value of those investments, not replace them.`],
          ['Platform capability assessment', `Digital maturity ${assessment.digitalMaturityScore}/100, experience ${assessment.experienceScore}/100, strategic fit ${assessment.strategicFitScore}/100.`],
          ['Strategic complement analysis', assessment.complementMatrix.map((row) => `${row.existing}: Downtown Perks extends this with ${row.downtownPerks.toLowerCase()} so the combined experience delivers ${row.outcome.toLowerCase()}.`).join(' ')],
          ['Recommended integration strategy', assessment.integrationOpportunities.join(', ')],
          ['Why now', `${company.building} gives Downtown Perks a clear launch anchor for residents, workers, guests, and nearby services.`],
          ['Opportunity', company.outreachAngle],
          ['Resident offering', company.residentValue],
          ['Employee offering', company.employeeValue],
          ['Map presence', `Add or verify the map pin, listing, search result, perk placement, and campaign placement for ${company.companyName}.`],
          ['Campaign launch plan', company.campaignStrategy],
          ['Pricing summary', `${company.suggestedPricingTier}. Recommended add-ons: ${company.recommendedAddOns.join(', ')}.`],
          ['What happens next', 'Confirm the decision-maker, review the proposal, choose the launch plan, and create the partner workspace.'],
        ].map(([title, body]) => (
          <section key={title} className="mt-5 border-t border-[rgba(11,31,51,0.08)] pt-4">
            <h2 className="text-[15px] font-semibold">{title}</h2>
            <p className="mt-2 text-[13px] leading-5 text-[rgba(11,31,51,0.7)]">{body}</p>
          </section>
        ))}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-[#C8A96A] pt-4">
          <Link to={`/partner/intelligence/meetings/book?companyId=${company.id}&proposalId=${company.id}`} className="inline-flex min-h-9 items-center border border-[#C8A96A] px-3 text-[12px] font-semibold">Book meeting</Link>
          <Link to={`/partners/pricing?partnerTarget=${company.id}&proposal=${company.id}&recommendedPlan=${encodeURIComponent(company.suggestedPricingTier)}`} className="inline-flex min-h-9 items-center border border-[rgba(11,31,51,0.12)] px-3 text-[12px] font-semibold">Self-service setup</Link>
        </div>
      </article>
    </Shell>
  );
}

export default function PartnerIntelligence() {
  const { companyId, proposalId, shareToken } = useParams();
  const company = getCompany(companyId || proposalId || shareToken || '');
  if (companyId && company) return <CompanyWorkspace company={company} />;
  if ((proposalId || shareToken) && company) return <ProposalView company={company} />;
  if (companyId || proposalId || shareToken) {
    return (
      <Shell>
        <IntelligenceHeader title="Proposal not found" support="This Intelligence record does not exist yet." />
        <Link to="/partner/intelligence" className="text-[12px] font-semibold hover:text-[#C8A96A]">Back to Intelligence</Link>
      </Shell>
    );
  }
  return <CompaniesView />;
}
