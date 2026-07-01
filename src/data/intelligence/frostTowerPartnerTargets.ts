export type IntelligenceStatus =
  | 'identified'
  | 'researching'
  | 'qualified'
  | 'proposal_generated'
  | 'proposal_sent'
  | 'meeting_requested'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'registration_started'
  | 'workspace_created'
  | 'campaign_live'
  | 'perk_live'
  | 'active_partner'
  | 'renewal';

export type IntelligenceCompany = {
  id: string;
  companyName: string;
  industry: string;
  subcategory?: string;
  priority: 'high' | 'medium' | 'low';
  status: IntelligenceStatus;
  website?: string;
  address: string;
  building: string;
  latitude: number;
  longitude: number;
  officeType: 'tenant' | 'retail' | 'restaurant' | 'service' | 'property' | 'hotel' | 'civic' | 'brand';
  partnerType: 'property' | 'hotel' | 'venue' | 'brand' | 'civic' | 'real_estate' | 'employer';
  summary: string;
  whyDowntownPerks: string;
  residentValue: string;
  employeeValue: string;
  proposedPerk: string;
  campaignStrategy: string;
  suggestedPricingTier: string;
  recommendedAddOns: string[];
  recommendedDecisionMakerRoles: string[];
  outreachAngle: string;
  workspaceCreated: boolean;
  proposalGenerated: boolean;
  meetingBooked: boolean;
  pricingViewed: boolean;
  registrationStarted: boolean;
  registrationCompleted: boolean;
  researchConfidence: 'verified' | 'likely' | 'needs_review';
  createdAt: string;
  updatedAt: string;
};

export type CapabilityStatus = 'Available' | 'Partial' | 'Unavailable' | 'Unknown';

export type PlatformAssessment = {
  partnerId: string;
  researchDate: string;
  confidenceScore: number;
  researchSource: string;
  website: CapabilityStatus;
  mobileApps: CapabilityStatus;
  tenantPortal: CapabilityStatus;
  employeePlatform: CapabilityStatus;
  crm: CapabilityStatus;
  marketingAutomation: CapabilityStatus;
  emailPlatform: CapabilityStatus;
  eventPlatform: CapabilityStatus;
  bookingPlatform: CapabilityStatus;
  parkingPlatform: CapabilityStatus;
  loyaltyPlatform: CapabilityStatus;
  paymentsPlatform: CapabilityStatus;
  analyticsPlatform: CapabilityStatus;
  socialChannels: CapabilityStatus;
  technologyPartners: string[];
  aiCapabilities: CapabilityStatus;
  apiAvailability: CapabilityStatus;
  integrationOpportunities: string[];
  digitalMaturityScore: number;
  experienceScore: number;
  commercialOpportunityScore: number;
  strategicFitScore: number;
  capabilities: Array<{ name: string; status: CapabilityStatus }>;
  complementMatrix: Array<{ existing: string; downtownPerks: string; combined: string; outcome: string }>;
  opportunities: Array<{ category: string; impact: string; effort: string; value: string; complexity: string }>;
  recommendations: string[];
};

const createdAt = '2026-07-01T00:00:00.000Z';
const frostTowerAddress = '401 Congress Ave, Austin, TX 78701';

const roleTargets = {
  employer: ['Workplace Experience Lead', 'Office Manager', 'People Operations Lead', 'Marketing Director'],
  venue: ['General Manager', 'Marketing Manager', 'Partnerships Lead'],
  property: ['Property Manager', 'Tenant Experience Manager', 'Leasing Director'],
  service: ['General Manager', 'Marketing Director', 'Partnerships Lead'],
  realEstate: ['Asset Manager', 'Leasing Director', 'Property Manager'],
};

function target(
  companyName: string,
  industry: string,
  partnerType: IntelligenceCompany['partnerType'],
  priority: IntelligenceCompany['priority'],
  proposedPerk: string,
  campaignStrategy: string,
  roles: string[],
): IntelligenceCompany {
  const id = `intel_frost_${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
  const isVenue = partnerType === 'venue';
  const isEmployer = partnerType === 'employer';
  return {
    id,
    companyName,
    industry,
    priority,
    status: priority === 'high' ? 'qualified' : 'identified',
    address: frostTowerAddress,
    building: 'Frost Tower',
    latitude: 30.26689,
    longitude: -97.74216,
    officeType: isVenue ? 'restaurant' : partnerType === 'real_estate' ? 'property' : partnerType === 'property' ? 'property' : isEmployer ? 'tenant' : 'service',
    partnerType,
    summary: `${companyName} is a Frost Tower target for Downtown Perks partner development.`,
    whyDowntownPerks: isVenue
      ? `${companyName} can turn nearby resident, guest, and office traffic into measurable visits.`
      : `${companyName} can use Downtown Perks to connect employees, clients, tenants, or visitors to useful downtown places and offers.`,
    residentValue: isVenue ? 'A nearby place residents can discover, save, and visit.' : 'A useful downtown connection that improves daily routines and neighborhood access.',
    employeeValue: isEmployer ? 'A simple way for employees and clients to find nearby food, services, events, and offers.' : 'More qualified local attention from people already nearby.',
    proposedPerk,
    campaignStrategy,
    suggestedPricingTier: isEmployer ? 'Employer / Brand campaign' : isVenue ? 'Venue campaign' : 'Partner workspace',
    recommendedAddOns: isVenue ? ['Featured offer', 'QR placement', 'Launch broadcast'] : ['Proposal brief', 'Map presence', 'Launch campaign'],
    recommendedDecisionMakerRoles: roles,
    outreachAngle: isVenue
      ? `Lead with a practical nearby offer for residents, guests, and Frost Tower employees.`
      : `Lead with a Frost Tower district strategy that helps people use downtown better.`,
    workspaceCreated: false,
    proposalGenerated: false,
    meetingBooked: false,
    pricingViewed: false,
    registrationStarted: false,
    registrationCompleted: false,
    researchConfidence: 'likely',
    createdAt,
    updatedAt: createdAt,
  };
}

export const frostTowerPartnerTargets: IntelligenceCompany[] = [
  target('Alpine Investors', 'Investment firm', 'employer', 'medium', 'Employee downtown guide', 'Frost Tower employee engagement launch', roleTargets.employer),
  target('Amherst', 'Real estate investment', 'real_estate', 'medium', 'Neighborhood context for clients and teams', 'Congress corridor real estate visibility', roleTargets.realEstate),
  target('DivcoWest', 'Real estate', 'real_estate', 'medium', 'Tenant experience map placement', 'Office tenant experience campaign', roleTargets.realEstate),
  target('Endeavor Real Estate Group', 'Real estate', 'real_estate', 'high', 'Downtown listings and tenant experience guide', 'Frost Tower district anchor strategy', roleTargets.realEstate),
  target('Equiem', 'Tenant experience platform', 'brand', 'high', 'Building-wide tenant experience collaboration', 'Connected workplace pilot', roleTargets.property),
  target('Ernst & Young', 'Professional services', 'employer', 'high', 'Client lunch and after-work guide', 'Client Lunch Loop', roleTargets.employer),
  target('Frost Bank', 'Financial services', 'employer', 'high', 'Employee and client downtown advantage guide', 'Downtown Advantage', roleTargets.employer),
  target('Frost Bank Branch', 'Bank branch', 'service', 'medium', 'Nearby banking resource placement', 'Easy errands downtown', roleTargets.service),
  target('Frost Insurance Agency, Inc.', 'Insurance', 'service', 'medium', 'Professional service listing', 'Business services around Frost Tower', roleTargets.service),
  target('Graves, Dougherty, Hearon & Moody, P.C.', 'Law firm', 'employer', 'medium', 'Client hospitality and nearby dining guide', 'Client visit guide', roleTargets.employer),
  target('Houndstooth Coffee', 'Coffee', 'venue', 'high', 'Resident coffee perk or morning feature', 'Morning Momentum', roleTargets.venue),
  target('Insight Global, LLC', 'Staffing', 'employer', 'medium', 'Employee downtown guide', 'Team lunch and after-work map', roleTargets.employer),
  target('JuiceLand', 'Juice and wellness', 'venue', 'high', 'Lunch reset or wellness perk', 'Lunch Reset', roleTargets.venue),
  target('Kane Russell Coleman Logan, PC', 'Law firm', 'employer', 'medium', 'Client and employee downtown guide', 'Client visit guide', roleTargets.employer),
  target('Maxwell, Locke & Ritter, LLP', 'Accounting', 'employer', 'medium', 'Employee lunch and services guide', 'Office Lunch Lift', roleTargets.employer),
  target('Metropolis Parking', 'Parking', 'service', 'high', 'Easier arrival parking placement', 'Easier Arrival', roleTargets.service),
  target('Modern Market', 'Restaurant', 'venue', 'high', 'Office lunch perk or featured meal offer', 'Office Lunch Lift', roleTargets.venue),
  target('Oak View Group', 'Venue management', 'brand', 'medium', 'Event and audience activation strategy', 'Downtown event visibility', roleTargets.employer),
  target('Ohana Real Estate', 'Real estate', 'real_estate', 'medium', 'Portfolio visibility and nearby context', 'Downtown property context', roleTargets.realEstate),
  target('One Taco', 'Restaurant', 'venue', 'high', 'Quick lunch or happy hour offer', 'Quick lunch launch', roleTargets.venue),
  target('Pacific Investment Management Company LLC', 'Investment management', 'employer', 'high', 'Employee and client downtown guide', 'Downtown client experience', roleTargets.employer),
  target('Rapid7, Inc.', 'Technology', 'employer', 'high', 'Employee experience and after-work guide', 'After-work tech team guide', roleTargets.employer),
  target('Reed Smith', 'Law firm', 'employer', 'medium', 'Client hospitality guide', 'Client lunch loop', roleTargets.employer),
  target('Scout Security', 'Security services', 'service', 'low', 'Local service listing', 'Frost Tower service network', roleTargets.service),
  target('Slayden Grubert Beard, PLLC', 'Law firm', 'employer', 'medium', 'Client and employee downtown guide', 'Client visit guide', roleTargets.employer),
  target('SoulCycle', 'Fitness', 'venue', 'high', 'After-work ride or wellness perk', 'After Work Ride', roleTargets.venue),
  target('Vista Equity Partners', 'Investment firm', 'employer', 'high', 'Employee and client downtown guide', 'Premium workplace guide', roleTargets.employer),
];

export function getPlatformAssessment(company: IntelligenceCompany): PlatformAssessment {
  const isVenue = company.partnerType === 'venue';
  const isEmployer = company.partnerType === 'employer';
  const isRealEstate = company.partnerType === 'real_estate';
  const isService = company.partnerType === 'service';
  const isEquiem = /equiem/i.test(company.companyName);
  const isParking = /parking|metropolis/i.test(`${company.companyName} ${company.industry}`);
  const isRestaurant = isVenue && /restaurant|taco|market|coffee|juice|fitness/i.test(`${company.industry} ${company.companyName}`);
  const technologyPartners = [
    'Google Maps',
    isEquiem ? 'Equiem' : '',
    isParking ? 'Metropolis' : '',
    isRestaurant ? 'Toast / POS likely' : '',
    isEmployer ? 'Microsoft 365 / Google Workspace likely' : '',
  ].filter(Boolean);
  return {
    partnerId: company.id,
    researchDate: createdAt,
    confidenceScore: company.researchConfidence === 'verified' ? 90 : company.priority === 'high' ? 76 : 66,
    researchSource: 'Frost Tower seed assessment; requires live OpenAI/web refresh in Phase 2',
    website: 'Unknown',
    mobileApps: isEquiem ? 'Available' : 'Unknown',
    tenantPortal: isEquiem || isRealEstate ? 'Partial' : 'Unknown',
    employeePlatform: isEmployer ? 'Partial' : 'Unknown',
    crm: 'Unknown',
    marketingAutomation: isVenue ? 'Partial' : 'Unknown',
    emailPlatform: 'Unknown',
    eventPlatform: isVenue ? 'Partial' : 'Unknown',
    bookingPlatform: isVenue ? 'Partial' : 'Unknown',
    parkingPlatform: isParking ? 'Available' : 'Unknown',
    loyaltyPlatform: isVenue ? 'Partial' : 'Unknown',
    paymentsPlatform: isVenue || isParking ? 'Available' : 'Unknown',
    analyticsPlatform: 'Partial',
    socialChannels: isVenue ? 'Partial' : 'Unknown',
    technologyPartners,
    aiCapabilities: 'Unknown',
    apiAvailability: isEquiem || isParking ? 'Partial' : 'Unknown',
    integrationOpportunities: [
      'Google Maps placement',
      'Partner workspace',
      'OpenAI recommendation layer',
      isVenue ? 'Offer and campaign publishing' : 'Employee/client downtown guide',
      isParking ? 'Arrival and parking routing' : 'Launch reporting',
    ],
    digitalMaturityScore: isEquiem ? 86 : isParking ? 78 : isEmployer ? 72 : isVenue ? 68 : 62,
    experienceScore: isVenue ? 78 : isEquiem ? 84 : isEmployer ? 70 : 64,
    commercialOpportunityScore: company.priority === 'high' ? 88 : company.priority === 'medium' ? 72 : 55,
    strategicFitScore: isEquiem ? 92 : company.priority === 'high' ? 86 : company.priority === 'medium' ? 74 : 58,
    capabilities: [
      { name: 'Events', status: isVenue || isEquiem ? 'Partial' : 'Unknown' },
      { name: 'Community Feed', status: isEquiem ? 'Available' : 'Unknown' },
      { name: 'Parking', status: isParking ? 'Available' : 'Unknown' },
      { name: 'Dining', status: isVenue ? 'Available' : 'Unknown' },
      { name: 'Notifications', status: isEquiem || isVenue ? 'Partial' : 'Unknown' },
      { name: 'Business Directory', status: isRealEstate || isEquiem ? 'Partial' : 'Unknown' },
      { name: 'Maps', status: 'Partial' },
      { name: 'AI Assistant', status: 'Unknown' },
    ],
    complementMatrix: [
      {
        existing: isEquiem ? 'Tenant experience platform' : isVenue ? 'Existing customer channels' : isParking ? 'Parking platform' : 'Workplace tools',
        downtownPerks: isVenue ? 'Local discovery, offers, and resident demand' : 'Neighborhood intelligence layer',
        combined: isVenue ? 'People nearby discover and act at the right moment' : 'Employees, residents, and guests connect workplace context to downtown options',
        outcome: isVenue ? 'More qualified visits and trackable campaigns' : 'Better daily experience without replacing current tools',
      },
      {
        existing: 'Website and existing brand presence',
        downtownPerks: 'Map placement, Ask the Map prompts, and campaign distribution',
        combined: 'Brand presence becomes actionable inside downtown discovery',
        outcome: 'More intent, clearer attribution, and easier follow-up',
      },
    ],
    opportunities: [
      { category: 'Immediate Wins', impact: 'High', effort: 'Low', value: company.proposedPerk, complexity: 'Simple launch setup' },
      { category: 'Neighborhood Activation', impact: 'High', effort: 'Medium', value: company.campaignStrategy, complexity: 'Campaign assets and approval' },
      { category: 'Data Opportunities', impact: 'Medium', effort: 'Low', value: 'Track views, saves, directions, and offer interest', complexity: 'Reporting baseline' },
      { category: 'AI Readiness', impact: 'Medium', effort: 'Medium', value: 'Ask the Map recommendations tied to real partner context', complexity: 'Requires approved data sources' },
    ],
    recommendations: [
      'Increase the value of existing digital channels instead of replacing them.',
      'Extend the experience into the surrounding downtown neighborhood.',
      'Launch one measurable campaign before adding more integrations.',
      'Use AI concierge prompts once map placement and campaign data are approved.',
    ],
  };
}
