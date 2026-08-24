import { useMemo, useState } from "react";
import { ArrowLeft, Building2, Check, Download, ExternalLink, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Star, Users, X } from "lucide-react";
import { useLocation } from "wouter";
import GlobalCityPicker from "@/components/GlobalCityPicker";

const BG = "#050b14";
const PANEL = "#0b1420";
const CARD = "#101d2b";
const LINE = "rgba(255,255,255,.09)";
const TEXT = "#f3f5f7";
const DIM = "#8d9aaa";
const GOLD = "#f0b90b";
const GREEN = "#22c55e";
const BLUE = "#38bdf8";
const PURPLE = "#a78bfa";

type Category = "All Developers" | "Top Rated Builders" | "Luxury High-Rise" | "Township & Master Developers" | "Commercial Specialists";
type Developer = {
  id: string;
  name: string;
  headquarters: string;
  city: string;
  category: Category;
  approval: string;
  delivered: number;
  active: number;
  rating: number;
  reviews: number;
  years: number;
  cover: string;
  about: string;
  projects: { name: string; status: string; route: string }[];
  leadership: string[];
  specialties: string[];
  feedback: { quote: string; author: string }[];
};

const categories: Category[] = ["All Developers", "Top Rated Builders", "Luxury High-Rise", "Township & Master Developers", "Commercial Specialists"];
const developers: Developer[] = [
  {
    id: "orakzai-group",
    name: "Orakzai Group Developments",
    headquarters: "Karachi, Pakistan",
    city: "Karachi",
    category: "Top Rated Builders",
    approval: "Government Registered",
    delivered: 12,
    active: 4,
    rating: 4.9,
    reviews: 250,
    years: 18,
    cover: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85",
    about: "A full-service development company delivering residential, commercial, and mixed-use destinations with a disciplined focus on title, approvals, construction quality, and after-sales support.",
    projects: [{ name: "Orakzai Heights", status: "Delivered", route: "/invest/off-plan" }, { name: "Orakzai Commercial Plaza", status: "Delivered", route: "/market/properties" }, { name: "Capital Arc Residences", status: "Under construction", route: "/invest/off-plan" }, { name: "Lakefront Estates", status: "Launching", route: "/invest/off-plan" }],
    leadership: ["Faisal Orakzai · Founder & Chairman", "Ayesha Khan · Chief Development Officer", "Hamid Raza · Director, Construction"],
    specialties: ["Institutional governance", "Luxury residential", "Mixed-use districts", "Asset-backed investment"],
    feedback: [{ quote: "Clear documentation, consistent updates, and a well-managed handover process.", author: "Nadia A. · Orakzai Heights owner" }, { quote: "The project team communicates like a serious long-term operator.", author: "Usman K. · Commercial investor" }],
  },
  {
    id: "northstar-urban",
    name: "Northstar Urban Group",
    headquarters: "Islamabad, Pakistan",
    city: "Islamabad",
    category: "Township & Master Developers",
    approval: "CDA Approved",
    delivered: 21,
    active: 6,
    rating: 4.8,
    reviews: 410,
    years: 24,
    cover: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=85",
    about: "A master-planning platform creating connected residential communities with parks, education, retail, and infrastructure delivered in sequenced phases.",
    projects: [{ name: "Capital Greens Residences", status: "Delivered", route: "/invest/investments/installments" }, { name: "Northstar Enclave", status: "Under construction", route: "/invest/off-plan" }, { name: "Park Road Commercial", status: "Launching", route: "/market/properties" }],
    leadership: ["Muneeb Shah · Group Chief Executive", "Sara Ahmed · Head of Master Planning", "Bilal Tariq · Director, Investor Relations"],
    specialties: ["Master communities", "Infrastructure delivery", "Family housing", "Retail destinations"],
    feedback: [{ quote: "The community planning feels complete rather than piecemeal.", author: "Farah S. · Capital Greens resident" }, { quote: "The reporting pack gives investors a useful view of each phase.", author: "Ali M. · Investor" }],
  },
  {
    id: "metropolitan-holdings",
    name: "Metropolitan Holdings",
    headquarters: "Lahore, Pakistan",
    city: "Lahore",
    category: "Commercial Specialists",
    approval: "LDA / NOC Approved",
    delivered: 16,
    active: 3,
    rating: 4.7,
    reviews: 185,
    years: 15,
    cover: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1400&q=85",
    about: "A commercial property specialist focused on retail, office, and hospitality assets in established urban corridors with tenant-led underwriting.",
    projects: [{ name: "Metro Square Business District", status: "Delivered", route: "/market/megaprojects" }, { name: "Gulberg Prime District", status: "Under construction", route: "/invest/off-plan" }, { name: "Metropolitan Mall", status: "Launching", route: "/market/megaprojects" }],
    leadership: ["Naveed Iqbal · Managing Director", "Mariam Hussain · Head of Capital Markets", "Omer Farooq · Director, Asset Management"],
    specialties: ["Commercial leasing", "Retail destinations", "Office assets", "Tenant-led underwriting"],
    feedback: [{ quote: "Their leasing and asset-management team stays close to operating performance.", author: "Hassan R. · Retail partner" }, { quote: "A reliable commercial specialist with a visible delivery record.", author: "Sana J. · Investor" }],
  },
  {
    id: "royal-crescent",
    name: "Royal Crescent Estates",
    headquarters: "Karachi, Pakistan",
    city: "Karachi",
    category: "Luxury High-Rise",
    approval: "KDA Approved",
    delivered: 9,
    active: 2,
    rating: 4.6,
    reviews: 132,
    years: 11,
    cover: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85",
    about: "A design-forward residential developer known for amenity-rich towers, hospitality-inspired service, and carefully curated waterfront and urban locations.",
    projects: [{ name: "Crescent One Residences", status: "Delivered", route: "/market/properties" }, { name: "Marina Heights", status: "Pre-launch", route: "/invest/off-plan" }],
    leadership: ["Hira Malik · Chief Executive Officer", "Danish Qureshi · Design Director", "Rayan Ali · Head of Delivery"],
    specialties: ["Luxury high-rise", "Waterfront residences", "Hospitality service", "Interior design"],
    feedback: [{ quote: "The finished residences match the quality promised at launch.", author: "Zara H. · Homeowner" }, { quote: "A polished team with strong attention to design and resident experience.", author: "Kashif N. · Buyer" }],
  },
];

function DeveloperModal({ developer, initialTab, close }: { developer: Developer; initialTab: "portfolio" | "contact"; close: () => void }) {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState(initialTab);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("Please share the corporate profile and current project availability.");
  const downloadProfile = () => {
    const text = ["OKZBYTE DEVELOPER PROFILE", `Company: ${developer.name}`, `Headquarters: ${developer.headquarters}`, `Approval: ${developer.approval}`, `Delivered: ${developer.delivered}+`, `Active: ${developer.active}`, `Rating: ${developer.rating} (${developer.reviews}+ reviews)`, "", developer.about, "", "Projects:", ...developer.projects.map((project) => `- ${project.name} · ${project.status}`)].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${developer.id}-corporate-profile.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const connect = () => {
    const inquiry = { developer: developer.id, name, message, createdAt: new Date().toISOString() };
    localStorage.setItem("okzbyte_developer_inquiry", JSON.stringify(inquiry));
    setSubmitted(true);
  };
  if (submitted) {
    return <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,.82)" }}><div onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 600, padding: 18, borderRadius: "22px 22px 0 0", background: PANEL, border: `1px solid ${LINE}`, color: TEXT }}><div style={{ display: "flex", justifyContent: "flex-end" }}><button onClick={close} style={{ border: 0, background: "transparent", color: DIM }}><X size={20} /></button></div><div style={{ marginTop: 8, padding: 20, borderRadius: 14, background: `${GREEN}0d`, border: `1px solid ${GREEN}42`, textAlign: "center" }}><Check size={36} color={GREEN} /><h3 style={{ margin: "9px 0 4px", fontSize: 19 }}>Developer request ready</h3><p style={{ color: DIM, fontSize: 11, lineHeight: 1.5 }}>The corporate brochure request and your inquiry have been prepared for the developer support desk.</p><div style={{ padding: 12, borderRadius: 10, background: CARD, textAlign: "left", fontSize: 10, lineHeight: 1.7 }}><strong>Inquiry ID: OKZ-DEV-{developer.id.toUpperCase()}-{Date.now().toString().slice(-5)}</strong><br /><span style={{ color: DIM }}>{developer.name} · {developer.approval}<br />Brochure request: Included · Direct conversation: Ready</span></div><button onClick={() => navigate(`/inbox/1?context=developer-${developer.id}`)} style={{ marginTop: 14, padding: "11px 20px", border: 0, borderRadius: 10, background: GOLD, color: "#07100a", fontWeight: 900 }}>Open Developer Inbox</button></div></div></div>;
  }
  return <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,.82)" }}><div onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 620, maxHeight: "95dvh", overflowY: "auto", padding: 18, borderRadius: "22px 22px 0 0", background: PANEL, border: `1px solid ${LINE}`, color: TEXT }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><div style={{ color: PURPLE, fontSize: 10, fontWeight: 900, letterSpacing: ".14em" }}>CORPORATE SHOWCASE</div><h2 style={{ margin: "7px 0 3px", fontSize: 19 }}>{developer.name}</h2><div style={{ color: DIM, fontSize: 11 }}><MapPin size={11} style={{ verticalAlign: "-1px" }} /> {developer.headquarters} · {developer.approval}</div></div><button onClick={close} style={{ border: 0, background: "transparent", color: DIM }}><X size={20} /></button></div><div style={{ display: "flex", gap: 7, marginTop: 14 }}><button onClick={() => setTab("portfolio")} style={{ flex: 1, padding: 10, borderRadius: 9, border: `1px solid ${tab === "portfolio" ? PURPLE : LINE}`, background: tab === "portfolio" ? `${PURPLE}16` : CARD, color: tab === "portfolio" ? PURPLE : DIM, fontSize: 10, fontWeight: 900 }}>Portfolio & Track Record</button><button onClick={() => setTab("contact")} style={{ flex: 1, padding: 10, borderRadius: 9, border: `1px solid ${tab === "contact" ? GOLD : LINE}`, background: tab === "contact" ? `${GOLD}16` : CARD, color: tab === "contact" ? GOLD : DIM, fontSize: 10, fontWeight: 900 }}>Direct Contact</button></div>{tab === "portfolio" ? <div style={{ marginTop: 14 }}><img src={developer.cover} alt={developer.name} style={{ width: "100%", height: 170, objectFit: "cover", borderRadius: 13, display: "block" }} /><div style={{ marginTop: 11, padding: 12, borderRadius: 11, background: CARD, border: `1px solid ${LINE}`, color: DIM, fontSize: 11, lineHeight: 1.6 }}>{developer.about}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>{developer.leadership.map((leader) => <div key={leader} style={{ padding: 10, borderRadius: 9, background: CARD, color: DIM, fontSize: 10 }}><Users size={13} color={PURPLE} style={{ verticalAlign: "-3px", marginRight: 4 }} />{leader}</div>)}</div><div style={{ marginTop: 13, color: PURPLE, fontSize: 10, fontWeight: 900, letterSpacing: ".12em" }}>PROJECT PORTFOLIO</div><div style={{ display: "grid", gap: 7, marginTop: 8 }}>{developer.projects.map((project) => <button key={project.name} onClick={() => navigate(project.route)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: 11, borderRadius: 9, border: `1px solid ${LINE}`, background: CARD, color: TEXT, textAlign: "left" }}><span><strong style={{ display: "block", fontSize: 11 }}>{project.name}</strong><small style={{ color: DIM, fontSize: 9 }}>{project.status}</small></span><ExternalLink size={14} color={BLUE} /></button>)}</div><div style={{ marginTop: 13, color: PURPLE, fontSize: 10, fontWeight: 900, letterSpacing: ".12em" }}>CUSTOMER FEEDBACK</div><div style={{ display: "grid", gap: 8, marginTop: 8 }}>{developer.feedback.map((review) => <div key={review.author} style={{ padding: 11, borderRadius: 10, background: `${PURPLE}0d`, border: `1px solid ${PURPLE}26`, fontSize: 10, lineHeight: 1.5 }}><Star size={12} color={GOLD} fill={GOLD} style={{ verticalAlign: "-2px", marginRight: 4 }} />{review.quote}<div style={{ color: DIM, marginTop: 5 }}>{review.author}</div></div>)}</div><div style={{ display: "flex", gap: 8, marginTop: 13 }}><button onClick={downloadProfile} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${LINE}`, background: CARD, color: DIM, fontSize: 10, fontWeight: 900 }}><Download size={13} style={{ verticalAlign: "-3px", marginRight: 4 }} />Download Profile</button><button onClick={() => setTab("contact")} style={{ flex: 1, padding: 10, border: 0, borderRadius: 10, background: GOLD, color: "#07100a", fontSize: 10, fontWeight: 900 }}>Connect with Developer</button></div></div> : <div style={{ marginTop: 14 }}><div style={{ padding: 12, borderRadius: 11, background: `${GOLD}0d`, border: `1px solid ${GOLD}30`, color: DIM, fontSize: 10, lineHeight: 1.5 }}><Mail size={14} color={GOLD} style={{ verticalAlign: "-3px", marginRight: 5 }} />Your request includes the corporate brochure, current project availability, and a direct conversation with the developer support desk.</div><label style={{ display: "block", marginTop: 13, color: DIM, fontSize: 10 }}>YOUR NAME<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 5, padding: 11, borderRadius: 9, border: `1px solid ${LINE}`, background: CARD, color: TEXT }} /></label><label style={{ display: "block", marginTop: 10, color: DIM, fontSize: 10 }}>MESSAGE<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 5, padding: 11, borderRadius: 9, border: `1px solid ${LINE}`, background: CARD, color: TEXT, resize: "vertical" }} /></label><div style={{ display: "flex", gap: 8, marginTop: 12 }}><button onClick={() => window.open("tel:+9221111222333")} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${LINE}`, background: CARD, color: DIM, fontSize: 10, fontWeight: 900 }}><Phone size={13} style={{ verticalAlign: "-3px", marginRight: 4 }} />Call Desk</button><button onClick={connect} disabled={!name.trim()} style={{ flex: 1, padding: 10, border: 0, borderRadius: 10, background: name.trim() ? GOLD : "#334052", color: name.trim() ? "#07100a" : DIM, fontSize: 10, fontWeight: 900 }}><MessageCircle size={13} style={{ verticalAlign: "-3px", marginRight: 4 }} />Connect & Request Brochure</button></div></div>}</div></div>;
}

export default function DeveloperShowcases() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All Developers");
  const [city, setCity] = useState("All Cities");
  const [track, setTrack] = useState("All Track Records");
  const [selected, setSelected] = useState<{ developer: Developer; tab: "portfolio" | "contact" } | null>(null);
  const visible = useMemo(() => developers.filter((developer) => `${developer.name} ${developer.headquarters} ${developer.approval}`.toLowerCase().includes(query.toLowerCase()) && (category === "All Developers" || developer.category === category) && (city === "All Cities" || developer.city === city) && (track === "All Track Records" || (track === "10+ Completed Projects" ? developer.delivered >= 10 : developer.approval === "Government Registered"))), [query, category, city, track]);
  const open = (developer: Developer, tab: "portfolio" | "contact") => setSelected({ developer, tab });
  return <main style={{ minHeight: "100dvh", padding: "10px 14px calc(96px + env(safe-area-inset-bottom))", background: BG, color: TEXT, fontFamily: "Inter, Plus Jakarta Sans, sans-serif" }}><div style={{ maxWidth: 760, margin: "0 auto" }}><header style={{ display: "flex", alignItems: "center", gap: 11, height: 55, borderBottom: `1px solid ${LINE}` }}><button onClick={() => navigate("/market/services")} style={{ border: 0, background: "transparent", color: DIM, padding: 6 }}><ArrowLeft size={21} /></button><div><span style={{ display: "block", color: PURPLE, fontSize: 10, fontWeight: 900, letterSpacing: ".14em" }}>BUILDER INTELLIGENCE</span><h1 style={{ margin: "4px 0 0", fontSize: 21 }}>Developer Showcases</h1></div></header><section style={{ marginTop: 15, padding: 13, borderRadius: 15, background: PANEL, border: `1px solid ${LINE}` }}><div style={{ position: "relative" }}><Building2 size={16} color={DIM} style={{ position: "absolute", left: 11, top: 12 }} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search developer, city, or approval..." style={{ width: "100%", boxSizing: "border-box", padding: "11px 11px 11px 36px", borderRadius: 10, border: `1px solid ${LINE}`, background: CARD, color: TEXT }} /></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 9 }}><GlobalCityPicker value={city === "All Cities" ? "" : city} allLabel="All Cities" placeholder="All Cities" onChange={(value) => setCity(value || "All Cities")} style={{ width: "100%" }} /><select value={track} onChange={(event) => setTrack(event.target.value)} style={{ width: "100%", padding: 10, borderRadius: 9, border: `1px solid ${LINE}`, background: CARD, color: TEXT }}><option>All Track Records</option><option>10+ Completed Projects</option><option>Government Registered</option></select></div></section><div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "14px 0 8px" }}>{categories.map((item) => <button key={item} onClick={() => setCategory(item)} style={{ flexShrink: 0, whiteSpace: "nowrap", padding: "9px 11px", borderRadius: 10, border: `1px solid ${category === item ? `${PURPLE}99` : LINE}`, background: category === item ? `${PURPLE}16` : PANEL, color: category === item ? PURPLE : DIM, fontSize: 10, fontWeight: 800 }}>{item}</button>)}</div><section style={{ display: "flex", justifyContent: "space-between", alignItems: "end", margin: "14px 0 11px" }}><div><div style={{ color: PURPLE, fontSize: 10, fontWeight: 900, letterSpacing: ".12em" }}>VERIFIED BUILDER NETWORK</div><h2 style={{ margin: "5px 0 0", fontSize: 18 }}>Compare the teams behind the assets</h2></div><span style={{ color: DIM, fontSize: 10 }}>{visible.length} developers</span></section><div style={{ display: "grid", gap: 13 }}>{visible.map((developer) => <article key={developer.id} style={{ overflow: "hidden", borderRadius: 16, background: CARD, border: `1px solid ${LINE}` }}><div style={{ position: "relative" }}><img src={developer.cover} alt={developer.name} style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} /><div style={{ position: "absolute", left: 11, bottom: 10, display: "flex", gap: 6, flexWrap: "wrap" }}><span style={{ padding: "6px 8px", borderRadius: 8, background: "rgba(0,0,0,.76)", color: GREEN, fontSize: 9, fontWeight: 900 }}><ShieldCheck size={11} style={{ verticalAlign: "-2px", marginRight: 3 }} />Verified Builder</span><span style={{ padding: "6px 8px", borderRadius: 8, background: "rgba(0,0,0,.76)", color: GOLD, fontSize: 9, fontWeight: 900 }}>{developer.approval}</span></div></div><div style={{ padding: 14 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><h3 style={{ margin: 0, fontSize: 16 }}>{developer.name}</h3><div style={{ display: "flex", alignItems: "center", gap: 4, color: DIM, fontSize: 10, marginTop: 5 }}><MapPin size={13} />{developer.headquarters}</div></div><div style={{ textAlign: "right", whiteSpace: "nowrap" }}><strong style={{ color: GOLD, fontSize: 14 }}><Star size={13} fill={GOLD} style={{ verticalAlign: "-2px", marginRight: 3 }} />{developer.rating}</strong><small style={{ display: "block", color: DIM, fontSize: 9 }}>{developer.reviews}+ reviews</small></div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginTop: 12 }}><div style={{ padding: 9, borderRadius: 9, background: `${GREEN}0d` }}><div style={{ color: DIM, fontSize: 9 }}>Delivered</div><strong style={{ display: "block", marginTop: 4, color: GREEN, fontSize: 14 }}>{developer.delivered}+</strong></div><div style={{ padding: 9, borderRadius: 9, background: PANEL }}><div style={{ color: DIM, fontSize: 9 }}>Active</div><strong style={{ display: "block", marginTop: 4, fontSize: 14 }}>{developer.active}</strong></div><div style={{ padding: 9, borderRadius: 9, background: PANEL }}><div style={{ color: DIM, fontSize: 9 }}>Experience</div><strong style={{ display: "block", marginTop: 4, fontSize: 14 }}>{developer.years} yrs</strong></div></div><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 11 }}>{developer.projects.slice(0, 3).map((project) => <span key={project.name} style={{ padding: "6px 8px", borderRadius: 8, background: `${PURPLE}12`, color: PURPLE, fontSize: 9, fontWeight: 800 }}>{project.name}</span>)}</div><div style={{ display: "flex", gap: 8, marginTop: 13 }}><button onClick={() => open(developer, "portfolio")} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${PURPLE}66`, background: `${PURPLE}12`, color: PURPLE, fontSize: 10, fontWeight: 900 }}>View Portfolio</button><button onClick={() => open(developer, "contact")} style={{ flex: 1, padding: 10, border: 0, borderRadius: 10, background: GOLD, color: "#07100a", fontSize: 10, fontWeight: 900 }}>Direct Contact</button></div></div></article>)}</div>{visible.length === 0 && <div style={{ padding: 28, marginTop: 12, borderRadius: 14, background: CARD, border: `1px solid ${LINE}`, textAlign: "center", color: DIM, fontSize: 12 }}>No developers match the selected search or filters.</div>}<div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16, padding: 12, borderRadius: 12, background: PANEL, border: `1px solid ${LINE}`, color: DIM, fontSize: 10, lineHeight: 1.5 }}><ShieldCheck size={16} color={GREEN} />Review approvals, completed delivery, active sites, leadership, and customer feedback before connecting with a builder.</div></div>{selected && <DeveloperModal developer={selected.developer} initialTab={selected.tab} close={() => setSelected(null)} />}</main>;
}
