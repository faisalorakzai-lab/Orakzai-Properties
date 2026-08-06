import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) ?? "https://uvgtgeauhjbdatrmmaob.supabase.co";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "sb_publishable_VuaEqan3EBtGHbpTI0KdJg_OimrHkqM";

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
