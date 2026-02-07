import { useEffect, useState } from "react";
import { Plus, Search, MessageCircle, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  style_notes: string;
}

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", style_notes: "" });

  const fetchCustomers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    setCustomers((data as Customer[]) || []);
  };

  useEffect(() => { fetchCustomers(); }, [user]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", phone: "", address: "", style_notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, address: c.address, style_notes: c.style_notes });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) return toast.error("Name and Phone are required");
    if (!user) return;

    if (editing) {
      const { error } = await supabase.from("customers").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Customer updated");
    } else {
      const { error } = await supabase.from("customers").insert({ ...form, user_id: user.id });
      if (error) return toast.error(error.message);
      toast.success("Customer added");
    }
    setDialogOpen(false);
    fetchCustomers();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Customer deleted");
    fetchCustomers();
  };

  const whatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleaned}`, "_blank");
  };

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Customers</h1>
        <Button onClick={openNew} size="sm" className="gradient-emerald text-primary-foreground border-0 gap-1">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      <AnimatePresence>
        {filtered.map((c) => (
          <motion.div
            key={c.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-card rounded-xl border border-border p-4 shadow-luxury"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{c.name}</h3>
                <p className="text-sm text-muted-foreground">{c.phone}</p>
                {c.address && <p className="text-xs text-muted-foreground mt-0.5">{c.address}</p>}
                {c.style_notes && (
                  <p className="text-xs text-gold-dark mt-1 italic">"{c.style_notes}"</p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <button
                  onClick={() => whatsApp(c.phone)}
                  className="p-2.5 rounded-full bg-whatsapp/10 text-whatsapp hover:bg-whatsapp/20 transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
                <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Edit">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">No customers yet. Tap "Add" to get started.</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Customer" : "New Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11" />
            <Input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11" />
            <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-11" />
            <Textarea placeholder="Style Notes (e.g., prefers Banarasi, silk lover)" value={form.style_notes} onChange={(e) => setForm({ ...form, style_notes: e.target.value })} rows={3} />
            <Button onClick={handleSave} className="w-full h-11 gradient-emerald text-primary-foreground border-0">
              {editing ? "Update" : "Add Customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
