import { useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { MapPin, ShieldCheck, ChevronLeft, ChevronRight, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListProperties } from "@workspace/api-client-react";

function formatPrice(price: number): string {
  if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(1)} Crore`;
  if (price >= 100000) return `PKR ${(price / 100000).toFixed(0)} Lakh`;
  return `PKR ${price.toLocaleString()}`;
}

const categoryGradients: Record<string, string> = {
  buy: "from-[#0f2a1a] to-[#0a1220]",
  sell: "from-[#0f1f2a] to-[#0a1220]",
  rent: "from-[#1a0f2a] to-[#0a1220]",
};

const categoryAccents: Record<string, string> = {
  buy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  sell: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  rent: "text-violet-400 bg-violet-500/10 border-violet-500/20",
};

export default function FeaturedSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: properties, isLoading } = useListProperties({});

  const featured = properties?.slice(0, 8) ?? [];

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-64 h-72 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative group">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {featured.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="flex-shrink-0 w-64 md:w-72"
          >
            <Link href={`/property/${p.id}`}>
              <div
                data-testid={`slider-card-${p.id}`}
                className={`group/card relative rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-br ${categoryGradients[p.category] || "from-[#0f1929] to-[#0a1220]"} overflow-hidden hover:border-[#C9A84C]/50 hover:shadow-lg hover:shadow-[#C9A84C]/8 transition-all duration-300 cursor-pointer`}
              >
                {/* Image area */}
                <div className="relative h-40 bg-gradient-to-br from-[#0f2040] to-[#1a3060]">
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-12 w-12 text-[#C9A84C]/15" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220]/80 to-transparent" />

                  {/* Verified badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-[#0a1220]/80 border border-[#C9A84C]/40 rounded-full px-2 py-0.5">
                    <ShieldCheck className="h-3 w-3 text-[#C9A84C]" />
                    <span className="text-[#C9A84C] text-[9px] font-bold tracking-wider">ORAKZAI VERIFIED</span>
                  </div>

                  {/* Category */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryAccents[p.category] || ""}`}>
                      {p.category}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="font-semibold text-[#f1f5f9] text-sm leading-tight line-clamp-1 mb-1.5 group-hover/card:text-[#C9A84C] transition-colors">
                    {p.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[#6a7f99] text-[11px] mb-3">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{p.area ? `${p.area}, ` : ""}{p.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[#C9A84C] font-bold text-sm">{formatPrice(Number(p.price))}</div>
                    <div className="h-6 w-6 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center group-hover/card:bg-[#C9A84C]/30 transition-colors">
                      <ArrowRight className="h-3 w-3 text-[#C9A84C]" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Nav arrows */}
      <button
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-[#0f1929] border border-[#C9A84C]/30 hover:border-[#C9A84C] text-[#C9A84C] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-[#0f1929] border border-[#C9A84C]/30 hover:border-[#C9A84C] text-[#C9A84C] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
