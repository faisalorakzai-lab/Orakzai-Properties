import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Plus, Trash2, MapPin, Lock, LayoutList, Eye, ToggleLeft,
  ToggleRight, MessageCircle, Home, CheckCircle2, BanIcon,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import {
  useGetMyProperties, useDeleteProperty, useUpdateProperty,
  getGetMyPropertiesQueryKey, getListPropertiesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Show } from "@/contexts/AuthContext";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function formatPrice(price: number, category?: string): string {
  const base =
    price >= 10000000 ? `PKR ${(price / 10000000).toFixed(1)} Crore` :
    price >= 100000   ? `PKR ${(price / 100000).toFixed(0)} Lakh` :
                        `PKR ${price.toLocaleString()}`;
  return category === "rent" ? `${base}/mo` : base;
}

const CAT_STYLE: Record<string, string> = {
  buy:  "text-emerald-400",
  sell: "text-blue-400",
  rent: "text-violet-400",
};

/* ── Rental Inquiries (localStorage) ────────────────────────────────────── */
interface RentalInquiry {
  propertyId: number;
  title: string;
  price: number;
  city: string;
  contactedAt: string;
}

function getRentalInquiries(): RentalInquiry[] {
  try {
    return JSON.parse(localStorage.getItem("rental_inquiries") || "[]");
  } catch { return []; }
}

export function recordRentalInquiry(property: { id: number; title: string; price: number; city: string }) {
  try {
    const existing = getRentalInquiries();
    const filtered = existing.filter(i => i.propertyId !== property.id);
    filtered.unshift({ propertyId: property.id, title: property.title, price: property.price, city: property.city, contactedAt: new Date().toISOString() });
    localStorage.setItem("rental_inquiries", JSON.stringify(filtered.slice(0, 20)));
  } catch {}
}

/* ── Availability toggle button ─────────────────────────────────────────── */
function AvailToggle({ id, isAvailable, isLoading, onToggle }: { id: number; isAvailable: boolean; isLoading: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      data-testid={`toggle-available-${id}`}
      title={isAvailable ? "Mark as Rented" : "Mark as Available"}
      className={`flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-bold transition-all ${
        isAvailable
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
          : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
      } disabled:opacity-50`}
    >
      {isAvailable ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
      {isAvailable ? "Available" : "Rented"}
    </button>
  );
}

export default function MyProperties() {
  const { data: properties, isLoading } = useGetMyProperties();
  const deleteProperty  = useDeleteProperty();
  const updateProperty  = useUpdateProperty();
  const queryClient     = useQueryClient();
  const { toast }       = useToast();
  const [updatingId,    setUpdatingId]    = useState<number | null>(null);
  const [inquiries,     setInquiries]     = useState<RentalInquiry[]>([]);
  const [inqOpen,       setInqOpen]       = useState(true);

  useEffect(() => {
    setInquiries(getRentalInquiries());
    const onStorage = () => setInquiries(getRentalInquiries());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteProperty.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyPropertiesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
        toast({ title: "Property Deleted", description: `"${title}" has been removed.` });
      },
      onError: () => toast({ title: "Delete Failed", description: "Please try again.", variant: "destructive" }),
    });
  };

  const handleAvailToggle = (id: number, currentVal: boolean) => {
    setUpdatingId(id);
    updateProperty.mutate(
      { id, data: { isAvailable: !currentVal } as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyPropertiesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
          toast({ title: !currentVal ? "Marked as Available" : "Marked as Rented", description: !currentVal ? "Listing is now active." : "Inquiries have been paused." });
        },
        onError: () => toast({ title: "Update failed", description: "Please try again.", variant: "destructive" }),
        onSettled: () => setUpdatingId(null),
      }
    );
  };

  const myRentals = properties?.filter(p => p.category === "rent") ?? [];

  return (
    <div className="min-h-screen bg-[#070e1a] text-foreground">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-[#C9A84C]/3 blur-[100px]" />
      </div>
      <Navbar />
      <div className="relative z-10 pt-14 pb-16 px-4 max-w-5xl mx-auto">

        <Show when="signed-out">
          <div className="mt-20 text-center">
            <div className="h-20 w-20 rounded-3xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-6">
              <Lock className="h-9 w-9 text-[#C9A84C]" />
            </div>
            <h2 className="font-serif text-2xl text-white mb-2">Sign In Required</h2>
            <p className="text-[#4a6080] text-sm mb-6">Sign in to view and manage your property listings.</p>
            <Link href={`${basePath}/sign-in`}>
              <Button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-semibold">Sign In</Button>
            </Link>
          </div>
        </Show>

        <Show when="signed-in">
          <div className="mt-6">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="text-[#C9A84C] text-[10px] font-black tracking-widest uppercase mb-1">My Dashboard</div>
                <h1 className="font-serif text-3xl font-bold text-white">My Portfolio</h1>
                <p className="text-[#4a6080] text-sm mt-1">
                  {properties?.length ?? 0} listing{(properties?.length ?? 0) !== 1 ? "s" : ""}
                  {myRentals.length > 0 && <span className="ml-2 text-violet-400">{myRentals.length} rental{myRentals.length !== 1 ? "s" : ""}</span>}
                </p>
              </div>
              <Link href={`${basePath}/post-property`}>
                <Button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold gap-1.5">
                  <Plus className="h-4 w-4" /> Post Property
                </Button>
              </Link>
            </div>

            {/* ══ My Listings ══ */}
            <div className="mb-2">
              <div className="text-[#4a6080] text-[10px] font-black uppercase tracking-widest mb-3">My Listings</div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/4 animate-pulse" />)}
              </div>
            ) : properties && properties.length > 0 ? (
              <div className="space-y-3">
                {properties.map((p, i) => {
                  const isRental   = p.category === "rent";
                  const isAvail    = (p as any).isAvailable !== false;
                  const isUpdating = updatingId === p.id;

                  return (
                    <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      data-testid={`row-property-${p.id}`}
                      className={`rounded-2xl border p-5 flex items-center gap-4 transition-all ${
                        isRental && !isAvail
                          ? "border-rose-500/15 bg-gradient-to-r from-[#1a0808] to-[#0d0505]"
                          : "border-[#C9A84C]/15 hover:border-[#C9A84C]/30 bg-gradient-to-r from-[#0d1929] to-[#080f1a]"
                      }`}
                    >
                      {/* icon */}
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        isRental ? "bg-violet-500/10 border-violet-500/20" : "bg-[#C9A84C]/10 border-[#C9A84C]/20"
                      }`}>
                        {isRental ? <Home className="h-5 w-5 text-violet-400" /> : <LayoutList className="h-5 w-5 text-[#C9A84C]" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-sm truncate">{p.title}</h3>
                          <span className={`text-[9px] font-black uppercase ${CAT_STYLE[p.category] || "text-[#94a3b8]"}`}>{p.category}</span>
                          {(p as any).isVerified && (
                            <span className="text-[9px] font-black text-[#C9A84C] border border-[#C9A84C]/30 px-1.5 py-0.5 rounded-full">VERIFIED</span>
                          )}
                          {isRental && !isAvail && (
                            <span className="flex items-center gap-1 text-[9px] font-black text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded-full">
                              <BanIcon className="h-2.5 w-2.5" /> RENTED
                            </span>
                          )}
                          {isRental && isAvail && (
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                              <CheckCircle2 className="h-2.5 w-2.5" /> AVAILABLE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[#4a6080] text-xs">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}</span>
                          <span className="capitalize text-[#6a7f99]">{p.type}</span>
                          <span className={`font-semibold ${isRental ? "text-violet-400" : "text-[#C9A84C]"}`}>
                            {formatPrice(Number(p.price), p.category)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        {/* Availability toggle — only for rent listings */}
                        {isRental && (
                          <AvailToggle
                            id={p.id}
                            isAvailable={isAvail}
                            isLoading={isUpdating}
                            onToggle={() => handleAvailToggle(p.id, isAvail)}
                          />
                        )}
                        <Link href={`${basePath}/property/${p.id}`}>
                          <Button variant="ghost" size="sm" className="text-[#4a6080] hover:text-[#C9A84C] text-xs gap-1 h-8" data-testid={`button-view-property-${p.id}`}>
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id, p.title)}
                          disabled={deleteProperty.isPending}
                          className="text-red-400/50 hover:text-red-400 hover:bg-red-400/10 h-8 w-8"
                          data-testid={`button-delete-${p.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-[#C9A84C]/15 rounded-2xl">
                <LayoutList className="h-12 w-12 text-[#C9A84C]/20 mx-auto mb-4" />
                <h3 className="font-serif text-xl text-white mb-2">No listings yet</h3>
                <p className="text-[#4a6080] text-sm mb-6">Start by posting your first property listing.</p>
                <Link href={`${basePath}/post-property`}>
                  <Button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-semibold">Post Your First Property</Button>
                </Link>
              </div>
            )}

            {/* ══ My Rental Inquiries ══ */}
            <div className="mt-10">
              <button
                onClick={() => setInqOpen(v => !v)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-violet-500/15 w-0" />
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-violet-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">My Rental Inquiries</span>
                    {inquiries.length > 0 && (
                      <span className="text-[9px] bg-violet-500/15 border border-violet-500/25 text-violet-300 px-2 py-0.5 rounded-full font-bold">{inquiries.length}</span>
                    )}
                  </div>
                </div>
                {inqOpen ? <ChevronDown className="h-4 w-4 text-violet-400/60" /> : <ChevronRight className="h-4 w-4 text-violet-400/60" />}
              </button>

              <AnimatePresence>
                {inqOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-4">
                      {inquiries.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-violet-500/15 py-12 text-center">
                          <MessageCircle className="h-10 w-10 text-violet-500/20 mx-auto mb-3" />
                          <p className="text-[#3a5070] text-sm">No rental inquiries yet.</p>
                          <p className="text-[#2a3a50] text-xs mt-1">When you contact a landlord via WhatsApp, it will appear here.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {inquiries.map((inq, i) => (
                            <motion.div key={`${inq.propertyId}-${i}`}
                              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                              className="flex items-center gap-3 bg-gradient-to-r from-[#0d1040] to-[#080d20] border border-violet-500/15 hover:border-violet-500/30 rounded-2xl px-4 py-3 transition-all"
                            >
                              <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                                <MessageCircle className="h-4 w-4 text-violet-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-semibold truncate">{inq.title}</p>
                                <div className="flex items-center gap-2 text-[#3a5070] text-[10px] mt-0.5">
                                  <MapPin className="h-2.5 w-2.5" />{inq.city}
                                  <span>·</span>
                                  <span className="text-violet-400">{formatPrice(inq.price, "rent")}</span>
                                  <span>·</span>
                                  <span>{new Date(inq.contactedAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}</span>
                                </div>
                              </div>
                              <Link href={`${basePath}/property/${inq.propertyId}`}>
                                <button className="flex items-center gap-1 text-[10px] text-violet-400/60 hover:text-violet-300 border border-violet-500/15 hover:border-violet-500/30 px-2.5 py-1 rounded-full transition-all">
                                  View <ChevronRight className="h-3 w-3" />
                                </button>
                              </Link>
                            </motion.div>
                          ))}
                          <button
                            onClick={() => { localStorage.removeItem("rental_inquiries"); setInquiries([]); }}
                            className="text-xs text-[#2a3a50] hover:text-red-400/70 transition-colors mt-1"
                          >
                            Clear inquiry history
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </Show>
      </div>
    </div>
  );
}
