import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { translateText } from "@/api/translateApi";
import { getHistory } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    ArrowRight, Copy, Check, Briefcase, FileText, Award,
    Sparkles, Moon, Sun, Plus, MessageSquare, LogOut,
} from "lucide-react";
import { TRANSLATION_MODES, FORMALITY_LEVELS, type TranslationMode, type FormalityLevel } from "@corpo-lingo/shared";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const modes: Array<{ value: TranslationMode; label: string; icon: typeof Briefcase; description: string }> = [
    { value: TRANSLATION_MODES.EMAIL, label: "Email", icon: Briefcase, description: "Professional emails" },
    { value: TRANSLATION_MODES.DOCUMENTATION, label: "Docs", icon: FileText, description: "Technical writing" },
    { value: TRANSLATION_MODES.FORMAL, label: "Formal", icon: Award, description: "Official tone" },
];

const degrees: Array<{ value: FormalityLevel; label: string }> = [
    { value: FORMALITY_LEVELS.LOW, label: "Subtle" },
    { value: FORMALITY_LEVELS.MEDIUM, label: "Moderate" },
    { value: FORMALITY_LEVELS.HIGH, label: "Maximum" },
];

export default function Translator() {
    const navigate = useNavigate();
    const { data: authUser } = useAuth();
    const logout = useLogout();
    const queryClient = useQueryClient();

    const [text, setText] = useState("");
    const [mode, setMode] = useState<TranslationMode>(TRANSLATION_MODES.EMAIL);
    const [degree, setDegree] = useState<FormalityLevel>(FORMALITY_LEVELS.MEDIUM);
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);

    const [dark, setDark] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") === "dark" ||
                (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
        return false;
    });

    const { data: history = [] } = useQuery({
        queryKey: ["history"],
        queryFn: getHistory,
    });

    const toggleDark = () => {
        setDark((d) => {
            const next = !d;
            document.documentElement.classList.toggle("dark", next);
            localStorage.setItem("theme", next ? "dark" : "light");
            return next;
        });
    };

    const handleNew = () => {
        setCurrentId(null);
        setText("");
        setResult("");
        setMode(TRANSLATION_MODES.EMAIL);
        setDegree(FORMALITY_LEVELS.MEDIUM);
    };

    const loadHistory = (item: (typeof history)[number]) => {
        setCurrentId(item.id);
        setText(item.input);
        setResult(item.output);
        setMode(item.mode);
        setDegree(item.formality);
    };

    const handleTranslate = async () => {
        if (!text) return;
        try {
            setLoading(true);
            setResult("");
            const data = await translateText({ text, mode, formality: degree });
            const translated = data.data?.translated || "No result";
            const id = (data.data as { id?: string })?.id ?? null;
            setResult(translated);
            setCurrentId(id);
            queryClient.invalidateQueries({ queryKey: ["history"] });
        } catch (err) {
            setResult(err instanceof Error ? err.message : "Translation failed");
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

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            {/* Header */}
            <header className="w-full border-b border-border/60 bg-card/80 backdrop-blur-md shrink-0 z-10">
                <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-foreground">Corpo Lingo</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {authUser && (
                            <span className="hidden sm:block text-xs text-muted-foreground">
                                {authUser.name}
                            </span>
                        )}
                        <button
                            onClick={toggleDark}
                            className="w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Toggle dark mode"
                        >
                            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Sign out"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar History */}
                <aside className="w-64 border-r border-border bg-card/50 flex flex-col shrink-0 hidden md:flex">
                    <div className="p-4 border-b border-border/60 flex items-center justify-between">
                        <h2 className="font-semibold text-sm text-foreground">History</h2>
                        <Button size="sm" variant="outline" onClick={handleNew} className="h-8 px-2 gap-1">
                            <Plus className="w-4 h-4" /> New
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                        {history.length === 0 ? (
                            <div className="text-xs text-muted-foreground text-center mt-6">
                                No history yet.
                            </div>
                        ) : (
                            history.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => loadHistory(item)}
                                    className={cn(
                                        "flex flex-col items-start p-3 text-left rounded-lg transition-colors border",
                                        currentId === item.id
                                            ? "bg-primary/10 border-primary/30"
                                            : "bg-background border-transparent hover:border-border hover:bg-card"
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-1 text-foreground">
                                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-xs font-medium truncate w-full">
                                            {item.input.substring(0, 25) || "New translation…"}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                        {new Date(item.createdAt).toLocaleDateString()} • {item.mode}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto w-full px-4 py-8">
                    <div className="max-w-4xl mx-auto flex flex-col">
                        {(!currentId && !text && !result) && (
                            <div className="text-center mb-10 mt-4">
                                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-3">
                                    Speak <span className="gradient-text">Corporate</span> Fluently
                                </h1>
                                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                                    Paste your casual text and let AI transform it into polished, professional language.
                                </p>
                            </div>
                        )}

                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Input Card */}
                            <div className="bg-card rounded-xl border border-border shadow-card p-5 flex flex-col gap-5">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Input</h2>
                                    <span className="text-xs text-muted-foreground">{text.length} chars</span>
                                </div>

                                <textarea
                                    rows={6}
                                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-sans disabled:opacity-70 disabled:cursor-not-allowed"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Type or paste your text here…"
                                    disabled={!!currentId}
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
                                                    disabled={!!currentId}
                                                    className={cn(
                                                        "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
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
                                                disabled={!!currentId}
                                                className={cn(
                                                    "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
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

                                {currentId ? (
                                    <Button variant="outline" size="lg" onClick={handleNew} className="w-full mt-1">
                                        <Plus className="w-4 h-4 mr-2" /> Start New Translation
                                    </Button>
                                ) : (
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
                                )}
                            </div>

                            {/* Output Card */}
                            <div className="bg-card rounded-xl border border-border shadow-card p-5 flex flex-col gap-5">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Result</h2>
                                    {result && (
                                        <button
                                            onClick={handleCopy}
                                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {copied ? (
                                                <><Check className="w-3.5 h-3.5 text-success" /> Copied</>
                                            ) : (
                                                <><Copy className="w-3.5 h-3.5" /> Copy</>
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
                    </div>
                </main>
            </div>
        </div>
    );
}
