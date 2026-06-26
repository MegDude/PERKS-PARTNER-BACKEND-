export interface SharedMapItem {
  id: string;
  entity_id: string;
  entity_type: "venue" | "event" | "perk" | "building" | "property" | "hotel" | "campaign" | "civic_activation";
  title: string;
  subtitle?: string;
  description?: string;
  district?: string;
  category?: string;
  partner_type?: string;
  latitude: number;
  longitude: number;
  status?: "active" | "coming_soon" | "inactive" | "archived";
  image?: string;
  icon?: string;
  source_ref?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface Venue {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  perk_description?: string;
  perk_value?: string;
  hours?: string;
  website?: string;
  tags?: string[];
  is_featured?: boolean;
  status: "active" | "coming_soon" | "inactive";
  district?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  category: string;
  venue_name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  date: string;
  end_date?: string;
  is_members_only?: boolean;
  capacity?: number;
  rsvp_count?: number;
  tags?: string[];
  is_featured?: boolean;
  status: "upcoming" | "live" | "past" | "cancelled";
}

export interface Perk {
  id: string;
  title: string;
  description?: string;
  venue_name: string;
  category: string;
  value: string;
  terms?: string;
  valid_from?: string;
  valid_until?: string;
  is_featured?: boolean;
  redemption_count?: number;
  status: "active" | "expired" | "paused";
}

export interface Building {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  unit_count?: number;
  developer?: string;
  description?: string;
  amenities?: string[];
  is_partner?: boolean;
  real_estate_contact?: string;
  status: "active" | "pilot" | "prospect";
}

export interface Campaign {
  id: string;
  slug: string;
  name: string;
  brand_id: string;
  type: "launch" | "seasonal" | "event" | "promotion" | "resident";
  start_date?: string;
  end_date?: string;
  active?: boolean;
  districts?: string[];
  participating_venues?: string[];
  participating_buildings?: string[];
  associated_events?: string[];
  objective?: string;
  status: "draft" | "active" | "paused" | "completed";
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  category: string;
  description?: string;
  image_url?: string;
  districts?: string[];
  campaign_ids?: string[];
  venue_ids?: string[];
  building_ids?: string[];
  status: "active" | "inactive" | "archived";
}

export interface Resident {
  id: string;
  email: string;
  name?: string;
  building_id?: string;
  preferences?: Record<string, unknown>;
  saved_items?: string[];
  completed_actions?: string[];
  status: "active" | "inactive" | "onboarding";
}

export interface SaveAction {
  id: string;
  resident_id: string;
  entity_id: string;
  entity_type: "venue" | "event" | "perk" | "campaign";
  created_at: string;
  updated_at: string;
}

export interface Redemption {
  id: string;
  resident_id: string;
  perk_id: string;
  venue_id: string;
  redemption_code?: string;
  redeemed_at: string;
  status: "pending" | "completed" | "expired";
}

export interface AnalyticsSignal {
  id: string;
  timestamp: string;
  source_type: "building_qr" | "map_discovery" | "event_marker" | "sms" | "resident_card" | "direct_link";
  campaign_id?: string;
  brand_id?: string;
  venue_id?: string;
  building_id?: string;
  event_id?: string;
  district_id?: string;
  action_type: "impression" | "open" | "scan" | "save" | "rsvp" | "unlock" | "opt_in" | "visit_intent" | "visit" | "redemption" | "booking" | "repeat_visit";
  value?: number;
  session_token?: string;
}
