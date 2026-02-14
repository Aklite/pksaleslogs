import { ReactNode } from "react";

interface BentoCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  variant?: "emerald" | "gold" | "royal" | "default";
}

export default function BentoCard({ title, value, icon, variant = "default" }: BentoCardProps) {
  const isRoyal = variant === "royal";
  const isGold = variant === "gold";

  return (
    <div
      className={`rounded-xl p-4 ${
        isRoyal
          ? "gradient-royal shadow-royal"
          : isGold
          ? "gradient-gold shadow-gold"
          : "glass-strong glow-border-gold"
      }`}
      style={{
        color: isRoyal ? "hsl(57 100% 91%)" : isGold ? "hsl(220 100% 10%)" : "hsl(220 60% 15%)",
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
