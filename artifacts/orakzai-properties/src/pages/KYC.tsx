import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  Camera,
  Shield,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { useUser } from "@/contexts/AuthContext";
import { submitKYC } from "@/lib/supabase";

const GOLD = "#D4AF37";
const BG = "#050505";

type KYCStatus = "not_started" | "in_progress" | "pending_review" | "approved" | "rejected";
type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = [
  { id: 0, label: "Personal Info", icon: User },
  { id: 1, label: "ID Document", icon: FileText },
  { id: 2, label: "Selfie", icon: Camera },
  { id: 3, label: "Address Proof", icon: Shield },
  { id: 4, label: "Review", icon: CheckCircle2 },
];

const DOC_TYPES = [
  { value: "cnic", label: "CNIC (National ID Card)" },
  { value: "passport", label: "Passport" },
  { value: "driving_license", label: "Driving License" },
];

const COUNTRIES = [
  "Pakistan", "United Arab Emirates", "Saudi Arabia", "United Kingdom",
  "United States", "Canada", "Australia", "Germany", "France",
  "Turkey", "Qatar", "Kuwait", "Bahrain", "Oman", "Malaysia",
  "China", "India", "Afghanistan", "Other",
];

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 99,
            background:
              i < step
                ? GOLD
                : i === step
                ? `rgba(212,175,55,0.5)`
                : "rgba(255,255,255,0.1)",
            transition: "background 0.4s",
          }}
        />
      ))}
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 28 }}>
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.id} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: done
                  ? GOLD
                  : active
                  ? "rgba(212,175,55,0.15)"
                  : "rgba(255,255,255,0.05)",
                border: done
                  ? `2px solid ${GOLD}`
                  : active
                  ? `2px solid ${GOLD}`
                  : "2px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s",
                flexShrink: 0,
              }}
            >
              {done ? (
                <Check size={14} color="#050505" strokeWidth={3} />
              ) : (
                <Icon size={14} color={active ? GOLD : "rgba(255,255,255,0.3)"} />
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: 28,
                  height: 2,
                  background: done ? GOLD : "rgba(255,255,255,0.1)",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FileUploadZone({
  label,
  hint,
  file,
  onFile,
  accept = "image/*,application/pdf",
}: {
  label: string;
  hint: string;
  file: File | null;
  onFile: (f: File) => void;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (f: File) => {
    onFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
        {label}
      </div>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        style={{
          border: `2px dashed ${dragging || file ? GOLD : "rgba(255,255,255,0.15)"}`,
          borderRadius: 16,
          padding: "24px 16px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging
            ? "rgba(212,175,55,0.08)"
            : file
            ? "rgba(212,175,55,0.05)"
            : "rgba(255,255,255,0.02)",
          transition: "all 0.2s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <input
          ref={ref}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {preview ? (
          <div>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxHeight: 120,
                maxWidth: "100%",
                borderRadius: 8,
                objectFit: "contain",
                marginBottom: 8,
              }}
            />
            <div style={{ fontSize: 11, color: GOLD, fontWeight: 600 }}>{file?.name}</div>
          </div>
        ) : file ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <FileText size={28} color={GOLD} />
            <div style={{ fontSize: 12, color: GOLD, fontWeight: 600 }}>{file.name}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
              {(file.size / 1024).toFixed(0)} KB
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Upload size={24} color="rgba(255,255,255,0.3)" />
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
              Tap to upload
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{hint}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#f1f5f9",
  fontSize: 13,
  outline: "none",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

function Step0PersonalInfo({
  data,
  onChange,
}: {
  data: any;
  onChange: (k: string, v: string) => void;
}) {
  const { user } = useUser();

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6, marginTop: 0 }}>
        Personal Information
      </h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        Provide your legal details exactly as they appear on your official documents.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[
          { key: "fullName", label: "Full Legal Name", placeholder: user?.fullName ?? "As on CNIC / Passport" },
          { key: "fatherName", label: "Father's Name", placeholder: "Father's full name" },
          { key: "cnic", label: "CNIC / Passport Number", placeholder: "e.g. 35202-1234567-1" },
          { key: "dob", label: "Date of Birth", placeholder: "YYYY-MM-DD", type: "date" },
          { key: "phone", label: "Mobile Number", placeholder: "+92 300 0000000" },
          { key: "address", label: "Residential Address", placeholder: "Full address including city" },
          { key: "city", label: "City", placeholder: "e.g. Lahore" },
          { key: "occupation", label: "Occupation", placeholder: "e.g. Business Owner" },
        ].map((field) => (
          <FormField key={field.key} label={field.label}>
            <input
              type={field.type ?? "text"}
              value={data[field.key] ?? ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = `rgba(212,175,55,0.5)`)}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </FormField>
        ))}

        {/* Country */}
        <FormField label="Country of Residence">
          <select
            value={data.country ?? ""}
            onChange={(e) => onChange("country", e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.1)",
              color: data.country ? "#f1f5f9" : "rgba(255,255,255,0.3)",
              fontSize: 13,
              outline: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: "pointer",
            }}
          >
            <option value="">Select country</option>
            {COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>

        {/* Source of Funds */}
        <FormField label="Source of Funds">
          <select
            value={data.sourceOfFunds ?? ""}
            onChange={(e) => onChange("sourceOfFunds", e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.1)",
              color: data.sourceOfFunds ? "#f1f5f9" : "rgba(255,255,255,0.3)",
              fontSize: 13,
              outline: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: "pointer",
            }}
          >
            <option value="">Select source of funds</option>
            <option value="business">Business Income</option>
            <option value="salary">Salary / Employment</option>
            <option value="investment">Investment Returns</option>
            <option value="inheritance">Inheritance</option>
            <option value="rental">Rental Income</option>
            <option value="other">Other</option>
          </select>
        </FormField>
      </div>
    </div>
  );
}

function Step1IDDocument({ data, onChange }: { data: any; onChange: (k: string, v: any) => void }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6, marginTop: 0 }}>
        Identity Document
      </h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        Upload a clear scan or photo of your government-issued ID. Both sides required for CNIC.
      </p>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Document Type
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {DOC_TYPES.map((dt) => (
            <button
              key={dt.value}
              onClick={() => onChange("docType", dt.value)}
              style={{
                flex: 1,
                padding: "10px 8px",
                borderRadius: 12,
                border: `1px solid ${data.docType === dt.value ? GOLD : "rgba(255,255,255,0.1)"}`,
                background: data.docType === dt.value ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                color: data.docType === dt.value ? GOLD : "rgba(255,255,255,0.5)",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "all 0.2s",
              }}
            >
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FileUploadZone
          label="Front Side"
          hint="JPG, PNG or PDF · Max 10MB"
          file={data.docFront ?? null}
          onFile={(f) => onChange("docFront", f)}
        />
        {data.docType !== "passport" && (
          <FileUploadZone
            label="Back Side"
            hint="JPG, PNG or PDF · Max 10MB"
            file={data.docBack ?? null}
            onFile={(f) => onChange("docBack", f)}
          />
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          padding: "12px 14px",
          borderRadius: 12,
          background: "rgba(212,175,55,0.06)",
          border: "1px solid rgba(212,175,55,0.2)",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <AlertCircle size={14} color={GOLD} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          Ensure all four corners are visible, text is readable, and there is no glare or shadow. Documents must be valid and not expired.
        </div>
      </div>
    </div>
  );
}

function Step2Selfie({ data, onChange }: { data: any; onChange: (k: string, v: any) => void }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6, marginTop: 0 }}>
        Selfie Verification
      </h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        Take a selfie holding your ID document next to your face to confirm your identity.
      </p>

      <FileUploadZone
        label="Selfie with ID Document"
        hint="Hold your ID next to your face · Clear lighting required"
        file={data.selfie ?? null}
        onFile={(f) => onChange("selfie", f)}
        accept="image/*"
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        {[
          "Face clearly visible and not covered",
          "ID document held open beside your face",
          "Good lighting — no shadows or glare",
          "No filters, editing or screenshots",
        ].map((tip) => (
          <div key={tip} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "rgba(212,175,55,0.12)",
                border: "1px solid rgba(212,175,55,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Check size={10} color={GOLD} strokeWidth={3} />
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step3AddressProof({ data, onChange }: { data: any; onChange: (k: string, v: any) => void }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6, marginTop: 0 }}>
        Proof of Address
      </h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        Provide a document confirming your current residential address (must be issued within the last 3 months).
      </p>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Document Type
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { value: "utility_bill", label: "Utility Bill" },
            { value: "bank_statement", label: "Bank Statement" },
            { value: "rental_agreement", label: "Rental Agreement" },
            { value: "tax_certificate", label: "Tax Certificate" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange("addressDocType", opt.value)}
              style={{
                padding: "10px 8px",
                borderRadius: 12,
                border: `1px solid ${data.addressDocType === opt.value ? GOLD : "rgba(255,255,255,0.1)"}`,
                background: data.addressDocType === opt.value ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                color: data.addressDocType === opt.value ? GOLD : "rgba(255,255,255,0.5)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "all 0.2s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <FileUploadZone
        label="Address Proof Document"
        hint="JPG, PNG or PDF · Max 10MB · Issued within 3 months"
        file={data.addressDoc ?? null}
        onFile={(f) => onChange("addressDoc", f)}
      />
    </div>
  );
}

function Step4Review({ data }: { data: any }) {
  const sections = [
    {
      title: "Personal Information",
      items: [
        { label: "Full Name", value: data.personal?.fullName },
        { label: "CNIC / Passport", value: data.personal?.cnic },
        { label: "Date of Birth", value: data.personal?.dob },
        { label: "Phone", value: data.personal?.phone },
        { label: "City", value: data.personal?.city },
        { label: "Country", value: data.personal?.country },
        { label: "Occupation", value: data.personal?.occupation },
        { label: "Source of Funds", value: data.personal?.sourceOfFunds },
      ],
    },
    {
      title: "Documents",
      items: [
        { label: "ID Type", value: data.doc?.docType?.toUpperCase() },
        { label: "ID Front", value: data.doc?.docFront?.name },
        { label: "ID Back", value: data.doc?.docBack?.name },
        { label: "Selfie", value: data.selfie?.selfie?.name },
        { label: "Address Doc Type", value: data.address?.addressDocType },
        { label: "Address Proof", value: data.address?.addressDoc?.name },
      ],
    },
  ];

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6, marginTop: 0 }}>
        Review & Submit
      </h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        Please verify all details before submitting. Once submitted, our compliance team will review within 24–48 hours.
      </p>

      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            {section.title}
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
            {section.items.map((item, i) => (
              item.value ? (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "11px 14px",
                    borderBottom: i < section.items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", maxWidth: "55%", textAlign: "right", wordBreak: "break-all" }}>
                    {item.value}
                  </span>
                </div>
              ) : null
            ))}
          </div>
        </div>
      ))}

      <div style={{ padding: "14px", borderRadius: 14, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Shield size={14} color={GOLD} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            By submitting, you confirm that all information provided is accurate and complete. False information may result in account suspension. Your data is encrypted and processed in compliance with Pakistan's data protection laws.
          </div>
        </div>
      </div>
    </div>
  );
}

function KYCStatusBanner({ status }: { status: KYCStatus }) {
  if (status === "not_started") return null;

  const config = {
    pending_review: {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.25)",
      icon: Clock,
      title: "Under Review",
      subtitle: "Our compliance team is reviewing your documents. This usually takes 24–48 hours.",
    },
    approved: {
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.25)",
      icon: CheckCircle2,
      title: "KYC Approved",
      subtitle: "Your identity has been verified. You now have full access to all investment features.",
    },
    rejected: {
      color: "#ef4444",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.25)",
      icon: X,
      title: "Verification Failed",
      subtitle: "Your documents could not be verified. Please resubmit with clearer, valid documents.",
    },
    in_progress: {
      color: GOLD,
      bg: "rgba(212,175,55,0.08)",
      border: "rgba(212,175,55,0.25)",
      icon: Shield,
      title: "In Progress",
      subtitle: "Your KYC application is incomplete. Complete all steps to submit.",
    },
  }[status];

  if (!config) return null;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "16px",
        borderRadius: 16,
        background: config.bg,
        border: `1px solid ${config.border}`,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${config.color}20`,
          border: `1px solid ${config.color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={config.color} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: config.color, marginBottom: 4 }}>
          {config.title}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          {config.subtitle}
        </div>
      </div>
    </motion.div>
  );
}

export default function KYC() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus>("not_started");

  const [personalData, setPersonalData] = useState<Record<string, string>>({});
  const [docData, setDocData] = useState<Record<string, any>>({ docType: "cnic" });
  const [selfieData, setSelfieData] = useState<Record<string, any>>({});
  const [addressData, setAddressData] = useState<Record<string, any>>({});

  const updatePersonal = (k: string, v: string) => setPersonalData((p) => ({ ...p, [k]: v }));
  const updateDoc = (k: string, v: any) => setDocData((p) => ({ ...p, [k]: v }));
  const updateSelfie = (k: string, v: any) => setSelfieData((p) => ({ ...p, [k]: v }));
  const updateAddress = (k: string, v: any) => setAddressData((p) => ({ ...p, [k]: v }));

  const canNext = () => {
    if (step === 0) return personalData.fullName && personalData.cnic && personalData.dob && personalData.phone;
    if (step === 1) return docData.docType && docData.docFront;
    if (step === 2) return selfieData.selfie;
    if (step === 3) return addressData.addressDoc;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const email = user.email ?? "" ?? "";
      const ok = await submitKYC(
        user.uid,
        email,
        personalData,
        docData.docType ?? "cnic",
        addressData.addressDocType ?? ""
      );
      if (ok) {
        setSubmitted(true);
        setKycStatus("pending_review");
      } else {
        setSubmitError("Failed to submit. Please check your connection and try again.");
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: BG,
          color: "#f1f5f9",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          paddingBottom: 100,
        }}
      >
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "20%", left: "30%", width: 300, height: 300, borderRadius: "50%", background: "rgba(212,175,55,0.05)", filter: "blur(100px)" }} />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          style={{ textAlign: "center", maxWidth: 360, position: "relative", zIndex: 1 }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(212,175,55,0.12)",
              border: `2px solid ${GOLD}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: `0 0 40px rgba(212,175,55,0.3)`,
            }}
          >
            <Clock size={32} color={GOLD} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
            Application Submitted
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 32 }}>
            Thank you, your KYC documents have been received. Our compliance team will review your application within <strong style={{ color: GOLD }}>24–48 business hours</strong>. You'll receive a notification once your account is verified.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: CheckCircle2, color: GOLD, label: "Personal information received" },
              { icon: CheckCircle2, color: GOLD, label: "Identity documents received" },
              { icon: CheckCircle2, color: GOLD, label: "Selfie verification received" },
              { icon: CheckCircle2, color: GOLD, label: "Address proof received" },
              { icon: Clock, color: "#f59e0b", label: "Pending compliance review" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon size={16} color={item.color} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
                </div>
              );
            })}
          </div>
          <Link href="/profile">
            <button
              style={{
                marginTop: 32,
                width: "100%",
                padding: "16px",
                borderRadius: 16,
                background: `linear-gradient(135deg, ${GOLD} 0%, #c49b28 100%)`,
                border: "none",
                color: "#050505",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Return to Profile
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        color: "#f1f5f9",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        paddingBottom: 120,
      }}
    >
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "5%", right: "15%", width: 260, height: 260, borderRadius: "50%", background: "rgba(212,175,55,0.04)", filter: "blur(90px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
        {/* Header */}
        <div style={{ paddingTop: 52, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/profile">
            <button
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <ChevronLeft size={16} color="rgba(255,255,255,0.6)" />
            </button>
          </Link>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
              KYC Verification
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              Step {step + 1} of {STEPS.length} · {STEPS[step].label}
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <KYCStatusBanner status={kycStatus} />

        {/* Progress */}
        <ProgressBar step={step} total={STEPS.length} />
        <StepIndicator current={step} />

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && <Step0PersonalInfo data={personalData} onChange={updatePersonal} />}
            {step === 1 && <Step1IDDocument data={docData} onChange={updateDoc} />}
            {step === 2 && <Step2Selfie data={selfieData} onChange={updateSelfie} />}
            {step === 3 && <Step3AddressProof data={addressData} onChange={updateAddress} />}
            {step === 4 && (
              <Step4Review
                data={{ personal: personalData, doc: docData, selfie: selfieData, address: addressData }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Submit Error */}
        {submitError && (
          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", gap: 8, alignItems: "center" }}>
            <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#ef4444" }}>{submitError}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              style={{
                flex: 1,
                padding: "15px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => { if (canNext()) setStep((s) => (s + 1) as Step); }}
              disabled={!canNext()}
              style={{
                flex: 2,
                padding: "15px",
                borderRadius: 16,
                background: canNext()
                  ? `linear-gradient(135deg, ${GOLD} 0%, #c49b28 100%)`
                  : "rgba(255,255,255,0.06)",
                border: "none",
                color: canNext() ? "#050505" : "rgba(255,255,255,0.25)",
                fontSize: 14,
                fontWeight: 800,
                cursor: canNext() ? "pointer" : "not-allowed",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.2s",
                boxShadow: canNext() ? `0 4px 20px rgba(212,175,55,0.3)` : "none",
              }}
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                flex: 2,
                padding: "15px",
                borderRadius: 16,
                background: submitting ? "rgba(212,175,55,0.4)" : `linear-gradient(135deg, ${GOLD} 0%, #c49b28 100%)`,
                border: "none",
                color: "#050505",
                fontSize: 14,
                fontWeight: 800,
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxShadow: `0 4px 20px rgba(212,175,55,0.3)`,
              }}
            >
              <Shield size={16} /> {submitting ? "Submitting..." : "Submit for Verification"}
            </button>
          )}
        </div>

        {/* Security Note */}
        <div style={{ textAlign: "center", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Shield size={11} color="rgba(255,255,255,0.2)" />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
            256-bit encrypted · Compliant with SECP regulations
          </span>
        </div>
      </div>
    </div>
  );
}
