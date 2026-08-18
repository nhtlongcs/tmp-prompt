import { useState } from "react";
import { fmt, gapLabel, gapsOf, spanOf, type Candidate } from "@/data/retrieval";
import { ScoreBar } from "./Badges";

const lane = "relative h-[10px] rounded-[2px] bg-accent";

export function DetailDrawer({
  c,
  activeSlot,
  onClose,
}: {
  c: Candidate;
  activeSlot: number | null;
  onClose: () => void;
}) {
  const [slot, setSlot] = useState(activeSlot ?? 0);
  const ev = c.events[Math.min(slot, c.events.length - 1)];
  const t0 = c.events[0].start - 20;
  const t1 = c.events[2].start + c.events[2].duration + 20;
  const pct = (t: number) => ((t - t0) / (t1 - t0)) * 100;

  return (
    <section className="flex h-[286px] shrink-0 border-t border-border bg-panel">
      {/* player */}
      <div className="w-[404px] shrink-0 border-r border-border p-2">
        <div className="relative h-[188px] w-full overflow-hidden rounded-[3px] border border-border bg-black">
          <img src={ev.keyframe} alt={ev.caption} className="h-full w-full object-cover" />
          {ev.objects.map((o) => (
            <span
              key={o.label}
              className="pointer-events-none absolute rounded-[1px] border border-primary/80"
              style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, height: `${o.h}%` }}
            >
              <span className="absolute -top-[11px] left-0 bg-primary/90 px-[2px] font-mono text-[8px] leading-[11px] text-primary-foreground">
                {o.label}
              </span>
            </span>
          ))}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-background/80 px-2 py-[3px] font-mono text-[10px]">
            <span className="text-primary">▶</span>
            <span>
              {fmt(ev.start)} / {fmt(c.video.duration)}
            </span>
            <span className="text-muted-foreground">J K L · [ ] event</span>
          </div>
        </div>
        <div className="mt-[6px] flex items-center gap-1">
          {c.events.map((e, i) => (
            <button
              key={e.slot}
              onClick={() => setSlot(i)}
              className={`rounded-[3px] border px-[6px] py-[2px] font-mono text-[10px] ${
                i === slot ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {e.slot} {fmt(e.start)} +{e.duration}s
            </button>
          ))}
          <button onClick={onClose} className="ml-auto font-mono text-[10px] text-muted-foreground hover:text-foreground">
            esc close
          </button>
        </div>
        <div className="mt-[6px] text-[11px] leading-[14px] text-foreground/85">{ev.captionFull}</div>
      </div>

      {/* evidence lanes */}
      <div className="min-w-0 flex-1 overflow-auto p-2">
        <div className="mb-1 flex items-baseline gap-3 font-mono text-[10px] text-muted-foreground">
          <span className="text-foreground/85">{c.video.file}</span>
          <span>span {gapLabel(spanOf(c))}</span>
          <span>
            gaps {gapsOf(c).map((g) => gapLabel(g)).join(" / ")}
          </span>
          <span>overall {Math.round(c.score * 100)}%</span>
        </div>

        <LaneLabel>EVENTS</LaneLabel>
        <div className={lane}>
          {c.events.map((e, i) => (
            <span
              key={e.slot}
              onClick={() => setSlot(i)}
              className={`absolute top-0 h-[10px] cursor-pointer rounded-[2px] ${
                i === slot ? "bg-primary" : "bg-primary/45"
              }`}
              style={{ left: `${pct(e.start)}%`, width: `${Math.max(1.4, pct(e.start + e.duration) - pct(e.start))}%` }}
              title={`${e.slot} ${fmt(e.start)}`}
            />
          ))}
        </div>
        <TickRow t0={t0} t1={t1} />

        <LaneLabel>ASR</LaneLabel>
        <div className={lane}>
          {c.events.filter((e) => e.asr).map((e) => (
            <span
              key={e.slot}
              className="absolute top-0 h-[10px] rounded-[2px] bg-ok/70"
              style={{ left: `${pct(e.start + 1)}%`, width: `${Math.max(2, pct(e.start + e.duration) - pct(e.start))}%` }}
              title={e.asrFull}
            />
          ))}
        </div>

        <LaneLabel>OCR</LaneLabel>
        <div className={lane}>
          {c.events.filter((e) => e.ocr?.length).map((e) => (
            <span
              key={e.slot}
              className="absolute top-[-1px] font-mono text-[9px] leading-[12px] text-warn"
              style={{ left: `${pct(e.start)}%` }}
              title={e.ocr!.join(" · ")}
            >
              ▣ {e.ocr![0]}
            </span>
          ))}
        </div>

        <LaneLabel>OBJECTS</LaneLabel>
        {["person", "reporter", "car"].map((name) => (
          <div key={name} className="mb-[3px] flex items-center gap-2">
            <span className="w-[54px] shrink-0 font-mono text-[9px] text-muted-foreground">{name}</span>
            <div className="relative h-[7px] flex-1 rounded-[2px] bg-accent">
              {c.events
                .filter((e) => e.objects.some((o) => o.label === name))
                .map((e) => (
                  <span
                    key={e.slot}
                    className="absolute top-0 h-[7px] rounded-[2px] bg-foreground/45"
                    style={{
                      left: `${pct(e.start - 4)}%`,
                      width: `${Math.max(3, pct(e.start + e.duration + 4) - pct(e.start - 4))}%`,
                    }}
                  />
                ))}
            </div>
          </div>
        ))}

        <div className="mt-2 grid grid-cols-3 gap-2">
          {c.events.map((e, i) => (
            <div
              key={e.slot}
              className={`rounded-[3px] border p-[6px] ${i === slot ? "border-primary/70" : "border-border"}`}
            >
              <div className="mb-1 flex items-center justify-between font-mono text-[10px]">
                <span className="text-primary">
                  {e.slot} EVENT MATCH {e.scores.event.toFixed(2)}
                </span>
                <span className="text-muted-foreground">
                  {fmt(e.start)}–{fmt(e.start + e.duration)}
                </span>
              </div>
              {(
                [
                  ["event emb", e.scores.event],
                  ["best frame", e.scores.frame],
                  ["caption", e.scores.caption],
                  ["asr", e.scores.asr],
                  ["ocr", e.scores.ocr],
                ] as [string, number | undefined][]
              ).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{k}</span>
                  {v === undefined ? <span className="font-mono text-muted-foreground/50">—</span> : <ScoreBar value={v} />}
                </div>
              ))}
              {e.asrFull && (
                <div className="mt-1 line-clamp-2 font-mono text-[10px] text-foreground/70">🎙 {e.asrFull}</div>
              )}
              {e.ocr?.length && (
                <div className="font-mono text-[10px] text-warn/90">▣ {e.ocr.join(" · ")}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const LaneLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-[6px] font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{children}</div>
);

function TickRow({ t0, t1 }: { t0: number; t1: number }) {
  const ticks = 6;
  return (
    <div className="relative h-[11px]">
      {Array.from({ length: ticks + 1 }).map((_, i) => (
        <span
          key={i}
          className="absolute font-mono text-[8px] text-muted-foreground/70"
          style={{ left: `${(i / ticks) * 100}%`, transform: "translateX(-50%)" }}
        >
          {fmt(t0 + ((t1 - t0) * i) / ticks)}
        </span>
      ))}
    </div>
  );
}
