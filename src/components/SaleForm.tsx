import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SAREE_TYPES = ["Silk", "Cotton", "Banarasi", "Fancy", "Designer"];
const PAYMENT_MODES = ["Cash", "UPI", "Card"];

interface CustomerOption {
  id: string;
  name: string;
}

interface SaleFormProps {
  customers: CustomerOption[];
  editing: boolean;
  initialValues?: {
    customer_id: string;
    saree_price: string;
    quantity: string;
    tips: string;
    saree_type: string;
    payment_mode: string;
    commission: string;
  };
  onSave: (form: {
    customer_id: string;
    saree_price: string;
    quantity: string;
    tips: string;
    saree_type: string;
    payment_mode: string;
    commission: string;
  }) => void;
}

export default function SaleForm({ customers, editing, initialValues, onSave }: SaleFormProps) {
  const [form, setForm] = useState(
    initialValues || {
      customer_id: "",
      saree_price: "",
      quantity: "1",
      tips: "0",
      saree_type: "",
      payment_mode: "Cash",
      commission: "",
    }
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === form.customer_id);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 10);
    const q = customerSearch.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 10);
  }, [customerSearch, customers]);

  const total =
    (parseFloat(form.saree_price) || 0) * (parseInt(form.quantity) || 1) +
    (parseFloat(form.tips) || 0);

  return (
    <div className="space-y-3">
      {/* Smart Customer Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customer (optional)"
            value={selectedCustomer ? selectedCustomer.name : customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setForm({ ...form, customer_id: "" });
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="h-11 pl-9 pr-8"
          />
          {(form.customer_id || customerSearch) && (
            <button
              onClick={() => {
                setForm({ ...form, customer_id: "" });
                setCustomerSearch("");
                setShowDropdown(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        {showDropdown && !form.customer_id && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-luxury max-h-40 overflow-y-auto">
            {filteredCustomers.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setForm({ ...form, customer_id: c.id });
                  setCustomerSearch("");
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                {c.name}
              </button>
            ))}
            {filteredCustomers.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No customers found</p>
            )}
          </div>
        )}
      </div>

      {/* Saree Type Quick Select */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Saree Type</p>
        <div className="flex flex-wrap gap-1.5">
          {SAREE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() =>
                setForm({ ...form, saree_type: form.saree_type === type ? "" : type })
              }
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                form.saree_type === type
                  ? "gradient-gold text-emerald-dark shadow-gold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Price & Quantity */}
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

      {/* Commission / Incentive */}
      <Input
        type="number"
        placeholder="Your Incentive / Commission (₹)"
        value={form.commission}
        onChange={(e) => setForm({ ...form, commission: e.target.value })}
        className="h-11"
      />

      {/* Payment Mode */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Payment Mode</p>
        <div className="flex gap-2">
          {PAYMENT_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => setForm({ ...form, payment_mode: mode })}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                form.payment_mode === mode
                  ? "gradient-emerald text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Live Total */}
      <div className="bg-muted rounded-lg p-4 text-center">
        <p className="text-xs text-muted-foreground">Total Bill</p>
        <p className="text-3xl font-display font-bold mt-1">
          ₹{total.toLocaleString("en-IN")}
        </p>
      </div>

      <Button
        onClick={() => onSave(form)}
        className="w-full h-11 gradient-emerald text-primary-foreground border-0"
      >
        {editing ? "Update Sale" : "Record Sale"}
      </Button>
    </div>
  );
}
