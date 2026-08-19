import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft, Share2, Heart, Phone, MessageCircle, ShieldCheck,
  ChevronLeft, ChevronRight, Expand, X, Star, Bed, Bath,
  Maximize2, Home, Building2, Layers, MapPin, Calendar,
  Tag, CheckCircle2, Sofa, Users, Clock, BanIcon,
  Wifi, Car, Shield, Zap, Wind, Droplets, TreePine, Dumbbell,
  Grid3X3, Image, Navigation, CalendarDays, ShoppingCart, Coins, Gavel, ExternalLink, Send,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/components/PropertyCard";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/* The Buy Properties portal includes curated marketplace inventory so the
   experience remains fully navigable even before those records are seeded in
   the properties table. These records intentionally use the same shape as
   the Supabase mapping below. */
const MARKETPLACE_FALLBACKS: Record<number, Record<string, any>> = {
  101: { id: 101, category: "buy", type: "house", title: "5 Marla Modern Luxury Villa", city: "Lahore", location: "DHA Phase 6, Lahore", price: 28500000, price_label: "PKR 2.85 Cr", images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=88"], beds: 4, baths: 5, area_sqft: 2250, description: "A newly finished modern villa in DHA Phase 6 with premium materials, refined interiors, and secure family-focused planning.", owner_name: "Sovereign Estates", owner_phone: "", is_verified: true, is_available: true, tag: "New" },
  102: { id: 102, category: "buy", type: "house", title: "1 Kanal Executive Residence", city: "Lahore", location: "Bahria Town, Lahore", price: 67500000, price_label: "PKR 6.75 Cr", images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=88"], beds: 5, baths: 6, area_sqft: 4500, description: "An executive residence with generous living areas, private circulation, and a premium Bahria Town address.", owner_name: "Orakzai Properties", owner_phone: "", is_verified: true, is_available: true, tag: "Sovereign Verified" },
  103: { id: 103, category: "buy", type: "house", title: "Sea View Luxury Villa", city: "Karachi", location: "DHA Phase 8, Karachi", price: 220000000, price_label: "PKR 22 Cr", images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=88"], beds: 7, baths: 8, area_sqft: 12000, description: "A landmark coastal villa designed for high-end family living, entertaining, and long-term value.", owner_name: "Emaar Pakistan", owner_phone: "", is_verified: true, is_available: true, tag: "Luxury" },
  104: { id: 104, category: "buy", type: "commercial", title: "Corner Commercial Plaza", city: "Islamabad", location: "Blue Area, Islamabad", price: 115000000, price_label: "PKR 11.5 Cr", images: ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=88"], beds: 0, baths: 4, area_sqft: 5800, description: "A high-visibility corner commercial asset in Islamabad's central business district, suited to retail, office, or mixed use.", owner_name: "Capital Realty Group", owner_phone: "", is_verified: true, is_available: true, tag: "Income Asset" },
  105: { id: 105, category: "buy", type: "house", title: "Marina Heights Residence", city: "Dubai", location: "Dubai Marina, Dubai", price: 2800000, price_label: "AED 2.8M", images: ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=88"], beds: 3, baths: 3, area_sqft: 2200, description: "A refined Dubai Marina residence with sea views, resort-grade amenities, and strong international rental demand.", owner_name: "Emaar Properties", owner_phone: "", is_verified: true, is_available: true, tag: "12.4% ROI" },
  106: { id: 106, category: "buy", type: "plot", title: "DHA Phase 9 Commercial Plot", city: "Lahore", location: "DHA Phase 9, Lahore", price: 42000000, price_label: "PKR 4.2 Cr", images: ["https://images.unsplash.com/photo-1448630360428-65456885c650?w=1600&q=88"], beds: 0, baths: 0, area_sqft: 1800, description: "A limited commercial plot positioned for long-term frontage, development flexibility, and strategic DHA Phase 9 exposure.", owner_name: "DHA Authorized Dealer", owner_phone: "", is_verified: true, is_available: true, tag: "Limited Inventory" },
};

const GALLERY_FILLERS = [
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&q=88",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&q=88",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=88",
];

function safeDate(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    : "Recently listed";
}

function safeArea(source: Record<string, any>) {
  if (source.area) return String(source.area);
  const location = String(source.location ?? "");
  const fromLocation = location.split(",")[0]?.trim();
  return fromLocation || "Prime location";
}

const CAT_STYLE: Record<string, { pill: string; glow: string; name: string; accent: string }> = {
  buy:  { pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35", glow: "shadow-emerald-500/20", name: "LISTING",   accent: "#22c55e" },
  sell: { pill: "bg-blue-500/15 text-blue-300 border-blue-500/35",         glow: "shadow-blue-500/20",   name: "SELLING",    accent: "#3b82f6" },
  rent: { pill: "bg-violet-500/15 text-violet-300 border-violet-500/35",   glow: "shadow-violet-500/20", name: "RENTAL",   accent: "#8b5cf6" },
};

const TYPE_ICON: Record<string, typeof Home> = {
  house: Home, commercial: Building2, plot: Layers,
};

/* ─── Luxury amenity suggestions for visual richness ─── */
const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi, parking: Car, security: Shield, electricity: Zap,
  ac: Wind, water: Droplets, garden: TreePine, gym: Dumbbell,
};

/* ─── Image Gallery ─── */
function Gallery({ images, title }: { images: string[]; title: string }) {
  const [cur, setCur] = useState(0);
  const [light, setLight] = useState(false);
  const [gridView, setGridView] = useState(false);
  const has = images?.length > 0 && images[0];

  const prev = () => setCur(c => (c - 1 + images.length) % images.length);
  const next = () => setCur(c => (c + 1) % images.length);

  useEffect(() => {
    if (!light) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     setLight(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [light, images.length]);

  if (!has) {
    return (
      <div className="relative w-full h-[360px] md:h-[580px] bg-gradient-to-br from-[#0d1e35] via-[#0f2040] to-[#0a1525] flex items-center justify-center">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(201,168,76,1) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="text-center z-10">
          <div className="h-24 w-24 rounded-3xl bg-[#C9A84C]/8 border border-[#C9A84C]/20 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-[#C9A84C]/10">
            <Home className="h-12 w-12 text-[#C9A84C]/25" />
          </div>
          <p className="text-[#2a3a50] text-sm font-medium">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Main viewer ── */}
      <div className="relative w-full h-[360px] md:h-[600px] overflow-hidden bg-[#040b14] group">
        <AnimatePresence mode="wait">
          <motion.img
            key={cur}
            src={images[cur]}
            alt={`${title} – ${cur + 1}`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* cinematic vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040b14]/95 via-[#040b14]/15 to-[#040b14]/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#040b14]/40 via-transparent to-[#040b14]/20 pointer-events-none" />

        {/* ── nav arrows ── */}
        {images.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-2xl bg-[#040b14]/60 border border-[#C9A84C]/30 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all duration-200 shadow-lg">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-2xl bg-[#040b14]/60 border border-[#C9A84C]/30 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all duration-200 shadow-lg">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* ── top-right controls ── */}
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {images.length > 1 && (
            <button onClick={() => setGridView(true)}
              className="h-9 w-9 rounded-xl bg-[#040b14]/70 border border-white/20 flex items-center justify-center text-[#94a3b8] hover:text-[#C9A84C] hover:border-[#C9A84C]/40 backdrop-blur-md transition-all">
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => setLight(true)}
            className="h-9 w-9 rounded-xl bg-[#040b14]/70 border border-white/20 flex items-center justify-center text-[#94a3b8] hover:text-[#C9A84C] hover:border-[#C9A84C]/40 backdrop-blur-md transition-all">
            <Expand className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── bottom overlay: counter + thumbnail hint ── */}
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <div className="flex items-center gap-2">
            {images.length > 1 && (
              <button onClick={() => setGridView(true)}
                className="flex items-center gap-2 bg-[#040b14]/75 border border-white/15 rounded-xl px-3 py-2 backdrop-blur-md hover:border-[#C9A84C]/40 transition-colors">
                <Image className="h-3.5 w-3.5 text-[#C9A84C]" />
                <span className="text-white text-xs font-semibold">MEDIA · {images.length}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {images.length > 1 && images.slice(0, 5).map((_, i) => (
              <button key={i} onClick={() => setCur(i)}
                className={`rounded-full transition-all duration-200 ${i === cur ? "w-6 h-2 bg-[#C9A84C]" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`} />
            ))}
            <div className="ml-2 bg-[#040b14]/75 border border-white/15 rounded-full px-2.5 py-1 text-[#94a3b8] text-[11px] font-medium backdrop-blur-md">
              {cur + 1} / {images.length}
            </div>
          </div>
        </div>
      </div>

      {/* ── Thumbnail strip ── */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 bg-[#04090f] overflow-x-auto border-b border-[#C9A84C]/8 scrollbar-none">
          {images.map((img, i) => (
            <motion.button key={i} onClick={() => setCur(i)} whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 h-16 w-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                i === cur
                  ? "border-[#C9A84C] shadow-lg shadow-[#C9A84C]/25 ring-1 ring-[#C9A84C]/20"
                  : "border-white/8 hover:border-[#C9A84C]/50 opacity-60 hover:opacity-100"
              }`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </motion.button>
          ))}
        </div>
      )}

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {light && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/97 flex items-center justify-center"
            onClick={() => setLight(false)}>
            <button className="absolute top-5 right-5 h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-sm transition-all">
              <X className="h-5 w-5" />
            </button>
            {images.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); prev(); }}
                  className="absolute left-5 h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button onClick={e => { e.stopPropagation(); next(); }}
                  className="absolute right-5 h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <motion.img
              key={cur}
              src={images[cur]}
              alt={title}
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#94a3b8] text-sm tracking-wide">
              {cur + 1} of {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Grid View ── */}
      <AnimatePresence>
        {gridView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#040b14]/98 overflow-y-auto backdrop-blur-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#C9A84C]/15 bg-[#040b14]/90 backdrop-blur-md">
              <div>
                <h3 className="text-white font-semibold text-sm">All Photos</h3>
                <p className="text-[#4a6080] text-xs mt-0.5">{images.length} images</p>
              </div>
              <button onClick={() => setGridView(false)}
                className="h-10 w-10 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center text-white hover:bg-white/15 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-6">
              {images.map((img, i) => (
                <motion.button key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => { setCur(i); setGridView(false); setLight(true); }}
                  className="relative aspect-video overflow-hidden rounded-2xl border border-white/8 hover:border-[#C9A84C]/50 transition-all group/g">
                  <img src={img} alt="" className="w-full h-full object-cover group-hover/g:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/g:opacity-100 transition-opacity flex items-center justify-center">
                    <Expand className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 rounded-lg px-2 py-0.5 text-[10px] text-white/70">{i + 1}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Real Mapbox Map ─── */
const CITY_COORDS: Record<string, [number, number]> = {
  "Lahore":      [74.3587, 31.5204],
  "Islamabad":   [73.0479, 33.6844],
  "Karachi":     [67.0099, 24.8607],
  "Rawalpindi":  [73.0479, 33.6006],
  "Peshawar":    [71.5249, 34.0150],
  "Faisalabad":  [73.0946, 31.4504],
  "Multan":      [71.4687, 30.1575],
  "Quetta":      [67.0011, 30.1798],
};

function MapBlock({ city, area, latitude, longitude }: {
  city: string; area?: string | null;
  latitude?: number | null; longitude?: number | null;
}) {
  const loc = area ? `${area}, ${city}` : city;
  const fallbackCoords = CITY_COORDS[city] ?? [74.3587, 31.5204];
  const lng = longitude ?? fallbackCoords[0];
  const lat = latitude  ?? fallbackCoords[1];
  const token = import.meta.env.VITE_MAPBOX_PUBLIC_KEY;
  const STYLE = "faisalorakzai/cmp6m332s001a01s93rqk58ew";
  const mapUrl = token
    ? `https://api.mapbox.com/styles/v1/${STYLE}/static/pin-s+F3BA2F(${lng},${lat})/${lng},${lat},14,0/800x400@2x?access_token=${token}`
    : null;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#C9A84C]/20" style={{ height: 260 }}>
      {mapUrl ? (
        <>
          <img
            src={mapUrl}
            alt={`Map of ${loc}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              (e.currentTarget.parentElement?.querySelector(".fallback-map") as HTMLElement | null)?.style.removeProperty("display");
            }}
          />
          {/* fallback shown only if img fails */}
          <div className="fallback-map absolute inset-0 hidden bg-gradient-to-br from-[#0b1a2e] to-[#080f1a]">
            <div className="flex h-full items-center justify-center">
              <MapPin className="h-10 w-10 text-[#C9A84C]/40" />
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0b1a2e] to-[#080f1a]">
          <MapPin className="h-10 w-10 text-[#C9A84C]/40 mb-3" />
          <p className="text-[#4a6080] text-xs text-center px-4">
            Add <code className="text-[#C9A84C]/70">VITE_MAPBOX_PUBLIC_KEY</code> to Vercel env to enable live map.
          </p>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-[#040b14]/95 to-transparent flex items-center justify-between pointer-events-none">
        <span className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
          <MapPin className="h-3 w-3 text-[#C9A84C]" />{loc}
        </span>
        <span className="text-[9px] font-bold tracking-widest text-[#C9A84C]/60 border border-[#C9A84C]/20 px-2 py-0.5 rounded-full uppercase bg-[#040b14]/50">
          {mapUrl ? "Mapbox" : "Map Preview"}
        </span>
      </div>
    </div>
  );
}

/* ─── SVG Trust Ring ─── */
function TrustRing({ rating }: { rating: number }) {
  const pct = (rating / 5) * 100;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative h-16 w-16 flex-shrink-0">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#1e3a5f" strokeWidth="4" />
        <motion.circle
          cx="32" cy="32" r={r} fill="none"
          stroke="url(#goldGrad)" strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
        />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9A84C" />
            <stop offset="100%" stopColor="#e8c060" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[#C9A84C] font-bold text-sm leading-none">{rating.toFixed(1)}</span>
        <span className="text-[#3a5070] text-[8px] leading-none mt-0.5">/ 5.0</span>
      </div>
    </div>
  );
}

/* ─── Stars ─── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`h-3 w-3 ${n <= Math.round(rating) ? "text-[#C9A84C] fill-[#C9A84C]" : "text-[#1a2a3a]"}`} />
      ))}
    </div>
  );
}

/* ─── Spec Pill ─── */
function SpecPill({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-2 bg-white/[0.035] border border-[#C9A84C]/15 rounded-2xl px-3 py-4 hover:border-[#C9A84C]/35 hover:bg-[#C9A84C]/5 transition-all group">
      <div className="h-9 w-9 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center group-hover:bg-[#C9A84C]/18 transition-colors">
        <Icon className="h-4 w-4 text-[#C9A84C]" />
      </div>
      <div className="text-white font-bold text-sm">{value}</div>
      <div className="text-[#3a5070] text-[9px] uppercase tracking-wider text-center">{label}</div>
    </div>
  );
}

/* ─── Saved state ─── */
function useSaved(id: number) {
  const key = `saved_property_${id}`;
  const [saved, setSaved] = useState(() => {
    try { return localStorage.getItem(key) === "1"; } catch { return false; }
  });
  const toggle = () => {
    setSaved(v => {
      const next = !v;
      try { next ? localStorage.setItem(key, "1") : localStorage.removeItem(key); } catch {}
      return next;
    });
  };
  return { saved, toggle };
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function PropertyDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { saved, toggle: toggleSave } = useSaved(id);
  const [saveFlash, setSaveFlash] = useState(false);
  const [actionSheet, setActionSheet] = useState<"buy" | "fractional" | "offer" | "tour" | null>(null);
  const [fractionPercent, setFractionPercent] = useState(1);
  const [offerAmount, setOfferAmount] = useState("");
  const [tourDate, setTourDate] = useState("");
  const [tourTime, setTourTime] = useState("10:00");

  const [property, setProperty] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    setIsLoading(true);
    supabase.from("properties").select("*").eq("id", id).single()
      .then(({ data, error }) => {
        // Map snake_case from DB to camelCase expected by frontend. If the
        // curated marketplace card is not seeded yet, use its local record so
        // View Details never dead-ends on a false 404.
        const source = !error && data ? data : MARKETPLACE_FALLBACKS[id];
        if (source) {
          setProperty({
            ...source,
            city: source.city ?? source.location?.split(",").pop()?.trim() ?? "Lahore",
            area: safeArea(source),
            createdAt: source.created_at ?? source.createdAt ?? new Date().toISOString(),
            images: Array.from(new Set([...(Array.isArray(source.images) ? source.images : []), ...GALLERY_FILLERS])).slice(0, 5),
            areaSqFt: source.area_sqft ?? source.areaSqFt ?? source.areaSqft ?? 0,
            isVerified: source.is_verified ?? source.isVerified ?? false,
            isAvailable: source.is_available ?? source.isAvailable ?? true,
            whatsappNumber: source.whatsapp_number || source.whatsappNumber || source.owner_phone || source.ownerPhone,
            ownerRating: source.owner_rating || source.ownerRating || 4.8,
            furnishedStatus: source.furnished_status || source.furnishedStatus,
            occupancyType: source.occupancy_type || source.occupancyType,
            rentalDuration: source.rental_duration || source.rentalDuration,
          });
        }
      })
      .catch(() => {
        const fallback = MARKETPLACE_FALLBACKS[id];
        if (fallback) {
          setProperty({
            ...fallback,
            city: fallback.city ?? "Lahore",
            area: safeArea(fallback),
            createdAt: fallback.createdAt ?? new Date().toISOString(),
            images: Array.from(new Set([...(Array.isArray(fallback.images) ? fallback.images : []), ...GALLERY_FILLERS])).slice(0, 5),
            areaSqFt: fallback.area_sqft ?? fallback.areaSqFt ?? 0,
            isVerified: fallback.is_verified ?? fallback.isVerified ?? false,
            isAvailable: fallback.is_available ?? fallback.isAvailable ?? true,
            ownerRating: fallback.owner_rating ?? fallback.ownerRating ?? 4.8,
          });
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const isRental    = property?.category === "rent";
  const isAvailable = (property as any)?.is_available !== false && (property as any)?.isAvailable !== false;
  const waNum   = property?.whatsapp_number || property?.whatsappNumber
               || property?.owner_phone    || property?.ownerPhone;
  const waText  = isRental
    ? `Hello, I am interested in renting your property *${property?.title ?? ""}* listed for ${formatPrice(Number(property?.price ?? 0), "rent")}/month on Orakzai Properties. Is it still available?`
    : `Hi, I saw your property *${property?.title ?? ""}* on Orakzai Properties and I am interested. Could you please share more details?`;
  const waLink  = waNum ? `https://wa.me/${waNum.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waText)}` : null;
  const catStyle = CAT_STYLE[property?.category ?? ""] ?? CAT_STYLE.buy;
  const TypeIcon = TYPE_ICON[property?.type ?? ""] ?? Home;
  const ownerRating = (property?.owner_rating ?? property?.ownerRating) ? Number(property.owner_rating ?? property.ownerRating) : 4.8;
  const propertyArea = property?.area || safeArea(property ?? {});
  const propertyLocation = `${propertyArea}, ${property?.city || "Lahore"}`;
  const fullPrice = Number(property?.price ?? 0);
  const fractionalMinimum = Math.max(10000, Math.round(fullPrice * 0.001));
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(propertyLocation)}`;

  const handleSave = () => {
    toggleSave();
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 800);
  };

  const handleDirectChat = () => {
    window.location.href = `${basePath}/inbox/1?propertyId=${id}&property=${encodeURIComponent(property?.title ?? "")}`;
  };

  const handleShare = async () => {
    const url  = window.location.href;
    const text = `Check out this property on Orakzai Properties: ${property?.title}`;
    if (navigator.share) {
      try { await navigator.share({ title: property?.title, text, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#040b14" }}>
        <Navbar />
        <div className="h-[600px] bg-white/[0.03] animate-pulse" />
        <div className="max-w-5xl mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[12, 8, 44, 28].map(h => (
              <div key={h} className={`h-${h} bg-white/[0.03] rounded-2xl animate-pulse`} />
            ))}
          </div>
          <div className="h-96 bg-white/[0.03] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4" style={{ background: "#040b14" }}>
        <Navbar />
        <div className="text-center mt-24">
          <div className="h-16 w-16 rounded-2xl bg-[#C9A84C]/8 border border-[#C9A84C]/20 flex items-center justify-center mx-auto mb-6">
            <Home className="h-8 w-8 text-[#C9A84C]/40" />
          </div>
          <h2 className="font-sans text-2xl text-white mb-2">Property Not Found</h2>
          <p className="text-[#4a6080] text-sm mb-6">This listing may have been removed or is unavailable.</p>
          <Link href={`${basePath}/browse`}>
            <button className="bg-gradient-to-r from-[#C9A84C] to-[#e8c060] hover:opacity-90 text-[#040b14] font-bold px-6 py-3 rounded-xl transition-opacity">
              Back to market
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const FURNISHED_LABEL: Record<string, string> = {
    fully_furnished: "Fully Furnished", semi_furnished: "Semi-Furnished", unfurnished: "Unfurnished",
  };
  const OCCUPANCY_LABEL: Record<string, string> = {
    family: "Family", bachelor: "Bachelor", office_commercial: "Office/Commercial",
  };
  const DURATION_LABEL: Record<string, string> = {
    short_term: "Short-term", long_term: "Long-term",
  };

  const specItems = [
    { icon: Bed,      label: "Bedrooms",  value: `${property.beds ?? 0} Beds` },
    { icon: Bath,     label: "Bathrooms", value: `${property.baths ?? 0} Baths` },
    { icon: Maximize2,label: "Area",      value: `${Number(property.area_sqft ?? property.areaSqFt ?? property.areaSqft ?? 0).toLocaleString()} Sq. Ft.` },
    { icon: TypeIcon, label: "Type",      value: property.type === "house" ? "House / Villa" : ((property.type ?? "Property").charAt(0).toUpperCase() + (property.type ?? "property").slice(1)) },
    { icon: MapPin,   label: "City",      value: property.city || "Lahore" },
    { icon: Tag,      label: "Sector",    value: safeArea(property) || "DHA Phase 6" },
  ];

  const luxuryFeatures = [
    "24/7 Security Surveillance",
    "Gated Community Access",
    "High-Speed Fiber Internet Ready",
    "Dedicated Parking Space",
    "Backup Generator Supply",
    "Water Storage & Filtration",
  ];

  return (
    <div className="min-h-screen bg-[#0b0e11] font-sans text-white pb-64">
      <Navbar hideMobileMenu />

      <main className="mx-auto w-full max-w-md px-4 pt-2 sm:px-5">
        <div className="mb-3 flex items-center justify-between">
          <Link href={`${basePath}/browse`}>
            <button className="inline-flex items-center gap-2 rounded-lg px-1 py-2 text-xs font-semibold text-[#9aa4b2] transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to market
            </button>
          </Link>
          <div className="flex items-center gap-1.5">
            <button onClick={handleSave} className={`rounded-lg border p-2 transition ${saved ? "border-rose-500/40 bg-rose-500/10 text-rose-400" : "border-white/10 bg-white/[0.03] text-[#8c98a8] hover:text-white"}`} aria-label="Save asset">
              <Heart className={`h-4 w-4 ${saved ? "fill-rose-400" : ""}`} />
            </button>
            <button onClick={handleShare} className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-[#8c98a8] transition hover:text-white" aria-label="Share asset">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <section className="overflow-visible rounded-none border-0 bg-transparent shadow-none">
          <div className="relative h-56 overflow-hidden rounded-2xl border border-[#252b34] bg-[#12161c] sm:h-72">
            <img src={(property.images ?? [])[0] || GALLERY_FILLERS[0]} alt={property.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12161c] via-transparent to-black/10" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">Verified asset</span>
              <span className="rounded-md border border-white/15 bg-black/35 px-2 py-1 text-[10px] font-medium text-white/80">{property.type || "Property"}</span>
            </div>
            <div className="absolute bottom-3 right-3 rounded-md border border-white/15 bg-black/45 px-2 py-1 text-[10px] font-mono text-white/80">1 / {(property.images ?? []).length || 1}</div>
          </div>

          <div className="grid gap-3.5 p-0 sm:p-0">
            <div className="rounded-2xl border border-[#252b34] bg-[#12161c] p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#697585]">Real estate asset</p>
              <h1 className="text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl">{property.title}</h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#8c98a8]"><MapPin className="h-3.5 w-3.5 text-[#f0b90b]" />{propertyArea}, {property.city || "Lahore"}</p>
            </div>

            <div className="rounded-xl border border-[#2a313b] bg-[#0f1318] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#697585]">Current valuation</p>
                <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-mono text-[#8c98a8]">#{String(property.id).padStart(5, "0")}</span>
              </div>
              <p className="mt-2 text-2xl font-bold leading-none tracking-tight text-[#f0b90b]">{formatPrice(Number(property.price), property.category)}</p>
              <div className="mt-3 grid gap-2 border-t border-white/[0.06] pt-3 text-[11px] text-[#8c98a8]">
                <span>{isRental ? "Monthly lease rate" : `PKR ${Math.round(Number(property.price) / Number(property.areaSqFt || property.area_sqft || 1)).toLocaleString()} per sq. ft.`}</span>
                <span className="inline-flex items-center gap-1 text-emerald-400"><ShieldCheck className="h-3.5 w-3.5" /> Verified listing</span>
              </div>
            </div>

            <section className="rounded-xl border border-[#2a313b] bg-[#12161c] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Investment options</h2>
                <span className="text-[10px] uppercase tracking-[0.14em] text-[#697585]">Exchange desk</span>
              </div>
              <div className="grid gap-2.5">
                <button onClick={() => setActionSheet("buy")} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#f0b90b] text-sm font-bold text-black transition hover:bg-[#f8c62d] active:scale-[0.99]"><ShoppingCart className="h-4 w-4" /> Buy Property</button>
                <button onClick={() => setActionSheet("fractional")} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#39424e] bg-[#1b222b] text-sm font-semibold text-white transition hover:border-[#f0b90b]/50"><Coins className="h-4 w-4 text-[#f0b90b]" /> Invest Fractionally <span className="text-[10px] text-[#8c98a8]">from PKR 10,000</span></button>
                <button onClick={() => setActionSheet("offer")} className="h-9 w-full rounded-lg text-xs font-medium text-[#9aa4b2] transition hover:bg-white/[0.04] hover:text-white">Make an Offer / Negotiate</button>
              </div>
            </section>

            <section className="rounded-2xl border border-[#252b34] bg-[#12161c] p-4">
              <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-white">Asset overview</h2><span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-[#697585]">Key metrics</span></div>
              <div className="grid grid-cols-3 gap-2.5">
                {specItems.map((item) => <div key={item.label} className="min-h-[66px] rounded-xl border border-[#252b34] bg-[#12161c] p-2.5 text-center"><item.icon className="mx-auto mb-1.5 h-4 w-4 text-[#f0b90b]" /><p className="text-xs font-semibold leading-tight text-white">{item.value}</p><p className="mt-1 text-[9px] uppercase tracking-wide text-[#697585]">{item.label}</p></div>)}
              </div>
            </section>

            <section className="rounded-2xl border border-[#252b34] bg-[#12161c] p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Key features</h2><span className="text-[10px] uppercase tracking-[0.14em] text-[#697585]">Verified</span></div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">{luxuryFeatures.map((feature) => <div key={feature} className="flex items-center gap-2 text-xs text-[#c2cbd6]"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />{feature}</div>)}</div>
            </section>

            <section className="rounded-2xl border border-[#252b34] bg-[#12161c] p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Asset description</h2><span className="text-[10px] uppercase tracking-[0.14em] text-[#697585]">Overview</span></div>
              <p className="text-xs leading-6 text-[#9aa4b2]">{property.description}</p>
            </section>

            <section className="rounded-2xl border border-[#252b34] bg-[#12161c] p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Verified operator</h2><span className="text-xs font-semibold text-[#f0b90b]">{ownerRating.toFixed(1)} / 5.0</span></div>
              <div className="flex items-center gap-3 rounded-lg border border-[#252b34] bg-[#0f1318] p-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#f0b90b]/25 bg-[#f0b90b]/10 text-lg font-bold text-[#f0b90b]">{((property.owner_name ?? property.ownerName) ?? "O")[0].toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{property.owner_name ?? property.ownerName ?? "Orakzai Agent"}</p><p className="mt-0.5 text-[11px] text-[#697585]">Identity verified · response under 1 hour</p></div></div>
              <div className="mt-2 grid grid-cols-3 gap-2"><button onClick={handleDirectChat} className="rounded-lg border border-[#39424e] bg-[#1b222b] py-2 text-[11px] font-semibold text-white"><MessageCircle className="mx-auto mb-1 h-3.5 w-3.5 text-[#f0b90b]" />Chat</button><a href={`tel:${property.owner_phone ?? property.ownerPhone ?? ""}`} className="rounded-lg border border-[#39424e] bg-[#1b222b] py-2 text-center text-[11px] font-semibold text-white"><Phone className="mx-auto mb-1 h-3.5 w-3.5 text-[#f0b90b]" />Call</a><button onClick={() => setActionSheet("tour")} className="rounded-lg border border-[#39424e] bg-[#1b222b] py-2 text-[11px] font-semibold text-white"><CalendarDays className="mx-auto mb-1 h-3.5 w-3.5 text-[#f0b90b]" />Tour</button></div>
            </section>

            <section className="rounded-2xl border border-[#252b34] bg-[#12161c] p-4">
              <h2 className="mb-3 text-sm font-semibold text-white">Asset details</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">{[{label:"Asset class",value:isRental?"Rental property":"Real estate"},{label:"Type",value:property.type||"Property"},{label:"City",value:property.city||"Lahore"},{label:"Area",value:propertyArea},{label:"Listed",value:safeDate(property.created_at??property.createdAt)},{label:"Reference",value:`#${String(property.id).padStart(5,"0")}`}].map((row)=><div key={row.label} className="flex items-center justify-between border-b border-white/[0.04] py-1.5"><span className="text-[#697585]">{row.label}</span><span className="font-medium text-[#d8dee7]">{row.value}</span></div>)}</div>
            </section>

            <section className="rounded-2xl border border-[#252b34] bg-[#12161c] p-4">
              <h2 className="mb-3 text-sm font-semibold text-white">Location</h2>
              <MapBlock city={property.city || "Lahore"} area={propertyArea} latitude={(property as any).latitude} longitude={(property as any).longitude} />
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#39424e] bg-[#1b222b] py-2.5 text-xs font-semibold text-white"><Navigation className="h-3.5 w-3.5 text-[#f0b90b]" /> Open maps</a>
            </section>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2a313b] bg-[#0b0e11]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2"><button onClick={handleSave} className="rounded-lg border border-[#39424e] bg-[#1b222b] p-3 text-[#9aa4b2]"><Heart className={`h-4 w-4 ${saved ? "fill-rose-400 text-rose-400" : ""}`} /></button>{waLink ? <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#f0b90b] text-sm font-bold text-black"><MessageCircle className="h-4 w-4" /> Contact operator</a> : <button onClick={handleDirectChat} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#f0b90b] text-sm font-bold text-black"><MessageCircle className="h-4 w-4" /> Contact operator</button>}<button onClick={handleShare} className="rounded-lg border border-[#39424e] bg-[#1b222b] p-3 text-[#9aa4b2]"><Share2 className="h-4 w-4" /></button></div>
      </div>

      <AnimatePresence>
        {actionSheet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[180] flex items-end sm:items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setActionSheet(null)}>
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#C9A84C]/30 bg-[#0b1725] p-5 shadow-2xl shadow-black/60">
              <div className="flex items-start justify-between gap-4 mb-5"><div><p className="text-[#C9A84C] text-[10px] font-bold uppercase tracking-[.18em]">Sovereign settlement desk</p><h3 className="text-white text-lg font-bold mt-1">{actionSheet === "buy" ? "Buy Asset" : actionSheet === "fractional" ? "Buy Buy Fractional Units" : actionSheet === "offer" ? "Submit Offer" : "Schedule Site Tour"}</h3><p className="text-[#6a7f99] text-xs mt-1 line-clamp-1">{property.title}</p></div><button onClick={() => setActionSheet(null)} className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-[#94a3b8] flex items-center justify-center"><X className="h-4 w-4" /></button></div>
              {actionSheet === "buy" && <div className="space-y-4"><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4"><p className="text-[#6a7f99] text-[10px] uppercase tracking-wider">Settlement amount</p><p className="text-emerald-300 text-2xl font-bold font-mono mt-1">{formatPrice(fullPrice, property.category)}</p><p className="text-[#6a7f99] text-xs mt-2">A consultant will contact you to complete KYC, escrow, and title verification.</p></div><button onClick={() => { setActionSheet(null); handleDirectChat(); }} className="w-full rounded-xl bg-[#C9A84C] py-3.5 text-sm font-extrabold text-[#040b14] inline-flex items-center justify-center gap-2"><Send className="h-4 w-4" /> Start purchase with consultant</button></div>}
              {actionSheet === "fractional" && <div className="space-y-4"><div className="flex items-center justify-between"><span className="text-[#94a3b8] text-xs">Ownership allocation</span><strong className="text-[#e8c060] text-sm">{fractionPercent}%</strong></div><input type="range" min="1" max="100" value={fractionPercent} onChange={(e) => setFractionPercent(Number(e.target.value))} className="w-full accent-[#C9A84C]" /><div className="rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/8 p-4"><p className="text-[#6a7f99] text-[10px] uppercase tracking-wider">Estimated token allocation</p><p className="text-[#e8c060] text-2xl font-bold font-mono mt-1">{formatPrice(Math.round(fullPrice * fractionPercent / 100), property.category)}</p><p className="text-[#6a7f99] text-xs mt-1">Minimum entry from PKR {fractionalMinimum.toLocaleString()}</p></div><button onClick={() => { setActionSheet(null); handleDirectChat(); }} className="w-full rounded-xl border border-[#C9A84C]/35 bg-[#C9A84C]/12 py-3.5 text-sm font-extrabold text-[#e8c060] inline-flex items-center justify-center gap-2"><Coins className="h-4 w-4" /> Reserve fractional allocation</button></div>}
              {actionSheet === "offer" && <div className="space-y-4"><label className="block text-[#94a3b8] text-xs">Your offer amount<input value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} inputMode="decimal" placeholder="Enter amount in PKR" className="mt-2 w-full rounded-xl border border-white/10 bg-[#06101c] px-4 py-3 text-white outline-none focus:border-[#C9A84C]/60" /></label><button onClick={() => { setActionSheet(null); handleDirectChat(); }} disabled={!offerAmount} className="w-full rounded-xl bg-[#C9A84C] py-3.5 text-sm font-extrabold text-[#040b14] disabled:opacity-40 inline-flex items-center justify-center gap-2"><Gavel className="h-4 w-4" /> Submit offer to consultant</button></div>}
              {actionSheet === "tour" && <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><label className="text-[#94a3b8] text-xs">Date<input type="date" value={tourDate} onChange={(e) => setTourDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#06101c] px-3 py-3 text-white outline-none focus:border-[#C9A84C]/60" /></label><label className="text-[#94a3b8] text-xs">Time<input type="time" value={tourTime} onChange={(e) => setTourTime(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#06101c] px-3 py-3 text-white outline-none focus:border-[#C9A84C]/60" /></label></div><button onClick={() => { setActionSheet(null); handleDirectChat(); }} disabled={!tourDate} className="w-full rounded-xl bg-[#C9A84C] py-3.5 text-sm font-extrabold text-[#040b14] disabled:opacity-40 inline-flex items-center justify-center gap-2"><CalendarDays className="h-4 w-4" /> Request this tour slot</button></div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
