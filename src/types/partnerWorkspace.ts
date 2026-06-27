export type ConversionState = 'Trial' | 'Founding Partner' | 'Active' | 'Renewal Due' | 'Upgrade Available';

export type PartnerLeadStatus =
  | 'New lead'
  | 'Registration started'
  | 'Submitted'
  | 'Approved'
  | 'Workspace created'
  | 'Converted to paid';

export type ModuleStatus = 'Complete' | 'Active' | 'Draft' | 'Scheduled' | 'Live' | 'Trial' | 'Founding Partner';

export interface Partner {
  id: string;
  name: string;
  type: string;
  district: string;
  address: string;
  status: ConversionState;
  setupSteps: string[];
}

export interface PartnerLead {
  id: string;
  organizationName: string;
  partnerType: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  unitCount: number;
  selectedPlan: string;
  selectedAddOns: string[];
  notes?: string;
  status: PartnerLeadStatus;
  createdAt: string;
}

export interface PropertyProfile {
  id: string;
  propertyName: string;
  address: string;
  district: string;
  heroImage: string;
  description: string;
  residentAudience: string;
  buildingAmenities: string[];
  nearbyAnchors: string[];
  contactPerson: string;
  managerNotes: string;
  residentFacingCopy: string;
}

export interface QRCode {
  id: string;
  name: string;
  placement: string;
  destination: string;
  status: 'Active' | 'Paused' | 'Draft';
  scans: number;
  lastScan: string;
  conversionSignal: string;
  headline?: string;
  bodyCopy?: string;
  logoUrl?: string;
  imageUrl?: string;
  printSize?: string;
}

export interface Perk {
  id: string;
  partner: string;
  offerTitle: string;
  description: string;
  eligibility: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Draft' | 'Scheduled';
  saves: number;
  redemptions: number;
  qrScans: number;
  calendarDate?: string;
  location: string;
}

export interface Event {
  id: string;
  title: string;
  dateTime: string;
  location: string;
  description: string;
  rsvpCount: number;
  capacity: number;
  status: 'Published' | 'Draft' | 'Scheduled';
  linkedQR: string;
  linkedCampaign: string;
}

export interface Campaign {
  id: string;
  name: string;
  audience: string;
  channel: string;
  linkedItems: string[];
  sendStatus: 'Draft' | 'Scheduled' | 'Sent' | 'Live';
  opensViews: number;
  saves: number;
  redemptions: number;
  qrScans: number;
}

export interface Resident {
  id: string;
  name: string;
  unit: string;
  email: string;
  moveInDate: string;
  interests: string[];
  savedPerks: number;
  rsvps: number;
  engagementStatus: 'New resident' | 'Active resident' | 'Low engagement' | 'Event attendee' | 'Perk saver';
}

export interface ReportMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  explanation: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  cadence: string;
  addOns: string[];
  conversionState: ConversionState;
  couponCodes: Record<string, number>;
}

export interface TrendingLocation {
  id: string;
  name: string;
  category: string;
  anonymizedCheckIns: number;
  trend: string;
  distance: string;
}

export interface FavoriteItem {
  id: string;
  type: 'Venue' | 'Perk' | 'Event';
  name: string;
  detail: string;
  saved: boolean;
}

export interface PartnerWorkspaceData {
  partner: Partner;
  lead: PartnerLead;
  profile: PropertyProfile;
  qrs: QRCode[];
  perks: Perk[];
  events: Event[];
  campaigns: Campaign[];
  residents: Resident[];
  reports: ReportMetric[];
  billing: BillingPlan;
  trendingLocations: TrendingLocation[];
  favorites: FavoriteItem[];
}
