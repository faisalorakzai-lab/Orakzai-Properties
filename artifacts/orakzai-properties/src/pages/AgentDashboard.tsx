import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Building2, Users, Eye, TrendingUp, Plus,
  Edit3, Trash2, CheckSquare, Clock, Shield, ChevronRight,
  Phone, MessageCircle, MapPin, Settings, Layers, Star,
  Briefcase, Award, X, Save, BadgeCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Show, useUser } from "@clerk/react";
import {
  useGetAgentDashboard,
  getGetAgentDashboardQueryKey,
  useUpdateAgentProfile,
  useGetAgentProfile,
  getGetAgentProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteProperty, useUpdateProperty } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function fmtPKR(n: number): string {
  if (n >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000)    return `PKR ${(n / 100_000).toFixed(1)}L`;
  return `PKR ${n.toLocaleString()}`;
}

const STATUS_CFG = {
  live:    { label: "Live",    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  pending: { label: "Pending", color: "text-amber-400 bg-amber-500/10 border-amber-500/30"       },
  sold:    { label: "Sold",    color: "text-[#4a6080] bg-white/5 border-white/10"                },
};

const SIDEBAR_ITEMS = [
  { id: "inventory", label: "Inventory",   icon: Layers   },
  { id: "leads",     label: "Leads",       icon: Users    },
  { id: "analytics", label: "Analytics",   icon: BarChart3 },
  { id: "profile",   label: "My Profile",  icon: Settings },
] as const;
type SidebarTab = typeof SIDEBAR_ITEMS[number]["id"];

/* ─── Stat card ─── */
function StatCard({ icon: Icon, label, value, color, delay = 0 }: {
  icon: typeof Eye; label: string; value: number | string; color: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-2xl border border-white/8 p-5"
      style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
      <div className={`h-8 w-8 rounded-xl ${color} bg-opacity-10 flex items-center justify-center mb-3 border border-current/20`}
        style={{ background: `currentColor`, opacity: 1 }}>
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${color.replace("text-", "bg-").replace("400", "500/10")}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <div className={`font-serif text-2xl font-bold ${color} leading-none mb-1`}>{value}</div>
      <div className="text-[#3a5070] text-[10px] uppercase tracking-wider font-semibold">{label}</div>
    </motion.div>
  );
}

/* ─── Listing row ─── */
function ListingRow({ listing, onDelete, onToggleSold }: {
  listing: any;
  onDelete: () => void;
  onToggleSold: () => void;
}) {
  const statusCfg = STATUS_CFG[listing.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-3.5 border-b border-white/[0.05] last:border-0 group hover:bg-white/[0.015] rounded-xl px-2 -mx-2 transition-colors">
      <div className="h-9 w-9 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
        <Building2 className="h-4 w-4 text-[#C9A84C]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{listing.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <MapPin className="h-2.5 w-2.5 text-[#C9A84C]/50" />
          <span className="text-[10px] text-[#4a6080]">{listing.city}</span>
          <span className="text-[10px] text-[#3a5070]">·</span>
          <span className="text-[10px] text-[#C9A84C]">{fmtPKR(listing.price)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-3 mr-2 text-xs text-[#3a5070]">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{listing.views}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{listing.leads}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`${basePath}/post-property?edit=${listing.id}`}>
            <button className="h-7 w-7 rounded-lg flex items-center justify-center text-[#4a6080] hover:text-[#C9A84C] hover:bg-[#C9A84C]/8 transition-all" title="Edit">
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </Link>
          <button onClick={onToggleSold}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-[#4a6080] hover:text-amber-400 hover:bg-amber-500/8 transition-all"
            title={listing.status === "sold" ? "Mark Live" : "Mark as Sold"}>
            <CheckSquare className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-[#4a6080] hover:text-rose-400 hover:bg-rose-500/8 transition-all" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Lead row ─── */
function LeadRow({ lead, index }: { lead: any; index: number }) {
  const d = new Date(lead.createdAt);
  const dateStr = d.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0 group hover:bg-white/[0.015] rounded-xl px-2 -mx-2 transition-colors">
      <div className="h-8 w-8 rounded-xl bg-[#1e3a5f]/40 flex items-center justify-center flex-shrink-0">
        <Users className="h-3.5 w-3.5 text-sky-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white">{lead.leadName ?? "Anonymous Lead"}</p>
        <p className="text-[#4a6080] text-[10px] truncate">{lead.propertyTitle}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
          lead.source === "whatsapp"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-sky-500/10 border-sky-500/20 text-sky-400"
        }`}>{lead.source}</span>
        <span className="text-[#2a3a50] text-[9px]">{dateStr}</span>
        {lead.leadPhone && (
          <a href={`tel:${lead.leadPhone}`}
            className="h-7 w-7 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all opacity-0 group-hover:opacity-100">
            <Phone className="h-3 w-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Profile edit form ─── */
function ProfileForm({ profile, onSave }: { profile: any; onSave: () => void }) {
  const [form, setForm] = useState({
    agencyName:      profile?.agencyName      ?? "",
    experienceYears: profile?.experienceYears ?? 0,
    specialization:  profile?.specialization  ?? "",
    bio:             profile?.bio             ?? "",
    logoUrl:         profile?.logoUrl         ?? "",
  });
  const updateProfile = useUpdateAgentProfile();
  const qc = useQueryClient();

  const save = () => {
    updateProfile.mutate(
      { data: { ...form, experienceYears: Number(form.experienceYears) } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetAgentProfileQueryKey() });
          qc.invalidateQueries({ queryKey: getGetAgentDashboardQueryKey() });
          onSave();
        },
      },
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 p-6"
      style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
      <div className="flex items-center gap-2 mb-5">
        <Briefcase className="h-4 w-4 text-[#C9A84C]" />
        <h3 className="font-serif text-base font-bold text-white">Agent Profile</h3>
        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          profile?.verificationStatus === "verified"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
        }`}>
          {profile?.verificationStatus === "verified" ? "✓ Verified" : "Pending Review"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {[
          { field: "agencyName", label: "Agency Name", placeholder: "e.g. Orakzai Real Estate" },
          { field: "specialization", label: "Specialization", placeholder: "e.g. DHA Specialist, Luxury Homes" },
        ].map(({ field, label, placeholder }) => (
          <div key={field}>
            <label className="text-[10px] text-[#4a6080] uppercase tracking-wider font-semibold mb-1.5 block">{label}</label>
            <input
              value={form[field as keyof typeof form] as string}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              placeholder={placeholder}
              className="w-full h-9 px-3 rounded-xl bg-[#060f1c] border border-[#1e3a5f]/60 text-white text-xs placeholder-[#3a5070] focus:border-[#C9A84C]/40 focus:outline-none transition-colors"
            />
          </div>
        ))}
        <div>
          <label className="text-[10px] text-[#4a6080] uppercase tracking-wider font-semibold mb-1.5 block">Years Experience</label>
          <input
            type="number" min={0} max={50}
            value={form.experienceYears}
            onChange={e => setForm(f => ({ ...f, experienceYears: parseInt(e.target.value) || 0 }))}
            className="w-full h-9 px-3 rounded-xl bg-[#060f1c] border border-[#1e3a5f]/60 text-white text-xs focus:border-[#C9A84C]/40 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#4a6080] uppercase tracking-wider font-semibold mb-1.5 block">Logo URL</label>
          <input
            value={form.logoUrl}
            onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://..."
            className="w-full h-9 px-3 rounded-xl bg-[#060f1c] border border-[#1e3a5f]/60 text-white text-xs placeholder-[#3a5070] focus:border-[#C9A84C]/40 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="text-[10px] text-[#4a6080] uppercase tracking-wider font-semibold mb-1.5 block">Bio</label>
        <textarea
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          placeholder="Brief description about your expertise and experience..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl bg-[#060f1c] border border-[#1e3a5f]/60 text-white text-xs placeholder-[#3a5070] focus:border-[#C9A84C]/40 focus:outline-none transition-colors resize-none leading-relaxed"
        />
      </div>

      <button onClick={save} disabled={updateProfile.isPending}
        className="flex items-center gap-2 h-9 px-5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
        style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
        <Save className="h-3.5 w-3.5" />
        {updateProfile.isPending ? "Saving…" : "Save Profile"}
      </button>
    </motion.div>
  );
}

/* ─── Main Dashboard ─── */
function AgentDashboardContent() {
  const { user } = useUser();
  const qc = useQueryClient();
  const [tab, setTab] = useState<SidebarTab>("inventory");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: dash, isLoading } = useGetAgentDashboard({
    query: { queryKey: getGetAgentDashboardQueryKey(), refetchInterval: 60_000 },
  });

  const deleteProperty = useDeleteProperty();
  const updateProperty = useUpdateProperty();

  const handleDelete = (id: number) => {
    if (!confirm("Delete this listing?")) return;
    deleteProperty.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetAgentDashboardQueryKey() }),
    });
  };

  const handleToggleSold = (listing: any) => {
    updateProperty.mutate(
      { id: listing.id, data: { isAvailable: listing.status === "sold" } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getGetAgentDashboardQueryKey() }) },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#040b14" }}>
        <Navbar />
        <div className="pt-14 max-w-7xl mx-auto px-4 py-8 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/[0.03] rounded-2xl animate-pulse" />)}
          </div>
          <div className="h-64 bg-white/[0.03] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const profile = dash?.profile;
  const stats   = dash?.stats   ?? { totalListings: 0, activeListings: 0, totalLeads: 0, totalViews: 0 };
  const listings = dash?.listings ?? [];
  const leads    = dash?.leads    ?? [];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #040b14 0%, #060e18 100%)" }}>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[300px] rounded-full bg-[#C9A84C]/[0.03] blur-[120px]" />
      </div>
      <Navbar />
      <div className="pt-14 relative z-10">

        {/* ── Agent Header ── */}
        <div className="border-b border-[#C9A84C]/8"
          style={{ background: "linear-gradient(180deg, #06111e 0%, #040b14 100%)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #C9A84C20, transparent)" }}>
                  {profile?.logoUrl
                    ? <img src={profile.logoUrl} alt="logo" className="h-10 w-10 rounded-xl object-cover" />
                    : <Briefcase className="h-6 w-6 text-[#C9A84C]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-serif text-xl font-bold text-white">
                      {profile?.agencyName ?? (user?.firstName ? `${user.firstName}'s Agency` : "Agent Dashboard")}
                    </h1>
                    {profile?.verificationStatus === "verified" && (
                      <BadgeCheck className="h-4.5 w-4.5 text-[#C9A84C]" />
                    )}
                  </div>
                  <p className="text-[#4a6080] text-xs mt-0.5">
                    {profile?.specialization ?? "Real Estate Agent"}{profile?.experienceYears ? ` · ${profile.experienceYears}yr experience` : ""}
                  </p>
                </div>
              </div>
              <Link href={`${basePath}/post-property`}>
                <button className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold hover:scale-[1.03] transition-transform"
                  style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
                  <Plus className="h-3.5 w-3.5" /> Quick Post
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">

          {/* ── Sidebar (desktop) ── */}
          <aside className="hidden lg:flex flex-col w-44 flex-shrink-0 gap-1">
            {SIDEBAR_ITEMS.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  tab === item.id
                    ? "bg-[#C9A84C]/12 border border-[#C9A84C]/25 text-[#C9A84C]"
                    : "text-[#6a7f99] hover:text-white hover:bg-white/[0.03]"
                }`}>
                <item.icon className="h-3.5 w-3.5" /> {item.label}
                {item.id === "leads" && leads.length > 0 && (
                  <span className="ml-auto h-4 min-w-[16px] rounded-full bg-rose-500/20 text-rose-400 text-[8px] font-bold flex items-center justify-center px-1">
                    {leads.length}
                  </span>
                )}
              </button>
            ))}
          </aside>

          {/* ── Mobile tab bar ── */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-[#C9A84C]/15 px-2 py-2"
            style={{ background: "#070e1a" }}>
            {SIDEBAR_ITEMS.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[9px] font-semibold transition-all ${
                  tab === item.id ? "text-[#C9A84C]" : "text-[#4a6080]"
                }`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 pb-20 lg:pb-0 space-y-5">

            {/* Stat cards — always visible */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Eye,       label: "Total Views",    value: stats.totalViews,   color: "text-sky-400"     },
                { icon: Users,     label: "Total Leads",    value: stats.totalLeads,   color: "text-[#C9A84C]"  },
                { icon: Building2, label: "Active Listings",value: stats.activeListings,color: "text-emerald-400" },
                { icon: BarChart3, label: "All Listings",   value: stats.totalListings, color: "text-purple-400"  },
              ].map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border border-white/8 p-4"
                  style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
                  <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
                  <div className={`font-serif text-2xl font-bold ${s.color} leading-none mb-1`}>{s.value}</div>
                  <div className="text-[#3a5070] text-[9px] uppercase tracking-wider font-semibold">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* ══ INVENTORY ══ */}
              {tab === "inventory" && (
                <motion.div key="inventory" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="rounded-2xl border border-white/8 overflow-hidden"
                    style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-[#C9A84C]" />
                        <h2 className="font-serif text-sm font-bold text-white">My Listings</h2>
                        <span className="text-[10px] font-semibold text-[#3a5070] bg-white/5 px-2 py-0.5 rounded-full border border-white/8">{listings.length}</span>
                      </div>
                      <Link href={`${basePath}/post-property`}>
                        <button className="flex items-center gap-1.5 h-7 px-3 rounded-xl text-[10px] font-bold border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/8 transition-colors">
                          <Plus className="h-3 w-3" /> Add
                        </button>
                      </Link>
                    </div>
                    <div className="px-5 py-2">
                      {listings.length === 0 ? (
                        <div className="text-center py-12">
                          <Building2 className="h-10 w-10 text-[#1e3a5f] mx-auto mb-3" />
                          <p className="text-[#3a5070] text-sm">No listings yet</p>
                          <Link href={`${basePath}/post-property`}>
                            <button className="mt-3 text-[10px] text-[#C9A84C] hover:underline">Post your first property →</button>
                          </Link>
                        </div>
                      ) : (
                        listings.map(listing => (
                          <ListingRow
                            key={listing.id}
                            listing={listing}
                            onDelete={() => handleDelete(listing.id)}
                            onToggleSold={() => handleToggleSold(listing)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ══ LEADS ══ */}
              {tab === "leads" && (
                <motion.div key="leads" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="rounded-2xl border border-white/8 overflow-hidden"
                    style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#C9A84C]" />
                        <h2 className="font-serif text-sm font-bold text-white">Incoming Leads</h2>
                        {leads.length > 0 && (
                          <span className="text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">{leads.length}</span>
                        )}
                      </div>
                      <p className="text-[#3a5070] text-[10px]">Contacts from WhatsApp & listing enquiries</p>
                    </div>
                    <div className="px-5 py-2">
                      {leads.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="h-10 w-10 text-[#1e3a5f] mx-auto mb-3" />
                          <p className="text-[#3a5070] text-sm">No leads yet</p>
                          <p className="text-[#2a3a50] text-xs mt-1">Leads appear when buyers contact you via WhatsApp or call</p>
                        </div>
                      ) : (
                        leads.map((lead, i) => (
                          <LeadRow key={lead.id} lead={lead} index={i} />
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ══ ANALYTICS ══ */}
              {tab === "analytics" && (
                <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-4">
                  <div className="rounded-2xl border border-white/8 p-5"
                    style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
                    <h2 className="font-serif text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-[#C9A84C]" /> Performance Overview
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Conversion Rate", value: stats.totalLeads > 0 ? `${((stats.totalLeads / Math.max(stats.totalViews, 1)) * 100).toFixed(1)}%` : "—", desc: "Leads per view" },
                        { label: "Avg. Lead / Listing", value: stats.totalListings > 0 ? (stats.totalLeads / stats.totalListings).toFixed(1) : "—", desc: "Leads per property" },
                        { label: "Views per Listing", value: stats.totalListings > 0 ? Math.floor(stats.totalViews / stats.totalListings) : "—", desc: "Average views" },
                        { label: "Active Rate", value: stats.totalListings > 0 ? `${Math.round((stats.activeListings / stats.totalListings) * 100)}%` : "—", desc: "Listings currently live" },
                      ].map(metric => (
                        <div key={metric.label} className="rounded-xl bg-[#060f1c] border border-[#1e3a5f]/40 p-3">
                          <div className="font-serif text-xl font-bold text-[#C9A84C] mb-0.5">{metric.value}</div>
                          <div className="text-white text-[11px] font-semibold">{metric.label}</div>
                          <div className="text-[#3a5070] text-[9px]">{metric.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top performing listings */}
                  {listings.length > 0 && (
                    <div className="rounded-2xl border border-white/8 p-5"
                      style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
                      <h3 className="font-serif text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Star className="h-4 w-4 text-[#C9A84C]" /> Top Performers
                      </h3>
                      {[...listings].sort((a, b) => b.views - a.views).slice(0, 3).map((l, i) => (
                        <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                          <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                            i === 0 ? "bg-[#C9A84C]/20 text-[#C9A84C]" :
                            i === 1 ? "bg-[#8a7a4c]/20 text-[#8a7a4c]" :
                                      "bg-white/5 text-[#4a6080]"
                          }`}>{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium truncate">{l.title}</p>
                            <p className="text-[#3a5070] text-[10px]">{l.city}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="flex items-center gap-1 text-[#4a6080]"><Eye className="h-2.5 w-2.5" />{l.views}</span>
                              <span className="flex items-center gap-1 text-[#4a6080]"><Users className="h-2.5 w-2.5" />{l.leads}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══ PROFILE ══ */}
              {tab === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <ProfileForm profile={profile} onSave={() => {}} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Route wrapper ─── */
export default function AgentDashboard() {
  return (
    <>
      <Show when="signed-out">
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#040b14" }}>
          <Navbar />
          <div className="text-center mt-14 px-4">
            <Shield className="h-12 w-12 text-[#1e3a5f] mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-white font-bold mb-2">Agent Area</h2>
            <p className="text-[#6a7f99] text-sm mb-6">Sign in to access your Business Dashboard.</p>
            <Link href={`${basePath}/sign-in`}>
              <button className="px-6 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </Show>
      <Show when="signed-in"><AgentDashboardContent /></Show>
    </>
  );
}
