import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Mail } from "lucide-react";
import { forgotPassword } from "@/api/authApi";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await forgotPassword({ email });
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

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
                        Forgot your password?{" "}
                        <span className="gradient-text">No problem.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Enter your email and we'll send you a link to reset your password.
                        It expires in 1 hour.
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

                    {submitted ? (
                        <div className="flex flex-col gap-4 text-center">
                            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Check your inbox</h2>
                                <p className="text-sm text-muted-foreground mt-1.5">
                                    If an account exists for{" "}
                                    <span className="font-medium text-foreground">{email}</span>,
                                    you'll receive a reset link shortly.
                                </p>
                            </div>
                            <Link
                                to="/auth"
                                className="flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center lg:text-left">
                                <h2 className="text-2xl font-bold text-foreground">Reset your password</h2>
                                <p className="text-sm text-muted-foreground mt-1.5">
                                    Enter the email address associated with your account.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="you@company.com"
                                        value={email}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            setEmail(e.target.value);
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
                                            Sending…
                                        </span>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>
                            </form>

                            <p className="text-center text-sm text-muted-foreground">
                                Remember your password?{" "}
                                <Link to="/auth" className="font-semibold text-primary hover:underline transition-all">
                                    Sign in
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
