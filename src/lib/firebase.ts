import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "firebase/auth";
import { collection, doc, getFirestore, serverTimestamp, type Firestore, type Timestamp } from "firebase/firestore";

export type PartnerStatus = "draft" | "ready" | "contacted" | "onboarding" | "active" | "archived";
export type PartnerType = "property" | "hotel" | "venue" | "restaurant" | "coffee" | "retail" | "brand" | "civic" | "service" | "sponsor";
export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed" | "archived";
export type PerkStatus = "draft" | "active" | "paused" | "expired" | "archived";
export type OutreachActivityType = "note" | "email" | "call" | "meeting" | "follow_up" | "status_change" | "task";

export type BaseDocument = {
  id: string;
  organizationId: string;
  workspaceId: string;
  status: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Timestamp | Date | null;
  metadata?: Record<string, unknown>;
};

export type PartnerDocument = BaseDocument & {
  name: string;
  slug: string;
  type: PartnerType;
  category: string;
  district: string;
  address?: string;
  website?: string;
  phone?: string;
  primaryContactId?: string;
  workspacePath?: string;
  mapEntityIds: string[];
  campaignIds: string[];
  perkIds: string[];
  notes?: string;
  status: PartnerStatus;
};

export type ContactDocument = BaseDocument & {
  partnerId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  preferredChannel?: "email" | "phone" | "sms" | "linkedin";
  isPrimary: boolean;
  lastContactedAt?: Timestamp | null;
  nextFollowUpAt?: Timestamp | null;
  status: "needs_verification" | "ready" | "contacted" | "do_not_contact" | "archived";
};

export type PerkDocument = BaseDocument & {
  partnerId: string;
  title: string;
  description: string;
  status: PerkStatus;
  category: string;
  redemptionType: "card" | "qr" | "manual" | "partner_verified";
  startsAt?: Timestamp | null;
  endsAt?: Timestamp | null;
  campaignIds: string[];
  eventIds: string[];
  mapEntityIds: string[];
  metrics: { views: number; saves: number; scans: number; redemptions: number };
};

export type CampaignDocument = BaseDocument & {
  name: string;
  status: CampaignStatus;
  partnerIds: string[];
  perkIds: string[];
  eventIds: string[];
  audienceSegmentIds: string[];
  startsAt?: Timestamp | null;
  endsAt?: Timestamp | null;
  metrics: { reach: number; opens: number; clicks: number; conversions: number };
};

export type OutreachActivityDocument = BaseDocument & {
  partnerId: string;
  contactId?: string;
  campaignId?: string;
  type: OutreachActivityType;
  title: string;
  body?: string;
  dueAt?: Timestamp | null;
  completedAt?: Timestamp | null;
  actorId?: string;
};

export const firestoreCollections = {
  partners: "partners",
  contacts: "contacts",
  perks: "perks",
  campaigns: "campaigns",
  outreachActivity: "outreach_activity",
} as const;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
export const firebaseApp: FirebaseApp | null = firebaseConfigured ? getApps()[0] || initializeApp(firebaseConfig) : null;
export const firestore: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;

if (firebaseAuth) {
  void setPersistence(firebaseAuth, browserLocalPersistence);
}

export async function initializeFirebaseServices() {
  if (firebaseAuth) {
    await setPersistence(firebaseAuth, browserLocalPersistence);
  }
  return {
    configured: firebaseConfigured,
    app: firebaseApp,
    auth: firebaseAuth,
    firestore,
  };
}

export function requireFirestore() {
  if (!firestore) throw new Error("Firebase Firestore is not configured. Add VITE_FIREBASE_* environment variables.");
  return firestore;
}

export function requireFirebaseAuth() {
  if (!firebaseAuth) throw new Error("Firebase Authentication is not configured. Add VITE_FIREBASE_* environment variables.");
  return firebaseAuth;
}

export function collectionRef(name: keyof typeof firestoreCollections) {
  return collection(requireFirestore(), firestoreCollections[name]);
}

export function documentRef(name: keyof typeof firestoreCollections, id: string) {
  return doc(requireFirestore(), firestoreCollections[name], id);
}

export function writeMetadata(actorId?: string) {
  return { updatedAt: serverTimestamp(), updatedBy: actorId || "system" };
}

export function createMetadata(actorId?: string) {
  return {
    createdAt: serverTimestamp(),
    createdBy: actorId || "system",
    updatedAt: serverTimestamp(),
    updatedBy: actorId || "system",
    deletedAt: null,
  };
}
