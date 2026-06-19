import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/api/authApi";
import { toast } from "sonner";
import { ArrowLeft, Zap, MailCheck } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
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

          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
                <MailCheck className="w-5 h-5 text-primary" />
              </div>
              <h1 className="font-serif text-2xl text-foreground mb-2">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="text-foreground">{email}</span>, we've sent a
                link to reset your password. The link expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-3xl text-foreground leading-tight mb-2">
                Reset your password
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your email and we'll send you a link to choose a new one.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@work.com"
                  className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-2xl font-medium hover:bg-primary/90 transition-all shadow-glow disabled:opacity-40"
                >
                  {busy ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
