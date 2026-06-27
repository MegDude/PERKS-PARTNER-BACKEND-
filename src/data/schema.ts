export type CrmStatus =
  | "not_started"
  | "needs_research"
  | "ready_to_contact"
  | "contacted"
  | "follow_up_needed"
  | "meeting_requested"
  | "meeting_booked"
  | "interested"
  | "not_now"
  | "onboarding"
  | "active_partner"
  | "archived";

export type PartnerType =
  | "restaurant"
  | "bar"
  | "coffee"
  | "retail"
  | "hotel"
  | "property"
  | "residential_building"
  | "office_building"
  | "civic"
  | "service"
  | "wellness"
  | "fitness"
  | "event"
  | "brand"
  | "real_estate"
  | "campaign"
  | "perk";

export type CrmBaseRecord = {
  id: string;
  organizationId: string;
  workspaceId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: unknown | null;
  metadata?: Record<string, unknown>;
};

export type PartnerRecord = CrmBaseRecord & {
  name: string;
  slug: string;
  type: PartnerType;
  category?: string;
  district?: string;
  address?: string;
  website?: string;
  phone?: string;
  googleMapsUrl?: string;
  downtownPerksMapUrl?: string;
  company?: string;
  status: CrmStatus;
  priorityScore?: number;
  verificationStatus?: "needs_verification" | "partially_verified" | "verified";
  primaryContactId?: string;
  contactIds: string[];
  campaignIds: string[];
  perkIds: string[];
  notes?: string;
};

export type ContactRecord = CrmBaseRecord & {
  partnerId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  preferredChannel?: "email" | "phone" | "sms" | "linkedin";
  confidence?: "low" | "medium" | "high";
  verificationStatus?: "needs_verification" | "verified" | "do_not_contact";
  isPrimary: boolean;
  lastContactedAt?: unknown | null;
  nextFollowUpAt?: unknown | null;
  notes?: string;
};

export type OutreachActivityRecord = CrmBaseRecord & {
  partnerId: string;
  contactId?: string;
  campaignId?: string;
  type:
    | "note"
    | "field_update"
    | "status_change"
    | "message_generated"
    | "message_sent"
    | "follow_up_scheduled"
    | "meeting"
    | "data_enriched";
  title: string;
  body?: string;
  status?: CrmStatus;
  dueAt?: unknown | null;
  completedAt?: unknown | null;
  actorId?: string;
};
