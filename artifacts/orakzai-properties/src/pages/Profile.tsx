import { Link } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { useProfilePhoto, setStoredProfilePhoto } from "@/hooks/useProfilePhoto";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Shield, Home, BarChart2, Lock, ChevronRight, ChevronDown, ChevronUp,
  Camera, RefreshCw, BadgeCheck, ShieldCheck, X, Send,
  Bell, Globe, CreditCard, Headphones, Crown, Building2, Wrench,
  Coins, UserCheck, Users, HardHat, Key, User2,
  Hammer, PenSquare, Package, Droplets, Zap, Wind, Paintbrush, Scissors,
} from "lucide-react";
import { useUser, Show } from "@/contexts/AuthContext";
import { useKYCStatus } from "@/lib/useKYCStatus";

/* ── Design tokens ─────────────────────────────────────────────────── */
const T = {
  bg:         "#04080F",
  panel:      "rgba(255,255,255,0.028)",
  panelHov:   "rgba(255,255,255,0.055)",
  border:     "rgba(255,255,255,0.065)",
  borderGold: "rgba(201,168,76,0.35)",
  gold:       "#C9A84C",
  goldGlow:   "rgba(201,168,76,0.18)",
  goldFaint:  "rgba(201,168,76,0.06)",
  fg:         "#EEF2FF",
  dim:        "#6B7591",
  dimMid:     "#9AA2B8",
  green:      "#10B981",
  greenGlow:  "rgba(16,185,129,0.18)",
  red:        "#F43F5E",
  purple:     "#8B5CF6",
  cyan:       "#22D3EE",
};

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME    ?? "dvsjiufdv";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "ml_default";

/* ── Onboarding category data ──────────────────────────────────────── */
interface OnboardRole {
  emoji: string;
  label: string;
  sub: string;
  fields: { name: string; placeholder: string; type?: string }[];
  highlight?: boolean;
}

const ONBOARD_CATEGORIES: { title: string; color: string; icon: React.ElementType; roles: OnboardRole[] }[] = [
  {
    title: "Real Estate & Property Portals",
    color: T.gold,
    icon: Building2,
    roles: [
      {
        emoji: "🪙", label: "Tokenize Your Asset (RWA)", sub: "Submit real-world assets for blockchain tokenization & exchange listing",
        highlight: true,
        fields: [
          { name: "assetType",    placeholder: "Asset type (Plot / Building / Project)" },
          { name: "location",     placeholder: "Property location & area" },
          { name: "marketValue",  placeholder: "Estimated market value (PKR / USD)" },
          { name: "ownership",    placeholder: "Ownership document / title deed no." },
          { name: "contact",      placeholder: "Contact phone / WhatsApp" },
        ],
      },
      {
        emoji: "👔", label: "Agent / Broker", sub: "Onboarding for individual real estate agents",
        fields: [
          { name: "fullName",     placeholder: "Full name" },
          { name: "licenseNo",    placeholder: "RERA / license number (if any)" },
          { name: "city",         placeholder: "Operating city / area" },
          { name: "experience",   placeholder: "Years of experience" },
          { name: "contact",      placeholder: "Phone / email" },
        ],
      },
      {
        emoji: "🏢", label: "Agency / Company", sub: "Corporate registration for real estate agencies",
        fields: [
          { name: "companyName",  placeholder: "Company / agency name" },
          { name: "regNo",        placeholder: "Registration / NTN number" },
          { name: "offices",      placeholder: "Number of offices / branches" },
          { name: "website",      placeholder: "Website URL (optional)" },
          { name: "contact",      placeholder: "Primary contact & email" },
        ],
      },
      {
        emoji: "🏗️", label: "Builder & Developer", sub: "List large-scale projects and seek funding / tokenization",
        fields: [
          { name: "companyName",  placeholder: "Development company name" },
          { name: "projectName",  placeholder: "Current / upcoming project name" },
          { name: "scale",        placeholder: "Project scale (units / sq ft)" },
          { name: "funding",      placeholder: "Funding required (optional)" },
          { name: "contact",      placeholder: "Director / CEO contact" },
        ],
      },
      {
        emoji: "🔑", label: "Private Owner / Seller", sub: "Quick listing & selling application",
        fields: [
          { name: "ownerName",    placeholder: "Your full name" },
          { name: "propertyType", placeholder: "Property type (Plot / House / Flat / Shop)" },
          { name: "location",     placeholder: "Full address / location" },
          { name: "askingPrice",  placeholder: "Asking price (PKR)" },
          { name: "contact",      placeholder: "WhatsApp / phone number" },
        ],
      },
      {
        emoji: "🏠", label: "Buyer / Tenant", sub: "Custom preference & requirement registration",
        fields: [
          { name: "buyerName",    placeholder: "Your name" },
          { name: "intent",       placeholder: "Buy or Rent?" },
          { name: "budget",       placeholder: "Budget range (PKR)" },
          { name: "preferences",  placeholder: "Preferred city / area / type" },
          { name: "contact",      placeholder: "Phone / email" },
        ],
      },
    ],
  },
  {
    title: "Construction & Professional Services",
    color: T.cyan,
    icon: HardHat,
    roles: [
      {
        emoji: "🛠️", label: "Construction Company / Contractor", sub: "Registration for general contractors & construction firms",
        fields: [
          { name: "companyName",  placeholder: "Company / firm name" },
          { name: "regNo",        placeholder: "PEC registration number" },
          { name: "speciality",   placeholder: "Main speciality (civil / structural / fit-out)" },
          { name: "capacity",     placeholder: "Typical project size (PKR)" },
          { name: "contact",      placeholder: "Contact person & number" },
        ],
      },
      {
        emoji: "📐", label: "Architect / Interior Designer", sub: "Professional onboarding for design & architectural experts",
        fields: [
          { name: "fullName",     placeholder: "Full name / firm name" },
          { name: "qualification",placeholder: "Qualification & PCP reg. no." },
          { name: "portfolio",    placeholder: "Portfolio / Behance / website link" },
          { name: "speciality",   placeholder: "Speciality (residential / commercial / interior)" },
          { name: "contact",      placeholder: "Phone / email" },
        ],
      },
      {
        emoji: "📦", label: "Material Supplier", sub: "Vendor application for raw materials & building supplies",
        fields: [
          { name: "businessName", placeholder: "Business / brand name" },
          { name: "materials",    placeholder: "Materials supplied (tiles / cement / steel / etc.)" },
          { name: "coverage",     placeholder: "Delivery coverage areas" },
          { name: "minOrder",     placeholder: "Minimum order value (PKR)" },
          { name: "contact",      placeholder: "Sales contact & WhatsApp" },
        ],
      },
    ],
  },
  {
    title: "Skilled Trades & Maintenance",
    color: T.purple,
    icon: Wrench,
    roles: [
      {
        emoji: "🚰", label: "Plumber", sub: "Sanitary fittings, drainage & water supply",
        fields: [
          { name: "fullName",     placeholder: "Full name" },
          { name: "experience",   placeholder: "Years of experience" },
          { name: "serviceArea",  placeholder: "Service area / city" },
          { name: "contact",      placeholder: "Phone / WhatsApp" },
        ],
      },
      {
        emoji: "⚡", label: "Electrician", sub: "Wiring, power systems & electrical appliances",
        fields: [
          { name: "fullName",     placeholder: "Full name" },
          { name: "license",      placeholder: "WAPDA / AEDB license no. (if any)" },
          { name: "serviceArea",  placeholder: "Service area / city" },
          { name: "contact",      placeholder: "Phone / WhatsApp" },
        ],
      },
      {
        emoji: "❄️", label: "HVAC / AC Technician", sub: "Heating, ventilation & cooling systems",
        fields: [
          { name: "fullName",     placeholder: "Full name / company" },
          { name: "brands",       placeholder: "AC brands serviced" },
          { name: "serviceArea",  placeholder: "Service area / city" },
          { name: "contact",      placeholder: "Phone / WhatsApp" },
        ],
      },
      {
        emoji: "🎨", label: "Painter & Polisher", sub: "Interior / exterior painting & surface finishing",
        fields: [
          { name: "fullName",     placeholder: "Full name / team name" },
          { name: "experience",   placeholder: "Years of experience" },
          { name: "serviceArea",  placeholder: "Service area / city" },
          { name: "contact",      placeholder: "Phone / WhatsApp" },
        ],
      },
      {
        emoji: "🪵", label: "Carpenter", sub: "Woodwork, doors, custom kitchens & fixtures",
        fields: [
          { name: "fullName",     placeholder: "Full name / workshop name" },
          { name: "speciality",   placeholder: "Speciality (furniture / doors / kitchen cabinets)" },
          { name: "serviceArea",  placeholder: "Service area / city" },
          { name: "contact",      placeholder: "Phone / WhatsApp" },
        ],
      },
    ],
  },
];

/* ── Inline application form modal ─────────────────────────────────── */
function AppFormModal({ role, onClose }: { role: OnboardRole; onClose: () => void }) {
  const [vals, setVals]       = useState<Record<string, string>>({});
  const [submitted, setSubmit] = useState(false);

  const set = (k: string, v: string) => setVals(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmit(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(4,8,15,0.85)", backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 env(safe-area-inset-bottom,0px)",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        style={{
          width: "100%", maxWidth: 560,
          background: "#07101e",
          border: `1px solid ${T.borderGold}`,
          borderRadius: "22px 22px 0 0",
          maxHeight: "88dvh", overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 18px 14px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontSize: 26 }}>{role.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.fg }}>{role.label}</div>
            <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>{role.sub}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 8px" }}>
          {submitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ textAlign: "center", padding: "40px 20px" }}
            >
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.fg, marginBottom: 8 }}>Application Submitted!</div>
              <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.7, marginBottom: 24 }}>
                Our team will review your application and contact you within 24–48 hours.
              </div>
              <button
                onClick={onClose}
                style={{ padding: "10px 32px", borderRadius: 12, background: `linear-gradient(135deg, ${T.gold}, #A07030)`, border: "none", color: "#0a0800", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
              >
                Done
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 20 }}>
                {role.fields.map(f => (
                  <div key={f.name}>
                    <input
                      type={f.type ?? "text"}
                      placeholder={f.placeholder}
                      value={vals[f.name] ?? ""}
                      onChange={e => set(f.name, e.target.value)}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${T.border}`,
                        borderRadius: 11, padding: "12px 14px",
                        color: T.fg, fontSize: 13,
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.borderGold; }}
                      onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = T.border; }}
                    />
                  </div>
                ))}
                <textarea
                  placeholder="Any additional notes or details..."
                  rows={3}
                  style={{
                    width: "100%", boxSizing: "border-box", resize: "vertical",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${T.border}`,
                    borderRadius: 11, padding: "12px 14px",
                    color: T.fg, fontSize: 13,
                    outline: "none", fontFamily: "inherit",
                  }}
                  onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = T.borderGold; }}
                  onBlur={e  => { (e.target as HTMLTextAreaElement).style.borderColor = T.border; }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                type="submit"
                style={{
                  width: "100%", padding: "14px", borderRadius: 14,
                  background: `linear-gradient(135deg, ${T.gold}, #A07030)`,
                  border: "none", color: "#0a0800",
                  fontSize: 14, fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginBottom: 20,
                }}
              >
                <Send size={15} /> Submit Application
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Onboarding category accordion ─────────────────────────────────── */
function OnboardCategory({ cat, delay }: { cat: typeof ONBOARD_CATEGORIES[0]; delay: number }) {
  const [open, setOpen]         = useState(false);
  const [activeRole, setRole]   = useState<OnboardRole | null>(null);
  const Icon = cat.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        style={{ marginBottom: 8 }}
      >
        {/* Category header */}
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", background: "rgba(255,255,255,0.03)",
            border: `1px solid ${open ? cat.color + "40" : T.border}`,
            borderRadius: open ? "14px 14px 0 0" : 14,
            cursor: "pointer", transition: "all .2s",
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${cat.color}15`, border: `1px solid ${cat.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={16} color={cat.color} />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.fg }}>{cat.title}</div>
            <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>{cat.roles.length} service categories</div>
          </div>
          {open
            ? <ChevronUp size={15} color={T.dim} />
            : <ChevronDown size={15} color={T.dim} />}
        </button>

        {/* Role cards */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                overflow: "hidden",
                border: `1px solid ${cat.color}30`,
                borderTop: "none",
                borderRadius: "0 0 14px 14px",
                background: "rgba(255,255,255,0.018)",
              }}
            >
              <div style={{ padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
                {cat.roles.map((role, i) => (
                  <motion.button
                    key={role.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.045 }}
                    onClick={() => setRole(role)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 13px", borderRadius: 12, cursor: "pointer",
                      background: role.highlight
                        ? `linear-gradient(135deg, ${T.goldFaint}, rgba(201,168,76,0.04))`
                        : "rgba(255,255,255,0.025)",
                      border: `1px solid ${role.highlight ? T.borderGold : T.border}`,
                      transition: "all .18s", textAlign: "left",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = cat.color + "55";
                      (e.currentTarget as HTMLElement).style.background = `${cat.color}0a`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = role.highlight ? T.borderGold : T.border;
                      (e.currentTarget as HTMLElement).style.background = role.highlight
                        ? `linear-gradient(135deg, ${T.goldFaint}, rgba(201,168,76,0.04))`
                        : "rgba(255,255,255,0.025)";
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{role.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: role.highlight ? T.gold : T.fg }}>
                        {role.label}
                        {role.highlight && (
                          <span style={{ marginLeft: 6, fontSize: 9, color: T.gold, background: T.goldFaint, border: `1px solid ${T.borderGold}`, borderRadius: 20, padding: "1px 6px" }}>
                            HIGH PRIORITY
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                        {role.sub}
                      </div>
                    </div>
                    <ChevronRight size={13} color={T.dim} style={{ flexShrink: 0 }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {activeRole && (
          <AppFormModal role={activeRole} onClose={() => setRole(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function Profile() {
  const { user }                     = useUser();
  const { kycStatus }                = useKYCStatus();
  const photoUrl                     = useProfilePhoto();
  const [uploading, setUploading]    = useState(false);
  const [uploadErr, setUploadErr]    = useState("");
  const [mobile, setMobile]          = useState(window.innerWidth < 640);

  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const uploadPhoto = useCallback(async (file: File) => {
    if (!file) return;
    setUploading(true); setUploadErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!data.secure_url) throw new Error(data.error?.message ?? "Upload failed");
      const url: string = data.secure_url;
      if (user?._raw) {
        await updateProfile(user._raw, { photoURL: url });
        await auth.currentUser?.reload();
      }
      setStoredProfilePhoto(url);  // persist to localStorage + notify all hook subscribers
    } catch (e: any) { setUploadErr(e.message ?? "Upload failed"); }
    finally { setUploading(false); }
  }, [user]);

  const displayName = user?.fullName ?? user?.firstName ?? "Faisal Orakzai";
  const email       = user?.primaryEmailAddress?.emailAddress ?? "faisal@orakzaiproperties.com";
  const initials    = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const kycColor = kycStatus === "approved"       ? T.green
    : kycStatus === "pending_review" ? "#F59E0B"
    : kycStatus === "rejected"       ? T.red : T.dim;
  const kycLabel = kycStatus === "approved"       ? "KYC Verified"
    : kycStatus === "pending_review" ? "KYC Pending"
    : kycStatus === "rejected"       ? "KYC Rejected" : "KYC Required";

  /* 2x2 quick action grid */
  const QUICK_ACTIONS = [
    { icon: Shield,   label: "KYC & Identity",          sub: "Verify your documents",        href: "/kyc",         color: T.green  },
    { icon: Home,     label: "My Holdings & Portfolio",  sub: "Owned assets & real estate",   href: "/my-properties", color: T.gold   },
    { icon: BarChart2,label: "Trade & Order History",    sub: "All orders & transactions",    href: "/wallet",      color: T.cyan   },
    { icon: Lock,     label: "Security & 2FA Center",    sub: "Sessions, devices & 2FA",      href: "/",            color: T.purple },
  ];

  /* Account settings list */
  const SETTINGS = [
    { emoji: "🔔", label: "Notification Preferences",         sub: "Alerts, payouts & market signals",         href: "/" },
    { emoji: "🌐", label: "Currency & Region",                 sub: "USD / PKR / AED · Language & timezone",    href: "/" },
    { emoji: "💳", label: "Payment Methods & Linked Wallets",  sub: "Bank accounts, cards & crypto wallets",    href: "/" },
    { emoji: "💬", label: "Help & VIP Support",               sub: "24/7 institutional support channel",       href: "/" },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, color: T.fg, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: mobile ? 100 : 60 }}>

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "30%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${T.goldGlow} 0%, transparent 70%)`, filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto", padding: `0 ${mobile ? 14 : 24}px` }}>

        {/* ═══════════════ EXECUTIVE HEADER ═══════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .5 }}
          style={{ paddingTop: 52, paddingBottom: 24, textAlign: "center" }}
        >
          {/* Avatar */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
            <motion.div
              animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 148, height: 148, borderRadius: "50%", background: `radial-gradient(circle, ${T.gold}30 0%, transparent 70%)`, pointerEvents: "none" }}
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 126, height: 126, borderRadius: "50%", border: `1.5px dashed rgba(201,168,76,0.22)`, pointerEvents: "none" }}
            />
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
                <div
                  style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.52)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", opacity: uploading ? 1 : 0, transition: "opacity .2s" }}
                  onMouseEnter={e => !uploading && ((e.currentTarget as HTMLDivElement).style.opacity = "1")}
                  onMouseLeave={e => !uploading && ((e.currentTarget as HTMLDivElement).style.opacity = "0")}
                >
                  {uploading
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw size={22} color={T.gold} /></motion.div>
                    : <Camera size={24} color={T.gold} />}
                </div>
              </motion.div>
            </label>
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 32, height: 32, borderRadius: "50%", background: kycStatus === "approved" ? `linear-gradient(135deg, ${T.green}, #059669)` : `${kycColor}cc`, border: `2px solid ${T.bg}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 14px ${kycColor}60` }}>
              <ShieldCheck size={15} color="#fff" />
            </div>
          </div>

          <input id="avatar-upload" type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }} />
          {uploading && <p style={{ fontSize: 11, color: T.gold, marginBottom: 6 }}>Uploading photo…</p>}
          {uploadErr && <p style={{ fontSize: 11, color: T.red, marginBottom: 6 }}>{uploadErr}</p>}
          <label htmlFor="avatar-upload" style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer", marginBottom: 14, padding: "4px 12px", borderRadius: 999, border: `1px solid ${T.borderGold}`, background: T.goldFaint }}>
            <Camera size={11} color={T.gold} />
            <span style={{ fontSize: 10, color: T.gold, fontWeight: 700 }}>{uploading ? "Uploading…" : "Change Photo"}</span>
          </label>

          <motion.h1
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}
            style={{ fontFamily: "'Playfair Display', serif", fontSize: mobile ? 22 : 26, fontWeight: 700, color: T.fg, margin: "0 0 4px", letterSpacing: "-0.02em" }}
          >
            <Show when="signed-in">{displayName}</Show>
            <Show when="signed-out">Faisal Orakzai</Show>
          </motion.h1>
          <p style={{ fontSize: 13, color: T.dim, margin: "0 0 16px" }}>
            <Show when="signed-in">{email}</Show>
            <Show when="signed-out">faisal@orakzaiproperties.com</Show>
          </p>

          {/* VIP status badges — single horizontal row */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}
            style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}
          >
            {[
              { label: "👑 Platinum Investor",  color: T.gold   },
              { label: "🛡️ Sovereign Holder",   color: T.green  },
              { label: `🟢 ${kycLabel}`,         color: kycColor },
            ].map(({ label, color }) => (
              <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 13px", borderRadius: 999, background: `${color}12`, border: `1px solid ${color}35`, color, fontSize: 11, fontWeight: 700, letterSpacing: "0.03em" }}>
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ═══════════════ 2x2 QUICK ACCOUNT ACTIONS ═══════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .25 }}
          style={{ marginBottom: 20 }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Quick Account Actions
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {QUICK_ACTIONS.map(({ icon: Icon, label, sub, href, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .27 + i * .055 }}
              >
                <Link href={href}>
                  <motion.div
                    whileHover={{ y: -2, borderColor: color + "50", background: `${color}08` }}
                    style={{
                      background: T.panel, border: `1px solid ${T.border}`,
                      borderRadius: 18, padding: "17px 15px",
                      cursor: "pointer", display: "flex", flexDirection: "column",
                      gap: 10, position: "relative", transition: "all .2s",
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={17} color={color} />
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
          </div>
        </motion.div>

        {/* ═══════════════ ONBOARDING HUB ═══════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .35 }}
          style={{ marginBottom: 20 }}
        >
          {/* Section header */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              Institutional & Partner Onboarding
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 16px",
              background: `linear-gradient(135deg, ${T.goldFaint}, rgba(201,168,76,0.03))`,
              border: `1px solid ${T.borderGold}`,
              borderRadius: 16, marginBottom: 10,
            }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>🏛️</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>Business & Service Onboarding Hub</div>
                <div style={{ fontSize: 10, color: T.dim, marginTop: 2, lineHeight: 1.5 }}>
                  Register as an institutional partner, service provider, or asset holder. Select your category below.
                </div>
              </div>
            </div>
          </div>

          {/* Accordion categories */}
          {ONBOARD_CATEGORIES.map((cat, i) => (
            <OnboardCategory key={cat.title} cat={cat} delay={.38 + i * .06} />
          ))}
        </motion.div>

        {/* ═══════════════ PREFERENCES & SETTINGS ═══════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .55 }}
          style={{ marginBottom: 14 }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Account Settings
          </div>
          <div style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden" }}>
            {SETTINGS.map(({ emoji, label, sub, href }, i) => (
              <Link key={label} href={href}>
                <motion.div
                  whileHover={{ background: T.panelHov }}
                  style={{
                    display: "flex", alignItems: "center", gap: 13,
                    padding: "14px 18px",
                    borderBottom: i < SETTINGS.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none",
                    cursor: "pointer", transition: "background .15s",
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.fg }}>{label}</div>
                    <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{sub}</div>
                  </div>
                  <ChevronRight size={14} color={T.dim} style={{ flexShrink: 0 }} />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.1)", paddingBottom: 8, marginTop: 8 }}>
          Orakzai Properties · Private Wealth Platform
        </p>
      </div>
    </div>
  );
}
