import { useState } from "react";
import { QUERY_GRAPH, QUERY_TEXT, RAW_QUERY } from "@/data/retrieval";

export function QueryStrip() {
  const [mode, setMode] = useState<"visual" | "raw">("visual");
  const [query, setQuery] = useState(QUERY_TEXT);

  return (
    <header className="border-b border-border bg-panel">
      <div className="flex items-center gap-2 px-3 py-[6px]">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">retrieve</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-[26px] flex-1 rounded-[3px] border border-border bg-background px-2 text-[13px] outline-none focus:border-primary"
          aria-label="Natural language query"
        />
        <span className="font-mono text-[10px] text-muted-foreground">4 videos · 1,284 events · 41ms</span>
        <div className="flex overflow-hidden rounded-[3px] border border-border font-mono text-[10px]">
          {(["visual", "raw"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-[3px] ${mode === m ? "bg-accent text-foreground" : "text-muted-foreground"}`}
            >
              {m === "visual" ? "Visual Query" : "Raw Query"}
            </button>
          ))}
        </div>
      </div>

      {mode === "visual" ? (
        <div className="px-3 pb-[6px]">
          <div className="flex items-center gap-[6px]">
            {QUERY_GRAPH.events.map((e, i) => (
              <div key={e.slot} className="flex items-center gap-[6px]">
                {i > 0 && (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                    <span className="text-border">→</span>≤
                    {Math.round(QUERY_GRAPH.links[i - 1].max / 60)}m
                    <span className="text-border">→</span>
                  </span>
                )}
                <button
                  className={`flex items-center gap-[5px] rounded-[3px] border px-[6px] py-[2px] text-[12px] ${
                    e.required ? "border-primary/70 bg-primary/10" : "border-border bg-background"
                  }`}
                >
                  <span className="font-mono text-[10px] text-primary">{e.slot}</span>
                  {e.label}
                  {e.required && <span className="text-primary">★</span>}
                  <span className="font-mono text-[9px] text-muted-foreground">w{e.weight.toFixed(1)}</span>
                </button>
              </div>
            ))}
            <span className="ml-1 font-mono text-[10px] text-muted-foreground">SEQ · strict order</span>
          </div>
          <div className="mt-[4px] flex flex-wrap items-center gap-1">
            {QUERY_GRAPH.constraints.map((c) => (
              <span
                key={c.key + c.value}
                className={`rounded-[2px] border px-[5px] font-mono text-[10px] leading-[16px] ${
                  c.hard
                    ? "border-foreground/35 bg-accent text-foreground"
                    : "border-dashed border-border text-muted-foreground"
                }`}
                title={c.hard ? "hard constraint" : "soft constraint"}
              >
                {c.key}:{c.value}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <pre className="mx-3 mb-[6px] max-h-[86px] overflow-auto rounded-[3px] border border-border bg-background p-2 font-mono text-[10px] leading-[13px] text-muted-foreground">
          {RAW_QUERY}
        </pre>
      )}
    </header>
  );
}
