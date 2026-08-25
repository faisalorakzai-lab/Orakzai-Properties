/// <reference lib="dom" />

declare const process: { env: Record<string, string | undefined> };

type VercelRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};
type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://nkgkuwhumjgohgfdzflh.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || "AIzaSyCYZF_WWCMR3KDIevQyrMUU7FSmV5d7oXw";
const ADMIN_EMAILS = new Set(["imorakzai1122@gmail.com", "faisal@orakzaibond.com"]);
const BUCKET = "verification-documents";

function send(res: VercelResponse, status: number, body: unknown) {
  res.status(status).json(body);
}

async function verifyAdmin(req: VercelRequest): Promise<boolean> {
  const raw = req.headers.authorization;
  const token = Array.isArray(raw) ? raw[0] : raw;
  if (!token?.startsWith("Bearer ")) return false;
  const idToken = token.slice(7);
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) return false;
  const payload = await response.json() as { users?: Array<{ email?: string; emailVerified?: boolean }> };
  const account = payload.users?.[0];
  return Boolean(account?.email && ADMIN_EMAILS.has(account.email.toLowerCase()) && account.emailVerified !== false);
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  if (!SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  const headers = new Headers(init.headers);
  headers.set("apikey", SERVICE_ROLE_KEY);
  headers.set("Authorization", `Bearer ${SERVICE_ROLE_KEY}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${SUPABASE_URL}${path}`, { ...init, headers });
}

async function createSignedUrl(path: string): Promise<string | null> {
  if (!path || path.startsWith("storage://")) {
    path = path.replace(/^storage:\/\/[^/]+\//, "");
  }
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await supabaseRequest(`/storage/v1/object/sign/${BUCKET}/${encodedPath}`, {
    method: "POST",
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!response.ok) return null;
  const data = await response.json() as { signedURL?: string; signedUrl?: string; path?: string; token?: string };
  const signed = data.signedURL || data.signedUrl || data.path;
  return signed ? (signed.startsWith("http") ? signed : `${SUPABASE_URL}/storage/v1${signed}`) : null;
}

async function loadProfiles() {
  const response = await supabaseRequest("/rest/v1/profiles?select=*&order=kyc_submitted_at.desc");
  if (!response.ok) throw new Error(await response.text());
  const profiles = await response.json() as Array<Record<string, unknown>>;
  return Promise.all(profiles.map(async (profile) => {
    const raw = profile.document_urls;
    const paths = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const signed: Record<string, string> = {};
    for (const [kind, value] of Object.entries(paths)) {
      if (typeof value === "string") {
        const url = await createSignedUrl(value);
        if (url) signed[kind] = url;
      }
    }
    return { ...profile, document_urls: signed };
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    return send(res, 204, {});
  }
  try {
    if (!SERVICE_ROLE_KEY) return send(res, 500, { error: "Admin KYC service is not configured" });
    if (!(await verifyAdmin(req))) return send(res, 403, { error: "Admin authorization required" });
    if (req.method === "GET") return send(res, 200, { profiles: await loadProfiles() });
    if (req.method === "POST") {
      const body = (req.body || {}) as { clerk_user_id?: string; status?: string; rejection_reason?: string };
      if (!body.clerk_user_id || !["approved", "rejected"].includes(body.status || "")) {
        return send(res, 400, { error: "clerk_user_id and approved/rejected status are required" });
      }
      const response = await supabaseRequest(`/rest/v1/profiles?clerk_user_id=eq.${encodeURIComponent(body.clerk_user_id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          kyc_status: body.status,
          kyc_reviewed_at: new Date().toISOString(),
          kyc_rejection_reason: body.status === "rejected" ? (body.rejection_reason || null) : null,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!response.ok) return send(res, 502, { error: await response.text() });
      return send(res, 200, { profile: (await response.json())[0] || null });
    }
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return send(res, 405, { error: "Method not allowed" });
  } catch (error) {
    console.error("Admin KYC API error", error);
    return send(res, 500, { error: error instanceof Error ? error.message : "Admin KYC request failed" });
  }
}
