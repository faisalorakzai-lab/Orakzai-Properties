import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  FileText,
  Globe2,
  Loader2,
  MapPin,
  MessageCircle,
  Paperclip,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  createVerificationRequest,
  subscribeToVerificationRequest,
  supabase,
  uploadVerificationDocument,
  type VerificationServiceType,
} from "@/lib/supabase";
import { GLOBAL_CITIES, GLOBAL_CITY_COUNT, type GlobalCity } from "@/data/globalCities";

const SERVICES: VerificationServiceType[] = [
  "NOC check and authority status",
  "Land Department ownership verification",
  "Registry audit and title-chain review",
  "Complete Due Diligence Package",
];

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type FilePreview = { file: File; url: string | null };

function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MAX_SEARCH_RESULTS = 120;

export default function VerificationServicesDesk() {
  const [, navigate] = useLocation();
  const minDate = useMemo(todayIso, []);
  const [service, setService] = useState<VerificationServiceType>(SERVICES[0]);
  const [location, setLocation] = useState("");
  const [selectedCity, setSelectedCity] = useState<GlobalCity | null>(null);
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ requestId: string; status: string } | null>(null);
  const [status, setStatus] = useState("Under Audit");

  const previews = useMemo<FilePreview[]>(
    () => files.map((file) => ({ file, url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null })),
    [files],
  );

  useEffect(() => () => previews.forEach((preview) => preview.url && URL.revokeObjectURL(preview.url)), [previews]);

  useEffect(() => {
    if (!submitted) return;
    return subscribeToVerificationRequest(submitted.requestId, (row) => setStatus(row.status || "Under Audit"));
  }, [submitted]);

  const addFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);
    const accepted: File[] = [];
    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: upload PDF, JPG, or PNG only.`);
      } else if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: maximum file size is 10MB.`);
      } else if (!files.some((item) => fileKey(item) === fileKey(file))) {
        accepted.push(file);
      }
    }
    if (accepted.length) {
      setFiles((current) => [...current, ...accepted]);
      setUploadProgress((current) => ({ ...current, ...Object.fromEntries(accepted.map((file) => [fileKey(file), 0])) }));
      accepted.forEach((file) => {
        const key = fileKey(file);
        window.setTimeout(() => setUploadProgress((current) => ({ ...current, [key]: 36 })), 110);
        window.setTimeout(() => setUploadProgress((current) => ({ ...current, [key]: 72 })), 260);
        window.setTimeout(() => setUploadProgress((current) => ({ ...current, [key]: 100 })), 460);
      });
    }
    event.target.value = "";
  };

  const removeFile = (file: File) => {
    setFiles((current) => current.filter((item) => fileKey(item) !== fileKey(file)));
    setUploadProgress((current) => {
      const next = { ...current };
      delete next[fileKey(file)];
      return next;
    });
  };

  const chooseCity = (city: GlobalCity) => {
    setSelectedCity(city);
    setLocation(`${city.city}, ${city.country} · ${city.region}`);
  };

  const submit = async () => {
    const resolvedLocation = selectedCity ? `${selectedCity.city}, ${selectedCity.country} · ${selectedCity.region}` : location.trim();
    if (!resolvedLocation || !preferredDate || preferredDate < minDate) {
      toast.error("Select a global city/area and a date from today onwards.");
      return;
    }
    setSubmitting(true);
    const requestId = crypto.randomUUID();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const documentUrls = await Promise.all(files.map((file) => uploadVerificationDocument(file, requestId)));
      const row = await createVerificationRequest({
        request_id: requestId,
        user_id: user?.id ?? null,
        service_type: service,
        location: resolvedLocation,
        preferred_date: preferredDate,
        notes: notes.trim(),
        document_urls: documentUrls,
        status: "Under Audit",
      });
      setStatus(row.status || "Under Audit");
      setSubmitted({ requestId, status: row.status || "Under Audit" });
      localStorage.setItem("okzbyte_verification_request", JSON.stringify({ ...row, document_urls: documentUrls }));
      toast.success("Property Verification Request Submitted Successfully!");
      window.setTimeout(() => navigate(`/inbox/1?context=verification&requestId=${requestId}`), 700);
    } catch (error) {
      console.error("verification request submission failed", error);
      toast.error(error instanceof Error ? error.message : "Unable to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#030811] pb-8 font-sans text-slate-100">
      <header className="sticky top-0 z-50 border-b border-[#1d2a35] bg-[#030811]">
        <div className="mx-auto flex h-16 w-full max-w-2xl min-w-0 items-center justify-between px-3 sm:px-4">
          <button onClick={() => navigate("/market/services")} aria-label="Back to Services" className="rounded-xl p-2 text-slate-200 transition hover:bg-white/10 hover:text-white active:scale-95">
            <ArrowLeft size={21} />
          </button>
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-100"><FileCheck2 size={18} className="text-cyan-300" /> Services Desk</div>
          <div className="w-9" />
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-2xl min-w-0 overflow-x-hidden px-3 pt-4 sm:px-4 sm:pt-5">
        <section className="relative min-w-0 overflow-hidden rounded-[24px] border border-cyan-400/20 bg-[#0d1924] shadow-[0_18px_55px_rgba(0,0,0,.28)]">
          <div className="relative h-44 overflow-hidden sm:h-52">
            <img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=85" alt="Property document review desk" className="absolute inset-0 h-full w-full object-cover opacity-65" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1924] via-[#0d1924]/45 to-[#071018]/20" />
            <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2 sm:inset-x-5">
              <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-[#09131d]/85 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300"><BadgeCheck size={15} /> Verified Legal Desk</span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/25 bg-[#09131d]/85 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-emerald-300"><ShieldCheck size={13} /> Secure Intake</span>
            </div>
            <div className="absolute inset-x-4 bottom-4 sm:inset-x-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-200">Legal &amp; Due Diligence Desk</div>
              <h1 className="mt-1 break-words text-[29px] font-black leading-[1.05] tracking-[-0.04em] text-white sm:text-4xl">Property Verification</h1>
              <p className="mt-2 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm">NOC checks, land records, registry audits, and document due diligence before you commit capital.</p>
            </div>
          </div>
          <div className="grid min-w-0 grid-cols-3 gap-px border-t border-white/10 bg-white/10">
            <Metric label="COVERAGE" value="NOC + Registry + Land Dept." accent="cyan" />
            <Metric label="RESPONSE" value="Document review desk" accent="slate" />
            <Metric label="STATUS" value="Verified desk" accent="emerald" />
          </div>
        </section>

        {submitted ? (
          <SubmittedState requestId={submitted.requestId} status={status} navigate={navigate} />
        ) : (
          <RequestForm
            service={service}
            setService={setService}
            location={location}
            selectedCity={selectedCity}
            chooseCity={chooseCity}
            clearSelectedCity={() => setSelectedCity(null)}
            setLocation={setLocation}
            preferredDate={preferredDate}
            setPreferredDate={setPreferredDate}
            notes={notes}
            setNotes={setNotes}
            files={files}
            previews={previews}
            uploadProgress={uploadProgress}
            addFiles={addFiles}
            removeFile={removeFile}
            minDate={minDate}
            submitting={submitting}
            submit={submit}
          />
        )}

        <section className="mt-5 min-w-0 rounded-3xl border border-[#233340] bg-[#0b1520] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-black text-white"><Sparkles size={16} className="text-amber-300" /> Operational scope</div>
          <p className="mt-2 text-sm leading-5 text-slate-500">A global legal-audit intake layer for property buyers, investors, developers, and owners.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SERVICES.map((item) => <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.035] px-3 py-2.5 text-xs text-slate-300"><Check size={14} className="shrink-0 text-emerald-300" />{item}</div>)}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: "cyan" | "amber" | "emerald" | "slate" }) {
  const colors = { cyan: "border-cyan-400/20 text-cyan-300", amber: "border-amber-400/20 text-amber-300", emerald: "border-emerald-400/20 text-emerald-300", slate: "border-white/10 text-slate-200" };
  return <div className={`min-w-0 rounded-xl border bg-[#121d28] p-3 ${colors[accent]}`}><div className="truncate text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div><strong className="mt-1.5 block break-words text-[10px] font-bold leading-4 sm:text-[11px]">{value}</strong></div>;
}

function SubmittedState({ requestId, status, navigate }: { requestId: string; status: string; navigate: (path: string) => void }) {
  return (
    <section className="mt-4 rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.07] p-6 text-center shadow-[0_0_30px_rgba(34,197,94,0.10)] backdrop-blur-xl">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-emerald-300/30 bg-emerald-300/10"><Check size={28} className="text-emerald-300" /></div>
      <div className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Request submitted</div>
      <h2 className="mt-2 text-xl font-black text-white">Legal Audit Desk notified</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Request <strong className="font-mono text-slate-100">{requestId}</strong> is now <strong className="text-cyan-300">{status}</strong>. The audit team can post updates and report delivery in Inbox.</p>
      <button onClick={() => navigate(`/inbox/1?context=verification&requestId=${requestId}`)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:brightness-110 active:scale-[0.98]"><MessageCircle size={16} /> Open Legal Audit Desk</button>
    </section>
  );
}

type RequestFormProps = {
  service: VerificationServiceType;
  setService: (value: VerificationServiceType) => void;
  location: string;
  selectedCity: GlobalCity | null;
  chooseCity: (city: GlobalCity) => void;
  clearSelectedCity: () => void;
  setLocation: (value: string) => void;
  preferredDate: string;
  setPreferredDate: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  files: File[];
  previews: FilePreview[];
  uploadProgress: Record<string, number>;
  addFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (file: File) => void;
  minDate: string;
  submitting: boolean;
  submit: () => void;
};

function RequestForm(props: RequestFormProps) {
  const { service, setService, location, selectedCity, chooseCity, clearSelectedCity, setLocation, preferredDate, setPreferredDate, notes, setNotes, files, previews, uploadProgress, addFiles, removeFile, minDate, submitting, submit } = props;
  const disabled = submitting || (!location.trim() && !selectedCity) || !preferredDate || preferredDate < minDate;
  const setCustomLocation = (value: string) => {
    clearSelectedCity();
    setLocation(value);
  };
  return (
    <section className="mt-4 min-w-0 rounded-2xl border border-[#233340] bg-[#0b1520] p-4 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">Request property verification support</div><p className="mt-2 text-xs leading-5 text-slate-400">Share the property location, plot/file reference, seller documents, and the authority you want checked.</p></div>
        <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#23404b] bg-[#13222d] sm:grid"><ClipboardList size={18} className="text-cyan-300" /></div>
      </div>

      <label className="mt-5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Service required<select value={service} onChange={(event) => setService(event.target.value as VerificationServiceType)} className="mt-2 h-11 w-full min-w-0 rounded-xl border border-[#25333e] bg-[#0a141d] px-3 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/20">{SERVICES.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>

      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-[1.25fr_0.75fr]">
        <CitySelector location={location} selectedCity={selectedCity} onSelect={chooseCity} onCustomLocation={setCustomLocation} onClearSelection={clearSelectedCity} />
        <label className="block min-w-0 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Preferred date<div className="relative mt-2"><CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300" /><input type="date" min={minDate} value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} className="h-11 w-full rounded-xl border border-[#25333e] bg-[#0a141d] pl-10 pr-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/20" /></div><span className="mt-1.5 block text-[9px] font-normal normal-case tracking-normal text-slate-500">Appointments available from today onward.</span></label>
      </div>

      <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Request notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Add plot/file reference, seller details, authority, and the audit scope..." className="mt-2 min-h-28 w-full min-w-0 resize-y rounded-xl border border-[#25333e] bg-[#0a141d] px-3 py-3 text-sm font-medium normal-case tracking-normal text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/20" /></label>

      <DocumentUploader files={files} previews={previews} progress={uploadProgress} addFiles={addFiles} removeFile={removeFile} />

      <button onClick={submit} disabled={disabled} className={`group relative mt-5 flex min-h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-bold transition active:scale-[0.98] ${disabled ? "cursor-not-allowed bg-[#263746] text-slate-400" : "bg-[#f0b90b] text-slate-950 hover:bg-[#ffc928]"}`}>
        {!disabled && <span className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/4 -skew-x-12 bg-white/40 blur-md transition-transform duration-700 group-hover:translate-x-[620%]" />}
        {submitting ? <><Loader2 size={17} className="animate-spin" /> Uploading &amp; submitting securely...</> : <><ClipboardList size={17} /> Submit Operational Request <ChevronRight size={16} /></>}
      </button>
      <p className="mt-2 text-center text-[9px] text-slate-600">Your request is stored in the verification ledger and routed to the Legal Audit Desk.</p>
    </section>
  );
}

function CitySelector({ location, selectedCity, onSelect, onCustomLocation, onClearSelection }: { location: string; selectedCity: GlobalCity | null; onSelect: (city: GlobalCity) => void; onCustomLocation: (value: string) => void; onClearSelection: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const normalizedQuery = normalize(query);
  const filtered = useMemo(() => {
    if (!normalizedQuery) return GLOBAL_CITIES.map((city) => ({ city, score: 0 }));
    return GLOBAL_CITIES
      .map((city) => {
        const cityName = normalize(city.city);
        const countryName = normalize(city.country);
        const regionName = normalize(city.region);
        const searchText = `${cityName} ${countryName} ${regionName}`;
        const terms = normalizedQuery.split(" ").filter(Boolean);
        const matchesAllTerms = terms.every((term) => searchText.includes(term));
        if (!matchesAllTerms) return null;
        const exactCity = cityName === normalizedQuery;
        const cityStarts = cityName.startsWith(normalizedQuery);
        const countryStarts = countryName.startsWith(normalizedQuery);
        const score = exactCity ? 3000 : cityStarts ? 2000 : countryStarts ? 1400 : cityName.includes(normalizedQuery) ? 1100 : 700;
        return { city, score };
      })
      .filter((item): item is { city: GlobalCity; score: number } => Boolean(item))
      .sort((a, b) => b.score - a.score || a.city.city.localeCompare(b.city.city));
  }, [normalizedQuery]);
  const limitedResults = normalizedQuery ? filtered.slice(0, MAX_SEARCH_RESULTS) : filtered;
  const grouped = useMemo(() => {
    const map = new Map<string, GlobalCity[]>();
    limitedResults.forEach(({ city }) => map.set(city.group, [...(map.get(city.group) ?? []), city]));
    return map;
  }, [limitedResults]);
  const visibleGroups = normalizedQuery
    ? Array.from(grouped.entries())
    : Array.from(grouped.entries()).map(([group, cities]) => [group, cities.slice(0, group === "🔥 Popular Global Hubs" ? 30 : 6)] as [string, GlobalCity[]]);
  const closeSelector = () => {
    setOpen(false);
    setSuggesting(false);
    setQuery("");
  };
  const useCustomLocation = (value: string) => {
    onClearSelection();
    onCustomLocation(value);
    closeSelector();
  };
  return (
    <div className="relative">
      <label className="block min-w-0 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">City / area<div className="relative mt-2"><MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300" /><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex h-11 w-full items-center justify-between rounded-xl border border-[#25333e] bg-[#0a141d] pl-10 pr-3 text-left text-sm font-semibold text-white outline-none transition hover:border-cyan-300/50 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"><span className={selectedCity || location ? "truncate" : "truncate text-slate-500"}>{selectedCity ? `${selectedCity.flag} ${selectedCity.city}, ${selectedCity.country}` : location || "e.g. DHA Phase 6, Lahore"}</span><ChevronDown size={16} className={`shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} /></button></div></label>
      {open && <div className="absolute inset-x-0 top-[76px] z-50 overflow-hidden rounded-3xl border border-cyan-400/25 bg-[#08111d]/95 shadow-[0_0_36px_rgba(6,182,212,0.2)] backdrop-blur-2xl">
        <div className="border-b border-white/10 p-3"><div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300" /><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setSuggesting(false); }} placeholder="Search city, country, region..." aria-label="Search city, country, or region" className="h-11 w-full rounded-2xl border border-cyan-400/20 bg-slate-950/75 pl-10 pr-10 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/20" /><button type="button" onClick={() => { setQuery(""); setSuggesting(false); }} aria-label="Clear city search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><X size={14} /></button></div><div className="mt-2 flex items-center justify-between gap-3 text-[9px] text-slate-500"><span>{normalizedQuery ? `${filtered.length} matching cities` : `${GLOBAL_CITY_COUNT} cities available`}</span><span>Clear search · exact + partial</span></div></div>
        <div className="max-h-[min(62vh,520px)] overflow-y-auto p-2">
          {visibleGroups.length === 0 ? <div className="p-4 sm:p-5"><div className="text-center text-sm font-bold text-slate-200">No city found for “{query.trim()}”</div><p className="mt-2 text-center text-xs leading-5 text-slate-500">Use the city as a custom location, or suggest it for review so it can be added to the directory.</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => useCustomLocation(query.trim())} className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2.5 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/20">Use custom location</button><button type="button" onClick={() => setSuggesting(true)} className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2.5 text-xs font-bold text-amber-200 transition hover:bg-amber-300/20">Suggest this city</button></div>{suggesting && <CitySuggestionForm initialCity={query.trim()} onCancel={() => setSuggesting(false)} onSaved={(value) => useCustomLocation(value)} />}</div> : visibleGroups.map(([group, cities]) => <div key={group} className="mb-3"><div className="sticky top-0 z-10 bg-[#08111d]/95 px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-300">{group}</div><div className="grid gap-1 sm:grid-cols-2">{cities.map((city) => <button type="button" key={`${city.city}-${city.country}`} onClick={() => { onSelect(city); closeSelector(); }} className="flex min-w-0 items-start gap-2 rounded-2xl border border-transparent px-3 py-2.5 text-left transition hover:border-cyan-400/20 hover:bg-cyan-400/10"><span className="shrink-0 pt-0.5 text-base">{city.flag}</span><span className="min-w-0"><strong className="block truncate text-xs font-bold text-slate-100">{city.city}, {city.country}</strong><span className="mt-0.5 block truncate text-[9px] text-slate-500">{city.region}</span></span></button>)}</div>{!normalizedQuery && cities.length < (group === "🔥 Popular Global Hubs" ? 30 : 6) ? null : !normalizedQuery && <div className="px-2 pt-1 text-[9px] text-slate-600">Search to reveal more cities in this group.</div>}</div>)}
          {normalizedQuery && filtered.length > MAX_SEARCH_RESULTS && <div className="px-2 pb-2 pt-1 text-center text-[9px] text-slate-600">Showing the first {MAX_SEARCH_RESULTS} matches. Refine your search for a shorter list.</div>}
        </div>
        <div className="border-t border-white/10 bg-white/[0.03] px-3 py-2 text-[9px] text-slate-500">Select a city or use a precise neighborhood/property reference in Request Notes.</div>
      </div>}
    </div>
  );
}

function CitySuggestionForm({ initialCity, onCancel, onSaved }: { initialCity: string; onCancel: () => void; onSaved: (value: string) => void }) {
  const [city, setCity] = useState(initialCity);
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [details, setDetails] = useState("");
  const saveSuggestion = () => {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
      toast.error("Enter a city name before sending the suggestion.");
      return;
    }
    try {
      const existing = JSON.parse(localStorage.getItem("okzbyte_city_suggestions") || "[]");
      const suggestions = Array.isArray(existing) ? existing : [];
      suggestions.push({ city: trimmedCity, country: country.trim(), region: region.trim(), details: details.trim(), source: "verification-city-selector", created_at: new Date().toISOString() });
      localStorage.setItem("okzbyte_city_suggestions", JSON.stringify(suggestions));
    } catch (error) {
      console.error("city suggestion storage failed", error);
    }
    toast.success("City suggestion added for review.");
    onSaved([trimmedCity, country.trim()].filter(Boolean).join(", "));
  };
  return <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-3"><div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-200">Suggest a city</div><p className="mt-1 text-[10px] leading-4 text-slate-500">Send the missing location for directory review.</p></div><button type="button" onClick={onCancel} aria-label="Close city suggestion form" className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white"><X size={14} /></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><input value={city} onChange={(event) => setCity(event.target.value)} aria-label="Suggested city name" placeholder="City name" className="h-10 min-w-0 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-amber-300/60" /><input value={country} onChange={(event) => setCountry(event.target.value)} aria-label="Suggested city country" placeholder="Country" className="h-10 min-w-0 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-amber-300/60" /></div><input value={region} onChange={(event) => setRegion(event.target.value)} aria-label="Suggested city region" placeholder="State / province / region (optional)" className="mt-2 h-10 w-full min-w-0 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-amber-300/60" /><textarea value={details} onChange={(event) => setDetails(event.target.value)} aria-label="City suggestion details" rows={2} placeholder="Area, spelling, or any helpful detail (optional)" className="mt-2 min-h-16 w-full resize-y rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-amber-300/60" /><button type="button" onClick={saveSuggestion} className="mt-2 w-full rounded-xl bg-amber-300 px-3 py-2.5 text-xs font-black text-slate-950 transition hover:bg-amber-200">Send city suggestion</button></div>;
}

function DocumentUploader({ files, previews, progress, addFiles, removeFile }: { files: File[]; previews: FilePreview[]; progress: Record<string, number>; addFiles: (event: React.ChangeEvent<HTMLInputElement>) => void; removeFile: (file: File) => void }) {
  return (
    <div className="mt-4 min-w-0 rounded-2xl border border-[#2a3b47] bg-[#10202b] p-4">
      <div className="flex min-w-0 items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cyan-400/25 bg-cyan-400/10"><Paperclip size={18} className="text-cyan-300" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-200">Property documents <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[9px] font-bold text-amber-200">PDF / JPG / PNG</span><span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">10 MB each</span></div><p className="mt-1 break-words text-[10px] leading-4 text-slate-500">Sale deed, allotment letter, NOC copy, or plot map. Files remain private in the verification bucket.</p></div></div>
      <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#253a47] bg-[#112533] text-xs font-bold text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/10"><UploadCloud size={17} /> Add documents<input type="file" accept="application/pdf,image/jpeg,image/png" multiple onChange={addFiles} className="hidden" /></label>
      {files.length > 0 && <div className="mt-3 grid gap-2">{previews.map(({ file, url }) => { const progressValue = progress[fileKey(file)] ?? 0; return <div key={fileKey(file)} className="flex min-w-0 items-center gap-3 rounded-xl border border-[#203743] bg-[#132733] p-2.5"><div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">{url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <FileText size={21} className="text-cyan-300" />}</div><div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-1.5"><span className="min-w-0 truncate text-xs font-bold text-slate-200">{file.name}</span><span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[8px] font-black uppercase text-slate-500">{file.type === "application/pdf" ? "PDF" : "IMAGE"}</span></div><div className="mt-1 text-[9px] text-slate-500">{formatBytes(file.size)} · {progressValue === 100 ? "Ready for secure upload" : "Preparing preview..."}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-all duration-500" style={{ width: `${progressValue}%` }} /></div></div><button type="button" onClick={() => removeFile(file)} aria-label={`Remove ${file.name}`} className="rounded-xl p-2 text-rose-300 transition hover:bg-rose-400/10 hover:text-rose-200"><Trash2 size={15} /></button></div>; })}</div>}
    </div>
  );
}
