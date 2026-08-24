import { useMemo, useState } from "react";
import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { toast } from "sonner";
import { GLOBAL_CITIES, GLOBAL_CITY_COUNT, type GlobalCity } from "@/data/globalCities";

type GlobalCityPickerProps = {
  value: string;
  onChange: (value: string, city?: GlobalCity) => void;
  allLabel?: string;
  placeholder?: string;
  style?: React.CSSProperties;
};

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function CitySuggestion({ initialCity, onSaved, onCancel }: { initialCity: string; onSaved: (value: string) => void; onCancel: () => void }) {
  const [city, setCity] = useState(initialCity);
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [details, setDetails] = useState("");
  const save = () => {
    const name = city.trim();
    if (!name) {
      toast.error("Enter a city name before sending the suggestion.");
      return;
    }
    try {
      const existing = JSON.parse(localStorage.getItem("okzbyte_city_suggestions") || "[]");
      const suggestions = Array.isArray(existing) ? existing : [];
      suggestions.push({ city: name, country: country.trim(), region: region.trim(), details: details.trim(), source: "global-city-picker", created_at: new Date().toISOString() });
      localStorage.setItem("okzbyte_city_suggestions", JSON.stringify(suggestions.slice(-100)));
    } catch (error) {
      console.error("city suggestion storage failed", error);
    }
    toast.success("City suggestion added for review.");
    onSaved([name, country.trim()].filter(Boolean).join(", "));
  };
  return <div style={{ marginTop: 10, padding: 10, borderRadius: 11, border: "1px solid rgba(240,185,11,.25)", background: "rgba(240,185,11,.06)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><strong style={{ color: "#f6d365", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase" }}>Suggest a city</strong><button type="button" onClick={onCancel} aria-label="Close city suggestion form" style={{ border: 0, background: "transparent", color: "#929aa5", cursor: "pointer" }}><X size={14} /></button></div>
    <p style={{ margin: "5px 0 9px", color: "#929aa5", fontSize: 10, lineHeight: 1.4 }}>Send the missing location for directory review.</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}><input value={city} onChange={(event) => setCity(event.target.value)} aria-label="Suggested city name" placeholder="City name" style={miniInput} /><input value={country} onChange={(event) => setCountry(event.target.value)} aria-label="Suggested city country" placeholder="Country" style={miniInput} /></div>
    <input value={region} onChange={(event) => setRegion(event.target.value)} aria-label="Suggested city region" placeholder="State / province / region (optional)" style={{ ...miniInput, width: "100%", marginTop: 7 }} />
    <textarea value={details} onChange={(event) => setDetails(event.target.value)} aria-label="City suggestion details" placeholder="Area or helpful detail (optional)" rows={2} style={{ ...miniInput, width: "100%", marginTop: 7, resize: "vertical" }} />
    <button type="button" onClick={save} style={{ width: "100%", marginTop: 7, padding: "9px 10px", border: 0, borderRadius: 9, background: "#f0b90b", color: "#040b14", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>Send city suggestion</button>
  </div>;
}

const miniInput: React.CSSProperties = { boxSizing: "border-box", minWidth: 0, padding: "9px 10px", borderRadius: 9, border: "1px solid rgba(255,255,255,.10)", background: "#09111b", color: "#f5f7fa", outline: 0, fontSize: 11, fontFamily: "inherit" };

export default function GlobalCityPicker({ value, onChange, allLabel = "All Cities", placeholder = "Search or select a city", style }: GlobalCityPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const normalized = normalize(query);
  const filtered = useMemo(() => {
    if (!normalized) return GLOBAL_CITIES;
    const terms = normalized.split(" ").filter(Boolean);
    return GLOBAL_CITIES.filter((item) => {
      const text = normalize(`${item.city} ${item.country} ${item.region}`);
      return terms.every((term) => text.includes(term));
    }).sort((a, b) => {
      const aCity = normalize(a.city);
      const bCity = normalize(b.city);
      const aScore = aCity === normalized ? 0 : aCity.startsWith(normalized) ? 1 : 2;
      const bScore = bCity === normalized ? 0 : bCity.startsWith(normalized) ? 1 : 2;
      return aScore - bScore || a.city.localeCompare(b.city);
    }).slice(0, 120);
  }, [normalized]);
  const groups = useMemo(() => {
    const map = new Map<string, GlobalCity[]>();
    const source = normalized ? filtered : GLOBAL_CITIES;
    source.forEach((item) => map.set(item.group, [...(map.get(item.group) || []), item]));
    return Array.from(map.entries()).map(([group, cities]) => [group, normalized ? cities : cities.slice(0, group === "🔥 Popular Global Hubs" ? 24 : 6)] as [string, GlobalCity[]]);
  }, [filtered, normalized]);
  const close = () => { setOpen(false); setQuery(""); setSuggesting(false); };
  const select = (city: GlobalCity) => { onChange(city.city, city); close(); };
  const useCustom = (text: string) => { onChange(text); close(); };
  return <div style={{ position: "relative", minWidth: 0, ...style }}>
    <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, boxSizing: "border-box", padding: "11px 12px", borderRadius: 10, border: `1px solid ${open ? "rgba(240,185,11,.65)" : "rgba(255,255,255,.10)"}`, background: "#182231", color: value ? "#f5f5f5" : "#929aa5", outline: 0, fontSize: 12, fontFamily: "inherit", textAlign: "left", cursor: "pointer" }}><span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || placeholder}</span><ChevronDown size={15} color={open ? "#f0b90b" : "#929aa5"} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : undefined }} /></button>
    {open && <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 80, minWidth: 260, maxWidth: "min(430px, calc(100vw - 28px))", padding: 8, borderRadius: 14, border: "1px solid rgba(240,185,11,.38)", background: "#121b27", boxShadow: "0 18px 45px rgba(0,0,0,.58)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 9px", borderRadius: 10, border: "1px solid rgba(255,255,255,.10)", background: "#0b121d" }}><Search size={14} color="#929aa5" /><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setSuggesting(false); }} placeholder="Search city, country, or region..." aria-label="Search city, country, or region" style={{ width: "100%", minWidth: 0, border: 0, outline: 0, background: "transparent", color: "#f5f7fa", fontSize: 11, fontFamily: "inherit" }} /><button type="button" onClick={() => { setQuery(""); setSuggesting(false); }} aria-label="Clear city search" style={{ display: "grid", placeItems: "center", padding: 4, border: 0, borderRadius: 6, background: "transparent", color: "#929aa5", cursor: "pointer" }}><X size={14} /></button></div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 7, color: "#929aa5", fontSize: 9 }}><span>{normalized ? `${filtered.length} matching cities` : `${GLOBAL_CITY_COUNT} cities available`}</span><button type="button" onClick={() => { setQuery(""); setSuggesting(false); }} style={{ padding: 0, border: 0, background: "transparent", color: "#c9a84c", fontSize: 9, cursor: "pointer" }}>Clear search</button></div>
      <div style={{ maxHeight: "min(52vh, 430px)", overflowY: "auto", marginTop: 6 }}>
        {!groups.length ? <div style={{ padding: 14, textAlign: "center" }}><strong style={{ display: "block", color: "#f5f7fa", fontSize: 12 }}>No city found for “{query.trim()}”</strong><p style={{ margin: "7px 0 11px", color: "#929aa5", fontSize: 10, lineHeight: 1.45 }}>Use it as a custom location or suggest it for review.</p><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}><button type="button" onClick={() => useCustom(query.trim())} style={{ padding: "9px 7px", borderRadius: 9, border: "1px solid rgba(6,182,212,.35)", background: "rgba(6,182,212,.10)", color: "#8be9ff", fontSize: 10, fontWeight: 800 }}>Use custom location</button><button type="button" onClick={() => setSuggesting(true)} style={{ padding: "9px 7px", borderRadius: 9, border: "1px solid rgba(240,185,11,.35)", background: "rgba(240,185,11,.10)", color: "#f6d365", fontSize: 10, fontWeight: 800 }}>Suggest this city</button></div>{suggesting && <CitySuggestion initialCity={query.trim()} onCancel={() => setSuggesting(false)} onSaved={useCustom} />}</div> : groups.map(([group, cities]) => <div key={group} style={{ marginBottom: 8 }}><div style={{ padding: "5px 7px", color: "#06b6d4", fontSize: 9, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>{group}</div>{cities.map((city) => <button type="button" key={`${city.city}-${city.country}-${city.region}`} onClick={() => select(city)} style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 7, padding: "8px 7px", border: 0, borderRadius: 9, background: "transparent", color: "#f5f7fa", textAlign: "left", cursor: "pointer" }}><span style={{ flexShrink: 0, fontSize: 15 }}>{city.flag || "🌐"}</span><span style={{ minWidth: 0 }}><strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>{city.city}, {city.country}</strong><span style={{ display: "block", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#929aa5", fontSize: 9 }}>{city.region || "Global region"}</span></span></button>)}</div>)}
      </div>
      <div style={{ padding: "7px 5px 2px", borderTop: "1px solid rgba(255,255,255,.08)", color: "#667180", fontSize: 9 }}>Select a city or use a precise area in the related address field.</div>
    </div>}
  </div>;
}
