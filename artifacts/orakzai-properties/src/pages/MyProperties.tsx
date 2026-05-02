import { motion } from "framer-motion";
import { Link } from "wouter";
import { Plus, Trash2, MapPin, Lock, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useGetMyProperties, useDeleteProperty, getGetMyPropertiesQueryKey, getListPropertiesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Show } from "@clerk/react";

function formatPrice(price: number): string {
  if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(1)} Crore`;
  if (price >= 100000) return `PKR ${(price / 100000).toFixed(0)} Lakh`;
  return `PKR ${price.toLocaleString()}`;
}

const categoryColors: Record<string, string> = {
  buy: "text-emerald-400",
  sell: "text-blue-400",
  rent: "text-purple-400",
};

export default function MyProperties() {
  const { data: properties, isLoading } = useGetMyProperties();
  const deleteProperty = useDeleteProperty();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteProperty.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyPropertiesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
          toast({ title: "Property Deleted", description: `"${title}" has been removed.` });
        },
        onError: () => {
          toast({ title: "Delete Failed", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-20 pb-16 px-4 max-w-5xl mx-auto">
        <Show when="signed-out">
          <div className="mt-16 text-center">
            <div className="h-16 w-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-[#C9A84C]" />
            </div>
            <h2 className="font-serif text-2xl text-white mb-2">Sign In Required</h2>
            <p className="text-[#94a3b8] mb-6">Sign in to view and manage your property listings.</p>
            <Link href="/sign-in">
              <Button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-semibold">Sign In</Button>
            </Link>
          </div>
        </Show>
        <Show when="signed-in">
          <div className="mt-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-2">My Dashboard</div>
                <h1 className="font-serif text-3xl font-bold text-white">My Listings</h1>
                <p className="text-[#94a3b8] text-sm mt-1">Manage your property listings</p>
              </div>
              <Link href="/post-property">
                <Button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-semibold gap-1.5">
                  <Plus className="h-4 w-4" /> Post Property
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : properties && properties.length > 0 ? (
              <div className="space-y-4">
                {properties.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    data-testid={`row-property-${p.id}`}
                    className="bg-white/5 border border-[#C9A84C]/15 hover:border-[#C9A84C]/30 rounded-2xl p-5 flex items-center gap-4 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                      <LayoutList className="h-5 w-5 text-[#C9A84C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-white text-sm truncate">{p.title}</h3>
                        <span className={`text-[10px] font-semibold uppercase ${categoryColors[p.category] || "text-[#94a3b8]"}`}>{p.category}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[#94a3b8] text-xs">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}</span>
                        <span className="capitalize">{p.type}</span>
                        <span className="text-[#C9A84C] font-semibold">{formatPrice(Number(p.price))}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/property/${p.id}`}>
                        <Button variant="ghost" size="sm" className="text-[#94a3b8] hover:text-white text-xs" data-testid={`button-view-property-${p.id}`}>
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(p.id, p.title)}
                        disabled={deleteProperty.isPending}
                        className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10 h-8 w-8"
                        data-testid={`button-delete-${p.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 border border-dashed border-[#C9A84C]/20 rounded-2xl">
                <LayoutList className="h-12 w-12 text-[#C9A84C]/20 mx-auto mb-4" />
                <h3 className="font-serif text-xl text-white mb-2">No listings yet</h3>
                <p className="text-[#94a3b8] text-sm mb-6">Start by posting your first property listing.</p>
                <Link href="/post-property">
                  <Button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-semibold">Post Your First Property</Button>
                </Link>
              </div>
            )}
          </div>
        </Show>
      </div>
    </div>
  );
}
