import { useState } from "react";
import { GitBranch, Trash2, ChevronDown, ChevronRight } from "lucide-react";

export type HistoryEntry = {
  id: string;
  input: string;
  output: string;
  mode: string;
  degree: string;
  timestamp: number;
};

type Props = {
  entries: HistoryEntry[];
  onSelectEntry: (entry: HistoryEntry) => void;
  onDeleteEntry: (entryId: string) => void;
};

export default function History({ entries, onSelectEntry, onDeleteEntry }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground uppercase tracking-wide hover:text-primary transition-colors"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <GitBranch className="w-4 h-4" />
          History
          <span className="text-xs font-normal text-muted-foreground normal-case tracking-normal">
            ({entries.length} {entries.length === 1 ? "entry" : "entries"})
          </span>
        </button>
      </div>

      {expanded &&
        (entries.length > 0 ? (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="group rounded-lg border border-border bg-background p-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => onSelectEntry(entry)} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {entry.mode}
                      </span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{entry.degree}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground truncate">{entry.input}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">→ {entry.output}</p>
                  </button>
                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">
            No translations yet. Translate something to add it here.
          </p>
        ))}
    </div>
  );
}
