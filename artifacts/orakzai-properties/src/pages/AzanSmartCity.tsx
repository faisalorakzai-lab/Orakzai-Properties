import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, TrendingUp, Calculator, BookOpen, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import {
  useListProjects,
  useListProjectUpdates,
  useCreateBooking,
  getListMyBookingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListProjectUpdatesQueryKey } from "@workspace/api-client-react";

const PLOT_PRICES: Record<string, number> = {
  "3 Marla": 3 * 850000,
  "5 Marla": 5 * 850000,
  "7 Marla": 7 * 850000,
  "10 Marla": 10 * 850000,
  "1 Kanal": 20 * 850000,
};

const bookingSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  plotSize: z.string().min(1, "Select a plot size"),
  message: z.string().optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

function formatPrice(price: number): string {
  if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(1)} Crore`;
  if (price >= 100000) return `PKR ${(price / 100000).toFixed(0)} Lakh`;
  return `PKR ${price.toLocaleString()}`;
}

export default function AzanSmartCity() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bookingOpen, setBookingOpen] = useState(false);

  // Calculator state
  const [calcPlotSize, setCalcPlotSize] = useState("5 Marla");
  const [downPaymentPct, setDownPaymentPct] = useState("25");

  const { data: projects } = useListProjects();
  const project = projects?.[0];

  const { data: updates } = useListProjectUpdates(project?.id ?? 0, {
    query: { enabled: !!project?.id, queryKey: getListProjectUpdatesQueryKey(project?.id ?? 0) },
  });

  const createBooking = useCreateBooking();

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { name: "", phone: "", email: "", plotSize: "", message: "" },
  });

  // Installment Calculator
  const totalPlotPrice = PLOT_PRICES[calcPlotSize] ?? 0;
  const downPaymentPctNum = Math.min(100, Math.max(0, Number(downPaymentPct) || 0));
  const downPayment = (totalPlotPrice * downPaymentPctNum) / 100;
  const remaining = totalPlotPrice - downPayment;
  const monthlyInstallment = remaining / 48; // 4 years

  const onSubmitBooking = (values: BookingForm) => {
    if (!project) return;
    createBooking.mutate(
      {
        data: {
          projectId: project.id,
          name: values.name,
          phone: values.phone,
          email: values.email || null,
          plotSize: values.plotSize,
          message: values.message || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyBookingsQueryKey() });
          toast({ title: "Booking Submitted!", description: "Our team will contact you within 24 hours." });
          setBookingOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: "Submission Failed", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-16">
        {/* Mega Project Banner */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#050d1a] via-[#0a1929] to-[#0f2040]" />
          <div className="absolute inset-0"
            style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(201,168,76,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(30,58,95,0.3) 0%, transparent 50%)" }} />
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='80' height='80' fill='none'/%3E%3Cpath d='M0 40h80M40 0v80' stroke='%23C9A84C' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 bg-[#C9A84C]/15 border border-[#C9A84C]/40 rounded-full px-4 py-2 mb-6">
                <TrendingUp className="h-4 w-4 text-[#C9A84C]" />
                <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">Flagship Mega Project</span>
              </div>
              <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
                Azan<br /><span className="text-[#C9A84C]">Smart City</span>
              </h1>
              {project && (
                <p className="text-[#94a3b8] flex items-center justify-center gap-2 mb-4 text-sm">
                  <MapPin className="h-4 w-4 text-[#C9A84C]" /> {project.location}
                </p>
              )}
              <p className="text-[#b0c0d0] max-w-2xl mx-auto mb-8 text-base leading-relaxed">
                {project?.description ?? "Pakistan's most visionary smart city project spanning Lahore and Islamabad. Invest in the future."}
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {(project?.plotSizes ?? ["3 Marla", "5 Marla", "7 Marla", "10 Marla", "1 Kanal"]).map((s) => (
                  <span key={s} className="text-xs bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] px-3 py-1.5 rounded-full font-medium">{s}</span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold px-8 gap-2" data-testid="button-book-now">
                      Book Now <ArrowRight className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0f1929] border-[#C9A84C]/30 text-[#f1f5f9] max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-xl text-white">Down-Payment Inquiry</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitBooking)} className="space-y-4 mt-2">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#94a3b8] text-xs">Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your name" className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" data-testid="input-booking-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#94a3b8] text-xs">Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+923001234567" className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" data-testid="input-booking-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#94a3b8] text-xs">Email (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="your@email.com" className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="plotSize" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#94a3b8] text-xs">Plot Size</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" data-testid="select-booking-plot">
                                  <SelectValue placeholder="Select plot size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-[#0f1929] border-[#1e3a5f] text-[#f1f5f9]">
                                {(project?.plotSizes ?? ["3 Marla", "5 Marla", "7 Marla", "10 Marla", "1 Kanal"]).map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="message" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#94a3b8] text-xs">Message (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Any specific questions..." className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" />
                            </FormControl>
                          </FormItem>
                        )} />
                        <Button type="submit" disabled={createBooking.isPending} className="w-full bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold" data-testid="button-submit-booking">
                          {createBooking.isPending ? "Submitting..." : "Submit Inquiry"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <a href="#calculator">
                  <Button size="lg" variant="outline" className="border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 px-8 gap-2">
                    <Calculator className="h-4 w-4" /> Calculate Installments
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Progress Bar */}
        {project && (
          <section className="border-y border-[#C9A84C]/20 bg-[#0a1220]/80">
            <div className="max-w-4xl mx-auto px-4 py-8">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[#C9A84C] text-xs font-semibold uppercase tracking-wider">Development Progress</div>
                  <div className="text-white font-semibold mt-0.5">Phase 1 – Foundation & Infrastructure</div>
                </div>
                <div className="text-3xl font-bold text-[#C9A84C] font-serif">{project.progressPercent}%</div>
              </div>
              <div className="h-3 bg-[#0a1220] rounded-full overflow-hidden border border-[#1e3a5f]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#e8c060]"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${project.progressPercent}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                {[
                  { label: "Starting Price/Marla", value: `PKR ${(Number(project.pricePerMarla) / 100000).toFixed(0)}L` },
                  { label: "Total Plots", value: (project.totalPlots ?? 0).toLocaleString() },
                  { label: "Project Status", value: project.status.charAt(0).toUpperCase() + project.status.slice(1) },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-xl font-bold text-[#C9A84C] font-serif">{stat.value}</div>
                    <div className="text-[#94a3b8] text-xs mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Installment Calculator */}
        <section id="calculator" className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-2">Financial Planning</div>
              <h2 className="font-serif text-3xl font-bold text-white">Installment Calculator</h2>
              <p className="text-[#94a3b8] text-sm mt-2">Calculate your monthly payments over a 4-year installment plan</p>
            </div>

            <div className="bg-gradient-to-br from-[#0f2040] to-[#0a1220] border border-[#C9A84C]/30 rounded-3xl overflow-hidden shadow-2xl shadow-[#C9A84C]/10">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-8 space-y-6">
                  <div>
                    <Label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-3 block">Select Plot Size</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(PLOT_PRICES).map((size) => (
                        <button
                          key={size}
                          onClick={() => setCalcPlotSize(size)}
                          data-testid={`calc-plot-${size.replace(" ", "-")}`}
                          className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${calcPlotSize === size ? "bg-[#C9A84C] border-[#C9A84C] text-[#0a1220] font-bold" : "border-[#1e3a5f] text-[#94a3b8] hover:border-[#C9A84C]/40 hover:text-white"}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-3 block">
                      Down Payment: {downPaymentPct}%
                    </Label>
                    <Input
                      type="range"
                      min="10"
                      max="70"
                      step="5"
                      value={downPaymentPct}
                      onChange={(e) => setDownPaymentPct(e.target.value)}
                      className="w-full accent-[#C9A84C] bg-transparent border-none h-2"
                      data-testid="slider-down-payment"
                    />
                    <div className="flex justify-between text-[#4a6080] text-xs mt-1">
                      <span>10%</span><span>70%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#C9A84C]/5 border-l border-[#C9A84C]/20 p-8 flex flex-col justify-center">
                  <div className="space-y-4">
                    <div>
                      <div className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">Total Plot Price</div>
                      <div className="text-2xl font-bold text-white font-serif">{formatPrice(totalPlotPrice)}</div>
                    </div>
                    <div className="h-px bg-[#1e3a5f]" />
                    <div>
                      <div className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">Down Payment ({downPaymentPct}%)</div>
                      <div className="text-xl font-bold text-[#C9A84C] font-serif">{formatPrice(downPayment)}</div>
                    </div>
                    <div>
                      <div className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">Remaining Balance</div>
                      <div className="text-lg font-bold text-white font-serif">{formatPrice(remaining)}</div>
                    </div>
                    <div className="h-px bg-[#C9A84C]/30" />
                    <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-2xl p-4 text-center">
                      <div className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">Monthly Installment</div>
                      <div className="text-3xl font-bold text-[#C9A84C] font-serif">{formatPrice(monthlyInstallment)}</div>
                      <div className="text-[#4a6080] text-xs mt-1">for 48 months (4 years)</div>
                    </div>
                    <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold gap-2" data-testid="button-book-from-calculator">
                          Book {calcPlotSize} Plot <ArrowRight className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Progress Feed */}
        <section className="py-16 px-4 border-t border-[#C9A84C]/10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-2">Live Progress</div>
                <h2 className="font-serif text-3xl font-bold text-white">Development Updates</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-medium">Live Updates</span>
              </div>
            </div>

            {updates && updates.length > 0 ? (
              <div className="space-y-4 relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#C9A84C]/50 to-transparent" />
                {updates.map((update, i) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    data-testid={`update-${update.id}`}
                    className="relative pl-16"
                  >
                    <div className="absolute left-3.5 top-4 h-5 w-5 rounded-full bg-[#C9A84C] border-2 border-[#0a1220] flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-[#0a1220]" />
                    </div>
                    <div className="bg-white/5 border border-[#C9A84C]/15 hover:border-[#C9A84C]/30 rounded-2xl p-5 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-white mb-1">{update.title}</h3>
                          <p className="text-[#94a3b8] text-sm leading-relaxed">{update.content}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#4a6080] text-xs whitespace-nowrap flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {new Date(update.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-[#C9A84C]/20 rounded-2xl">
                <BookOpen className="h-10 w-10 text-[#C9A84C]/20 mx-auto mb-3" />
                <p className="text-[#94a3b8] text-sm">No updates posted yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
