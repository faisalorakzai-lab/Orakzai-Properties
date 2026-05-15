import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/contexts/AuthContext";
import { getProfile, type KYCStatus } from "./supabase";

export function useKYCStatus() {
  const { user, isLoaded } = useUser();
  const [kycStatus, setKycStatus] = useState<KYCStatus>("not_started");
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const profile = await getProfile(user.uid);
    if (profile) setKycStatus(profile.kyc_status);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (isLoaded) fetchStatus();
  }, [isLoaded, fetchStatus]);

  const isVerified = kycStatus === "approved";
  const isPending = kycStatus === "pending_review";

  return { kycStatus, loading, refetch: fetchStatus, isVerified, isPending };
}
