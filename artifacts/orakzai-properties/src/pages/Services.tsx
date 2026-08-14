import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, Search, Gift, FileText, PlusCircle, Rocket, Users,
  ArrowDownCircle, Shield, Coins, Star, Zap,
  HeadphonesIcon, MessageCircle, Award, ShoppingBag, Heart, X, PenLine,
  Building2, Megaphone, GraduationCap, Globe, Crown, HelpCircle,
} from "lucide-react";

const GOLD = "#C9A84C";
const BG = "#040b14";
const CARD_BG = "#04080F";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_GOLD = "rgba(201,168,76,0.25)";

interface ServiceItem {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  href?: string;
  switchToMarket?: boolean;
}

const COMMON_FUNCTION: ServiceItem[] = [
  { icon: Gift,           label: "My Gift",          color: "#f97316", bg: "rgba(249,115,22,0.15)",   href: "/my-gift" },
  { icon: FileText,       label: "Account\nStatement",color: "#3b82f6", bg: "rgba(59,130,246,0.15)",   href: "/account-statement" },
  { icon: PlusCircle,     label: "Add Funds",        color: "#10b981", bg: "rgba(16,185,129,0.15)",   href: "/wallet" },
  { icon: Rocket,         label: "Launchpool",       color: "#f97316", bg: "rgba(249,115,22,0.15)",   href: "/launchpad" },
  { icon: Users,          label: "Referral",         color: "#06b6d4", bg: "rgba(6,182,212,0.15)",    href: "/referral" },
  { icon: ArrowDownCircle,label: "Withdraw Fiat",    color: "#a78bfa", bg: "rgba(167,139,250,0.15)",  href: "/wallet" },
  { icon: Shield,         label: "Security",         color: GOLD,      bg: "rgba(201,168,76,0.12)",   href: "/security" },
];

const EARN_WEALTH: ServiceItem[] = [
  { icon: Coins,         label: "Staking",         color: "#10b981", bg: "rgba(16,185,129,0.15)",  href: "/staking" },
  { icon: Star,   label: "OkzByte Wealth",  color: GOLD,      bg: "rgba(201,168,76,0.12)",  href: "/wealth" },
  { icon: Zap,    label: "Airdrop Hub",     color: "#f97316", bg: "rgba(249,115,22,0.15)",  href: "/airdrop-hub" },
];

const SUPPORT_COMMUNITY: ServiceItem[] = [
  { icon: PenLine,        label: "User Feedback",       color: GOLD,      bg: "rgba(201,168,76,0.12)",   href: "/feedback" },
  { icon: HeadphonesIcon, label: "Support",             color: "#3b82f6", bg: "rgba(59,130,246,0.15)",  href: "/support" },
  { icon: MessageCircle,  label: "Customer Service",    color: "#06b6d4", bg: "rgba(6,182,212,0.15)",  href: "/customer-service" },
  { icon: Award,          label: "Affiliate Program",   color: GOLD,      bg: "rgba(201,168,76,0.12)",  href: "/affiliate-program" },
  { icon: Building2,      label: "Marketplace",         color: "#10b981", bg: "rgba(16,185,129,0.15)",  href: "/marketplace" },
  { icon: Heart,          label: "Charity /\nPhilanthropy", color: "#ef4444", bg: "rgba(239,68,68,0.15)", href: "/charity" },
  // 5 New Service Items added as requested:
  { icon: Megaphone,      label: "Announcement",        color: "#34d399", bg: "rgba(16,185,129,0.15)",  href: "/announcements" },
  { icon: GraduationCap,  label: "Learn",               color: "#60a5fa", bg: "rgba(59,130,246,0.15)",  href: "/learn" },
  { icon: Globe,          label: "Community",           color: "#c084fc", bg: "rgba(168,85,247,0.15)",  href: "/community" },
  { icon: Crown,          label: "OkzByte VIP",         color: "#facc15", bg: "rgba(234,179,8,0.15)",   href: "/vip" },
  { icon: HelpCircle,     label: "Submit Request",      color: "#fb7185", bg: "rgba(244,63,94,0.15)",   href: "/support/submit-ticket" },
];

function ServiceGrid({ items, onNavigate }: { items: ServiceItem[]; onNavigate: (item: ServiceItem) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px 8px", padding: "16px 0 0" }}>
      {items.map((item, idx) => (
        <motion.button
          key={idx}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onNavigate(item)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            background: "none", border: "none", cursor: "pointer", padding: "2px 0",
          }}
        >
          <div style={{
            width: 54, height: 54, borderRadius: 16,
            background: item.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${item.color}22`,
          }}>
            <item.icon size={22} color={item.color} />
          </div>
          <span style={{
            color: "#EAECEF", fontSize: 11, fontWeight: 600,
            textAlign: "center", lineHeight: 1.3, maxWidth: 72,
            whiteSpace: "pre-line",
          }}>
            {item.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginTop: 28, marginBottom: 4 }}>
      <span style={{ fontSize: 15, fontWeight: 800, color: "#EAECEF" }}>{title}</span>
    </div>
  );
}

export default function Services() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const handleNavigate = (item: ServiceItem) => {
    if (item.switchToMarket) {
      setLocation("/");
      return;
    }
    if (item.href) setLocation(item.href);
  };

  // Flat search filter across all services
  const allItems = [
    ...COMMON_FUNCTION.map(i => ({ ...i, category: "Common Function" })),
    ...EARN_WEALTH.map(i => ({ ...i, category: "Earn & Wealth" })),
    ...SUPPORT_COMMUNITY.map(i => ({ ...i, category: "Support & Community" })),
  ];
  const q = searchQuery.toLowerCase().trim();
  const filtered = q ? allItems.filter(i => i.label.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)) : null;

  return (
    <div style={{
      minHeight: "100dvh", width: "100%", background: BG, color: "#F5F5F5",
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      paddingBottom: 100, boxSizing: "border-box",
    }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.06) 0%,transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* ── HEADER ── */}
      <motion.header
        initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35 }}
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(4,8,20,0.95)", backdropFilter: "blur(22px)",
          borderBottom: `1px solid ${BORDER_GOLD}`,
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setLocation("/")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 6px 6px 0", display: "flex", alignItems: "center" }}
          >
            <ArrowLeft size={22} color="#EAECEF" />
          </motion.button>

          <span style={{ fontSize: 16, fontWeight: 800, color: "#EAECEF", letterSpacing: 0.2 }}>Services</span>

          {/* Spacer to keep title centered */}
          <div style={{ width: 34 }} />
        </div>
      </motion.header>

      {/* ── BODY ── */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, width: "100%", margin: "0 auto", padding: "20px 16px 0", boxSizing: "border-box" }}>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, boxShadow: searchFocused ? `0 0 0 2px ${GOLD}44,0 8px 32px rgba(0,0,0,0.4)` : "0 2px 14px rgba(0,0,0,0.2)" }}
          transition={{ delay: 0.08 }}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${searchFocused ? BORDER_GOLD : BORDER}`,
            borderRadius: 14, padding: "0 16px", height: 46,
            transition: "border-color 0.2s",
          }}
        >
          <Search size={15} color={searchFocused ? GOLD : "#8B93A7"} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search more services"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "#F5F5F5", fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif", minWidth: 0,
            }}
          />
          {searchQuery && (
            <motion.button
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
            >
              <X size={13} color="#8B93A7" />
            </motion.button>
          )}
        </motion.div>

        {/* ── SEARCH RESULTS ── */}
        {filtered ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#8B93A7", fontSize: 14 }}>No services found</div>
            ) : (
              <>
                <SectionHeader title={`Results (${filtered.length})`} />
                <ServiceGrid items={filtered} onNavigate={handleNavigate} />
              </>
            )}
          </motion.div>
        ) : (
          /* ── FULL CATEGORIES ── */
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>

            {/* Category 1 */}
            <SectionHeader title="Common Function" />
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "8px 12px 16px" }}>
              <ServiceGrid items={COMMON_FUNCTION} onNavigate={handleNavigate} />
            </div>

            {/* Category 2 */}
            <SectionHeader title="Earn & Wealth" />
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "8px 12px 16px" }}>
              <ServiceGrid items={EARN_WEALTH} onNavigate={handleNavigate} />
            </div>

            {/* Category 3 */}
            <SectionHeader title="Support & Community" />
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "8px 12px 16px" }}>
              <ServiceGrid items={SUPPORT_COMMUNITY} onNavigate={handleNavigate} />
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}
