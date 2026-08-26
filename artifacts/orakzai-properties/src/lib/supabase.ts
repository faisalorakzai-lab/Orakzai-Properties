import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "https://nkgkuwhumjgohgfdzflh.supabase.co";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "sb_publishable_ta5bOhvbJ-OVhhIv0wQlaQ_WGek2ssH";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type KYCStatus = "not_started" | "in_progress" | "pending_review" | "approved" | "rejected";

export interface Profile {
  id?: string;
  clerk_user_id: string;
  supabase_user_id?: string;
  full_name?: string;
  email?: string;
  kyc_status: KYCStatus;
  kyc_submitted_at?: string;
  kyc_reviewed_at?: string;
  kyc_rejection_reason?: string;
  father_name?: string;
  cnic?: string;
  dob?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  occupation?: string;
  source_of_funds?: string;
  doc_type?: string;
  address_doc_type?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (error) { console.error("getProfile error:", error); return null; }
  return data as Profile | null;
}

export async function upsertProfile(profile: Partial<Profile> & { clerk_user_id: string }): Promise<Profile | null> {
  const sessionUser = await getSupabaseSessionUser();
  if (!sessionUser) {
    console.error("upsertProfile: no authenticated Supabase session");
    return null;
  }
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ ...profile, supabase_user_id: profile.supabase_user_id ?? sessionUser.id, updated_at: new Date().toISOString() }, { onConflict: "clerk_user_id" })
    .select()
    .maybeSingle();
  if (error) { console.error("upsertProfile error:", error); return null; }
  return data as Profile | null;
}

export type KYCDocuments = {
  docFront: File;
  docBack?: File | null;
  selfie: File;
  addressDoc: File;
};

async function prepareKYCDocument(file: File): Promise<File> {
  const maxBytes = 10 * 1024 * 1024;
  if (!file || file.size === 0) throw new Error("Selected KYC document is empty.");
  const type = file.type || (file.name.toLowerCase().endsWith(".png") ? "image/png" : file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : "application/pdf");
  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowed.includes(type)) throw new Error("KYC documents must be JPG, PNG, or PDF files.");

  // Android camera apps often produce very large PNGs. Resize/compress images before upload.
  if (type.startsWith("image/") && file.size > 2 * 1024 * 1024 && typeof document !== "undefined") {
    const bitmap = await createImageBitmap(file);
    const maxDimension = 1800;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to prepare the camera image for upload.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84));
    if (blob) file = new File([blob], file.name.replace(/\.(png|jpe?g)$/i, ".jpg"), { type: "image/jpeg" });
  }
  if (file.size > maxBytes) throw new Error(`${file.name} is larger than 10MB. Please choose a smaller document image.`);
  return file;
}

export async function uploadKYCDocument(file: File, supabaseUserId: string, kind: string): Promise<string> {
  const prepared = await prepareKYCDocument(file);
  const safeName = prepared.name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
  const randomId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${supabaseUserId}/${kind}-${randomId}-${safeName}`;
  const uploadBody = await prepared.arrayBuffer();
  const { error } = await supabase.storage.from("verification-documents").upload(path, uploadBody, {
    cacheControl: "3600",
    contentType: prepared.type,
    upsert: false,
  });
  if (error) throw new Error(`KYC document upload failed (${kind}): ${error.message}`);
  return path;
}

export async function submitKYC(
  firebaseUserId: string,
  supabaseUserId: string,
  email: string,
  personalData: Record<string, string>,
  docType: string,
  addressDocType: string,
  documents: KYCDocuments,
): Promise<boolean> {
  const documentUrls: Record<string, string> = {};
  documentUrls.docFront = await uploadKYCDocument(documents.docFront, supabaseUserId, "id-front");
  if (documents.docBack) documentUrls.docBack = await uploadKYCDocument(documents.docBack, supabaseUserId, "id-back");
  documentUrls.selfie = await uploadKYCDocument(documents.selfie, supabaseUserId, "selfie");
  documentUrls.addressDoc = await uploadKYCDocument(documents.addressDoc, supabaseUserId, "address-proof");

  const { error } = await supabase.from("profiles").upsert({
    clerk_user_id: firebaseUserId,
    supabase_user_id: supabaseUserId,
    email,
    full_name: personalData.fullName,
    father_name: personalData.fatherName,
    cnic: personalData.cnic,
    dob: personalData.dob,
    phone: personalData.phone,
    address: personalData.address,
    city: personalData.city,
    country: personalData.country,
    occupation: personalData.occupation,
    source_of_funds: personalData.sourceOfFunds,
    doc_type: docType,
    address_doc_type: addressDocType,
    document_urls: documentUrls,
    kyc_status: "pending_review",
    kyc_submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "clerk_user_id" });
  if (error) throw new Error(`KYC record submission failed: ${error.message}`);
  return true;
}

async function getFirebaseAdminToken(): Promise<string> {
  const { auth } = await import("@/lib/firebase");
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Admin session is not available");
  return currentUser.getIdToken(true);
}

export async function getAdminKYCProfiles(): Promise<Profile[]> {
  const token = await getFirebaseAdminToken();
  const response = await fetch("/api/admin/kyc", { headers: { Authorization: `Bearer ${token}` } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Unable to load KYC submissions");
  return (body.profiles ?? []) as Profile[];
}

export async function updateAdminKYCStatus(userId: string, status: KYCStatus, rejectionReason?: string): Promise<Profile | null> {
  const token = await getFirebaseAdminToken();
  const response = await fetch("/api/admin/kyc", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ clerk_user_id: userId, status, rejection_reason: rejectionReason }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Unable to update KYC status");
  return (body.profile ?? null) as Profile | null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  try { return await getAdminKYCProfiles(); }
  catch (error) { console.error("getAllProfiles error:", error); return []; }
}

export async function updateKYCStatus(userId: string, status: KYCStatus, rejectionReason?: string): Promise<boolean> {
  try { await updateAdminKYCStatus(userId, status, rejectionReason); return true; }
  catch (error) { console.error("updateKYCStatus error:", error); return false; }
}


export type VerificationServiceType =
  | "NOC check and authority status"
  | "Land Department ownership verification"
  | "Registry audit and title-chain review"
  | "Complete Due Diligence Package";

export type VerificationRequestPayload = {
  request_id: string;
  user_id: string | null;
  service_type: VerificationServiceType;
  location: string;
  preferred_date: string;
  notes: string;
  document_urls: string[];
  status: "Under Audit";
};

export type VerificationRequestRow = VerificationRequestPayload & { created_at?: string; updated_at?: string };

export async function uploadVerificationDocument(file: File, requestId: string): Promise<string> {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
  const path = `${requestId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("verification-documents").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return `storage://verification-documents/${path}`;
}

export async function createVerificationRequest(payload: VerificationRequestPayload): Promise<VerificationRequestRow> {
  const { error } = await supabase.from("verification_requests").insert(payload);
  if (error) throw error;
  return { ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
}

export function subscribeToVerificationRequest(requestId: string, onUpdate: (row: VerificationRequestRow) => void) {
  const channel = supabase
    .channel(`verification-request-${requestId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "verification_requests", filter: `request_id=eq.${requestId}` }, (event) => {
      if (event.new && typeof event.new === "object") onUpdate(event.new as VerificationRequestRow);
    })
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}


/** Ensures the browser has a persistent Supabase Auth session for RLS-scoped marketplace features. */
export async function ensureSupabaseSession() {
  const existing = await supabase.auth.getSession();
  if (existing.error) throw existing.error;
  if (existing.data.session?.user) return existing.data.session.user;

  const anonymous = await supabase.auth.signInAnonymously();
  if (anonymous.error) throw anonymous.error;
  if (!anonymous.data.user) throw new Error("Supabase did not return an authenticated session.");
  return anonymous.data.user;
}

export async function getSupabaseSessionUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
