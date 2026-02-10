import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import SaleForm from "@/components/SaleForm";
import WhatsAppThankYou from "@/components/WhatsAppThankYou";

interface Sale {
  id: string;
  customer_id: string | null;
  saree_price: number;
  quantity: number;
  tips: number;
  total: number;
  sale_date: string;
  saree_type: string | null;
  payment_mode: string;
  commission: number;
  customer_name?: string;
  customer_phone?: string;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

export default function SalesLog() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [whatsApp, setWhatsApp] = useState<{ name: string; phone: string } | null>(null);

  const fetchData = async () => {
    if (!user) return;
    const { data: salesData } = await supabase
      .from("sales")
      .select("*")
      .eq("user_id", user.id)
      .order("sale_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: custData } = await supabase
      .from("customers")
      .select("id, name, phone")
      .eq("user_id", user.id)
      .order("name");

    setCustomers((custData as CustomerOption[]) || []);

    const custMap = new Map((custData || []).map((c: any) => [c.id, c]));
    setSales(
      (salesData || []).map((s: any) => {
        const cust = s.customer_id ? custMap.get(s.customer_id) : null;
        return {
          ...s,
          customer_name: cust ? cust.name : "Walk-in",
          customer_phone: cust?.phone || "",
        };
      })
    );
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const openEdit = (s: Sale) => {
    setEditing(s);
    setDialogOpen(true);
  };

  const handleSave = async (form: {
    customer_id: string;
    saree_price: string;
    quantity: string;
    tips: string;
    saree_type: string;
    payment_mode: string;
    commission: string;
  }) => {
    const price = parseFloat(form.saree_price);
    const qty = parseInt(form.quantity);
    if (!price || price <= 0) return toast.error("Enter a valid price");
    if (!qty || qty <= 0) return toast.error("Enter a valid quantity");
    if (!user) return;

    const payload = {
      saree_price: price,
      quantity: qty,
      tips: parseFloat(form.tips) || 0,
      customer_id: form.customer_id || null,
      saree_type: form.saree_type || null,
      payment_mode: form.payment_mode.toLowerCase(),
      commission: parseFloat(form.commission) || 0,
      user_id: user.id,
    };

    if (editing) {
      const { user_id, ...updatePayload } = payload;
      const { error } = await supabase.from("sales").update(updatePayload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Sale updated");
    } else {
      const { error } = await supabase.from("sales").insert(payload);
      if (error) return toast.error(error.message);

      if (form.customer_id) {
        const cust = customers.find((c) => c.id === form.customer_id);
        if (cust?.phone) {
          setWhatsApp({ name: cust.name, phone: cust.phone });
        } else {
          toast.success("Sale recorded! 🎉");
        }
      } else {
        toast.success("Sale recorded! 🎉");
      }
    }
    setDialogOpen(false);
    setEditing(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Sale deleted");
    fetchData();
  };

  const getEditInitialValues = (s: Sale) => ({
    customer_id: s.customer_id || "",
    saree_price: String(s.saree_price),
    quantity: String(s.quantity),
    tips: String(s.tips),
    saree_type: s.saree_type || "",
    payment_mode: s.payment_mode ? s.payment_mode.charAt(0).toUpperCase() + s.payment_mode.slice(1) : "Cash",
    commission: String(s.commission || ""),
  });

  const paymentBadgeStyle = (mode: string) => {
    switch (mode) {
      case "upi": return { background: "hsl(260 60% 92% / 0.6)", color: "hsl(260 50% 40%)" };
      case "card": return { background: "hsl(210 60% 92% / 0.6)", color: "hsl(210 50% 35%)" };
      default: return { background: "hsl(142 40% 90% / 0.6)", color: "hsl(142 50% 30%)" };
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Sales Log</h1>
      </div>

      <AnimatePresence>
        {sales.map((s) => (
          <motion.div
            key={s.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="glass-strong rounded-xl p-4 glow-border-gold glass-glow"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{s.customer_name}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(s.sale_date), "dd MMM yyyy")}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {s.saree_type && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold gradient-gold text-emerald-dark">
                      {s.saree_type}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={paymentBadgeStyle(s.payment_mode)}>
                    {s.payment_mode?.toUpperCase() || "CASH"}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display font-bold">₹{Number(s.total).toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-muted-foreground">
                  {s.quantity}x ₹{Number(s.saree_price).toLocaleString("en-IN")}
                </p>
                {s.commission > 0 && (
                  <p className="text-[10px] font-medium" style={{ color: "hsl(45 56% 40%)" }}>
                    Commission: ₹{Number(s.commission).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-1 mt-2">
              <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {sales.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">No sales recorded yet. Tap the + button to begin.</p>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        className="fixed bottom-24 right-5 z-40 h-14 w-14 rounded-full gradient-gold shadow-gold flex items-center justify-center text-emerald-dark active:scale-95 transition-transform"
        aria-label="New Sale"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      {/* Sale Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto glass-strong glow-border-gold">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Sale" : "New Sale"}</DialogTitle>
          </DialogHeader>
          <SaleForm
            customers={customers}
            editing={!!editing}
            initialValues={editing ? getEditInitialValues(editing) : undefined}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>

      {/* WhatsApp Thank You */}
      {whatsApp && (
        <WhatsAppThankYou
          open={!!whatsApp}
          onClose={() => {
            setWhatsApp(null);
            toast.success("Sale recorded! 🎉");
          }}
          customerName={whatsApp.name}
          customerPhone={whatsApp.phone}
        />
      )}
    </div>
  );
}
