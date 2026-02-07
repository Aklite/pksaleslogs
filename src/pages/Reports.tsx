import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function Reports() {
  const { user } = useAuth();
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), i, 1);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
  });

  const exportToExcel = async () => {
    if (!user) return;
    setLoading(true);

    const start = startOfMonth(new Date(month + "-01")).toISOString().split("T")[0];
    const end = endOfMonth(new Date(month + "-01")).toISOString().split("T")[0];

    const { data: sales } = await supabase
      .from("sales")
      .select("*")
      .eq("user_id", user.id)
      .gte("sale_date", start)
      .lte("sale_date", end)
      .order("sale_date");

    const { data: customers } = await supabase
      .from("customers")
      .select("id, name")
      .eq("user_id", user.id);

    const custMap = new Map((customers || []).map((c: any) => [c.id, c.name]));

    const rows = (sales || []).map((s: any) => ({
      Date: format(new Date(s.sale_date), "dd/MM/yyyy"),
      "Customer Name": s.customer_id ? custMap.get(s.customer_id) || "Unknown" : "Walk-in",
      "Saree Price (₹)": Number(s.saree_price),
      Quantity: s.quantity,
      "Tips (₹)": Number(s.tips),
      "Total (₹)": Number(s.total),
    }));

    if (rows.length === 0) {
      setLoading(false);
      return toast.error("No sales data for this month");
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Ledger");

    // Auto-width columns
    const colWidths = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r: any) => String(r[key]).length)) + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `Saree_Ledger_${month}.xlsx`);
    toast.success("Excel file downloaded! 📊");
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Reports</h1>

      <div className="bg-card rounded-xl border border-border p-6 shadow-luxury space-y-5">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-secondary" />
          <div>
            <h3 className="font-semibold">Monthly Ledger Export</h3>
            <p className="text-xs text-muted-foreground">Download your sales data as Excel</p>
          </div>
        </div>

        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={exportToExcel}
          disabled={loading}
          className="w-full h-12 gradient-gold text-emerald-dark border-0 font-semibold text-base gap-2"
        >
          <Download className="h-5 w-5" />
          {loading ? "Generating..." : "Export Monthly Ledger to Excel"}
        </Button>
      </div>
    </div>
  );
}
