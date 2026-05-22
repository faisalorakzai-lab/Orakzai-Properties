import { useState, useMemo, useEffect, useRef, useCallback } from "react";
  import { useLocation } from "wouter";
  import { motion, AnimatePresence } from "framer-motion";
  import {
    Search, Bell, User, ChevronDown, Plus, LayoutList, Home as HomeIcon,
    Building2, KeyRound, BarChart3, HardHat, MapPin, TrendingUp, TrendingDown,
    Heart, ArrowRight, ShieldCheck, Bed, Bath, Maximize2, X, Mic, Sparkles,
    Globe, Activity, DollarSign, Layers, Star, ChevronRight, Wallet,
    RefreshCw, Lock, Map, Brain, BarChart2, Users, Award, Target,
  } from "lucide-react";
  import { useUser } from "@/contexts/AuthContext";
  import { useKYCStatus } from "@/lib/useKYCStatus";
  import KYCGateModal from "@/components/KYCGateModal";
  import { supabase } from "@/lib/supabase";

  const GOLD = "#C9A84C";
  const BG = "#040b14";
  const CARD_BG = "#04080F";
  const BORDER = "rgba(255,255,255,0.07)";
  const BORDER_GOLD = "rgba(201,168,76,0.25)";
  const basePath = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

  const MARKET_MODES = [
    "All","Buy","Sell","Rent","Booking","Investment",
    "Installments","Construction","Fractional","Luxury","Commercial","International",
  ];

  const GLOBAL_STATS = [
    { label: "Global Listings", value: 48290, suffix: "+", prefix: "", icon: Building2, color: GOLD },
    { label: "Verified Assets", value: 31400, suffix: "+", prefix: "", icon: ShieldCheck, color: "#10b981" },
    { label: "Active Countries", value: 24, suffix: "", prefix: "", icon: Globe, color: "#3b82f6" },
    { label: "Inst. Investors", value: 1840, suffix: "+", prefix: "", icon: Users, color: "#a78bfa" },
    { label: "Market Volume", value: 9.4, suffix: "B+", prefix: "$", icon: DollarSign, color: "#f97316" },
  ];

  const QUICK_ACTIONS: { icon: React.ElementType; label: string; color: string; bg: string; type?: string; kycRequired: boolean; href?: string }[] = [
    { icon: HomeIcon, label: "Buy Property", color: GOLD, bg: "rgba(201,168,76,0.12)", type: "Buy", kycRequired: true },
    { icon: ArrowRight, label: "Sell Asset", color: "#10b981", bg: "rgba(16,185,129,0.12)", type: "Sell", kycRequired: true },
    { icon: KeyRound, label: "Rent Market", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", type: "Rent", kycRequired: false },
    { icon: BarChart3, label: "Invest Hub", color: "#06b6d4", bg: "rgba(6,182,212,0.12)", type: "Investment", kycRequired: false },
    { icon: Layers, label: "Fractional", color: "#ec4899", bg: "rgba(236,72,153,0.12)", kycRequired: false, href: "/invest" },
    { icon: HardHat, label: "Construction", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", type: "Construction", kycRequired: true },
    { icon: Star, label: "Luxury Est.", color: GOLD, bg: "rgba(201,168,76,0.10)", type: "Luxury", kycRequired: false },
    { icon: Globe, label: "International", color: "#f97316", bg: "rgba(249,115,22,0.12)", type: "International", kycRequired: false },
  ];

  const MARKET_PULSE_DATA = [
    { city: "Dubai", country: "UAE", flag: "🇦🇪", roi: "12.4%", trend: "+3.2%", up: true, sentiment: "Bullish", volume: "AED 4.2B", desc: "Marina & Downtown" },
    { city: "Karachi", country: "Pakistan", flag: "🇵🇰", roi: "18.7%", trend: "+8.1%", up: true, sentiment: "Strong", volume: "₨ 850B", desc: "DHA & Clifton" },
    { city: "Riyadh", country: "KSA", flag: "🇸🇦", roi: "9.8%", trend: "+4.5%", up: true, sentiment: "Growing", volume: "SAR 12B", desc: "Neom & KAEC" },
    { city: "London", country: "UK", flag: "🇬🇧", roi: "6.2%", trend: "-1.3%", up: false, sentiment: "Stable", volume: "£ 8.4B", desc: "Commercial Zone" },
    { city: "Istanbul", country: "Turkey", flag: "🇹🇷", roi: "22.1%", trend: "+11.4%", up: true, sentiment: "Explosive", volume: "₺ 320B", desc: "Luxury Villas" },
    { city: "New York", country: "USA", flag: "🇺🇸", roi: "7.8%", trend: "+2.1%", up: true, sentiment: "Stable", volume: "$ 28B", desc: "Manhattan Rentals" },
  ];

  interface Property {
    id: number; category: string; type: string; title: string; location: string;
    city: string; country: string; developer: string; priceLabel: string; price: number;
    beds: number; baths: number; areaSqFt: number; roi: string | null;
    rentalYield: string | null; status: string; image: string; tag: string;
    tagColor: string; verified: boolean; tokenized: boolean; ownership: string | null;
    monthlyIncome: string | null; completion: string | null; lat: number; lng: number;
  }

  const PROPERTIES: Property[] = [
    { id: 1, category: "Buy", type: "buy", title: "DHA Phase 6 – 1 Kanal Bungalow", location: "DHA Phase 6, Lahore", city: "Lahore", country: "Pakistan", developer: "DHA", priceLabel: "₨ 4.5 Cr", price: 45000000, beds: 5, baths: 5, areaSqFt: 4500, roi: null, rentalYield: null, status: "Available", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80", tag: "Hot Deal", tagColor: "#ef4444", verified: true, tokenized: false, ownership: null, monthlyIncome: null, completion: null, lat: 31.5204, lng: 74.3587 },
    { id: 2, category: "Investment", type: "investment", title: "Orakzai Tower – Fractional Share", location: "Bahria Town, Lahore", city: "Lahore", country: "Pakistan", developer: "Orakzai Group", priceLabel: "From ₨ 10L", price: 1000000, beds: 0, baths: 0, areaSqFt: 0, roi: "20% p.a.", rentalYield: "8.4%", status: "Funding", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80", tag: "20% ROI", tagColor: "#10b981", verified: true, tokenized: true, ownership: "2.5%", monthlyIncome: "₨ 65K", completion: "Q2 2026", lat: 31.3612, lng: 74.2028 },
    { id: 3, category: "Luxury", type: "luxury", title: "Palm Villa – Sea View Estate", location: "DHA Phase 8, Karachi", city: "Karachi", country: "Pakistan", developer: "Emaar Pakistan", priceLabel: "₨ 22 Cr", price: 220000000, beds: 7, baths: 8, areaSqFt: 12000, roi: null, rentalYield: "5.2%", status: "Available", image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80", tag: "Luxury", tagColor: GOLD, verified: true, tokenized: false, ownership: null, monthlyIncome: "₨ 5.5L", completion: "Ready", lat: 24.8607, lng: 67.0011 },
    { id: 4, category: "Booking", type: "booking", title: "Azan Smart City – 5 Marla Plot", location: "Chakri Road, Rawalpindi", city: "Rawalpindi", country: "Pakistan", developer: "Azan Group", priceLabel: "₨ 35L", price: 3500000, beds: 0, baths: 0, areaSqFt: 1125, roi: "22% p.a.", rentalYield: null, status: "Pre-Launch", image: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&q=80", tag: "Pre-Launch", tagColor: GOLD, verified: true, tokenized: true, ownership: null, monthlyIncome: null, completion: "Q4 2027", lat: 33.5651, lng: 73.0169 },
    { id: 5, category: "International", type: "international", title: "Marina Heights – Dubai", location: "Dubai Marina, UAE", city: "Dubai", country: "UAE", developer: "Emaar Properties", priceLabel: "AED 2.8M", price: 280000000, beds: 3, baths: 3, areaSqFt: 2200, roi: "12.4%", rentalYield: "7.8%", status: "Ready", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80", tag: "12% ROI", tagColor: "#10b981", verified: true, tokenized: true, ownership: "1%", monthlyIncome: "AED 18K", completion: "Ready", lat: 25.0805, lng: 55.1403 },
    { id: 6, category: "Rent", type: "rent", title: "DHA Phase 5 – 3 Bed Apartment", location: "DHA Phase 5, Lahore", city: "Lahore", country: "Pakistan", developer: "Private", priceLabel: "₨ 85K/mo", price: 85000, beds: 3, baths: 2, areaSqFt: 1800, roi: null, rentalYield: null, status: "Available", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80", tag: "Premium", tagColor: "#8b5cf6", verified: true, tokenized: false, ownership: null, monthlyIncome: null, completion: null, lat: 31.4697, lng: 74.4063 },
    { id: 7, category: "Commercial", type: "commercial", title: "Gulberg III – Commercial Plaza", location: "Gulberg III, Lahore", city: "Lahore", country: "Pakistan", developer: "Private", priceLabel: "₨ 8 Cr", price: 80000000, beds: 0, baths: 0, areaSqFt: 5000, roi: "14%", rentalYield: "9.2%", status: "Available", image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80", tag: "Commercial", tagColor: "#3b82f6", verified: true, tokenized: false, ownership: null, monthlyIncome: "₨ 6L", completion: "Ready", lat: 31.5009, lng: 74.3455 },
    { id: 8, category: "Construction", type: "construction", title: "Grey Structure – 10 Marla DHA", location: "DHA Phase 8, Lahore", city: "Lahore", country: "Pakistan", developer: "BuildPro", priceLabel: "₨ 85L", price: 8500000, beds: 4, baths: 4, areaSqFt: 2250, roi: null, rentalYield: null, status: "In Progress", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80", tag: "70% Done", tagColor: "#f97316", verified: true, tokenized: false, ownership: null, monthlyIncome: null, completion: "Dec 2025", lat: 31.4712, lng: 74.3891 },
  ];

  const AI_INSIGHTS = [
    { icon: TrendingUp, text: "Dubai Marina demand increased 14% this quarter — strong rental returns projected.", color: "#10b981" },
    { icon: Building2, text: "Luxury villas in Istanbul showing 22% appreciation — foreign investor activity surging.", color: GOLD },
    { icon: Activity, text: "Azan Smart City Phase 1 pre-launch inventory 78% subscribed — limited availability.", color: "#ef4444" },
    { icon: Globe, text: "Riyadh commercial sector expanding — Vision 2030 driving institutional demand.", color: "#3b82f6" },
    { icon: BarChart2, text: "Karachi DHA projects delivering consistent 18%+ ROI for fractional investors.", color: "#a78bfa" },
  ];

  const TRENDING = ["Dubai Marina", "DHA Lahore plots", "Fractional investment", "Istanbul luxury", "Bahria Town", "Riyadh commercial"];

  function AnimatedCounter({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      const steps = 80; const step = 20; let current = 0; const inc = value / steps;
      const t = setInterval(() => { current += inc; if (current >= value) { setDisplay(value); clearInterval(t); } else setDisplay(current); }, step);
      return () => clearInterval(t);
    }, [value]);
    return <span>{prefix}{decimals > 0 ? display.toFixed(decimals) : Math.floor(display).toLocaleString()}{suffix}</span>;
  }

  function SectionHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon?: React.ReactNode }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        {icon}
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#F5F5F5" }}>{title}</div>
          <div style={{ fontSize: 10, color: "#8B93A7", textTransform: "uppercase" as const, letterSpacing: 0.8 }}>{subtitle}</div>
        </div>
      </div>
    );
  }

  function CinematicCard({ p, saved, onSave }: { p: Property; saved: boolean; onSave: () => void }) {
    const [, nav] = useLocation();
    const [hovered, setHovered] = useState(false);
    const isInvest = ["investment", "booking", "fractional"].includes(p.type);
    return (
      <motion.div onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
        whileHover={{ y: -6, scale: 1.015 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={() => isInvest ? nav(`/invest/${p.id}`) : nav(`/property/${p.id}`)}
        style={{ background: CARD_BG, border: `1px solid ${hovered ? BORDER_GOLD : BORDER}`, borderRadius: 20, overflow: "hidden", cursor: "pointer", flexShrink: 0, width: 280, boxShadow: hovered ? "0 24px 60px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.3)", transition: "border-color 0.25s,box-shadow 0.25s" }}>
        <div style={{ position: "relative", height: 185 }}>
          <motion.img animate={{ scale: hovered ? 1.06 : 1 }} transition={{ duration: 0.5 }}
            src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80"; }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(7,11,20,0.05) 0%,rgba(7,11,20,0.95) 100%)" }} />
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: p.tagColor, color: "#040b14" }}>{p.tag}</span>
            {p.tokenized && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "rgba(6,182,212,0.9)", color: "#fff" }}>⬡ Token</span>}
          </div>
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); onSave(); }}
            style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart size={14} color={saved ? "#ef4444" : "#fff"} fill={saved ? "#ef4444" : "none"} />
          </motion.button>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px" }}>
            <div style={{ color: GOLD, fontWeight: 900, fontSize: 19 }}>{p.priceLabel}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {p.roi && <span style={{ color: "#10b981", fontSize: 11, fontWeight: 700 }}>{p.roi}</span>}
              {p.rentalYield && <span style={{ color: "#06b6d4", fontSize: 11, fontWeight: 700 }}>Yield {p.rentalYield}</span>}
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 14px 14px" }}>
          <div style={{ color: "#F5F5F5", fontWeight: 700, fontSize: 14, marginBottom: 3, lineHeight: 1.3 }}>{p.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B93A7", fontSize: 11, marginBottom: 7 }}>
            <MapPin size={10} color={GOLD} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.location}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 10, color: "#8B93A7" }}>
            <span>by {p.developer}</span><span>{p.country}</span>
          </div>
          {p.beds > 0 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#8B93A7", fontSize: 11 }}><Bed size={10} />{p.beds}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#8B93A7", fontSize: 11 }}><Bath size={10} />{p.baths}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#8B93A7", fontSize: 11 }}><Maximize2 size={10} />{p.areaSqFt.toLocaleString()} ft²</span>
            </div>
          )}
          {p.monthlyIncome && (
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <div style={{ flex: 1, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "5px 8px" }}>
                <div style={{ fontSize: 9, color: "#8B93A7", marginBottom: 1 }}>Monthly Income</div>
                <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>{p.monthlyIncome}</div>
              </div>
              {p.completion && (
                <div style={{ flex: 1, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "5px 8px" }}>
                  <div style={{ fontSize: 9, color: "#8B93A7", marginBottom: 1 }}>Completion</div>
                  <div style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>{p.completion}</div>
                </div>
              )}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 20, background: "rgba(255,255,255,0.06)", color: "#8B93A7", fontWeight: 600 }}>{p.status}</span>
            {p.verified && <div style={{ display: "flex", alignItems: "center", gap: 3, color: GOLD, fontSize: 10, fontWeight: 700 }}><ShieldCheck size={10} /> Verified</div>}
          </div>
          <AnimatePresence>
            {hovered && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: `linear-gradient(135deg,${GOLD},#e8a820)`, border: "none", color: "#040b14", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                  {isInvest ? "Invest Now" : "View Details"}
                </button>
                {p.tokenized && (
                  <button style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Buy Shares</button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  function MapSection({ properties }: { properties: Property[] }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedProp, setSelectedProp] = useState<Property | null>(null);

    useEffect(() => {
      if (!mapRef.current || mapInstanceRef.current) return;
      let mounted = true;
      (async () => {
        try {
          const mapboxgl = (await import("mapbox-gl")).default;
          if (!mounted || !mapRef.current) return;
          // @ts-ignore
          mapboxgl.accessToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) ?? "";
          // @ts-ignore
          const map = new mapboxgl.Map({ container: mapRef.current, style: "mapbox://styles/faisalorakzai/cmp6m332s001a01s93rqk58ew", center: [60, 28], zoom: 2 });
          map.on("load", () => {
            if (!mounted) return;
            setMapLoaded(true);
            try { // @ts-ignore
              map.setFog({ color: "rgba(7,11,20,0.8)", "high-color": "#040b14", "horizon-blend": 0.02, "space-color": "#040b14", "star-intensity": 0.2 }); } catch {}
            properties.forEach(prop => {
              const el = document.createElement("div");
              const c = prop.roi ? "#10b981" : GOLD;
              el.style.cssText = `width:30px;height:30px;border-radius:50%;background:${c};border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 18px ${c}99;font-size:10px;font-weight:800;color:#040b14;transition:transform 0.2s`;
              el.textContent = prop.roi ? "%" : "₨";
              el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.35)"; });
              el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
              el.addEventListener("click", () => { setSelectedProp(prop); // @ts-ignore
                map.flyTo({ center: [prop.lng, prop.lat], zoom: 11, duration: 2000 }); });
              // @ts-ignore
              new mapboxgl.Marker({ element: el }).setLngLat([prop.lng, prop.lat]).addTo(map);
            });
          });
          mapInstanceRef.current = map;
        } catch { if (mounted) setMapLoaded(false); }
      })();
      return () => { mounted = false; if (mapInstanceRef.current) { (mapInstanceRef.current as { remove: () => void }).remove(); mapInstanceRef.current = null; } };
    }, []);

    return (
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", border: `1px solid ${BORDER}`, height: 420 }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        {!mapLoaded && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#040b14 0%,#04080F 60%,#040b14 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }}>
              {Array.from({ length: 10 }, (_, i) => (<line key={`h${i}`} x1="0" y1={`${i * 11}%`} x2="100%" y2={`${i * 11}%`} stroke={GOLD} strokeWidth="0.5" />))}
              {Array.from({ length: 14 }, (_, i) => (<line key={`v${i}`} x1={`${i * 8}%`} y1="0" x2={`${i * 8}%`} y2="100%" stroke={GOLD} strokeWidth="0.5" />))}
            </svg>
            {properties.slice(0, 6).map((prop, i) => (
              <motion.div key={prop.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 * i }}
                onClick={() => setSelectedProp(prop)} style={{ position: "absolute", left: `${10 + i * 14}%`, top: `${25 + (i % 3) * 22}%`, cursor: "pointer", zIndex: 5 }}>
                <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.4 }}
                  style={{ width: 34, height: 34, borderRadius: "50%", background: prop.roi ? "rgba(16,185,129,0.92)" : "rgba(201,168,76,0.92)", border: "2px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 22px ${prop.roi ? "#10b981" : GOLD}99`, fontSize: 11, fontWeight: 800, color: "#040b14" }}>
                  {prop.roi ? "%" : "₨"}
                </motion.div>
                <div style={{ marginTop: 5, background: "rgba(13,20,33,0.9)", border: `1px solid ${BORDER_GOLD}`, borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap", fontSize: 9, color: "#F5F5F5", textAlign: "center" as const }}>{prop.city}</div>
              </motion.div>
            ))}
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${BORDER_GOLD}`, borderTopColor: GOLD, position: "relative", zIndex: 10 }} />
            <span style={{ color: "#8B93A7", fontSize: 12, zIndex: 10 }}>Loading Global Map...</span>
          </div>
        )}
        <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 8, zIndex: 20 }}>
          {[{ label: "ROI Zones", color: "#10b981" }, { label: "Luxury", color: GOLD }, { label: "Commercial", color: "#3b82f6" }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "rgba(7,11,20,0.88)", border: `1px solid ${BORDER}`, backdropFilter: "blur(10px)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: l.color, display: "inline-block" }} />
              <span style={{ fontSize: 10, color: "#F5F5F5", fontWeight: 600 }}>{l.label}</span>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {selectedProp && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ position: "absolute", top: 14, right: 14, width: 225, background: "rgba(13,20,33,0.96)", border: `1px solid ${BORDER_GOLD}`, borderRadius: 16, overflow: "hidden", backdropFilter: "blur(20px)", zIndex: 20 }}>
              <img src={selectedProp.image} alt={selectedProp.title} style={{ width: "100%", height: 100, objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"; }} />
              <button onClick={() => setSelectedProp(null)} style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.65)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={12} color="#fff" /></button>
              <div style={{ padding: "10px 13px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F5F5F5", marginBottom: 3, lineHeight: 1.3 }}>{selectedProp.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}><MapPin size={9} color={GOLD} /><span style={{ fontSize: 10, color: "#8B93A7" }}>{selectedProp.location}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: GOLD }}>{selectedProp.priceLabel}</span>
                  {selectedProp.roi && <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>{selectedProp.roi}</span>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  function InvestmentPanel() {
    const [, nav] = useLocation();
    const investments = [
      { title: "Orakzai Tower – Fractional", roi: "20% p.a.", yld: "8.4%", min: "₨ 10L", tokenized: true, available: "37% left", color: "#10b981" },
      { title: "Azan Smart City Phase 1", roi: "22% p.a.", yld: null as string | null, min: "₨ 35L", tokenized: true, available: "21% left", color: GOLD },
      { title: "DHA Phase 9 – Fractional", roi: "16% p.a.", yld: "6.8%", min: "₨ 5L", tokenized: true, available: "52% left", color: "#3b82f6" },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {investments.map((inv, i) => (
          <motion.div key={i} whileHover={{ x: 4, boxShadow: "0 12px 30px rgba(0,0,0,0.4)" }} onClick={() => nav("/invest")}
            style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${inv.color}15`, border: `1px solid ${inv.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BarChart2 size={20} color={inv.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F5F5F5", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.title}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 10, color: inv.color, fontWeight: 700, background: `${inv.color}15`, padding: "2px 8px", borderRadius: 20 }}>ROI {inv.roi}</span>
                {inv.yld && <span style={{ fontSize: 10, color: "#06b6d4", fontWeight: 700, background: "rgba(6,182,212,0.1)", padding: "2px 8px", borderRadius: 20 }}>Yield {inv.yld}</span>}
                {inv.tokenized && <span style={{ fontSize: 10, color: "#8b5cf6", fontWeight: 700, background: "rgba(139,92,246,0.1)", padding: "2px 8px", borderRadius: 20 }}>⬡ Tokenized</span>}
              </div>
            </div>
            <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{inv.min}</div>
              <div style={{ fontSize: 10, color: "#8B93A7" }}>Min. invest</div>
              <div style={{ fontSize: 10, color: "#10b981", marginTop: 2 }}>{inv.available}</div>
            </div>
            <ChevronRight size={16} color="#8B93A7" />
          </motion.div>
        ))}
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => nav("/invest")}
          style={{ width: "100%", padding: "14px", borderRadius: 16, background: "rgba(201,168,76,0.08)", border: `1px solid ${BORDER_GOLD}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Award size={15} color={GOLD} /><span style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>Explore All Investment Opportunities</span>
        </motion.button>
      </div>
    );
  }

  export default function Home() {
    const [, setLocation] = useLocation();
    const { user } = useUser();
    const { isVerified } = useKYCStatus();
    const [activeMode, setActiveMode] = useState("All");
    const [search, setSearch] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
    const [kycModalOpen, setKycModalOpen] = useState(false);
    const [kycModalFeature, setKycModalFeature] = useState<string | undefined>();
    const [aiInsightIndex, setAiInsightIndex] = useState(0);
    const [dbProperties, setDbProperties] = useState<Property[]>([]);
    const [loadingDb, setLoadingDb] = useState(false);
    const [headerScrolled, setHeaderScrolled] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"scroll" | "grid">("scroll");

    useEffect(() => {
      const fn = () => setHeaderScrolled(window.scrollY > 30);
      window.addEventListener("scroll", fn, { passive: true });
      return () => window.removeEventListener("scroll", fn);
    }, []);

    useEffect(() => {
      const t = setInterval(() => setAiInsightIndex(i => (i + 1) % AI_INSIGHTS.length), 4200);
      return () => clearInterval(t);
    }, []);

    useEffect(() => {
      let cancel = false;
      (async () => {
        setLoadingDb(true);
        try {
          let q = supabase.from("properties").select("*").limit(20);
          if (activeMode !== "All") q = q.ilike("type", `%${activeMode.toLowerCase()}%`);
          const { data } = await q;
          if (!cancel && data && data.length > 0) setDbProperties(data as Property[]);
        } catch {}
        if (!cancel) setLoadingDb(false);
      })();
      return () => { cancel = true; };
    }, [activeMode]);

    const listings = useMemo(() => {
      const base = dbProperties.length > 0 ? dbProperties : PROPERTIES;
      let list = activeMode === "All" ? base : base.filter(p => p.category.toLowerCase() === activeMode.toLowerCase() || p.type.toLowerCase() === activeMode.toLowerCase());
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(p => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.country.toLowerCase().includes(q) || (p.developer ?? "").toLowerCase().includes(q));
      }
      return list;
    }, [activeMode, search, dbProperties]);

    const toggleSave = useCallback((id: number) => {
      setSavedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }, []);

    const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
      if (action.kycRequired && !isVerified) { setKycModalFeature(action.label); setKycModalOpen(true); return; }
      if (action.href) { setLocation(action.href); return; }
      if (action.type) { setActiveMode(action.type); setTimeout(() => document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" }), 100); }
    };

    const currentInsight = AI_INSIGHTS[aiInsightIndex];

    return (
      <div style={{ minHeight: "100dvh", background: BG, color: "#F5F5F5", fontFamily: "'Plus Jakarta Sans',sans-serif", paddingBottom: 100 }}>
        <KYCGateModal open={kycModalOpen} onClose={() => setKycModalOpen(false)} featureName={kycModalFeature} />
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -120, right: "5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.05) 0%,transparent 70%)", filter: "blur(90px)" }} />
          <div style={{ position: "absolute", top: "35%", left: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.04) 0%,transparent 70%)", filter: "blur(80px)" }} />
        </div>

        {/* HEADER */}
        <motion.header initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }}
          style={{ position: "sticky", top: 0, zIndex: 50, background: headerScrolled ? "rgba(7,11,20,0.94)" : "rgba(7,11,20,0.72)", backdropFilter: "blur(22px)", borderBottom: `1px solid ${headerScrolled ? BORDER_GOLD : BORDER}`, transition: "all 0.3s ease" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "11px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <motion.div whileHover={{ scale: 1.02 }} onClick={() => setLocation("/")} style={{ cursor: "pointer", flexShrink: 0 }}>
              <img src={`${basePath}/logo-orakzai-full.png`} alt="Orakzai Properties" style={{ height: 44, width: "auto", objectFit: "contain" }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; const fb = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement; if (fb) fb.style.display = "flex"; }} />
              <div style={{ display: "none", alignItems: "center", gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Building2 size={18} color={GOLD} /></div>
                <div><div style={{ fontWeight: 900, fontSize: 14, color: GOLD }}>ORAKZAI</div><div style={{ fontSize: 8, color: "#8B93A7", letterSpacing: 3, textTransform: "uppercase" as const }}>Properties</div></div>
              </div>
            </motion.div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                <span style={{ fontSize: 10, color: "#10b981", fontWeight: 700 }}>LIVE</span>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => isVerified ? setLocation("/wallet") : (setKycModalFeature("Wallet"), setKycModalOpen(true))}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, background: "rgba(201,168,76,0.1)", border: `1px solid ${BORDER_GOLD}`, cursor: "pointer" }}>
                <Wallet size={13} color={GOLD} /><span style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>₨ 0</span>
              </motion.button>
              <div style={{ position: "relative" }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setNotifOpen(v => !v); setMenuOpen(false); }}
                  style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                  <Bell size={15} color="#8B93A7" />
                  <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: GOLD, border: "1.5px solid #040b14" }} />
                </motion.button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      style={{ position: "absolute", right: 0, top: 44, width: 285, background: "#04080F", border: `1px solid ${BORDER_GOLD}`, borderRadius: 16, zIndex: 100, boxShadow: "0 24px 60px rgba(0,0,0,0.75)", overflow: "hidden" }}>
                      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
                        <button onClick={() => setNotifOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} color="#8B93A7" /></button>
                      </div>
                      {["New listing: Dubai Marina 3-bed", "Azan Smart City Phase 1 update", "Orakzai Tower funding 62%", "Price alert: DHA Phase 6 plot"].map((n, i) => (
                        <motion.div key={i} whileHover={{ background: "rgba(255,255,255,0.04)" }} onClick={() => { setLocation("/notifications"); setNotifOpen(false); }}
                          style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, flexShrink: 0, marginTop: 4 }} />
                          <span style={{ color: "#A0AABA", fontSize: 12, lineHeight: 1.4 }}>{n}</span>
                        </motion.div>
                      ))}
                      <div onClick={() => { setLocation("/notifications"); setNotifOpen(false); }} style={{ padding: "10px 16px", textAlign: "center" as const, cursor: "pointer", color: GOLD, fontSize: 12, fontWeight: 700 }}>View All</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div style={{ position: "relative" }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setMenuOpen(v => !v); setNotifOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, cursor: "pointer" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg,${GOLD},#e8a820)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={12} color="#040b14" /></div>
                  <span style={{ color: "#A0AABA", fontSize: 12 }}>{user?.firstName ?? "Account"}</span>
                  <ChevronDown size={11} color="#8B93A7" />
                </motion.button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      style={{ position: "absolute", right: 0, top: 44, width: 215, background: "#04080F", border: `1px solid ${BORDER_GOLD}`, borderRadius: 16, zIndex: 100, boxShadow: "0 24px 60px rgba(0,0,0,0.75)", overflow: "hidden" }}>
                      {[{ label: "Post Property", href: "/post-property", icon: Plus, kycRequired: false }, { label: "My Listings", href: "/my-properties", icon: Building2, kycRequired: false }, { label: "Portfolio", href: "/portfolio", icon: BarChart3, kycRequired: false }, { label: "Wallet", href: "/wallet", icon: Wallet, kycRequired: true }, { label: "Profile", href: "/profile", icon: User, kycRequired: false }, { label: "KYC Verify", href: "/kyc", icon: ShieldCheck, kycRequired: false }].map(item => (
                        <motion.div key={item.label} whileHover={{ background: "rgba(255,255,255,0.05)" }}
                          onClick={() => { if (item.kycRequired && !isVerified) { setMenuOpen(false); setKycModalFeature(item.label); setKycModalOpen(true); return; } setLocation(item.href); setMenuOpen(false); }}
                          style={{ padding: "11px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${BORDER}` }}>
                          <item.icon size={13} color="#8B93A7" /><span style={{ color: "#A0AABA", fontSize: 13 }}>{item.label}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.header>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>

          {/* HERO SEARCH */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ padding: "28px 0 0", textAlign: "center" as const }}>
            <h1 style={{ fontSize: "clamp(22px,5vw,38px)", fontWeight: 900, color: "#F5F5F5", letterSpacing: -0.5, lineHeight: 1.2, margin: "0 0 6px" }}>
              Global Real Estate <span style={{ color: GOLD }}>Command Center</span>
            </h1>
            <p style={{ color: "#8B93A7", fontSize: 13, margin: "0 0 20px" }}>48,000+ verified properties · 24 countries · live market data</p>
            <motion.div animate={{ boxShadow: searchFocused ? `0 0 0 2px ${GOLD}44,0 8px 32px rgba(0,0,0,0.4)` : "0 2px 14px rgba(0,0,0,0.25)" }}
              style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${searchFocused ? BORDER_GOLD : BORDER}`, borderRadius: 18, padding: "0 18px", height: 56, maxWidth: 640, margin: "0 auto", transition: "border-color 0.2s" }}>
              <Search size={18} color={searchFocused ? GOLD : "#8B93A7"} />
              <input value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                placeholder="Search global properties, investment opportunities, rental yields…"
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#F5F5F5", fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
              {search && <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={13} color="#8B93A7" /></motion.button>}
              <motion.button whileHover={{ scale: 1.1 }} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(201,168,76,0.1)", border: `1px solid ${BORDER_GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Mic size={13} color={GOLD} /></motion.button>
            </motion.div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, justifyContent: "center", marginTop: 12 }}>
              <span style={{ fontSize: 11, color: "#8B93A7" }}>Trending:</span>
              {TRENDING.map(t => (
                <motion.button key={t} whileHover={{ scale: 1.05 }} onClick={() => { setSearch(t); setActiveMode("All"); }}
                  style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: "#8B93A7", cursor: "pointer" }}>{t}</motion.button>
              ))}
            </div>
          </motion.div>

          {/* MARKET MODES */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} style={{ padding: "20px 0 0" }}>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" as const }}>
              {MARKET_MODES.map(mode => {
                const active = mode === activeMode;
                return (
                  <motion.button key={mode} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setActiveMode(mode)}
                    style={{ flexShrink: 0, height: 34, padding: "0 16px", borderRadius: 20, fontSize: 12, fontWeight: active ? 800 : 500, cursor: "pointer", background: active ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)", border: active ? "1px solid rgba(201,168,76,0.55)" : `1px solid ${BORDER}`, color: active ? GOLD : "#8B93A7", boxShadow: active ? "0 0 20px rgba(201,168,76,0.2)" : "none", transition: "all 0.2s ease" }}>
                    {mode}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* GLOBAL STATS */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, padding: "20px 0 0" }}>
            {GLOBAL_STATS.map(stat => (
              <motion.div key={stat.label} whileHover={{ y: -3 }} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "14px 10px", textAlign: "center" as const }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${stat.color}18`, border: `1px solid ${stat.color}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                  <stat.icon size={16} color={stat.color} />
                </div>
                <div style={{ fontWeight: 900, fontSize: 18, color: stat.color, fontFamily: "'Playfair Display',serif" }}>
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.value % 1 !== 0 ? 1 : 0} />
                </div>
                <div style={{ color: "#8B93A7", fontSize: 9, marginTop: 2, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* QUICK ACCESS */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} style={{ padding: "26px 0 0" }}>
            <SectionHeader title="Quick Access" subtitle="Marketplace actions" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {QUICK_ACTIONS.map(action => (
                <motion.button key={action.label} whileHover={{ y: -4, boxShadow: `0 16px 40px rgba(0,0,0,0.4)` }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleQuickAction(action)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 8px", borderRadius: 18, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, cursor: "pointer", position: "relative" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: action.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <action.icon size={20} color={action.color} />
                  </div>
                  <span style={{ color: "#F5F5F5", fontSize: 11, fontWeight: 600, textAlign: "center" as const, lineHeight: 1.2 }}>{action.label}</span>
                  {action.kycRequired && !isVerified && (
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                      style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 8px rgba(245,158,11,0.6)" }} />
                  )}
                </motion.button>
              ))}
            </div>
            {!isVerified && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "rgba(245,158,11,0.8)" }}>
                <Lock size={11} color="#f59e0b" />
                KYC verification required —{" "}
                <button onClick={() => { setKycModalFeature("KYC Verification"); setKycModalOpen(true); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, fontWeight: 700, fontSize: 11, padding: 0, textDecoration: "underline" }}>Verify Now</button>
              </div>
            )}
          </motion.div>

          {/* MARKET PULSE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ padding: "28px 0 0" }}>
            <SectionHeader title="Global Market Pulse" subtitle="Live market intelligence" icon={<Activity size={14} color={GOLD} />} />
            <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none" as const, paddingBottom: 4 }}>
              {MARKET_PULSE_DATA.map((m, i) => (
                <motion.div key={m.city} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i }}
                  whileHover={{ y: -4 }} style={{ flexShrink: 0, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "16px 18px", minWidth: 195 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 20 }}>{m.flag}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#F5F5F5" }}>{m.city}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#8B93A7", marginTop: 1 }}>{m.country}</div>
                    </div>
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                      style={{ width: 8, height: 8, borderRadius: "50%", background: m.up ? "#10b981" : "#ef4444" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    {m.up ? <TrendingUp size={14} color="#10b981" /> : <TrendingDown size={14} color="#ef4444" />}
                    <span style={{ fontSize: 17, fontWeight: 900, color: m.up ? "#10b981" : "#ef4444" }}>{m.trend}</span>
                    <span style={{ fontSize: 10, color: "#8B93A7" }}>YTD</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div style={{ background: "rgba(201,168,76,0.08)", borderRadius: 8, padding: "6px 8px" }}>
                      <div style={{ fontSize: 9, color: "#8B93A7", textTransform: "uppercase" as const }}>ROI</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{m.roi}</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 8px" }}>
                      <div style={{ fontSize: 9, color: "#8B93A7", textTransform: "uppercase" as const }}>Vol</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#F5F5F5" }}>{m.volume}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10, color: "#8B93A7" }}>{m.desc}</div>
                  <div style={{ marginTop: 6, display: "inline-flex", padding: "2px 8px", borderRadius: 20, background: m.up ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: m.up ? "#10b981" : "#ef4444", fontSize: 10, fontWeight: 700 }}>{m.sentiment}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* LISTINGS */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} id="listings-section" style={{ padding: "28px 0 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={14} color={GOLD} />
                <span style={{ fontSize: 11, color: "#8B93A7", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1 }}>{activeMode === "All" ? "Global Listings" : activeMode} ({listings.length})</span>
                {loadingDb && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><RefreshCw size={12} color="#8B93A7" /></motion.div>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setViewMode(v => v === "scroll" ? "grid" : "scroll")}
                  style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <LayoutList size={14} color="#8B93A7" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setLocation("/browse")}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 12px", height: 32, borderRadius: 8, background: "rgba(201,168,76,0.1)", border: `1px solid ${BORDER_GOLD}`, cursor: "pointer" }}>
                  <span style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>View All</span>
                  <ChevronRight size={12} color={GOLD} />
                </motion.button>
              </div>
            </div>
            {viewMode === "scroll" ? (
              <div style={{ display: "flex", gap: 14, overflowX: "auto", scrollbarWidth: "none" as const, paddingBottom: 8 }}>
                {listings.length === 0 ? <div style={{ color: "#8B93A7", fontSize: 13, padding: "32px 0" }}>No listings match your filter</div>
                  : listings.map(p => <CinematicCard key={p.id} p={p} saved={savedIds.has(p.id)} onSave={() => toggleSave(p.id)} />)}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
                {listings.map(p => <CinematicCard key={p.id} p={p} saved={savedIds.has(p.id)} onSave={() => toggleSave(p.id)} />)}
              </div>
            )}
          </motion.div>

          {/* MAPBOX */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} style={{ padding: "28px 0 0" }}>
            <SectionHeader title="Global Investment Map" subtitle="Live property intelligence grid" icon={<Map size={14} color={GOLD} />} />
            <MapSection properties={listings} />
          </motion.div>

          {/* INVESTMENT PANEL */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} style={{ padding: "28px 0 0" }}>
            <SectionHeader title="Investment Intelligence" subtitle="Real estate exchange panel" icon={<Target size={14} color={GOLD} />} />
            <InvestmentPanel />
          </motion.div>

          {/* AI ADVISOR */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }} style={{ padding: "28px 0 0" }}>
            <SectionHeader title="AI Property Advisor" subtitle="Orakzai Intelligence Engine" icon={<Brain size={14} color={GOLD} />} />
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER_GOLD}`, borderRadius: 20, overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.08) 0%,rgba(0,0,0,0) 100%)", borderBottom: `1px solid ${BORDER}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }}
                  style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(201,168,76,0.12)", border: `1px solid ${BORDER_GOLD}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Brain size={18} color={GOLD} />
                </motion.div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#F5F5F5" }}>Orakzai AI</div>
                  <div style={{ fontSize: 11, color: "#10b981" }}>Analyzing global markets in real-time</div>
                </div>
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}
                  style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={aiInsightIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${currentInsight.color}18`, border: `1px solid ${currentInsight.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <currentInsight.icon size={15} color={currentInsight.color} />
                    </div>
                    <p style={{ margin: 0, color: "#A0AABA", fontSize: 13, lineHeight: 1.65 }}>{currentInsight.text}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
              {AI_INSIGHTS.filter((_, i) => i !== aiInsightIndex).slice(0, 3).map((ins, i) => (
                <div key={i} style={{ padding: "12px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <ins.icon size={12} color="#8B93A7" style={{ marginTop: 3, flexShrink: 0 }} />
                  <span style={{ color: "#8B93A7", fontSize: 12, lineHeight: 1.5 }}>{ins.text}</span>
                </div>
              ))}
              <div style={{ padding: "14px 20px" }}>
                <motion.button whileHover={{ scale: 1.01 }} onClick={() => setLocation("/invest")}
                  style={{ width: "100%", padding: "12px", borderRadius: 12, background: "rgba(201,168,76,0.08)", border: `1px solid ${BORDER_GOLD}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Sparkles size={14} color={GOLD} />
                  <span style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>Get Personalized Investment Analysis</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* POST PROPERTY CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ padding: "28px 0 0" }}>
            <motion.button whileHover={{ scale: 1.01, boxShadow: "0 20px 50px rgba(201,168,76,0.15)" }} whileTap={{ scale: 0.99 }}
              onClick={() => setLocation("/post-property")}
              style={{ width: "100%", padding: "20px", borderRadius: 20, background: "linear-gradient(135deg,rgba(201,168,76,0.12) 0%,rgba(201,168,76,0.05) 100%)", border: `1px solid ${BORDER_GOLD}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={20} color={GOLD} /></div>
              <div style={{ textAlign: "left" as const }}>
                <div style={{ color: GOLD, fontWeight: 800, fontSize: 15 }}>List Your Property</div>
                <div style={{ color: "#8B93A7", fontSize: 11, marginTop: 1 }}>Reach 48,000+ global investors and buyers</div>
              </div>
              <ChevronRight size={18} color={GOLD} style={{ marginLeft: "auto" }} />
            </motion.button>
          </motion.div>
        </div>
        <style>{`::-webkit-scrollbar{display:none}`}</style>
      </div>
    );
  }
  