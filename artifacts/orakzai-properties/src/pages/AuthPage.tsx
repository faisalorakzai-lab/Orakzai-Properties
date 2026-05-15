import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, signInWithPhoneNumber,
  RecaptchaVerifier, updateProfile, sendPasswordResetEmail,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, RotateCcw, ChevronDown, ArrowLeft, CheckCircle2 } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const GOLD = "#D4AF37";

type AuthMode = "signin" | "signup" | "forgot";
type AuthMethod = "email" | "phone";

const COUNTRY_CODES = [
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+1", flag: "🇺🇸", name: "US" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
];

function LuxInput({ icon: Icon, type = "text", placeholder, value, onChange, autoComplete, disabled }: {
  icon: React.ElementType; type?: string; placeholder: string; value: string; onChange: (v: string) => void; autoComplete?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === "password";
  return (
    <div style={{ display: "flex", alignItems: "center", background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)", border: `1px solid ${focused ? "rgba(212,175,55,0.55)" : "rgba(255,255,255,0.09)"}`, borderRadius: 14, padding: "0 14px", height: 52, gap: 10, transition: "border-color 0.2s, box-shadow 0.2s", boxShadow: focused ? "0 0 0 3px rgba(212,175,55,0.08)" : "none", opacity: disabled ? 0.5 : 1 }}>
      <Icon size={16} color={focused ? GOLD : "rgba(255,255,255,0.3)"} style={{ flexShrink: 0, transition: "color 0.2s" }} />
      <input type={isPassword ? (showPwd ? "text" : "password") : type} placeholder={placeholder} value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} disabled={disabled}
        style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#ffffff", fontSize: 14, fontFamily: "'Inter', sans-serif" }} />
      {isPassword && (
        <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {showPwd ? <EyeOff size={15} color="rgba(255,255,255,0.3)" /> : <Eye size={15} color="rgba(255,255,255,0.3)" />}
        </button>
      )}
    </div>
  );
}

function GoldButton({ children, onClick, loading, disabled, type = "button" }: {
  children: React.ReactNode; onClick?: () => void; loading?: boolean; disabled?: boolean; type?: "button" | "submit";
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      style={{ width: "100%", height: 52, background: disabled || loading ? "rgba(212,175,55,0.35)" : "linear-gradient(135deg, #D4AF37 0%, #c49b28 45%, #b8891f 100%)", border: "none", borderRadius: 14, color: "#050505", fontSize: 14, fontWeight: 700, fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em", cursor: disabled || loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: disabled || loading ? "none" : "0 6px 28px rgba(212,175,55,0.35)", transition: "transform 0.15s, box-shadow 0.15s" }}>
      {loading ? <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(5,5,5,0.25)", borderTop: "2.5px solid #050505", animation: "spin 0.8s linear infinite" }} /> : children}
    </button>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 12, fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
      {msg}
    </motion.div>
  );
}

function SuccessMsg({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac", fontSize: 12, fontFamily: "'Inter', sans-serif", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
      <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      {msg}
    </motion.div>
  );
}

/* ─── Forgot Password Panel ─── */
function ForgotPasswordPanel({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setError("");
    if (!email) { setError("Please enter your email address."); return; }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}${basePath}/sign-in`,
        handleCodeInApp: false,
      });
      setSent(true);
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/user-not-found") {
        // Don't reveal if user exists — security best practice
        setSent(true);
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a moment before trying again.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 8 }}>
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          style={{ width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 70%)", border: "1.5px solid rgba(212,175,55,0.35)" }}
        >
          <Mail size={28} color={GOLD} />
        </motion.div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "'Inter', sans-serif", marginBottom: 10 }}>
            Check Your Inbox
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', sans-serif", lineHeight: 1.65, maxWidth: 280 }}>
            If an account exists for <strong style={{ color: "rgba(255,255,255,0.7)" }}>{email}</strong>, you'll receive a password reset link shortly.
          </div>
        </div>

        <div style={{ width: "100%", padding: "14px 16px", borderRadius: 14, background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)" }}>
          <div style={{ fontSize: 11, color: "rgba(212,175,55,0.8)", fontFamily: "'Inter', sans-serif", lineHeight: 1.7 }}>
            📬 Check spam/junk folder if you don't see it within 2 minutes.<br />
            🔗 The link expires in 24 hours.<br />
            🔒 Do not share the link with anyone.
          </div>
        </div>

        <button onClick={() => { setSent(false); setEmail(""); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(212,175,55,0.7)", fontSize: 13, fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
          <RotateCcw size={13} /> Send to a different email
        </button>

        <button onClick={onBack}
          style={{ width: "100%", height: 50, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "'Inter', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <ArrowLeft size={14} /> Back to Sign In
        </button>
      </motion.div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
          Enter your email address and we'll send you a link to reset your password.
        </div>
      </div>

      <LuxInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} autoComplete="email" disabled={loading} />

      {error && <ErrorMsg msg={error} />}

      <GoldButton onClick={handleReset} loading={loading} disabled={!email}>
        Send Reset Link
        <ArrowRight size={16} />
      </GoldButton>

      <button onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 13, fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "4px 0" }}>
        <ArrowLeft size={13} /> Back to Sign In
      </button>
    </div>
  );
}

/* ─── Email/Password Auth ─── */
function EmailAuth({ mode, onSwitch, onForgot }: { mode: AuthMode; onSwitch: () => void; onForgot: () => void; }) {
  const [, setLocation] = useLocation();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all required fields."); return; }
    if (mode === "signup" && !name) { setError("Please enter your full name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      if (mode === "signin") { await signInWithEmailAndPassword(auth, email, password); }
      else { const cred = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(cred.user, { displayName: name }); }
      setLocation("/");
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") setError("Invalid email or password. Please try again.");
      else if (code === "auth/email-already-in-use") setError("An account with this email already exists. Please sign in.");
      else if (code === "auth/invalid-email") setError("Please enter a valid email address.");
      else if (code === "auth/too-many-requests") setError("Too many attempts. Please wait and try again.");
      else setError(err?.message ?? "Authentication failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {mode === "signup" && <LuxInput icon={User} placeholder="Full Name" value={name} onChange={setName} autoComplete="name" />}
      <LuxInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} autoComplete="email" />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <LuxInput icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
        {mode === "signin" && (
          <div style={{ textAlign: "right" }}>
            <button onClick={onForgot}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(212,175,55,0.65)", fontSize: 12, fontFamily: "'Inter', sans-serif", padding: "2px 0", transition: "color 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(212,175,55,0.65)"; }}
            >
              Forgot password?
            </button>
          </div>
        )}
      </div>
      {error && <ErrorMsg msg={error} />}
      <GoldButton onClick={handleSubmit} loading={loading}>{mode === "signin" ? "Sign In" : "Create Account"}<ArrowRight size={16} /></GoldButton>
      <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0, fontFamily: "'Inter', sans-serif" }}>
        {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button onClick={onSwitch} style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, fontWeight: 600, fontSize: 13, fontFamily: "'Inter', sans-serif", padding: 0 }}>
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

/* ─── Google ─── */
function GoogleButton() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try { const provider = new GoogleAuthProvider(); provider.addScope("email"); provider.addScope("profile"); await signInWithPopup(auth, provider); setLocation("/"); }
    catch (err: any) { if (err?.code !== "auth/popup-closed-by-user") setError("Google sign-in failed. Please try again."); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <button onClick={handleGoogle} disabled={loading}
        style={{ width: "100%", height: 50, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s" }}
        onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,175,55,0.35)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}>
        {loading ? <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", borderTop: "2px solid rgba(255,255,255,0.6)", animation: "spin 0.8s linear infinite" }} /> : (
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ opacity: 0.7 }}>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
        )}
        Continue with Google
      </button>
      {error && <div style={{ marginTop: 8 }}><ErrorMsg msg={error} /></div>}
    </div>
  );
}

/* ─── Phone Auth ─── */
function PhoneAuth() {
  const [, setLocation] = useLocation();
  const [countryCode, setCountryCode] = useState("+92"); const [showDropdown, setShowDropdown] = useState(false);
  const [phone, setPhone] = useState(""); const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"input" | "otp">("input"); const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [resendTimer, setResendTimer] = useState(0);
  const recaptchaRef = useRef<HTMLDivElement>(null); const verifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (resendTimer > 0) { const t = setTimeout(() => setResendTimer((s) => s - 1), 1000); return () => clearTimeout(t); }
  }, [resendTimer]);

  const setupRecaptcha = useCallback(() => {
    if (!recaptchaRef.current) return;
    if (verifierRef.current) { verifierRef.current.clear(); verifierRef.current = null; }
    verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, { size: "invisible", callback: () => {} });
  }, []);

  const sendOTP = async () => {
    setError("");
    const cleaned = phone.replace(/\s/g, "").replace(/^0+/, "");
    if (!cleaned || cleaned.length < 7) { setError("Please enter a valid phone number."); return; }
    setLoading(true);
    try {
      setupRecaptcha();
      if (!verifierRef.current) throw new Error("reCAPTCHA not ready");
      const result = await signInWithPhoneNumber(auth, `${countryCode}${cleaned}`, verifierRef.current);
      setConfirmation(result); setStage("otp"); setResendTimer(60);
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/invalid-phone-number") setError("Invalid phone number.");
      else if (code === "auth/too-many-requests") setError("Too many attempts. Please wait.");
      else setError("Failed to send OTP. Please try again.");
    } finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    setError("");
    if (!otp || otp.length < 4) { setError("Please enter the OTP."); return; }
    if (!confirmation) { setError("Session expired. Please resend."); return; }
    setLoading(true);
    try { await confirmation.confirm(otp); setLocation("/"); }
    catch { setError("Incorrect OTP. Please try again."); }
    finally { setLoading(false); }
  };

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0];

  if (stage === "otp") return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>OTP sent to <span style={{ color: "#fff", fontWeight: 600 }}>{countryCode} {phone}</span></div>
      <input type="tel" inputMode="numeric" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6}
        style={{ width: "100%", height: 56, background: "rgba(255,255,255,0.04)", border: `1px solid ${otp.length === 6 ? "rgba(212,175,55,0.55)" : "rgba(255,255,255,0.12)"}`, borderRadius: 14, color: "#fff", fontSize: 26, fontWeight: 700, fontFamily: "'Inter', sans-serif", letterSpacing: "0.35em", textAlign: "center", outline: "none", boxSizing: "border-box" }} />
      {error && <ErrorMsg msg={error} />}
      <GoldButton onClick={verifyOTP} loading={loading} disabled={otp.length < 4}>Verify OTP <ArrowRight size={16} /></GoldButton>
      <div style={{ textAlign: "center" }}>
        {resendTimer > 0 ? <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif" }}>Resend in <strong style={{ color: GOLD }}>{resendTimer}s</strong></span>
          : <button onClick={() => { setOtp(""); setConfirmation(null); setStage("input"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif", display: "inline-flex", alignItems: "center", gap: 6 }}><RotateCcw size={13} /> Resend OTP</button>}
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, height: 52, position: "relative" }}>
        <button type="button" onClick={() => setShowDropdown(!showDropdown)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", height: "100%", background: "none", border: "none", borderRight: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", flexShrink: 0 }}>
          <Phone size={15} color="rgba(255,255,255,0.3)" />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{selectedCountry.flag} {countryCode}</span>
          <ChevronDown size={12} color="rgba(255,255,255,0.3)" />
        </button>
        {showDropdown && (
          <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 999, background: "#0d0b08", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 12, marginTop: 4, maxHeight: 200, overflowY: "auto", width: 200, boxShadow: "0 16px 40px rgba(0,0,0,0.7)" }}>
            {COUNTRY_CODES.map((c) => (
              <button key={`${c.code}-${c.name}`} onClick={() => { setCountryCode(c.code); setShowDropdown(false); }}
                style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "'Inter', sans-serif", textAlign: "left" }}>
                <span>{c.flag}</span><span style={{ flex: 1 }}>{c.name}</span><span style={{ color: GOLD, fontWeight: 600 }}>{c.code}</span>
              </button>
            ))}
          </div>
        )}
        <input type="tel" inputMode="numeric" placeholder="300 0000000" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#ffffff", fontSize: 14, fontFamily: "'Inter', sans-serif", padding: "0 14px" }} />
      </div>
      {error && <ErrorMsg msg={error} />}
      <GoldButton onClick={sendOTP} loading={loading} disabled={!phone}>Send OTP <ArrowRight size={16} /></GoldButton>
      <div ref={recaptchaRef} id="recaptcha-container" />
    </motion.div>
  );
}

/* ─── Main Auth Page ─── */
export default function AuthPage({ defaultMode = "signin" }: { defaultMode?: "signin" | "signup" }) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [method, setMethod] = useState<AuthMethod>("email");
  const logoSrc = `${window.location.origin}${basePath}/logo-ob-shield.png`;

  useEffect(() => { setMode(defaultMode); }, [defaultMode]);

  const isForgot = mode === "forgot";
  const isEmailMode = method === "email" || isForgot;

  return (
    <div style={{ minHeight: "100dvh", background: "#050505", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px 48px", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ position: "fixed", top: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-20%", left: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Branding */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
        <img src={logoSrc} alt="Orakzai Properties"
          onError={(e) => { (e.target as HTMLImageElement).src = `${window.location.origin}${basePath}/logo-shield.png`; }}
          style={{ width: 76, height: 76, objectFit: "contain", filter: "drop-shadow(0 0 24px rgba(212,175,55,0.45))" }} />
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 800, color: GOLD, letterSpacing: "0.22em", textTransform: "uppercase" }}>ORAKZAI</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: "rgba(212,175,55,0.5)", letterSpacing: "0.35em", textTransform: "uppercase", marginTop: 2 }}>Properties</div>
          <div style={{ width: 44, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, margin: "8px auto 0" }} />
        </div>
      </div>

      {/* Card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: "100%", maxWidth: 420, background: "rgba(12,10,8,0.92)", backdropFilter: "blur(24px)", border: "1px solid rgba(212,175,55,0.28)", borderRadius: 24, boxShadow: "0 0 0 1px rgba(212,175,55,0.06), 0 32px 80px rgba(0,0,0,0.85)", padding: "32px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.8), transparent)" }} />

        {/* Header */}
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            style={{ marginBottom: 24, textAlign: "center" }}>
            <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
              {isForgot ? "Reset Password" : mode === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.6 }}>
              {isForgot ? "Enter your email to receive a reset link" : mode === "signin" ? "Sign in to your Orakzai Properties account" : "Join the sovereign real estate platform"}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Method tabs — only show when not in forgot mode */}
        {!isForgot && (
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 3, marginBottom: 22 }}>
            {(["email", "phone"] as AuthMethod[]).map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: method === m ? "rgba(212,175,55,0.18)" : "transparent", color: method === m ? GOLD : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: "pointer", transition: "all 0.2s" }}>
                {m === "email" ? "✉ Email" : "📱 Phone"}
              </button>
            ))}
          </div>
        )}

        {/* Auth form */}
        <AnimatePresence mode="wait">
          <motion.div key={`${mode}-${method}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {isForgot ? (
              <ForgotPasswordPanel onBack={() => setMode("signin")} />
            ) : method === "email" ? (
              <EmailAuth mode={mode} onSwitch={() => setMode(mode === "signin" ? "signup" : "signin")} onForgot={() => setMode("forgot")} />
            ) : (
              <PhoneAuth />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Google + divider — only show when not in forgot mode */}
        {!isForgot && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>
            <GoogleButton />
          </>
        )}

        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: "'Inter', sans-serif", lineHeight: 1.7, margin: 0 }}>
            By continuing you agree to our Terms of Service and Privacy Policy.<br />256-bit encrypted · SECP compliant
          </p>
        </div>
      </motion.div>

      <p style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,0.13)", letterSpacing: "0.06em", fontFamily: "'Inter', sans-serif", textTransform: "uppercase" }}>
        Assets of Today · Legacies of Tomorrow
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
