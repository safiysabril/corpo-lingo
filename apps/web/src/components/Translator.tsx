import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { translateText } from "../api/translateApi";
import { getHistory, deleteHistoryItem } from "../api/authApi";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Copy,
  Check,
  Mail,
  FileText,
  Award,
  Zap,
  Quote,
  Lock,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import History, { type HistoryEntry } from "./History";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { TranslationMode, FormalityLevel, TranslationHistoryItem } from "@corpo-lingo/shared";

const modes: { value: TranslationMode; label: string; icon: typeof Mail }[] = [
  { value: "email", label: "Email", icon: Mail },
  { value: "documentation", label: "Docs", icon: FileText },
  { value: "formal", label: "Formal", icon: Award },
];

const degrees: { value: FormalityLevel; label: string }[] = [
  { value: "low", label: "Subtle" },
  { value: "medium", label: "Moderate" },
  { value: "high", label: "Maximum" },
];

const QUOTES: { text: string; author: string }[] = [
  { text: "Efficiency is doing things right; effectiveness is doing the right things.", author: "Peter Drucker" },
  { text: "Clarity of language is clarity of thought.", author: "Internal Comms Archive" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Whether you think you can, or you think you can't — you're right.", author: "Henry Ford" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Great things in business are never done by one person.", author: "Steve Jobs" },
  { text: "If you don't like change, you'll like irrelevance even less.", author: "Eric Shinseki" },
];

export default function Translator() {
  const { user, loading: authLoading } = useAuth();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [mode, setMode] = useState<TranslationMode>("email");
  const [degree, setDegree] = useState<FormalityLevel>("medium");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  // Real translation history (flat list, last 50) — only when signed in.
  const { data: historyItems = [] } = useQuery({
    queryKey: ["history"],
    queryFn: getHistory,
    enabled: !!user,
  });

  const entries: HistoryEntry[] = historyItems.map((item: TranslationHistoryItem) => ({
    id: item.id,
    input: item.input,
    output: item.output,
    mode: item.mode,
    degree: item.formality,
    timestamp: new Date(item.createdAt).getTime(),
  }));

  const totalTranslations = entries.length;

  const handleTranslate = async () => {
    if (!text) return;
    try {
      setLoading(true);
      setResult("");
      const data = await translateText({ text, mode, formality: degree });
      const translated = data.data?.translated || "No result";
      setResult(translated);
      // The backend auto-saves to history when authenticated — just refetch.
      if (user) queryClient.invalidateQueries({ queryKey: ["history"] });
    } catch (err: any) {
      setResult(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectEntry = (entry: HistoryEntry) => {
    setText(entry.input);
    setMode(entry.mode as TranslationMode);
    setDegree(entry.degree as FormalityLevel);
    setResult(entry.output);
  };

  const deleteEntry = async (entryId: string) => {
    try {
      await deleteHistoryItem(entryId);
      queryClient.invalidateQueries({ queryKey: ["history"] });
    } catch {
      toast.error("Couldn't delete entry");
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await logout();
    toast.success("Signed out");
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-4 md:p-8 lg:p-5 lg:h-screen lg:min-h-screen lg:overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4 md:gap-5 lg:gap-3 lg:h-full lg:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] lg:content-stretch">
        {/* Brand tile */}
        <section className="col-span-12 lg:col-span-4 bg-card border border-border rounded-3xl p-7 lg:p-5 flex flex-col justify-between lg:row-start-1">
          <div>
            <div className="flex items-center justify-between mb-6 lg:mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-foreground font-semibold text-lg tracking-tight">Corpo Lingo</span>
              </div>
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                >
                  <UserIcon className="w-3 h-3" /> Sign in
                </Link>
              )}
            </div>
            <h1 className="font-serif text-4xl lg:text-3xl text-foreground leading-tight">
              Speak <span className="italic text-primary">Corporate</span> Fluently
            </h1>
            <p className="text-sm text-muted-foreground mt-3 lg:mt-2 max-w-xs">
              A quiet daily tool for transforming raw thoughts into polished, professional language.
            </p>
          </div>
          <div className="mt-8 lg:mt-3 flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <div className="h-1.5 w-8 rounded-full bg-primary" />
              <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
              <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {user ? user.email?.split("@")[0] : "v2.0"}
            </span>
          </div>
        </section>

        {/* Motivational quote tile */}
        <section className="col-span-12 lg:col-span-8 bg-card border border-border rounded-3xl p-7 lg:px-6 lg:py-4 flex items-center relative overflow-hidden lg:row-start-1">
          <Quote className="absolute -top-2 -left-2 w-24 h-24 lg:w-16 lg:h-16 text-primary/5" />
          <div className="max-w-2xl relative">
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold mb-3 lg:mb-1 block">
              Daily Insight
            </span>
            <p className="font-serif text-2xl md:text-[26px] lg:text-lg text-foreground/90 italic leading-relaxed lg:leading-snug line-clamp-2">
              “{quote.text}”
            </p>
            <p className="text-xs text-muted-foreground mt-3 lg:mt-1">— {quote.author}</p>
          </div>
        </section>

        {/* Input workspace */}
        <section className="col-span-12 md:col-span-6 bg-card border border-border rounded-3xl p-6 lg:p-4 flex flex-col min-h-[400px] lg:min-h-0 lg:row-start-2 lg:h-full lg:overflow-hidden">
          <div className="flex justify-between items-center mb-5 lg:mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/60" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Drafting Input
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground/70">{text.length} / 2000</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            placeholder="Paste your casual text here and let the AI find the synergy…"
            className="flex-1 min-h-0 bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none text-lg lg:text-base leading-relaxed"
          />
          <div className="mt-4 pt-4 lg:mt-2 lg:pt-2 border-t border-border flex justify-end">
            <button
              onClick={handleTranslate}
              disabled={loading || !text}
              className="px-7 py-3 lg:px-5 lg:py-2 bg-primary text-primary-foreground rounded-2xl font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-glow active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Translating…
                </>
              ) : (
                <>
                  Translate <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </section>

        {/* Result workspace */}
        <section className="col-span-12 md:col-span-6 bg-secondary/40 border-2 border-primary/30 rounded-3xl p-6 lg:p-4 flex flex-col min-h-[400px] lg:min-h-0 lg:row-start-2 lg:h-full lg:overflow-hidden relative">
          <div className="absolute top-4 right-4 lg:top-3 lg:right-3">
            <button
              onClick={handleCopy}
              disabled={!result}
              className="p-2 lg:p-1.5 text-muted-foreground hover:text-foreground transition-colors bg-card rounded-xl border border-border disabled:opacity-40"
              aria-label="Copy result"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2 mb-5 lg:mb-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                result ? "bg-success shadow-[0_0_8px_hsl(var(--success)/0.6)]" : "bg-muted-foreground/40"
              )}
            />
            <span className="text-[10px] uppercase tracking-widest font-bold text-success">
              Corporate Output
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <p
              className={cn(
                "font-serif text-2xl lg:text-lg leading-[1.55] whitespace-pre-wrap",
                result ? "text-foreground" : "text-muted-foreground/70 italic"
              )}
            >
              {result ||
                "Your corporate translation will manifest here once you press translate. Take a breath — the right words are coming."}
            </p>
          </div>
          <div className="mt-4 pt-4 lg:mt-2 lg:pt-2 border-t border-border/60 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              {modes.find((m) => m.value === mode)?.label} · {degrees.find((d) => d.value === degree)?.label}
            </span>
            <span
              className={cn(
                "text-[10px] px-2 py-1 rounded-md font-medium uppercase tracking-wide border",
                result
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-muted/30 text-muted-foreground border-border"
              )}
            >
              {result ? "Ready" : "Idle"}
            </span>
          </div>
        </section>

        {/* Controls tile */}
        <section className="col-span-12 lg:col-span-4 bg-card border border-border rounded-3xl p-6 lg:p-4 flex flex-col gap-6 lg:gap-3 lg:row-start-3 lg:h-full lg:overflow-hidden">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4 lg:mb-2 block">
              Context Mode
            </span>
            <div className="grid grid-cols-3 gap-2">
              {modes.map((m) => {
                const Icon = m.icon;
                const active = mode === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 lg:p-2 rounded-xl transition-all border",
                      active
                        ? "bg-secondary text-foreground border-primary/40 shadow-md"
                        : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 lg:pt-3 border-t border-border">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4 lg:mb-2 block">
              Intensity Level
            </span>
            <div className="flex bg-background rounded-xl p-1 gap-1">
              {degrees.map((d) => {
                const active = degree === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setDegree(d.value)}
                    className={cn(
                      "flex-1 py-2 text-[11px] rounded-lg transition-colors",
                      active
                        ? "text-foreground bg-secondary border border-primary/20 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 lg:pt-3 border-t border-border flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              Saved
            </span>
            <span className="font-serif text-2xl lg:text-xl text-primary">{user ? totalTranslations : "—"}</span>
          </div>
        </section>

        {/* History tile — gated */}
        <section className="col-span-12 lg:col-span-8 bg-card border border-border rounded-3xl p-6 lg:p-4 relative lg:row-start-3 lg:h-full lg:overflow-auto">
          {authLoading ? (
            <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">
              Loading…
            </div>
          ) : user ? (
            <History entries={entries} onSelectEntry={selectEntry} onDeleteEntry={deleteEntry} />
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12 px-6">
              <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-2xl text-foreground mb-2">History is private</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-5">
                Sign in to save your translations and access them across sessions.
              </p>
              <Link
                to="/auth"
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl text-sm font-medium hover:bg-primary/90 transition-all shadow-glow"
              >
                Sign in to view history
              </Link>
            </div>
          )}
        </section>

        {/* Footer strip */}
        <footer className="col-span-12 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground/70 px-2 pt-2 lg:pt-0 lg:row-start-4">
          <span>Corpo Lingo</span>
          <span>Making you sound important since 2025</span>
        </footer>
      </div>
    </div>
  );
}
