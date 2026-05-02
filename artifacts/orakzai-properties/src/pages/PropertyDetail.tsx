import { useParams } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Tag, Home, Phone, MessageCircle, ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { useGetProperty } from "@workspace/api-client-react";
import { getGetPropertyQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";

function formatPrice(price: number): string {
  if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(2)} Crore`;
  if (price >= 100000) return `PKR ${(price / 100000).toFixed(0)} Lakh`;
  return `PKR ${price.toLocaleString()}`;
}

const categoryColors: Record<string, string> = {
  buy: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  sell: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  rent: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export default function PropertyDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: property, isLoading } = useGetProperty(id, {
    query: { enabled: !!id, queryKey: getGetPropertyQueryKey(id) },
  });

  const whatsappNumber = property?.whatsappNumber || property?.ownerPhone;
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=Hi%2C%20I%20am%20interested%20in%20your%20property%3A%20${encodeURIComponent(property?.title || "")}`
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 px-4 max-w-5xl mx-auto">
          <div className="h-64 rounded-2xl bg-white/5 animate-pulse mb-6" />
          <div className="h-8 bg-white/5 animate-pulse rounded mb-4 w-3/4" />
          <div className="h-4 bg-white/5 animate-pulse rounded mb-2 w-1/2" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <div className="text-center mt-20">
          <h2 className="font-serif text-2xl text-white mb-4">Property Not Found</h2>
          <Link href="/browse">
            <Button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220]">Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <Navbar />
      <div className="pt-20 px-4 max-w-5xl mx-auto">
        <Link href="/browse">
          <Button variant="ghost" size="sm" className="text-[#94a3b8] hover:text-white gap-1.5 mt-4 mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Browse
          </Button>
        </Link>

        {/* Image Gallery */}
        <div className="rounded-2xl overflow-hidden border border-[#C9A84C]/20 mb-6 bg-gradient-to-br from-[#0f2040] to-[#1a3060]">
          {property.images && property.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-1 h-72 md:h-96">
              <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover col-span-2" />
            </div>
          ) : (
            <div className="h-64 md:h-80 flex items-center justify-center">
              <div className="text-center">
                <Home className="h-20 w-20 text-[#C9A84C]/20 mx-auto mb-3" />
                <p className="text-[#4a6080] text-sm">No images available</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Title & badges */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${categoryColors[property.category] || ""}`}>
                  {property.category}
                </span>
                <span className="text-xs bg-[#1e3a5f] text-[#94a3b8] px-3 py-1 rounded-full border border-[#1e3a5f] capitalize">
                  {property.type}
                </span>
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2">{property.title}</h1>
              <div className="flex items-center gap-1.5 text-[#94a3b8] text-sm mb-4">
                <MapPin className="h-4 w-4 text-[#C9A84C]" />
                {property.area ? `${property.area}, ` : ""}{property.city}
              </div>
              <div className="text-3xl font-bold text-[#C9A84C] font-serif">{formatPrice(Number(property.price))}</div>
            </motion.div>

            {/* Description */}
            <div className="bg-white/5 border border-[#C9A84C]/15 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-3">About This Property</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            {/* Details Grid */}
            <div className="bg-white/5 border border-[#C9A84C]/15 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Property Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Category", value: property.category, icon: Tag },
                  { label: "Type", value: property.type, icon: Home },
                  { label: "City", value: property.city, icon: MapPin },
                  { label: "Area", value: property.area || "N/A", icon: MapPin },
                  { label: "Listed", value: new Date(property.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" }), icon: Calendar },
                  { label: "Owner", value: property.ownerName || "Agent", icon: User },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4 text-[#C9A84C]" />
                    </div>
                    <div>
                      <div className="text-[#4a6080] text-xs">{item.label}</div>
                      <div className="text-[#f1f5f9] text-sm font-medium capitalize">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Panel */}
          <div className="space-y-4">
            <div className="bg-white/5 border border-[#C9A84C]/30 rounded-2xl p-6 sticky top-24">
              <h3 className="font-semibold text-white mb-4">Contact Agent</h3>
              {property.ownerName && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#1e3a5f]">
                  <div className="h-10 w-10 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
                    <User className="h-5 w-5 text-[#C9A84C]" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{property.ownerName}</div>
                    <div className="text-[#94a3b8] text-xs">Property Agent</div>
                  </div>
                </div>
              )}
              {property.ownerPhone && (
                <a href={`tel:${property.ownerPhone}`} data-testid="link-call-agent">
                  <Button variant="outline" className="w-full border-[#1e3a5f] text-[#f1f5f9] hover:border-[#C9A84C]/40 gap-2 mb-3">
                    <Phone className="h-4 w-4 text-[#C9A84C]" /> Call Agent
                  </Button>
                </a>
              )}
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" data-testid="link-whatsapp-inquiry">
                  <Button className="w-full bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold gap-2">
                    <MessageCircle className="h-4 w-4" /> WhatsApp Inquiry
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      {whatsappLink && (
        <motion.a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#1fb855] text-white rounded-full px-5 py-3 shadow-xl shadow-[#25D366]/30 flex items-center gap-2 font-semibold transition-all"
          data-testid="button-whatsapp-float"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp for Inquiry
        </motion.a>
      )}
    </div>
  );
}
