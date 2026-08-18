import { QUERY_GRAPH, fmt, type Candidate } from "@/data/retrieval";
import { ModalityBadges } from "./Badges";
import { KeyframeCell } from "./KeyframeCell";

export function MatrixView({
  candidates,
  selectedId,
  onSelect,
  onOpen,
}: {
  candidates: Candidate[];
  selectedId: string;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="min-w-[900px]">
      <div className="sticky top-0 z-10 flex border-b border-border bg-panel px-3 py-[3px] font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="w-[96px] shrink-0">cand</span>
        {QUERY_GRAPH.events.map((e) => (
          <span key={e.slot} className="w-[150px] shrink-0">
            {e.slot} {e.label}
          </span>
        ))}
        <span className="ml-auto w-[150px] shrink-0">delta vs #1</span>
      </div>
      {candidates.map((c) => (
        <div
          key={c.id}
          onMouseEnter={() => onSelect(c.id)}
          onClick={() => onOpen(c.id)}
          className={`flex cursor-pointer items-start border-b border-border/70 px-3 py-[6px] ${
            selectedId === c.id ? "bg-accent/60 shadow-[inset_2px_0_0_0_hsl(var(--primary))]" : "hover:bg-accent/25"
          }`}
        >
          <div className="w-[96px] shrink-0 pr-2">
            <div className="font-mono text-[12px]">
              <span className="text-muted-foreground">#{c.rank} </span>
              <span className={c.score >= 0.9 ? "text-ok" : c.score >= 0.8 ? "text-warn" : "text-bad"}>
                {Math.round(c.score * 100)}%
              </span>
            </div>
            <div className="truncate font-mono text-[10px] text-muted-foreground" title={c.video.file}>
              {c.video.channel} {fmt(c.events[0].start)}
            </div>
          </div>
          {c.events.map((e) => (
            <div key={e.slot} className="w-[150px] shrink-0 pr-2">
              <KeyframeCell ev={e} w={132} h={66} onOpen={() => onOpen(c.id)} />
              {e.flag && (
                <div className={`mt-[2px] text-[10px] ${e.flag.kind === "bad" ? "text-bad" : "text-warn"}`}>
                  ↑ {e.flag.text}
                </div>
              )}
            </div>
          ))}
          <div className="ml-auto w-[150px] shrink-0">
            <div className="text-[11px] leading-[14px] text-muted-foreground">{c.diff}</div>
            <div className="mt-1 space-y-[2px]">
              {c.events.map((e) => (
                <div key={e.slot} className="flex items-center gap-1">
                  <span className="font-mono text-[9px] text-muted-foreground">{e.slot}</span>
                  <ModalityBadges ev={e} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
