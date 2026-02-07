import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface Sale {
  id: string;
  customer_id: string | null;
  saree_price: number;
  quantity: number;
  tips: number;
  total: number;
  sale_date: string;
  customer_name?: string;
}

interface CustomerOption {
  id: string;
  name: string;
}

export default function SalesLog() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [form, setForm] = useState({ customer_id: "", saree_price: "", quantity: "1", tips: "0" });

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
      .select("id, name")
      .eq("user_id", user.id)
      .order("name");

    setCustomers((custData as CustomerOption[]) || []);

    const custMap = new Map((custData || []).map((c: any) => [c.id, c.name]));
    setSales(
      (salesData || []).map((s: any) => ({
        ...s,
        customer_name: s.customer_id ? custMap.get(s.customer_id) || "Unknown" : "Walk-in",
      }))
    );
  };

  useEffect(() => { fetchData(); }, [user]);

  const openNew = () => {
    setEditing(null);
    setForm({ customer_id: "", saree_price: "", quantity: "1", tips: "0" });
    setDialogOpen(true);
  };

  const openEdit = (s: Sale) => {
    setEditing(s);
    setForm({
      customer_id: s.customer_id || "",
      saree_price: String(s.saree_price),
      quantity: String(s.quantity),
      tips: String(s.tips),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
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
      toast.success("Sale recorded! 🎉");
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Sale deleted");
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Sales Log</h1>
        <Button onClick={openNew} size="sm" className="gradient-gold text-emerald-dark border-0 gap-1 font-semibold">
          <Plus className="h-4 w-4" /> New Sale
        </Button>
      </div>

      <AnimatePresence>
        {sales.map((s) => (
          <motion.div
            key={s.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-card rounded-xl border border-border p-4 shadow-luxury"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{s.customer_name}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(s.sale_date), "dd MMM yyyy")}</p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold">₹{Number(s.total).toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-muted-foreground">
                  {s.quantity}x ₹{Number(s.saree_price).toLocaleString("en-IN")} + ₹{Number(s.tips).toLocaleString("en-IN")} tip
                </p>
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
        <p className="text-center text-sm text-muted-foreground py-12">No sales recorded yet. Tap "New Sale" to begin.</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Sale" : "New Sale"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select customer (optional)" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Saree Price (₹) *"
              value={form.saree_price}
              onChange={(e) => setForm({ ...form, saree_price: e.target.value })}
              className="h-11"
            />
            <Input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="h-11"
            />
            <Input
              type="number"
              placeholder="Tips / Commission (₹)"
              value={form.tips}
              onChange={(e) => setForm({ ...form, tips: e.target.value })}
              className="h-11"
            />
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-display font-bold">
                ₹{((parseFloat(form.saree_price) || 0) * (parseInt(form.quantity) || 1) + (parseFloat(form.tips) || 0)).toLocaleString("en-IN")}
              </p>
            </div>
            <Button onClick={handleSave} className="w-full h-11 gradient-emerald text-primary-foreground border-0">
              {editing ? "Update Sale" : "Record Sale"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
