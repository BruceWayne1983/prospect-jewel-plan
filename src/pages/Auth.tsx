import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import nominationLogo from "@/assets/nomination-logo.webp";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img src={nominationLogo} alt="Nomination" className="h-10 mx-auto mb-4 opacity-90" />
          <h1 className="text-xl font-display font-semibold text-foreground">Territory Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="card-premium p-6 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emma@emmalouiselux.co.uk"
              className="mt-1.5 bg-background border-border/40 h-10"
              required
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 bg-background border-border/40 h-10"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-10 gold-gradient text-sidebar-background font-medium">
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-gold hover:underline font-medium">
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
