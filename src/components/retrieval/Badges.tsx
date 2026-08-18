import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { EventMatch, Modality } from "@/data/retrieval";

const LABEL: Record<Modality, string> = {
  V: "Visual — frame/event embedding",
  C: "Caption — event caption match",
  A: "ASR — speech evidence",
  T: "OCR — on-screen text",
  O: "Object / bbox evidence",
};

export function ModalityBadges({ ev }: { ev: EventMatch }) {
  const strongAsr = (ev.scores.asr ?? 0) >= 0.85;
  return (
    <div className="flex items-center gap-[2px]">
      {(["V", "C", "A", "T", "O"] as Modality[]).map((m) => {
        const on = ev.modalities.includes(m);
        const hot = on && m === "A" && strongAsr;
        return (
          <Tooltip key={m} delayDuration={120}>
            <TooltipTrigger asChild>
              <span
                className={`inline-flex h-[13px] w-[13px] items-center justify-center rounded-[2px] font-mono text-[9px] leading-none ${
                  hot
                    ? "bg-primary text-primary-foreground"
                    : on
                      ? "bg-accent text-foreground"
                      : "bg-transparent text-muted-foreground/25 border border-border/60"
                }`}
              >
                {m}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">
              {LABEL[m]} {on ? "· contributing" : "· no signal"}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function ScoreBar({ value, width = 34 }: { value: number; width?: number }) {
  const tone = value >= 0.88 ? "bg-ok" : value >= 0.75 ? "bg-warn" : "bg-bad";
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span className="h-[4px] rounded-[1px] bg-border/80" style={{ width }}>
        <span className={`block h-full rounded-[1px] ${tone}`} style={{ width: `${value * 100}%` }} />
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">{value.toFixed(2).slice(1)}</span>
    </span>
  );
}

export function ScoreBreakdown({ ev }: { ev: EventMatch }) {
  const rows: [string, number | undefined][] = [
    ["Event embedding", ev.scores.event],
    ["Best frame", ev.scores.frame],
    ["Caption", ev.scores.caption],
    ["ASR", ev.scores.asr],
    ["OCR", ev.scores.ocr],
  ];
  return (
    <div className="w-[190px] space-y-1">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {ev.slot} evidence · frame src: {ev.frameSource}
      </div>
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-muted-foreground">{k}</span>
          {v === undefined ? <span className="font-mono text-muted-foreground/50">—</span> : <ScoreBar value={v} />}
        </div>
      ))}
    </div>
  );
}
