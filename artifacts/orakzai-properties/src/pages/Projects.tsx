import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import {
  Search, MapPin, X, Filter, Building2, HardHat, Star, Users,
  ChevronDown, SlidersHorizontal, Bookmark, BookmarkCheck,
  ShoppingCart, KeyRound, CreditCard, ChevronRight, Globe,
  TrendingUp, BadgeCheck, Home, ArrowRight, Sparkles,
  LayoutGrid, List, RefreshCw, Tag, Layers, Eye,
} from "lucide-react";

/* ── Design tokens (match Wallet & Profile) ─────────────────────────────────── */
const T = {
  bg:        "#04080F",
  panel:     "rgba(255,255,255,0.028)",
  panelHov:  "rgba(255,255,255,0.055)",
  border:    "rgba(255,255,255,0.065)",
  borderGold:"rgba(201,168,76,0.35)",
  gold:      "#C9A84C",
  goldFaint: "rgba(201,168,76,0.06)",
  goldGlow:  "rgba(201,168,76,0.18)",
  fg:        "#EEF2FF",
  dim:       "#6B7591",
  dimMid:    "#9AA2B8",
  green:     "#10B981",
  greenGlow: "rgba(16,185,129,0.18)",
  red:       "#F43F5E",
  purple:    "#8B5CF6",
  cyan:      "#22D3EE",
  card:      "rgba(12,18,32,0.7)",
};

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? "https://uvgtgeauhjbdatrmmaob.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_VuaEqan3EBtGHbpTI0KdJg_OimrHkqM"
);

/* ── Seed data ───────────────────────────────────────────────────────────────── */
const SEED_PROJECTS = [
  {
    id: 1, title: "Azan Smart City", subtitle: "Pakistan's first fully integrated smart city — CPEC corridor",
    location: "Chakri Road, Rawalpindi", city: "Rawalpindi", country: "Pakistan",
    type: "Residential", listing_type: "marketplace", transaction_type: "buy",
    min_investment: 2500000, min_label: "₨ 25L", roi: "22% p.a.", duration: "3 Years",
    status: "Phase 1", funded_percent: 68, total_value: 5000000000, investors: 342,
    featured: true, bedrooms: 3, area: 1200, installment: false, possession: "2026",
    image: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=700&q=85",
    developer: "Azan Developers", tags: ["Smart City","CPEC","Eco-Friendly"],
  },
  {
    id: 2, title: "DHA Lahore Phase 9", subtitle: "Premium residential plots in the most coveted address in Lahore",
    location: "DHA Phase 9, Lahore", city: "Lahore", country: "Pakistan",
    type: "Residential", listing_type: "marketplace", transaction_type: "buy",
    min_investment: 5000000, min_label: "₨ 50L", roi: "16% p.a.", duration: "2 Years",
    status: "Active", funded_percent: 81, total_value: 2000000000, investors: 218,
    featured: false, bedrooms: 4, area: 2200, installment: true, possession: "Ready",
    image: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=700&q=85",
    developer: "DHA Lahore", tags: ["Verified","Ready Possession","Prime Location"],
  },
  {
    id: 3, title: "Capital Smart City", subtitle: "Award-winning smart city on the CPEC corridor near Islamabad",
    location: "CPEC Route, Islamabad", city: "Islamabad", country: "Pakistan",
    type: "Mixed Use", listing_type: "marketplace", transaction_type: "installment",
    min_investment: 3500000, min_label: "₨ 35L", roi: "18% p.a.", duration: "4 Years",
    status: "Funding", funded_percent: 54, total_value: 8000000000, investors: 507,
    featured: true, bedrooms: 2, area: 900, installment: true, possession: "2027",
    image: "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=700&q=85",
    developer: "Future Development Holdings", tags: ["Smart City","Installment","Overseas Block"],
  },
  {
    id: 4, title: "Bahria Heights – Karachi", subtitle: "High-rise luxury residential & commercial in Pakistan's mega city",
    location: "Bahria Town, Karachi", city: "Karachi", country: "Pakistan",
    type: "Commercial", listing_type: "marketplace", transaction_type: "rent",
    min_investment: 1000000, min_label: "₨ 10L", roi: "20% p.a.", duration: "2 Years",
    status: "Active", funded_percent: 73, total_value: 1500000000, investors: 891,
    featured: false, bedrooms: 1, area: 650, installment: false, possession: "Ready",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=700&q=85",
    developer: "Bahria Town", tags: ["High-Rise","Commercial","Rental Income"],
  },
  {
    id: 5, title: "Gulberg Galleria Lahore", subtitle: "Prime commercial plaza in Lahore's thriving business district",
    location: "Gulberg III, Lahore", city: "Lahore", country: "Pakistan",
    type: "Commercial", listing_type: "marketplace", transaction_type: "rent",
    min_investment: 2000000, min_label: "₨ 20L", roi: "19% p.a.", duration: "3 Years",
    status: "Pre-Launch", funded_percent: 22, total_value: 900000000, investors: 97,
    featured: false, bedrooms: 0, area: 500, installment: true, possession: "2026",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=85",
    developer: "Gulberg Developers", tags: ["Commercial","Pre-Launch","Prime"],
  },
  {
    id: 6, title: "Blue World City Overseas", subtitle: "Pakistan's largest tourism-focused real estate project on CPEC",
    location: "Chakri Interchange, Islamabad", city: "Islamabad", country: "Pakistan",
    type: "Residential", listing_type: "marketplace", transaction_type: "installment",
    min_investment: 500000, min_label: "₨ 5L", roi: "14% p.a.", duration: "5 Years",
    status: "Active", funded_percent: 61, total_value: 3000000000, investors: 1240,
    featured: false, bedrooms: 2, area: 800, installment: true, possession: "2028",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=700&q=85",
    developer: "Blue Group of Companies", tags: ["Overseas Block","Tourism","Installment"],
  },
  {
    id: 7, title: "Orakzai Heights Tower", subtitle: "25-storey luxury mixed-use tower in DHA Lahore — flagship project",
    location: "DHA Phase 6, Lahore", city: "Lahore", country: "Pakistan",
    type: "Mixed Use", listing_type: "construction", transaction_type: "buy",
    min_investment: 5000000, min_label: "₨ 50L", roi: "22% p.a.", duration: "36 Months",
    status: "Phase 2", funded_percent: 55, total_value: 2500000000, investors: 189,
    featured: true, bedrooms: 3, area: 1800, installment: true, possession: "2026",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=85",
    developer: "Orakzai Properties", tags: ["Flagship","Luxury Tower","DHA"],
  },
  {
    id: 8, title: "Ring Road Corridor", subtitle: "Industrial & commercial plots along the new ring road development",
    location: "Ring Road, Rawalpindi", city: "Rawalpindi", country: "Pakistan",
    type: "Industrial", listing_type: "construction", transaction_type: "buy",
    min_investment: 1500000, min_label: "₨ 15L", roi: "21% p.a.", duration: "3 Years",
    status: "Active", funded_percent: 47, total_value: 1200000000, investors: 183,
    featured: false, bedrooms: 0, area: 4000, installment: false, possession: "2025",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=85",
    developer: "Ring Road Authority", tags: ["Industrial","Commercial","Infrastructure"],
  },
  {
    id: 9, title: "Orakzai Ocean Tower Dubai", subtitle: "Premium waterfront serviced apartments in Dubai Maritime City",
    location: "Dubai Maritime City, UAE", city: "Dubai", country: "UAE",
    type: "Residential", listing_type: "marketplace", transaction_type: "buy",
    min_investment: 15000000, min_label: "₨ 1.5Cr", roi: "9.75% p.a.", duration: "2 Years",
    status: "Active", funded_percent: 72, total_value: 12000000000, investors: 94,
    featured: true, bedrooms: 2, area: 1100, installment: false, possession: "2025",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=700&q=85",
    developer: "Orakzai Properties", tags: ["Dubai","Waterfront","International"],
  },
];

type Project = typeof SEED_PROJECTS[0];

/* ── Sub-components ──────────────────────────────────────────────────────────── */
function FundingBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? T.green : pct > 50 ? T.gold : T.cyan;
  return (
    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${color}, ${color}80)` }}
      />
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const cfg = {
    "Active":     { color: T.green,  bg: T.greenGlow },
    "Phase 1":    { color: T.gold,   bg: T.goldFaint },
    "Phase 2":    { color: T.gold,   bg: T.goldFaint },
    "Funding":    { color: T.cyan,   bg: "rgba(34,211,238,0.1)" },
    "Pre-Launch": { color: T.purple, bg: "rgba(139,92,246,0.12)" },
    "Funded":     { color: T.green,  bg: T.greenGlow },
  }[status] ?? { color: T.dimMid, bg: "rgba(255,255,255,0.06)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 9px", borderRadius: 999,
      background: cfg.bg, border: `1px solid ${cfg.color}35`,
      color: cfg.color, fontSize: 9, fontWeight: 700,
    }}>
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
        style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, display: "inline-block" }}
      />
      {status}
    </span>
  );
}

/* ── Property Card (grid view) ───────────────────────────────────────────────── */
function PropertyCard({ p, bookmarked, onBookmark }: {
  p: Project; bookmarked: boolean; onBookmark: () => void;
}) {
  const [, setLocation] = useLocation();
  const [hov, setHov]   = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => setLocation(`/invest/${p.id}`)}
      style={{
        background: T.card, backdropFilter: "blur(12px)",
        border: `1px solid ${hov ? (p.featured ? T.borderGold : "rgba(255,255,255,0.12)") : (p.featured ? "rgba(201,168,76,0.2)" : T.border)}`,
        borderRadius: 20, overflow: "hidden", cursor: "pointer",
        boxShadow: hov
          ? `0 20px 60px rgba(0,0,0,0.55), 0 0 30px ${p.featured ? T.goldGlow : "rgba(255,255,255,0.04)"}`
          : "0 4px 20px rgba(0,0,0,0.3)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "all .3s",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 190, overflow: "hidden" }}>
        <img
          src={p.image} alt={p.title}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hov ? "scale(1.06)" : "scale(1)", transition: "transform .45s",
          }}
          onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=85"; }}
        />
        {/* Cinematic overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(4,8,15,0.05) 0%, rgba(4,8,15,0.0) 40%, rgba(4,8,15,0.8) 100%)",
        }} />
        {/* Featured badge */}
        {p.featured && (
          <div style={{
            position: "absolute", top: 12, left: 12,
            display: "flex", alignItems: "center", gap: 4,
            background: `linear-gradient(135deg, ${T.gold}, #8B6010)`,
            borderRadius: 20, padding: "4px 10px",
          }}>
            <Star size={9} color="#0a0800" fill="#0a0800" />
            <span style={{ fontSize: 9, fontWeight: 900, color: "#0a0800", letterSpacing: "0.06em" }}>FEATURED</span>
          </div>
        )}
        {/* Verified badge */}
        <div style={{
          position: "absolute", top: 12, left: p.featured ? 90 : 12,
          display: "flex", alignItems: "center", gap: 3,
          background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)",
          borderRadius: 20, padding: "3px 9px", fontSize: 8, color: T.green, fontWeight: 700,
        }}>
          <BadgeCheck size={8} /> Verified
        </div>
        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={e => { e.stopPropagation(); onBookmark(); }}
          style={{
            position: "absolute", top: 10, right: 10,
            width: 34, height: 34, borderRadius: "50%",
            background: "rgba(4,8,15,0.7)", backdropFilter: "blur(8px)",
            border: `1px solid ${bookmarked ? T.borderGold : T.border}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {bookmarked
            ? <BookmarkCheck size={14} color={T.gold} />
            : <Bookmark size={14} color={T.dimMid} />}
        </motion.button>
        {/* Bottom info overlay */}
        <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
            {p.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <MapPin size={9} color={T.gold} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.75)" }}>{p.location}</span>
            {p.country === "UAE" && <span style={{ fontSize: 10 }}>🇦🇪</span>}
            {p.country === "Pakistan" && <span style={{ fontSize: 10 }}>🇵🇰</span>}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 16px" }}>
        {/* Developer + status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: T.goldFaint, border: `1px solid ${T.borderGold}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Building2 size={10} color={T.gold} />
            </div>
            <span style={{ fontSize: 10, color: T.dimMid, fontWeight: 600 }}>{p.developer}</span>
          </div>
          <StatusChip status={p.status} />
        </div>

        {/* Subtitle */}
        <p style={{ fontSize: 11, color: T.dim, margin: "0 0 12px", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
          {p.subtitle}
        </p>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 12 }}>
          {[
            { label: "Min. Price", value: p.min_label, color: T.gold },
            { label: "ROI p.a.",   value: p.roi,       color: T.green },
            { label: "Delivery",   value: p.possession, color: T.fg },
          ].map(s => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.025)",
              border: `1px solid ${T.border}`, borderRadius: 10,
              padding: "9px 7px", textAlign: "center",
            }}>
              <div style={{ fontSize: isMobile() ? 11 : 13, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 8, color: T.dim, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Funding progress */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Users size={10} color={T.dim} />
              <span style={{ fontSize: 10, color: T.dim }}>{p.investors.toLocaleString()} investors</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: T.gold }}>{p.funded_percent}% Funded</span>
          </div>
          <FundingBar pct={p.funded_percent} />
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
          {p.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 8, fontWeight: 600, color: T.dimMid,
              background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
              borderRadius: 6, padding: "2px 7px",
            }}>
              {tag}
            </span>
          ))}
          {p.installment && (
            <span style={{
              fontSize: 8, fontWeight: 700, color: T.cyan,
              background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)",
              borderRadius: 6, padding: "2px 7px", display: "flex", alignItems: "center", gap: 3,
            }}>
              <CreditCard size={7} /> Installment
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={e => { e.stopPropagation(); setLocation(`/invest/${p.id}`); }}
            style={{
              flex: 1, padding: "10px", borderRadius: 11,
              background: `linear-gradient(135deg, ${T.gold}, #8B6010)`,
              border: "none", color: "#0a0800", fontSize: 11, fontWeight: 800,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 5,
            }}
          >
            <Eye size={12} /> View Details
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={e => { e.stopPropagation(); setLocation(`/invest/${p.id}`); }}
            style={{
              padding: "10px 14px", borderRadius: 11,
              border: `1px solid ${T.borderGold}`,
              background: T.goldFaint, color: T.gold,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <TrendingUp size={12} /> Invest
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Property Row (list view) ────────────────────────────────────────────────── */
function PropertyRow({ p, bookmarked, onBookmark }: {
  p: Project; bookmarked: boolean; onBookmark: () => void;
}) {
  const [, setLocation] = useLocation();
  const [hov, setHov]   = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => setLocation(`/invest/${p.id}`)}
      style={{
        background: T.card, backdropFilter: "blur(10px)",
        border: `1px solid ${hov ? T.borderGold : T.border}`,
        borderRadius: 16, display: "flex", gap: 14, padding: 14,
        cursor: "pointer", alignItems: "center",
        boxShadow: hov ? `0 8px 28px rgba(0,0,0,0.4), 0 0 16px ${T.goldGlow}` : "none",
        transition: "all .25s",
      }}
    >
      {/* Thumbnail */}
      <div style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
        <img src={p.image} alt={p.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: hov ? "scale(1.08)" : "scale(1)", transition: "transform .35s" }}
          onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=85"; }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
          {p.featured && <Star size={10} color={T.gold} fill={T.gold} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
          <MapPin size={9} color={T.gold} />
          <span style={{ fontSize: 10, color: T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.location}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: T.gold }}>{p.min_label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.green }}>{p.roi}</span>
          <StatusChip status={p.status} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        <motion.button whileTap={{ scale: 0.85 }}
          onClick={e => { e.stopPropagation(); onBookmark(); }}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          {bookmarked ? <BookmarkCheck size={15} color={T.gold} /> : <Bookmark size={15} color={T.dim} />}
        </motion.button>
        <ChevronRight size={15} color={T.dim} />
      </div>
    </motion.div>
  );
}

/* ── Dropdown filter ─────────────────────────────────────────────────────────── */
function Dropdown({ label, value, options, onChange }: {
  label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value)?.label ?? label;
  const active  = value !== options[0].value;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: "flex", alignItems: "center", gap: 5,
        height: 36, padding: "0 13px", borderRadius: 20,
        fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer",
        background: active ? T.goldFaint : "rgba(255,255,255,0.04)",
        border: active ? `1px solid ${T.borderGold}` : `1px solid ${T.border}`,
        color: active ? T.gold : T.dimMid, whiteSpace: "nowrap",
        transition: "all .2s",
      }}>
        {current} <ChevronDown size={10} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: .97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: .97 }}
              transition={{ duration: .15 }}
              style={{
                position: "absolute", top: 42, left: 0,
                background: "rgba(10,15,28,0.98)",
                border: `1px solid ${T.borderGold}`,
                borderRadius: 14, zIndex: 100, minWidth: 170,
                boxShadow: `0 16px 48px rgba(0,0,0,0.7), 0 0 24px ${T.goldGlow}`,
                overflow: "hidden", backdropFilter: "blur(20px)",
              }}
            >
              {options.map(opt => (
                <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                  style={{
                    padding: "10px 16px", fontSize: 12, cursor: "pointer",
                    color: value === opt.value ? T.gold : T.dimMid,
                    fontWeight: value === opt.value ? 700 : 400,
                    background: value === opt.value ? T.goldFaint : "transparent",
                    transition: "background .12s",
                  }}
                  onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (value !== opt.value) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  {value === opt.value ? "✓ " : ""}{opt.label}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
function isMobile() { return window.innerWidth < 640; }

const SECTION_TABS = [
  { key: "marketplace", label: "Marketplace",  icon: ShoppingCart, color: T.gold,   activeBg: T.goldFaint },
  { key: "construction", label: "Construction", icon: HardHat,      color: T.purple, activeBg: "rgba(139,92,246,0.1)" },
];
const MARKET_TABS = [
  { key: "all",         label: "All",          icon: Building2,    color: T.gold },
  { key: "buy",         label: "Buy",          icon: ShoppingCart, color: T.green },
  { key: "rent",        label: "Rent",         icon: KeyRound,     color: T.purple },
  { key: "installment", label: "Installment",  icon: CreditCard,   color: T.cyan },
];
const CITIES    = ["All Cities","Lahore","Islamabad","Karachi","Rawalpindi","Dubai"];
const TYPES     = ["All Types","Residential","Commercial","Mixed Use","Industrial"];
const COUNTRIES = ["All Countries","Pakistan","UAE"];
const SORT_OPTS = [
  { label:"Featured First", value:"featured" },
  { label:"Highest ROI",    value:"roi" },
  { label:"Most Funded",    value:"funded" },
  { label:"Lowest Price",   value:"minInvest" },
];

/* ── Main component ──────────────────────────────────────────────────────────── */
export default function Projects() {
  const [section,    setSection]    = useState<"marketplace"|"construction">("marketplace");
  const [subCat,     setSubCat]     = useState("all");
  const [search,     setSearch]     = useState("");
  const [city,       setCity]       = useState("All Cities");
  const [type,       setType]       = useState("All Types");
  const [country,    setCountry]    = useState("All Countries");
  const [sortBy,     setSortBy]     = useState("featured");
  const [viewMode,   setViewMode]   = useState<"grid"|"list">("grid");
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [projects,   setProjects]   = useState<Project[]>(SEED_PROJECTS);
  const [loading,    setLoading]    = useState(true);
  const [mobile,     setMobile]     = useState(window.innerWidth < 640);

  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    supabase.from("investment_projects").select("*").order("featured", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data?.length) setProjects(data as Project[]);
        setLoading(false);
      });
  }, []);

  const toggleBM = (id: number) =>
    setBookmarked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = useMemo(() => {
    let list = projects.filter(p =>
      section === "construction"
        ? p.listing_type === "construction"
        : (p.listing_type === "marketplace" || !p.listing_type)
    );
    if (section === "marketplace" && subCat !== "all")
      list = list.filter(p => p.transaction_type === subCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.developer.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (city !== "All Cities") list = list.filter(p => p.city === city);
    if (type !== "All Types")  list = list.filter(p => p.type === type);
    if (country !== "All Countries") list = list.filter(p => p.country === country);
    list.sort((a, b) => {
      if (sortBy === "featured")   return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (sortBy === "roi")        return parseFloat(b.roi) - parseFloat(a.roi);
      if (sortBy === "funded")     return b.funded_percent - a.funded_percent;
      if (sortBy === "minInvest")  return a.min_investment - b.min_investment;
      return 0;
    });
    return list;
  }, [projects, section, subCat, search, city, type, country, sortBy]);

  const totalInvestors = filtered.reduce((s, p) => s + p.investors, 0);
  const avgRoi         = filtered.length
    ? (filtered.reduce((s, p) => s + parseFloat(p.roi), 0) / filtered.length).toFixed(1)
    : "0";
  const hasFilters = city !== "All Cities" || type !== "All Types" || country !== "All Countries" || search.trim() !== "";
  const clearFilters = () => { setCity("All Cities"); setType("All Types"); setCountry("All Countries"); setSearch(""); };

  return (
    <div style={{
      minHeight: "100dvh", background: T.bg,
      color: T.fg, fontFamily: "'Plus Jakarta Sans', sans-serif",
      paddingBottom: 100,
    }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "2%", left: "15%", width: 500, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${T.goldGlow} 0%, transparent 70%)`, filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", filter: "blur(100px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: `0 ${mobile ? 14 : 24}px` }}>

        {/* ── HERO HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .55 }}
          style={{ paddingTop: 52, marginBottom: 28 }}
        >
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 14px", borderRadius: 999,
            background: T.goldFaint, border: `1px solid ${T.borderGold}`,
            marginBottom: 14,
          }}>
            <Globe size={11} color={T.gold} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Global Real Estate Marketplace
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: mobile ? 26 : 34, fontWeight: 700,
            color: T.fg, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.25,
          }}>
            Discover Premium<br />
            <span style={{ color: T.gold }}>Real Estate Opportunities</span>
          </h1>
          <p style={{ fontSize: 13, color: T.dim, margin: "0 0 22px", maxWidth: 500, lineHeight: 1.7 }}>
            Institutional-grade property investments. Verified developers. Sovereign-backed projects.
            Across Pakistan, UAE, and global markets.
          </p>

          {/* Global stats */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 10,
          }}>
            {[
              { label: "Active Projects",  value: `${projects.length}`, icon: Building2,  color: T.gold },
              { label: "Total Investors",  value: `${projects.reduce((s,p)=>s+p.investors,0).toLocaleString()}+`, icon: Users, color: T.green },
              { label: "Verified",         value: `${projects.length} Projects`, icon: BadgeCheck, color: T.cyan },
              { label: "Countries",        value: "Pakistan · UAE",icon: Globe, color: T.purple },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 14px", borderRadius: 12,
                background: T.panel, border: `1px solid ${T.border}`,
              }}>
                <Icon size={12} color={color} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.fg }}>{value}</span>
                <span style={{ fontSize: 10, color: T.dim }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── SEARCH ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .15 }} style={{ marginBottom: 14 }}
        >
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
            borderRadius: 16, padding: "0 16px", height: 52,
            boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
            transition: "border-color .2s",
          }}
          onFocus={() => {}}
          >
            <Search size={16} color={T.gold} style={{ flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search properties, cities, developers, areas…"
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                fontSize: 14, color: T.fg, fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            />
            {search && (
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: T.dim }}
              >
                <X size={14} />
              </motion.button>
            )}
          </div>

          {/* AI suggestions */}
          {!search && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, color: T.dim, alignSelf: "center", flexShrink: 0 }}>
                <Sparkles size={9} color={T.gold} style={{ display: "inline", marginRight: 3 }} />
                Trending:
              </span>
              {["DHA Lahore", "Dubai Marina", "Capital Smart City", "Bahria Town", "Overseas Plots"].map(s => (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSearch(s)}
                  style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                    background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
                    color: T.dimMid, cursor: "pointer", transition: "all .2s",
                  }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── SECTION TABS ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .2 }}
          style={{ display: "flex", gap: 10, marginBottom: 14 }}
        >
          {SECTION_TABS.map(tab => {
            const active = section === tab.key;
            const Icon   = tab.icon;
            return (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSection(tab.key as any); setSubCat("all"); }}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 8, padding: "14px 10px", borderRadius: 16, cursor: "pointer",
                  background: active ? tab.activeBg : "rgba(255,255,255,0.03)",
                  border: `1.5px solid ${active ? tab.color : T.border}`,
                  boxShadow: active ? `0 0 24px ${tab.color}25` : "none",
                  transition: "all .2s",
                }}
              >
                <Icon size={16} color={active ? tab.color : T.dim} />
                <span style={{ fontWeight: 800, fontSize: 13, color: active ? tab.color : T.dim }}>
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── MARKETPLACE SUB-TABS ── */}
        <AnimatePresence>
          {section === "marketplace" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden", marginBottom: 14 }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                {MARKET_TABS.map(tab => {
                  const active = subCat === tab.key;
                  const Icon   = tab.icon;
                  return (
                    <motion.button
                      key={tab.key}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setSubCat(tab.key)}
                      style={{
                        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 5, padding: "10px 6px", borderRadius: 14, cursor: "pointer",
                        background: active ? `${tab.color}12` : "rgba(255,255,255,0.03)",
                        border: `1.5px solid ${active ? tab.color : T.border}`,
                        transition: "all .2s",
                      }}
                    >
                      <Icon size={14} color={active ? tab.color : T.dim} />
                      <span style={{ fontSize: 10, fontWeight: active ? 800 : 500, color: active ? tab.color : T.dim }}>
                        {tab.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Construction banner */}
        <AnimatePresence>
          {section === "construction" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                marginBottom: 14, padding: "14px 18px",
                background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: 14, display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <HardHat size={18} color={T.purple} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>Active Construction Projects</div>
                <div style={{ fontSize: 10, color: T.dim }}>Track real-time construction progress · Invest in active developments</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FILTER ROW ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .25 }}
          style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14, scrollbarWidth: "none" }}
        >
          <Dropdown label="Country" value={country}  onChange={setCountry}  options={COUNTRIES.map(c => ({ label: c, value: c }))} />
          <Dropdown label="City"    value={city}     onChange={setCity}     options={CITIES.map(c => ({ label: c, value: c }))} />
          <Dropdown label="Type"    value={type}     onChange={setType}     options={TYPES.map(t => ({ label: t, value: t }))} />
          <Dropdown label="Sort"    value={sortBy}   onChange={setSortBy}   options={SORT_OPTS} />
          {hasFilters && (
            <motion.button whileTap={{ scale: 0.94 }} onClick={clearFilters}
              style={{
                flexShrink: 0, height: 36, padding: "0 12px", borderRadius: 20,
                fontSize: 11, cursor: "pointer",
                background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)",
                color: T.red, display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <X size={10} /> Clear
            </motion.button>
          )}
        </motion.div>

        {/* ── RESULTS HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 3 }}>
              {section === "construction" ? "Construction Projects" : "Property Listings"}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.fg }}>
              {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "result" : "results"}`}
              <span style={{ fontSize: 11, fontWeight: 500, color: T.dim, marginLeft: 8 }}>
                · {totalInvestors.toLocaleString()} investors · Avg {avgRoi}% ROI
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["grid","list"] as const).map(m => (
              <motion.button key={m} whileTap={{ scale: 0.9 }} onClick={() => setViewMode(m)}
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: viewMode === m ? T.goldFaint : "rgba(255,255,255,0.04)",
                  border: viewMode === m ? `1px solid ${T.borderGold}` : `1px solid ${T.border}`,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {m === "grid"
                  ? <LayoutGrid size={14} color={viewMode === m ? T.gold : T.dim} />
                  : <List size={14} color={viewMode === m ? T.gold : T.dim} />}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── AI INSIGHT BANNER ── */}
        {!loading && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .3 }}
            style={{
              marginBottom: 16, padding: "12px 16px",
              background: T.goldFaint, border: `1px solid ${T.borderGold}`,
              borderRadius: 14, display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Sparkles size={14} color={T.gold} />
            </motion.div>
            <span style={{ fontSize: 11, color: T.dimMid, flex: 1 }}>
              <strong style={{ color: T.gold }}>AI Signal:</strong> High rental demand in DHA Lahore · Dubai Marina luxury inventory low · OKBOND yield at 8.8% APY this quarter
            </span>
          </motion.div>
        )}

        {/* ── PROJECT GRID / LIST ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 16px" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              style={{
                width: 48, height: 48, borderRadius: "50%",
                border: `2px solid ${T.border}`, borderTop: `2px solid ${T.gold}`,
                margin: "0 auto 18px",
              }}
            />
            <div style={{ fontSize: 12, color: T.dim }}>Loading global properties…</div>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              textAlign: "center", padding: "60px 20px",
              background: T.panel, borderRadius: 20, border: `1px solid ${T.border}`,
            }}
          >
            <Building2 size={36} color={T.dim} style={{ opacity: .3, marginBottom: 14 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: T.fg, marginBottom: 6 }}>No properties found</div>
            <div style={{ fontSize: 12, color: T.dim, marginBottom: 20 }}>Try adjusting your filters or search terms</div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={clearFilters}
              style={{
                padding: "10px 24px", borderRadius: 12,
                background: `linear-gradient(135deg, ${T.gold}, #8B6010)`,
                color: "#0a0800", fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer",
              }}
            >
              Clear All Filters
            </motion.button>
          </motion.div>
        ) : viewMode === "grid" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "repeat(2, 1fr)",
            gap: 16,
          }}>
            {filtered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <PropertyCard p={p} bookmarked={bookmarked.has(p.id)} onBookmark={() => toggleBM(p.id)} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <PropertyRow p={p} bookmarked={bookmarked.has(p.id)} onBookmark={() => toggleBM(p.id)} />
              </motion.div>
            ))}
          </div>
        )}

        {/* ── BOTTOM CTA ── */}
        {!loading && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .6 }}
            style={{ marginTop: 28 }}
          >
            <div style={{
              padding: "24px 24px", borderRadius: 22,
              background: `linear-gradient(135deg, ${T.goldFaint}, rgba(139,92,246,0.06))`,
              border: `1px solid ${T.borderGold}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: T.fg, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
                  Can't find your ideal property?
                </div>
                <div style={{ fontSize: 12, color: T.dim }}>
                  Our AI advisor matches you with the best opportunities based on your profile.
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: "12px 22px", borderRadius: 14,
                  background: `linear-gradient(135deg, ${T.gold}, #8B6010)`,
                  border: "none", color: "#0a0800",
                  fontSize: 12, fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 7,
                }}
              >
                <Sparkles size={14} /> Get AI Recommendations
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
