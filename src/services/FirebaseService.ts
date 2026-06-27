import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import {
  collectionRef,
  createMetadata,
  documentRef,
  firestoreCollections,
  writeMetadata,
  type ContactDocument,
  type PartnerDocument,
  type PartnerStatus,
  type PartnerType,
} from "@/lib/firebase";

type PartnerInput = Partial<Omit<PartnerDocument, "id" | "createdAt" | "updatedAt">> & {
  name: string;
  type: PartnerType;
};

type ContactInput = Partial<Omit<ContactDocument, "id" | "createdAt" | "updatedAt">> & {
  partnerId: string;
  name: string;
};

type PartnerFilters = {
  status?: PartnerStatus;
  type?: PartnerType;
  organizationId?: string;
  limit?: number;
};

type ContactFilters = {
  partnerId?: string;
  organizationId?: string;
  limit?: number;
};

function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function validateEmail(value?: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function assertPartner(input: PartnerInput) {
  if (!cleanText(input.name)) throw new Error("Partner name is required.");
  if (!cleanText(input.type)) throw new Error("Partner type is required.");
  if (input.website && !/^https?:\/\//i.test(input.website)) throw new Error("Partner website must start with http:// or https://.");
}

function assertContact(input: ContactInput) {
  if (!cleanText(input.partnerId)) throw new Error("Contact must be linked to a partner.");
  if (!cleanText(input.name)) throw new Error("Contact name is required.");
  if (!validateEmail(input.email)) throw new Error("Contact email is not valid.");
}

function partnerPayload(input: PartnerInput, actorId?: string) {
  assertPartner(input);
  const slug = input.slug || normalizeSlug(input.name);
  return {
    organizationId: input.organizationId || "org_downtown_perks",
    workspaceId: input.workspaceId || `workspace_${slug.replace(/-/g, "_")}`,
    name: cleanText(input.name),
    slug,
    type: input.type,
    category: input.category || input.type,
    district: input.district || "",
    address: input.address || "",
    website: input.website || "",
    phone: input.phone || "",
    primaryContactId: input.primaryContactId || "",
    workspacePath: input.workspacePath || `/admin/workspaces/${slug}`,
    mapEntityIds: input.mapEntityIds || [],
    campaignIds: input.campaignIds || [],
    perkIds: input.perkIds || [],
    notes: input.notes || "",
    status: input.status || "ready",
    metadata: input.metadata || {},
    ...createMetadata(actorId),
  };
}

function contactPayload(input: ContactInput, actorId?: string) {
  assertContact(input);
  return {
    organizationId: input.organizationId || "org_downtown_perks",
    workspaceId: input.workspaceId || "",
    partnerId: input.partnerId,
    name: cleanText(input.name),
    role: input.role || "",
    email: input.email || "",
    phone: input.phone || "",
    preferredChannel: input.preferredChannel || "email",
    isPrimary: input.isPrimary === true,
    lastContactedAt: input.lastContactedAt || null,
    nextFollowUpAt: input.nextFollowUpAt || null,
    status: input.status || "needs_verification",
    metadata: input.metadata || {},
    ...createMetadata(actorId),
  };
}

function mapDoc<T extends { id: string }>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

function partnerConstraints(filters: PartnerFilters = {}) {
  const constraints: QueryConstraint[] = [];
  if (filters.organizationId) constraints.push(where("organizationId", "==", filters.organizationId));
  if (filters.status) constraints.push(where("status", "==", filters.status));
  if (filters.type) constraints.push(where("type", "==", filters.type));
  constraints.push(orderBy("name", "asc"));
  if (filters.limit) constraints.push(limit(filters.limit));
  return constraints;
}

function contactConstraints(filters: ContactFilters = {}) {
  const constraints: QueryConstraint[] = [];
  if (filters.organizationId) constraints.push(where("organizationId", "==", filters.organizationId));
  if (filters.partnerId) constraints.push(where("partnerId", "==", filters.partnerId));
  constraints.push(orderBy("name", "asc"));
  if (filters.limit) constraints.push(limit(filters.limit));
  return constraints;
}

export async function createPartner(input: PartnerInput, actorId?: string) {
  const payload = partnerPayload(input, actorId);
  const ref = await addDoc(collectionRef("partners"), payload);
  return { id: ref.id, ...payload } as PartnerDocument;
}

export async function upsertPartner(id: string, input: PartnerInput, actorId?: string) {
  const payload = partnerPayload(input, actorId);
  await setDoc(documentRef("partners", id), payload, { merge: true });
  return { id, ...payload } as PartnerDocument;
}

export async function updatePartner(id: string, input: Partial<PartnerDocument>, actorId?: string) {
  if (input.website && !/^https?:\/\//i.test(input.website)) throw new Error("Partner website must start with http:// or https://.");
  await updateDoc(documentRef("partners", id), { ...input, ...writeMetadata(actorId) });
  return getPartner(id);
}

export async function getPartner(id: string) {
  const snapshot = await getDoc(documentRef("partners", id));
  if (!snapshot.exists()) throw new Error("Partner not found.");
  return mapDoc<PartnerDocument>(snapshot.id, snapshot.data());
}

export async function listPartners(filters: PartnerFilters = {}) {
  const snapshot = await getDocs(query(collectionRef("partners"), ...partnerConstraints(filters)));
  return snapshot.docs.map((doc) => mapDoc<PartnerDocument>(doc.id, doc.data()));
}

export function subscribePartners(filters: PartnerFilters, callback: (records: PartnerDocument[]) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(
    query(collectionRef("partners"), ...partnerConstraints(filters)),
    (snapshot) => callback(snapshot.docs.map((doc) => mapDoc<PartnerDocument>(doc.id, doc.data()))),
    (error) => onError?.(error)
  );
}

export async function archivePartner(id: string, actorId?: string) {
  await updateDoc(documentRef("partners", id), { status: "archived", deletedAt: new Date(), ...writeMetadata(actorId) });
}

export async function deletePartner(id: string) {
  await deleteDoc(documentRef("partners", id));
}

export async function createContact(input: ContactInput, actorId?: string) {
  const payload = contactPayload(input, actorId);
  const ref = await addDoc(collectionRef("contacts"), payload);
  return { id: ref.id, ...payload } as ContactDocument;
}

export async function upsertContact(id: string, input: ContactInput, actorId?: string) {
  const payload = contactPayload(input, actorId);
  await setDoc(documentRef("contacts", id), payload, { merge: true });
  return { id, ...payload } as ContactDocument;
}

export async function updateContact(id: string, input: Partial<ContactDocument>, actorId?: string) {
  if (input.email && !validateEmail(input.email)) throw new Error("Contact email is not valid.");
  await updateDoc(documentRef("contacts", id), { ...input, ...writeMetadata(actorId) });
  return getContact(id);
}

export async function getContact(id: string) {
  const snapshot = await getDoc(documentRef("contacts", id));
  if (!snapshot.exists()) throw new Error("Contact not found.");
  return mapDoc<ContactDocument>(snapshot.id, snapshot.data());
}

export async function listContacts(filters: ContactFilters = {}) {
  const snapshot = await getDocs(query(collectionRef("contacts"), ...contactConstraints(filters)));
  return snapshot.docs.map((doc) => mapDoc<ContactDocument>(doc.id, doc.data()));
}

export function subscribeContacts(filters: ContactFilters, callback: (records: ContactDocument[]) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(
    query(collectionRef("contacts"), ...contactConstraints(filters)),
    (snapshot) => callback(snapshot.docs.map((doc) => mapDoc<ContactDocument>(doc.id, doc.data()))),
    (error) => onError?.(error)
  );
}

export async function archiveContact(id: string, actorId?: string) {
  await updateDoc(documentRef("contacts", id), { status: "archived", deletedAt: new Date(), ...writeMetadata(actorId) });
}

export async function deleteContact(id: string) {
  await deleteDoc(documentRef("contacts", id));
}

export const firebaseCollectionNames = firestoreCollections;
