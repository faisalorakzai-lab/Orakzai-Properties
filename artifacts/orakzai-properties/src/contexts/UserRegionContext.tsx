import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProfile, type Profile } from "@/lib/supabase";
import { useUser } from "@/contexts/AuthContext";

export type RegionSource = "kyc_verified" | "ip_detected" | "user_selected" | "default";
export type FeatureAvailability = "available" | "verification_required" | "restricted";

export type RegionPolicy = {
  code: string;
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  gateways: string[];
  offRampLabel: string;
  regulatedGroup: "PAST_PRESENT" | "GCC" | "NORTH_AMERICA_EUROPE" | "OTHER";
  restrictedFeatures: string[];
  complianceNotice: string;
  features: Record<string, FeatureAvailability>;
};

const STORAGE_KEY = "okzbyte_user_region";
const COUNTRY_KEY = "okzbyte_user_country";
const DEFAULT_CODE = "PK";

export const REGION_POLICIES: Record<string, RegionPolicy> = {
  PK: { code: "PK", name: "Pakistan", flag: "🇵🇰", currency: "PKR", symbol: "Rs", gateways: ["Bank Transfer / Raast", "EasyPaisa", "JazzCash"], offRampLabel: "Raast & mobile wallet off-ramp", regulatedGroup: "PAST_PRESENT", restrictedFeatures: ["US wire transfer", "SEPA Instant"], complianceNotice: "PKR payment routing is shown for Pakistan users. Final limits and settlement require account verification.", features: { p2p: "available", withdrawFiat: "verification_required", rwaVaults: "verification_required", institutionalDesk: "restricted" } },
  BD: { code: "BD", name: "Bangladesh", flag: "🇧🇩", currency: "BDT", symbol: "৳", gateways: ["Local Bank Transfer", "bKash", "Nagad"], offRampLabel: "Local bank & mobile wallet off-ramp", regulatedGroup: "PAST_PRESENT", restrictedFeatures: ["Unsupported international rails"], complianceNotice: "Local BDT routing is subject to merchant availability and verified account limits.", features: { p2p: "available", withdrawFiat: "verification_required", rwaVaults: "verification_required", institutionalDesk: "restricted" } },
  AE: { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", currency: "AED", symbol: "AED", gateways: ["UAE Bank Transfer · ENBD / Mashreq / FAB", "ATM Cash Deposit", "ADCB Hayyak"], offRampLabel: "UAE bank transfer off-ramp", regulatedGroup: "GCC", restrictedFeatures: [], complianceNotice: "AED routing is available subject to verified identity, source-of-funds, and applicable UAE limits.", features: { p2p: "available", withdrawFiat: "verification_required", rwaVaults: "available", institutionalDesk: "verification_required" } },
  SA: { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", currency: "SAR", symbol: "SAR", gateways: ["STC Pay", "Urpay", "Local Bank · Al Rajhi / SNB"], offRampLabel: "Saudi bank & wallet off-ramp", regulatedGroup: "GCC", restrictedFeatures: [], complianceNotice: "SAR routing is subject to verified identity and local payment-provider availability.", features: { p2p: "available", withdrawFiat: "verification_required", rwaVaults: "available", institutionalDesk: "verification_required" } },
  QA: { code: "QA", name: "Qatar", flag: "🇶🇦", currency: "QAR", symbol: "QAR", gateways: ["Qatar Bank Transfer", "Ooredoo Money", "Wise"], offRampLabel: "Qatar bank transfer off-ramp", regulatedGroup: "GCC", restrictedFeatures: [], complianceNotice: "QAR routing is subject to verified account status and available merchants.", features: { p2p: "available", withdrawFiat: "verification_required", rwaVaults: "verification_required", institutionalDesk: "verification_required" } },
  US: { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", symbol: "$", gateways: ["Zelle", "Wire / ACH", "Wise"], offRampLabel: "USD bank off-ramp", regulatedGroup: "NORTH_AMERICA_EUROPE", restrictedFeatures: ["Some RWA offerings may require additional eligibility"], complianceNotice: "US users see compliance-aware trade limits and verification warnings before fiat settlement.", features: { p2p: "available", withdrawFiat: "verification_required", rwaVaults: "verification_required", institutionalDesk: "verification_required" } },
  GB: { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", symbol: "£", gateways: ["Faster Payments (FPS)", "Revolut", "Wise"], offRampLabel: "Faster Payments off-ramp", regulatedGroup: "NORTH_AMERICA_EUROPE", restrictedFeatures: [], complianceNotice: "GBP routing is subject to verification and applicable UK compliance limits.", features: { p2p: "available", withdrawFiat: "verification_required", rwaVaults: "verification_required", institutionalDesk: "verification_required" } },
  EU: { code: "EU", name: "Eurozone", flag: "🇪🇺", currency: "EUR", symbol: "€", gateways: ["SEPA Instant", "Revolut", "Wise"], offRampLabel: "SEPA Instant off-ramp", regulatedGroup: "NORTH_AMERICA_EUROPE", restrictedFeatures: [], complianceNotice: "EUR routing is subject to verification and applicable European compliance limits.", features: { p2p: "available", withdrawFiat: "verification_required", rwaVaults: "verification_required", institutionalDesk: "verification_required" } },
  IN: { code: "IN", name: "India", flag: "🇮🇳", currency: "INR", symbol: "₹", gateways: ["UPI", "IMPS / NEFT", "Wise"], offRampLabel: "UPI & bank off-ramp", regulatedGroup: "OTHER", restrictedFeatures: ["Some cross-border rails may be unavailable"], complianceNotice: "INR routing is subject to verified identity, merchant availability, and applicable local limits.", features: { p2p: "available", withdrawFiat: "verification_required", rwaVaults: "verification_required", institutionalDesk: "restricted" } },
};

function countryToCode(value?: string | null) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const aliases: Record<string, string> = { pakistan: "PK", pk: "PK", bangladesh: "BD", bd: "BD", "united arab emirates": "AE", uae: "AE", ae: "AE", "saudi arabia": "SA", saudi: "SA", sa: "SA", qatar: "QA", qa: "QA", "united states": "US", usa: "US", us: "US", "united kingdom": "GB", uk: "GB", gb: "GB", india: "IN", in: "IN", europe: "EU", eurozone: "EU", eu: "EU" };
  return aliases[normalized] ?? null;
}

async function detectCountry() {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch("https://ipapi.co/json/", { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const data = await response.json() as { country_code?: string };
    return countryToCode(data.country_code);
  } catch { return null; } finally { window.clearTimeout(timer); }
}

export type UserRegionContextValue = {
  userCountry: string;
  userCurrency: string;
  fiatGateways: string[];
  restrictedFeatures: string[];
  policy: RegionPolicy;
  source: RegionSource;
  isLoading: boolean;
  isKycVerified: boolean;
  profile: Profile | null;
  setUserCountry: (code: string) => void;
  refreshRegion: () => Promise<void>;
  featureStatus: (feature: string) => FeatureAvailability;
};

const RegionContext = createContext<UserRegionContextValue | null>(null);

export function UserRegionProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [source, setSource] = useState<RegionSource>("default");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUserCountry = useCallback((nextCode: string) => {
    const normalized = nextCode.toUpperCase();
    if (!REGION_POLICIES[normalized]) return;
    setCode(normalized);
    setSource("user_selected");
    localStorage.setItem(STORAGE_KEY, normalized);
    localStorage.setItem(COUNTRY_KEY, normalized);
  }, []);

  const refreshRegion = useCallback(async () => {
    setIsLoading(true);
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(COUNTRY_KEY);
    const savedCode = countryToCode(saved);
    if (savedCode) { setCode(savedCode); setSource("user_selected"); }

    let loadedProfile: Profile | null = null;
    if (user?.uid) {
      loadedProfile = await getProfile(user.uid);
      setProfile(loadedProfile);
      const kycCode = loadedProfile?.kyc_status === "approved" ? countryToCode(loadedProfile.country) : null;
      if (kycCode) {
        setCode(kycCode);
        setSource("kyc_verified");
        localStorage.setItem(STORAGE_KEY, kycCode);
        localStorage.setItem(COUNTRY_KEY, kycCode);
        setIsLoading(false);
        return;
      }
    }
    if (savedCode) { setIsLoading(false); return; }
    const detected = await detectCountry();
    if (detected) { setCode(detected); setSource("ip_detected"); localStorage.setItem(STORAGE_KEY, detected); localStorage.setItem(COUNTRY_KEY, detected); }
    setIsLoading(false);
  }, [user?.uid]);

  useEffect(() => { void refreshRegion(); }, [refreshRegion]);

  const policy = REGION_POLICIES[code] ?? REGION_POLICIES[DEFAULT_CODE];
  const value = useMemo<UserRegionContextValue>(() => ({
    userCountry: policy.code,
    userCurrency: policy.currency,
    fiatGateways: policy.gateways,
    restrictedFeatures: policy.restrictedFeatures,
    policy,
    source,
    isLoading,
    isKycVerified: source === "kyc_verified" || profile?.kyc_status === "approved",
    profile,
    setUserCountry,
    refreshRegion,
    featureStatus: (feature: string) => policy.features[feature] ?? "available",
  }), [policy, source, isLoading, profile, setUserCountry, refreshRegion]);

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useUserRegion() {
  const context = useContext(RegionContext);
  if (!context) throw new Error("useUserRegion must be used inside UserRegionProvider");
  return context;
}

export function getRegionPolicy(code: string) { return REGION_POLICIES[code.toUpperCase()] ?? REGION_POLICIES[DEFAULT_CODE]; }
