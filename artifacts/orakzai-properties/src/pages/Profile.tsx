import { Link } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Shield, Home, BarChart2, Lock, ChevronRight, Award, Star, HardHat,
  Camera, Wallet2, Building2, TrendingUp, Globe, Zap, Activity,
  ArrowDownToLine, ArrowUpFromLine, MapPin, BadgeCheck,
  ShieldCheck, Fingerprint, Smartphone, ArrowRight, RefreshCw, Eye, EyeOff,
} from "lucide-react";
import { useUser, Show } from "@/contexts/AuthContext";
import { useKYCStatus } from "@/lib/useKYCStatus";

/* ── Design tokens ─────────────────────────────────────────────────── */
const T = {
  bg:        "#04080F",
  panel:     "rgba(255,255,255,0.028)",
  panelHov:  "rgba(255,255,255,0.055)",
  border:    "rgba(255,255,255,0.065)",
  borderGold:"rgba(201,168,76,0.35)",
  gold:      "#C9A84C",
  goldGlow:  "rgba(201,168,76,0.18)",
  goldFaint: "rgba(201,168,76,0.06)",
  fg:        "#EEF2FF",
  dim:       "#6B7591",
  dimMid:    "#9AA2B8",
  green:     "#10B981",
  greenGlow: "rgba(16,185,129,0.18)",
  red:       "#F43F5E",
  purple:    "#8B5CF6",
  cyan:      "#22D3EE",
};

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME    ?? "dvsjiufdv";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "ml_default";

/* ── Animated counter ──────────────────────────────────────────────── */
function Counter({ target, prefix = "", suffix = "", decimals = 0, duration = 1400 }: {
  target: number; prefix?: string; suffix?: string; decimals?: number; duration?: number;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    let raf: number;
    const tick = () => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      setVal(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  const fmt = (n: number | undefined | null) => {
    if (n === undefined || n === null || isNaN(n)) return (0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };
  return <>{prefix}{fmt(val)}{suffix}</>;
}

/* ── Glass card ────────────────────────────────────────────────────── */
function GCard({ children, style = {}, glow }: {
  children: React.ReactNode; style?: React.CSSProperties; glow?: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.panel,
        border: `1px solid ${hov && glow ? glow : T.border}`,
        borderRadius: 18,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: hov && glow ? `0 0 28px ${glow}, inset 0 1px 0 rgba(255,255,255,0.05)` : `inset 0 1px 0 rgba(255,255,255,0.04)`,
        transition: "border-color .25s, box-shadow .25s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Static data ────────────────────────────────────────────────────── */
const ACTIVITY = [
  { label: "Rental Payout",         sub: "Orakzai Heights — DHA Lahore", amount: "+PKR 125,000", color: T.green,  icon: ArrowDownToLine, date: "Today, 09:14 AM" },
  { label: "Property Share Bought", sub: "Ocean Tower — Dubai",           amount: "-PKR 250,000", color: T.red,    icon: Building2,       date: "Yesterday, 3:02 PM" },
  { label: "USDT Deposit",          sub: "Wallet top-up",                 amount: "+500 USDT",    color: T.green,  icon: ArrowDownToLine, date: "21 May, 11:55 AM" },
  { label: "OKBOND Yield Claim",    sub: "Q2 distribution",               amount: "+18 OKB",      color: T.gold,   icon: Award,           date: "20 May, 8:30 AM" },
  { label: "Token Transfer",        sub: "To portfolio wallet",           amount: "-100 USDC",    color: T.purple, icon: ArrowUpFromLine, date: "18 May, 2:17 PM" },
];

const PROPERTIES = [
  { name: "Orakzai Heights",  loc: "DHA Phase 6, Lahore",  own: 35, roi: 12.45, yield: "PKR 125K/mo", img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80" },
  { name: "Ocean Tower",      loc: "Dubai Maritime City",  own: 25, roi: 9.75,  yield: "PKR 145K/mo", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80" },
  { name: "Business Hub",     loc: "Bahria Town, Karachi", own: 20, roi: 11.20, yield: "PKR 75K/mo",  img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80" },
];

const WEALTH = [
  { label: "Total Net Worth",   value: 28790450, prefix: "PKR ", suffix: "",        decimals: 0, color: T.gold,   icon: TrendingUp },
  { label: "Monthly Yield",     value: 345750,   prefix: "PKR ", suffix: "",        decimals: 0, color: T.green,  icon: Activity },
  { label: "Active Properties", value: 3,        prefix: "",     suffix: " Assets", decimals: 0, color: T.purple, icon: Building2 },
  { label: "Rental YTD",        value: 2074500,  prefix: "PKR ", suffix: "",        decimals: 0, color: T.cyan,   icon: Wallet2 },
];

const SECURITY = [
  { label: "Wallet Connected",    ok: true,  icon: Wallet2 },
  { label: "KYC Verified",        ok: true,  icon: ShieldCheck },
  { label: "2FA Enabled",         ok: false, icon: Smartphone },
  { label: "Blockchain Verified", ok: true,  icon: Globe },
  { label: "Biometric Trust",     ok: true,  icon: Fingerprint },
];

const MENU = [
  { icon: Shield,   label: "KYC Verification",  sub: "Identity & compliance docs",  href: "/kyc" },
  { icon: Home,     label: "My Properties",      sub: "Owned & listed real estate",  href: "/my-properties" },
  { icon: BarChart2,label: "Trade History",      sub: "All orders & transactions",   href: "/wallet" },
  { icon: Lock,     label: "Security Center",    sub: "2FA, sessions & devices",     href: "/" },
];

/* ═══════════════════════════════════════════════════════════════════ */
export default function Profile() {
  const { user }                     = useUser();
  const { kycStatus }                = useKYCStatus();
  const [photoUrl, setPhotoUrl]      = useState<string | null>(null);
  const [uploading, setUploading]    = useState(false);
  const [uploadErr, setUploadErr]    = useState("");
  const [hideWealth, setHideWealth]  = useState(false);
  const [mobile, setMobile]          = useState(window.innerWidth < 640);

  /* Sync photoUrl whenever Firebase user's photoURL changes */
  useEffect(() => {
    if (user?.imageUrl) setPhotoUrl(user.imageUrl);
  }, [user?.imageUrl]);

  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  /* Photo upload */
  const uploadPhoto = useCallback(async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!data.secure_url) throw new Error(data.error?.message ?? "Upload failed");
      const url: string = data.secure_url;
      /* Update Firebase display + reload so imageUrl reflects immediately */
      if (user?._raw) {
        await updateProfile(user._raw, { photoURL: url });
        await auth.currentUser?.reload();
      }
      setPhotoUrl(url);
    } catch (e: any) {
      setUploadErr(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [user]);

  const displayName = user?.fullName ?? user?.firstName ?? "Faisal Orakzai";
  const email       = user?.primaryEmailAddress?.emailAddress ?? "faisal@orakzaiproperties.com";
  const initials    = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const kycColor = kycStatus === "approved"       ? T.green
    : kycStatus === "pending_review" ? "#F59E0B"
    : kycStatus === "rejected"       ? T.red : T.dim;
  const kycLabel = kycStatus === "approved"       ? "Sovereign Verified"
    : kycStatus === "pending_review" ? "KYC Pending Review"
    : kycStatus === "rejected"       ? "KYC Rejected" : "KYC Required";

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, color: T.fg, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: mobile ? 100 : 60 }}>

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "30%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${T.goldGlow} 0%, transparent 70%)`, filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto", padding: `0 ${mobile ? 14 : 24}px` }}>

        {/* ═══ HERO ══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}
          style={{ paddingTop: 52, paddingBottom: 28, textAlign: "center" }}>

          {/* Avatar — uses <label> so mobile browsers open file picker reliably */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
            {/* Outer glow ring */}
            <motion.div animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 4, repeat: Infinity }}
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 148, height: 148, borderRadius: "50%", background: `radial-gradient(circle, ${T.gold}30 0%, transparent 70%)`, pointerEvents: "none" }} />
            {/* Dashed rotation ring */}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 126, height: 126, borderRadius: "50%", border: `1.5px dashed rgba(201,168,76,0.22)`, pointerEvents: "none" }} />

            {/* Avatar label — clicking opens file picker on ALL devices */}
            <label htmlFor="avatar-upload" style={{ display: "block", cursor: "pointer" }}>
              <motion.div
                animate={{ boxShadow: [`0 0 0 0px rgba(201,168,76,0.4), 0 0 32px rgba(201,168,76,0.25)`, `0 0 0 6px rgba(201,168,76,0), 0 0 48px rgba(201,168,76,0.35)`, `0 0 0 0px rgba(201,168,76,0.4), 0 0 32px rgba(201,168,76,0.25)`] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ width: 108, height: 108, borderRadius: "50%", border: `2.5px solid ${T.gold}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.06))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: T.gold }}>
                    {initials}
                  </div>
                )}
                {/* Camera overlay */}
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.52)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", opacity: uploading ? 1 : 0, transition: "opacity .2s" }}
                  onMouseEnter={e => !uploading && ((e.currentTarget as HTMLDivElement).style.opacity = "1")}
                  onMouseLeave={e => !uploading && ((e.currentTarget as HTMLDivElement).style.opacity = "0")}>
                  {uploading
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw size={22} color={T.gold} /></motion.div>
                    : <Camera size={24} color={T.gold} />}
                </div>
              </motion.div>
            </label>

            {/* KYC shield badge */}
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 32, height: 32, borderRadius: "50%", background: kycStatus === "approved" ? `linear-gradient(135deg, ${T.green}, #059669)` : `${kycColor}cc`, border: `2px solid ${T.bg}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 14px ${kycColor}60` }}>
              <ShieldCheck size={15} color="#fff" />
            </div>
          </div>

          {/* Hidden file input — id matches label's htmlFor */}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }}
          />

          {/* Upload status */}
          {uploading && <p style={{ fontSize: 11, color: T.gold, marginBottom: 6 }}>Uploading photo…</p>}
          {uploadErr && <p style={{ fontSize: 11, color: T.red, marginBottom: 6 }}>{uploadErr}</p>}

          {/* Change Photo hint */}
          <label htmlFor="avatar-upload" style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer", marginBottom: 14, padding: "4px 12px", borderRadius: 999, border: `1px solid ${T.borderGold}`, background: T.goldFaint }}>
            <Camera size={11} color={T.gold} />
            <span style={{ fontSize: 10, color: T.gold, fontWeight: 700 }}>{uploading ? "Uploading…" : "Change Photo"}</span>
          </label>

          {/* Name */}
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}
            style={{ fontFamily: "'Playfair Display', serif", fontSize: mobile ? 22 : 26, fontWeight: 700, color: T.fg, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            <Show when="signed-in">{displayName}</Show>
            <Show when="signed-out">Faisal Orakzai</Show>
          </motion.h1>
          <p style={{ fontSize: 13, color: T.dim, margin: "0 0 14px" }}>
            <Show when="signed-in">{email}</Show>
            <Show when="signed-out">faisal@orakzaiproperties.com</Show>
          </p>

          {/* Status chips */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}
            style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", marginBottom: 10 }}>
            {[
              { label: "Platinum Investor",   color: T.gold   },
              { label: "Sovereign Holder",    color: T.green  },
              { label: "Global Access",       color: T.cyan   },
              { label: kycLabel,              color: kycColor },
            ].map(({ label, color }) => (
              <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 999, background: `${color}12`, border: `1px solid ${color}35`, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>
                <BadgeCheck size={9} />{label}
              </span>
            ))}
          </motion.div>

          {/* Live pulse */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "rgba(255,255,255,0.025)", border: `1px solid ${T.border}` }}>
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block" }} />
            <span style={{ fontSize: 10, color: T.dimMid, fontWeight: 600 }}>Wealth Account Active · Last sync 2 min ago</span>
          </div>
        </motion.div>

        {/* ═══ LIVE WEALTH PANEL ════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .22 }} style={{ marginBottom: 14 }}>
          <GCard style={{ padding: "18px 18px 16px" }} glow={T.goldGlow}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.fg, display: "flex", alignItems: "center", gap: 8 }}>
                <Activity size={14} color={T.gold} /> Live Wealth Overview
              </div>
              <button onClick={() => setHideWealth(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: T.dim }}>
                {hideWealth ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10 }}>
              {WEALTH.map(({ label, value, prefix, suffix, decimals, color, icon: Icon }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 + i * .07 }}
                  style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 12px" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <Icon size={13} color={color} />
                  </div>
                  <div style={{ fontSize: mobile ? 12 : 14, fontWeight: 900, color: T.fg, fontVariantNumeric: "tabular-nums", filter: hideWealth ? "blur(8px)" : "none", transition: "filter .2s" }}>
                    {hideWealth ? "••••" : <Counter target={value} prefix={prefix} suffix={suffix} decimals={decimals} />}
                  </div>
                  <div style={{ fontSize: 9, color: T.dim, marginTop: 3 }}>{label}</div>
                </motion.div>
              ))}
            </div>
          </GCard>
        </motion.div>

        {/* ═══ PROPERTY HOLDINGS ════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .28 }} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.fg, display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={14} color={T.gold} /> Property Holdings
            </div>
            <Link href="/my-properties">
              <button style={{ fontSize: 10, color: T.gold, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                View All <ChevronRight size={11} />
              </button>
            </Link>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as any}>
            {PROPERTIES.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 + i * .09 }}
                style={{ minWidth: 180, flexShrink: 0, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer" }}
                whileHover={{ y: -4, borderColor: T.borderGold, boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 0 20px ${T.goldGlow}` }}>
                <div style={{ position: "relative", height: 96, overflow: "hidden" }}>
                  <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(4,8,15,0) 0%, rgba(4,8,15,0.7) 100%)" }} />
                  <div style={{ position: "absolute", top: 7, right: 7, background: T.greenGlow, border: "1px solid rgba(16,185,129,0.35)", borderRadius: 20, padding: "2px 7px", fontSize: 8, color: T.green, fontWeight: 700 }}>{p.roi}% APY</div>
                  <div style={{ position: "absolute", top: 7, left: 7, background: T.goldFaint, border: `1px solid ${T.borderGold}`, borderRadius: 20, padding: "2px 7px", fontSize: 8, color: T.gold, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
                    <BadgeCheck size={7} /> Verified
                  </div>
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.fg, marginBottom: 3 }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: T.dim, marginBottom: 8 }}>
                    <MapPin size={8} />{p.loc}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                    {[["Ownership", `${p.own}%`], ["Yield", p.yield]].map(([l, v]) => (
                      <div key={l} style={{ background: "rgba(255,255,255,0.025)", borderRadius: 7, padding: "6px 7px" }}>
                        <div style={{ fontSize: 7, color: T.dim }}>{l}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.fg }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══ MENU GRID ════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .33 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {MENU.map(({ icon: Icon, label, sub, href }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35 + i * .06 }}>
              <Link href={href}>
                <motion.div whileHover={{ y: -2, borderColor: T.borderGold, background: T.goldFaint }}
                  style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 18, padding: "17px 15px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, position: "relative", transition: "all .2s" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: T.goldFaint, border: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={17} color={T.gold} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: T.fg, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 10, color: T.dim }}>{sub}</div>
                  </div>
                  <ChevronRight size={12} style={{ position: "absolute", bottom: 14, right: 14, color: T.dim }} />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══ SECURITY COMMAND CENTER ══════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .42 }} style={{ marginBottom: 14 }}>
          <GCard style={{ padding: "18px 18px" }} glow="rgba(16,185,129,0.15)">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: T.greenGlow, border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={15} color={T.green} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>Security Command</div>
                <div style={{ fontSize: 9, color: T.dim }}>Account protection status</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 9, color: T.green, background: T.greenGlow, border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>4/5 Secured</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {SECURITY.map(({ label, ok, icon: Icon }, i) => (
                <motion.div key={label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .44 + i * .05 }}
                  style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", background: "rgba(255,255,255,0.02)", borderRadius: 11, border: `1px solid ${ok ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)"}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: ok ? T.greenGlow : "rgba(244,63,94,0.12)", border: `1px solid ${ok ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={13} color={ok ? T.green : T.red} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.fg }}>{label}</div>
                    <div style={{ fontSize: 9, color: T.dim }}>{ok ? "Active & Verified" : "Setup Required"}</div>
                  </div>
                  <motion.div animate={ok ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } : {}} transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ width: 8, height: 8, borderRadius: "50%", background: ok ? T.green : T.red, boxShadow: `0 0 8px ${ok ? T.green : T.red}80` }} />
                </motion.div>
              ))}
            </div>
          </GCard>
        </motion.div>

        {/* ═══ AI WEALTH INTELLIGENCE ═══════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .48 }} style={{ marginBottom: 14 }}>
          <GCard style={{ padding: "18px 18px" }} glow={T.goldGlow}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity }}
                style={{ width: 32, height: 32, borderRadius: 9, background: `radial-gradient(circle, ${T.gold}50, transparent)`, border: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={15} color={T.gold} />
              </motion.div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>AI Wealth Intelligence</div>
                <div style={{ fontSize: 9, color: T.dim }}>Personalized market signals</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { msg: "High rental demand in DHA Lahore — occupancy at 96%", type: "bullish" },
                { msg: "Dubai Marina luxury inventory low — consider acquiring Q3", type: "alert" },
                { msg: "OKBOND yield rate increased to 8.8% APY this quarter", type: "bullish" },
                { msg: "Orakzai Heights Phase 2 completes August 2025", type: "info" },
              ].map(({ msg, type }, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .5 + i * .06 }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 11px", borderRadius: 10, background: type === "bullish" ? T.greenGlow : type === "alert" ? "rgba(201,168,76,0.08)" : "rgba(34,211,238,0.06)", border: `1px solid ${type === "bullish" ? "rgba(16,185,129,0.2)" : type === "alert" ? T.borderGold : "rgba(34,211,238,0.2)"}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5, background: type === "bullish" ? T.green : type === "alert" ? T.gold : T.cyan, boxShadow: `0 0 6px ${type === "bullish" ? T.green : type === "alert" ? T.gold : T.cyan}` }} />
                  <span style={{ fontSize: 11, color: T.dimMid, lineHeight: 1.6 }}>{msg}</span>
                </motion.div>
              ))}
            </div>
          </GCard>
        </motion.div>

        {/* ═══ ACTIVITY FEED ════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .53 }} style={{ marginBottom: 14 }}>
          <GCard style={{ overflow: "hidden" }}>
            <div style={{ padding: "15px 18px 13px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.fg, display: "flex", alignItems: "center", gap: 8 }}>
                Recent Activity
              </div>
              <Link href="/wallet">
                <button style={{ fontSize: 10, color: T.gold, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                  View All <ChevronRight size={11} />
                </button>
              </Link>
            </div>
            <div style={{ padding: "0 18px" }}>
              {ACTIVITY.map(({ label, sub, amount, color, icon: Icon, date }, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .55 + i * .06 }}
                  style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: i < ACTIVITY.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${color}18`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={13} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
                    <div style={{ fontSize: 9, color: T.dim }}>{sub}</div>
                    <div style={{ fontSize: 8, color: "rgba(107,117,145,0.6)", marginTop: 1 }}>{date}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color }}>{amount}</div>
                    <div style={{ fontSize: 8, color: T.green, background: T.greenGlow, border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "1px 6px", marginTop: 3, display: "inline-block" }}>Confirmed</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GCard>
        </motion.div>

        {/* ═══ SETTINGS LIST ════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .58 }} style={{ marginBottom: 14 }}>
          <GCard style={{ overflow: "hidden" }}>
            {[
              { label: "Notifications",    href: "/notifications", sub: "Manage alerts & payouts" },
              { label: "Subscription",     href: "/pricing",       sub: "Manage your membership" },
              { label: "Help & Support",   href: "/",              sub: "24/7 institutional support" },
            ].map(({ label, href, sub }, i) => (
              <Link key={label} href={href}>
                <motion.div whileHover={{ background: T.panelHov }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: i < 2 ? `1px solid rgba(255,255,255,0.04)` : "none", cursor: "pointer", transition: "background .15s" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.fg }}>{label}</div>
                    <div style={{ fontSize: 9, color: T.dim, marginTop: 2 }}>{sub}</div>
                  </div>
                  <ChevronRight size={14} color={T.dim} />
                </motion.div>
              </Link>
            ))}
          </GCard>
        </motion.div>

        {/* ═══ DEVELOPER CTA ════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .62, type: "spring", stiffness: 260, damping: 24 }} style={{ marginBottom: 12 }}>
          <motion.button whileHover={{ y: -2, boxShadow: `0 16px 48px rgba(201,168,76,0.45)` }} whileTap={{ scale: 0.98 }}
            style={{ width: "100%", padding: "20px 22px", borderRadius: 20, background: `linear-gradient(135deg, ${T.gold} 0%, #B8890F 50%, #8B6010 100%)`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, boxShadow: `0 8px 32px rgba(201,168,76,0.30)`, position: "relative", overflow: "hidden" }}>
            <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <HardHat size={21} color="#0a0800" />
            </div>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0a0800", letterSpacing: "-0.01em", fontFamily: "'Playfair Display', serif" }}>Become a Developer / Builder</div>
              <div style={{ fontSize: 11, color: "rgba(10,8,0,0.6)", marginTop: 3 }}>List projects · Raise capital · Build your portfolio</div>
            </div>
            <ArrowRight size={17} color="rgba(10,8,0,0.45)" style={{ flexShrink: 0 }} />
          </motion.button>
        </motion.div>

        <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.1)", paddingBottom: 8 }}>
          Orakzai Properties · Private Wealth Platform
        </p>
      </div>
    </div>
  );
}
