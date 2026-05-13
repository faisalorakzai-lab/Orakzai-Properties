import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Home, FolderOpen, TrendingUp, Wallet, User } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Projects", icon: FolderOpen, href: "/projects" },
  { label: "Trades", icon: TrendingUp, href: "/trades" },
  { label: "Assets", icon: Wallet, href: "/wallet" },
  { label: "Profile", icon: User, href: "/profile" },
];

export default function BottomNav() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(5, 5, 5, 0.82)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(212, 175, 55, 0.18)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.6), 0 -1px 0 rgba(212,175,55,0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "10px 8px 10px",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <button
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  padding: "6px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  position: "relative",
                  minWidth: 52,
                  transition: "all 0.2s ease",
                }}
                aria-label={item.label}
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
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
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="nav-dot"
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
        })}
      </div>
    </nav>
  );
}
