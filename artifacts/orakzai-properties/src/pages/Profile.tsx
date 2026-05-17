import { Link } from "wouter";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { updateProfile } from "firebase/auth";
import {
  Shield,
  Home,
  BarChart2,
  Lock,
  ChevronRight,
  Award,
  Star,
  HardHat,
  CheckCircle2,
  Clock,
  XCircle,
  Camera,
} from "lucide-react";
import { useUser, Show } from "@/contexts/AuthContext";
import { useKYCStatus } from "@/lib/useKYCStatus";

const GOLD = "#D4AF37";
const BG = "#050505";
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "dvsjiufdv";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "ml_default";

export default function Profile() {
  const { user } = useUser();
  const { kycStatus, loading: kycLoading } = useKYCStatus();
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.imageUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (file: File) => {
    if (!file || !user?._raw) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url: string = data.secure_url;
      await updateProfile(user._raw, { photoURL: url });
      setPhotoUrl(url);
    } catch {
      /* silent — show existing photo */
    } finally {
      setPhotoUploading(false);
    }
  };

  const displayName = user?.fullName ?? user?.firstName ?? "Faisal Orakzai";
  const email = user?.primaryEmailAddress?.emailAddress ?? "faisal@orakzaiproperties.com";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const kycBadge = (() => {
    if (kycLoading) return null;
    if (kycStatus === "approved") return { label: "KYC Verified", color: "#10b981", icon: CheckCircle2 };
    if (kycStatus === "pending_review") return { label: "KYC Pending", color: "#f59e0b", icon: Clock };
    if (kycStatus === "rejected") return { label: "KYC Rejected", color: "#ef4444", icon: XCircle };
    return { label: "KYC Required", color: "rgba(255,255,255,0.3)", icon: Shield };
  })();

  const menuItems = [
    {
      id: "kyc",
      icon: Shield,
      label: "KYC Verification",
      subtitle: "Identity & documents",
      badge: kycStatus === "approved" ? "Verified" : kycStatus === "pending_review" ? "Pending" : kycStatus === "rejected" ? "Rejected" : undefined,
      badgeColor: kycStatus === "approved" ? "#10b981" : kycStatus === "pending_review" ? "#f59e0b" : kycStatus === "rejected" ? "#ef4444" : undefined,
      href: "/kyc",
    },
    {
      id: "properties",
      icon: Home,
      label: "My Properties",
      subtitle: "Owned & listed assets",
      href: "/my-properties",
    },
    {
      id: "trade-history",
      icon: BarChart2,
      label: "Trade History",
      subtitle: "All transactions & orders",
      href: "/wallet",
    },
    {
      id: "security",
      icon: Lock,
      label: "Security",
      subtitle: "2FA, passwords, sessions",
      href: "/security",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        color: "#f1f5f9",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        paddingBottom: 100,
      }}
    >
      {/* Ambient background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: "20%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: `rgba(212,175,55,0.06)`,
            filter: "blur(100px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            left: "10%",
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: `rgba(212,175,55,0.04)`,
            filter: "blur(90px)",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>

        {/* ─── Header ─── */}
        <div
          style={{
            paddingTop: 48,
            paddingBottom: 32,
            textAlign: "center",
          }}
        >
          {/* Avatar with photo upload */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: photoUrl ? "transparent" : `linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.08) 100%)`,
                border: kycStatus === "approved" ? `3px solid ${GOLD}` : `2px solid ${GOLD}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: kycStatus === "approved"
                  ? `0 0 32px rgba(212,175,55,0.45), 0 0 64px rgba(212,175,55,0.15)`
                  : `0 0 32px rgba(212,175,55,0.25)`,
                fontSize: 28,
                fontWeight: 700,
                color: GOLD,
                fontFamily: "'Playfair Display', serif",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoUrl ? (
                <img src={photoUrl} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                initials
              )}
              {/* Hover overlay */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "rgba(0,0,0,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0, transition: "opacity 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
              >
                <Camera size={22} color={GOLD} />
              </div>
              {/* KYC verified tick */}
              {kycStatus === "approved" && (
                <div style={{
                  position: "absolute", bottom: -4, right: -4,
                  width: 26, height: 26, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${GOLD} 0%, #c49b28 100%)`,
                  border: "2px solid #050505",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 10px rgba(212,175,55,0.6)`,
                }}>
                  <CheckCircle2 size={14} color="#050505" strokeWidth={3} />
                </div>
              )}
            </motion.div>

            {/* Upload button below avatar */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              style={{
                marginTop: 8,
                display: "flex", alignItems: "center", gap: 4, justifyContent: "center",
                background: "transparent", border: `1px solid ${GOLD}40`,
                borderRadius: 999, padding: "4px 12px",
                color: GOLD, fontSize: 11, fontWeight: 600,
                cursor: photoUploading ? "not-allowed" : "pointer",
                opacity: photoUploading ? 0.6 : 1,
                transition: "all 0.2s",
              }}
            >
              <Camera size={11} />
              {photoUploading ? "Uploading…" : "Change Photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
            />
          </div>

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              fontWeight: 700,
              color: "#ffffff",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            <Show when="signed-in">{displayName}</Show>
            <Show when="signed-out">Faisal Orakzai</Show>
          </motion.h1>

          {/* Email */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              marginTop: 4,
              marginBottom: 14,
            }}
          >
            <Show when="signed-in">{email}</Show>
            <Show when="signed-out">faisal@orakzaiproperties.com</Show>
          </motion.p>

          {/* KYC Status Badge */}
          {kycBadge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 999,
                background: `${kycBadge.color}18`,
                border: `1px solid ${kycBadge.color}40`,
                color: kycBadge.color,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              <kycBadge.icon size={11} />
              {kycBadge.label}
              {kycStatus === "approved" && <Star size={10} style={{ fill: kycBadge.color }} />}
            </motion.div>
          )}

          {/* Institutional Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.22 }}
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 999,
              background: `rgba(212,175,55,0.12)`,
              border: `1px solid rgba(212,175,55,0.35)`,
              color: GOLD,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              <Star size={12} style={{ fill: GOLD, color: GOLD }} />
              Institutional Investor
              <Award size={12} />
            </div>
          </motion.div>
        </div>

        {/* ─── Stats Row ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {[
            { label: "Portfolio Value", value: "₨ 4.2Cr" },
            { label: "Active Trades", value: "7" },
            { label: "Properties", value: "3" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                padding: "14px 10px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: GOLD,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ─── Menu Grid (2 columns) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 + i * 0.06 }}
              >
                <Link href={item.href}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 18,
                      padding: "20px 16px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(212,175,55,0.35)`;
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(212,175,55,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: `rgba(212,175,55,0.12)`,
                        border: `1px solid rgba(212,175,55,0.2)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={18} color={GOLD} />
                    </div>

                    {/* Text */}
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#f1f5f9",
                          marginBottom: 2,
                        }}
                      >
                        {item.label}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                        {item.subtitle}
                      </div>
                    </div>

                    {/* Badge */}
                    {item.badge && item.badgeColor && (
                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          fontSize: 9,
                          fontWeight: 700,
                          color: item.badgeColor,
                          background: `${item.badgeColor}18`,
                          border: `1px solid ${item.badgeColor}40`,
                          borderRadius: 999,
                          padding: "2px 7px",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        {item.id === "kyc" && kycStatus === "approved" && (
                          <CheckCircle2 size={8} />
                        )}
                        {item.badge}
                      </div>
                    )}

                    {/* Arrow */}
                    <ChevronRight
                      size={14}
                      style={{
                        position: "absolute",
                        bottom: 16,
                        right: 14,
                        color: "rgba(255,255,255,0.2)",
                      }}
                    />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── Account Settings Link ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          {[
            { label: "Notifications", href: "/notifications" },
            { label: "Subscription Plan", href: "/pricing" },
            { label: "Help & Support", href: "/" },
          ].map((item, i) => (
            <Link key={item.label} href={item.href}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
              >
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{item.label}</span>
                <ChevronRight size={15} color="rgba(255,255,255,0.25)" />
              </div>
            </Link>
          ))}
        </motion.div>

        {/* ─── BECOME A DEVELOPER / BUILDER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, type: "spring", stiffness: 260, damping: 24 }}
          style={{ marginBottom: 12 }}
        >
          <button
            style={{
              width: "100%",
              padding: "20px 24px",
              borderRadius: 20,
              background: `linear-gradient(135deg, #D4AF37 0%, #c49b28 40%, #b8891f 100%)`,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              position: "relative",
              overflow: "hidden",
              boxShadow: `0 8px 32px rgba(212,175,55,0.35), 0 2px 8px rgba(0,0,0,0.4)`,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 40px rgba(212,175,55,0.45), 0 4px 12px rgba(0,0,0,0.4)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 32px rgba(212,175,55,0.35), 0 2px 8px rgba(0,0,0,0.4)`;
            }}
          >
            {/* Shimmer overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 3s infinite",
              }}
            />
            <HardHat size={22} color="#050505" style={{ flexShrink: 0, position: "relative", zIndex: 1 }} />
            <div style={{ textAlign: "left", position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#050505",
                  letterSpacing: "-0.01em",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                Become a Developer / Builder
              </div>
              <div style={{ fontSize: 11, color: "rgba(5,5,5,0.6)", marginTop: 2, fontWeight: 500 }}>
                List your projects · Raise capital · Grow your portfolio
              </div>
            </div>
            <ChevronRight size={18} color="rgba(5,5,5,0.5)" style={{ marginLeft: "auto", position: "relative", zIndex: 1 }} />
          </button>
        </motion.div>

        {/* Footer spacer text */}
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 16, paddingBottom: 8 }}>
          Orakzai Properties · Premium Platform
        </p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
