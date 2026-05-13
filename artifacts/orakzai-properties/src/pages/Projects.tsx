import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  FolderOpen,
  Building2,
  TrendingUp,
  MapPin,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { useGetInvestmentProjects } from "@workspace/api-client-react";

const GOLD = "#D4AF37";
const BG = "#050505";

function formatPKR(n: number) {
  if (n >= 10_000_000) return `₨ ${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₨ ${(n / 100_000).toFixed(1)}L`;
  return `₨ ${n.toLocaleString()}`;
}

export default function Projects() {
  const { data: projects } = useGetInvestmentProjects();

  const items = projects ?? [];

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
            top: "5%",
            left: "20%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(212,175,55,0.05)",
            filter: "blur(100px)",
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
              <FolderOpen size={16} color={GOLD} />
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
                Investment Projects
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                Premium real estate opportunities
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}
        >
          {[
            { label: "Active Projects", value: items.length || "6" },
            { label: "Min. Investment", value: "₨ 10L" },
            { label: "Avg. Return", value: "18% p.a." },
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

        {/* Featured Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 24 }}
        >
          <Link href="/project/azan-smart-city">
            <div
              style={{
                background: `linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.04) 100%)`,
                border: `1px solid rgba(212,175,55,0.3)`,
                borderRadius: 20,
                padding: "20px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: 12, right: 12 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "rgba(212,175,55,0.15)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontSize: 9,
                    fontWeight: 800,
                    color: GOLD,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  <Sparkles size={9} />
                  Featured
                </div>
              </div>

              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Building2 size={22} color={GOLD} />
              </div>

              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#ffffff",
                  margin: "0 0 4px",
                }}
              >
                Azan Smart City
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 16px" }}>
                Pakistan's first fully integrated smart city development
              </p>

              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Min. Investment</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>₨ 25L</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Expected Return</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>22% p.a.</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Status</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Phase 1</div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 16,
                  color: GOLD,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <ArrowUpRight size={15} />
                View Details
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Projects Section Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <TrendingUp size={13} color={GOLD} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            All Projects
          </span>
        </div>

        {/* Dynamic Project List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.length > 0
            ? items.map((project: any, i: number) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                >
                  <Link href={`/invest/${project.id}`}>
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
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "rgba(212,175,55,0.1)",
                          border: "1px solid rgba(212,175,55,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Building2 size={18} color={GOLD} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>
                          {project.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={9} color="rgba(255,255,255,0.3)" />
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{project.location ?? "Pakistan"}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>
                          {project.minInvestment ? formatPKR(project.minInvestment) : "—"}
                        </div>
                        <div style={{ fontSize: 10, color: "#10b981", marginTop: 2 }}>
                          {project.expectedReturn ?? "—"}
                        </div>
                      </div>
                      <ChevronRight size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                    </div>
                  </Link>
                </motion.div>
              ))
            : /* Fallback static cards if API not loaded */
              [
                { name: "DHA Lahore Phase 9", location: "Lahore", min: "₨ 50L", ret: "16% p.a." },
                { name: "Bahria Town Islamabad", location: "Islamabad", min: "₨ 30L", ret: "14% p.a." },
                { name: "Blue World City", location: "Rawalpindi", min: "₨ 10L", ret: "20% p.a." },
                { name: "Gulberg Residencia", location: "Lahore", min: "₨ 20L", ret: "15% p.a." },
              ].map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                >
                  <Link href="/invest">
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
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "rgba(212,175,55,0.1)",
                          border: "1px solid rgba(212,175,55,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Building2 size={18} color={GOLD} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>
                          {p.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={9} color="rgba(255,255,255,0.3)" />
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{p.location}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{p.min}</div>
                        <div style={{ fontSize: 10, color: "#10b981", marginTop: 2 }}>{p.ret}</div>
                      </div>
                      <ChevronRight size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                    </div>
                  </Link>
                </motion.div>
              ))}
        </div>
      </div>
    </div>
  );
}
