import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { EventMatch } from "@/data/retrieval";
import { fmt, gapLabel } from "@/data/retrieval";
import { ModalityBadges, ScoreBreakdown } from "./Badges";

const OFFSETS = [-5, -2, 0, 2, 5];

type Props = {
  ev: EventMatch;
  w: number;
  h: number;
  dim?: boolean;
  onOpen?: () => void;
};

/** Compact keyframe: single frame by default, filmstrip + scrub on hover, bbox on chip hover. */
export function KeyframeCell({ ev, w, h, dim, onOpen }: Props) {
  const [hover, setHover] = useState(false);
  const [scrub, setScrub] = useState(0); // seconds offset from match frame
  const [obj, setObj] = useState<string | null>(null);
  const box = ev.objects.find((o) => o.label === obj);

  return (
    <div className="select-none" style={{ width: w }}>
      <div className="mb-[2px] flex items-baseline justify-between font-mono text-[10px] leading-none">
        <span className="text-foreground/80">
          {fmt(ev.start)}
          <span className="text-muted-foreground"> +{ev.duration}s</span>
        </span>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <span
              className={`cursor-help ${
                ev.score >= 0.88 ? "text-ok" : ev.score >= 0.75 ? "text-warn" : "text-bad"
              }`}
            >
              {ev.score.toFixed(2).slice(1)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            <ScoreBreakdown ev={ev} />
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        className={`relative overflow-hidden rounded-[3px] border ${
          ev.flag?.kind === "bad"
            ? "border-bad/60"
            : ev.flag?.kind === "warn"
              ? "border-warn/50"
              : "border-border"
        } bg-black ${dim ? "opacity-55" : ""}`}
        style={{ width: w, height: h }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          setScrub(0);
          setObj(null);
        }}
        onWheel={(e) => {
          e.preventDefault();
          setScrub((s) => Math.max(-15, Math.min(15, s + (e.deltaY > 0 ? 1 : -1))));
        }}
        onClick={onOpen}
        role="button"
        tabIndex={-1}
        aria-label={`${ev.slot} keyframe at ${fmt(ev.start)}`}
      >
        {hover ? (
          <div className="flex h-full w-full">
            {OFFSETS.map((o) => (
              <div
                key={o}
                className={`relative h-full flex-1 overflow-hidden border-r border-black/70 last:border-r-0 ${
                  o === 0 ? "ring-1 ring-inset ring-primary" : ""
                }`}
              >
                <img
                  src={ev.keyframe}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition: `${50 + o * 2.2}% 50%`,
                    transform: `scale(${1.06 + Math.abs(o) * 0.01})`,
                    filter: o === 0 ? "none" : "saturate(0.75) brightness(0.82)",
                  }}
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/65 text-center font-mono text-[8px] leading-[10px] text-foreground/80">
                  {o === 0 ? "MATCH" : `${o > 0 ? "+" : ""}${o}s`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <img
            src={ev.keyframe}
            alt={ev.caption}
            loading="lazy"
            width={w}
            height={h}
            className="h-full w-full object-cover"
          />
        )}

        {box && (
          <>
            <span
              className="pointer-events-none absolute rounded-[1px] border border-primary shadow-[0_0_0_1px_hsl(var(--background)/0.7)]"
              style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
            />
            <span className="pointer-events-none absolute left-0 top-0 bg-primary px-1 font-mono text-[8px] leading-[11px] text-primary-foreground">
              {box.label}
            </span>
          </>
        )}

        {scrub !== 0 && (
          <span className="pointer-events-none absolute right-0 top-0 bg-primary px-1 font-mono text-[9px] leading-[12px] text-primary-foreground">
            {scrub > 0 ? "+" : ""}
            {scrub}s
          </span>
        )}

        {ev.frameSource !== "keyframe" && !hover && (
          <span className="pointer-events-none absolute bottom-0 right-0 bg-background/75 px-[3px] font-mono text-[8px] leading-[11px] text-primary">
            {ev.frameSource === "best-frame" ? "best frame" : "obj evid"}
          </span>
        )}
      </div>

      {/* event timeline with best-frame marker */}
      <div className="relative mt-[2px] h-[3px] w-full rounded-[1px] bg-accent">
        <span
          className="absolute top-0 h-[3px] w-[2px] bg-primary"
          style={{ left: `calc(${ev.bestFrameAt * 100}% - 1px)` }}
        />
      </div>

      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <div className="mt-[2px] truncate text-[11px] leading-[12px] text-foreground/85">{ev.caption}</div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px] text-[11px]">
          {ev.captionFull}
        </TooltipContent>
      </Tooltip>

      {ev.asr ? (
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <div
              className={`truncate font-mono text-[10px] leading-[12px] ${
                (ev.scores.asr ?? 0) >= 0.85 ? "text-primary" : "text-muted-foreground"
              }`}
            >
              🎙 {ev.asr}
              {ev.scores.asr !== undefined && <span className="ml-1 opacity-70">{ev.scores.asr.toFixed(2)}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[300px] text-[11px]">
            {ev.asrFull}
          </TooltipContent>
        </Tooltip>
      ) : ev.ocr?.length ? (
        <div className="truncate font-mono text-[10px] leading-[12px] text-muted-foreground">
          ▣ “{ev.ocr[0]}”
        </div>
      ) : (
        <div className="h-[12px]" />
      )}

      <div className="mt-[2px] flex items-center gap-1">
        <ModalityBadges ev={ev} />
        <div className="flex min-w-0 items-center gap-[2px] overflow-hidden">
          {ev.objects.slice(0, 3).map((o) => (
            <button
              key={o.label}
              onMouseEnter={() => setObj(o.label)}
              onMouseLeave={() => setObj(null)}
              className="shrink-0 rounded-[2px] border border-border px-[3px] font-mono text-[9px] leading-[13px] text-muted-foreground hover:border-primary hover:text-primary"
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GapConnector({ seconds, ok }: { seconds: number; ok: boolean }) {
  return (
    <div className="flex w-[96px] flex-col items-center justify-center pb-4">
      <span className={`font-mono text-[10px] leading-none ${ok ? "text-muted-foreground" : "text-bad"}`}>
        {gapLabel(seconds)}
      </span>
      <span className={`mt-1 h-px w-full ${ok ? "bg-border" : "bg-bad/70"}`} />
    </div>
  );
}
