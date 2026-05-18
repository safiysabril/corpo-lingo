import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import { resetPassword } from "@/api/authApi";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await resetPassword({ token, password });
            setDone(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="w-full max-w-[400px] flex flex-col gap-4 text-center">
                    <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                        Invalid reset link. Please request a new one.
                    </p>
                    <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                        Request new link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background grid lg:grid-cols-2">
            {/* Left Side - Brand */}
            <div className="hidden lg:flex flex-col justify-between p-12 border-r border-border bg-card/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="relative z-10 flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">Corpo Lingo</span>
                </div>
                <div className="relative z-10 max-w-md">
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
                        Choose a{" "}
                        <span className="gradient-text">new password.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Make it strong — at least 8 characters. You'll be back in business in no time.
                    </p>
                </div>
                <div className="relative z-10 text-sm text-muted-foreground">
                    © 2026 Corpo Lingo. All rights reserved.
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-[400px] flex flex-col gap-6">
                    {/* Mobile Logo */}
                    <div className="flex lg:hidden items-center gap-2.5 mb-2 justify-center">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">Corpo Lingo</span>
                    </div>

                    {done ? (
                        <div className="flex flex-col gap-4 text-center">
                            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                                <CheckCircle className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Password updated!</h2>
                                <p className="text-sm text-muted-foreground mt-1.5">
                                    Your password has been reset. You can now sign in with your new password.
                                </p>
                            </div>
                            <Button
                                variant="hero"
                                size="lg"
                                className="w-full font-semibold"
                                onClick={() => navigate("/auth")}
                            >
                                Sign In
                                <ArrowRight className="w-4 h-4 ml-1.5" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center lg:text-left">
                                <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
                                <p className="text-sm text-muted-foreground mt-1.5">
                                    Choose a strong password of at least 8 characters.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            setPassword(e.target.value);
                                            setError("");
                                        }}
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        placeholder="••••••••"
                                        value={confirm}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            setConfirm(e.target.value);
                                            setError("");
                                        }}
                                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                                        {error}
                                    </p>
                                )}

                                <Button
                                    variant="hero"
                                    type="submit"
                                    size="lg"
                                    className="w-full mt-2 font-semibold"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            Updating…
                                        </span>
                                    ) : (
                                        <>
                                            Update Password
                                            <ArrowRight className="w-4 h-4 ml-1.5" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            <p className="text-center text-sm text-muted-foreground">
                                Didn't request this?{" "}
                                <Link to="/auth" className="font-semibold text-primary hover:underline transition-all">
                                    Sign in instead
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
