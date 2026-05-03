import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell, Home, TrendingUp, DollarSign, Megaphone, Smartphone,
  Shield, ChevronLeft, Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Show } from "@clerk/react";
import { Link } from "wouter";
import {
  useGetNotificationSettings,
  getGetNotificationSettingsQueryKey,
  useUpdateNotificationSettings,
  useSubscribePush,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "BH3X_32uex7jNV4TPMiLZN3_1KJ2AlXTY9r-qlTMj5NLUpSXpiD0SinBuC3E0x0dQCmfSNA3C2b7Q0UfZAT9vf4";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
  return arr.buffer as ArrayBuffer;
}

/* ─── Toggle switch ─── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-all duration-300 border ${
        checked
          ? "bg-[#C9A84C]/30 border-[#C9A84C]/50"
          : "bg-[#1e3a5f]/50 border-white/10"
      }`}
      style={{ height: "22px" }}
    >
      <motion.div
        animate={{ x: checked ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`absolute top-0.5 h-4 w-4 rounded-full transition-colors ${checked ? "bg-[#C9A84C]" : "bg-[#3a5070]"}`}
      />
    </button>
  );
}

/* ─── Setting row ─── */
function SettingRow({
  icon: Icon, color, bg, label, description, checked, onChange, delay = 0,
}: {
  icon: typeof Bell; color: string; bg: string; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
      className="flex items-center justify-between gap-4 py-4 border-b border-white/[0.05] last:border-0"
    >
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-[#4a6080] text-xs mt-0.5">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </motion.div>
  );
}

function SettingsPage() {
  const qc = useQueryClient();
  const [pushStatus, setPushStatus] = useState<"idle" | "requesting" | "subscribed" | "denied">("idle");
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  const { data: settings, isLoading } = useGetNotificationSettings({
    query: { queryKey: getGetNotificationSettingsQueryKey() },
  });
  const update = useUpdateNotificationSettings();
  const subscribePush = useSubscribePush();

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetNotificationSettingsQueryKey() });

  const handleToggle = (field: string, value: boolean) => {
    update.mutate(
      { data: { [field]: value } },
      { onSuccess: invalidate },
    );
  };

  /* Check current push permission state */
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") setPushStatus("subscribed");
    if (Notification.permission === "denied") setPushStatus("denied");
  }, []);

  const requestPushPermission = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Push notifications are not supported in this browser.");
      return;
    }
    setPushStatus("requesting");
    setShowPushPrompt(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.register(`${basePath}/sw.js`);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
      const json = sub.toJSON();
      await subscribePush.mutateAsync({
        data: {
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys!["p256dh"], auth: json.keys!["auth"] },
        },
      });
      setPushStatus("subscribed");
      handleToggle("pushEnabled", true);
    } catch (err) {
      console.error("Push subscribe error:", err);
      setPushStatus("denied");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#040b14" }}>
        <Navbar />
        <div className="pt-14 max-w-2xl mx-auto px-4 py-8 space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/[0.03] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #040b14 0%, #060e18 100%)" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full bg-[#C9A84C]/[0.04] blur-[100px]" />
      </div>
      <Navbar />
      <div className="pt-14 max-w-2xl mx-auto px-4 sm:px-6 py-8 relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href={`${basePath}/notifications`}>
            <button className="flex items-center gap-1.5 text-[#6a7f99] hover:text-[#C9A84C] text-xs mb-4 transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" /> Back to Alerts
            </button>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-white">Alert Settings</h1>
          <p className="text-[#4a6080] text-sm mt-1">Control which Sovereign Alerts you receive</p>
        </motion.div>

        {/* Sovereign Alerts Push Prompt */}
        {showPushPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mb-6 rounded-2xl border border-[#C9A84C]/35 p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0f1f0a 0%, #0c1828 100%)" }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(ellipse 60% 60% at 100% 0%, #C9A84C08, transparent)" }} />
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#C9A84C]/30"
                style={{ background: "linear-gradient(135deg, #C9A84C20, transparent)" }}>
                <Zap className="h-5 w-5 text-[#C9A84C]" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-base font-bold text-white mb-1">Enable Sovereign Alerts</h3>
                <p className="text-[#6a7f99] text-xs leading-relaxed mb-3">
                  Get instant push notifications for price movements, wealth events, and market opportunities — even when the app is closed.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={requestPushPermission}
                    className="h-8 flex items-center gap-2 px-4 rounded-xl text-xs font-bold transition-transform hover:scale-[1.03]"
                    style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}
                  >
                    <Bell className="h-3 w-3" /> Enable Now
                  </button>
                  <button onClick={() => setShowPushPrompt(false)}
                    className="h-8 px-3 rounded-xl text-xs text-[#4a6080] hover:text-white transition-colors">
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Alert categories */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/8 px-5 mb-5"
          style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}
        >
          <div className="py-3 border-b border-white/8">
            <h2 className="font-serif text-sm font-bold text-white">Alert Categories</h2>
            <p className="text-[#3a5070] text-[10px] mt-0.5">Choose which events trigger notifications</p>
          </div>

          <SettingRow
            icon={Home} color="text-sky-400" bg="bg-sky-500/10"
            label="Market Alerts"
            description="New properties listed in your saved search areas"
            checked={settings?.marketAlerts ?? true}
            onChange={v => handleToggle("marketAlerts", v)}
            delay={0.15}
          />
          <SettingRow
            icon={TrendingUp} color="text-[#C9A84C]" bg="bg-[#C9A84C]/10"
            label="Price Pulse"
            description="Share price moves ±2% on projects you own"
            checked={settings?.pricePulse ?? true}
            onChange={v => handleToggle("pricePulse", v)}
            delay={0.2}
          />
          <SettingRow
            icon={DollarSign} color="text-emerald-400" bg="bg-emerald-500/10"
            label="Wealth Alerts"
            description="Rental income & investment profit credited to Wallet"
            checked={settings?.wealthAlerts ?? true}
            onChange={v => handleToggle("wealthAlerts", v)}
            delay={0.25}
          />
          <SettingRow
            icon={Megaphone} color="text-purple-400" bg="bg-purple-500/10"
            label="System Updates"
            description="Announcements from Chairman Faisal & Orakzai Group"
            checked={settings?.systemUpdates ?? true}
            onChange={v => handleToggle("systemUpdates", v)}
            delay={0.3}
          />
        </motion.div>

        {/* Push notifications */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl border border-white/8 px-5 mb-5"
          style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}
        >
          <div className="py-3 border-b border-white/8">
            <h2 className="font-serif text-sm font-bold text-white">Push Notifications</h2>
            <p className="text-[#3a5070] text-[10px] mt-0.5">Receive alerts even when the app is closed</p>
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-[#C9A84C]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Browser Push</p>
                <p className="text-[#4a6080] text-xs mt-0.5">
                  {pushStatus === "subscribed" ? "Active — instant delivery enabled" :
                   pushStatus === "denied"     ? "Blocked in browser settings"      :
                   pushStatus === "requesting" ? "Requesting permission…"            :
                                                "Tap to enable instant delivery"    }
                </p>
              </div>
            </div>
            {pushStatus === "subscribed" ? (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Active</span>
            ) : pushStatus === "denied" ? (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">Blocked</span>
            ) : (
              <button
                onClick={() => setShowPushPrompt(true)}
                className="h-8 px-3 rounded-xl text-xs font-bold border border-[#C9A84C]/30 bg-[#C9A84C]/8 text-[#C9A84C] hover:bg-[#C9A84C]/15 transition-all"
              >
                Enable
              </button>
            )}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          className="flex items-start gap-2 bg-white/[0.015] border border-white/6 rounded-2xl p-4">
          <Shield className="w-4 h-4 text-[#C9A84C] mt-0.5 shrink-0" />
          <p className="text-[10px] text-[#2a3a50] leading-relaxed">
            Orakzai Properties sends alerts strictly related to your investments, listings, and wallet activity.
            We never share your contact details with third parties. You can disable any alert category at any time.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function NotificationSettings() {
  return (
    <>
      <Show when="signed-out">
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#040b14" }}>
          <Navbar />
          <div className="text-center mt-14 px-4">
            <Bell className="h-12 w-12 text-[#1e3a5f] mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-white font-bold mb-2">Sign In Required</h2>
            <Link href={`${basePath}/sign-in`}>
              <button className="px-6 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </Show>
      <Show when="signed-in"><SettingsPage /></Show>
    </>
  );
}
