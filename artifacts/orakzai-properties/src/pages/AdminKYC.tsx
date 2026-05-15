import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/AuthContext";
import { getAllProfiles, updateKYCStatus, type Profile, type KYCStatus } from "@/lib/supabase";
import {
  Shield, CheckCircle2, XCircle, Clock, Eye, ChevronLeft,
  User, Search, RefreshCw, AlertTriangle,
} from "lucide-react";

const GOLD = "#F3BA2F";
const BG = "#0B0E11";
const CARD = "#12161C";
const BORD = "#1E2329";
const GREEN = "#0ECB81";
const RED = "#F6465D";
const AMBER = "#F59E0B";
const FG = "#EAECEF";
const DIM = "#848E9C";

const ADMIN_EMAIL = "faisal@orakzaibond.com";

const STATUS_CONFIG: Record<KYCStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: "Not Started", color: DIM, bg: "rgba(132,142,156,0.1)" },
  in_progress: { label: "In Progress", color: GOLD, bg: "rgba(243,186,47,0.1)" },
  pending_review: { label: "Pending Review", color: AMBER, bg: "rgba(245,158,11,0.1)" },
  approved: { label: "Approved", color: GREEN, bg: "rgba(14,203,129,0.1)" },
  rejected: { label: "Rejected", color: RED, bg: "rgba(246,70,93,0.1)" },
};

function StatusBadge({ status }: { status: KYCStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started;
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
      padding: "3px 9px",
      borderRadius: 99,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.color}30`,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    }}>
      {cfg.label}
    </span>
  );
}

interface DetailDrawerProps {
  profile: Profile;
  onClose: () => void;
  onApprove: (p: Profile) => void;
  onReject: (p: Profile, reason: string) => void;
  loading: boolean;
}

function DetailDrawer({ profile: p, onClose, onApprove, onReject, loading }: DetailDrawerProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const rows = [
    { label: "Clerk User ID", value: p.clerk_user_id },
    { label: "Email", value: p.email },
    { label: "Full Name", value: p.full_name },
    { label: "Father's Name", value: p.father_name },
    { label: "CNIC / Passport", value: p.cnic },
    { label: "Date of Birth", value: p.dob },
    { label: "Phone", value: p.phone },
    { label: "City", value: p.city },
    { label: "Country", value: p.country },
    { label: "Occupation", value: p.occupation },
    { label: "Source of Funds", value: p.source_of_funds },
    { label: "ID Document Type", value: p.doc_type },
    { label: "Address Doc Type", value: p.address_doc_type },
    { label: "Submitted At", value: p.kyc_submitted_at ? new Date(p.kyc_submitted_at).toLocaleString() : undefined },
    { label: "Reviewed At", value: p.kyc_reviewed_at ? new Date(p.kyc_reviewed_at).toLocaleString() : undefined },
    { label: "Rejection Reason", value: p.kyc_rejection_reason },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "stretch",
    }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{
        width: "min(440px, 100vw)",
        background: CARD,
        borderLeft: `1px solid ${BORD}`,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "16px", borderBottom: `1px solid ${BORD}`, display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, background: CARD, zIndex: 10 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORD}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={16} color={FG} />
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: FG }}>{p.full_name ?? "Unnamed User"}</div>
            <div style={{ fontSize: 11, color: DIM }}>{p.email}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <StatusBadge status={p.kyc_status} />
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: "16px", flex: 1 }}>
          <div style={{ background: BG, borderRadius: 10, border: `1px solid ${BORD}`, overflow: "hidden", marginBottom: 16 }}>
            {rows.filter(r => r.value).map((row, i) => (
              <div key={row.label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "9px 14px",
                borderBottom: i < rows.filter(r => r.value).length - 1 ? `1px solid ${BORD}` : "none",
                gap: 12,
              }}>
                <span style={{ fontSize: 11, color: DIM, flexShrink: 0, minWidth: 120 }}>{row.label}</span>
                <span style={{ fontSize: 11, color: FG, fontWeight: 600, textAlign: "right", wordBreak: "break-all" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {p.kyc_status === "pending_review" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {!showReject ? (
                <>
                  <button
                    onClick={() => onApprove(p)}
                    disabled={loading}
                    style={{
                      padding: "13px", borderRadius: 10, border: "none",
                      background: loading ? "rgba(14,203,129,0.3)" : GREEN,
                      color: "#050505", fontWeight: 800, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    <CheckCircle2 size={16} /> {loading ? "Processing..." : "Approve KYC"}
                  </button>
                  <button
                    onClick={() => setShowReject(true)}
                    disabled={loading}
                    style={{
                      padding: "13px", borderRadius: 10, border: `1px solid ${RED}40`,
                      background: "rgba(246,70,93,0.08)",
                      color: RED, fontWeight: 700, fontSize: 14, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    <XCircle size={16} /> Reject KYC
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: DIM, marginBottom: 4 }}>Rejection Reason (shown to user):</div>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="e.g. Documents unclear, CNIC expired, face not visible..."
                    rows={3}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 8, background: BG,
                      border: `1px solid ${BORD}`, color: FG, fontSize: 13, outline: "none",
                      fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowReject(false)} style={{ flex: 1, padding: "11px", borderRadius: 8, border: `1px solid ${BORD}`, background: "transparent", color: DIM, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                      Cancel
                    </button>
                    <button
                      onClick={() => { if (rejectReason.trim()) onReject(p, rejectReason); }}
                      disabled={!rejectReason.trim() || loading}
                      style={{
                        flex: 2, padding: "11px", borderRadius: 8, border: "none",
                        background: rejectReason.trim() ? RED : "rgba(246,70,93,0.3)",
                        color: "#fff", fontWeight: 800, fontSize: 13,
                        cursor: rejectReason.trim() ? "pointer" : "not-allowed",
                      }}
                    >
                      {loading ? "Processing..." : "Confirm Rejection"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {p.kyc_status === "approved" && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(14,203,129,0.08)", border: `1px solid rgba(14,203,129,0.25)`, display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle2 size={16} color={GREEN} />
              <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>KYC Approved — User has full access</span>
            </div>
          )}

          {p.kyc_status === "rejected" && p.kyc_rejection_reason && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(246,70,93,0.08)", border: `1px solid rgba(246,70,93,0.25)` }}>
              <div style={{ fontSize: 11, color: RED, fontWeight: 700, marginBottom: 4 }}>Rejection Reason:</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{p.kyc_rejection_reason}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminKYC() {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filtered, setFiltered] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<KYCStatus | "all">("all");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      setLocation("/");
    }
  }, [isLoaded, isAdmin, setLocation]);

  const fetchProfiles = async () => {
    setLoading(true);
    const data = await getAllProfiles();
    setProfiles(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchProfiles();
  }, [isAdmin]);

  useEffect(() => {
    let list = profiles;
    if (statusFilter !== "all") list = list.filter(p => p.kyc_status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.full_name ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q) ||
        (p.cnic ?? "").toLowerCase().includes(q) ||
        (p.clerk_user_id ?? "").toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [search, statusFilter, profiles]);

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (p: Profile) => {
    setActionLoading(true);
    const ok = await updateKYCStatus(p.clerk_user_id, "approved");
    if (ok) {
      showToast(`✓ ${p.full_name ?? "User"} approved!`, "ok");
      setProfiles(prev => prev.map(x => x.clerk_user_id === p.clerk_user_id ? { ...x, kyc_status: "approved" } : x));
      setSelected(prev => prev?.clerk_user_id === p.clerk_user_id ? { ...prev, kyc_status: "approved" } : prev);
    } else {
      showToast("Error updating status", "err");
    }
    setActionLoading(false);
  };

  const handleReject = async (p: Profile, reason: string) => {
    setActionLoading(true);
    const ok = await updateKYCStatus(p.clerk_user_id, "rejected", reason);
    if (ok) {
      showToast(`✗ ${p.full_name ?? "User"} rejected`, "ok");
      setProfiles(prev => prev.map(x => x.clerk_user_id === p.clerk_user_id ? { ...x, kyc_status: "rejected", kyc_rejection_reason: reason } : x));
      setSelected(prev => prev?.clerk_user_id === p.clerk_user_id ? { ...prev, kyc_status: "rejected" } : prev);
    } else {
      showToast("Error updating status", "err");
    }
    setActionLoading(false);
  };

  const counts = {
    all: profiles.length,
    pending_review: profiles.filter(p => p.kyc_status === "pending_review").length,
    approved: profiles.filter(p => p.kyc_status === "approved").length,
    rejected: profiles.filter(p => p.kyc_status === "rejected").length,
  };

  if (!isLoaded) return null;

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100dvh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <AlertTriangle size={48} color={RED} style={{ marginBottom: 16 }} />
          <div style={{ color: FG, fontWeight: 700, fontSize: 18 }}>Access Denied</div>
          <div style={{ color: DIM, fontSize: 13, marginTop: 8 }}>Admin access only</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: FG, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 40 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 9999,
          padding: "12px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13,
          background: toast.type === "ok" ? "rgba(14,203,129,0.15)" : "rgba(246,70,93,0.15)",
          border: `1px solid ${toast.type === "ok" ? GREEN : RED}40`,
          color: toast.type === "ok" ? GREEN : RED,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <DetailDrawer
          profile={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={actionLoading}
        />
      )}

      {/* Header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORD}`, padding: "16px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setLocation("/admin/config")} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORD}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={16} color={FG} />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(243,186,47,0.15)", border: `1px solid rgba(243,186,47,0.3)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={16} color={GOLD} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: FG }}>KYC Management</div>
          <div style={{ fontSize: 11, color: DIM }}>Orakzai Properties · Admin Panel</div>
        </div>
        <button onClick={fetchProfiles} style={{ marginLeft: "auto", width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORD}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <RefreshCw size={14} color={DIM} />
        </button>
        <div style={{ background: "rgba(243,186,47,0.1)", border: `1px solid rgba(243,186,47,0.25)`, borderRadius: 6, padding: "3px 10px", fontSize: 10, color: GOLD, fontWeight: 700 }}>
          ADMIN
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: 700, margin: "0 auto" }}>
        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Total", value: counts.all, color: FG },
            { label: "Pending", value: counts.pending_review, color: AMBER },
            { label: "Approved", value: counts.approved, color: GREEN },
            { label: "Rejected", value: counts.rejected, color: RED },
          ].map(stat => (
            <div key={stat.label} style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, fontFamily: "'Playfair Display', serif" }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: DIM, marginTop: 3 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: CARD, border: `1px solid ${BORD}`, borderRadius: 8, padding: "0 12px", height: 40 }}>
            <Search size={14} color={DIM} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, CNIC..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: FG, fontSize: 13, fontFamily: "inherit" }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as KYCStatus | "all")}
            style={{ padding: "0 12px", height: 40, background: CARD, border: `1px solid ${BORD}`, borderRadius: 8, color: FG, fontSize: 12, outline: "none", cursor: "pointer" }}
          >
            <option value="all">All Status</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="not_started">Not Started</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: DIM, fontSize: 13 }}>Loading KYC submissions...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <User size={40} color={DIM} style={{ marginBottom: 12 }} />
            <div style={{ color: DIM, fontSize: 13 }}>No KYC submissions found</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(p => (
              <div
                key={p.clerk_user_id}
                onClick={() => setSelected(p)}
                style={{
                  background: CARD,
                  border: `1px solid ${p.kyc_status === "pending_review" ? `${AMBER}30` : BORD}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${GOLD}40`;
                  (e.currentTarget as HTMLElement).style.background = "#161b22";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = p.kyc_status === "pending_review" ? `${AMBER}30` : BORD;
                  (e.currentTarget as HTMLElement).style.background = CARD;
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(243,186,47,0.1)", border: `1px solid rgba(243,186,47,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <User size={16} color={GOLD} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: FG, marginBottom: 2 }}>{p.full_name ?? "Unnamed"}</div>
                  <div style={{ fontSize: 11, color: DIM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email ?? p.clerk_user_id}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <StatusBadge status={p.kyc_status} />
                  {p.kyc_submitted_at && (
                    <span style={{ fontSize: 10, color: DIM }}>
                      {new Date(p.kyc_submitted_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <Eye size={14} color={DIM} style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
