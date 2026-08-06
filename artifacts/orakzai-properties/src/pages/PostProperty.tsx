import { useState, useCallback, memo, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, X, ImageIcon, Lock, ChevronRight, ChevronLeft,
  Check, ShieldCheck, Zap, Crown, Star, Sparkles,
  Home, Building2, Layers, ArrowRight, Trophy, Share2,
  BedDouble, Bath, Maximize2, Phone, MessageCircle, User,
  Sofa, Users, Clock, MapPin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Show } from "@/contexts/AuthContext";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

/* ─── Country → City data ─────────────────────────────────────────────── */
const COUNTRY_CITIES: Record<string, string[]> = {
  Pakistan: [
    "Lahore", "Islamabad", "Karachi", "Rawalpindi", "Peshawar", "Faisalabad", "Multan", "Quetta",
    "Gujranwala", "Sialkot", "Bahawalpur", "Sargodha", "Hyderabad", "Sukkur", "Larkana",
    "Mardan", "Abbottabad", "Sahiwal", "Sheikhupura", "Gujrat", "Mirpur AJK", "Muzaffarabad",
    "Dera Ghazi Khan", "Rahim Yar Khan", "Kasur", "Okara", "Mingora", "Nawabshah",
    "Chiniot", "Kamoke", "Mandi Bahauddin", "Jhelum", "Khanewal", "Hafizabad",
    "Kohat", "Attock", "Khushab", "Chakwal", "Mianwali", "Bhakkar",
  ],
  India: [
    "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad",
    "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Coimbatore", "Indore", "Bhopal",
    "Chandigarh", "Ludhiana", "Amritsar", "Gurgaon", "Noida", "Visakhapatnam", "Kochi",
    "Mysore", "Jodhpur", "Vadodara", "Agra", "Meerut", "Nashik", "Faridabad",
    "Ghaziabad", "Patna", "Ranchi", "Raipur", "Bhubaneswar", "Dehradun",
    "Thiruvananthapuram", "Madurai", "Varanasi", "Allahabad", "Srinagar",
  ],
  UAE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain"],
  UK: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Edinburgh", "Liverpool", "Bristol"],
  USA: ["New York", "Los Angeles", "Houston", "Chicago", "Dallas", "Phoenix", "San Antonio", "San Diego"],
  Canada: ["Toronto", "Vancouver", "Calgary", "Ottawa", "Montreal", "Edmonton", "Mississauga"],
  Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Gold Coast"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Tabuk"],
};

const COUNTRIES = Object.keys(COUNTRY_CITIES);

/* ─── Mapbox city coords ─── */
const CITY_COORDS: Record<string, [number, number]> = {
  // Pakistan
  "Lahore": [74.3587, 31.5204], "Islamabad": [73.0479, 33.6844], "Karachi": [67.0099, 24.8607],
  "Rawalpindi": [73.0479, 33.6006], "Peshawar": [71.5249, 34.0150], "Faisalabad": [73.0946, 31.4504],
  "Multan": [71.4743, 30.1978], "Quetta": [66.9750, 30.1798], "Gujranwala": [74.1833, 32.1609],
  "Sialkot": [74.5333, 32.4927], "Bahawalpur": [71.6752, 29.3956], "Sargodha": [72.6748, 32.0836],
  "Hyderabad": [68.3578, 25.3792], "Sukkur": [68.8573, 27.7052], "Larkana": [68.2120, 27.5585],
  "Mardan": [72.0500, 34.2000], "Abbottabad": [73.2215, 34.1463], "Sahiwal": [73.1067, 30.6682],
  "Sheikhupura": [73.9851, 31.7167], "Gujrat": [74.0783, 32.5741], "Mirpur AJK": [73.7500, 33.1450],
  "Muzaffarabad": [73.4715, 34.3700], "Dera Ghazi Khan": [70.6338, 30.0570], "Rahim Yar Khan": [70.2953, 28.4200],
  "Kasur": [74.4500, 31.1200], "Okara": [73.4500, 30.8100], "Mingora": [72.3600, 34.7700],
  "Nawabshah": [68.4100, 26.2400], "Chiniot": [72.9800, 31.7200], "Jhelum": [73.7300, 32.9400],
  // India
  "Mumbai": [72.8777, 19.0760], "Delhi": [77.1025, 28.7041], "Bangalore": [77.5946, 12.9716],
  "Chennai": [80.2707, 13.0827], "Hyderabad": [78.4867, 17.3850], "Pune": [73.8567, 18.5204],
  "Kolkata": [88.3639, 22.5726], "Ahmedabad": [72.5714, 23.0225], "Jaipur": [75.7873, 26.9124],
  "Surat": [72.8311, 21.1702], "Lucknow": [80.9462, 26.8467], "Kanpur": [80.3319, 26.4499],
  "Nagpur": [79.0882, 21.1458], "Coimbatore": [76.9558, 11.0168], "Indore": [75.8577, 22.7196],
  "Bhopal": [77.4126, 23.2599], "Chandigarh": [76.7794, 30.7333], "Ludhiana": [75.8573, 30.9010],
  "Amritsar": [74.8723, 31.6340], "Gurgaon": [77.0266, 28.4595], "Noida": [77.3910, 28.5355],
  "Visakhapatnam": [83.2185, 17.6868], "Kochi": [76.2673, 9.9312], "Mysore": [76.6394, 12.2958],
  "Jodhpur": [73.0243, 26.2389], "Vadodara": [73.1812, 22.3072], "Agra": [78.0081, 27.1767],
  "Meerut": [77.7064, 28.9845], "Nashik": [73.7898, 19.9975], "Faridabad": [77.3178, 28.4089],
  "Ghaziabad": [77.4538, 28.6692], "Patna": [85.1376, 25.5941], "Ranchi": [85.3096, 23.3441],
  "Dehradun": [78.0322, 30.3165], "Srinagar": [74.7973, 34.0837],
  // UAE
  "Dubai": [55.2708, 25.2048], "Abu Dhabi": [54.3773, 24.4539], "Sharjah": [55.3819, 25.3463],
  "Ajman": [55.4354, 25.4052], "Ras Al Khaimah": [55.9432, 25.7895], "Fujairah": [56.3277, 25.1288],
  "Umm Al Quwain": [55.5550, 25.5650], "Al Ain": [55.7550, 24.2075],
  // UK
  "London": [-0.1276, 51.5074], "Manchester": [-2.2426, 53.4808], "Birmingham": [-1.8904, 52.4862],
  "Leeds": [-1.5491, 53.8008], "Glasgow": [-4.2518, 55.8642], "Edinburgh": [-3.1883, 55.9533],
  // USA
  "New York": [-74.0060, 40.7128], "Los Angeles": [-118.2437, 34.0522], "Houston": [-95.3698, 29.7604],
  "Chicago": [-87.6298, 41.8781], "Dallas": [-96.7969, 32.7767],
  // Canada
  "Toronto": [-79.3832, 43.6532], "Vancouver": [-123.1216, 49.2827], "Calgary": [-114.0719, 51.0447],
  "Ottawa": [-75.6972, 45.4215], "Montreal": [-73.5673, 45.5017],
  // Australia
  "Sydney": [151.2093, -33.8688], "Melbourne": [144.9631, -37.8136], "Brisbane": [153.0251, -27.4698],
  "Perth": [115.8605, -31.9505], "Adelaide": [138.6007, -34.9285],
  // Saudi Arabia
  "Riyadh": [46.6753, 24.7136], "Jeddah": [39.1925, 21.4858], "Mecca": [39.8579, 21.3891],
  "Medina": [39.6142, 24.5247], "Dammam": [50.1033, 26.3927],
};

/* ─── Mapbox Preview with geocoding ────────────────────────────────────── */
const MapPreview = memo(function MapPreview({
  city, area, onCoordsFound,
}: { city: string; area: string; onCoordsFound?: (lng: number, lat: number) => void }) {
  const [lng, setLng] = useState<number | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocoded, setGeocoded] = useState(false);
  const [manualLng, setManualLng] = useState("");
  const [manualLat, setManualLat] = useState("");
  const [showManual, setShowManual] = useState(false);
  const token = import.meta.env.VITE_MAPBOX_PUBLIC_KEY;

  /* When area or city changes, geocode the address */
  useEffect(() => {
    if (!city) return;
    const cityCoords = CITY_COORDS[city] ?? [74.3587, 31.5204];
    if (!token || !area.trim()) {
      setLng(cityCoords[0]);
      setLat(cityCoords[1]);
      setGeocoded(false);
      onCoordsFound?.(cityCoords[0], cityCoords[1]);
      return;
    }
    setGeocoding(true);
    const query = encodeURIComponent(`${area}, ${city}`);
    const proximity = `${cityCoords[0]},${cityCoords[1]}`;
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?proximity=${proximity}&limit=1&access_token=${token}`)
      .then(r => r.json())
      .then(d => {
        const feat = d.features?.[0];
        if (feat) {
          const [fLng, fLat] = feat.center;
          setLng(fLng); setLat(fLat); setGeocoded(true);
          onCoordsFound?.(fLng, fLat);
        } else {
          setLng(cityCoords[0]); setLat(cityCoords[1]); setGeocoded(false);
          onCoordsFound?.(cityCoords[0], cityCoords[1]);
        }
      })
      .catch(() => {
        const [cLng, cLat] = cityCoords;
        setLng(cLng); setLat(cLat); setGeocoded(false);
        onCoordsFound?.(cLng, cLat);
      })
      .finally(() => setGeocoding(false));
  }, [city, area, token]);

  const applyManual = () => {
    const mLng = parseFloat(manualLng);
    const mLat = parseFloat(manualLat);
    if (!isNaN(mLng) && !isNaN(mLat)) {
      setLng(mLng); setLat(mLat); setGeocoded(true);
      onCoordsFound?.(mLng, mLat);
    }
  };

  if (!city) return null;
  const displayLng = lng ?? (CITY_COORDS[city] ?? [74.3587, 31.5204])[0];
  const displayLat = lat ?? (CITY_COORDS[city] ?? [74.3587, 31.5204])[1];
  const label = area ? `${area}, ${city}` : city;
  const mapUrl = token
    ? `https://api.mapbox.com/styles/v1/faisalorakzai/cmp6m332s001a01s93rqk58ew/static/pin-s+F3BA2F(${displayLng},${displayLat})/${displayLng},${displayLat},14,0/600x220@2x?access_token=${token}`
    : null;

  return (
    <div className="space-y-2">
      {mapUrl ? (
        <div className="rounded-2xl overflow-hidden border border-[#C9A84C]/25 relative" style={{ height: 180 }}>
          {geocoding && (
            <div className="absolute inset-0 z-10 bg-[#040b14]/80 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
              <span className="text-[#C9A84C] text-xs">Finding location…</span>
            </div>
          )}
          <img src={mapUrl} alt={label} className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2">
            {geocoded ? (
              <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                📍 Exact location found
              </span>
            ) : (
              <span className="text-[9px] bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] px-2 py-0.5 rounded-full font-bold">
                City centre (approx)
              </span>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-[#040b14]/90 to-transparent flex items-center gap-2">
            <MapPin className="h-3 w-3 text-[#C9A84C] flex-shrink-0" />
            <span className="text-white/80 text-xs font-medium">{label}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#C9A84C]/20 bg-[#0a1628] p-4 text-center text-[#4a6080] text-xs">
          Map preview requires <code className="text-[#C9A84C]/70">VITE_MAPBOX_PUBLIC_KEY</code>
        </div>
      )}
      {/* Manual pin override if geocoding didn't find exact location */}
      {!geocoded && !geocoding && city && (
        <div>
          <button type="button" onClick={() => setShowManual(v => !v)}
            className="text-[10px] text-[#C9A84C]/70 hover:text-[#C9A84C] underline transition-colors">
            {showManual ? "Hide" : "📌 Set exact coordinates manually"}
          </button>
          {showManual && (
            <div className="mt-2 flex gap-2 items-end">
              <div className="flex-1">
                <div className="text-[9px] text-[#4a6080] mb-1">Longitude</div>
                <input value={manualLng} onChange={e => setManualLng(e.target.value)}
                  placeholder="e.g. 74.3587" className="bg-[#070e1a] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 text-xs w-full outline-none focus:border-[#C9A84C]/50" />
              </div>
              <div className="flex-1">
                <div className="text-[9px] text-[#4a6080] mb-1">Latitude</div>
                <input value={manualLat} onChange={e => setManualLat(e.target.value)}
                  placeholder="e.g. 31.5204" className="bg-[#070e1a] border border-[#1e3a5f] text-white rounded-lg px-3 py-2 text-xs w-full outline-none focus:border-[#C9A84C]/50" />
              </div>
              <button type="button" onClick={applyManual}
                className="px-3 py-2 bg-[#C9A84C] text-[#040b14] text-xs font-bold rounded-lg hover:bg-[#e8c060] transition-colors">
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

import { Link } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/* ── constants ──────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { value: "buy",  label: "Buy",  desc: "Property for sale",   color: "border-emerald-500/40 bg-emerald-500/8 text-emerald-300", active: "border-emerald-400 bg-emerald-500/20 shadow-emerald-500/20" },
  { value: "sell", label: "Sell", desc: "Selling my property", color: "border-blue-500/40 bg-blue-500/8 text-blue-300",           active: "border-blue-400 bg-blue-500/20 shadow-blue-500/20" },
  { value: "rent", label: "Rent", desc: "Available for rent",  color: "border-violet-500/40 bg-violet-500/8 text-violet-300",     active: "border-violet-400 bg-violet-500/20 shadow-violet-500/20" },
];
const TYPES = [
  { value: "house",      label: "House",      icon: Home,      desc: "Residential building" },
  { value: "commercial", label: "Commercial", icon: Building2, desc: "Business / offices" },
  { value: "plot",       label: "Plot",       icon: Layers,    desc: "Land / plot" },
];
const BOOST_TIERS = [
  {
    id: "silver",
    label: "Silver Boost",
    price: "$5",
    pkr: "PKR 1,400",
    icon: Zap,
    iconColor: "text-slate-300",
    border: "border-slate-400/30",
    active: "border-slate-300 bg-slate-400/10",
    bg: "from-slate-800/40 to-slate-900/40",
    perks: ["Top of search results for 3 days", "Highlighted listing card", "Priority indexing"],
  },
  {
    id: "gold",
    label: "Gold Boost",
    price: "$20",
    pkr: "PKR 5,600",
    icon: Star,
    iconColor: "text-[#C9A84C]",
    border: "border-[#C9A84C]/40",
    active: "border-[#C9A84C] bg-[#C9A84C]/10",
    bg: "from-[#1a140a]/60 to-[#0f0a00]/60",
    badge: "POPULAR",
    perks: ["Featured on Home Dashboard", "Social media mention", "Top placement for 7 days"],
  },
  {
    id: "sovereign",
    label: "Sovereign Spotlight",
    price: "$50",
    pkr: "PKR 14,000",
    icon: Crown,
    iconColor: "text-amber-300",
    border: "border-amber-400/40",
    active: "border-amber-300 bg-amber-400/10",
    bg: "from-[#1a1000]/60 to-[#0d0800]/60",
    badge: "PREMIUM",
    perks: ["24/7 top visibility", "Chairman's Choice badge", "Homepage feature slot", "Weekly email blast"],
  },
];
const STEPS = [
  { num: 1, label: "Basic Info" },
  { num: 2, label: "Media" },
  { num: 3, label: "Details" },
];

/* ── Gold input helper ──────────────────────────────────────────────────── */
const goldInput = "bg-[#070e1a] border border-[#1e3a5f] text-[#f1f5f9] placeholder:text-[#2a3a50] rounded-xl px-4 py-3 text-sm w-full transition-all duration-200 outline-none focus:border-[#C9A84C]/70 focus:ring-2 focus:ring-[#C9A84C]/15 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)]";
const goldSelect = `${goldInput} appearance-none cursor-pointer`;

/* ── Progress Bar ────────────────────────────────────────────────────────── */
function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 relative">
        <div className="absolute left-0 right-0 top-4 h-px bg-[#1e3a5f] z-0" />
        <div className="absolute left-0 top-4 h-px bg-gradient-to-r from-[#C9A84C] to-[#C9A84C]/50 z-0 transition-all duration-500"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
        {STEPS.map(s => (
          <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
            <motion.div
              animate={s.num <= step ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all border-2 ${
                s.num < step  ? "bg-[#C9A84C] border-[#C9A84C] text-[#080f1a] shadow-lg shadow-[#C9A84C]/30" :
                s.num === step ? "bg-[#0d1929] border-[#C9A84C] text-[#C9A84C] shadow-lg shadow-[#C9A84C]/20" :
                                 "bg-[#0d1929] border-[#1e3a5f] text-[#3a5070]"
              }`}
            >
              {s.num < step ? <Check className="h-3.5 w-3.5" /> : s.num}
            </motion.div>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${s.num === step ? "text-[#C9A84C]" : s.num < step ? "text-[#C9A84C]/60" : "text-[#2a3a50]"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Cloudinary Image Uploader ──────────────────────────────────────────── */
function ImageUploader({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const { toast } = useToast();

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "dvsjiufdv";
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "ml_default";

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("api_key", import.meta.env.VITE_CLOUDINARY_API_KEY ?? "612796494885864");
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();
    return data.secure_url as string;
  };

  const handleFiles = useCallback(async (files: File[]) => {
    if (!CLOUD_NAME) {
      toast({ title: "Cloudinary not configured", description: "Add VITE_CLOUDINARY_CLOUD_NAME to your environment.", variant: "destructive" });
      return;
    }
    const imageFiles = files.filter(f => f.type.startsWith("image/")).slice(0, 8 - images.length);
    if (imageFiles.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(imageFiles.map(uploadToCloudinary));
      onChange([...images, ...urls].slice(0, 8));
      toast({ title: `${urls.length} image${urls.length > 1 ? "s" : ""} uploaded successfully` });
    } catch {
      toast({ title: "Upload failed", description: "Please check your Cloudinary configuration.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [images, onChange, CLOUD_NAME, UPLOAD_PRESET]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed && !images.includes(trimmed)) {
      onChange([...images, trimmed]);
      setUrlInput("");
    }
  };

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {/* drop zone */}
      <label
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden block ${
          dragging ? "border-[#C9A84C] bg-[#C9A84C]/5 shadow-xl shadow-[#C9A84C]/10" : "border-[#C9A84C]/25 bg-[#070e1a] hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/3"
        }`}
        style={{ minHeight: 160 }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFileInput}
          disabled={uploading}
        />
        {/* animated grid background */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "linear-gradient(rgba(201,168,76,1) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,1) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="relative flex flex-col items-center justify-center py-10 px-6 text-center">
          <motion.div animate={dragging || uploading ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            className="h-14 w-14 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 flex items-center justify-center mb-3">
            {uploading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-6 w-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full" />
            ) : (
              <Upload className={`h-6 w-6 ${dragging ? "text-[#C9A84C]" : "text-[#C9A84C]/70"}`} />
            )}
          </motion.div>
          <p className="text-[#f1f5f9] font-semibold text-sm mb-1">
            {uploading ? "Uploading to Cloudinary..." : dragging ? "Drop images here" : "Click to upload or drag & drop"}
          </p>
          <p className="text-[#3a5070] text-xs">PNG, JPG, WEBP · Max 8 images · Uploads to Cloudinary</p>
          {dragging && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 border-2 border-[#C9A84C] rounded-2xl pointer-events-none" />
          )}
        </div>
      </label>

      {/* URL input row */}
      <div className="flex gap-2">
        <input
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addUrl())}
          placeholder="Or paste an image URL and press Enter..."
          className={`${goldInput} flex-1`}
        />
        <button type="button" onClick={addUrl}
          className="h-11 px-4 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/20 font-semibold text-sm transition-all">
          Add
        </button>
      </div>

      {/* previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="relative group rounded-xl overflow-hidden border border-[#C9A84C]/15 aspect-video bg-[#0d1929]">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => remove(i)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-1 left-1 bg-[#080f1a]/80 text-[#C9A84C] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {i + 1}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Boost Popup ─────────────────────────────────────────────────────────── */
function BoostPopup({ onClose, onSkip }: { onClose: () => void; onSkip: () => void }) {
  const [selected, setSelected] = useState<string | null>("gold");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(4,8,16,0.94)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="w-full max-w-xl bg-gradient-to-b from-[#0d1929] to-[#070e1a] border border-[#C9A84C]/25 rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
      >
        <div className="h-1 bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#C9A84C]" />
              <span className="text-[#C9A84C] text-xs font-black uppercase tracking-widest">Boost Your Listing</span>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-xl bg-white/5 text-[#4a6080] hover:text-white flex items-center justify-center transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white mb-1">Get Maximum Visibility</h2>
          <p className="text-[#4a6080] text-sm mb-6">Your listing is live. Boost it now to reach more serious buyers and investors.</p>

          <div className="space-y-3">
            {BOOST_TIERS.map(tier => (
              <button key={tier.id} type="button" onClick={() => setSelected(tier.id)}
                className={`relative w-full text-left rounded-2xl border-2 bg-gradient-to-r p-4 transition-all duration-200 ${tier.bg} ${selected === tier.id ? `${tier.active} shadow-lg` : `${tier.border} hover:border-opacity-60`}`}
              >
                {tier.badge && (
                  <span className="absolute -top-2 right-4 text-[9px] font-black tracking-widest bg-[#C9A84C] text-[#080f1a] px-2 py-0.5 rounded-full uppercase">
                    {tier.badge}
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${tier.border} bg-black/20`}>
                    <tier.icon className={`h-5 w-5 ${tier.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{tier.label}</span>
                      <div className="text-right">
                        <div className={`font-black text-lg leading-none ${tier.iconColor}`}>{tier.price}</div>
                        <div className="text-[#3a5070] text-[10px]">{tier.pkr}</div>
                      </div>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {tier.perks.map(p => (
                        <li key={p} className="flex items-center gap-1.5 text-[11px] text-[#6a7f99]">
                          <Check className="h-2.5 w-2.5 text-[#C9A84C]/70 flex-shrink-0" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {selected === tier.id && (
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${tier.iconColor === "text-[#C9A84C]" ? "bg-[#C9A84C]" : "bg-amber-400"}`}>
                      <Check className="h-3 w-3 text-[#080f1a]" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onSkip}
              className="flex-1 h-12 rounded-xl border border-white/10 text-[#4a6080] hover:text-[#94a3b8] text-sm font-semibold transition-all hover:border-white/20">
              Skip for Now
            </button>
            <button type="button" onClick={onClose}
              className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#080f1a] font-black text-sm shadow-lg shadow-[#C9A84C]/25 hover:shadow-[#C9A84C]/40 transition-all flex items-center justify-center gap-2">
              <Zap className="h-4 w-4" /> Boost with {BOOST_TIERS.find(t => t.id === selected)?.label}
            </button>
          </div>
          <p className="text-[#2a3a50] text-[10px] text-center mt-3">Secure payment · Cancel anytime · Results guaranteed</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Success Screen ─────────────────────────────────────────────────────── */
function SuccessScreen({ propertyId }: { propertyId: number }) {
  const [, setLocation] = useLocation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#070e1a] flex items-center justify-center px-4"
    >
      {[...Array(20)].map((_, i) => (
        <motion.div key={i}
          initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          animate={{ opacity: 0, y: -200 - Math.random() * 200, x: (Math.random() - 0.5) * 400, scale: 0, rotate: Math.random() * 360 }}
          transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.5, ease: "easeOut" }}
          className="fixed pointer-events-none"
          style={{
            left: "50%", top: "60%",
            width: 8 + Math.random() * 8,
            height: 8 + Math.random() * 8,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: ["#C9A84C", "#e8c060", "#fff", "#25D366", "#3b82f6"][Math.floor(Math.random() * 5)],
          }}
        />
      ))}

      <div className="text-center max-w-sm">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
          className="relative inline-block mb-6"
        >
          <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border-2 border-[#C9A84C]/40 flex items-center justify-center mx-auto shadow-2xl shadow-[#C9A84C]/20">
            <Trophy className="h-14 w-14 text-[#C9A84C]" />
          </div>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute inset-0 rounded-3xl border-2 border-dashed border-[#C9A84C]/20" style={{ margin: -8 }} />
          <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            className="absolute inset-0 rounded-3xl border border-[#C9A84C]/10" style={{ margin: -16 }} />
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <motion.div key={i}
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.25 }}
              className="absolute h-2 w-2 rounded-full bg-[#C9A84C]"
              style={{ top: "50%", left: "50%", transform: `rotate(${deg}deg) translateX(60px) translateY(-50%)` }}
            />
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="text-[#C9A84C] text-xs font-black uppercase tracking-widest mb-2">Property Listed Successfully</div>
          <h1 className="font-serif text-3xl font-bold text-white mb-3">Your Property is Live!</h1>
          <p className="text-[#4a6080] text-sm leading-relaxed mb-8">
            Congratulations! Your listing is now visible to thousands of buyers, investors, and renters globally.
          </p>
          <div className="flex flex-col gap-3">
            <Link href={`${basePath}/property/${propertyId}`}>
              <button className="w-full h-12 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#080f1a] font-black shadow-lg shadow-[#C9A84C]/25 hover:shadow-[#C9A84C]/40 transition-all flex items-center justify-center gap-2 text-sm">
                <ArrowRight className="h-4 w-4" /> View My Listing
              </button>
            </Link>
            <div className="flex gap-3">
              <Link href={`${basePath}/my-properties`} className="flex-1">
                <button className="w-full h-11 rounded-xl border border-[#C9A84C]/25 text-[#C9A84C] hover:bg-[#C9A84C]/5 font-semibold text-sm transition-all">
                  My Properties
                </button>
              </Link>
              <button
                onClick={() => navigator.share?.({ title: "Check out my property on Orakzai Properties", url: `${window.location.origin}${basePath}/property/${propertyId}` })}
                className="flex-1 h-11 rounded-xl border border-white/10 text-[#6a7f99] hover:text-white hover:border-white/20 font-semibold text-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Section label ─────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[#3a5070] text-[10px] font-black uppercase tracking-widest mb-2">{children}</div>
  );
}

/* ─── Plan limit gate popup ──────────────────────────────────────────────── */
function UpgradeGate({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-gradient-to-b from-[#0a1628] to-[#060d16] border-2 border-[#C9A84C] rounded-2xl p-8 max-w-sm w-full shadow-[0_0_80px_rgba(201,168,76,0.25)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_30%_at_50%_0%,rgba(201,168,76,0.07),transparent)] rounded-2xl pointer-events-none" />
        <div className="text-center relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-5">
            <Crown className="h-8 w-8 text-[#C9A84C]" />
          </div>
          <h3 className="text-white font-black text-xl mb-2">Listing Limit Reached</h3>
          <p className="text-[#4a6080] text-sm mb-6 leading-relaxed">
            You've used all your free listing slots. Upgrade your plan to post unlimited properties.
          </p>
          <div className="space-y-3">
            <Link href={`${basePath}/pricing`}>
              <button className="w-full h-12 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#080f1a] font-black text-sm flex items-center justify-center gap-2">
                <Crown className="h-4 w-4" /> View Plans & Upgrade
              </button>
            </Link>
            <button onClick={onClose} className="w-full h-9 rounded-xl border border-white/10 text-[#4a6080] hover:text-white text-sm transition-all">
              Maybe Later
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────── */
export default function PostProperty() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step, setStep] = useState(1);
  const [showBoost, setShowBoost] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* form state */
  const [title,        setTitle]        = useState("");
  const [category,     setCategory]     = useState("");
  const [propType,     setPropType]     = useState("");
  const [price,        setPrice]        = useState("");
  const [images,       setImages]       = useState<string[]>([]);
  const [country,      setCountry]      = useState("");
  const [city,         setCity]         = useState("");
  const [area,         setArea]         = useState("");
  const [description,  setDescription]  = useState("");
  const [beds,         setBeds]         = useState("");
  const [baths,        setBaths]        = useState("");
  const [areaSqft,     setAreaSqft]     = useState("");
  const [ownerName,    setOwnerName]    = useState("");
  const [ownerPhone,   setOwnerPhone]   = useState("");
  const [whatsapp,     setWhatsapp]     = useState("");
  const [reqVerify,    setReqVerify]    = useState(false);
  const [furnished,    setFurnished]    = useState("");
  const [occupancy,    setOccupancy]    = useState("");
  const [rentalDur,    setRentalDur]    = useState("");
  /* geocoded map coordinates from MapPreview */
  const [mapLng,       setMapLng]       = useState<number | null>(null);
  const [mapLat,       setMapLat]       = useState<number | null>(null);

  /* cities for selected country */
  const availableCities = country ? (COUNTRY_CITIES[country] ?? []) : [];

  /* when country changes, reset city */
  const handleCountryChange = (c: string) => {
    setCountry(c);
    setCity("");
  };

  /* validate step before advancing */
  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!title.trim() || title.length < 5) e.title = "Title must be at least 5 characters";
      if (!category) e.category = "Select a category";
      if (!propType) e.type = "Select a property type";
      if (!price || isNaN(Number(price)) || Number(price) < 1) e.price = "Enter a valid price";
    }
    if (s === 3) {
      if (!country) e.country = "Select a country";
      if (!city) e.city = "Select a city";
      if (!description.trim() || description.length < 20) e.description = "Description must be at least 20 characters";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => Math.min(s + 1, 3)); };
  const prev = () => { setErrors({}); setStep(s => Math.max(s - 1, 1)); };

  const submit = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    try {
      const priceNum = Number(price);
      const priceLabel = priceNum >= 10000000
        ? `₨ ${(priceNum / 10000000).toFixed(2)} Cr`
        : `₨ ${(priceNum / 100000).toFixed(0)}L`;
      const cityCoords = CITY_COORDS[city] ?? [74.3587, 31.5204];
      const finalLng = mapLng ?? cityCoords[0];
      const finalLat = mapLat ?? cityCoords[1];
      const { data, error } = await supabase.from("properties").insert({
        title, category, type: propType, description,
        price: priceNum, price_label: priceLabel,
        city, country,
        location: area ? `${area}, ${city}, ${country}` : `${city}, ${country}`,
        area_sqft: areaSqft ? Number(areaSqft) : null,
        images, tag: null, tag_color: null,
        owner_name: ownerName || null,
        owner_phone: ownerPhone || null,
        whatsapp_number: whatsapp || ownerPhone || null,
        agent_name: ownerName || null,
        agent_phone: ownerPhone || null,
        agent_whatsapp: whatsapp || ownerPhone || null,
        beds: beds ? Number(beds) : null,
        baths: baths ? Number(baths) : null,
        is_verified: reqVerify,
        is_available: true,
        longitude: finalLng, latitude: finalLat,
        status: "Available",
      }).select("id").single();
      if (error) throw error;
      setSuccessId(data.id);
      setShowBoost(true);
    } catch (err: any) {
      toast({ title: "Failed to publish", description: err?.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishFlow = () => { setShowBoost(false); };

  if (successId !== null && !showBoost) {
    return <SuccessScreen propertyId={successId} />;
  }

  return (
    <div className="min-h-screen bg-[#070e1a] text-foreground">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#C9A84C]/3 blur-[130px]" />
        <div className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full bg-[#1e3a8a]/6 blur-[100px]" />
      </div>

      <Navbar />

      <div className="relative z-10 pt-14 pb-20 px-4 max-w-2xl mx-auto">
        <Show when="signed-out">
          <div className="mt-20 text-center">
            <div className="h-20 w-20 rounded-3xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#C9A84C]/10">
              <Lock className="h-9 w-9 text-[#C9A84C]" />
            </div>
            <h2 className="font-serif text-2xl text-white mb-2">Sign In Required</h2>
            <p className="text-[#4a6080] text-sm mb-6 max-w-xs mx-auto">You must be signed in to post a property listing on Orakzai Properties.</p>
            <Link href={`${basePath}/sign-in`}>
              <button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#080f1a] font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-[#C9A84C]/25">
                Sign In to Continue
              </button>
            </Link>
          </div>
        </Show>

        <Show when="signed-in">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6">

            <div className="mb-6">
              <div className="text-[#C9A84C] text-[10px] font-black tracking-widest uppercase mb-1">List Your Property</div>
              <h1 className="font-serif text-3xl font-bold text-white">Post a Property</h1>
            </div>

            <ProgressBar step={step} />

            <div className="rounded-3xl border border-[#C9A84C]/15 overflow-hidden"
              style={{ background: "linear-gradient(145deg, #0d1929 0%, #080f1a 100%)" }}>
              <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />

              <AnimatePresence mode="wait">

                {/* ═════════════════════ STEP 1: BASIC INFO ═════════════════════ */}
                {step === 1 && (
                  <motion.div key="step1"
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }} className="p-6 md:p-8 space-y-6"
                  >
                    <div>
                      <SectionLabel>Property Title</SectionLabel>
                      <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Luxury 10 Marla House – DHA Phase 6"
                        className={goldInput}
                        data-testid="input-title"
                      />
                      {errors.title && <p className="text-red-400 text-xs mt-1.5">{errors.title}</p>}
                    </div>

                    <div>
                      <SectionLabel>Listing Category</SectionLabel>
                      <div className="grid grid-cols-3 gap-3">
                        {CATEGORIES.map(cat => (
                          <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                            className={`rounded-2xl border-2 p-3 text-left transition-all ${category === cat.value ? `${cat.active} shadow-lg` : "border-white/8 bg-white/3 hover:border-white/20"}`}
                          >
                            <div className={`text-sm font-bold mb-0.5 ${category === cat.value ? cat.color.split(" ").find(c => c.startsWith("text-")) : "text-white"}`}>
                              {cat.label}
                            </div>
                            <div className="text-[10px] text-[#3a5070]">{cat.desc}</div>
                          </button>
                        ))}
                      </div>
                      {errors.category && <p className="text-red-400 text-xs mt-1.5">{errors.category}</p>}
                    </div>

                    <div>
                      <SectionLabel>Property Type</SectionLabel>
                      <div className="grid grid-cols-3 gap-3">
                        {TYPES.map(t => (
                          <button key={t.value} type="button" onClick={() => setPropType(t.value)}
                            className={`rounded-2xl border-2 p-3 text-left transition-all ${propType === t.value ? "border-[#C9A84C] bg-[#C9A84C]/10 shadow-lg shadow-[#C9A84C]/10" : "border-white/8 bg-white/3 hover:border-[#C9A84C]/30"}`}
                          >
                            <t.icon className={`h-5 w-5 mb-1.5 ${propType === t.value ? "text-[#C9A84C]" : "text-[#4a6080]"}`} />
                            <div className={`text-sm font-bold mb-0.5 ${propType === t.value ? "text-[#C9A84C]" : "text-white"}`}>{t.label}</div>
                            <div className="text-[10px] text-[#3a5070]">{t.desc}</div>
                          </button>
                        ))}
                      </div>
                      {errors.type && <p className="text-red-400 text-xs mt-1.5">{errors.type}</p>}
                    </div>

                    <div>
                      <SectionLabel>Price (PKR)</SectionLabel>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A84C] font-bold text-sm pointer-events-none">PKR</span>
                        <input
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          type="number"
                          placeholder="45000000"
                          className={`${goldInput} pl-14`}
                          data-testid="input-price"
                        />
                      </div>
                      {price && !isNaN(Number(price)) && Number(price) > 0 && (
                        <p className="text-[#C9A84C]/70 text-xs mt-1.5 pl-1">
                          {Number(price) >= 10000000 ? `PKR ${(Number(price)/10000000).toFixed(2)} Crore` : Number(price) >= 100000 ? `PKR ${(Number(price)/100000).toFixed(1)} Lakh` : ""}
                        </p>
                      )}
                      {errors.price && <p className="text-red-400 text-xs mt-1.5">{errors.price}</p>}
                    </div>
                  </motion.div>
                )}

                {/* ═════════════════════ STEP 2: MEDIA ══════════════════════════ */}
                {step === 2 && (
                  <motion.div key="step2"
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }} className="p-6 md:p-8 space-y-4"
                  >
                    <div>
                      <h3 className="font-serif text-lg font-bold text-white mb-1">Property Photos</h3>
                      <p className="text-[#3a5070] text-sm mb-5">Great photos dramatically increase buyer interest. Aim for at least 3 high-quality images.</p>
                      <ImageUploader images={images} onChange={setImages} />
                    </div>

                    {images.length === 0 && (
                      <div className="rounded-xl bg-[#C9A84C]/5 border border-[#C9A84C]/15 px-4 py-3 flex items-start gap-2">
                        <ImageIcon className="h-4 w-4 text-[#C9A84C] mt-0.5 flex-shrink-0" />
                        <p className="text-[#6a7f99] text-xs leading-relaxed">
                          You can skip images for now and add them later from My Properties. Listings with photos receive <span className="text-[#C9A84C] font-semibold">12× more views.</span>
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ═════════════════════ STEP 3: DETAILS ══════════════════════ */}
                {step === 3 && (
                  <motion.div key="step3"
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }} className="p-6 md:p-8 space-y-6"
                  >
                    {/* ── Country → City flow ── */}
                    <div className="space-y-3">
                      {/* Country */}
                      <div>
                        <SectionLabel>Country</SectionLabel>
                        <select
                          value={country}
                          onChange={e => handleCountryChange(e.target.value)}
                          className={goldSelect}
                          data-testid="select-country"
                        >
                          <option value="">Select Country</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {errors.country && <p className="text-red-400 text-xs mt-1.5">{errors.country}</p>}
                      </div>

                      {/* City + Area — only shown after country selected */}
                      <div className={`grid grid-cols-2 gap-3 transition-all duration-300 ${country ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                        <div>
                          <SectionLabel>City</SectionLabel>
                          <select
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            className={goldSelect}
                            disabled={!country}
                            data-testid="select-city"
                          >
                            <option value="">{country ? "Select City" : "Select country first"}</option>
                            {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          {errors.city && <p className="text-red-400 text-xs mt-1.5">{errors.city}</p>}
                        </div>
                        <div>
                          <SectionLabel>Area / Sector <span className="text-[#1e3a5f] normal-case">(optional)</span></SectionLabel>
                          <input
                            value={area}
                            onChange={e => setArea(e.target.value)}
                            placeholder="e.g. DHA Phase 6"
                            className={goldInput}
                            data-testid="input-area"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mapbox live preview with geocoding */}
                    {city && <MapPreview city={city} area={area} onCoordsFound={(lng, lat) => { setMapLng(lng); setMapLat(lat); }} />}

                    {/* specs */}
                    <div>
                      <SectionLabel>Specifications <span className="text-[#1e3a5f] normal-case">(optional)</span></SectionLabel>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="relative">
                          <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C9A84C]/50 pointer-events-none" />
                          <input value={beds} onChange={e => setBeds(e.target.value)} type="number" min="0"
                            placeholder="Beds" className={`${goldInput} pl-9`} />
                        </div>
                        <div className="relative">
                          <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C9A84C]/50 pointer-events-none" />
                          <input value={baths} onChange={e => setBaths(e.target.value)} type="number" min="0"
                            placeholder="Baths" className={`${goldInput} pl-9`} />
                        </div>
                        <div className="relative">
                          <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C9A84C]/50 pointer-events-none" />
                          <input value={areaSqft} onChange={e => setAreaSqft(e.target.value)} type="number" min="0"
                            placeholder="Sq. Ft." className={`${goldInput} pl-9`} />
                        </div>
                      </div>
                    </div>

                    {/* description */}
                    <div>
                      <SectionLabel>Description</SectionLabel>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Describe the property in detail — size, features, location advantages, nearby landmarks..."
                        rows={5}
                        className={`${goldInput} resize-none`}
                        data-testid="input-description"
                      />
                      <div className="flex justify-between mt-1">
                        {errors.description ? <p className="text-red-400 text-xs">{errors.description}</p> : <span />}
                        <span className={`text-xs ${description.length >= 20 ? "text-[#C9A84C]/60" : "text-[#3a5070]"}`}>{description.length} chars</span>
                      </div>
                    </div>

                    {/* contact */}
                    <div>
                      <SectionLabel>Contact Details</SectionLabel>
                      <div className="space-y-3">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C9A84C]/50 pointer-events-none" />
                          <input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Your name / agency name"
                            className={`${goldInput} pl-9`} data-testid="input-owner-name" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C9A84C]/50 pointer-events-none" />
                            <input value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} placeholder="+92 300 1234567"
                              className={`${goldInput} pl-9`} data-testid="input-phone" />
                          </div>
                          <div className="relative">
                            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#25D366]/50 pointer-events-none" />
                            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="WhatsApp (if different)"
                              className={`${goldInput} pl-9`} data-testid="input-whatsapp" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Rental-only fields ── */}
                    <AnimatePresence>
                      {category === "rent" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="rounded-2xl border-2 border-violet-500/25 bg-violet-500/4 p-5 space-y-5">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="h-1 flex-1 bg-violet-500/20 rounded" />
                              <span className="text-violet-400 text-[9px] font-black uppercase tracking-widest">Rental Details</span>
                              <div className="h-1 flex-1 bg-violet-500/20 rounded" />
                            </div>

                            <div>
                              <SectionLabel><span className="flex items-center gap-1.5"><Sofa className="h-3 w-3 text-violet-400" /> Furnished Status <span className="text-[#1e3a5f] normal-case">(optional)</span></span></SectionLabel>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { value: "fully_furnished",  label: "Fully Furnished" },
                                  { value: "semi_furnished",   label: "Semi-Furnished"  },
                                  { value: "unfurnished",      label: "Unfurnished"     },
                                ].map(opt => (
                                  <button key={opt.value} type="button" onClick={() => setFurnished(furnished === opt.value ? "" : opt.value)}
                                    className={`text-xs px-4 py-2 rounded-xl border-2 font-semibold transition-all ${furnished === opt.value ? "border-violet-400 bg-violet-500/20 text-violet-200" : "border-white/8 text-[#4a6080] hover:border-violet-500/30 hover:text-violet-300"}`}>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <SectionLabel><span className="flex items-center gap-1.5"><Users className="h-3 w-3 text-violet-400" /> Occupancy Type <span className="text-[#1e3a5f] normal-case">(optional)</span></span></SectionLabel>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { value: "family",            label: "Family"           },
                                  { value: "bachelor",          label: "Bachelor"         },
                                  { value: "office_commercial", label: "Office/Commercial"},
                                ].map(opt => (
                                  <button key={opt.value} type="button" onClick={() => setOccupancy(occupancy === opt.value ? "" : opt.value)}
                                    className={`text-xs px-4 py-2 rounded-xl border-2 font-semibold transition-all ${occupancy === opt.value ? "border-violet-400 bg-violet-500/20 text-violet-200" : "border-white/8 text-[#4a6080] hover:border-violet-500/30 hover:text-violet-300"}`}>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <SectionLabel><span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-violet-400" /> Duration Preference <span className="text-[#1e3a5f] normal-case">(optional)</span></span></SectionLabel>
                              <div className="flex gap-2">
                                {[
                                  { value: "short_term", label: "Short-term (under 1 year)" },
                                  { value: "long_term",  label: "Long-term (1 year+)"        },
                                ].map(opt => (
                                  <button key={opt.value} type="button" onClick={() => setRentalDur(rentalDur === opt.value ? "" : opt.value)}
                                    className={`flex-1 text-xs px-3 py-2 rounded-xl border-2 font-semibold transition-all ${rentalDur === opt.value ? "border-violet-400 bg-violet-500/20 text-violet-200" : "border-white/8 text-[#4a6080] hover:border-violet-500/30 hover:text-violet-300"}`}>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ── Sovereign Verification toggle ── */}
                    <div className={`rounded-2xl border-2 p-4 transition-all ${reqVerify ? "border-[#C9A84C]/50 bg-[#C9A84C]/5" : "border-[#1e3a5f] bg-white/2"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${reqVerify ? "bg-[#C9A84C]/15 border-[#C9A84C]/30" : "bg-white/5 border-white/10"} border`}>
                            <ShieldCheck className={`h-5 w-5 ${reqVerify ? "text-[#C9A84C]" : "text-[#3a5070]"}`} />
                          </div>
                          <div>
                            <div className={`font-bold text-sm mb-0.5 ${reqVerify ? "text-[#C9A84C]" : "text-white"}`}>
                              Request Orakzai Verification Badge
                            </div>
                            <p className="text-[#3a5070] text-xs leading-relaxed">
                              Get the <span className="text-[#C9A84C] font-semibold">Sovereign Verified</span> trust seal after a brief document review. Builds buyer confidence and increases inquiries by up to 3×.
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setReqVerify(v => !v)} data-testid="toggle-verify"
                          className={`flex-shrink-0 h-6 w-11 rounded-full border-2 transition-all relative ${reqVerify ? "bg-[#C9A84C] border-[#C9A84C]" : "bg-[#0d1929] border-[#1e3a5f]"}`}>
                          <motion.div
                            animate={{ x: reqVerify ? 20 : 2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md"
                          />
                        </button>
                      </div>
                      {reqVerify && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t border-[#C9A84C]/20">
                          <p className="text-[#C9A84C]/70 text-xs leading-relaxed">
                            Our team will contact you within 24 hours to begin the verification process. A nominal fee of <span className="text-[#C9A84C] font-bold">PKR 2,500</span> covers document verification and the permanent trust seal on your listing.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Navigation footer ── */}
              <div className="px-6 md:px-8 pb-6 pt-2 border-t border-white/5 flex items-center justify-between gap-3">
                {step > 1 ? (
                  <button type="button" onClick={prev}
                    className="flex items-center gap-1.5 h-11 px-4 rounded-xl border border-white/10 text-[#6a7f99] hover:text-white hover:border-white/20 font-semibold text-sm transition-all">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                ) : <div />}

                {step < 3 ? (
                  <button type="button" onClick={next}
                    className="flex items-center gap-1.5 h-11 px-6 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#080f1a] font-black text-sm shadow-lg shadow-[#C9A84C]/20 hover:shadow-[#C9A84C]/35 transition-all">
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={isSubmitting}
                    data-testid="button-submit-property"
                    className="flex items-center gap-2 h-11 px-8 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#080f1a] font-black text-sm shadow-lg shadow-[#C9A84C]/25 hover:shadow-[#C9A84C]/40 transition-all disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="h-4 w-4 border-2 border-[#080f1a]/30 border-t-[#080f1a] rounded-full" /> Publishing...</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Publish Listing</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </Show>
      </div>

      <AnimatePresence>
        {showBoost && (
          <BoostPopup onClose={finishFlow} onSkip={finishFlow} />
        )}
      </AnimatePresence>
    </div>
  );
}
