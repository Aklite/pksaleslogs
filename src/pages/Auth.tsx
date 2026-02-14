import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill all fields");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");

    setLoading(true);
    const { error } = isLogin ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else if (!isLogin) {
      toast.success("Check your email to confirm your account!");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(180deg, hsl(220 100% 20%), hsl(220 80% 28%))" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold" style={{ color: "hsl(57 100% 91%)" }}>
            Sales<span style={{ color: "hsl(43 74% 52%)" }}>Logs</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(220 40% 70%)" }}>Your Premium Sales Companion</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl p-6" style={{ background: "hsl(0 0% 100% / 0.1)", backdropFilter: "blur(24px)", border: "1px solid hsl(43 74% 52% / 0.2)" }}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 border-0"
            style={{ background: "hsl(0 0% 100% / 0.12)", color: "hsl(57 100% 91%)" }}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 border-0"
            style={{ background: "hsl(0 0% 100% / 0.12)", color: "hsl(57 100% 91%)" }}
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 gradient-gold font-semibold text-base border-0 hover:opacity-90"
            style={{ color: "hsl(220 100% 10%)" }}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full text-center text-sm mt-4 transition-colors"
          style={{ color: "hsl(220 40% 70%)" }}
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
