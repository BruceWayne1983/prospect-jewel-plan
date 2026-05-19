import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContext>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

// Demo mode auto-login: enabled only when VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD
// are both set at build time. Leave them unset in production to require a real
// sign-in. Previously these credentials were hard-coded in source — they remain
// in the project's git history, so the demo account password should be rotated
// before relying on this gate.
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;
const DEMO_MODE = Boolean(DEMO_EMAIL && DEMO_PASSWORD);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        setSession(sess);
        setUser(sess?.user ?? null);
      }
    );

    (async () => {
      const { data: { session: existing } } = await supabase.auth.getSession();
      if (existing) {
        setSession(existing);
        setUser(existing.user);
        setLoading(false);
        return;
      }

      if (DEMO_MODE && DEMO_EMAIL && DEMO_PASSWORD) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });
        if (error) {
          console.error("Demo auto-login failed:", error.message);
        } else if (data.session) {
          setSession(data.session);
          setUser(data.user);
        }
      }

      setLoading(false);
    })();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
