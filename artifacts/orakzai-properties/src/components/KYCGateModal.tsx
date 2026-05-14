import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, CheckCircle2, ArrowRight } from "lucide-react";

const GOLD = "#D4AF37";

interface KYCGateModalProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function KYCGateModal({ open, onClose, featureName }: KYCGateModalProps) {
  const [, setLocation] = useLocation();

  const handleGoKYC = () => {
    onClose();
    setLocation("/kyc");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 9999,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 30 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10000,
              width: "min(420px, calc(100vw - 32px))",
              background: "linear-gradient(165deg, #0c0c0c 0%, #0f0b04 60%, #080808 100%)",
              border: `1px solid rgba(212,175,55,0.45)`,
              borderRadius: 24,
              padding: "32px 28px 28px",
              boxShadow: `0 0 0 1px rgba(212,175,55,0.1), 0 40px 80px rgba(0,0,0,0.8), 0 0 120px rgba(212,175,55,0.12)`,
              overflow: "hidden",
            }}
          >
            {/* Gold shimmer top line */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            }} />

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={14} color="rgba(255,255,255,0.5)" />
            </button>

            {/* Icon */}
            <div style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 70%)",
              border: `2px solid rgba(212,175,55,0.5)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: `0 0 40px rgba(212,175,55,0.25)`,
            }}>
              <Shield size={28} color={GOLD} />
            </div>

            {/* Title */}
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#ffffff",
              textAlign: "center",
              margin: "0 0 8px",
              letterSpacing: "-0.01em",
            }}>
              KYC Verification Required
            </h2>

            {/* Subtitle */}
            <p style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
              lineHeight: 1.7,
              margin: "0 0 24px",
            }}>
              To access{featureName ? ` ${featureName}` : " this feature"}, you must complete your identity verification.
              This ensures secure real estate transactions for all users.
            </p>

            {/* Benefits list */}
            <div style={{
              background: "rgba(212,175,55,0.06)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 24,
            }}>
              {[
                "Secure buy & sell transactions",
                "Access trading floor & wallet",
                "Book new project plots",
                "Gold Verified badge on profile",
              ].map((item) => (
                <div key={item} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                  lastChild: { marginBottom: 0 },
                }}>
                  <CheckCircle2 size={14} color={GOLD} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{item}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleGoKYC}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 16,
                background: `linear-gradient(135deg, ${GOLD} 0%, #c49b28 60%, #b8891f 100%)`,
                border: "none",
                color: "#050505",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: `0 8px 32px rgba(212,175,55,0.35)`,
                transition: "transform 0.15s, box-shadow 0.15s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 40px rgba(212,175,55,0.45)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 32px rgba(212,175,55,0.35)`;
              }}
            >
              <Shield size={16} />
              Verify My Identity Now
              <ArrowRight size={16} />
            </button>

            {/* Footer note */}
            <p style={{
              textAlign: "center",
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              marginTop: 14,
              marginBottom: 0,
            }}>
              256-bit encrypted · SECP compliant · 24–48hr review
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
