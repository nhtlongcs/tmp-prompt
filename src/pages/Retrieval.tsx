import { useEffect, useMemo, useRef, useState } from "react";
import { CANDIDATES, fmt, gapLabel, spanOf, type Candidate } from "@/data/retrieval";
import { QueryStrip } from "@/components/retrieval/QueryStrip";
import { CompactRow, ResultRow } from "@/components/retrieval/ResultRow";
import { MatrixView } from "@/components/retrieval/MatrixView";
import { DetailDrawer } from "@/components/retrieval/DetailDrawer";

type Density = "comfortable" | "compact" | "matrix";

const KEYS = [
  ["↑ ↓", "candidate"],
  ["1 2 3", "query event"],
  ["[ ]", "event"],
  ["J K L", "playback"],
  ["⏎", "expand"],
  ["esc", "collapse"],
  ["C", "compare"],
  ["G", "group"],
];

export default function Retrieval() {
  const [density, setDensity] = useState<Density>("comfortable");
  const [group, setGroup] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [minScore, setMinScore] = useState(0.6);
  const [channel, setChannel] = useState("all");
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => CANDIDATES.filter((c) => c.score >= minScore && (channel === "all" || c.video.channel === channel)),
    [minScore, channel],
  );
  const ordered = useMemo(() => {
    if (!group) return filtered;
    const byVideo = new Map<string, Candidate[]>();
    filtered.forEach((c) => byVideo.set(c.video.file, [...(byVideo.get(c.video.file) ?? []), c]));
    return [...byVideo.values()].sort((a, b) => b[0].score - a[0].score).flat();
  }, [filtered, group]);

  const current = ordered[Math.min(cursor, ordered.length - 1)];
  const open = openId ? ordered.find((c) => c.id === openId) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const k = e.key.toLowerCase();
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(ordered.length - 1, c + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
      else if (["1", "2", "3"].includes(e.key)) setActiveSlot(Number(e.key) - 1);
      else if (e.key === "0") setActiveSlot(null);
      else if (e.key === "[") setActiveSlot((s) => Math.max(0, (s ?? 0) - 1));
      else if (e.key === "]") setActiveSlot((s) => Math.min(2, (s ?? 0) + 1));
      else if (e.key === "Enter") setOpenId(current?.id ?? null);
      else if (e.key === "Escape") { setOpenId(null); setActiveSlot(null); }
      else if (k === "c") setDensity((d) => (d === "matrix" ? "comfortable" : "matrix"));
      else if (k === "g") setGroup((g) => !g);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ordered.length, current?.id]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-cursor="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <div className="workspace dark flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <QueryStrip />

      {/* controls */}
      <div className="flex items-center gap-3 border-b border-border bg-background px-3 py-[4px] font-mono text-[11px]">
        <span className="text-muted-foreground">
          {ordered.length} sequences · {new Set(ordered.map((c) => c.video.file)).size} videos
        </span>
        <label className="flex items-center gap-1 text-muted-foreground">
          min score
          <input
            type="range" min={0.6} max={0.95} step={0.01}
            value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}
            className="h-[3px] w-[70px] accent-primary"
          />
          <span className="text-foreground/80">{minScore.toFixed(2)}</span>
        </label>
        <div className="flex items-center gap-1">
          {["all", "CNN", "BBC", "RTR", "SKY"].map((ch) => (
            <button
              key={ch}
              onClick={() => setChannel(ch)}
              className={`rounded-[2px] border px-[5px] leading-[16px] ${
                channel === ch ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
        <button
          onClick={() => setGroup((g) => !g)}
          className={`rounded-[2px] border px-[5px] leading-[16px] ${
            group ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          group by video (G)
        </button>
        <div className="ml-auto flex overflow-hidden rounded-[3px] border border-border">
          {(["comfortable", "compact", "matrix"] as Density[]).map((d) => (
            <button
              key={d}
              onClick={() => setDensity(d)}
              className={`px-2 leading-[18px] ${density === d ? "bg-accent text-foreground" : "text-muted-foreground"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* column header keeps event columns aligned */}
      {density === "comfortable" && (
        <div className="flex items-center border-b border-border bg-panel px-3 py-[2px] font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="w-[124px] shrink-0">rank / source</span>
          <span className="w-[124px] shrink-0">E1 enter building</span>
          <span className="w-[96px] shrink-0 text-center">gap</span>
          <span className="w-[124px] shrink-0">E2 talk reporters ★</span>
          <span className="w-[96px] shrink-0 text-center">gap</span>
          <span className="w-[124px] shrink-0">E3 enter car</span>
          <span className="ml-auto w-[330px] shrink-0 pl-3">difference vs #1 / per-event evidence</span>
        </div>
      )}

      <div ref={listRef} className="min-h-0 flex-1 overflow-auto">
        {density === "matrix" ? (
          <MatrixView
            candidates={ordered}
            selectedId={current?.id ?? ""}
            onSelect={(id) => setCursor(ordered.findIndex((c) => c.id === id))}
            onOpen={(id) => setOpenId(id)}
          />
        ) : (
          ordered.map((c, i) => {
            const groupHead = group && (i === 0 || ordered[i - 1].video.file !== c.video.file);
            const matches = ordered.filter((x) => x.video.file === c.video.file);
            return (
              <div key={c.id} data-cursor={i === cursor}>
                {groupHead && (
                  <div className="flex items-center gap-2 border-b border-border bg-panel px-3 py-[2px] font-mono text-[10px] text-foreground/80">
                    <span>{c.video.file}</span>
                    <span className="text-muted-foreground">
                      {matches.length} matches · {fmt(c.video.duration)}
                    </span>
                    <span className="ml-2 flex-1">
                      <span className="relative block h-[7px]">
                        <span className="absolute top-[3px] h-px w-full bg-border" />
                        {matches.flatMap((m) =>
                          m.events.map((e) => (
                            <span
                              key={m.id + e.slot}
                              className="absolute top-[1px] h-[5px] w-[4px] rounded-full bg-primary/80"
                              style={{ left: `${(e.start / c.video.duration) * 100}%` }}
                            />
                          )),
                        )}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      best {Math.round(Math.max(...matches.map((m) => m.score)) * 100)}%
                    </span>
                  </div>
                )}
                {density === "comfortable" ? (
                  <ResultRow
                    c={c}
                    selected={i === cursor}
                    activeSlot={activeSlot}
                    onSelect={() => setCursor(i)}
                    onOpen={() => setOpenId(c.id)}
                  />
                ) : (
                  <CompactRow c={c} selected={i === cursor} onSelect={() => setCursor(i)} onOpen={() => setOpenId(c.id)} />
                )}
              </div>
            );
          })
        )}
      </div>

      {open && <DetailDrawer c={open} activeSlot={activeSlot} onClose={() => setOpenId(null)} />}

      <footer className="flex items-center gap-3 border-t border-border bg-panel px-3 py-[2px] font-mono text-[10px] text-muted-foreground">
        {KEYS.map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <kbd className="rounded-[2px] border border-border bg-background px-[3px] text-foreground/80">{k}</kbd>
            {v}
          </span>
        ))}
        <span className="ml-auto">
          {current ? `#${current.rank} ${current.video.file} · span ${gapLabel(spanOf(current))}` : "—"}
        </span>
      </footer>
    </div>
  );
}
