import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { register, login, googleLogin } from "@/api/authApi";
import { useAuth, AUTH_QUERY_KEY } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Zap } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function Auth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res =
        mode === "signup"
          ? await register({ name, email, password })
          : await login({ email, password });

      if (res.user) queryClient.setQueryData(AUTH_QUERY_KEY, res.user);
      toast.success(mode === "signup" ? "Account created. You're signed in." : "Welcome back.");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = useCallback(
    async (credential: string) => {
      setBusy(true);
      try {
        const res = await googleLogin(credential);
        if (res.user) queryClient.setQueryData(AUTH_QUERY_KEY, res.user);
        toast.success("Signed in with Google.");
        navigate("/", { replace: true });
      } catch (err: any) {
        toast.error(err.message || "Google sign-in failed");
      } finally {
        setBusy(false);
      }
    },
    [navigate, queryClient],
  );

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>

        <div className="bg-card border border-border rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Corpo Lingo</span>
          </div>

          <h1 className="font-serif text-3xl text-foreground leading-tight mb-2">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "signin"
              ? "Sign in to sync your translation history."
              : "Sign up to save your translation history across devices."}
          </p>

          {GOOGLE_ENABLED && (
            <>
              <div className="mb-4 flex justify-center">
                <GoogleSignInButton onCredential={handleGoogle} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@work.com"
              className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Password (min 8 characters)" : "Password"}
              className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-2xl font-medium hover:bg-primary/90 transition-all shadow-glow disabled:opacity-40"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {mode === "signin" && (
            <Link
              to="/forgot-password"
              className="block w-full text-center mt-4 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          )}

          <button
            onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
            className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {mode === "signin" ? "No account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
