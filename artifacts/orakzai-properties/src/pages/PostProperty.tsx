import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Plus, X, ImageIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useCreateProperty, getGetMyPropertiesQueryKey, getListPropertiesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Show } from "@clerk/react";
import { Link } from "wouter";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.coerce.number().min(1, "Price is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  type: z.string().min(1, "Type is required"),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function PostProperty() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const createProperty = useCreateProperty();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", description: "", price: 0, city: "", area: "",
      category: "", type: "", ownerName: "", ownerPhone: "", whatsappNumber: "",
    },
  });

  const addImageField = () => setImageUrls((prev) => [...prev, ""]);
  const removeImageField = (i: number) => setImageUrls((prev) => prev.filter((_, idx) => idx !== i));
  const updateImage = (i: number, val: string) => setImageUrls((prev) => { const n = [...prev]; n[i] = val; return n; });

  const onSubmit = async (values: FormValues) => {
    const images = imageUrls.filter((u) => u.trim().length > 0);
    createProperty.mutate(
      { data: { ...values, images, area: values.area || null, ownerName: values.ownerName || null, ownerPhone: values.ownerPhone || null, whatsappNumber: values.whatsappNumber || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyPropertiesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
          toast({ title: "Property Listed!", description: "Your property has been successfully posted." });
          setLocation("/my-properties");
        },
        onError: () => {
          toast({ title: "Failed to post", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-20 pb-16 px-4 max-w-3xl mx-auto">
        <Show when="signed-out">
          <div className="mt-16 text-center">
            <div className="h-16 w-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-[#C9A84C]" />
            </div>
            <h2 className="font-serif text-2xl text-white mb-2">Sign In Required</h2>
            <p className="text-[#94a3b8] mb-6">You need to be signed in to post a property listing.</p>
            <Link href="/sign-in">
              <Button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-semibold">Sign In to Continue</Button>
            </Link>
          </div>
        </Show>
        <Show when="signed-in">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <div className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-2">List Your Property</div>
            <h1 className="font-serif text-3xl font-bold text-white mb-2">Post a Property</h1>
            <p className="text-[#94a3b8] text-sm mb-8">Fill in the details below to list your property on Orakzai Properties.</p>

            <div className="bg-white/5 border border-[#C9A84C]/20 rounded-2xl p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#94a3b8]">Property Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Luxury 10 Marla House – DHA Phase 6" className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#94a3b8]">Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe the property in detail..." rows={4} className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9] resize-none" data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#94a3b8]">Price (PKR)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="e.g. 45000000" className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" data-testid="input-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#94a3b8]">City</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" data-testid="select-city">
                              <SelectValue placeholder="Select City" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0f1929] border-[#1e3a5f] text-[#f1f5f9]">
                            <SelectItem value="Lahore">Lahore</SelectItem>
                            <SelectItem value="Islamabad">Islamabad</SelectItem>
                            <SelectItem value="Karachi">Karachi</SelectItem>
                            <SelectItem value="Rawalpindi">Rawalpindi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="area" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#94a3b8]">Area / Sector <span className="text-[#4a6080] text-xs">(optional)</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. DHA Phase 6, Gulberg III, F-11" className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" data-testid="input-area" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#94a3b8]">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" data-testid="select-category">
                              <SelectValue placeholder="Buy / Rent / Sell" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0f1929] border-[#1e3a5f] text-[#f1f5f9]">
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                            <SelectItem value="rent">Rent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#94a3b8]">Property Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" data-testid="select-type">
                              <SelectValue placeholder="Plot / House / Commercial" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0f1929] border-[#1e3a5f] text-[#f1f5f9]">
                            <SelectItem value="plot">Plot</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Image URLs */}
                  <div>
                    <div className="text-[#94a3b8] text-sm font-medium mb-2 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-[#C9A84C]" /> Property Images (URLs)
                    </div>
                    <div className="space-y-2">
                      {imageUrls.map((url, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={url}
                            onChange={(e) => updateImage(i, e.target.value)}
                            placeholder={`Image URL ${i + 1}`}
                            className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9] flex-1"
                            data-testid={`input-image-${i}`}
                          />
                          {imageUrls.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeImageField(i)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={addImageField} className="mt-2 text-[#C9A84C] hover:text-[#e8c060] gap-1.5">
                      <Plus className="h-4 w-4" /> Add Image URL
                    </Button>
                  </div>

                  <div className="border-t border-[#1e3a5f] pt-6">
                    <div className="text-[#94a3b8] text-sm font-medium mb-4">Contact Information</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="ownerName" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#94a3b8] text-xs">Your Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Agent / Owner Name" className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" data-testid="input-owner-name" />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="ownerPhone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#94a3b8] text-xs">Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+923001234567" className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" data-testid="input-phone" />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#94a3b8] text-xs">WhatsApp Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+923001234567" className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9]" data-testid="input-whatsapp" />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={createProperty.isPending}
                    className="w-full bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold h-12 text-base"
                    data-testid="button-submit-property"
                  >
                    {createProperty.isPending ? "Posting..." : "Post Property"}
                  </Button>
                </form>
              </Form>
            </div>
          </motion.div>
        </Show>
      </div>
    </div>
  );
}
