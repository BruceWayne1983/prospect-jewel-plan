import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import nominationLogo from "@/assets/nomination-logo.webp";

export default function Auth() {
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent! Check your inbox.");
        setIsForgot(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
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
            {isForgot ? "Reset your password" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="card-premium p-6 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emmalouisegregory@yahoo.com"
              className="mt-1.5 bg-background border-border/40 h-10"
              required
            />
          </div>
          {!isForgot && (
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
          )}
          <Button type="submit" disabled={loading} className="w-full h-10 gold-gradient text-sidebar-background font-medium">
            {loading ? "Please wait..." : isForgot ? "Send Reset Link" : "Sign In"}
          </Button>
        </form>

        {isForgot ? (
          <p className="text-center text-sm text-muted-foreground">
            <button onClick={() => setIsForgot(false)} className="text-gold hover:underline font-medium">
              Back to sign in
            </button>
          </p>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            <button onClick={() => setIsForgot(true)} className="text-gold hover:underline font-medium">
              Forgot your password?
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
