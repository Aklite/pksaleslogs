import { useState } from "react";
import { Download, FileSpreadsheet, Users } from "lucide-react";
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
  const [loadingDir, setLoadingDir] = useState(false);

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

    const colWidths = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r: any) => String(r[key]).length)) + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `Saree_Ledger_${month}.xlsx`);
    toast.success("Excel file downloaded! 📊");
    setLoading(false);
  };

  const exportCustomerDirectory = async () => {
    if (!user) return;
    setLoadingDir(true);

    const { data: customers } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    const { data: salesData } = await supabase
      .from("sales")
      .select("customer_id, total")
      .eq("user_id", user.id);

    const salesMap = new Map<string, number>();
    (salesData || []).forEach((s: any) => {
      if (!s.customer_id) return;
      salesMap.set(s.customer_id, (salesMap.get(s.customer_id) || 0) + Number(s.total || 0));
    });

    const cityMap = new Map<string, number>();
    (customers || []).forEach((c: any) => {
      const city = (c.address || "Unknown").trim() || "Unknown";
      const spent = salesMap.get(c.id) || 0;
      cityMap.set(city, (cityMap.get(city) || 0) + spent);
    });

    const rows = (customers || []).map((c: any) => ({
      Name: c.name,
      Phone: c.phone,
      "Address / City": c.address || "",
      "Buying Temperament": c.buyer_speed || "Not Set",
      Preferences: (c.preferences || []).join(", "),
      "Total Purchases (₹)": salesMap.get(c.id) || 0,
    }));

    if (rows.length === 0) {
      setLoadingDir(false);
      return toast.error("No customers to export");
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customer Directory");

    const cityRows = Array.from(cityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([city, total]) => ({ City: city, "Total Sales (₹)": total }));
    const ws2 = XLSX.utils.json_to_sheet(cityRows);
    XLSX.utils.book_append_sheet(wb, ws2, "City Summary");

    const colWidths = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r: any) => String(r[key]).length)) + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `Customer_Directory_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Customer directory downloaded! 📇");
    setLoadingDir(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-foreground">Reports</h1>

      <div className="glass-strong rounded-xl p-6 glow-border-gold space-y-5">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8" style={{ color: "hsl(43 74% 52%)" }} />
          <div>
            <h3 className="font-semibold text-foreground">Monthly Ledger Export</h3>
            <p className="text-xs text-muted-foreground">Download your sales data as Excel</p>
          </div>
        </div>

        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="h-11 glass glow-border-gold bg-transparent text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border text-foreground">
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={exportToExcel}
          disabled={loading}
          className="w-full h-12 gradient-gold border-0 font-semibold text-base gap-2"
          style={{ color: "hsl(220 100% 10%)" }}
        >
          <Download className="h-5 w-5" />
          {loading ? "Generating..." : "Export Monthly Ledger"}
        </Button>
      </div>

      <div className="glass-strong rounded-xl p-6 glow-border-gold space-y-5">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8" style={{ color: "hsl(43 74% 52%)" }} />
          <div>
            <h3 className="font-semibold text-foreground">Customer Directory Export</h3>
            <p className="text-xs text-muted-foreground">Name, Phone, City, Temperament, Preferences & Total Purchases</p>
          </div>
        </div>

        <Button
          onClick={exportCustomerDirectory}
          disabled={loadingDir}
          className="w-full h-12 gradient-gold border-0 font-semibold text-base gap-2"
          style={{ color: "hsl(220 100% 10%)" }}
        >
          <Download className="h-5 w-5" />
          {loadingDir ? "Generating..." : "Export Customer Directory"}
        </Button>
      </div>
    </div>
  );
}
