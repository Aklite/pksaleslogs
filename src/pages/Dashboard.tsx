import { useEffect, useState } from "react";
import { IndianRupee, TrendingUp, Coins, Award, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import BentoCard from "@/components/BentoCard";
import ProgressRing from "@/components/ProgressRing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MONTHLY_GOAL = 1000000;

interface TodaySale {
  id: string;
  customer_id: string | null;
  total: number;
  quantity: number;
  customer_name: string;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-40" />
      <div className="skeleton h-24 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-20 rounded-xl" />
        <div className="skeleton h-20 rounded-xl" />
        <div className="skeleton h-20 rounded-xl" />
        <div className="skeleton h-20 rounded-xl" />
      </div>
      <div className="skeleton h-48 rounded-xl" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todaySales, setTodaySales] = useState(0);
  const [todaySareeCount, setTodaySareeCount] = useState(0);
  const [todayBills, setTodayBills] = useState<TodaySale[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [tipsEarned, setTipsEarned] = useState(0);
  const [monthlyCommission, setMonthlyCommission] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{ day: string; sales: number }[]>([]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekStart = monday.toISOString().split("T")[0];

    const { data: todayData } = await supabase
      .from("sales")
      .select("id, total, quantity, customer_id")
      .eq("user_id", user.id)
      .eq("sale_date", today);

    const todayTotalVal = todayData?.reduce((s, r) => s + Number(r.total), 0) || 0;
    const todayQty = todayData?.reduce((s, r) => s + Number(r.quantity), 0) || 0;
    setTodaySales(todayTotalVal);
    setTodaySareeCount(todayQty);

    const custIds = [...new Set((todayData || []).filter((s) => s.customer_id).map((s) => s.customer_id!))];
    let custMap = new Map<string, string>();
    if (custIds.length > 0) {
      const { data: custData } = await supabase
        .from("customers")
        .select("id, name")
        .in("id", custIds);
      custMap = new Map((custData || []).map((c: any) => [c.id, c.name]));
    }
    setTodayBills(
      (todayData || []).map((s) => ({
        ...s,
        total: Number(s.total),
        quantity: Number(s.quantity),
        customer_name: s.customer_id ? custMap.get(s.customer_id) || "Unknown" : "Walk-in",
      }))
    );

    const { data: monthData } = await supabase
      .from("sales")
      .select("total, tips, commission")
      .eq("user_id", user.id)
      .gte("sale_date", startOfMonth);
    setMonthlyTotal(monthData?.reduce((s, r) => s + Number(r.total), 0) || 0);
    setTipsEarned(monthData?.reduce((s, r) => s + Number(r.tips), 0) || 0);
    setMonthlyCommission(monthData?.reduce((s, r) => s + Number((r as any).commission || 0), 0) || 0);

    const { data: weekData } = await supabase
      .from("sales")
      .select("sale_date, total")
      .eq("user_id", user.id)
      .gte("sale_date", weekStart)
      .order("sale_date");

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const grouped: Record<string, number> = {};
    days.forEach((d) => (grouped[d] = 0));
    weekData?.forEach((s) => {
      const d = new Date(s.sale_date);
      const dayIdx = d.getDay();
      const dayName = days[dayIdx === 0 ? 6 : dayIdx - 1];
      grouped[dayName] += Number(s.total);
    });
    setWeeklyData(days.map((day) => ({ day, sales: grouped[day] })));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleDeleteTodaySale = async (id: string) => {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Sale deleted");
    fetchData();
  };

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const progress = Math.min((monthlyTotal / MONTHLY_GOAL) * 100, 100);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: "hsl(0 0% 95%)" }}>Dashboard</h1>
          <p className="text-xs" style={{ color: "hsl(0 0% 50%)" }}>Your sales at a glance</p>
        </div>
        <LogoutButton />
      </div>

      {/* Today's Saree Counter */}
      <div className="gradient-gold rounded-xl p-4 shadow-gold text-center">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80" style={{ color: "hsl(0 0% 7%)" }}>Today</p>
        <p className="text-4xl font-display font-bold" style={{ color: "hsl(0 0% 7%)" }}>{todaySareeCount}</p>
        <p className="text-sm font-semibold opacity-80" style={{ color: "hsl(0 0% 7%)" }}>
          {todaySareeCount === 1 ? "Saree" : "Sarees"} Sold
        </p>
      </div>

      {/* Bento Cards */}
      <div className="grid grid-cols-2 gap-3">
        <BentoCard title="Today" value={formatCurrency(todaySales)} icon={<IndianRupee className="h-3.5 w-3.5" />} variant="emerald" />
        <BentoCard title="This Month" value={formatCurrency(monthlyTotal)} icon={<TrendingUp className="h-3.5 w-3.5" />} variant="gold" />
        <BentoCard title="Tips Earned" value={formatCurrency(tipsEarned)} icon={<Coins className="h-3.5 w-3.5" />} />
        <BentoCard title="Commission" value={formatCurrency(monthlyCommission)} icon={<Award className="h-3.5 w-3.5" />} />
      </div>

      {/* Today's Bills */}
      <div className="glass-strong rounded-xl p-4 glow-border-gold">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(0 0% 90%)" }}>Today's Bills</h3>
        {todayBills.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "hsl(0 0% 45%)" }}>No sales today yet</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {todayBills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid hsl(0 0% 16%)" }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "hsl(0 0% 90%)" }}>{bill.customer_name}</p>
                  <p className="text-[10px]" style={{ color: "hsl(0 0% 50%)" }}>{bill.quantity} saree{bill.quantity > 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-sm font-display font-bold" style={{ color: "hsl(0 0% 95%)" }}>{formatCurrency(bill.total)}</p>
                  <button
                    onClick={() => handleDeleteTodaySale(bill.id)}
                    className="p-1 rounded hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Chart */}
      <div className="glass-strong rounded-xl p-4 glow-border-gold">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(0 0% 90%)" }}>Weekly Performance</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(0 0% 50%)" }} stroke="hsl(0 0% 20%)" />
            <YAxis tick={{ fontSize: 11, fill: "hsl(0 0% 50%)" }} stroke="hsl(0 0% 20%)" />
            <Tooltip
              contentStyle={{
                background: "hsl(0 0% 10%)",
                border: "1px solid hsl(43 74% 49% / 0.2)",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(0 0% 93%)",
              }}
              formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Sales"]}
            />
            <Bar dataKey="sales" fill="hsl(43 74% 49%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress Ring */}
      <div className="glass-strong rounded-xl p-4 glow-border-gold flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "hsl(0 0% 90%)" }}>Monthly Goal</h3>
          <p className="text-xs" style={{ color: "hsl(0 0% 50%)" }}>₹10,00,000 target</p>
          <p className="text-lg font-display font-bold mt-1" style={{ color: "hsl(0 0% 95%)" }}>{formatCurrency(monthlyTotal)}</p>
        </div>
        <ProgressRing progress={progress} label="Goal" size={100} />
      </div>
    </div>
  );
}

function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <button
      onClick={signOut}
      className="text-xs transition-colors px-3 py-1.5 rounded-md glass glow-border-gold"
      style={{ color: "hsl(0 0% 55%)" }}
    >
      Sign out
    </button>
  );
}
