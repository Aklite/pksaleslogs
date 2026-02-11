import { ReactNode } from "react";

interface BentoCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  variant?: "emerald" | "gold" | "default";
}

export default function BentoCard({ title, value, icon, variant = "default" }: BentoCardProps) {
  const isEmerald = variant === "emerald";
  const isGold = variant === "gold";

  return (
    <div
      className={`rounded-xl p-4 ${
        isEmerald
          ? "gradient-emerald"
          : isGold
          ? "gradient-gold"
          : "glass-strong glow-border-gold"
      }`}
      style={{
        color: isEmerald || isGold ? "hsl(0 0% 7%)" : "hsl(0 0% 93%)",
      }}
    >
      <div className="flex items-center gap-2 mb-1 opacity-80 text-xs font-medium uppercase tracking-wider">
        {icon}
        {title}
      </div>
      <div className="text-2xl font-display font-bold">{value}</div>
    </div>
  );
}
