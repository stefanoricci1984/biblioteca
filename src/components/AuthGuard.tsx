import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<unknown>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      if (!s && !isLoginPage) navigate("/login", { replace: true });
      if (s && isLoginPage) navigate("/", { replace: true });
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s && !isLoginPage) navigate("/login", { replace: true });
      if (s && isLoginPage) navigate("/", { replace: true });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, isLoginPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (!session && !isLoginPage) return null;

  return <>{children}</>;
}
