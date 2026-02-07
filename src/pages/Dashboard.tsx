import { useEffect, useState } from "react";
import { IndianRupee, TrendingUp, Coins } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import BentoCard from "@/components/BentoCard";
import ProgressRing from "@/components/ProgressRing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const MONTHLY_GOAL = 1000000; // 10 Lakh

export default function Dashboard() {
  const { user } = useAuth();
  const [todaySales, setTodaySales] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [tipsEarned, setTipsEarned] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{ day: string; sales: number }[]>([]);

  useEffect(() => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekStart = monday.toISOString().split("T")[0];

    const fetchData = async () => {
      // Today's sales
      const { data: todayData } = await supabase
        .from("sales")
        .select("total")
        .eq("user_id", user.id)
        .eq("sale_date", today);
      setTodaySales(todayData?.reduce((s, r) => s + Number(r.total), 0) || 0);

      // Monthly total
      const { data: monthData } = await supabase
        .from("sales")
        .select("total, tips")
        .eq("user_id", user.id)
        .gte("sale_date", startOfMonth);
      setMonthlyTotal(monthData?.reduce((s, r) => s + Number(r.total), 0) || 0);
      setTipsEarned(monthData?.reduce((s, r) => s + Number(r.tips), 0) || 0);

      // Weekly data
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
    };

    fetchData();
  }, [user]);

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const progress = Math.min((monthlyTotal / MONTHLY_GOAL) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Your sales at a glance</p>
        </div>
        <LogoutButton />
      </div>

      {/* Bento Cards */}
      <div className="grid grid-cols-2 gap-3">
        <BentoCard title="Today" value={formatCurrency(todaySales)} icon={<IndianRupee className="h-3.5 w-3.5" />} variant="emerald" />
        <BentoCard title="This Month" value={formatCurrency(monthlyTotal)} icon={<TrendingUp className="h-3.5 w-3.5" />} variant="gold" />
        <div className="col-span-2">
          <BentoCard title="Tips Earned" value={formatCurrency(tipsEarned)} icon={<Coins className="h-3.5 w-3.5" />} />
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-luxury">
        <h3 className="text-sm font-semibold mb-3">Weekly Performance</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Sales"]}
            />
            <Bar dataKey="sales" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress Ring */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-luxury flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Monthly Goal</h3>
          <p className="text-xs text-muted-foreground">₹10,00,000 target</p>
          <p className="text-lg font-display font-bold mt-1">{formatCurrency(monthlyTotal)}</p>
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
      className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border"
    >
      Sign out
    </button>
  );
}
