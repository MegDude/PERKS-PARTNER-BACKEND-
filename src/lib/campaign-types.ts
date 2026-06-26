export type PlacementType = "venue" | "event" | "perk" | "building" | "district" | "qr_origin" | "hotel_guest";
export type SourceContext = "brand" | "venue" | "hotel" | "building" | "civic" | "property";

export interface Placement {
  id: string;
  type: PlacementType;
  name: string;
  lat: number;
  lng: number;
  district?: string;
  source?: SourceContext;
  offer?: string;
  isActive?: boolean;
}

export interface CampaignMetrics {
  views: number;
  saves: number;
  visits: number;
  redemptions: number;
  repeats?: number;
  trend?: string;
  bestPlacement?: string;
}

export interface Campaign {
  id: string;
  name: string;
  displayName: string;
  sourceContext: SourceContext;
  objective: string;
  targetAudience: string;
  placements: Placement[];
  placementTypes: PlacementType[];
  metrics: CampaignMetrics;
  mapCenter: [number, number];
  mapZoom: number;
}

export interface CampaignFlow {
  step: number;
  label: string;
  description: string;
  action: string;
}

export interface AmplificationPoint {
  title: string;
  description: string;
  icon?: string;
}
