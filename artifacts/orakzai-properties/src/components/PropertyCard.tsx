import { Link } from "wouter";
import { MapPin, Tag, Home, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
}

function formatPrice(price: number): string {
  if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(1)} Crore`;
  if (price >= 100000) return `PKR ${(price / 100000).toFixed(0)} Lakh`;
  return `PKR ${price.toLocaleString()}`;
}

const categoryColors: Record<string, string> = {
  buy: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  sell: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  rent: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

const typeIcons: Record<string, string> = {
  plot: "Plot",
  house: "House",
  commercial: "Commercial",
};

export default function PropertyCard({ id, title, price, city, area, category, type, images }: PropertyCardProps) {
  const hasImage = images && images.length > 0 && images[0];

  return (
    <div
      data-testid={`card-property-${id}`}
      className="group relative rounded-2xl overflow-hidden border border-[#C9A84C]/30 bg-white/5 backdrop-blur-sm hover:border-[#C9A84C]/70 hover:shadow-lg hover:shadow-[#C9A84C]/10 transition-all duration-300"
    >
      <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ boxShadow: "inset 0 0 30px rgba(201,168,76,0.05)" }} />

      <div className="relative h-48 bg-gradient-to-br from-[#0f2040] to-[#1a3060] overflow-hidden">
        {hasImage ? (
          <img src={images[0]} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="h-16 w-16 text-[#C9A84C]/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220]/60 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${categoryColors[category] || "bg-gray-500/20 text-gray-300 border-gray-500/30"}`}>
            {category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-medium bg-[#0a1220]/70 text-[#94a3b8] px-2 py-1 rounded-full border border-white/10">
            {typeIcons[type] || type}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[#f1f5f9] text-sm line-clamp-2 mb-1 group-hover:text-[#C9A84C] transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-1 text-[#94a3b8] text-xs mb-3">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span>{area ? `${area}, ` : ""}{city}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[#C9A84C] font-bold text-base">{formatPrice(price)}</div>
          </div>
          <Link href={`/property/${id}`}>
            <Button
              size="sm"
              data-testid={`button-view-${id}`}
              className="bg-[#C9A84C]/10 hover:bg-[#C9A84C] text-[#C9A84C] hover:text-[#0a1220] border border-[#C9A84C]/40 hover:border-[#C9A84C] transition-all duration-200 text-xs font-semibold gap-1"
            >
              View Details <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
