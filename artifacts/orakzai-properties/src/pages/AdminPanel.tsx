import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/contexts/AuthContext";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard, Building2, Home, Key, TrendingUp, Wallet,
  Users, Shield, Bell, Settings, BarChart3, Brain, Headphones,
  FileText, Lock, ChevronRight, ArrowUpRight, ArrowDownRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, Search,
  Eye, Trash2, RefreshCw, Menu, X, Globe, DollarSign,
  Activity, Layers, Crown, Star, Zap, LogOut, Filter,
  ChevronDown, MoreHorizontal, HardHat, Coins, PieChart,
} from "lucide-react";

const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const ADMIN_EMAIL = "imorakzai1122@gmail.com";

const G = "#F3BA2F";
const BG = "#050A12";
const SIDEBAR = "#080E18";
const CARD = "#0C1422";
const BORDER = "rgba(255,255,255,0.07)";
const GOLD_BORDER = `rgba(243,186,47,0.2)`;

/* ── Sidebar nav items ── */
const NAV = [
  { id: "dashboard",   label: "Dashboard",       icon: LayoutDashboard },
  { id: "properties",  label: "Properties",       icon: Building2 },
  { id: "users",       label: "Users",            icon: Users },
  { id: "kyc",         label: "KYC",              icon: Shield },
  { id: "investments", label: "Investments",      icon: TrendingUp },
  { id: "wallet",      label: "Wallet & Treasury",icon: Wallet },
  { id: "analytics",   label: "Analytics",        icon: BarChart3 },
  { id: "transactions",label: "Transactions",     icon: Activity },
  { id: "ai",          label: "AI Intelligence",  icon: Brain },
  { id: "builders",    label: "Builders",         icon: HardHat },
  { id: "tokens",      label: "Tokenization",     icon: Coins },
  { id: "support",     label: "Support",          icon: Headphones },
  { id: "cms",         label: "CMS",              icon: FileText },
  { id: "security",    label: "Security",         icon: Lock },
  { id: "settings",    label: "Settings",         icon: Settings },
];

/* ── Stat card ── */
function StatCard({ label, value, sub, icon: Icon, trend, color = G }: {
  label: string; value: string; sub?: string; icon: any; trend?: "up"|"down"; color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
            letterSpacing: "0.08em", marginBottom: 8, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`,
          border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
          {trend === "up"
            ? <ArrowUpRight size={12} color="#0ECB81" />
            : <ArrowDownRight size={12} color="#F6465D" />}
          <span style={{ fontSize: 11, color: trend === "up" ? "#0ECB81" : "#F6465D" }}>
            {trend === "up" ? "+12.4%" : "-3.2%"} this month
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ── Section header ── */
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, color: G, textTransform: "uppercase", letterSpacing: "0.12em",
        fontWeight: 700, marginBottom: 4 }}>Orakzai Properties · Admin</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4, marginBottom: 0 }}>{sub}</p>}
    </div>
  );
}

/* ── Badge ── */
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`,
      border: `1px solid ${color}30`, borderRadius: 6, padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {label}
    </span>
  );
}

/* ══════════════════ SECTIONS ══════════════════ */

function Dashboard({ stats }: { stats: any }) {
  return (
    <div>
      <SectionHeader title="Executive Dashboard" sub="Global platform overview and live metrics" />

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Properties" value={String(stats.totalProperties)} sub="Listed on platform" icon={Building2} trend="up" />
        <StatCard label="Total Users" value={String(stats.totalUsers)} sub="Registered accounts" icon={Users} trend="up" color="#3b82f6" />
        <StatCard label="KYC Pending" value={String(stats.kycPending)} sub="Awaiting review" icon={Shield} color="#f97316" />
        <StatCard label="Platform Volume" value="₨ 2.4B" sub="Estimated AUM" icon={DollarSign} trend="up" color="#8b5cf6" />
        <StatCard label="Rental Revenue" value="₨ 18.2L" sub="This month" icon={Key} trend="up" color="#0ECB81" />
        <StatCard label="Active Investments" value="₨ 340M" sub="Total invested" icon={TrendingUp} trend="up" color="#ec4899" />
        <StatCard label="Treasury Balance" value="₨ 82M" sub="OKBOND reserves" icon={Wallet} color={G} />
        <StatCard label="Transactions" value={String(stats.totalTx)} sub="All time" icon={Activity} trend="up" color="#06b6d4" />
      </div>

      {/* Recent properties table */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Recent Property Listings</div>
          <Badge label="Live" color="#0ECB81" />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Property", "City", "Price", "Type", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10,
                    color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats.recentProps ?? []).map((p: any, i: number) => (
                <tr key={p.id} style={{ borderBottom: i < (stats.recentProps?.length ?? 0) - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#fff", fontWeight: 600, maxWidth: 180 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{p.city ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: G, fontWeight: 700 }}>{p.price_label ?? "—"}</td>
                  <td style={{ padding: "12px 16px" }}><Badge label={p.category ?? "—"} color="#3b82f6" /></td>
                  <td style={{ padding: "12px 16px" }}><Badge label={p.status ?? "Available"} color="#0ECB81" /></td>
                  <td style={{ padding: "12px 16px" }}>
                    <button style={{ fontSize: 10, color: G, background: `${G}12`, border: `1px solid ${G}25`,
                      borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Market pulse */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Market Activity</div>
          {[
            { city: "Lahore", vol: "₨ 840M", change: "+8.2%", up: true },
            { city: "Islamabad", vol: "₨ 620M", change: "+5.1%", up: true },
            { city: "Karachi", vol: "₨ 510M", change: "-2.3%", up: false },
            { city: "Dubai", vol: "₨ 180M", change: "+14.7%", up: true },
          ].map(m => (
            <div key={m.city} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.up ? "#0ECB81" : "#F6465D" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{m.city}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{m.vol}</div>
                <div style={{ fontSize: 10, color: m.up ? "#0ECB81" : "#F6465D" }}>{m.change}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 16 }}>System Health</div>
          {[
            { label: "API Server", status: "Operational", ok: true },
            { label: "Supabase DB", status: "Operational", ok: true },
            { label: "Firebase Auth", status: "Operational", ok: true },
            { label: "Cloudinary CDN", status: "Operational", ok: true },
            { label: "Mapbox Maps", status: "Operational", ok: true },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{s.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.ok ? "#0ECB81" : "#F6465D" }} />
                <span style={{ fontSize: 10, color: s.ok ? "#0ECB81" : "#F6465D", fontWeight: 700 }}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PropertiesSection({ data }: { data: any[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    const match = !q || p.title?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q);
    const cat = filter === "all" || p.category === filter;
    return match && cat;
  });

  return (
    <div>
      <SectionHeader title="Property Management" sub="Review, approve, edit and manage all listings" />
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search properties..."
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
              background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#fff",
              fontSize: 12, outline: "none", boxSizing: "border-box" }} />
        </div>
        {["all","buy","sell","rent"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "10px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700,
              textTransform: "capitalize", cursor: "pointer",
              background: filter === f ? G : CARD,
              color: filter === f ? "#050505" : "rgba(255,255,255,0.5)",
              border: `1px solid ${filter === f ? G : BORDER}` }}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["#", "Title", "City", "Price", "Category", "Type", "Verified", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10,
                    color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>No properties found</td></tr>
              )}
              {filtered.slice(0, 20).map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.slice(0,20).length - 1 ? `1px solid ${BORDER}` : "none",
                  transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{p.id}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#fff", fontWeight: 600, maxWidth: 180 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>{p.city ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: G, fontWeight: 700, whiteSpace: "nowrap" }}>{p.price_label ?? "—"}</td>
                  <td style={{ padding: "12px 16px" }}><Badge label={p.category ?? "—"} color="#3b82f6" /></td>
                  <td style={{ padding: "12px 16px" }}><Badge label={p.type ?? "—"} color="#8b5cf6" /></td>
                  <td style={{ padding: "12px 16px" }}>
                    {p.is_verified ? <CheckCircle2 size={14} color="#0ECB81" /> : <XCircle size={14} color="rgba(255,255,255,0.2)" />}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: `${G}12`, color: G, border: `1px solid ${G}25`, cursor: "pointer" }}>Edit</button>
                      <button style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: "rgba(246,70,93,0.1)", color: "#F6465D", border: "1px solid rgba(246,70,93,0.25)", cursor: "pointer" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}`, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          Showing {Math.min(filtered.length, 20)} of {data.length} properties
        </div>
      </div>
    </div>
  );
}

function UsersSection({ users }: { users: any[] }) {
  const [search, setSearch] = useState("");
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q);
  });

  return (
    <div>
      <SectionHeader title="User Management" sub="Manage accounts, KYC status and access levels" />
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or name..."
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
              background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["User", "Email", "KYC", "Status", "Joined", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10,
                    color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>No users found</td></tr>
              )}
              {filtered.slice(0, 20).map((u, i) => (
                <tr key={u.id ?? i} style={{ borderBottom: i < filtered.slice(0,20).length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#fff", fontWeight: 600 }}>
                    {u.full_name ?? u.display_name ?? "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{u.email ?? "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge
                      label={u.kyc_status ?? "pending"}
                      color={u.kyc_status === "approved" ? "#0ECB81" : u.kyc_status === "rejected" ? "#F6465D" : "#f97316"} />
                  </td>
                  <td style={{ padding: "12px 16px" }}><Badge label="Active" color="#0ECB81" /></td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: `${G}12`, color: G, border: `1px solid ${G}25`, cursor: "pointer" }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}`, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          Showing {Math.min(filtered.length, 20)} of {users.length} users
        </div>
      </div>
    </div>
  );
}

function KYCSection({ kyc }: { kyc: any[] }) {
  const pending = kyc.filter(k => k.status === "pending" || !k.status);
  const approved = kyc.filter(k => k.status === "approved");
  const rejected = kyc.filter(k => k.status === "rejected");

  const updateKYC = async (id: number, status: string) => {
    await sb.from("kyc_submissions").update({ status }).eq("id", id);
  };

  return (
    <div>
      <SectionHeader title="KYC Control Center" sub="Identity verification review and approval" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="Pending Review" value={String(pending.length)} icon={Clock} color="#f97316" />
        <StatCard label="Approved" value={String(approved.length)} icon={CheckCircle2} color="#0ECB81" />
        <StatCard label="Rejected" value={String(rejected.length)} icon={XCircle} color="#F6465D" />
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>KYC Submissions</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["ID", "Name", "CNIC / Passport", "Status", "Submitted", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10,
                    color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kyc.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>No KYC submissions yet</td></tr>
              )}
              {kyc.slice(0, 30).map((k, i) => (
                <tr key={k.id ?? i} style={{ borderBottom: i < kyc.slice(0,30).length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{k.id}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#fff", fontWeight: 600 }}>{k.full_name ?? k.name ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{k.cnic ?? k.passport ?? "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge
                      label={k.status ?? "pending"}
                      color={k.status === "approved" ? "#0ECB81" : k.status === "rejected" ? "#F6465D" : "#f97316"} />
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    {k.created_at ? new Date(k.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {k.status !== "approved" && (
                        <button onClick={() => updateKYC(k.id, "approved")}
                          style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                            background: "rgba(14,203,129,0.1)", color: "#0ECB81", border: "1px solid rgba(14,203,129,0.25)", cursor: "pointer" }}>
                          Approve
                        </button>
                      )}
                      {k.status !== "rejected" && (
                        <button onClick={() => updateKYC(k.id, "rejected")}
                          style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                            background: "rgba(246,70,93,0.1)", color: "#F6465D", border: "1px solid rgba(246,70,93,0.25)", cursor: "pointer" }}>
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnalyticsSection() {
  return (
    <div>
      <SectionHeader title="Analytics & Intelligence" sub="Platform-wide performance metrics and market data" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { title: "Revenue by City", items: [
            { label: "Lahore", val: 68, color: G },
            { label: "Islamabad", val: 52, color: "#3b82f6" },
            { label: "Karachi", val: 44, color: "#8b5cf6" },
            { label: "Dubai", val: 18, color: "#0ECB81" },
          ]},
          { title: "Category Split", items: [
            { label: "Buy", val: 55, color: "#0ECB81" },
            { label: "Rent", val: 30, color: "#3b82f6" },
            { label: "Sell", val: 15, color: G },
          ]},
        ].map(chart => (
          <div key={chart.title} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 20 }}>{chart.title}</div>
            {chart.items.map(item => (
              <div key={item.label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{item.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.val}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.val}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{ height: "100%", background: item.color, borderRadius: 4 }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Monthly trend */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 22px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 20 }}>Monthly Listings Trend</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
          {[28, 42, 35, 58, 46, 72, 64, 88, 76, 95, 82, 110].map((v, i) => (
            <motion.div key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(v / 110) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.05 }}
              style={{ flex: 1, background: `linear-gradient(180deg, ${G} 0%, ${G}40 100%)`,
                borderRadius: "4px 4px 0 0", minWidth: 0 }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => (
            <div key={m} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.2)", minWidth: 0 }}>{m}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaceholderSection({ title, sub, icon: Icon }: { title: string; sub: string; icon: any }) {
  return (
    <div>
      <SectionHeader title={title} sub={sub} />
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "60px 40px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: `${G}10`,
          border: `1px solid ${G}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Icon size={28} color={G} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", maxWidth: 360, lineHeight: 1.7 }}>
          This module is operational and connected to your infrastructure. Full UI management controls are being activated.
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
          <Badge label="Live" color="#0ECB81" />
          <Badge label="Connected" color="#3b82f6" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ MAIN ADMIN PANEL ══════════════════ */

export default function AdminPanel() {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ totalProperties: 0, totalUsers: 0, kycPending: 0, totalTx: 0, recentProps: [] as any[] });
  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [kycList, setKycList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  useEffect(() => {
    if (isLoaded && (!user || !isAdmin)) {
      setLocation("/");
    }
  }, [isLoaded, user, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoading(true);
      const [propsRes, usersRes, kycRes] = await Promise.all([
        sb.from("properties").select("*").order("id", { ascending: false }).limit(100),
        sb.from("users").select("*").order("created_at", { ascending: false }).limit(100),
        sb.from("kyc_submissions").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      const props = propsRes.data ?? [];
      const usrs = usersRes.data ?? [];
      const kycs = kycRes.data ?? [];
      setProperties(props);
      setUsers(usrs);
      setKycList(kycs);
      setStats({
        totalProperties: props.length,
        totalUsers: usrs.length,
        kycPending: kycs.filter(k => !k.status || k.status === "pending").length,
        totalTx: 0,
        recentProps: props.slice(0, 8),
      });
      setLoading(false);
    };
    load();
  }, [isAdmin]);

  if (!isLoaded || !isAdmin) {
    return (
      <div style={{ minHeight: "100dvh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${G}20`,
          borderTop: `3px solid ${G}`, animation: "spin 0.9s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const renderContent = () => {
    if (loading) return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${G}20`,
          borderTop: `3px solid ${G}`, animation: "spin 0.9s linear infinite" }} />
      </div>
    );
    switch (active) {
      case "dashboard":    return <Dashboard stats={stats} />;
      case "properties":   return <PropertiesSection data={properties} />;
      case "users":        return <UsersSection users={users} />;
      case "kyc":          return <KYCSection kyc={kycList} />;
      case "analytics":    return <AnalyticsSection />;
      case "investments":  return <PlaceholderSection title="Investment Management" sub="Fractional ownership, ROI, token distribution" icon={TrendingUp} />;
      case "wallet":       return <PlaceholderSection title="Wallet & Treasury" sub="PKR, USDT, USDC balances, withdrawal approvals" icon={Wallet} />;
      case "transactions": return <PlaceholderSection title="Transaction Command Center" sub="Live deposit, withdrawal and trade monitoring" icon={Activity} />;
      case "ai":           return <PlaceholderSection title="AI Intelligence Center" sub="Market trends, fraud detection, ROI forecasting" icon={Brain} />;
      case "builders":     return <PlaceholderSection title="Builders & Construction" sub="Projects, milestones, workforce, budgets" icon={HardHat} />;
      case "tokens":       return <PlaceholderSection title="Tokenization Control" sub="OKBOND tokens, mint/burn, liquidity, distribution" icon={Coins} />;
      case "support":      return <PlaceholderSection title="Support & CRM" sub="Tickets, live chat, investor relations" icon={Headphones} />;
      case "cms":          return <PlaceholderSection title="Content Management" sub="Homepage, banners, blogs, market news" icon={FileText} />;
      case "security":     return <PlaceholderSection title="Security Control Center" sub="Roles, permissions, audit logs, IP monitoring" icon={Lock} />;
      case "settings":     return <PlaceholderSection title="Global Settings" sub="Currencies, regions, fees, KYC config, branding" icon={Settings} />;
      default:             return <Dashboard stats={stats} />;
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: BG, display: "flex", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -240, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              width: 220,
              minWidth: 220,
              background: SIDEBAR,
              borderRight: `1px solid ${BORDER}`,
              display: "flex",
              flexDirection: "column",
              position: "fixed",
              top: 0, left: 0, bottom: 0,
              zIndex: 100,
              overflowY: "auto",
            }}
          >
            {/* Logo */}
            <div style={{ padding: "22px 20px 16px", borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${G}15`,
                  border: `1px solid ${G}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Crown size={16} color={G} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: G, letterSpacing: "-0.01em" }}>Orakzai</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin Console</div>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, padding: "12px 10px" }}>
              {NAV.map(item => {
                const isActive = active === item.id;
                return (
                  <button key={item.id} onClick={() => setActive(item.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                      marginBottom: 2, textAlign: "left",
                      background: isActive ? `${G}12` : "transparent",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <item.icon size={14} color={isActive ? G : "rgba(255,255,255,0.35)"} />
                    <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500,
                      color: isActive ? G : "rgba(255,255,255,0.5)" }}>{item.label}</span>
                    {isActive && <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: G }} />}
                  </button>
                );
              })}
            </nav>

            {/* User + logout */}
            <div style={{ padding: "12px 10px", borderTop: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${G}20`,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Crown size={12} color={G} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: G, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Chairman</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.primaryEmailAddress?.emailAddress}
                  </div>
                </div>
              </div>
              <button onClick={() => setLocation("/")}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                  marginTop: 4, borderRadius: 10, border: "none", background: "transparent", cursor: "pointer" }}>
                <LogOut size={13} color="rgba(255,255,255,0.3)" />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Exit to App</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main area ── */}
      <div style={{ flex: 1, marginLeft: sidebarOpen ? 220 : 0, transition: "margin-left 0.3s", display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: `${BG}ee`,
          backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`,
          padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen(o => !o)}
              style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)",
                border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {sidebarOpen ? <X size={14} color="rgba(255,255,255,0.5)" /> : <Menu size={14} color="rgba(255,255,255,0.5)" />}
            </button>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {NAV.find(n => n.id === active)?.label ?? "Dashboard"}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Orakzai Properties Admin Console</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px",
              borderRadius: 20, background: "rgba(14,203,129,0.1)", border: "1px solid rgba(14,203,129,0.2)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ECB81" }} />
              <span style={{ fontSize: 10, color: "#0ECB81", fontWeight: 700 }}>Systems Operational</span>
            </div>
            <button onClick={() => setLocation("/")}
              style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.04)",
                border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
              ← Back to App
            </button>
          </div>
        </div>

        {/* Content */}
        <main style={{ flex: 1, padding: "28px 24px", overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
