import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "https://nkgkuwhumjgohgfdzflh.supabase.co";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "sb_publishable_ta5bOhvbJ-OVhhIv0wQlaQ_WGek2ssH";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type KYCStatus = "not_started" | "in_progress" | "pending_review" | "approved" | "rejected";

export interface Profile {
  id?: string;
  clerk_user_id: string;
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
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: "clerk_user_id" })
    .select()
    .maybeSingle();
  if (error) { console.error("upsertProfile error:", error); return null; }
  return data as Profile | null;
}

export async function submitKYC(
  userId: string, email: string, personalData: Record<string, string>,
  docType: string, addressDocType: string
): Promise<boolean> {
  const { error } = await supabase.from("profiles").upsert({
    clerk_user_id: userId, email,
    full_name: personalData.fullName, father_name: personalData.fatherName,
    cnic: personalData.cnic, dob: personalData.dob, phone: personalData.phone,
    address: personalData.address, city: personalData.city, country: personalData.country,
    occupation: personalData.occupation, source_of_funds: personalData.sourceOfFunds,
    doc_type: docType, address_doc_type: addressDocType,
    kyc_status: "pending_review", kyc_submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "clerk_user_id" });
  return !error;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("kyc_submitted_at", { ascending: false });
  if (error) { console.error("getAllProfiles error:", error); return []; }
  return (data ?? []) as Profile[];
}

export async function updateKYCStatus(userId: string, status: KYCStatus, rejectionReason?: string): Promise<boolean> {
  const { error } = await supabase.from("profiles").update({
    kyc_status: status, kyc_reviewed_at: new Date().toISOString(),
    kyc_rejection_reason: rejectionReason ?? null, updated_at: new Date().toISOString(),
  }).eq("clerk_user_id", userId);
  return !error;
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
