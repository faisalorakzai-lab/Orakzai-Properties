import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { MapPin, TrendingUp, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListProjects } from "@workspace/api-client-react";

const slides = [
  {
    id: "azan-1",
    tag: "Phase 1 — Active",
    headline: "Azan Smart City",
    sub: "Pakistan's most visionary mega-project",
    location: "Lahore & Islamabad",
    stat1Label: "Starting Per Marla",
    stat1Value: "PKR 8.5L",
    stat2Label: "Total Plots",
    stat2Value: "5,000+",
    progress: 35,
    href: "/project/azan-smart-city",
    cta: "Explore & Book",
  },
  {
    id: "azan-2",
    tag: "Limited Slots",
    headline: "Installment Plans",
    sub: "Own a plot with just 25% down payment",
    location: "Flexible 4-Year Plan",
    stat1Label: "Min. Down Payment",
    stat1Value: "25%",
    stat2Label: "Monthly From",
    stat2Value: "PKR 44K",
    progress: 35,
    href: "/project/azan-smart-city",
    cta: "Calculate Now",
  },
  {
    id: "azan-3",
    tag: "High ROI",
    headline: "Investment Grade",
    sub: "Real estate that appreciates — guaranteed",
    location: "Prime Location",
    stat1Label: "Projected Growth",
    stat1Value: "3x",
    stat2Label: "Over",
    stat2Value: "5 Years",
    progress: 35,
    href: "/project/azan-smart-city",
    cta: "Invest Now",
  },
];

export default function ProjectBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [paused]);

  const prev = () => { setPaused(true); setCurrent((c) => (c - 1 + slides.length) % slides.length); };
  const next = () => { setPaused(true); setCurrent((c) => (c + 1) % slides.length); };

  const slide = slides[current];

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-[#C9A84C]/40 shadow-xl shadow-[#C9A84C]/10 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      data-testid="project-banner"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a2e10] via-[#0f1929] to-[#0a1220]" />
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(201,168,76,0.18) 0%, transparent 65%)" }} />
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M0 0h1v60H0zM30 0h1v60H30zM60 0h1v60H60zM0 0v1h60V0zM0 30v1h60V30z' fill='%23C9A84C' fill-opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 px-5 py-5 md:px-7 md:py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 bg-[#C9A84C]/20 border border-[#C9A84C]/40 rounded-full px-3 py-1 mb-3">
                  <TrendingUp className="h-3 w-3 text-[#C9A84C]" />
                  <span className="text-[#C9A84C] text-[10px] font-bold tracking-widest uppercase">{slide.tag}</span>
                </div>
                <h3 className="font-serif text-xl md:text-2xl font-bold text-white leading-tight mb-1">
                  {slide.headline}
                </h3>
                <p className="text-[#94a3b8] text-xs md:text-sm mb-2">{slide.sub}</p>
                <div className="flex items-center gap-1 text-[#6a7f99] text-xs">
                  <MapPin className="h-3 w-3 text-[#C9A84C]" />
                  {slide.location}
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                <div className="bg-white/5 border border-[#C9A84C]/20 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
                  <div className="text-[#C9A84C] font-bold text-base font-serif">{slide.stat1Value}</div>
                  <div className="text-[#6a7f99] text-[10px] mt-0.5 leading-tight">{slide.stat1Label}</div>
                </div>
                <div className="bg-white/5 border border-[#C9A84C]/20 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
                  <div className="text-white font-bold text-base font-serif">{slide.stat2Value}</div>
                  <div className="text-[#6a7f99] text-[10px] mt-0.5 leading-tight">{slide.stat2Label}</div>
                </div>
                <Link href={slide.href}>
                  <Button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold gap-1.5 text-xs px-4 h-9" data-testid="banner-cta">
                    {slide.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              key={current}
              className="h-full bg-gradient-to-r from-[#C9A84C] to-[#e8c060] rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: paused ? undefined : "100%" }}
              transition={{ duration: 4, ease: "linear" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prev} className="h-6 w-6 rounded-full border border-[#C9A84C]/30 hover:border-[#C9A84C] flex items-center justify-center text-[#C9A84C] transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setPaused(true); setCurrent(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-4 bg-[#C9A84C]" : "w-1.5 bg-white/20"}`}
                />
              ))}
            </div>
            <button onClick={next} className="h-6 w-6 rounded-full border border-[#C9A84C]/30 hover:border-[#C9A84C] flex items-center justify-center text-[#C9A84C] transition-colors">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
