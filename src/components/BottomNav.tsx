import { LayoutDashboard, Users, ShoppingBag, BarChart3 } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/sales", icon: ShoppingBag, label: "Sales Log" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "hsl(0 0% 7% / 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid hsl(43 74% 49% / 0.1)",
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-200 min-w-[64px] ${
                isActive ? "scale-105" : ""
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? "hsl(43 74% 49%)" : "hsl(0 0% 45%)",
            })}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
