import { ReactNode } from "react";
import BottomNav from "./BottomNav";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-lg mx-auto px-4 pt-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
