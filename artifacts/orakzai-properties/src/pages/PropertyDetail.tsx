import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft, Share2, Heart, Phone, MessageCircle, ShieldCheck,
  ChevronLeft, ChevronRight, Expand, X, Star, Bed, Bath,
  Maximize2, Home, Building2, Layers, MapPin, Calendar,
  Tag, CheckCircle2, Sofa, Users, Clock, BanIcon,
  Wifi, Car, Shield, Zap, Wind, Droplets, TreePine, Dumbbell,
  Grid3X3, Image,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
import { formatPrice } from "@/components/PropertyCard";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const CAT_STYLE: Record<string, { pill: string; glow: string; name: string; accent: string }> = {
  buy:  { pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35", glow: "shadow-emerald-500/20", name: "For Sale",   accent: "#22c55e" },
  sell: { pill: "bg-blue-500/15 text-blue-300 border-blue-500/35",         glow: "shadow-blue-500/20",   name: "Selling",    accent: "#3b82f6" },
  rent: { pill: "bg-violet-500/15 text-violet-300 border-violet-500/35",   glow: "shadow-violet-500/20", name: "For Rent",   accent: "#8b5cf6" },
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
                <span className="text-white text-xs font-semibold">View All {images.length} Photos</span>
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

  const [property, setProperty] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    setIsLoading(true);
    supabase.from("properties").select("*").eq("id", id).single()
      .then(({ data, error }) => {
        if (!error && data) setProperty(data);
        setIsLoading(false);
      });
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

  const handleSave = () => {
    toggleSave();
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 800);
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
          <h2 className="font-serif text-2xl text-white mb-2">Property Not Found</h2>
          <p className="text-[#4a6080] text-sm mb-6">This listing may have been removed or is unavailable.</p>
          <Link href={`${basePath}/browse`}>
            <button className="bg-gradient-to-r from-[#C9A84C] to-[#e8c060] hover:opacity-90 text-[#040b14] font-bold px-6 py-3 rounded-xl transition-opacity">
              Back to Marketplace
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
    ...(property.beds     ? [{ icon: Bed,       label: "Bedrooms",   value: property.beds }]   : []),
    ...(property.baths    ? [{ icon: Bath,       label: "Bathrooms",  value: property.baths }]  : []),
    ...((property.area_sqft ?? property.areaSqft) ? [{ icon: Maximize2, label: "Sq. Ft.", value: (property.area_sqft ?? property.areaSqft).toLocaleString() }] : []),
    { icon: TypeIcon,       label: "Type",       value: property.type.charAt(0).toUpperCase() + property.type.slice(1) },
    { icon: MapPin,         label: "City",       value: property.city },
    ...((isRental && (property as any).furnishedStatus) ? [{ icon: Sofa,  label: "Furnished",  value: FURNISHED_LABEL[(property as any).furnishedStatus] ?? (property as any).furnishedStatus }] : []),
    ...((isRental && (property as any).occupancyType)   ? [{ icon: Users, label: "Occupancy",  value: OCCUPANCY_LABEL[(property as any).occupancyType] ?? (property as any).occupancyType }] : []),
    ...((isRental && (property as any).rentalDuration)  ? [{ icon: Clock, label: "Duration",   value: DURATION_LABEL[(property as any).rentalDuration] ?? (property as any).rentalDuration }] : []),
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
    <div className="min-h-screen text-foreground" style={{ background: "linear-gradient(180deg, #040b14 0%, #06101c 100%)" }}>
      {/* ── Ambient glows ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-60 right-1/3 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/3 left-0 w-80 h-80 rounded-full bg-[#1e3a8a]/[0.05] blur-[100px]" />
      </div>

      <Navbar />

      {/* ══ Gallery ══ */}
      <div className="pt-14">
        <Gallery images={property.images ?? []} title={property.title} />
      </div>

      {/* ══ Sticky sub-header: Back + Save + Share ══ */}
      <div className="sticky top-14 z-50 flex items-center justify-between px-4 py-2.5
        bg-[#040b14]/88 backdrop-blur-xl border-b border-[#C9A84C]/12">
        <Link href={`${basePath}/browse`}>
          <button className="flex items-center gap-2.5 text-[#C9A84C] hover:text-white text-sm font-semibold transition-colors group">
            <div className="h-8 w-8 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 flex items-center justify-center group-hover:bg-[#C9A84C]/20 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="hidden sm:block">Back to Marketplace</span>
          </button>
        </Link>
        <div className="flex items-center gap-1">
          <span className="text-[#3a5070] text-[10px] font-medium mr-2 hidden sm:block">{property.title.slice(0, 40)}{property.title.length > 40 ? "…" : ""}</span>
          <motion.button
            onClick={handleSave}
            whileTap={{ scale: 0.82 }}
            className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all duration-200 ${
              saved ? "bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-lg shadow-rose-500/10" : "bg-white/5 border-white/10 text-[#6a7f99] hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
            }`}>
            <Heart className={`h-4 w-4 ${saved ? "fill-rose-400" : ""}`} />
          </motion.button>
          <button onClick={handleShare}
            className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 text-[#6a7f99] hover:border-[#C9A84C]/40 hover:text-[#C9A84C] flex items-center justify-center transition-all">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ══ Main Content ══ */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-7 pb-44">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* ════════════════ LEFT COLUMN (2/3) ════════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Title block ── */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${catStyle.pill}`}>
                  {catStyle.name}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] bg-white/5 border border-white/10 text-[#6a7f99] px-2.5 py-1 rounded-full capitalize">
                  <TypeIcon className="h-3 w-3" /> {property.type}
                </span>
                {(property.is_verified ?? property.isVerified) && (
                  <span className="flex items-center gap-1.5 text-[11px] bg-[#C9A84C]/10 border border-[#C9A84C]/35 text-[#C9A84C] px-2.5 py-1 rounded-full font-bold">
                    <ShieldCheck className="h-3.5 w-3.5" /> Sovereign Verified
                  </span>
                )}
                {!isAvailable && isRental && (
                  <span className="flex items-center gap-1.5 text-[11px] bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2.5 py-1 rounded-full font-semibold">
                    <BanIcon className="h-3 w-3" /> Rented Out
                  </span>
                )}
              </div>

              <h1 className="font-serif text-2xl md:text-[2rem] font-bold text-white leading-tight mb-2">
                {property.title}
              </h1>
              <div className="flex items-center gap-1.5 text-[#4a6080] text-sm">
                <MapPin className="h-3.5 w-3.5 text-[#C9A84C]/60 flex-shrink-0" />
                <span>{property.area ? `${property.area}, ` : ""}{property.city}</span>
              </div>
            </motion.div>

            {/* ── HERO PRICE CARD ── */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }}
              className="relative overflow-hidden rounded-3xl border border-[#C9A84C]/30"
              style={{ background: "linear-gradient(135deg, #0c1c0e 0%, #0a1628 50%, #060d16 100%)" }}
            >
              {/* top shine line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/60 to-transparent" />
              <div className="absolute inset-0"
                style={{ background: "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(201,168,76,0.12) 0%, transparent 60%)" }} />

              <div className="relative p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <p className="text-[#4a6080] text-[10px] uppercase tracking-[.22em] font-semibold mb-2">
                      {isRental ? "Monthly Rent" : "Listed Price"}
                    </p>
                    <div className="font-serif text-5xl md:text-6xl font-bold text-[#C9A84C] leading-none tracking-tight"
                      style={{ textShadow: "0 0 60px rgba(201,168,76,0.3)" }}>
                      {formatPrice(Number(property.price), property.category)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {isRental && (
                        <span className="text-[#3a5070] text-xs">per calendar month</span>
                      )}
                      {!isRental && property.areaSqft && (
                        <span className="text-[#3a5070] text-xs">
                          ≈ PKR {Math.round(Number(property.price) / property.areaSqft).toLocaleString()} / sq. ft.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-3">
                    {property.isVerified && (
                      <div className="flex items-center gap-2.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-2xl px-4 py-2.5">
                        <ShieldCheck className="h-5 w-5 text-[#C9A84C] flex-shrink-0" />
                        <div>
                          <p className="text-[#C9A84C] text-xs font-bold">Sovereign Verified</p>
                          <p className="text-[#C9A84C]/50 text-[10px]">Price authenticated</p>
                        </div>
                      </div>
                    )}
                    {isRental && !isAvailable && (
                      <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2">
                        <BanIcon className="h-4 w-4 text-rose-400 flex-shrink-0" />
                        <span className="text-rose-300 text-xs font-semibold">Currently Rented</span>
                      </div>
                    )}
                    <div className="text-[11px] text-[#2a3a50] font-mono">ID #{String(property.id).padStart(5, "0")}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Specs grid — glassmorphic ── */}
            {specItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.5 }}
                className="relative overflow-hidden rounded-2xl border border-white/8 p-5"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(14,26,46,0.9) 100%)", backdropFilter: "blur(12px)" }}
              >
                <div className="absolute inset-0 rounded-2xl"
                  style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 55%)" }} />
                <h3 className="font-serif text-base font-bold text-white mb-4 relative flex items-center gap-2">
                  <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[#C9A84C] to-[#e8c060]" />
                  Property Highlights
                </h3>
                <div className={`grid grid-cols-3 sm:grid-cols-${Math.min(specItems.length, 5)} gap-3 relative`}>
                  {specItems.map(s => (
                    <SpecPill key={s.label} icon={s.icon} label={s.label} value={s.value} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Luxury Features ── */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.5 }}
              className="rounded-2xl border border-white/6 p-6"
              style={{ background: "linear-gradient(160deg, #0b1828 0%, #060d16 100%)" }}
            >
              <h3 className="font-serif text-base font-bold text-white mb-4 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[#C9A84C] to-[#e8c060]" />
                Key Features & Amenities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {luxuryFeatures.map((feat, i) => (
                  <motion.div key={feat}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.05 }}
                    className="flex items-center gap-2.5 text-xs text-[#8aa4c0]">
                    <div className="w-4 h-4 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5 text-[#C9A84C]" />
                    </div>
                    {feat}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ── Description ── */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
              className="rounded-2xl border border-white/6 p-6"
              style={{ background: "linear-gradient(160deg, #0c1c2e 0%, #060d16 100%)" }}
            >
              <h3 className="font-serif text-lg font-bold text-white mb-4 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[#C9A84C] to-[#e8c060]" />
                About This Property
              </h3>
              <p className="text-[#6a7f99] text-sm leading-[1.85] whitespace-pre-line">{property.description}</p>

              {/* ── Details table ── */}
              <div className="mt-6 pt-5 border-t border-white/6">
                <h4 className="font-serif text-sm font-bold text-[#94a3b8] mb-3 flex items-center gap-2">
                  <div className="h-3.5 w-0.5 rounded-full bg-[#C9A84C]/60" />
                  Listing Details
                </h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
                  {[
                    { label: "Category",    value: catStyle.name },
                    { label: "Type",        value: property.type.charAt(0).toUpperCase() + property.type.slice(1) },
                    { label: "City",        value: property.city },
                    { label: "Area",        value: property.area || "N/A" },
                    { label: "Listed",      value: new Date(property.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" }) },
                    { label: "Property ID", value: `#${String(property.id).padStart(5, "0")}` },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                      <span className="text-[#2a3a50] text-[10px] uppercase tracking-wider">{row.label}</span>
                      <span className="text-[#c8d8e8] text-xs font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── Map ── */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.5 }}
            >
              <h3 className="font-serif text-lg font-bold text-white mb-3 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[#C9A84C] to-[#e8c060]" />
                Location
              </h3>
              <MapBlock city={property.city} area={property.area} latitude={(property as any).latitude} longitude={(property as any).longitude} />
              <p className="text-[#2a3a50] text-[10px] text-center mt-2">Approximate location shown for privacy</p>
            </motion.div>
          </div>

          {/* ════════════════ RIGHT COLUMN (1/3) ════════════════ */}
          <div>
            <div className="sticky top-28 space-y-4">

              {/* ── Agent / Owner Card ── */}
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                className="rounded-2xl border border-[#C9A84C]/25 overflow-hidden"
                style={{ background: "linear-gradient(160deg, #0d1e30 0%, #060d16 100%)" }}
              >
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />
                <div className="p-5">
                  <p className="text-[#3a5070] text-[9px] font-bold uppercase tracking-[.22em] mb-4">Property Consultant</p>

                  {/* Avatar + Trust Ring */}
                  <div className="flex items-center gap-3 mb-4">
                    {(property.owner_avatar ?? property.ownerAvatar) ? (
                      <div className="relative flex-shrink-0">
                        <img src={property.owner_avatar ?? property.ownerAvatar} alt={(property.owner_name ?? property.ownerName) ?? "Agent"}
                          className="h-14 w-14 rounded-2xl object-cover border-2 border-[#C9A84C]/30" />
                      </div>
                    ) : (
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#C9A84C] font-serif text-xl font-bold">
                          {((property.owner_name ?? property.ownerName) ?? "O")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm truncate">{property.owner_name ?? property.ownerName ?? "Orakzai Agent"}</div>
                      <div className="text-[#3a5070] text-xs mt-0.5">Verified Consultant</div>
                    </div>
                    <TrustRing rating={ownerRating} />
                  </div>

                  {/* Stars + trust label */}
                  <div className="flex items-center gap-2 mb-3">
                    <Stars rating={ownerRating} />
                    <span className="text-[#C9A84C] text-xs font-bold">{ownerRating.toFixed(1)}</span>
                    <span className="text-[#2a3a50] text-[10px]">Sovereign Trust Rating</span>
                  </div>

                  {/* stat pills */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: "Response", value: "< 1hr" },
                      { label: "Properties", value: "12+" },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl bg-white/[0.03] border border-white/6 px-3 py-2 text-center">
                        <p className="text-white text-sm font-bold">{value}</p>
                        <p className="text-[#3a5070] text-[9px] uppercase tracking-wider mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* verified badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="flex items-center gap-1 text-[9px] bg-[#C9A84C]/8 border border-[#C9A84C]/20 text-[#C9A84C] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      <CheckCircle2 className="h-2.5 w-2.5" /> ID Verified
                    </span>
                    <span className="flex items-center gap-1 text-[9px] bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      <ShieldCheck className="h-2.5 w-2.5" /> Trusted Agent
                    </span>
                  </div>

                  {/* rented notice */}
                  {isRental && !isAvailable && (
                    <div className="flex items-start gap-2 bg-rose-900/20 border border-rose-500/25 rounded-xl px-3 py-2.5 mb-3">
                      <BanIcon className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span className="text-rose-300 text-xs leading-relaxed">This property has already been rented and is no longer accepting inquiries.</span>
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="space-y-2.5">
                    {waLink && (isRental ? isAvailable : true) && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer"
                        onClick={() => {
                          if (isRental) {
                            import("@/pages/MyProperties").then(m => {
                              m.recordRentalInquiry({ id: property.id, title: property.title, price: Number(property.price), city: property.city });
                            });
                          }
                        }}>
                        <button className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl bg-[#25D366] hover:bg-[#20c55a] text-white font-bold text-sm shadow-lg shadow-[#25D366]/20 transition-all">
                          <MessageCircle className="h-4.5 w-4.5" />
                          {isRental ? "Request to Rent via WhatsApp" : "WhatsApp for Inquiry"}
                        </button>
                      </a>
                    )}
                    {(property.owner_phone ?? property.ownerPhone) && (
                      <a href={`tel:${property.owner_phone ?? property.ownerPhone}`}>
                        <button className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border border-white/10 bg-white/5 text-[#e8edf5] hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/5 font-semibold text-sm transition-all">
                          <Phone className="h-4 w-4 text-[#C9A84C]" />
                          {property.owner_phone ?? property.ownerPhone}
                        </button>
                      </a>
                    )}
                    {isRental && !isAvailable && (
                      <button disabled className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-rose-500/20 bg-rose-900/10 text-rose-400/60 font-semibold text-sm cursor-not-allowed">
                        <BanIcon className="h-4 w-4" /> Already Rented
                      </button>
                    )}
                  </div>

                  {/* pre-fill preview */}
                  {waLink && isAvailable && (
                    <div className="mt-3 rounded-xl bg-[#C9A84C]/5 border border-[#C9A84C]/12 p-3">
                      <p className="text-[#3a5070] text-[10px] mb-1.5">Pre-filled WhatsApp message:</p>
                      <p className="text-[11px] text-[#C9A84C]/80 italic leading-relaxed line-clamp-3">"{waText}"</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* ── Property Details card ── */}
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.26, duration: 0.5 }}
                className="rounded-2xl border border-white/6 p-4 space-y-2.5"
                style={{ background: "linear-gradient(160deg, #0c1c2e 0%, #060d16 100%)" }}
              >
                <h4 className="font-serif text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                  <div className="h-3 w-0.5 rounded-full bg-[#C9A84C]/60" />
                  Quick Details
                </h4>
                {[
                  { label: "Property ID",  value: `#${String(property.id).padStart(5, "0")}` },
                  { label: "Listed On",    value: new Date(property.created_at ?? property.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" }) },
                  { label: "Status",       value: catStyle.name, badge: true, color: catStyle.pill },
                  ...((property.is_verified ?? property.isVerified) ? [{ label: "Verification", value: "Sovereign Verified", verified: true }] : []),
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-[#3a5070] text-[10px] uppercase tracking-wider">{row.label}</span>
                    {(row as any).verified ? (
                      <span className="text-[#C9A84C] text-xs font-bold flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> {row.value}
                      </span>
                    ) : (row as any).badge ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${row.color}`}>{row.value}</span>
                    ) : (
                      <span className="text-[#c8d8e8] text-xs font-medium font-mono">{row.value}</span>
                    )}
                  </div>
                ))}
              </motion.div>

              {/* ── Sovereign Guarantee seal ── */}
              {property.isVerified && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                  className="rounded-2xl border border-[#C9A84C]/20 px-4 py-3 flex items-start gap-3"
                  style={{ background: "linear-gradient(135deg, #0a1408, #060d16)" }}
                >
                  <ShieldCheck className="h-5 w-5 text-[#C9A84C] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[#C9A84C] text-xs font-bold">Sovereign Guarantee</p>
                    <p className="text-[#3a5070] text-[10px] leading-relaxed mt-0.5">
                      This property's price and documentation have been independently verified by the Orakzai Properties team.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          FLOATING ACTION BAR — sticky bottom
      ══════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, type: "spring", stiffness: 240, damping: 22 }}
        className="fixed bottom-0 left-0 right-0 z-50 px-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-[#C9A84C]/30 shadow-2xl shadow-black/70"
            style={{ background: "linear-gradient(135deg, rgba(8,14,24,0.97) 0%, rgba(4,11,20,0.98) 100%)" }}>

            {/* gold shimmer line */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#C9A84C]/80 to-transparent" />

            <div className="flex items-center gap-2 px-3 py-3">

              {/* CALL — icon button */}
              {(property.owner_phone ?? property.ownerPhone) ? (
                <a href={`tel:${property.owner_phone ?? property.ownerPhone}`} className="flex-shrink-0">
                  <motion.div whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center gap-1 w-14 py-1.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer">
                    <div className="h-9 w-9 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 flex items-center justify-center group-hover:bg-[#C9A84C]/20 transition-colors">
                      <Phone className="h-4 w-4 text-[#C9A84C]" />
                    </div>
                    <span className="text-[9px] font-semibold text-[#6a7f99] group-hover:text-[#C9A84C] transition-colors uppercase tracking-wide">Call</span>
                  </motion.div>
                </a>
              ) : (
                <div className="flex-shrink-0 flex flex-col items-center gap-1 w-14 py-1.5 opacity-25 cursor-not-allowed">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-[#4a6080]" />
                  </div>
                  <span className="text-[9px] font-semibold text-[#3a5070] uppercase tracking-wide">Call</span>
                </div>
              )}

              {/* WHATSAPP — primary hero CTA */}
              {waLink && (isRental ? isAvailable : true) ? (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1"
                  onClick={() => {
                    if (isRental) {
                      import("@/pages/MyProperties").then(m => {
                        m.recordRentalInquiry({ id: property.id, title: property.title, price: Number(property.price), city: property.city });
                      });
                    }
                  }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#25D366]/20"
                    style={{ background: "linear-gradient(135deg, #128C7E, #25D366)" }}>
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-white">{isRental ? "Request to Rent" : "WhatsApp Agent"}</span>
                  </motion.button>
                </a>
              ) : isRental && !isAvailable ? (
                <div className="flex-1">
                  <div className="w-full flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm border border-rose-500/20 bg-rose-900/10 text-rose-400/60 cursor-not-allowed">
                    <BanIcon className="h-4 w-4" />
                    <span>Property Rented</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="w-full flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-[#4a6080] cursor-not-allowed">
                    <MessageCircle className="h-4 w-4" />
                    <span>No Contact Info</span>
                  </div>
                </div>
              )}

              {/* SAVE — icon button */}
              <motion.button onClick={handleSave} whileTap={{ scale: 0.85 }}
                className="flex-shrink-0 flex flex-col items-center gap-1 w-14 py-1.5 rounded-xl hover:bg-white/5 transition-colors group">
                <AnimatePresence mode="wait">
                  <motion.div key={saved ? "saved" : "unsaved"}
                    initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}
                    className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${
                      saved ? "bg-rose-500/15 border-rose-500/40" : "bg-white/5 border-white/10 group-hover:bg-rose-500/10 group-hover:border-rose-500/30"
                    }`}>
                    <Heart className={`h-4 w-4 transition-colors ${saved ? "text-rose-400 fill-rose-400" : "text-[#4a6080] group-hover:text-rose-400"}`} />
                  </motion.div>
                </AnimatePresence>
                <span className={`text-[9px] font-semibold uppercase tracking-wide transition-colors ${saved ? "text-rose-400" : "text-[#6a7f99] group-hover:text-rose-400"}`}>
                  {saved ? "Saved" : "Save"}
                </span>
              </motion.button>

              {/* SHARE — icon button */}
              <motion.button onClick={handleShare} whileTap={{ scale: 0.9 }}
                className="flex-shrink-0 flex flex-col items-center gap-1 w-14 py-1.5 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#C9A84C]/10 group-hover:border-[#C9A84C]/30 transition-all">
                  <Share2 className="h-4 w-4 text-[#4a6080] group-hover:text-[#C9A84C] transition-colors" />
                </div>
                <span className="text-[9px] font-semibold text-[#6a7f99] group-hover:text-[#C9A84C] transition-colors uppercase tracking-wide">Share</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
