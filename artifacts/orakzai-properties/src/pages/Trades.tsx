import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  Activity,
  BarChart3,
  ChevronRight,
  Zap,
} from "lucide-react";

const GOLD = "#D4AF37";
const BG = "#050505";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const FEATURED_ASSETS = [
  {
    id: "azan-smart-city",
    name: "Azan Smart City",
    ticker: "ASC",
    price: "PKR 1,240",
    change: "+4.8%",
    up: true,
    volume: "PKR 12.4Cr",
    shares: "2,500",
  },
  {
    id: "dha-lahore-phase-9",
    name: "DHA Lahore Ph-9",
    ticker: "DHA9",
    price: "PKR 8,750",
    change: "+1.2%",
    up: true,
    volume: "PKR 3.1Cr",
    shares: "450",
  },
  {
    id: "bahria-town-islamabad",
    name: "Bahria Town Isb",
    ticker: "BTI",
    price: "PKR 5,100",
    change: "-0.7%",
    up: false,
    volume: "PKR 6.8Cr",
    shares: "820",
  },
  {
    id: "gulberg-residencia",
    name: "Gulberg Residencia",
    ticker: "GBR",
    price: "PKR 3,620",
    change: "+2.3%",
    up: true,
    volume: "PKR 1.9Cr",
    shares: "380",
  },
];

const RECENT_TRADES = [
  { type: "BUY", asset: "ASC", shares: 10, price: "PKR 1,240", time: "2m ago", status: "Filled" },
  { type: "SELL", asset: "DHA9", shares: 5, price: "PKR 8,700", time: "1h ago", status: "Filled" },
  { type: "BUY", asset: "BTI", shares: 20, price: "PKR 5,050", time: "3h ago", status: "Filled" },
];

export default function Trades() {
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
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "10%",
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(212,175,55,0.05)",
            filter: "blur(90px)",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <div style={{ paddingTop: 52, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(212,175,55,0.12)",
                border: "1px solid rgba(212,175,55,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Activity size={16} color={GOLD} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  margin: 0,
                  color: "#ffffff",
                }}
              >
                Trading Floor
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                Real-time property share market
              </p>
            </div>
          </div>
        </div>

        {/* Market Summary Strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {[
            { label: "Market Cap", value: "₨ 48.6Cr" },
            { label: "24h Volume", value: "₨ 3.2Cr" },
            { label: "Active Orders", value: "124" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                padding: "12px 10px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: GOLD, fontFamily: "'Playfair Display', serif" }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Live Assets */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Zap size={13} color={GOLD} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Live Assets
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                color: "#10b981",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                  animation: "pulse 1.5s infinite",
                  display: "inline-block",
                }}
              />
              LIVE
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FEATURED_ASSETS.map((asset, i) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
              >
                <Link href={`/trade/${asset.id}`}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 16,
                      padding: "16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.3)";
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(212,175,55,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                    }}
                  >
                    {/* Ticker badge */}
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        background: "rgba(212,175,55,0.1)",
                        border: "1px solid rgba(212,175,55,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 10,
                        fontWeight: 800,
                        color: GOLD,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {asset.ticker}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>
                        {asset.name}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                        Vol: {asset.volume}
                      </div>
                    </div>

                    {/* Price + Change */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
                        {asset.price}
                      </div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 11,
                          fontWeight: 700,
                          color: asset.up ? "#10b981" : "#ef4444",
                          background: asset.up ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          borderRadius: 6,
                          padding: "2px 7px",
                        }}
                      >
                        {asset.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {asset.change}
                      </div>
                    </div>

                    <ChevronRight size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Trades */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <BarChart3 size={13} color={GOLD} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Recent Trades
            </span>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {RECENT_TRADES.map((trade, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderBottom: i < RECENT_TRADES.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: trade.type === "BUY" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${trade.type === "BUY" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                    color: trade.type === "BUY" ? "#10b981" : "#ef4444",
                  }}
                >
                  {trade.type}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>
                    {trade.shares} shares · {trade.asset}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Clock size={9} color="rgba(255,255,255,0.3)" />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{trade.time}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{trade.price}</div>
                  <div style={{ fontSize: 10, color: "#10b981", marginTop: 2 }}>{trade.status}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA to full platform */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: 20 }}
        >
          <Link href="/invest">
            <button
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 16,
                background: `linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)`,
                border: `1px solid rgba(212,175,55,0.3)`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: GOLD,
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "all 0.2s",
              }}
            >
              <ArrowUpRight size={16} />
              Browse All Investment Projects
            </button>
          </Link>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
