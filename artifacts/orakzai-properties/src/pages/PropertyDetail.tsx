import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Home, Phone, MessageCircle, ArrowLeft, Calendar, User,
  ChevronLeft, ChevronRight, ShieldCheck, Tag, Expand, Building2,
  Layers, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useGetProperty, getGetPropertyQueryKey } from "@workspace/api-client-react";
import { formatPrice } from "@/components/PropertyCard";

const categoryStyles: Record<string, string> = {
  buy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  sell: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  rent: "bg-violet-500/15 text-violet-300 border-violet-500/30",
};

const typeIcons: Record<string, typeof Home> = {
  house: Home,
  commercial: Building2,
  plot: Layers,
};

function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const hasImages = images && images.length > 0 && images[0];

  if (!hasImages) {
    return (
      <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0f2040] to-[#162a4a] border border-[#C9A84C]/15 flex items-center justify-center">
        <div className="text-center">
          <Home className="h-20 w-20 text-[#C9A84C]/10 mx-auto mb-3" />
          <p className="text-[#2a3a50] text-sm">No images available</p>
        </div>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden border border-[#C9A84C]/20 group">
        <div className="relative h-64 md:h-[420px] bg-[#080f1a]">
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={images[current]}
              alt={`${title} - Image ${current + 1}`}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-[#080f1a]/60 via-transparent to-transparent" />

          {/* Expand button */}
          <button
            onClick={() => setLightbox(true)}
            className="absolute top-3 right-3 h-8 w-8 rounded-xl bg-[#080f1a]/70 border border-white/15 flex items-center justify-center text-[#94a3b8] hover:text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
          >
            <Expand className="h-3.5 w-3.5" />
          </button>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-[#080f1a]/70 border border-white/10 rounded-full px-2.5 py-1 text-[#94a3b8] text-xs backdrop-blur-sm">
              {current + 1} / {images.length}
            </div>
          )}

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#080f1a]/70 border border-white/15 flex items-center justify-center text-white hover:border-[#C9A84C]/50 transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#080f1a]/70 border border-white/15 flex items-center justify-center text-white hover:border-[#C9A84C]/50 transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100">
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 p-3 bg-[#080f1a] overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`flex-shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all ${i === current ? "border-[#C9A84C]" : "border-white/10 hover:border-[#C9A84C]/40"}`}
              >
                <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightbox(false)}
          >
            <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <X className="h-5 w-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <img src={images[current]} alt={title} className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MapPlaceholder({ city, area }: { city: string; area?: string | null }) {
  const location = area ? `${area}, ${city}` : city;
  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#C9A84C]/15 bg-gradient-to-br from-[#0d1e30] to-[#080f1a] h-52">
      {/* Simulated map grid */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(rgba(201,168,76,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Road lines */}
      <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 400 208">
        <line x1="0" y1="104" x2="400" y2="104" stroke="#C9A84C" strokeWidth="3" />
        <line x1="200" y1="0" x2="200" y2="208" stroke="#C9A84C" strokeWidth="2" />
        <line x1="0" y1="60" x2="400" y2="60" stroke="#C9A84C" strokeWidth="1" strokeDasharray="8 8" />
        <line x1="0" y1="148" x2="400" y2="148" stroke="#C9A84C" strokeWidth="1" strokeDasharray="8 8" />
        <line x1="100" y1="0" x2="100" y2="208" stroke="#C9A84C" strokeWidth="1" strokeDasharray="8 8" />
        <line x1="300" y1="0" x2="300" y2="208" stroke="#C9A84C" strokeWidth="1" strokeDasharray="8 8" />
      </svg>
      {/* Pin */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          <div className="h-10 w-10 rounded-full bg-[#C9A84C] shadow-xl shadow-[#C9A84C]/40 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-[#080f1a]" />
          </div>
          <div className="mt-2 bg-[#080f1a]/90 border border-[#C9A84C]/40 rounded-lg px-3 py-1.5 backdrop-blur-sm">
            <p className="text-[#C9A84C] text-xs font-semibold text-center">{location}</p>
          </div>
          {/* Pulse rings */}
          <div className="absolute top-0 left-0 h-10 w-10 rounded-full border-2 border-[#C9A84C]/40 animate-ping" style={{ animationDuration: "2s" }} />
        </div>
      </div>
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 bg-gradient-to-t from-[#080f1a] to-transparent flex items-center justify-between">
        <span className="text-[#4a6080] text-xs flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-[#C9A84C]" /> {location}
        </span>
        <span className="text-[10px] text-[#2a3a50] border border-white/8 px-2 py-0.5 rounded-full">Map View</span>
      </div>
    </div>
  );
}

export default function PropertyDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: property, isLoading } = useGetProperty(id, {
    query: { enabled: !!id, queryKey: getGetPropertyQueryKey(id) },
  });

  const whatsappNumber = property?.whatsappNumber || property?.ownerPhone;
  const whatsappMsg = property?.title ? `I am interested in ${property.title}` : "I am interested in this property";
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappMsg)}`
    : null;

  const TypeIcon = typeIcons[property?.type ?? ""] ?? Home;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070e1a]">
        <Navbar />
        <div className="pt-20 px-4 max-w-5xl mx-auto">
          <div className="h-[420px] rounded-2xl bg-white/4 animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-white/4 rounded-xl animate-pulse w-3/4" />
              <div className="h-4 bg-white/4 rounded animate-pulse w-1/2" />
              <div className="h-32 bg-white/4 rounded-2xl animate-pulse" />
            </div>
            <div className="h-64 bg-white/4 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#070e1a] flex items-center justify-center">
        <Navbar />
        <div className="text-center mt-20">
          <h2 className="font-serif text-2xl text-white mb-4">Property Not Found</h2>
          <Link href="/browse">
            <Button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#080f1a] font-bold">Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070e1a] text-foreground pb-28">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-80 h-80 rounded-full bg-[#C9A84C]/3 blur-[120px]" />
      </div>

      <Navbar />

      <div className="relative z-10 pt-14 max-w-5xl mx-auto px-4">
        {/* Back button */}
        <Link href="/browse">
          <button className="flex items-center gap-1.5 text-[#4a6080] hover:text-[#C9A84C] text-sm mt-5 mb-5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </button>
        </Link>

        {/* Image Carousel */}
        <ImageCarousel images={property.images ?? []} title={property.title} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title block */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${categoryStyles[property.category] ?? ""}`}>
                  {property.category}
                </span>
                <span className="text-[11px] bg-white/5 border border-white/10 text-[#6a7f99] px-2.5 py-1 rounded-full flex items-center gap-1.5 capitalize">
                  <TypeIcon className="h-3 w-3" /> {property.type}
                </span>
                {property.isVerified && (
                  <span className="flex items-center gap-1.5 text-[11px] bg-[#C9A84C]/10 border border-[#C9A84C]/35 text-[#C9A84C] px-2.5 py-1 rounded-full font-bold">
                    <ShieldCheck className="h-3.5 w-3.5" /> Orakzai Verified
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-white leading-tight mb-2">{property.title}</h1>
              <div className="flex items-center gap-1.5 text-[#4a6080] text-sm">
                <MapPin className="h-4 w-4 text-[#C9A84C]/60" />
                {property.area ? `${property.area}, ` : ""}{property.city}
              </div>
            </motion.div>

            {/* Price */}
            <div className="bg-gradient-to-r from-[#C9A84C]/8 to-transparent border border-[#C9A84C]/20 rounded-2xl px-5 py-4">
              <div className="text-[#4a6080] text-xs uppercase tracking-wider mb-1">Listed Price</div>
              <div className="font-serif text-3xl font-bold text-[#C9A84C]">{formatPrice(Number(property.price))}</div>
            </div>

            {/* Description */}
            <div className="bg-gradient-to-b from-[#0d1e30] to-[#080f1a] border border-white/6 rounded-2xl p-5">
              <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#C9A84C]" /> About This Property
              </h3>
              <p className="text-[#6a7f99] text-sm leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            {/* Specs Grid */}
            <div className="bg-gradient-to-b from-[#0d1e30] to-[#080f1a] border border-white/6 rounded-2xl p-5">
              <h3 className="font-semibold text-white text-sm mb-4">Property Specifications</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Category", value: property.category, icon: Tag },
                  { label: "Type", value: property.type, icon: TypeIcon },
                  { label: "City", value: property.city, icon: MapPin },
                  { label: "Area / Sector", value: property.area || "N/A", icon: MapPin },
                  {
                    label: "Listed On",
                    value: new Date(property.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" }),
                    icon: Calendar,
                  },
                  { label: "Verified", value: property.isVerified ? "Yes" : "No", icon: ShieldCheck },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/15 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-3.5 w-3.5 text-[#C9A84C]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[#2a3a50] text-[10px] uppercase tracking-wider">{item.label}</div>
                      <div className="text-[#e8edf5] text-xs font-medium capitalize truncate">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Placeholder */}
            <div>
              <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#C9A84C]" /> Location Area
              </h3>
              <MapPlaceholder city={property.city} area={property.area} />
            </div>
          </div>

          {/* Right: Contact panel */}
          <div>
            <div className="sticky top-20 space-y-4">
              {/* Owner Contact Card */}
              <div className="bg-gradient-to-b from-[#0d1e30] to-[#080f1a] border border-[#C9A84C]/25 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h3 className="font-semibold text-white text-sm">Contact Agent</h3>
                </div>
                <div className="p-5 space-y-4">
                  {/* Agent info */}
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-[#C9A84C]" />
                    </div>
                    <div>
                      <div className="text-[#e8edf5] font-semibold text-sm">{property.ownerName ?? "Orakzai Agent"}</div>
                      <div className="text-[#4a6080] text-xs">Property Consultant</div>
                    </div>
                  </div>

                  {property.ownerPhone && (
                    <a href={`tel:${property.ownerPhone}`} data-testid="link-call-agent">
                      <Button variant="outline" className="w-full border-white/10 text-[#e8edf5] hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/5 gap-2 h-10 text-sm transition-all">
                        <Phone className="h-4 w-4 text-[#C9A84C]" /> {property.ownerPhone}
                      </Button>
                    </a>
                  )}

                  {whatsappLink && (
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" data-testid="link-whatsapp">
                      <Button className="w-full bg-[#25D366] hover:bg-[#20c55a] text-white font-bold gap-2 h-11 text-sm shadow-lg shadow-[#25D366]/15">
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp for Inquiry
                      </Button>
                    </a>
                  )}

                  <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/15 rounded-xl p-3">
                    <p className="text-[#4a6080] text-[11px] leading-relaxed">
                      Message will be pre-filled:<br />
                      <span className="text-[#C9A84C] italic">"{whatsappMsg}"</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="bg-gradient-to-b from-[#0d1e30] to-[#080f1a] border border-white/6 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#4a6080] text-xs">Property ID</span>
                  <span className="text-[#e8edf5] text-xs font-mono">#{property.id.toString().padStart(5, "0")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#4a6080] text-xs">Listed</span>
                  <span className="text-[#e8edf5] text-xs">{new Date(property.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#4a6080] text-xs">Status</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${categoryStyles[property.category] ?? ""} capitalize`}>
                    {property.category}
                  </span>
                </div>
                {property.isVerified && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#4a6080] text-xs">Verification</span>
                    <span className="text-[#C9A84C] text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp */}
      {whatsappLink && (
        <motion.a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          data-testid="button-whatsapp-float"
          className="fixed bottom-6 right-5 z-50 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20c55a] text-white font-bold rounded-2xl px-5 py-3 shadow-2xl shadow-[#25D366]/30 transition-all hover:scale-105 active:scale-95"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">WhatsApp for Inquiry</span>
        </motion.a>
      )}
    </div>
  );
}
