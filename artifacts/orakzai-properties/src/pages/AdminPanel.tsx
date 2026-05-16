import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Profile, KYCStatus } from "@/lib/supabase";
import {
  LayoutDashboard, Building2, Key, TrendingUp, Wallet,
  Users, Shield, Settings, BarChart3, Brain, Headphones,
  FileText, Lock, CheckCircle2, XCircle, Clock, Search,
  Menu, X, DollarSign, Activity, Crown, LogOut,
  HardHat, Coins, AlertTriangle, RefreshCw, ChevronLeft,
  MapPin, Eye, Filter,
} from "lucide-react";

export const ADMIN_EMAIL = "imorakzai1122@gmail.com";

const G = "#F3BA2F";
const BG = "#050A12";
const SIDEBAR = "#07101E";
const CARD = "#0B1626";
const BORDER = "rgba(255,255,255,0.07)";

/* ── helpers ── */
function fmtPrice(n: number): string {
  if (!n || isNaN(n)) return "₨ 0";
  if (n >= 1_00_00_00_000) return `₨ ${(n / 1_00_00_00_000).toFixed(1)} Arab`;
  if (n >= 1_00_00_000)   return `₨ ${(n / 1_00_00_000).toFixed(1)} Cr`;
  if (n >= 1_00_000)      return `₨ ${(n / 1_00_000).toFixed(0)}L`;
  return `₨ ${n.toLocaleString()}`;
}
function pct(a: number, total: number): number {
  if (!total) return 0;
  return Math.round((a / total) * 100);
}

/* ── UI atoms ── */
const G_SPINNER = (
  <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${G}20`,
    borderTop: `3px solid ${G}`, animation: "spin 0.9s linear infinite" }} />
);

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`,
      border: `1px solid ${color}30`, borderRadius: 6, padding: "2px 8px",
      textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, color = G }: {
  label: string; value: string | number; sub?: string; icon: any; color?: string;
}) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
            letterSpacing: "0.09em", fontWeight: 700, marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 5 }}>{sub}</div>}
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}12`,
          border: `1px solid ${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} color={color} />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub, onRefresh }: { title: string; sub?: string; onRefresh?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
      <div>
        <div style={{ fontSize: 9, color: G, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 4 }}>
          Orakzai Properties · Admin
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
        {sub && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4, marginBottom: 0 }}>{sub}</p>}
      </div>
      {onRefresh && (
        <button onClick={onRefresh} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
          borderRadius: 8, background: CARD, border: `1px solid ${BORDER}`, cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          <RefreshCw size={12} />Refresh
        </button>
      )}
    </div>
  );
}

const NAV = [
  { id: "dashboard",    label: "Dashboard",        icon: LayoutDashboard },
  { id: "properties",   label: "Properties",        icon: Building2 },
  { id: "users",        label: "Users",             icon: Users },
  { id: "kyc",          label: "KYC Review",        icon: Shield },
  { id: "analytics",    label: "Analytics",         icon: BarChart3 },
  { id: "investments",  label: "Investments",       icon: TrendingUp },
  { id: "wallet",       label: "Wallet & Treasury", icon: Wallet },
  { id: "trades",       label: "Trades",            icon: Activity },
  { id: "builders",     label: "Builders",          icon: HardHat },
  { id: "tokens",       label: "Tokenization",      icon: Coins },
  { id: "support",      label: "Support",           icon: Headphones },
  { id: "cms",          label: "CMS",               icon: FileText },
  { id: "security",     label: "Security",          icon: Lock },
  { id: "settings",     label: "Settings",          icon: Settings },
];

/* ════════════════════════════════════════
   DATA HOOK — fetches everything from Supabase
   ════════════════════════════════════════ */
function useAdminData() {
  const [properties, setProperties] = useState<any[]>([]);
  const [profiles, setProfiles]     = useState<Profile[]>([]);
  const [trades, setTrades]         = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [propsRes, profilesRes, tradesRes, invRes] = await Promise.all([
        supabase.from("properties").select("*").order("id", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("trades").select("*").order("created_at", { ascending: false }),
        supabase.from("investment_projects").select("*"),
      ]);
      setProperties(propsRes.data ?? []);
      setProfiles(profilesRes.data ?? []);
      setTrades(tradesRes.data ?? []);
      setInvestments(invRes.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── derived stats from real data ── */
  const totalListedValue = properties.reduce((s, p) => s + (p.price ?? 0), 0);
  const totalRentValue   = properties.filter(p =>
    (p.category ?? "").toLowerCase() === "rent"
  ).reduce((s, p) => s + (p.price ?? 0), 0);

  const kycCounts = {
    pending:  profiles.filter(p => p.kyc_status === "pending_review" || p.kyc_status === "in_progress").length,
    approved: profiles.filter(p => p.kyc_status === "approved").length,
    rejected: profiles.filter(p => p.kyc_status === "rejected").length,
    not_started: profiles.filter(p => p.kyc_status === "not_started" || !p.kyc_status).length,
  };

  /* properties grouped by city — real data */
  const cityMap: Record<string, { count: number; value: number }> = {};
  properties.forEach(p => {
    const c = p.city ?? "Other";
    if (!cityMap[c]) cityMap[c] = { count: 0, value: 0 };
    cityMap[c].count++;
    cityMap[c].value += p.price ?? 0;
  });
  const citySorted = Object.entries(cityMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);

  /* properties grouped by category — real data */
  const catMap: Record<string, number> = {};
  properties.forEach(p => {
    const c = (p.category ?? "Other").trim();
    catMap[c] = (catMap[c] ?? 0) + 1;
  });

  /* monthly listing counts — real data — last 12 months */
  const now = new Date();
  const monthly: number[] = Array(12).fill(0);
  const monthLabels: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push(d.toLocaleString("default", { month: "short" }));
  }
  properties.forEach(p => {
    if (!p.created_at) return;
    const d = new Date(p.created_at);
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (monthsAgo >= 0 && monthsAgo < 12) {
      monthly[11 - monthsAgo]++;
    }
  });

  return {
    properties, profiles, trades, investments, loading, error, load,
    stats: {
      totalProps: properties.length,
      totalUsers: profiles.length,
      kycPending: kycCounts.pending,
      totalTrades: trades.length,
      totalListedValue,
      totalRentValue,
      totalInvestments: investments.length,
    },
    kycCounts, citySorted, catMap, monthly, monthLabels,
  };
}

/* ════════════════════════════════════════
   SECTIONS
   ════════════════════════════════════════ */

function Dashboard({ data }: { data: ReturnType<typeof useAdminData> }) {
  const { stats, properties, profiles } = data;
  if (data.loading) return <CenterSpinner />;

  return (
    <div>
      <SectionHeader title="Executive Dashboard" sub="Live metrics pulled from Supabase" onRefresh={data.load} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Properties" value={stats.totalProps} sub="Listed on platform" icon={Building2} />
        <StatCard label="Total Users" value={stats.totalUsers} sub="Registered profiles" icon={Users} color="#3b82f6" />
        <StatCard label="KYC Pending" value={stats.kycPending} sub="Awaiting review" icon={Shield} color="#f97316" />
        <StatCard label="Total Trades" value={stats.totalTrades} sub="All time" icon={Activity} color="#8b5cf6" />
        <StatCard label="Total Listed Value" value={fmtPrice(stats.totalListedValue)} sub="Sum of all property prices" icon={DollarSign} color="#0ECB81" />
        <StatCard label="Rental Portfolio" value={fmtPrice(stats.totalRentValue)} sub="Rental listings value" icon={Key} color="#ec4899" />
        <StatCard label="Investment Projects" value={stats.totalInvestments} sub="Active projects" icon={TrendingUp} color="#F3BA2F" />
      </div>

      {/* Recent properties */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Recently Listed Properties</span>
          <Badge label={`${stats.totalProps} total`} color={G} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Title", "City", "Price", "Category", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10,
                    color: "rgba(255,255,255,0.28)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {properties.length === 0
                ? <tr><td colSpan={5} style={{ padding: 28, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No properties in database</td></tr>
                : properties.slice(0, 8).map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < 7 ? `1px solid ${BORDER}` : "none" }}>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: "#fff", fontWeight: 600, maxWidth: 200 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title ?? "—"}</div>
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{p.city ?? "—"}</td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: G, fontWeight: 700 }}>{p.price_label ?? fmtPrice(p.price)}</td>
                    <td style={{ padding: "11px 16px" }}><Badge label={p.category ?? "—"} color="#3b82f6" /></td>
                    <td style={{ padding: "11px 16px" }}><Badge label={p.status ?? "Available"} color="#0ECB81" /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent KYC */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Recent KYC Submissions</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Name", "Email", "CNIC", "Status", "Submitted"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10,
                    color: "rgba(255,255,255,0.28)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0
                ? <tr><td colSpan={5} style={{ padding: 28, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No user profiles yet</td></tr>
                : profiles.slice(0, 6).map((p, i) => (
                  <tr key={p.id ?? i} style={{ borderBottom: i < 5 ? `1px solid ${BORDER}` : "none" }}>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: "#fff", fontWeight: 600 }}>{p.full_name ?? "—"}</td>
                    <td style={{ padding: "11px 16px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{p.email ?? "—"}</td>
                    <td style={{ padding: "11px 16px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{p.cnic ?? "—"}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <Badge label={p.kyc_status ?? "not_started"} color={
                        p.kyc_status === "approved" ? "#0ECB81" :
                        p.kyc_status === "rejected" ? "#F6465D" :
                        p.kyc_status === "pending_review" ? "#f97316" : "rgba(255,255,255,0.3)"
                      } />
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      {p.kyc_submitted_at ? new Date(p.kyc_submitted_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PropertiesSection({ properties, load }: { properties: any[]; load: () => void }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [deleting, setDeleting] = useState<number | null>(null);

  const filtered = properties.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || (p.title ?? "").toLowerCase().includes(q) || (p.city ?? "").toLowerCase().includes(q) || (p.location ?? "").toLowerCase().includes(q);
    const matchCat = catFilter === "all" || (p.category ?? "").toLowerCase() === catFilter;
    return matchQ && matchCat;
  });

  const categories = ["all", ...Array.from(new Set(properties.map(p => (p.category ?? "").toLowerCase()).filter(Boolean)))];

  const deleteProperty = async (id: number) => {
    if (!confirm("Delete this property? This cannot be undone.")) return;
    setDeleting(id);
    await supabase.from("properties").delete().eq("id", id);
    setDeleting(null);
    load();
  };

  return (
    <div>
      <SectionHeader title="Property Management" sub={`${properties.length} total listings in database`} onRefresh={load} />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={13} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, city…"
            style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, color: "#fff",
              fontSize: 12, outline: "none", boxSizing: "border-box" }} />
        </div>
        {categories.map(f => (
          <button key={f} onClick={() => setCatFilter(f)}
            style={{ padding: "9px 14px", borderRadius: 9, fontSize: 10, fontWeight: 700, cursor: "pointer",
              textTransform: "capitalize", background: catFilter === f ? G : CARD,
              color: catFilter === f ? "#050505" : "rgba(255,255,255,0.45)",
              border: `1px solid ${catFilter === f ? G : BORDER}` }}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["ID", "Title", "City", "Price", "Category", "Type", "Verified", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10,
                    color: "rgba(255,255,255,0.28)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={9} style={{ padding: 28, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No properties found</td></tr>
                : filtered.slice(0, 25).map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < filtered.slice(0, 25).length - 1 ? `1px solid ${BORDER}` : "none",
                    background: deleting === p.id ? "rgba(246,70,93,0.05)" : "transparent" }}>
                    <td style={{ padding: "11px 14px", fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>{p.id}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#fff", fontWeight: 600, maxWidth: 180 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title ?? "—"}</div>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{p.city ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: G, fontWeight: 700, whiteSpace: "nowrap" }}>{p.price_label ?? fmtPrice(p.price)}</td>
                    <td style={{ padding: "11px 14px" }}><Badge label={p.category ?? "—"} color="#3b82f6" /></td>
                    <td style={{ padding: "11px 14px" }}><Badge label={p.type ?? "—"} color="#8b5cf6" /></td>
                    <td style={{ padding: "11px 14px" }}>
                      {p.is_verified ? <CheckCircle2 size={14} color="#0ECB81" /> : <XCircle size={14} color="rgba(255,255,255,0.15)" />}
                    </td>
                    <td style={{ padding: "11px 14px" }}><Badge label={p.status ?? "Available"} color="#0ECB81" /></td>
                    <td style={{ padding: "11px 14px" }}>
                      <button onClick={() => deleteProperty(p.id)} disabled={deleting === p.id}
                        style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                          background: "rgba(246,70,93,0.1)", color: "#F6465D",
                          border: "1px solid rgba(246,70,93,0.25)", cursor: "pointer" }}>
                        {deleting === p.id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <div style={{ padding: "11px 16px", borderTop: `1px solid ${BORDER}`, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          Showing {Math.min(filtered.length, 25)} of {filtered.length} matching ({properties.length} total)
        </div>
      </div>
    </div>
  );
}

function UsersSection({ profiles, load }: { profiles: Profile[]; load: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = profiles.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.email ?? "").toLowerCase().includes(q) || (u.full_name ?? "").toLowerCase().includes(q) || (u.cnic ?? "").includes(q);
  });

  return (
    <div>
      <SectionHeader title="User Management" sub={`${profiles.length} registered profiles`} onRefresh={load} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Users" value={profiles.length} icon={Users} color="#3b82f6" />
        <StatCard label="KYC Approved" value={profiles.filter(p => p.kyc_status === "approved").length} icon={CheckCircle2} color="#0ECB81" />
        <StatCard label="KYC Pending" value={profiles.filter(p => p.kyc_status === "pending_review").length} icon={Clock} color="#f97316" />
        <StatCard label="Not Started" value={profiles.filter(p => !p.kyc_status || p.kyc_status === "not_started").length} icon={AlertTriangle} color="rgba(255,255,255,0.3)" />
      </div>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={13} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or CNIC…"
          style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, color: "#fff",
            fontSize: 12, outline: "none", boxSizing: "border-box" }} />
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Full Name", "Email", "Phone", "CNIC", "City", "KYC Status", "Joined"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10,
                    color: "rgba(255,255,255,0.28)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No users found</td></tr>
                : filtered.slice(0, 30).map((u, i) => (
                  <tr key={u.id ?? i} style={{ borderBottom: i < filtered.slice(0, 30).length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#fff", fontWeight: 600 }}>{u.full_name ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{u.email ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{u.phone ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{u.cnic ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{u.city ?? "—"}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <Badge label={u.kyc_status ?? "not_started"} color={
                        u.kyc_status === "approved" ? "#0ECB81" :
                        u.kyc_status === "rejected" ? "#F6465D" :
                        u.kyc_status === "pending_review" ? "#f97316" :
                        u.kyc_status === "in_progress" ? G : "rgba(255,255,255,0.25)"
                      } />
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <div style={{ padding: "11px 16px", borderTop: `1px solid ${BORDER}`, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          Showing {Math.min(filtered.length, 30)} of {filtered.length}
        </div>
      </div>
    </div>
  );
}

function KYCSection({ profiles, load }: { profiles: Profile[]; load: () => void }) {
  const [selected, setSelected] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [filterStatus, setFilterStatus] = useState<KYCStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = profiles.filter(p => {
    const statusMatch = filterStatus === "all" || p.kyc_status === filterStatus;
    const q = search.toLowerCase();
    const textMatch = !q || (p.full_name ?? "").toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q) || (p.cnic ?? "").includes(q);
    return statusMatch && textMatch;
  });

  const doUpdate = async (profile: Profile, status: KYCStatus, reason?: string) => {
    setBusy(true);
    await supabase.from("profiles").update({
      kyc_status: status,
      kyc_reviewed_at: new Date().toISOString(),
      kyc_rejection_reason: reason ?? null,
    }).eq("clerk_user_id", profile.clerk_user_id);
    setBusy(false);
    setSelected(null);
    load();
  };

  const pending  = profiles.filter(p => p.kyc_status === "pending_review").length;
  const inProg   = profiles.filter(p => p.kyc_status === "in_progress").length;
  const approved = profiles.filter(p => p.kyc_status === "approved").length;
  const rejected = profiles.filter(p => p.kyc_status === "rejected").length;

  return (
    <div>
      <SectionHeader title="KYC Review Center" sub="Approve or reject user identity submissions" onRefresh={load} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Pending Review" value={pending}  icon={Clock}         color="#f97316" />
        <StatCard label="In Progress"    value={inProg}   icon={Activity}      color={G} />
        <StatCard label="Approved"       value={approved} icon={CheckCircle2}  color="#0ECB81" />
        <StatCard label="Rejected"       value={rejected} icon={XCircle}       color="#F6465D" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {(["all","pending_review","in_progress","approved","rejected"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s as any)}
            style={{ padding: "8px 14px", borderRadius: 9, fontSize: 10, fontWeight: 700, cursor: "pointer",
              textTransform: "capitalize", whiteSpace: "nowrap",
              background: filterStatus === s ? G : CARD,
              color: filterStatus === s ? "#050505" : "rgba(255,255,255,0.45)",
              border: `1px solid ${filterStatus === s ? G : BORDER}` }}>
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
        <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
          <Search size={12} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / email / CNIC…"
            style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
              background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, color: "#fff",
              fontSize: 11, outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Full Name", "Email", "CNIC / Passport", "Status", "Submitted", "Action"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10,
                    color: "rgba(255,255,255,0.28)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No submissions found</td></tr>
                : filtered.slice(0, 30).map((p, i) => (
                  <tr key={p.id ?? i} style={{ borderBottom: i < filtered.slice(0,30).length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#fff", fontWeight: 600 }}>{p.full_name ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{p.email ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{p.cnic ?? "—"}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <Badge label={p.kyc_status ?? "not_started"} color={
                        p.kyc_status === "approved" ? "#0ECB81" :
                        p.kyc_status === "rejected" ? "#F6465D" :
                        p.kyc_status === "pending_review" ? "#f97316" :
                        p.kyc_status === "in_progress" ? G : "rgba(255,255,255,0.3)"
                      } />
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      {p.kyc_submitted_at ? new Date(p.kyc_submitted_at).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <button onClick={() => setSelected(p)}
                        style={{ padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                          background: `${G}12`, color: G, border: `1px solid ${G}25`, cursor: "pointer" }}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <div style={{ padding: "11px 16px", borderTop: `1px solid ${BORDER}`, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          Showing {Math.min(filtered.length, 30)} of {filtered.length}
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 200 }} />
            <motion.div initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px, 100vw)",
                background: "#0D1829", borderLeft: `1px solid ${BORDER}`, zIndex: 201, overflowY: "auto",
                display: "flex", flexDirection: "column" }}>

              {/* Drawer header */}
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10,
                position: "sticky", top: 0, background: "#0D1829", zIndex: 10 }}>
                <button onClick={() => setSelected(null)}
                  style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <ChevronLeft size={16} color="rgba(255,255,255,0.6)" />
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{selected.full_name ?? "User"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{selected.email}</div>
                </div>
                <Badge label={selected.kyc_status ?? "not_started"} color={
                  selected.kyc_status === "approved" ? "#0ECB81" :
                  selected.kyc_status === "rejected" ? "#F6465D" :
                  selected.kyc_status === "pending_review" ? "#f97316" : G
                } />
              </div>

              {/* Details */}
              <div style={{ padding: 20, flex: 1 }}>
                <div style={{ background: "#050A12", borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden", marginBottom: 20 }}>
                  {[
                    { label: "Full Name",        value: selected.full_name },
                    { label: "Father's Name",    value: selected.father_name },
                    { label: "Email",            value: selected.email },
                    { label: "Phone",            value: selected.phone },
                    { label: "CNIC / Passport",  value: selected.cnic },
                    { label: "Date of Birth",    value: selected.dob },
                    { label: "City",             value: selected.city },
                    { label: "Country",          value: selected.country },
                    { label: "Occupation",       value: selected.occupation },
                    { label: "Source of Funds",  value: selected.source_of_funds },
                    { label: "Document Type",    value: selected.doc_type },
                    { label: "Address Doc",      value: selected.address_doc_type },
                    { label: "Submitted At",     value: selected.kyc_submitted_at ? new Date(selected.kyc_submitted_at).toLocaleString() : undefined },
                    { label: "Reviewed At",      value: selected.kyc_reviewed_at ? new Date(selected.kyc_reviewed_at).toLocaleString() : undefined },
                    { label: "Rejection Reason", value: selected.kyc_rejection_reason },
                  ].filter(r => r.value).map((row, i, arr) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      padding: "10px 14px", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none", gap: 12 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", flexShrink: 0, minWidth: 130 }}>{row.label}</span>
                      <span style={{ fontSize: 11, color: "#fff", fontWeight: 600, textAlign: "right", wordBreak: "break-all" }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {selected.kyc_status !== "approved" && (
                    <button onClick={() => doUpdate(selected, "approved")} disabled={busy}
                      style={{ padding: 14, borderRadius: 12, border: "none", background: "#0ECB81",
                        color: "#050505", fontWeight: 800, fontSize: 14, cursor: busy ? "not-allowed" : "pointer" }}>
                      {busy ? "Saving…" : "✓ Approve KYC"}
                    </button>
                  )}
                  {selected.kyc_status !== "rejected" && (
                    <button onClick={() => {
                      const reason = prompt("Enter rejection reason:");
                      if (reason !== null) doUpdate(selected, "rejected", reason);
                    }} disabled={busy}
                      style={{ padding: 14, borderRadius: 12, border: "1px solid rgba(246,70,93,0.4)",
                        background: "rgba(246,70,93,0.1)", color: "#F6465D",
                        fontWeight: 800, fontSize: 14, cursor: busy ? "not-allowed" : "pointer" }}>
                      {busy ? "Saving…" : "✗ Reject KYC"}
                    </button>
                  )}
                  {selected.kyc_status !== "pending_review" && (
                    <button onClick={() => doUpdate(selected, "pending_review")} disabled={busy}
                      style={{ padding: 12, borderRadius: 12, border: `1px solid ${BORDER}`,
                        background: CARD, color: "rgba(255,255,255,0.5)",
                        fontWeight: 600, fontSize: 13, cursor: busy ? "not-allowed" : "pointer" }}>
                      Reset to Pending Review
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnalyticsSection({ data }: { data: ReturnType<typeof useAdminData> }) {
  const { properties, catMap, citySorted, monthly, monthLabels } = data;
  const total = properties.length;
  const maxBar = Math.max(...monthly, 1);

  return (
    <div>
      <SectionHeader title="Analytics" sub="Computed from your live Supabase data" onRefresh={data.load} />

      {total === 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 40,
          textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
          No property data yet. Add properties to see analytics.
        </div>
      )}

      {total > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {/* By city */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Properties by City</div>
              {citySorted.length === 0
                ? <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No data</div>
                : citySorted.map(([city, { count }]) => (
                  <div key={city} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{city}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: G }}>{count} · {pct(count, total)}%</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct(count, total)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{ height: "100%", background: G, borderRadius: 4 }} />
                    </div>
                  </div>
                ))
              }
            </div>

            {/* By category */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Properties by Category</div>
              {Object.entries(catMap).length === 0
                ? <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No data</div>
                : Object.entries(catMap).map(([cat, cnt], idx) => {
                    const colors = ["#0ECB81", "#3b82f6", G, "#8b5cf6", "#ec4899", "#f97316"];
                    const c = colors[idx % colors.length];
                    return (
                      <div key={cat} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", textTransform: "capitalize" }}>{cat}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{cnt} · {pct(cnt, total)}%</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct(cnt, total)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{ height: "100%", background: c, borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>

          {/* Monthly listing bars — real data */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Monthly New Listings (last 12 months)</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>Based on created_at from properties table</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
              {monthly.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 4 }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: maxBar > 0 ? `${(v / maxBar) * 80}%` : "2px" }}
                    transition={{ duration: 0.8, delay: i * 0.04 }}
                    style={{ width: "100%", background: v > 0 ? `linear-gradient(180deg, ${G} 0%, ${G}50 100%)` : "rgba(255,255,255,0.05)",
                      borderRadius: "3px 3px 0 0", minHeight: 2 }} />
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>{monthLabels[i]}</span>
                  {v > 0 && <span style={{ fontSize: 8, color: G, fontWeight: 700 }}>{v}</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TradesSection({ trades, load }: { trades: any[]; load: () => void }) {
  return (
    <div>
      <SectionHeader title="Trades" sub={`${trades.length} total trades in database`} onRefresh={load} />
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["ID", "User", "Asset", "Side", "Qty", "Price", "Total", "Date"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10,
                    color: "rgba(255,255,255,0.28)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.length === 0
                ? <tr><td colSpan={8} style={{ padding: 28, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No trades recorded yet</td></tr>
                : trades.slice(0, 30).map((t, i) => (
                  <tr key={t.id ?? i} style={{ borderBottom: i < trades.slice(0,30).length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <td style={{ padding: "11px 14px", fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>{t.id}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{t.user_id?.slice?.(0, 8) ?? "—"}…</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#fff", fontWeight: 700 }}>{t.ticker ?? t.asset ?? "—"}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <Badge label={t.side ?? "—"} color={(t.side ?? "").toLowerCase() === "buy" ? "#0ECB81" : "#F6465D"} />
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{t.qty ?? t.quantity ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: G }}>{t.price ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t.total ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InvestmentsSection({ investments, load }: { investments: any[]; load: () => void }) {
  return (
    <div>
      <SectionHeader title="Investment Projects" sub={`${investments.length} projects in database`} onRefresh={load} />
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["ID", "Name", "Location", "Target", "ROI", "Status", "Featured"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10,
                    color: "rgba(255,255,255,0.28)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {investments.length === 0
                ? <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No investment projects yet</td></tr>
                : investments.map((inv, i) => (
                  <tr key={inv.id ?? i} style={{ borderBottom: i < investments.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <td style={{ padding: "11px 14px", fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>{inv.id}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#fff", fontWeight: 600 }}>{inv.name ?? inv.title ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{inv.location ?? inv.city ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: G, fontWeight: 700 }}>{inv.target_amount ? fmtPrice(inv.target_amount) : "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#0ECB81", fontWeight: 700 }}>{inv.roi_percent ? `${inv.roi_percent}%` : "—"}</td>
                    <td style={{ padding: "11px 14px" }}><Badge label={inv.status ?? "—"} color="#3b82f6" /></td>
                    <td style={{ padding: "11px 14px" }}>
                      {inv.featured ? <CheckCircle2 size={14} color="#0ECB81" /> : <XCircle size={14} color="rgba(255,255,255,0.15)" />}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CenterSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      {G_SPINNER}
    </div>
  );
}

function PlaceholderSection({ title, sub, icon: Icon }: { title: string; sub: string; icon: any }) {
  return (
    <div>
      <SectionHeader title={title} sub={sub} />
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "60px 40px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 14, background: `${G}10`,
          border: `1px solid ${G}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Icon size={26} color={G} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", maxWidth: 340, lineHeight: 1.7 }}>
          This section will display real data once the corresponding Supabase tables are populated.
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <Badge label="Module Active" color="#0ECB81" />
          <Badge label="DB Connected" color="#3b82f6" />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════ */
export default function AdminPanel() {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  useEffect(() => {
    if (isLoaded && (!user || !isAdmin)) {
      setLocation("/");
    }
  }, [isLoaded, user, isAdmin]);

  const data = useAdminData();

  if (!isLoaded || !isAdmin) {
    return (
      <div style={{ minHeight: "100dvh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {G_SPINNER}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const renderContent = () => {
    switch (active) {
      case "dashboard":   return <Dashboard data={data} />;
      case "properties":  return <PropertiesSection properties={data.properties} load={data.load} />;
      case "users":       return <UsersSection profiles={data.profiles} load={data.load} />;
      case "kyc":         return <KYCSection profiles={data.profiles} load={data.load} />;
      case "analytics":   return <AnalyticsSection data={data} />;
      case "investments": return <InvestmentsSection investments={data.investments} load={data.load} />;
      case "trades":      return <TradesSection trades={data.trades} load={data.load} />;
      case "wallet":      return <PlaceholderSection title="Wallet & Treasury" sub="Add wallet_transactions and treasury tables to see real data" icon={Wallet} />;
      case "builders":    return <PlaceholderSection title="Builders & Projects" sub="Add builder_profiles table to manage builders" icon={HardHat} />;
      case "tokens":      return <PlaceholderSection title="Tokenization" sub="Add token_ledger and okbond_supply tables to manage tokens" icon={Coins} />;
      case "support":     return <PlaceholderSection title="Support Tickets" sub="Add support_tickets table to manage user queries" icon={Headphones} />;
      case "cms":         return <PlaceholderSection title="Content Management" sub="Add cms_pages table to manage homepage, banners, blogs" icon={FileText} />;
      case "security":    return <PlaceholderSection title="Security & Audit Logs" sub="Add audit_logs table to track admin actions" icon={Lock} />;
      case "settings":    return <PlaceholderSection title="Platform Settings" sub="Add platform_config table for fees, KYC config, regions" icon={Settings} />;
      default:            return <Dashboard data={data} />;
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: BG, display: "flex", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } *, *::before, *::after { box-sizing: border-box; }`}</style>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside initial={{ x: -220 }} animate={{ x: 0 }} exit={{ x: -220 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ width: 210, minWidth: 210, background: SIDEBAR, borderRight: `1px solid ${BORDER}`,
              display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0,
              zIndex: 100, overflowY: "auto" }}>

            <div style={{ padding: "20px 18px 14px", borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${G}15`,
                  border: `1px solid ${G}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Crown size={14} color={G} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: G }}>Orakzai</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.09em" }}>Admin Console</div>
                </div>
              </div>
            </div>

            <nav style={{ flex: 1, padding: "10px 8px" }}>
              {NAV.map(item => {
                const isActive = active === item.id;
                return (
                  <button key={item.id} onClick={() => setActive(item.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px",
                      borderRadius: 9, border: "none", cursor: "pointer", marginBottom: 2, textAlign: "left",
                      background: isActive ? `${G}10` : "transparent" }}>
                    <item.icon size={13} color={isActive ? G : "rgba(255,255,255,0.3)"} />
                    <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500,
                      color: isActive ? G : "rgba(255,255,255,0.45)" }}>{item.label}</span>
                    {isActive && <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: G }} />}
                  </button>
                );
              })}
            </nav>

            <div style={{ padding: "10px 8px", borderTop: `1px solid ${BORDER}` }}>
              <div style={{ padding: "8px 10px", borderRadius: 9, background: "rgba(255,255,255,0.02)", marginBottom: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: G }}>Chairman</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.primaryEmailAddress?.emailAddress}
                </div>
              </div>
              <button onClick={() => setLocation("/")}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                  borderRadius: 9, border: "none", background: "transparent", cursor: "pointer" }}>
                <LogOut size={12} color="rgba(255,255,255,0.25)" />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Exit to App</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: sidebarOpen ? 210 : 0, transition: "margin-left 0.25s", display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: `${BG}f0`,
          backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`,
          padding: "0 22px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setSidebarOpen(o => !o)}
              style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)",
                border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {sidebarOpen ? <X size={13} color="rgba(255,255,255,0.4)" /> : <Menu size={13} color="rgba(255,255,255,0.4)" />}
            </button>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {NAV.find(n => n.id === active)?.label ?? "Dashboard"}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Orakzai Properties · Admin</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {data.error && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
                borderRadius: 16, background: "rgba(246,70,93,0.1)", border: "1px solid rgba(246,70,93,0.3)" }}>
                <AlertTriangle size={10} color="#F6465D" />
                <span style={{ fontSize: 10, color: "#F6465D" }}>DB error</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
              borderRadius: 16, background: "rgba(14,203,129,0.08)", border: "1px solid rgba(14,203,129,0.2)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#0ECB81" }} />
              <span style={{ fontSize: 9, color: "#0ECB81", fontWeight: 700 }}>LIVE DATA</span>
            </div>
            <button onClick={() => setLocation("/")}
              style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)",
                border: `1px solid ${BORDER}`, borderRadius: 7, padding: "5px 12px", cursor: "pointer" }}>
              ← App
            </button>
          </div>
        </div>

        {/* Content */}
        <main style={{ flex: 1, padding: "26px 22px", overflowY: "auto", minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
