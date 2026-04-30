import { useState, useEffect } from "react";
import { translateText } from "@/api/translateApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Copy, Check, Briefcase, FileText, Award, Sparkles, Moon, Sun } from "lucide-react";

const modes = [
    { value: "email", label: "Email", icon: Briefcase, description: "Professional emails" },
    { value: "documentation", label: "Docs", icon: FileText, description: "Technical writing" },
    { value: "formal", label: "Formal", icon: Award, description: "Official tone" },
];

const degrees = [
    { value: "low", label: "Subtle" },
    { value: "medium", label: "Moderate" },
    { value: "high", label: "Maximum" },
];

export default function Translator() {
    const [text, setText] = useState("");
    const [mode, setMode] = useState("email");
    const [degree, setDegree] = useState("medium");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [dark, setDark] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") === "dark" ||
                (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
        return false;
    });

    useEffect(() => {
        document.documentElement.classList.toggle("dark", dark);
        localStorage.setItem("theme", dark ? "dark" : "light");
    }, [dark]);

    const handleTranslate = async () => {
        if (!text) return;
        try {
            setLoading(true);
            setResult("");
            const data = await translateText({ text, mode, formality: degree });
            setResult(data.data?.translated || "No result");
        } catch (err: any) {
            setResult(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };


    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="w-full border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-foreground">
                            Corpo Lingo
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-muted-foreground hidden sm:block">
                            Transform your words into corporate gold
                        </p>
                        <button
                            onClick={() => setDark((d) => !d)}
                            className="w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Toggle dark mode"
                        >
                            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Hero */}
                <div className="text-center mb-10 sm:mb-14">
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-3">
                        Speak <span className="gradient-text">Corporate</span> Fluently
                    </h1>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                        Paste your casual text and let AI transform it into polished, professional language.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Input Card */}
                    <div className="bg-card rounded-xl border border-border shadow-card p-5 sm:p-6 flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                                Input
                            </h2>
                            <span className="text-xs text-muted-foreground">{text.length} chars</span>
                        </div>

                        <textarea
                            rows={6}
                            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-sans"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type or paste your text here..."
                        />

                        {/* Mode Selection */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                                Mode
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {modes.map((m) => {
                                    const Icon = m.icon;
                                    return (
                                        <button
                                            key={m.value}
                                            onClick={() => setMode(m.value)}
                                            className={cn(
                                                "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-all duration-150",
                                                mode === m.value
                                                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {m.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Degree Selection */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                                Corporate Level
                            </label>
                            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                                {degrees.map((d) => (
                                    <button
                                        key={d.value}
                                        onClick={() => setDegree(d.value)}
                                        className={cn(
                                            "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150",
                                            degree === d.value
                                                ? "bg-card text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            variant="hero"
                            size="lg"
                            onClick={handleTranslate}
                            disabled={loading || !text}
                            className="w-full mt-1"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Translating…
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Translate <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* Output Card */}
                    <div className="bg-card rounded-xl border border-border shadow-card p-5 sm:p-6 flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                                Result
                            </h2>
                            {result && (
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-success" /> Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" /> Copy
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        <div
                            className={cn(
                                "flex-1 min-h-[200px] rounded-lg border border-input bg-background px-4 py-3 text-sm font-sans whitespace-pre-wrap",
                                result ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {result || "Your corporate translation will appear here…"}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/60 py-4">
                <p className="text-center text-xs text-muted-foreground">
                    Corpo Lingo — Making you sound important since 2025
                </p>
            </footer>
        </div>
    );
}