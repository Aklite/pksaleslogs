import { ReactNode } from "react";
import { motion } from "framer-motion";

interface BentoCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  variant?: "emerald" | "gold" | "default";
}

export default function BentoCard({ title, value, icon, variant = "default" }: BentoCardProps) {
  const bg = variant === "emerald"
    ? "gradient-emerald text-primary-foreground"
    : variant === "gold"
    ? "gradient-gold text-emerald-dark"
    : "bg-card border border-border";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl p-4 ${bg} shadow-luxury`}
    >
      <div className="flex items-center gap-2 mb-1 opacity-80 text-xs font-medium uppercase tracking-wider">
        {icon}
        {title}
      </div>
      <div className="text-2xl font-display font-bold">{value}</div>
    </motion.div>
  );
}
