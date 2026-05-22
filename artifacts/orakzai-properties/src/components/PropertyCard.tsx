import { Link } from "wouter";
import { MapPin, Home, ArrowRight, ShieldCheck, MessageCircle, BanIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyCardProps {
  id: number;
  title: string;
  price: number;
  city: string;
  area?: string | null;
  category: string;
  type: string;
  images: string[];
  isVerified?: boolean;
  isAvailable?: boolean;
  ownerName?: string | null;
  whatsappNumber?: string | null;
  ownerPhone?: string | null;
}

export function formatPrice(price: number | undefined | null, category?: string): string {
  if (price === undefined || price === null || isNaN(price)) return "PKR 0";
  const base =
    price >= 10000000 ? `PKR ${(price / 10000000).toFixed(2)} Crore` :
    price >= 100000   ? `PKR ${(price / 100000).toFixed(0)} Lakh` :
                        `PKR ${price.toLocaleString()}`;
  return category === "rent" ? `${base} / mo` : base;
}

const categoryStyles: Record<string, { pill: string; glow: string }> = {
  buy:  { pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", glow: "hover:shadow-emerald-900/20" },
  sell: { pill: "bg-blue-500/15 text-blue-300 border-blue-500/30",         glow: "hover:shadow-blue-900/20"   },
  rent: { pill: "bg-violet-500/15 text-violet-300 border-violet-500/30",   glow: "hover:shadow-violet-900/20" },
};

const typeLabel: Record<string, string> = {
  plot: "Plot", house: "House", commercial: "Commercial",
};

export default function PropertyCard({ id, title, price, city, area, category, type, images, isVerified, isAvailable = true, ownerName, whatsappNumber, ownerPhone }: PropertyCardProps) {
  const hasImage = images && images.length > 0 && images[0];
  const styles = categoryStyles[category] ?? { pill: "bg-gray-500/15 text-gray-300 border-gray-500/30", glow: "" };
  const isRental = category === "rent";
  const waNum = whatsappNumber || ownerPhone;
  const waMsg = `Hello, I am interested in renting your property ${title} listed for ${formatPrice(price, "rent")}. Is it still available?`;
  const waLink = waNum ? `https://wa.me/${waNum.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waMsg)}` : null;
  const rented = isRental && !isAvailable;

  return (
    <div
      data-testid={`card-property-${id}`}
      className={`group relative rounded-2xl overflow-hidden border border-[#C9A84C]/20 bg-gradient-to-b from-[#0d1e30] to-[#080f1a] transition-all duration-300 ${rented ? "opacity-70" : `hover:border-[#C9A84C]/60 hover:shadow-xl hover:shadow-[#C9A84C]/8 ${styles.glow}`}`}
    >
      {/* Gold inner shimmer */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />

      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#0f2040] to-[#162a4a]">
        {hasImage ? (
          <img src={images[0]} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Home className="h-14 w-14 text-[#C9A84C]/15" />
            <span className="text-[#2a3a50] text-xs">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080f1a]/80 via-transparent to-transparent" />

        {/* RENTED banner */}
        {rented && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#080f1a]/60 backdrop-blur-[2px]">
            <div className="flex items-center gap-1.5 bg-rose-900/80 border border-rose-500/50 rounded-full px-4 py-1.5 shadow-lg">
              <BanIcon className="h-3.5 w-3.5 text-rose-300" />
              <span className="text-rose-300 text-xs font-black tracking-widest uppercase">Rented</span>
            </div>
          </div>
        )}

        {/* Verified seal */}
        {isVerified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#080f1a]/85 border border-[#C9A84C]/50 rounded-full px-2 py-1 backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3 text-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[9px] font-black tracking-widest uppercase">Orakzai Verified</span>
          </div>
        )}

        {/* Category pill */}
        <div className="absolute top-3 right-3">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-sm ${styles.pill}`}>
            {isRental ? "Rent" : category}
          </span>
        </div>

        {/* Type tag */}
        <div className="absolute bottom-3 right-3">
          <span className="text-[10px] font-medium bg-[#080f1a]/70 text-[#6a7f99] border border-white/10 px-2 py-0.5 rounded-full">
            {typeLabel[type] ?? type}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-[#e8edf5] text-sm leading-snug line-clamp-2 mb-2 group-hover:text-[#C9A84C] transition-colors duration-200">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 text-[#4a6080] text-xs mb-1">
          <MapPin className="h-3 w-3 text-[#C9A84C]/60 flex-shrink-0" />
          <span className="truncate">{area ? `${area}, ` : ""}{city}</span>
        </div>
        {ownerName ? (
          <div className="text-[#3a5070] text-[11px] mb-3 truncate">{ownerName}</div>
        ) : (
          <div className="mb-3" />
        )}

        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            <div className="text-[#C9A84C] font-bold text-base leading-none">{formatPrice(price, category)}</div>
            <div className="text-[#2a3a50] text-[10px] mt-0.5">{isRental ? "per month" : "Price"}</div>
          </div>

          {isRental && !rented && waLink ? (
            <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              data-testid={`button-rent-${id}`}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366] border border-[#25D366]/30 hover:border-[#25D366] text-[#25D366] hover:text-white transition-all text-xs font-bold">
              <MessageCircle className="h-3.5 w-3.5" /> Request
            </a>
          ) : isRental && rented ? (
            <span className="text-xs text-rose-400/70 font-semibold border border-rose-500/20 px-2.5 py-1 rounded-full">Unavailable</span>
          ) : (
            <Link href={`/property/${id}`}>
              <Button
                size="sm"
                data-testid={`button-view-${id}`}
                className="bg-[#C9A84C]/10 hover:bg-[#C9A84C] text-[#C9A84C] hover:text-[#080f1a] border border-[#C9A84C]/30 hover:border-[#C9A84C] transition-all duration-200 text-xs font-bold gap-1 h-8 px-3"
              >
                Details <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
