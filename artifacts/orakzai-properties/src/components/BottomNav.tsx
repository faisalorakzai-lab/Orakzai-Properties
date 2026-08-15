import { useLocation, Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  BarChart2,
  ArrowLeftRight,
  Wallet,
  Users,
  Building2,
  Plus,
  Newspaper,
  MessageCircle,
} from "lucide-react";
import { useMode } from "@/contexts/ModeContext";

// ── Exchange Mode nav items ──────────────────────────────────────────────────
const EXCHANGE_ITEMS = [
  { label: "Home",    icon: Home,           href: "/"        },
  { label: "Markets", icon: BarChart2,       href: "/markets" },
  { label: "Trade",   icon: ArrowLeftRight,  href: "/trade"   },
  { label: "Assets",  icon: Wallet,          href: "/wallet"  },
  { label: "Hub",     icon: Users,           href: "/hub"     },
];

// ── Market Mode nav items (center slot = publish CTA) ───────────────────────
const MARKET_ITEMS_LEFT = [
  { label: "Home",       icon: Home,      href: "/"         },
  { label: "Properties", icon: Building2, href: "/projects" },
];
const MARKET_ITEMS_RIGHT = [
  { label: "Updates", icon: Newspaper,      href: "/notifications" },
  { label: "Inbox",   icon: MessageCircle,  href: "/inbox"         },
];

// ── Shared tab button ────────────────────────────────────────────────────────
function NavTab({
  label,
  icon: Icon,
  href,
  active,
  layoutIdSuffix,
}: {
  label: string;
  icon: React.ElementType;
  href: string;
  active: boolean;
  layoutIdSuffix: string;
}) {
  return (
    <Link href={href} style={{ flex: 1 }}>
      <button
        aria-label={label}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          padding: "6px 4px",
          borderRadius: 14,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        {active && (
          <motion.div
            layoutId={`nav-pill-${layoutIdSuffix}`}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 14,
              background: "rgba(212, 175, 55, 0.12)",
              border: "1px solid rgba(212, 175, 55, 0.25)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Icon
            size={20}
            style={{
              color: active ? "#D4AF37" : "rgba(255,255,255,0.35)",
              transition: "color 0.2s",
              strokeWidth: active ? 2.2 : 1.8,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: active ? 700 : 500,
            color: active ? "#D4AF37" : "rgba(255,255,255,0.35)",
            letterSpacing: active ? "0.02em" : "0.01em",
            transition: "color 0.2s, font-weight 0.2s",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            position: "relative",
            zIndex: 1,
          }}
        >
          {label}
        </span>
        {active && (
          <motion.div
            layoutId={`nav-dot-${layoutIdSuffix}`}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#D4AF37",
              position: "relative",
              zIndex: 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </button>
    </Link>
  );
}

export default function BottomNav() {
  const [location] = useLocation();
  const { mode, chartFullScreen } = useMode();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  /* Unmount entirely when the full-screen chart view is open */
  if (chartFullScreen) return null;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(5, 5, 5, 0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(212, 175, 55, 0.18)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.6), 0 -1px 0 rgba(212,175,55,0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {mode === "exchange" ? (
          /* ── EXCHANGE MODE ─── */
          <motion.div
            key="exchange-nav"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              padding: "10px 8px 10px",
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            {EXCHANGE_ITEMS.map((item) => (
              <NavTab
                key={item.href}
                {...item}
                active={isActive(item.href)}
                layoutIdSuffix="ex"
              />
            ))}
          </motion.div>
        ) : (
          /* ── MARKET MODE ─── */
          <motion.div
            key="market-nav"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              padding: "10px 8px 10px",
              maxWidth: 600,
              margin: "0 auto",
              position: "relative",
            }}
          >
            {MARKET_ITEMS_LEFT.map((item) => (
              <NavTab key={item.href} {...item} active={isActive(item.href)} layoutIdSuffix="mk" />
            ))}

            {/* Center Publish CTA */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Link href="/post-property">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.93 }}
                  aria-label="Publish listing"
                  style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "linear-gradient(135deg, #D4AF37 0%, #B8962A 100%)",
                    border: "2.5px solid rgba(255,255,255,0.18)",
                    boxShadow: "0 4px 18px rgba(212,175,55,0.55), 0 2px 6px rgba(0,0,0,0.5)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 2, position: "relative", top: -10,
                  }}
                >
                  <Plus size={26} color="#0a0a0a" strokeWidth={2.8} />
                </motion.button>
              </Link>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#D4AF37", letterSpacing: "0.02em", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: -6 }}>
                Publish
              </span>
            </div>

            {MARKET_ITEMS_RIGHT.map((item) => (
              <NavTab key={item.href} {...item} active={isActive(item.href)} layoutIdSuffix="mk" />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
