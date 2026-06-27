import { theShoreWorkspace } from '@/data/theShoreWorkspace';
import type { PartnerWorkspaceData } from '@/types/partnerWorkspace';

type WorkspaceSeed = {
  slug: string;
  name: string;
  type: string;
  district?: string;
  address?: string;
  description: string;
  audience: string;
  managerNotes: string;
  amenities: string[];
  anchors: string[];
  plan?: string;
};

type WorkspaceRecords = {
  partner?: any;
  tenant?: any;
  profile?: any;
  locations?: any[];
  offers?: any[];
  events?: any[];
  campaigns?: any[];
  reports?: any[];
  analytics?: any;
  qr?: any[];
};

const defaultSteps = ['Start', 'Profile', 'Map', 'Perks', 'Events', 'Broadcasts', 'Codes', 'Reports', 'Plan'];
const heroImage = '/workspace-media/images/the-shore-building.jpg';

export function slugify(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const seeds: WorkspaceSeed[] = [
  {
    slug: 'dana',
    name: 'DANA',
    type: 'Civic Partner',
    district: 'Downtown Austin',
    address: 'Downtown Austin Neighborhood Association',
    description: 'DANA has a dedicated civic workspace for resident updates, neighborhood programs, meetings, advocacy follow-up, and downtown reporting.',
    audience: 'Downtown residents, neighborhood advocates, property teams, and civic partners who need a clear read on what is happening nearby.',
    managerNotes: 'Keep the civic calendar, resident-facing updates, district alerts, and meeting follow-up in one place.',
    amenities: ['Civic updates', 'Resident surveys', 'District broadcasts', 'Meeting reminders', 'Partner reports'],
    anchors: ['Downtown Austin', 'Rainey', 'Waterloo Greenway', '2nd Street District', 'Congress Avenue'],
    plan: 'Civic Partner Workspace',
  },
  {
    slug: 'daa',
    name: 'DAA',
    type: 'Civic Partner',
    district: 'Downtown Austin',
    address: 'Downtown Austin',
    description: 'DAA has a downtown operations workspace for district activation, stakeholder updates, campaign reporting, and civic programming.',
    audience: 'Downtown stakeholders, property teams, hospitality partners, civic operators, and people planning public-facing downtown work.',
    managerNotes: 'Use this space for district programs, stakeholder notes, downtown updates, and reporting that needs to stay easy to share.',
    amenities: ['District programs', 'Stakeholder updates', 'Campaign reports', 'Public realm notes', 'Partner outreach'],
    anchors: ['Congress Avenue', '2nd Street District', 'Warehouse District', 'Waterloo', 'Downtown Austin'],
    plan: 'Civic Partner Workspace',
  },
  {
    slug: 'downtown-austin-alliance',
    name: 'Downtown Austin Alliance',
    type: 'Civic Organization',
    district: 'Downtown Austin',
    address: 'Downtown Austin',
    description: 'Downtown Austin Alliance has a civic workspace for district programs, stakeholder updates, city-facing reporting, and partner coordination.',
    audience: 'Civic leaders, downtown partners, building teams, hospitality groups, and operators who need one place to understand downtown activity.',
    managerNotes: 'Keep public programs, district signals, stakeholder updates, and reporting paths organized here.',
    amenities: ['District reporting', 'Program updates', 'Partner directory', 'Campaign notes', 'Civic insights'],
    anchors: ['Downtown Austin', 'Congress Avenue', 'Waterloo Greenway', 'Republic Square', '2nd Street District'],
    plan: 'Civic Partner Workspace',
  },
  {
    slug: 'waterloo-greenway',
    name: 'Waterloo Greenway',
    type: 'Civic / Parks Partner',
    district: 'Waterloo',
    address: '500 E 12th St, Austin, TX',
    description: 'Waterloo Greenway has a workspace for park programming, event discovery, resident invitations, campaign reporting, and civic partner coordination.',
    audience: 'Residents, event guests, civic partners, park visitors, and cultural operators looking for what is happening around Waterloo.',
    managerNotes: 'Use this to keep park events, partner notes, QR placements, and attendance follow-up in one place.',
    amenities: ['Park programs', 'Event calendar', 'QR entry points', 'Resident invitations', 'Civic reports'],
    anchors: ['Waterloo Park', 'Moody Amphitheater', 'Downtown Austin', 'Texas Capitol', 'Red River'],
    plan: 'Civic / Parks Workspace',
  },
  {
    slug: 'waterloo-greenway-conservancy',
    name: 'Waterloo Greenway Conservancy',
    type: 'Civic / Parks Partner',
    district: 'Waterloo',
    address: 'Waterloo Greenway, Austin, TX',
    description: 'Waterloo Greenway Conservancy has a partner workspace for programming, civic storytelling, event follow-up, and district reporting.',
    audience: 'Park supporters, civic partners, event guests, residents, and cultural teams.',
    managerNotes: 'Keep programs, partner campaigns, QR paths, and post-event reports ready for review.',
    amenities: ['Programming', 'Civic storytelling', 'Event follow-up', 'Partner reports', 'QR tracking'],
    anchors: ['Waterloo Park', 'Moody Amphitheater', 'Red River', 'Downtown Austin'],
    plan: 'Civic / Parks Workspace',
  },
  {
    slug: 'inkind',
    name: 'inKind',
    type: 'Brand Partner',
    district: 'Downtown Austin',
    address: 'Downtown Austin',
    description: 'inKind has a brand workspace for restaurant partner visibility, offer ideas, dining campaigns, and performance reporting.',
    audience: 'Restaurant partners, resident diners, hotel guests, campaign teams, and downtown hospitality operators.',
    managerNotes: 'Use this workspace to keep dining partners, campaign ideas, redemptions, and partner reports together.',
    amenities: ['Restaurant network', 'Dining campaigns', 'Offer testing', 'Redemption reporting', 'Partner outreach'],
    anchors: ['TenTen', 'Ember Kitchen', 'The Guest House', 'Downtown Austin', 'Rainey'],
    plan: 'Brand Partner Workspace',
  },
  {
    slug: 'legends',
    name: 'Legends',
    type: 'Property Partner',
    district: 'Downtown Austin',
    address: 'Downtown Austin',
    description: 'Legends has a property workspace for residential listings, neighborhood context, campaign follow-up, leads, and property reporting.',
    audience: 'Property teams, residents, prospective residents, real estate partners, and people comparing downtown buildings.',
    managerNotes: 'Keep listings, featured buildings, neighborhood notes, and follow-up reports ready for a walkthrough.',
    amenities: ['Listings', 'Property reports', 'Lead notes', 'Neighborhood context', 'Campaign follow-up'],
    anchors: ['The Shore', 'The Independent', '301 West Ave', 'Seaholm', 'Rainey'],
    plan: 'Property Partner Workspace',
  },
  {
    slug: 'legends-property',
    name: 'Legends Property',
    type: 'Property Partner',
    district: 'Seaholm / Downtown Austin',
    address: '301 West Ave, Austin, TX',
    description: 'Legends Property has a workspace for property records, listings, resident signals, local context, and reporting.',
    audience: 'Property teams, leasing partners, residents, prospects, and neighborhood operators.',
    managerNotes: 'Use this for listing context, resident-facing local notes, and property performance reports.',
    amenities: ['Property profile', 'Listing context', 'Resident signals', 'Partner reporting', 'Campaign notes'],
    anchors: ['301 West Ave', 'Seaholm', 'Lady Bird Lake', '2nd Street District'],
    plan: 'Property Partner Workspace',
  },
  {
    slug: 'the-waterline',
    name: 'The Waterline',
    type: 'Property Partner',
    district: 'Rainey / Waterfront',
    address: 'Downtown Austin',
    description: 'The Waterline has a property workspace for resident discovery, nearby campaigns, QR placements, and reports.',
    audience: 'Residents, leasing teams, hotel guests, nearby partners, and downtown operators.',
    managerNotes: 'Keep the property profile, welcome paths, campaigns, and nearby partner recommendations in one place.',
    amenities: ['Resident discovery', 'QR placements', 'Nearby recommendations', 'Partner reports', 'Campaign notes'],
    anchors: ['Rainey', 'Lady Bird Lake', 'The Shore', 'Hotel Van Zandt'],
    plan: 'Property Partner Workspace',
  },
  {
    slug: 'the-paseo',
    name: 'The Paseo',
    type: 'Property Partner',
    district: 'Downtown Austin',
    address: 'Downtown Austin',
    description: 'The Paseo has a property workspace for resident onboarding, neighborhood discovery, campaigns, and reporting.',
    audience: 'Residents, property teams, leasing teams, and nearby local partners.',
    managerNotes: 'Use this space for resident welcome paths, nearby partner picks, and recurring reports.',
    amenities: ['Resident onboarding', 'Local picks', 'Offer tracking', 'Reports', 'QR paths'],
    anchors: ['Downtown Austin', '2nd Street District', 'Congress Avenue', 'Waterloo'],
    plan: 'Property Partner Workspace',
  },
  {
    slug: 'yeti',
    name: 'YETI',
    type: 'Brand Partner',
    district: 'Austin / Downtown',
    address: 'Austin, TX',
    description: 'YETI has a brand workspace for local activations, campaign moments, audience signals, and sponsor-ready reports.',
    audience: 'Brand teams, residents, visitors, event partners, and campaign operators.',
    managerNotes: 'Keep activations, campaign assets, local audiences, and reportable outcomes together.',
    amenities: ['Brand campaigns', 'Activation planning', 'Audience signals', 'Sponsor reports', 'Event tie-ins'],
    anchors: ['Downtown Austin', 'Lady Bird Lake', 'Waterloo', 'Rainey'],
    plan: 'Brand Partner Workspace',
  },
  {
    slug: 'rivian',
    name: 'Rivian',
    type: 'Brand Partner',
    district: 'Downtown Austin',
    address: 'Austin, TX',
    description: 'Rivian has a brand workspace for mobility activations, local campaigns, event tie-ins, and audience reporting.',
    audience: 'Brand teams, mobility partners, residents, visitors, and downtown event operators.',
    managerNotes: 'Use this for local mobility moments, campaign planning, and reports tied to downtown behavior.',
    amenities: ['Mobility campaigns', 'Event tie-ins', 'Audience insights', 'Partner reports', 'QR tracking'],
    anchors: ['Downtown Austin', 'Waterloo', 'Rainey', 'Congress Avenue'],
    plan: 'Brand Partner Workspace',
  },
  {
    slug: 'lululemon',
    name: 'lululemon',
    type: 'Brand Partner',
    district: 'Downtown Austin',
    address: 'Austin, TX',
    description: 'lululemon has a brand workspace for wellness programming, resident invitations, events, and reporting.',
    audience: 'Residents, wellness partners, retail teams, event guests, and downtown operators.',
    managerNotes: 'Keep wellness events, campaign notes, resident invites, and partner performance in one place.',
    amenities: ['Wellness programs', 'Resident invites', 'Event reporting', 'Campaign notes', 'Partner outreach'],
    anchors: ['Waterloo Park', 'Lady Bird Lake', 'Downtown Austin', '2nd Street District'],
    plan: 'Brand Partner Workspace',
  },
  {
    slug: 'topo-chico',
    name: 'Topo Chico',
    type: 'Brand Partner',
    district: 'Downtown Austin',
    address: 'Austin, TX',
    description: 'Topo Chico has a brand workspace for beverage moments, event tie-ins, hospitality campaigns, and reporting.',
    audience: 'Hospitality partners, brand teams, residents, visitors, and event operators.',
    managerNotes: 'Use this for campaign ideas, partner placements, event moments, and sponsor-ready reports.',
    amenities: ['Hospitality campaigns', 'Event tie-ins', 'Partner placements', 'QR tracking', 'Reports'],
    anchors: ['Rainey', 'Waterloo', 'Downtown Austin', 'Hotel partners'],
    plan: 'Brand Partner Workspace',
  },
];

export const curatedPartnerWorkspaces = Object.fromEntries(seeds.map((seed) => [seed.slug, seed]));

export function getFeaturedWorkspaceSlugs() {
  return seeds.map((seed) => seed.slug);
}

function metricBase(seed: WorkspaceSeed) {
  const base = seed.slug.length * 17;
  return {
    scans: 60 + base,
    saves: 24 + (base % 80),
    redemptions: seed.type.toLowerCase().includes('civic') ? 0 : 8 + (base % 34),
    views: 180 + base * 2,
  };
}

export function buildPartnerWorkspaceFromSeed(seed: WorkspaceSeed): PartnerWorkspaceData {
  if (seed.slug === 'the-shore') return theShoreWorkspace;
  const metrics = metricBase(seed);
  const id = seed.slug;
  const partnerId = `partner-${id}`;

  return {
    partner: {
      id: partnerId,
      name: seed.name,
      type: seed.type,
      district: seed.district || 'Downtown Austin',
      address: seed.address || 'Downtown Austin',
      status: 'Founding Partner',
      setupSteps: defaultSteps,
    },
    lead: {
      id: `lead-${id}`,
      organizationName: seed.name,
      partnerType: seed.type,
      contactName: '',
      email: '',
      phone: '',
      address: seed.address || 'Downtown Austin',
      unitCount: seed.type.toLowerCase().includes('property') ? 120 : 0,
      selectedPlan: seed.plan || 'Partner Workspace',
      selectedAddOns: ['QR Kit', 'Monthly Report'],
      notes: seed.managerNotes,
      status: 'Workspace created',
      createdAt: '2026-06-26T09:00:00.000Z',
    },
    profile: {
      id: `profile-${id}`,
      propertyName: seed.name,
      address: seed.address || 'Downtown Austin',
      district: seed.district || 'Downtown Austin',
      heroImage,
      description: seed.description,
      residentAudience: seed.audience,
      buildingAmenities: seed.amenities,
      nearbyAnchors: seed.anchors,
      contactPerson: `${seed.name} team`,
      managerNotes: seed.managerNotes,
      residentFacingCopy: seed.description,
    },
    qrs: [
      { id: `qr-${id}-profile`, name: 'Profile code', placement: 'Partner profile', destination: `/workspaces/${id}`, status: 'Active', scans: metrics.scans, lastScan: 'Today', conversionSignal: `${metrics.saves} people saved or opened this page` },
      { id: `qr-${id}-campaign`, name: 'Campaign code', placement: 'Campaign material', destination: `/campaigns?partner=${id}`, status: 'Active', scans: Math.round(metrics.scans * 0.62), lastScan: 'Yesterday', conversionSignal: 'Campaign traffic is ready to review' },
      { id: `qr-${id}-report`, name: 'Report link', placement: 'Monthly report', destination: `/reports?partner=${id}`, status: 'Draft', scans: 0, lastScan: 'Not sent', conversionSignal: 'Ready for the next report' },
    ],
    perks: [
      { id: `perk-${id}-feature`, partner: seed.name, offerTitle: `${seed.name} feature`, description: `A clean partner feature for ${seed.name} that can be used in resident, visitor, or stakeholder campaigns.`, eligibility: 'Downtown Perks audience', startDate: '2026-06-26', endDate: '2026-09-30', status: 'Active', saves: metrics.saves, redemptions: metrics.redemptions, qrScans: metrics.scans, location: seed.address || 'Downtown Austin', calendarDate: '2026-07-10T17:00:00' },
      { id: `perk-${id}-welcome`, partner: seed.name, offerTitle: 'Welcome moment', description: 'A starter activation for people discovering this partner through Downtown Perks.', eligibility: 'Partner audience', startDate: '2026-07-01', endDate: '2026-10-01', status: 'Scheduled', saves: Math.round(metrics.saves * 0.55), redemptions: Math.round(metrics.redemptions * 0.4), qrScans: Math.round(metrics.scans * 0.38), location: seed.address || 'Downtown Austin', calendarDate: '2026-07-20T17:00:00' },
    ],
    events: [
      { id: `event-${id}-intro`, title: `${seed.name} intro`, dateTime: '2026-07-18T23:00:00', location: seed.address || 'Downtown Austin', description: `A simple activation moment for ${seed.name}.`, rsvpCount: Math.max(12, Math.round(metrics.saves * 0.45)), capacity: 90, status: 'Published', linkedQR: 'Profile code', linkedCampaign: 'Welcome campaign' },
      { id: `event-${id}-report`, title: `${seed.name} monthly check-in`, dateTime: '2026-08-06T18:00:00', location: 'Downtown Perks workspace', description: 'Review what worked, what people opened, and what should happen next.', rsvpCount: 8, capacity: 20, status: 'Scheduled', linkedQR: 'Report link', linkedCampaign: 'Monthly report' },
    ],
    campaigns: [
      { id: `campaign-${id}-welcome`, name: 'Welcome campaign', audience: seed.audience, channel: 'Workspace + QR + partner note', linkedItems: ['Profile code', `${seed.name} feature`], sendStatus: 'Live', opensViews: metrics.views, saves: metrics.saves, redemptions: metrics.redemptions, qrScans: metrics.scans },
      { id: `campaign-${id}-monthly`, name: 'Monthly partner note', audience: 'Partner and operator review', channel: 'Report export', linkedItems: ['Report link', 'Monthly check-in'], sendStatus: 'Draft', opensViews: 0, saves: 0, redemptions: 0, qrScans: 0 },
    ],
    residents: [
      { id: `audience-${id}-1`, name: 'Resident audience', unit: 'Downtown', email: 'resident-audience@downtownperks.local', moveInDate: '2026-06-26', interests: seed.anchors.slice(0, 3), savedPerks: Math.round(metrics.saves * 0.4), rsvps: 2, engagementStatus: 'Active resident' },
      { id: `audience-${id}-2`, name: 'Partner audience', unit: 'Partner', email: 'partner-audience@downtownperks.local', moveInDate: '2026-06-26', interests: seed.amenities.slice(0, 3), savedPerks: Math.round(metrics.saves * 0.28), rsvps: 1, engagementStatus: 'Perk saver' },
    ],
    reports: [
      { id: `metric-${id}-views`, label: 'Views', value: String(metrics.views), change: '+12%', explanation: `${seed.name} has a live partner profile ready for walkthroughs.` },
      { id: `metric-${id}-saves`, label: 'Saves', value: String(metrics.saves), change: '+8%', explanation: 'Saves show where people are showing interest.' },
      { id: `metric-${id}-scans`, label: 'Code scans', value: String(metrics.scans), change: '+10%', explanation: 'QR activity is connected to this workspace.' },
      { id: `metric-${id}-redemptions`, label: 'Actions', value: String(metrics.redemptions), change: '+5%', explanation: 'Actions roll into partner reporting.' },
    ],
    billing: {
      id: `plan-${id}`,
      name: seed.plan || 'Partner Workspace',
      price: 199,
      cadence: 'year',
      addOns: ['QR Kit', 'Monthly Report', 'Campaign Support', 'Partner Directory'],
      conversionState: 'Founding Partner',
      couponCodes: { DUDE2026: 100 },
    },
    trendingLocations: seed.anchors.map((anchor, index) => ({
      id: `trend-${id}-${index}`,
      name: anchor,
      category: index === 0 ? 'Primary anchor' : 'Nearby signal',
      anonymizedCheckIns: Math.max(12, metrics.saves - index * 8),
      trend: index === 0 ? 'Active now' : 'Worth watching',
      distance: index === 0 ? 'Main context' : 'Nearby',
    })),
    favorites: seed.anchors.slice(0, 4).map((anchor, index) => ({
      id: `fav-${id}-${index}`,
      type: index === 0 ? 'Venue' : index === 1 ? 'Event' : 'Perk',
      name: anchor,
      detail: `${seed.name} workspace anchor`,
      saved: index < 2,
    })),
  };
}

export function buildWorkspaceFromRecords(slug: string, records: WorkspaceRecords): PartnerWorkspaceData {
  const requestedSlug = slugify(slug || 'the-shore');
  const curated = curatedPartnerWorkspaces[requestedSlug];
  if (curated) return buildPartnerWorkspaceFromSeed(curated);
  if (requestedSlug === 'the-shore') return theShoreWorkspace;

  const name =
    records.profile?.display_name ||
    records.partner?.business_name ||
    records.tenant?.name ||
    records.locations?.[0]?.name ||
    slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  const type = records.profile?.type || records.partner?.category || records.tenant?.type || records.locations?.[0]?.category || 'Partner';
  const address = records.profile?.address || records.partner?.address || records.locations?.[0]?.address || 'Downtown Austin';

  return buildPartnerWorkspaceFromSeed({
    slug: requestedSlug,
    name,
    type,
    address,
    district: records.profile?.district || records.partner?.district || 'Downtown Austin',
    description: `${name} has a Downtown Perks workspace with profile, map presence, codes, campaigns, reports, and partner activity in one place.`,
    audience: `${name} audience, residents, visitors, partner teams, and downtown operators.`,
    managerNotes: 'Use this workspace to keep partner setup, map visibility, outreach, reports, and next actions in good order.',
    amenities: ['Profile', 'Map presence', 'QR codes', 'Campaigns', 'Reports'],
    anchors: [name, 'Downtown Austin', 'Partner network', 'Reports'],
    plan: 'Partner Workspace',
  });
}

export function getCuratedWorkspace(slug: string) {
  const normalized = slugify(slug);
  if (normalized === 'the-shore') return theShoreWorkspace;
  const seed = curatedPartnerWorkspaces[normalized];
  return seed ? buildPartnerWorkspaceFromSeed(seed) : null;
}
