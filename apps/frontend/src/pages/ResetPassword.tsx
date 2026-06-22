import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "@/api/authApi";
import { toast } from "sonner";
import { ArrowLeft, Zap } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      await resetPassword({ token, password });
      toast.success("Password updated. Please sign in.");
      navigate("/auth", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "This reset link is invalid or has expired.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> Back to sign in
        </Link>

        <div className="bg-card border border-border rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Corpo Lingo</span>
          </div>

          {!token ? (
            <>
              <h1 className="font-serif text-3xl text-foreground leading-tight mb-2">Invalid link</h1>
              <p className="text-sm text-muted-foreground mb-6">
                This password reset link is missing its token. Request a new one.
              </p>
              <Link
                to="/forgot-password"
                className="block w-full text-center px-4 py-3 bg-primary text-primary-foreground rounded-2xl font-medium hover:bg-primary/90 transition-all shadow-glow"
              >
                Request a new link
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-serif text-3xl text-foreground leading-tight mb-2">
                Choose a new password
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Enter a new password for your account. It must be at least 8 characters.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-2xl font-medium hover:bg-primary/90 transition-all shadow-glow disabled:opacity-40"
                >
                  {busy ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
