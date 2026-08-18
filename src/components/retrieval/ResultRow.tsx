import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { QUERY_GRAPH, fmt, gapLabel, gapsOf, spanOf, type Candidate } from "@/data/retrieval";
import { GapConnector, KeyframeCell } from "./KeyframeCell";
import { ModalityBadges } from "./Badges";

const diffTone: Record<Candidate["diffKind"], string> = {
  top: "text-ok",
  neutral: "text-muted-foreground",
  warn: "text-warn",
  bad: "text-bad",
};

function RankCell({ c, selected }: { c: Candidate; selected: boolean }) {
  return (
    <div className="w-[124px] shrink-0 pr-2">
      <div className="flex items-baseline gap-[6px]">
        <span className="font-mono text-[11px] text-muted-foreground">{String(c.rank).padStart(2, "0")}</span>
        <span
          className={`font-mono text-[15px] font-semibold leading-none ${
            c.score >= 0.9 ? "text-ok" : c.score >= 0.8 ? "text-warn" : "text-bad"
          }`}
        >
          {Math.round(c.score * 100)}%
        </span>
      </div>
      <div className="mt-[3px] truncate font-mono text-[10px] text-foreground/75" title={c.video.file}>
        {c.video.file}
      </div>
      <div className="font-mono text-[10px] text-muted-foreground">
        {c.video.channel} · span {gapLabel(spanOf(c))}
      </div>
      {selected && <MiniTimeline c={c} />}
    </div>
  );
}

function MiniTimeline({ c }: { c: Candidate }) {
  return (
    <div className="relative mt-[5px] h-[8px] w-full">
      <span className="absolute top-[3px] h-px w-full bg-border" />
      {c.events.map((e) => (
        <span
          key={e.slot}
          className="absolute top-[1px] h-[5px] w-[5px] rounded-full bg-primary"
          style={{ left: `calc(${(e.start / c.video.duration) * 100}% - 2px)` }}
          title={`${e.slot} ${fmt(e.start)}`}
        />
      ))}
      <span className="absolute -bottom-[9px] left-0 font-mono text-[8px] text-muted-foreground/70">0:00</span>
      <span className="absolute -bottom-[9px] right-0 font-mono text-[8px] text-muted-foreground/70">
        {fmt(c.video.duration)}
      </span>
    </div>
  );
}

export function ResultRow({
  c,
  selected,
  activeSlot,
  onSelect,
  onOpen,
}: {
  c: Candidate;
  selected: boolean;
  activeSlot: number | null;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const gaps = gapsOf(c);
  return (
    <div
      onMouseEnter={onSelect}
      onClick={onOpen}
      className={`group flex cursor-pointer items-start gap-2 border-b border-border/70 px-3 py-[5px] ${
        selected ? "bg-accent/60 shadow-[inset_2px_0_0_0_hsl(var(--primary))]" : "hover:bg-accent/25"
      }`}
    >
      <RankCell c={c} selected={selected} />
      <div className="flex items-start">
        {c.events.map((e, i) => (
          <div key={e.slot} className="flex items-start">
            {i > 0 && (
              <GapConnector
                seconds={gaps[i - 1]}
                ok={gaps[i - 1] >= 0 && gaps[i - 1] <= QUERY_GRAPH.links[i - 1].max}
              />
            )}
            <KeyframeCell
              ev={e}
              w={124}
              h={58}
              dim={activeSlot !== null && activeSlot !== i}
              onOpen={onOpen}
            />
          </div>
        ))}
      </div>
      <div className="ml-auto w-[168px] shrink-0 pl-2">
        <div className={`text-[11px] leading-[14px] ${diffTone[c.diffKind]}`}>
          {c.diffKind === "top" ? "✓ " : c.diffKind === "bad" ? "✕ " : c.diffKind === "warn" ? "△ " : "· "}
          {c.diff}
        </div>
        <div className="mt-[4px] space-y-[2px]">
          {c.events.map((e) => (
            <div key={e.slot} className="flex items-center gap-[4px]">
              <span className="font-mono text-[9px] text-muted-foreground">{e.slot}</span>
              <ModalityBadges ev={e} />
              {e.flag && (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <span className={`cursor-help text-[10px] ${e.flag.kind === "bad" ? "text-bad" : "text-warn"}`}>
                      {e.flag.kind === "bad" ? "✕" : "△"}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-[11px]">
                    {e.flag.text}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CompactRow({
  c,
  selected,
  onSelect,
  onOpen,
}: {
  c: Candidate;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const gaps = gapsOf(c);
  return (
    <div
      onMouseEnter={onSelect}
      onClick={onOpen}
      className={`flex cursor-pointer items-center gap-2 border-b border-border/60 px-3 font-mono text-[11px] leading-[26px] ${
        selected ? "bg-accent/60 shadow-[inset_2px_0_0_0_hsl(var(--primary))]" : "hover:bg-accent/25"
      }`}
    >
      <span className="w-[22px] text-muted-foreground">#{c.rank}</span>
      <span className={c.score >= 0.9 ? "text-ok" : c.score >= 0.8 ? "text-warn" : "text-bad"}>
        {c.score.toFixed(2).slice(1)}
      </span>
      <span className="w-[36px] text-foreground/80">{c.video.channel}</span>
      <span className="truncate text-muted-foreground" style={{ width: 190 }}>
        {c.video.file}
      </span>
      {c.events.map((e, i) => (
        <span key={e.slot} className="flex items-center gap-2">
          {i > 0 && (
            <span className={gaps[i - 1] <= QUERY_GRAPH.links[i - 1].max ? "text-muted-foreground" : "text-bad"}>
              │{gapLabel(gaps[i - 1])}│
            </span>
          )}
          <span className="flex items-center gap-1">
            <img src={e.keyframe} alt="" loading="lazy" className="h-[18px] w-[32px] rounded-[2px] object-cover" />
            <span className="text-foreground/85">{e.slot}</span>
            <span>{fmt(e.start)}</span>
            <span className={e.score >= 0.88 ? "text-ok" : e.score >= 0.75 ? "text-warn" : "text-bad"}>
              {e.score.toFixed(2).slice(1)}
            </span>
          </span>
        </span>
      ))}
      <span className={`ml-auto truncate ${diffTone[c.diffKind]}`} style={{ maxWidth: 240 }}>
        {c.diff}
      </span>
    </div>
  );
}
