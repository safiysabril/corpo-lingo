import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Briefcase } from "lucide-react";

export default function Auth() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock auth logic: normally you'd call an API here to authenticate
        localStorage.setItem("corpo_user", "signed_in");
        navigate("/translate");
    };

    return (
        <div className="min-h-screen bg-background grid lg:grid-cols-2">
            {/* Left Side - Brand & Copy */}
            <div className="hidden lg:flex flex-col justify-between p-12 border-r border-border bg-card/30 relative overflow-hidden">
                {/* Subtle grid background */}
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                <div className="relative z-10 flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">
                        Corpo Lingo
                    </span>
                </div>

                <div className="relative z-10 max-w-md">
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
                        Transform your casual thoughts into <span className="gradient-text">corporate gold.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        The ultimate AI assistant for professionals. Securely save your translation history, customize your corporate tone, and never sound unprofessional again.
                    </p>
                    <div className="flex items-center gap-3 text-sm font-medium text-foreground bg-secondary/50 border border-border rounded-lg p-4 w-max shadow-sm">
                        <Briefcase className="w-5 h-5 text-primary" />
                        Trusted by professionals worldwide.
                    </div>
                </div>

                <div className="relative z-10 text-sm text-muted-foreground">
                    © 2026 Corpo Lingo. All rights reserved.
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="flex items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-[400px] flex flex-col gap-6">
                    {/* Mobile Logo */}
                    <div className="flex lg:hidden items-center gap-2.5 mb-2 justify-center">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">
                            Corpo Lingo
                        </span>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-2xl font-bold text-foreground">
                            {isLogin ? "Welcome back" : "Create an account"}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1.5">
                            {isLogin
                                ? "Enter your details to access your account and history."
                                : "Sign up to securely save your corporate translations."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {!isLogin && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="you@company.com"
                                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <Button variant="hero" type="submit" size="lg" className="w-full mt-2 font-semibold">
                            {isLogin ? "Sign In" : "Sign Up"} <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                    </form>

                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground font-medium">Or</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigate('/translate')}
                        className="w-full text-foreground"
                    >
                        Try temporarily as guest
                    </Button>

                    <p className="text-center text-sm text-muted-foreground mt-2">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="font-semibold text-primary hover:underline transition-all"
                        >
                            {isLogin ? "Sign up" : "Sign in"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
