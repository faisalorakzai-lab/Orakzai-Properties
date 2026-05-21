import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfile } from "firebase/auth";
import {
  Shield, Home, BarChart2, Lock, ChevronRight, Award, Star, HardHat,
  CheckCircle2, Clock, XCircle, Camera, Wallet2, Building2, TrendingUp,
  Bell, Settings, Globe, Zap, Activity, CreditCard, Eye, EyeOff,
  ArrowDownToLine, ArrowUpFromLine, MapPin, BadgeCheck, User, Copy,
  ShieldCheck, Fingerprint, Smartphone, ArrowRight, RefreshCw,
} from "lucide-react";
import { useUser, Show } from "@/contexts/AuthContext";
import { useKYCStatus } from "@/lib/useKYCStatus";

/* ── Design tokens (match Wallet) ───────────────────────────────────────────── */
const T = {
  bg:        "#04080F",
  panel:     "rgba(255,255,255,0.028)",
  panelHov:  "rgba(255,255,255,0.055)",
  border:    "rgba(255,255,255,0.065)",
  borderGold:"rgba(201,168,76,0.35)",
  gold:      "#C9A84C",
  goldBright:"#E8C060",
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

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
function fmtNum(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/* ── Animated counter ─────────────────────────────────────────────────────────── */
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
  return <>{prefix}{fmtNum(val, decimals)}{suffix}</>;
}

/* ── Glass card ───────────────────────────────────────────────────────────────── */
function GCard({
  children, style = {}, glow,
}: { children: React.ReactNode; style?: React.CSSProperties; glow?: string }) {
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
        boxShadow: hov && glow
          ? `0 0 28px ${glow}, inset 0 1px 0 rgba(255,255,255,0.05)`
          : `inset 0 1px 0 rgba(255,255,255,0.04)`,
        transition: "border-color .25s, box-shadow .25s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Activity feed item ──────────────────────────────────────────────────────── */
const ACTIVITY = [
  { type: "payout",    label: "Rental Payout",          sub: "Orakzai Heights — DHA Lahore", amount: "+PKR 125,000", color: T.green,  icon: ArrowDownToLine,  date: "Today, 09:14 AM" },
  { type: "purchase",  label: "Property Share Bought",   sub: "Ocean Tower — Dubai",          amount: "-PKR 250,000", color: T.red,    icon: Building2,        date: "Yesterday, 3:02 PM" },
  { type: "deposit",   label: "USDT Deposit",            sub: "Wallet top-up",                amount: "+500 USDT",    color: T.green,  icon: ArrowDownToLine,  date: "21 May, 11:55 AM" },
  { type: "yield",     label: "OKBOND Yield Claim",      sub: "Q2 distribution",              amount: "+18 OKB",      color: T.gold,   icon: Award,            date: "20 May, 8:30 AM" },
  { type: "transfer",  label: "Token Transfer",          sub: "To portfolio wallet",          amount: "-100 USDC",    color: T.purple, icon: ArrowUpFromLine,  date: "18 May, 2:17 PM" },
];

const PROPERTIES = [
  { name: "Orakzai Heights",  loc: "DHA Phase 6, Lahore",  own: 35, roi: 12.45, yield: "PKR 125K/mo", img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80" },
  { name: "Ocean Tower",      loc: "Dubai Maritime City",  own: 25, roi: 9.75,  yield: "PKR 145K/mo", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80" },
  { name: "Business Hub",     loc: "Bahria Town, Karachi", own: 20, roi: 11.20, yield: "PKR 75K/mo",  img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80" },
];

const WEALTH = [
  { label: "Total Net Worth",   value: 28790450, prefix: "PKR ", suffix: "",    decimals: 0, color: T.gold,   icon: TrendingUp  },
  { label: "Monthly Yield",     value: 345750,   prefix: "PKR ", suffix: "",    decimals: 0, color: T.green,  icon: Activity    },
  { label: "Active Properties", value: 3,        prefix: "",     suffix: " Assets", decimals: 0, color: T.purple, icon: Building2 },
  { label: "Rental Income YTD", value: 2074500,  prefix: "PKR ", suffix: "",    decimals: 0, color: T.cyan,   icon: Wallet2     },
];

const SECURITY = [
  { label: "Wallet Connected",    status: true,  color: T.green,  icon: Wallet2       },
  { label: "KYC Verified",        status: true,  color: T.green,  icon: ShieldCheck   },
  { label: "2FA Enabled",         status: false, color: T.red,    icon: Smartphone    },
  { label: "Blockchain Verified", status: true,  color: T.green,  icon: Globe         },
  { label: "Biometric Trust",     status: true,  color: T.green,  icon: Fingerprint   },
];

export default function Profile() {
  const { user }                   = useUser();
  const { kycStatus, loading: kycL } = useKYCStatus();
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl]    = useState<string | null>(user?.imageUrl ?? null);
  const [hideWealth, setHideWealth] = useState(false);
  const fileRef                    = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile]    = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const uploadPhoto = async (file: File) => {
    if (!file || !user?._raw) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.secure_url) {
        await updateProfile(user._raw, { photoURL: data.secure_url });
        setPhotoUrl(data.secure_url);
      }
    } catch { /* silent */ }
    finally { setPhotoUploading(false); }
  };

  const displayName = user?.fullName ?? user?.firstName ?? "Faisal Orakzai";
  const email       = user?.primaryEmailAddress?.emailAddress ?? "faisal@orakzaiproperties.com";
  const initials    = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const kycColor = kycStatus === "approved" ? T.green
    : kycStatus === "pending_review" ? "#F59E0B"
    : kycStatus === "rejected" ? T.red : T.dim;

  const kycLabel = kycStatus === "approved" ? "Sovereign Verified"
    : kycStatus === "pending_review" ? "KYC Pending Review"
    : kycStatus === "rejected" ? "KYC Rejected"
    : "KYC Required";

  const MENU = [
    { icon: Shield,   label: "KYC Verification",  sub: "Identity & compliance docs",    href: "/kyc",          badge: kycLabel, badgeColor: kycColor },
    { icon: Home,     label: "My Properties",      sub: "Owned & listed real estate",    href: "/my-properties",badge: "3 Active",badgeColor: T.green },
    { icon: BarChart2,label: "Trade History",      sub: "All orders & transactions",     href: "/wallet",       badge: undefined, badgeColor: undefined },
    { icon: Lock,     label: "Security Center",    sub: "2FA, sessions & devices",       href: "/",             badge: "Action", badgeColor: T.red },
  ];

  return (
    <div style={{
      minHeight: "100dvh", background: T.bg,
      color: T.fg, fontFamily: "'Plus Jakarta Sans', sans-serif",
      paddingBottom: isMobile ? 100 : 60,
    }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-10%", left: "30%",
          width: 500, height: 500, borderRadius: "50%",
          background: `radial-gradient(circle, ${T.goldGlow} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "10%",
          width: 300, height: 300, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)`,
          filter: "blur(80px)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto", padding: `0 ${isMobile ? 14 : 24}px` }}>

        {/* ── SOVEREIGN IDENTITY HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .6 }}
          style={{ paddingTop: 52, paddingBottom: 32, textAlign: "center" }}
        >
          {/* Avatar ring system */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 22 }}>
            {/* Outer ambient glow ring */}
            <motion.div
              animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: 148, height: 148, borderRadius: "50%",
                background: `radial-gradient(circle, ${T.gold}30 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />
            {/* Investor tier ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: 126, height: 126, borderRadius: "50%",
                border: `1.5px dashed rgba(201,168,76,0.25)`,
                pointerEvents: "none",
              }}
            />
            {/* Gold pulse border */}
            <motion.div
              animate={{ boxShadow: [
                `0 0 0 0px rgba(201,168,76,0.4), 0 0 32px rgba(201,168,76,0.25)`,
                `0 0 0 6px rgba(201,168,76,0.0), 0 0 48px rgba(201,168,76,0.35)`,
                `0 0 0 0px rgba(201,168,76,0.4), 0 0 32px rgba(201,168,76,0.25)`,
              ]}}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                width: 108, height: 108, borderRadius: "50%",
                border: `2.5px solid ${T.gold}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", cursor: "pointer", position: "relative",
              }}
              onClick={() => fileRef.current?.click()}
            >
              {photoUrl ? (
                <img src={photoUrl} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  background: `linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.06))`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, fontWeight: 900, color: T.gold,
                  fontFamily: "'Playfair Display', serif",
                }}>
                  {initials}
                </div>
              )}
              {/* Camera hover overlay */}
              <div
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0, transition: "opacity .2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
              >
                {photoUploading
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw size={20} color={T.gold} /></motion.div>
                  : <Camera size={22} color={T.gold} />}
              </div>
            </motion.div>

            {/* Verification shield */}
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: .4, type: "spring", stiffness: 280, damping: 20 }}
              style={{
                position: "absolute", bottom: -2, right: -2,
                width: 32, height: 32, borderRadius: "50%",
                background: kycStatus === "approved"
                  ? `linear-gradient(135deg, ${T.green}, #059669)`
                  : `linear-gradient(135deg, ${kycColor}, ${kycColor}aa)`,
                border: `2px solid ${T.bg}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 14px ${kycColor}60`,
              }}
            >
              {kycStatus === "approved"
                ? <ShieldCheck size={15} color="#fff" />
                : <Shield size={14} color="#fff" />}
            </motion.div>
          </div>

          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />

          {/* Name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .15 }}
          >
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? 24 : 28, fontWeight: 700,
              color: T.fg, margin: "0 0 4px", letterSpacing: "-0.02em",
            }}>
              <Show when="signed-in">{displayName}</Show>
              <Show when="signed-out">Faisal Orakzai</Show>
            </h1>
            <p style={{ fontSize: 13, color: T.dim, margin: "0 0 14px" }}>
              <Show when="signed-in">{email}</Show>
              <Show when="signed-out">faisal@orakzaiproperties.com</Show>
            </p>
          </motion.div>

          {/* Status badges */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .2 }}
            style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 6 }}
          >
            {[
              { label: "Platinum Investor",  color: T.gold,   bg: T.goldFaint,                border: T.borderGold },
              { label: "Sovereign Holder",   color: T.green,  bg: T.greenGlow,               border: "rgba(16,185,129,0.3)" },
              { label: "Global Access",      color: T.cyan,   bg: "rgba(34,211,238,0.08)",   border: "rgba(34,211,238,0.3)" },
              { label: kycLabel,             color: kycColor, bg: `${kycColor}12`,            border: `${kycColor}40` },
            ].map(({ label, color, bg, border }) => (
              <motion.span
                key={label}
                whileHover={{ scale: 1.04 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 999,
                  background: bg, border: `1px solid ${border}`,
                  color, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                }}
              >
                <BadgeCheck size={9} />
                {label}
              </motion.span>
            ))}
          </motion.div>

          {/* Live wealth status */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "7px 16px", borderRadius: 999,
              background: "rgba(255,255,255,0.025)",
              border: `1px solid ${T.border}`,
              marginTop: 6,
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block" }}
            />
            <span style={{ fontSize: 11, color: T.dimMid, fontWeight: 600 }}>
              Wealth Account Active · Last sync 2 min ago
            </span>
          </motion.div>
        </motion.div>

        {/* ── LIVE WEALTH PANEL ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .25 }}
          style={{ marginBottom: 14 }}
        >
          <GCard style={{ padding: "20px 20px 18px" }} glow={T.goldGlow}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.fg, display: "flex", alignItems: "center", gap: 8 }}>
                <Activity size={14} color={T.gold} /> Live Wealth Overview
              </div>
              <button
                onClick={() => setHideWealth(!hideWealth)}
                style={{ background: "none", border: "none", cursor: "pointer", color: T.dim }}
              >
                {hideWealth ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)",
              gap: 10,
            }}>
              {WEALTH.map(({ label, value, prefix, suffix, decimals, color, icon: Icon }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: .28 + i * 0.07 }}
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: `1px solid ${T.border}`,
                    borderRadius: 14, padding: "14px 14px",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: `${color}18`, border: `1px solid ${color}28`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 10,
                  }}>
                    <Icon size={13} color={color} />
                  </div>
                  <div style={{
                    fontSize: isMobile ? 13 : 15, fontWeight: 900,
                    color: T.fg, fontVariantNumeric: "tabular-nums",
                    filter: hideWealth ? "blur(8px)" : "none",
                    transition: "filter .2s",
                  }}>
                    {hideWealth ? "••••" : <Counter target={value} prefix={prefix} suffix={suffix} decimals={decimals} />}
                  </div>
                  <div style={{ fontSize: 9, color: T.dim, marginTop: 3 }}>{label}</div>
                </motion.div>
              ))}
            </div>
          </GCard>
        </motion.div>

        {/* ── PROPERTY HOLDINGS PREVIEW ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .3 }} style={{ marginBottom: 14 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.fg, display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={14} color={T.gold} /> Property Holdings
            </div>
            <Link href="/my-properties">
              <button style={{ fontSize: 10, color: T.gold, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                View All <ChevronRight size={11} />
              </button>
            </Link>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            {PROPERTIES.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: .32 + i * 0.1, type: "spring", stiffness: 220, damping: 24 }}
                style={{
                  minWidth: 190, flexShrink: 0,
                  background: T.panel, border: `1px solid ${T.border}`,
                  borderRadius: 16, overflow: "hidden", cursor: "pointer",
                  transition: "all .25s",
                }}
                whileHover={{ y: -4, borderColor: T.borderGold, boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 0 20px ${T.goldGlow}` }}
              >
                <div style={{ position: "relative", height: 100, overflow: "hidden" }}>
                  <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
                    onMouseEnter={e => ((e.target as HTMLImageElement).style.transform = "scale(1.07)")}
                    onMouseLeave={e => ((e.target as HTMLImageElement).style.transform = "scale(1)")}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(4,8,15,0.05) 0%, rgba(4,8,15,0.7) 100%)" }} />
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    background: T.greenGlow, border: "1px solid rgba(16,185,129,0.35)",
                    borderRadius: 20, padding: "2px 7px", fontSize: 8, color: T.green, fontWeight: 700,
                  }}>
                    {p.roi}% APY
                  </div>
                  <div style={{
                    position: "absolute", top: 8, left: 8,
                    background: T.goldFaint, border: `1px solid ${T.borderGold}`,
                    borderRadius: 20, padding: "2px 7px", fontSize: 8, color: T.gold, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 3,
                  }}>
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

        {/* ── INVESTOR MENU GRID ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .35 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}
        >
          {MENU.map(({ icon: Icon, label, sub, href, badge, badgeColor }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: .37 + i * 0.06 }}
            >
              <Link href={href}>
                <motion.div
                  whileHover={{ y: -2, borderColor: T.borderGold, background: T.goldFaint }}
                  style={{
                    background: T.panel, border: `1px solid ${T.border}`,
                    borderRadius: 18, padding: "18px 16px",
                    cursor: "pointer", position: "relative",
                    display: "flex", flexDirection: "column", gap: 10,
                    transition: "all .2s",
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: T.goldFaint, border: `1px solid ${T.borderGold}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={17} color={T.gold} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: T.fg, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 10, color: T.dim }}>{sub}</div>
                  </div>
                  {badge && badgeColor && (
                    <div style={{
                      position: "absolute", top: 12, right: 12,
                      fontSize: 8, fontWeight: 700, color: badgeColor,
                      background: `${badgeColor}15`, border: `1px solid ${badgeColor}35`,
                      borderRadius: 999, padding: "2px 7px",
                      letterSpacing: "0.04em", textTransform: "uppercase",
                    }}>
                      {badge}
                    </div>
                  )}
                  <ChevronRight size={12} style={{ position: "absolute", bottom: 14, right: 14, color: T.dim }} />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ── SECURITY COMMAND CENTER ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .45 }} style={{ marginBottom: 14 }}
        >
          <GCard style={{ padding: "18px 20px" }} glow="rgba(16,185,129,0.15)">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: T.greenGlow, border: "1px solid rgba(16,185,129,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ShieldCheck size={15} color={T.green} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>Security Command</div>
                <div style={{ fontSize: 9, color: T.dim }}>Military-grade account protection</div>
              </div>
              <div style={{
                marginLeft: "auto", fontSize: 9, color: T.green,
                background: T.greenGlow, border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 20, padding: "2px 8px", fontWeight: 700,
              }}>4/5 Secured</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SECURITY.map(({ label, status, color, icon: Icon }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: .47 + i * 0.06 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.02)", borderRadius: 12,
                    border: `1px solid ${status ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)"}`,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: status ? T.greenGlow : "rgba(244,63,94,0.12)",
                    border: `1px solid ${status ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={13} color={status ? T.green : T.red} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.fg }}>{label}</div>
                    <div style={{ fontSize: 9, color: T.dim }}>{status ? "Active & Verified" : "Setup Required"}</div>
                  </div>
                  <motion.div
                    animate={status ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } : {}}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: status ? T.green : T.red,
                      boxShadow: `0 0 8px ${status ? T.green : T.red}80`,
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </GCard>
        </motion.div>

        {/* ── WEALTH INTELLIGENCE PANEL ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .5 }} style={{ marginBottom: 14 }}
        >
          <GCard style={{ padding: "18px 20px" }} glow={T.goldGlow}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: `radial-gradient(circle, ${T.gold}50, transparent)`,
                  border: `1px solid ${T.borderGold}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Zap size={15} color={T.gold} />
              </motion.div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>AI Wealth Intelligence</div>
                <div style={{ fontSize: 9, color: T.dim }}>Personalized market signals</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { msg: "High rental demand detected in DHA Lahore — occupancy at 96%", type: "bullish" },
                { msg: "Dubai Marina luxury inventory running low — consider acquiring Q3", type: "alert" },
                { msg: "OKBOND yield rate increased to 8.8% APY this quarter", type: "bullish" },
                { msg: "Orakzai Heights construction Phase 2 completes Aug 2025", type: "info" },
              ].map(({ msg, type }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: .52 + i * 0.07 }}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 12px", borderRadius: 11,
                    background: type === "bullish" ? T.greenGlow
                      : type === "alert" ? "rgba(201,168,76,0.08)"
                      : "rgba(34,211,238,0.06)",
                    border: `1px solid ${type === "bullish" ? "rgba(16,185,129,0.2)" : type === "alert" ? T.borderGold : "rgba(34,211,238,0.2)"}`,
                  }}
                >
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                    background: type === "bullish" ? T.green : type === "alert" ? T.gold : T.cyan,
                    boxShadow: `0 0 6px ${type === "bullish" ? T.green : type === "alert" ? T.gold : T.cyan}`,
                  }} />
                  <span style={{ fontSize: 11, color: T.dimMid, lineHeight: 1.6 }}>{msg}</span>
                </motion.div>
              ))}
            </div>
          </GCard>
        </motion.div>

        {/* ── RECENT ACTIVITY FEED ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .55 }} style={{ marginBottom: 14 }}
        >
          <GCard style={{ overflow: "hidden" }}>
            <div style={{
              padding: "16px 20px 14px", borderBottom: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.fg, display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={13} color={T.gold} /> Recent Activity
              </div>
              <Link href="/wallet">
                <button style={{ fontSize: 10, color: T.gold, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                  View All <ChevronRight size={11} />
                </button>
              </Link>
            </div>
            <div style={{ padding: "0 20px" }}>
              {ACTIVITY.map(({ label, sub, amount, color, icon: Icon, date }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: .57 + i * 0.07 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 0",
                    borderBottom: i < ACTIVITY.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none",
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: `${color}18`, border: `1px solid ${color}28`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={14} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
                    <div style={{ fontSize: 9, color: T.dim }}>{sub}</div>
                    <div style={{ fontSize: 8, color: "rgba(107,117,145,0.6)", marginTop: 1 }}>{date}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color }}>{amount}</div>
                    <div style={{
                      fontSize: 8, color: T.green,
                      background: T.greenGlow, border: "1px solid rgba(16,185,129,0.2)",
                      borderRadius: 10, padding: "1px 6px", marginTop: 3, display: "inline-block",
                    }}>Confirmed</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GCard>
        </motion.div>

        {/* ── SETTINGS LIST ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: .6 }} style={{ marginBottom: 14 }}
        >
          <GCard style={{ overflow: "hidden" }}>
            {[
              { label: "Notifications",      href: "/notifications",  sub: "Manage alerts & payouts" },
              { label: "Subscription Plan",  href: "/pricing",        sub: "Manage your membership" },
              { label: "Help & Support",     href: "/",               sub: "24/7 institutional support" },
            ].map(({ label, href, sub }, i) => (
              <Link key={label} href={href}>
                <motion.div
                  whileHover={{ background: T.panelHov }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 20px",
                    borderBottom: i < 2 ? `1px solid rgba(255,255,255,0.04)` : "none",
                    cursor: "pointer", transition: "background .15s",
                  }}
                >
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

        {/* ── BECOME A DEVELOPER CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .65, type: "spring", stiffness: 260, damping: 24 }}
          style={{ marginBottom: 12 }}
        >
          <motion.button
            whileHover={{ y: -2, boxShadow: `0 16px 48px rgba(201,168,76,0.45)` }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%", padding: "20px 24px", borderRadius: 20,
              background: `linear-gradient(135deg, ${T.gold} 0%, #B8890F 50%, #8B6010 100%)`,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 14,
              boxShadow: `0 8px 32px rgba(201,168,76,0.32)`,
              position: "relative", overflow: "hidden",
            }}
          >
            {/* Shimmer */}
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: "rgba(0,0,0,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <HardHat size={22} color="#0a0800" />
            </div>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#0a0800", letterSpacing: "-0.01em", fontFamily: "'Playfair Display', serif" }}>
                Become a Developer / Builder
              </div>
              <div style={{ fontSize: 11, color: "rgba(10,8,0,0.6)", marginTop: 3 }}>
                List projects · Raise capital · Build your portfolio
              </div>
            </div>
            <ArrowRight size={18} color="rgba(10,8,0,0.5)" style={{ flexShrink: 0 }} />
          </motion.button>
        </motion.div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.12)", paddingBottom: 8 }}>
          Orakzai Properties · Private Wealth Platform · v2.0
        </p>
      </div>
    </div>
  );
}
