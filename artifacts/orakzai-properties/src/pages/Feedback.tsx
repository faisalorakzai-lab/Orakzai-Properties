import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, RefreshCw, Paperclip, MessageSquareQuote,
  FileText, Check, Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ── Theme ──────────────────────────────────────────────── */
const GOLD = "#C9A84C";
const BG = "#040b14";
const CARD_BG = "#1a1f26";
const BORDER = "rgba(255,255,255,0.08)";
const BORDER_GOLD = "rgba(201,168,76,0.28)";

const FOUNDER_AVATAR = `${import.meta.env.BASE_URL}avatar-faisal-round.png`;

const CHAIRMAN_QUOTE =
  "At OkzByte, we listen, care, and improve to innovate and revolutionize the industry by fusing the best of crypto, tokenized assets, and traditional finance for the benefit of our users. Our vision is to empower global seamless trading, and with this, we welcome and appreciate any feedback you have for us to create a faster, safer, and fairer trading environment and bring the next level of trading to you.";

const CHAIRMAN_SIGNATURE = "Muhammad Faisal Orakzai, Founder & Chairman of OkzByte";

/* ── Mock recent updates shown on the page ─────────────── */
const RECENT_UPDATES = [
  { title: "Instant Internal Transfers", desc: "Send tokens to other OkzByte users with zero network fee." },
  { title: "Multi-Chain Withdrawals", desc: "Withdraw via BEP20, TRC20 and Polygon (ERC20) networks." },
  { title: "2FA Security Upgrade", desc: "Email + authenticator codes now protect every withdrawal." },
];

export default function Feedback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [rating, setRating] = useState<number | null>(null);
  const [comments, setComments] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CHAR_LIMIT = 500;

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => {
      const combined = [...prev, ...files].slice(0, 5);
      if (files.length + prev.length > 5) {
        toast({ title: "Maximum 5 attachments allowed", description: "Only your first 5 files were kept." });
      }
      return combined;
    });
    if (e.target) e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === null) {
      toast({ title: "Please select a rating", description: "Tap a number between 0 and 10 before submitting." });
      return;
    }
    setSubmitting(true);
    try {
      const entry = {
        rating,
        comments,
        attachmentCount: attachments.length,
        attachmentNames: attachments.map((f) => f.name),
        submittedAt: new Date().toISOString(),
      };
      const storedRaw = localStorage.getItem("okzbyte_feedback");
      const stored: unknown[] = storedRaw ? JSON.parse(storedRaw) : [];
      (stored as unknown[]).push(entry);
      localStorage.setItem("okzbyte_feedback", JSON.stringify(stored));
      setSubmitted(true);
      toast({ title: "Thank you for your feedback!", description: "Your voice helps OkzByte improve." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = () => {
    setRating(null);
    setComments("");
    setAttachments([]);
    setSubmitted(false);
    toast({ title: "Form cleared", description: "Start fresh with an empty feedback form." });
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: BG,
        color: "#F5F5F5",
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        paddingBottom: 92,
      }}
    >
      {/* ── Ambient glow ───────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, left: "-10%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.07) 0%,transparent 70%)", filter: "blur(90px)" }} />
      </div>

      {/* ── Top bar ────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35 }}
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(4,8,20,0.95)", backdropFilter: "blur(22px)",
          borderBottom: `1px solid ${BORDER_GOLD}`,
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setLocation("/services")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 6px 6px 0", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={22} color="#EAECEF" />
          </motion.button>

          <span style={{ fontSize: 16, fontWeight: 800, color: "#EAECEF", letterSpacing: 0.2 }}>User Feedback</span>

          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" }}>
            <RefreshCw size={19} color="#EAECEF" />
          </motion.button>
        </div>
      </motion.header>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, width: "100%", margin: "0 auto", padding: "26px 16px 8px", boxSizing: "border-box" }}>

        {/* ── Hero title & sub-heading ───────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.6px", lineHeight: 1.15, textAlign: "center" }}>
            We Value Your Feedback
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 17, fontWeight: 800, color: "#fbbf24", textAlign: "center" }}>
            Your Concerns, Our Priority.
          </p>

          {/* ── Intro card ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            style={{ marginTop: 20, background: CARD_BG, borderRadius: 16, padding: 16, border: `1px solid ${BORDER}`, boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <MessageSquareQuote size={20} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#C8CFD9" }}>
                Have an idea to bring <strong style={{ color: "#FFFFFF" }}>OkzByte</strong> to the next level? We're always looking for ways to improve and your feedback is invaluable. Tell us what you think, we can't wait to hear from you!
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ── NPS Rating Scale ───────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          style={{ marginTop: 26 }}
        >
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#EAECEF", lineHeight: 1.45 }}>
            How likely are you to recommend OkzByte to your friends or colleagues? <span style={{ color: "#f87171" }}>*</span>
          </h2>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <span style={{ fontSize: 12, color: "#8B93A7", fontWeight: 600 }}>0 – Not likely at all</span>
            <span style={{ fontSize: 12, color: "#8B93A7", fontWeight: 600 }}>10 – Extremely likely</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 6, marginTop: 12 }}>
            {Array.from({ length: 11 }, (_, i) => i).map((num) => {
              const active = rating === num;
              return (
                <motion.button
                  key={num}
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(num)}
                  style={{
                    aspectRatio: "1 / 1",
                    display: "grid", placeItems: "center",
                    borderRadius: 12, fontSize: 15, fontWeight: 800,
                    border: active ? "1.5px solid #fbbf24" : `1px solid ${BORDER}`,
                    background: active
                      ? "linear-gradient(135deg, #fbbf24 0%, #C9A84C 100%)"
                      : "rgba(255,255,255,0.04)",
                    color: active ? "#040b14" : "#9AA3B5",
                    boxShadow: active ? `0 0 18px rgba(251,191,36,0.35)` : "none",
                    cursor: "pointer", transition: "background 0.2s, color 0.2s, border 0.2s",
                    fontFamily: "inherit",
                  }}
                >
                  {num}
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* ── Comments box ───────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
          style={{ marginTop: 26 }}
        >
          <label style={{ fontSize: 13, fontWeight: 700, color: "#9AA3B5", lineHeight: 1.5 }}>
            Please share the reason for your rating. Tell us what you love about OkzByte or what we can be better at.
          </label>
          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 4 }}>
            <textarea
              value={comments}
              maxLength={CHAR_LIMIT}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Leave your comments here."
              rows={5}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "none", border: "none", outline: "none", resize: "none",
                color: "#F5F5F5", fontSize: 14, lineHeight: 1.55, padding: "10px 14px",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "2px 14px 8px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: comments.length >= CHAR_LIMIT ? "#f87171" : "#6B7384" }}>
                {comments.length} / {CHAR_LIMIT}
              </span>
            </div>
          </div>
        </motion.section>

        {/* ── Attachment upload ──────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ marginTop: 24 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "rgba(201,168,76,0.12)", border: `1px solid ${BORDER_GOLD}`,
                borderRadius: 10, padding: "7px 14px",
                fontSize: 13, fontWeight: 700, color: GOLD, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Paperclip size={14} /> Upload
            </button>
            <span style={{ fontSize: 12, color: "#6B7384", fontWeight: 600 }}>
              Upload any attachments you have (Optional).
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleAttach}
            style={{ display: "none" }}
          />
          {attachments.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {attachments.map((file, index) => (
                <div key={`${file.name}-${index}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    background: CARD_BG, border: `1px solid ${BORDER}`,
                    borderRadius: 10, padding: "6px 10px", fontSize: 12, color: "#C8CFD9",
                    maxWidth: "100%",
                  }}>
                  <FileText size={13} color={GOLD} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                  <button onClick={() => removeAttachment(index)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <span style={{ color: "#f87171", fontSize: 13, lineHeight: 1 }}>✕</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ── Submit button ────────────────────────────────---- */}
        <motion.section
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
          style={{ marginTop: 28 }}
        >
          {submitted ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)",
              borderRadius: 12, padding: "13px 16px", fontSize: 14, fontWeight: 700, color: "#6ee7b7",
            }}>
              <Check size={18} /> Feedback submitted successfully. Thank you!
            </div>
          ) : (
            <motion.button
              whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: "100%",
                background: "#f59e0b",
                color: "#000000", fontWeight: 800,
                fontSize: 16, fontFamily: "inherit",
                border: "none", borderRadius: 14,
                padding: "14px 0", cursor: submitting ? "wait" : "pointer",
                boxShadow: "0 8px 28px rgba(245,158,11,0.28)",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Submitting..." : "Submit"}
            </motion.button>
          )}
        </motion.section>

        {/* ── Founder & Chairman message matching Bybit style ─────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ marginTop: 34 }}
        >
          <div style={{
            background: CARD_BG, borderRadius: 20, padding: 24,
            border: `1px solid ${BORDER}`,
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            textAlign: "center",
          }}>
            <div style={{
              width: 110, height: 110, margin: "0 auto 12px", borderRadius: "50%",
              background: `linear-gradient(135deg, #fbbf24 0%, #C9A84C 100%)`,
              padding: 3.5,
              boxShadow: `0 0 28px rgba(201,168,76,0.35)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              <img
                src={FOUNDER_AVATAR}
                alt="Muhammad Faisal Orakzai"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, background: "rgba(201,168,76,0.12)", border: `1px solid ${BORDER_GOLD}`, borderRadius: 20, padding: "4px 14px" }}>
              <Star size={11} color={GOLD} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: GOLD, letterSpacing: 0.3 }}>FOUNDER &amp; CHAIRMAN OF OKZBYTE</span>
            </div>

            <p style={{
              margin: "18px 0 0", fontSize: 14, lineHeight: 1.7, color: "#C8CFD9", textAlign: "left",
            }}>
              {CHAIRMAN_QUOTE}
            </p>

            <p style={{
              margin: "16px 0 0", fontSize: 13.5, fontWeight: 700, color: GOLD, textAlign: "right",
              fontStyle: "italic",
            }}>
              — {CHAIRMAN_SIGNATURE}
            </p>
          </div>
        </motion.section>

        {/* ── Updates card ───────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
          style={{ marginTop: 22, marginBottom: 8 }}
        >
          <div style={{
            background: CARD_BG, borderRadius: 20, padding: 22,
            border: `1px solid ${BORDER}`,
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: "rgba(201,168,76,0.12)", border: `1px solid ${BORDER_GOLD}`,
                display: "grid", placeItems: "center",
              }}>
                <FileText size={20} color={GOLD} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#C8CFD9" }}>
                  We are constantly making improvements based on your feedback. Have a look at some of the updates we've made!
                </p>
                <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
                  {RECENT_UPDATES.map((u) => (
                    <li key={u.title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <Check size={15} color={GOLD} style={{ flexShrink: 0, marginTop: 3 }} />
                      <span style={{ fontSize: 13, color: "#9AA3B5", lineHeight: 1.45 }}>
                        <strong style={{ color: "#EAECEF" }}>{u.title}</strong> — {u.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

      </div>
    </main>
  );
}
