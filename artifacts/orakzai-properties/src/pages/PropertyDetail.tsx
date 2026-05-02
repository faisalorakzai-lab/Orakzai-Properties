import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Share2, Heart, Phone, MessageCircle, ShieldCheck,
  ChevronLeft, ChevronRight, Expand, X, Star, Bed, Bath,
  Maximize2, Home, Building2, Layers, MapPin, Calendar,
  Tag, Eye, CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useGetProperty, getGetPropertyQueryKey } from "@workspace/api-client-react";
import { formatPrice } from "@/components/PropertyCard";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const CAT_STYLE: Record<string, { pill: string; glow: string; name: string }> = {
  buy:  { pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35", glow: "shadow-emerald-500/20", name: "For Sale" },
  sell: { pill: "bg-blue-500/15 text-blue-300 border-blue-500/35",         glow: "shadow-blue-500/20",   name: "Selling"  },
  rent: { pill: "bg-violet-500/15 text-violet-300 border-violet-500/35",   glow: "shadow-violet-500/20", name: "For Rent" },
};

const TYPE_ICON: Record<string, typeof Home> = {
  house: Home, commercial: Building2, plot: Layers,
};

/* ─── Image Gallery ────────────────────────────────────────────────────────── */
function Gallery({ images, title }: { images: string[]; title: string }) {
  const [cur, setCur]     = useState(0);
  const [light, setLight] = useState(false);
  const has = images?.length > 0 && images[0];

  const prev = () => setCur(c => (c - 1 + images.length) % images.length);
  const next = () => setCur(c => (c + 1) % images.length);

  useEffect(() => {
    if (!light) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLight(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [light, images.length]);

  if (!has) {
    return (
      <div className="relative w-full h-[320px] md:h-[520px] bg-gradient-to-br from-[#0d1e35] via-[#0f2040] to-[#0a1525] flex items-center justify-center border-b border-[#C9A84C]/10">
        <div className="text-center">
          <div className="h-20 w-20 rounded-2xl bg-[#C9A84C]/8 border border-[#C9A84C]/20 flex items-center justify-center mx-auto mb-4">
            <Home className="h-10 w-10 text-[#C9A84C]/25" />
          </div>
          <p className="text-[#2a3a50] text-sm font-medium">No images available</p>
          <p className="text-[#1a2a3a] text-xs mt-1">Upload photos to showcase this property</p>
        </div>
        {/* decorative gold grid */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(201,168,76,1) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full h-[320px] md:h-[520px] overflow-hidden bg-[#070e1a] group">
        <AnimatePresence mode="wait">
          <motion.img
            key={cur}
            src={images[cur]}
            alt={`${title} – ${cur + 1}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* cinema gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070e1a]/90 via-[#070e1a]/10 to-transparent pointer-events-none" />

        {/* arrows */}
        {images.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-[#070e1a]/70 border border-[#C9A84C]/30 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-[#C9A84C] transition-all">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-[#070e1a]/70 border border-[#C9A84C]/30 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-[#C9A84C] transition-all">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* fullscreen */}
        <button onClick={() => setLight(true)}
          className="absolute top-4 right-4 h-9 w-9 rounded-xl bg-[#070e1a]/70 border border-white/15 flex items-center justify-center text-[#94a3b8] hover:text-white hover:border-[#C9A84C]/50 transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100">
          <Expand className="h-4 w-4" />
        </button>

        {/* counter + dots */}
        {images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <div className="flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setCur(i)}
                  className={`rounded-full transition-all ${i === cur ? "w-5 h-1.5 bg-[#C9A84C]" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"}`} />
              ))}
            </div>
          </div>
        )}
        <div className="absolute bottom-5 right-5 bg-[#070e1a]/70 border border-white/10 rounded-full px-2.5 py-1 text-[#94a3b8] text-xs backdrop-blur-sm">
          {cur + 1} / {images.length}
        </div>
      </div>

      {/* thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 bg-[#060d18] overflow-x-auto border-b border-[#C9A84C]/8">
          {images.map((img, i) => (
            <button key={i} onClick={() => setCur(i)}
              className={`flex-shrink-0 h-14 w-20 rounded-xl overflow-hidden border-2 transition-all ${i === cur ? "border-[#C9A84C] shadow-md shadow-[#C9A84C]/20" : "border-white/8 hover:border-[#C9A84C]/40"}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* lightbox */}
      <AnimatePresence>
        {light && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/97 flex items-center justify-center"
            onClick={() => setLight(false)}>
            <button className="absolute top-5 right-5 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
              <X className="h-5 w-5" />
            </button>
            {images.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); prev(); }}
                  className="absolute left-5 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button onClick={e => { e.stopPropagation(); next(); }}
                  className="absolute right-5 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <img src={images[cur]} alt={title} onClick={e => e.stopPropagation()}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#94a3b8] text-sm">
              {cur + 1} of {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── 3D Map Placeholder ──────────────────────────────────────────────────── */
function MapBlock({ city, area }: { city: string; area?: string | null }) {
  const loc = area ? `${area}, ${city}` : city;
  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#C9A84C]/15 bg-gradient-to-br from-[#0b1a2e] via-[#0d2040] to-[#080f1a]"
      style={{ height: 220, perspective: "600px" }}>
      {/* 3D-rotated grid */}
      <div className="absolute inset-0 opacity-12"
        style={{
          backgroundImage: "linear-gradient(rgba(201,168,76,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.7) 1px,transparent 1px)",
          backgroundSize: "36px 36px",
          transform: "rotateX(45deg) scale(1.6) translateY(20%)",
          transformOrigin: "bottom center",
        }} />
      {/* road lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 220" preserveAspectRatio="none">
        <line x1="0" y1="140" x2="400" y2="100" stroke="#C9A84C" strokeWidth="4" strokeLinecap="round" />
        <line x1="180" y1="0" x2="220" y2="220" stroke="#C9A84C" strokeWidth="2.5" />
        <line x1="0" y1="80" x2="400" y2="60" stroke="#C9A84C" strokeWidth="1.5" strokeDasharray="10 10" opacity=".6" />
        <line x1="60" y1="0" x2="80" y2="220" stroke="#C9A84C" strokeWidth="1" strokeDasharray="8 12" opacity=".5" />
        <line x1="310" y1="0" x2="330" y2="220" stroke="#C9A84C" strokeWidth="1" strokeDasharray="8 12" opacity=".5" />
        <rect x="100" y="80" width="70" height="45" rx="4" fill="rgba(201,168,76,.05)" stroke="rgba(201,168,76,.2)" strokeWidth="1" />
        <rect x="230" y="50" width="90" height="60" rx="4" fill="rgba(201,168,76,.05)" stroke="rgba(201,168,76,.2)" strokeWidth="1" />
        <rect x="50" y="130" width="55" height="40" rx="4" fill="rgba(201,168,76,.05)" stroke="rgba(201,168,76,.2)" strokeWidth="1" />
      </svg>

      {/* center gradient glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-28 w-28 rounded-full bg-[#C9A84C]/10 blur-2xl" />
      </div>

      {/* pin */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="h-12 w-12 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#a07830] shadow-xl shadow-[#C9A84C]/50 flex items-center justify-center z-10">
            <MapPin className="h-6 w-6 text-[#080f1a]" />
          </motion.div>
          {/* ping rings */}
          <motion.div
            animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
            className="absolute h-12 w-12 rounded-full border-2 border-[#C9A84C]/60" />
          <motion.div
            animate={{ scale: [1, 2.8], opacity: [0.3, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, delay: 0.4, ease: "easeOut" }}
            className="absolute h-12 w-12 rounded-full border border-[#C9A84C]/30" />
          {/* label */}
          <div className="mt-2 bg-[#070e1a]/90 border border-[#C9A84C]/40 rounded-xl px-3 py-1.5 backdrop-blur-sm shadow-lg z-10">
            <p className="text-[#C9A84C] text-xs font-bold text-center leading-tight">{loc}</p>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 bg-gradient-to-t from-[#070e1a] to-transparent flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[#4a6080] text-xs">
          <MapPin className="h-3 w-3 text-[#C9A84C]" />{loc}
        </span>
        <span className="text-[9px] font-bold tracking-widest text-[#2a3a50] border border-white/8 px-2 py-0.5 rounded-full uppercase">Map View</span>
      </div>
    </div>
  );
}

/* ─── Stars ────────────────────────────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(rating) ? "text-[#C9A84C] fill-[#C9A84C]" : "text-[#1a2a3a]"}`} />
      ))}
    </div>
  );
}

/* ─── Spec pill ────────────────────────────────────────────────────────────── */
function SpecPill({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 bg-white/4 border border-[#C9A84C]/12 rounded-2xl px-4 py-3 hover:border-[#C9A84C]/30 transition-colors">
      <div className="h-8 w-8 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
        <Icon className="h-4 w-4 text-[#C9A84C]" />
      </div>
      <div className="text-white font-bold text-sm">{value}</div>
      <div className="text-[#3a5070] text-[10px] uppercase tracking-wider">{label}</div>
    </div>
  );
}

/* ─── Saved state (localStorage) ──────────────────────────────────────────── */
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

/* ─── Main ─────────────────────────────────────────────────────────────────── */
export default function PropertyDetail() {
  const params   = useParams<{ id: string }>();
  const id       = Number(params.id);
  const { saved, toggle: toggleSave } = useSaved(id);

  const { data: property, isLoading } = useGetProperty(id, {
    query: { enabled: !!id, queryKey: getGetPropertyQueryKey(id) },
  });

  const waNum  = property?.whatsappNumber || property?.ownerPhone;
  const waText = `Hi, I saw your property ${property?.title ?? ""} on Orakzai Properties and I am interested.`;
  const waLink = waNum ? `https://wa.me/${waNum.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waText)}` : null;
  const catStyle = CAT_STYLE[property?.category ?? ""] ?? CAT_STYLE.buy;
  const TypeIcon = TYPE_ICON[property?.type ?? ""] ?? Home;

  const handleShare = async () => {
    const url  = window.location.href;
    const text = `Check out this property on Orakzai Properties: ${property?.title}`;
    if (navigator.share) {
      try { await navigator.share({ title: property?.title, text, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  /* ── loading skeleton ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070e1a]">
        <Navbar />
        <div className="h-[520px] bg-white/4 animate-pulse" />
        <div className="max-w-5xl mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-10 bg-white/4 rounded-xl animate-pulse w-3/4" />
            <div className="h-5 bg-white/4 rounded animate-pulse w-1/2" />
            <div className="h-36 bg-white/4 rounded-2xl animate-pulse" />
          </div>
          <div className="h-80 bg-white/4 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#070e1a] flex items-center justify-center flex-col gap-4">
        <Navbar />
        <div className="text-center mt-24">
          <h2 className="font-serif text-2xl text-white mb-4">Property Not Found</h2>
          <Link href={`${basePath}/browse`}>
            <button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#080f1a] font-bold px-6 py-2.5 rounded-xl transition-colors">
              Back to Marketplace
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const specItems = [
    ...(property.beds   ? [{ icon: Bed,       label: "Bedrooms",  value: property.beds   }] : []),
    ...(property.baths  ? [{ icon: Bath,       label: "Bathrooms", value: property.baths  }] : []),
    ...(property.areaSqft ? [{ icon: Maximize2, label: "Sq. Ft.",  value: property.areaSqft.toLocaleString() }] : []),
    { icon: TypeIcon,   label: "Type",      value: property.type.charAt(0).toUpperCase() + property.type.slice(1) },
    { icon: MapPin,     label: "City",      value: property.city },
  ];

  return (
    <div className="min-h-screen bg-[#070e1a] text-foreground">
      {/* ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#C9A84C]/4 blur-[130px]" />
        <div className="absolute bottom-1/3 left-0 w-72 h-72 rounded-full bg-[#1e3a8a]/6 blur-[100px]" />
      </div>

      <Navbar />

      {/* ── Sticky transparent header ── */}
      <div className="sticky top-14 z-50 flex items-center justify-between px-4 py-2.5
        bg-[#070e1a]/85 backdrop-blur-xl border-b border-[#C9A84C]/12">
        <Link href={`${basePath}/browse`}>
          <button className="flex items-center gap-2 text-[#C9A84C] hover:text-white text-sm font-semibold transition-colors group">
            <div className="h-8 w-8 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 flex items-center justify-center group-hover:bg-[#C9A84C]/20 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="hidden sm:block">Back to Marketplace</span>
          </button>
        </Link>

        <div className="flex items-center gap-2">
          {/* Save */}
          <motion.button
            onClick={toggleSave}
            whileTap={{ scale: 0.88 }}
            data-testid="button-save"
            title={saved ? "Saved to Portfolio" : "Save Property"}
            className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${
              saved
                ? "bg-rose-500/15 border-rose-500/40 text-rose-400"
                : "bg-white/5 border-white/10 text-[#6a7f99] hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
            }`}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-rose-400" : ""}`} />
          </motion.button>

          {/* Share */}
          <button
            onClick={handleShare}
            data-testid="button-share"
            title="Share Property"
            className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 text-[#6a7f99] hover:border-[#C9A84C]/40 hover:text-[#C9A84C] flex items-center justify-center transition-all"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Media Gallery ── */}
      <Gallery images={property.images ?? []} title={property.title} />

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-6 pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title block */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {/* badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${catStyle.pill}`}>
                  {catStyle.name}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] bg-white/5 border border-white/10 text-[#6a7f99] px-2.5 py-1 rounded-full capitalize">
                  <TypeIcon className="h-3 w-3" /> {property.type}
                </span>
                {property.isVerified && (
                  <span className="flex items-center gap-1.5 text-[11px] bg-[#C9A84C]/10 border border-[#C9A84C]/35 text-[#C9A84C] px-2.5 py-1 rounded-full font-bold">
                    <ShieldCheck className="h-3.5 w-3.5" /> Sovereign Verified
                  </span>
                )}
              </div>

              <h1 className="font-serif text-2xl md:text-[2rem] font-bold text-white leading-tight mb-2">
                {property.title}
              </h1>
              <div className="flex items-center gap-1.5 text-[#4a6080] text-sm">
                <MapPin className="h-4 w-4 text-[#C9A84C]/60 flex-shrink-0" />
                <span>{property.area ? `${property.area}, ` : ""}{property.city}</span>
              </div>
            </motion.div>

            {/* Price card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
              className="relative overflow-hidden rounded-2xl border border-[#C9A84C]/25 bg-gradient-to-br from-[#0e1e10] to-[#080f1a] p-5"
            >
              <div className="absolute inset-0 opacity-20"
                style={{ background: "radial-gradient(ellipse at 0% 50%, rgba(201,168,76,0.25) 0%, transparent 60%)" }} />
              <div className="relative">
                <div className="text-[#4a6080] text-xs uppercase tracking-widest font-semibold mb-1">Listed Price</div>
                <div className="font-serif text-4xl md:text-5xl font-bold text-[#C9A84C] leading-none tracking-tight">
                  {formatPrice(Number(property.price))}
                </div>
                {property.areaSqft && (
                  <div className="text-[#3a5070] text-xs mt-2">
                    ≈ PKR {Math.round(Number(property.price) / property.areaSqft).toLocaleString()} / sq. ft.
                  </div>
                )}
                {property.isVerified && (
                  <div className="mt-3 flex items-center gap-1.5 text-[#C9A84C]/70 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Price verified by Orakzai Properties team
                  </div>
                )}
              </div>
            </motion.div>

            {/* Specs grid — glassmorphic */}
            {specItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 backdrop-blur-md p-5"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)" }}
              >
                <div className="absolute inset-0 rounded-2xl"
                  style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 60%)" }} />
                <h3 className="font-serif text-base font-bold text-white mb-4 relative">Property Highlights</h3>
                <div className={`grid grid-cols-3 sm:grid-cols-${Math.min(specItems.length, 5)} gap-3 relative`}>
                  {specItems.map(s => (
                    <SpecPill key={s.label} icon={s.icon} label={s.label} value={s.value} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
              className="rounded-2xl border border-white/6 bg-gradient-to-b from-[#0d1e30] to-[#080f1a] p-6"
            >
              <h3 className="font-serif text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#C9A84C]" />
                About This Property
              </h3>
              <p className="text-[#6a7f99] text-sm leading-relaxed whitespace-pre-line">{property.description}</p>

              {/* spec table */}
              <div className="mt-5 pt-5 border-t border-white/5 grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  { label: "Category",   value: catStyle.name },
                  { label: "Type",       value: property.type.charAt(0).toUpperCase() + property.type.slice(1) },
                  { label: "City",       value: property.city },
                  { label: "Area",       value: property.area || "N/A" },
                  { label: "Listed",     value: new Date(property.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" }) },
                  { label: "Property ID",value: `#${String(property.id).padStart(5, "0")}` },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1 border-b border-white/4">
                    <span className="text-[#3a5070] text-xs uppercase tracking-wider">{row.label}</span>
                    <span className="text-[#c8d8e8] text-xs font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            >
              <h3 className="font-serif text-lg font-bold text-white mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#C9A84C]" />
                Location
              </h3>
              <MapBlock city={property.city} area={property.area} />
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">
            <div className="sticky top-28">

              {/* Agent / Owner Profile Widget */}
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}
                className="rounded-2xl border border-[#C9A84C]/25 overflow-hidden"
                style={{ background: "linear-gradient(145deg, #0d1e30 0%, #080f1a 100%)" }}
              >
                {/* gold top stripe */}
                <div className="h-1 w-full bg-gradient-to-r from-[#C9A84C]/0 via-[#C9A84C] to-[#C9A84C]/0" />

                <div className="p-5">
                  <div className="text-[#3a5070] text-[10px] font-bold uppercase tracking-widest mb-4">Property Consultant</div>

                  {/* avatar + name */}
                  <div className="flex items-center gap-3 mb-4">
                    {property.ownerAvatar ? (
                      <img src={property.ownerAvatar} alt={property.ownerName ?? "Agent"}
                        className="h-14 w-14 rounded-2xl object-cover border-2 border-[#C9A84C]/30" />
                    ) : (
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#C9A84C] font-serif text-xl font-bold">
                          {(property.ownerName ?? "O")[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-white font-semibold text-sm">{property.ownerName ?? "Orakzai Agent"}</div>
                      <div className="text-[#3a5070] text-xs mt-0.5">Verified Consultant</div>

                      {/* Trust Rating */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Stars rating={property.ownerRating ? Number(property.ownerRating) : 4.8} />
                        <span className="text-[#C9A84C] text-xs font-bold">
                          {property.ownerRating ? Number(property.ownerRating).toFixed(1) : "4.8"}
                        </span>
                        <span className="text-[#2a3a50] text-[10px]">Sovereign Trust</span>
                      </div>
                    </div>
                  </div>

                  {/* badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="flex items-center gap-1 text-[9px] bg-[#C9A84C]/8 border border-[#C9A84C]/20 text-[#C9A84C] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      <CheckCircle2 className="h-2.5 w-2.5" /> ID Verified
                    </span>
                    <span className="flex items-center gap-1 text-[9px] bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      <ShieldCheck className="h-2.5 w-2.5" /> Trusted Agent
                    </span>
                  </div>

                  {/* CTA buttons */}
                  <div className="space-y-2.5">
                    {property.ownerPhone && (
                      <a href={`tel:${property.ownerPhone}`} data-testid="link-call-agent">
                        <button className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border border-white/10 bg-white/5 text-[#e8edf5] hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/5 font-semibold text-sm transition-all">
                          <Phone className="h-4 w-4 text-[#C9A84C]" />
                          {property.ownerPhone}
                        </button>
                      </a>
                    )}
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer" data-testid="link-whatsapp">
                        <button className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl bg-[#25D366] hover:bg-[#20c55a] text-white font-bold text-sm shadow-lg shadow-[#25D366]/15 transition-all">
                          <MessageCircle className="h-4.5 w-4.5" />
                          WhatsApp for Inquiry
                        </button>
                      </a>
                    )}
                  </div>

                  {/* pre-fill preview */}
                  {waLink && (
                    <div className="mt-3 rounded-xl bg-[#C9A84C]/5 border border-[#C9A84C]/12 p-3">
                      <p className="text-[#3a5070] text-[10px] mb-1">Pre-filled message:</p>
                      <p className="text-[#C9A84C] text-[11px] italic leading-relaxed">"{waText}"</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Quick stats card */}
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24 }}
                className="rounded-2xl border border-white/6 bg-gradient-to-b from-[#0d1e30] to-[#080f1a] p-4 space-y-3 mt-4"
              >
                {[
                  { label: "Property ID",  value: `#${String(property.id).padStart(5, "0")}` },
                  { label: "Listed On",    value: new Date(property.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" }) },
                  { label: "Status",       value: catStyle.name, badge: true, color: catStyle.pill },
                  ...(property.isVerified ? [{ label: "Verification", value: "Sovereign Verified", verified: true }] : []),
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-1 border-b border-white/4 last:border-0">
                    <span className="text-[#3a5070] text-xs">{row.label}</span>
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

            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          FLOATING ACTION BAR — sticky bottom, always visible on mobile
      ══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 24 }}
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe-area-inset-bottom"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-[#C9A84C]/30 shadow-2xl shadow-[#000]/60"
            style={{ background: "linear-gradient(135deg, rgba(10,18,32,0.97) 0%, rgba(7,14,26,0.98) 100%)" }}>
            {/* gold top accent line */}
            <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />

            <div className="grid grid-cols-4 gap-0 px-2 py-3">
              {/* CALL */}
              {property.ownerPhone ? (
                <a href={`tel:${property.ownerPhone}`} data-testid="fab-call"
                  className="flex flex-col items-center gap-1.5 rounded-xl py-2 hover:bg-white/5 transition-colors group">
                  <div className="h-9 w-9 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 flex items-center justify-center group-hover:bg-[#C9A84C]/20 transition-colors">
                    <Phone className="h-4 w-4 text-[#C9A84C]" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#6a7f99] group-hover:text-[#C9A84C] transition-colors uppercase tracking-wide">Call</span>
                </a>
              ) : (
                <div className="flex flex-col items-center gap-1.5 rounded-xl py-2 opacity-30 cursor-not-allowed">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-[#4a6080]" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#3a5070] uppercase tracking-wide">Call</span>
                </div>
              )}

              {/* WHATSAPP */}
              {waLink ? (
                <a href={waLink} target="_blank" rel="noopener noreferrer" data-testid="fab-whatsapp"
                  className="flex flex-col items-center gap-1.5 rounded-xl py-2 hover:bg-white/5 transition-colors group">
                  <div className="h-9 w-9 rounded-xl bg-[#25D366]/10 border border-[#25D366]/25 flex items-center justify-center group-hover:bg-[#25D366]/20 transition-colors">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#6a7f99] group-hover:text-[#25D366] transition-colors uppercase tracking-wide">Chat</span>
                </a>
              ) : (
                <div className="flex flex-col items-center gap-1.5 rounded-xl py-2 opacity-30 cursor-not-allowed">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-[#4a6080]" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#3a5070] uppercase tracking-wide">Chat</span>
                </div>
              )}

              {/* SAVE */}
              <button onClick={toggleSave} data-testid="fab-save"
                className="flex flex-col items-center gap-1.5 rounded-xl py-2 hover:bg-white/5 transition-colors group">
                <motion.div
                  whileTap={{ scale: 0.8 }}
                  className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${
                    saved
                      ? "bg-rose-500/15 border-rose-500/40"
                      : "bg-white/5 border-white/10 group-hover:bg-rose-500/10 group-hover:border-rose-500/30"
                  }`}
                >
                  <Heart className={`h-4 w-4 transition-colors ${saved ? "text-rose-400 fill-rose-400" : "text-[#4a6080] group-hover:text-rose-400"}`} />
                </motion.div>
                <span className={`text-[10px] font-semibold uppercase tracking-wide transition-colors ${saved ? "text-rose-400" : "text-[#6a7f99] group-hover:text-rose-400"}`}>
                  {saved ? "Saved" : "Save"}
                </span>
              </button>

              {/* SHARE */}
              <button onClick={handleShare} data-testid="fab-share"
                className="flex flex-col items-center gap-1.5 rounded-xl py-2 hover:bg-white/5 transition-colors group">
                <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#C9A84C]/10 group-hover:border-[#C9A84C]/30 transition-all">
                  <Share2 className="h-4 w-4 text-[#4a6080] group-hover:text-[#C9A84C] transition-colors" />
                </div>
                <span className="text-[10px] font-semibold text-[#6a7f99] group-hover:text-[#C9A84C] transition-colors uppercase tracking-wide">Share</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
