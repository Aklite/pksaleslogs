import { useEffect, useState, useMemo } from "react";
import { Plus, Search, MessageCircle, Pencil, Trash2, Star, Filter, ChevronDown, ChevronUp, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

const PREFERENCE_TAGS = ["Likes Silk", "Heavy Work", "Simple/Daily Wear", "Banarasi Fan", "Designer Only", "Budget Conscious"];
const BUYER_SPEEDS = ["Fast Buyer", "Frequent Buyer", "Window Shopper"];

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  style_notes: string;
  buyer_speed: string | null;
  preferences: string[];
  total_spent?: number;
  avg_price?: number;
  sale_count?: number;
}

interface CustomerPhoto {
  id: string;
  photo_url: string;
  description: string;
}

function CustomerSkeleton() {
  return (
    <div className="glass-strong rounded-xl p-4 glow-border-gold space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-3 w-20" />
        </div>
        <div className="flex gap-1">
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="skeleton h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-1">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", style_notes: "", buyer_speed: "", preferences: [] as string[] });
  const [filterFast, setFilterFast] = useState(false);
  const [photos, setPhotos] = useState<Record<string, CustomerPhoto[]>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchCustomers = async () => {
    if (!user) return;
    setLoading(true);
    const { data: custData } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    const custs = (custData || []) as any[];

    const { data: salesData } = await supabase
      .from("sales")
      .select("customer_id, total, saree_price")
      .eq("user_id", user.id);

    const statsMap = new Map<string, { total: number; count: number; prices: number[] }>();
    (salesData || []).forEach((s: any) => {
      if (!s.customer_id) return;
      const existing = statsMap.get(s.customer_id) || { total: 0, count: 0, prices: [] };
      existing.total += Number(s.total || 0);
      existing.count += 1;
      existing.prices.push(Number(s.saree_price || 0));
      statsMap.set(s.customer_id, existing);
    });

    setCustomers(
      custs.map((c) => {
        const stats = statsMap.get(c.id);
        return {
          ...c,
          preferences: c.preferences || [],
          total_spent: stats?.total || 0,
          avg_price: stats ? Math.round(stats.total / stats.count) : 0,
          sale_count: stats?.count || 0,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, [user]);

  const fetchPhotos = async (customerId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("customer_photos")
      .select("id, photo_url, description")
      .eq("customer_id", customerId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPhotos((prev) => ({ ...prev, [customerId]: (data as CustomerPhoto[]) || [] }));
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", phone: "", address: "", style_notes: "", buyer_speed: "", preferences: [] });
    setSheetOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      address: c.address || "",
      style_notes: c.style_notes || "",
      buyer_speed: c.buyer_speed || "",
      preferences: c.preferences || [],
    });
    setSheetOpen(true);
  };

  const toggleDetail = (id: string) => {
    if (detailOpen === id) {
      setDetailOpen(null);
    } else {
      setDetailOpen(id);
      fetchPhotos(id);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) return toast.error("Name and Phone are required");
    if (!user) return;

    const payload = {
      name: form.name,
      phone: form.phone,
      address: form.address,
      style_notes: form.style_notes,
      buyer_speed: form.buyer_speed || null,
      preferences: form.preferences,
    };

    if (editing) {
      const { error } = await supabase.from("customers").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Customer updated");
    } else {
      const { error } = await supabase.from("customers").insert({ ...payload, user_id: user.id });
      if (error) return toast.error(error.message);
      toast.success("Customer added");
    }
    setSheetOpen(false);
    fetchCustomers();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Customer deleted");
    fetchCustomers();
  };

  const handlePhotoUpload = async (customerId: string, file: File) => {
    if (!user) return;
    setUploadingPhoto(true);
    const filePath = `${user.id}/${customerId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("saree-photos").upload(filePath, file);
    if (uploadError) { setUploadingPhoto(false); return toast.error("Upload failed"); }

    const { data: urlData } = supabase.storage.from("saree-photos").getPublicUrl(filePath);
    await supabase.from("customer_photos").insert({
      customer_id: customerId,
      user_id: user.id,
      photo_url: urlData.publicUrl,
      description: "",
    });
    setUploadingPhoto(false);
    toast.success("Photo added!");
    fetchPhotos(customerId);
  };

  const handleDeletePhoto = async (photoId: string, customerId: string) => {
    await supabase.from("customer_photos").delete().eq("id", photoId);
    toast.success("Photo removed");
    fetchPhotos(customerId);
  };

  const whatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleaned}`, "_blank");
  };

  const togglePreference = (pref: string) => {
    setForm((f) => ({
      ...f,
      preferences: f.preferences.includes(pref)
        ? f.preferences.filter((p) => p !== pref)
        : [...f.preferences, pref],
    }));
  };

  const filtered = useMemo(() => {
    let result = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.address || "").toLowerCase().includes(q) ||
          (c.buyer_speed || "").toLowerCase().includes(q)
      );
    }
    if (filterFast) {
      result = [...result].sort((a, b) => {
        const priority = (s: string | null) => s === "Fast Buyer" ? 0 : s === "Frequent Buyer" ? 1 : 2;
        return priority(a.buyer_speed) - priority(b.buyer_speed);
      });
    }
    return result;
  }, [customers, search, filterFast]);

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const speedBadge = (speed: string | null) => {
    if (speed === "Fast Buyer") return { label: "⚡ Fast", bg: "hsl(43 74% 49% / 0.15)", color: "hsl(43 74% 49%)", border: "hsl(43 74% 49% / 0.25)" };
    if (speed === "Frequent Buyer") return { label: "🔄 Frequent", bg: "hsl(210 60% 50% / 0.12)", color: "hsl(210 60% 60%)", border: "hsl(210 60% 50% / 0.2)" };
    if (speed === "Window Shopper") return { label: "👀 Browser", bg: "hsl(0 0% 50% / 0.1)", color: "hsl(0 0% 60%)", border: "hsl(0 0% 50% / 0.15)" };
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Customers</h1>
        <Button onClick={openNew} size="sm" className="gradient-gold border-0 gap-1" style={{ color: "hsl(0 0% 7%)" }}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(0 0% 55%)" }} />
          <Input
            placeholder="Search name, phone, city, or speed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 glass glow-border-gold bg-transparent"
            style={{ color: "hsl(0 0% 93%)" }}
          />
        </div>
        <button
          onClick={() => setFilterFast(!filterFast)}
          className={`px-3 rounded-xl flex items-center gap-1 text-xs font-semibold transition-all ${
            filterFast
              ? "gradient-gold shadow-gold"
              : "glass glow-border-gold"
          }`}
          style={{ color: filterFast ? "hsl(0 0% 7%)" : "hsl(0 0% 55%)" }}
        >
          <Filter className="h-3.5 w-3.5" />
          Priority
        </button>
      </div>

      {/* Skeleton Loading */}
      {loading && (
        <div className="space-y-3">
          <CustomerSkeleton />
          <CustomerSkeleton />
          <CustomerSkeleton />
        </div>
      )}

      {/* Customer List */}
      {!loading && (
        <AnimatePresence>
          {filtered.map((c) => {
            const badge = speedBadge(c.buyer_speed);
            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.2 }}
              >
                <div className="glass-strong rounded-xl p-4 glow-border-gold mb-3">
                  <div className="flex items-start justify-between">
                    <button onClick={() => toggleDetail(c.id)} className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate" style={{ color: "hsl(0 0% 95%)" }}>{c.name}</h3>
                        {c.buyer_speed === "Fast Buyer" && (
                          <Star className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(43 74% 49%)", fill: "hsl(43 74% 49%)" }} />
                        )}
                      </div>
                      <p className="text-sm" style={{ color: "hsl(0 0% 55%)" }}>{c.phone}</p>
                      {c.address && <p className="text-xs mt-0.5" style={{ color: "hsl(0 0% 50%)" }}>📍 {c.address}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-semibold" style={{ color: "hsl(43 74% 49%)" }}>
                          {formatCurrency(c.total_spent || 0)}
                        </span>
                        {badge && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                          >
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button
                        onClick={() => whatsApp(c.phone)}
                        className="p-2.5 rounded-full transition-colors"
                        style={{ background: "hsl(142 70% 40% / 0.1)", color: "hsl(142 70% 40%)" }}
                        aria-label="WhatsApp"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </button>
                      <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Edit">
                        <Pencil className="h-4 w-4" style={{ color: "hsl(0 0% 55%)" }} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                      <button onClick={() => toggleDetail(c.id)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                        {detailOpen === c.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Preference Tags */}
                  {c.preferences && c.preferences.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.preferences.map((pref) => (
                        <span
                          key={pref}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            background: "hsl(43 74% 49% / 0.1)",
                            color: "hsl(43 74% 38%)",
                            border: "1px solid hsl(43 74% 49% / 0.15)",
                          }}
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {detailOpen === c.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3" style={{ borderTop: "1px solid hsl(0 0% 16%)" }}>
                          {/* Quick Stats */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="glass rounded-lg p-2 text-center glow-border-gold">
                              <p className="text-[10px] uppercase" style={{ color: "hsl(0 0% 50%)" }}>Total Spent</p>
                              <p className="text-sm font-display font-bold" style={{ color: "hsl(0 0% 95%)" }}>{formatCurrency(c.total_spent || 0)}</p>
                            </div>
                            <div className="glass rounded-lg p-2 text-center glow-border-gold">
                              <p className="text-[10px] uppercase" style={{ color: "hsl(0 0% 50%)" }}>Avg Price</p>
                              <p className="text-sm font-display font-bold" style={{ color: "hsl(0 0% 95%)" }}>{formatCurrency(c.avg_price || 0)}</p>
                            </div>
                            <div className="glass rounded-lg p-2 text-center glow-border-gold">
                              <p className="text-[10px] uppercase" style={{ color: "hsl(0 0% 50%)" }}>Speed</p>
                              <p className="text-sm font-display font-bold" style={{ color: "hsl(0 0% 95%)" }}>
                                {c.buyer_speed === "Fast Buyer" ? "⚡ Fast" : c.buyer_speed === "Frequent Buyer" ? "🔄 Freq" : c.buyer_speed === "Window Shopper" ? "👀 Slow" : "—"}
                              </p>
                            </div>
                          </div>

                          {c.style_notes && (
                            <p className="text-xs italic mb-3" style={{ color: "hsl(43 74% 38%)" }}>"{c.style_notes}"</p>
                          )}

                          {/* Photo Gallery */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(0 0% 50%)" }}>Saree Gallery</p>
                              <label className="cursor-pointer px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors hover:bg-muted" style={{ color: "hsl(43 74% 49%)" }}>
                                <Upload className="h-3 w-3" />
                                {uploadingPhoto ? "Uploading..." : "Add Photo"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingPhoto}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handlePhotoUpload(c.id, file);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                            </div>
                            {(photos[c.id]?.length || 0) > 0 ? (
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {photos[c.id]?.map((photo) => (
                                  <div key={photo.id} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden glow-border-gold">
                                    <img src={photo.photo_url} alt="Saree" className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => handleDeletePhoto(photo.id, c.id)}
                                      className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-destructive/80 text-white"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-center py-4" style={{ color: "hsl(0 0% 45%)" }}>No photos yet. Tap "Add Photo" to upload saree images.</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-sm py-12" style={{ color: "hsl(0 0% 50%)" }}>No customers found. Tap "Add" to get started.</p>
      )}

      {/* Side-Drawer for Add/Edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[340px] sm:w-[400px] overflow-y-auto" style={{ background: "hsl(0 0% 9%)", borderLeft: "1px solid hsl(43 74% 49% / 0.15)", color: "hsl(0 0% 93%)" }}>
          <SheetHeader>
            <SheetTitle className="font-display" style={{ color: "hsl(0 0% 95%)" }}>{editing ? "Edit Customer" : "New Customer"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 mt-4">
            <Input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 glass glow-border-gold bg-transparent" style={{ color: "hsl(0 0% 93%)" }} />
            <Input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 glass glow-border-gold bg-transparent" style={{ color: "hsl(0 0% 93%)" }} />
            <Input placeholder="Address / City" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-11 glass glow-border-gold bg-transparent" style={{ color: "hsl(0 0% 93%)" }} />
            <Textarea placeholder="Style Notes" value={form.style_notes} onChange={(e) => setForm({ ...form, style_notes: e.target.value })} rows={2} className="glass glow-border-gold bg-transparent" style={{ color: "hsl(0 0% 93%)" }} />

            {/* 3-Way Buyer Temperament */}
            <div>
              <p className="text-xs mb-1.5 font-medium uppercase tracking-wider" style={{ color: "hsl(0 0% 50%)" }}>Buying Temperament</p>
              <div className="flex flex-col gap-1.5">
                {BUYER_SPEEDS.map((speed) => {
                  const isSelected = form.buyer_speed === speed;
                  const icons: Record<string, string> = { "Fast Buyer": "⚡", "Frequent Buyer": "🔄", "Window Shopper": "👀" };
                  const labels: Record<string, string> = { "Fast Buyer": "High Priority", "Frequent Buyer": "Consistent", "Window Shopper": "Low Priority" };
                  return (
                    <button
                      key={speed}
                      onClick={() => setForm({ ...form, buyer_speed: form.buyer_speed === speed ? "" : speed })}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: isSelected ? "hsl(43 74% 49% / 0.15)" : "hsl(0 0% 14%)",
                        border: `1px solid ${isSelected ? "hsl(43 74% 49% / 0.3)" : "hsl(0 0% 18%)"}`,
                        color: isSelected ? "hsl(43 74% 49%)" : "hsl(0 0% 55%)",
                      }}
                    >
                      <span className="text-base">{icons[speed]}</span>
                      <span className="flex-1 text-left">{speed}</span>
                      <span className="text-[10px] opacity-70">{labels[speed]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferences */}
            <div>
              <p className="text-xs mb-1.5 font-medium uppercase tracking-wider" style={{ color: "hsl(0 0% 50%)" }}>Preferences</p>
              <div className="flex flex-wrap gap-1.5">
                {PREFERENCE_TAGS.map((pref) => (
                  <button
                    key={pref}
                    onClick={() => togglePreference(pref)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: form.preferences.includes(pref) ? "hsl(43 74% 49% / 0.15)" : "hsl(0 0% 14%)",
                      border: `1px solid ${form.preferences.includes(pref) ? "hsl(43 74% 49% / 0.3)" : "hsl(0 0% 18%)"}`,
                      color: form.preferences.includes(pref) ? "hsl(43 74% 49%)" : "hsl(0 0% 55%)",
                    }}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full h-11 gradient-gold border-0 font-semibold" style={{ color: "hsl(0 0% 7%)" }}>
              {editing ? "Update" : "Add Customer"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
