export type RegistryStatus = "draft" | "published" | "scheduled" | "archived" | "needs_review";

export type RegistryEntity = {
  id: string;
  slug: string;
  name: string;
  status: RegistryStatus | string;
  active: boolean;
  entityType: string;
  primaryCategory: string;
  secondaryCategory: string;
  subcategory: string;
  summary: string;
  description: string;
  address: string;
  suite: string;
  building: string;
  district: string;
  neighbourhood: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  website: string;
  image: string;
  logo: string;
  partnerId: string;
  source: string;
  sourceRecordType: string;
  createdAt: string;
  updatedAt: string;
  analytics: {
    views: number;
    clicks: number;
    directions: number;
    saves: number;
    conversions: number;
  };
  routes: {
    entityRoute: string;
    partnerRoute: string;
    campaignRoute: string;
    publicUrl: string;
    deeplink: string;
    mobileRoute: string;
  };
  raw: Record<string, unknown>;
};

export type RegistryRelationship = {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  weight: number;
  status: string;
};

export type RegistryImportRow = Record<string, unknown>;

export type RegistryImportPreview = {
  source: string;
  totalRows: number;
  creates: number;
  updates: number;
  skipped: number;
  duplicates: Array<{
    rowIndex: number;
    matchedEntityId: string;
    name: string;
    reason: string;
  }>;
  rows: Array<{
    rowIndex: number;
    action: "create" | "update" | "skip";
    entity: Partial<RegistryEntity>;
    matchedEntityId?: string;
    reason?: string;
  }>;
};

export type RegistryFilters = {
  q?: string;
  type?: string;
  category?: string;
  district?: string;
  status?: string;
  collection?: string;
  layer?: string;
  limit?: number;
};
