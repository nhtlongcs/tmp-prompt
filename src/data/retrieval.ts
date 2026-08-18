import entrance from "@/assets/frames/entrance.jpg";
import reporters from "@/assets/frames/reporters.jpg";
import car from "@/assets/frames/car.jpg";
import airport from "@/assets/frames/airport.jpg";
import indoorPress from "@/assets/frames/indoor-press.jpg";
import convoy from "@/assets/frames/convoy.jpg";

export type Modality = "V" | "C" | "A" | "T" | "O";

export type BBox = { label: string; x: number; y: number; w: number; h: number };

export type EventMatch = {
  slot: "E1" | "E2" | "E3";
  start: number; // seconds into video
  duration: number; // seconds
  score: number; // compact event score 0..1
  scores: { event: number; frame: number; caption: number; asr?: number; ocr?: number };
  bestFrameAt: number; // 0..1 position of best frame inside the event
  frameSource: "keyframe" | "best-frame" | "object-evidence";
  keyframe: string;
  caption: string;
  captionFull: string;
  asr?: string;
  asrFull?: string;
  ocr?: string[];
  objects: BBox[];
  modalities: Modality[];
  flag?: { kind: "warn" | "bad"; text: string };
};

export type Candidate = {
  id: string;
  rank: number;
  video: { file: string; channel: string; duration: number };
  score: number;
  events: EventMatch[];
  diff: string;
  diffKind: "top" | "neutral" | "warn" | "bad";
};

export const QUERY_TEXT =
  "Find when the politician enters the building, talks to reporters, then gets into a car.";

export const QUERY_GRAPH = {
  events: [
    { slot: "E1", label: "Enter building", weight: 1.0, required: false },
    { slot: "E2", label: "Talk to reporters", weight: 1.4, required: true },
    { slot: "E3", label: "Enter car", weight: 1.0, required: false },
  ],
  links: [
    { from: "E1", to: "E2", rel: "BEFORE", max: 180 },
    { from: "E2", to: "E3", rel: "BEFORE", max: 300 },
  ],
  constraints: [
    { key: "Person", value: "same", hard: true },
    { key: "Reporter", value: "near E2", hard: false },
    { key: "Car", value: "person inside", hard: false },
    { key: "OCR", value: '"parliament" | "senate"', hard: false },
    { key: "ASR", value: "vote | announcement", hard: false },
    { key: "NOT", value: "studio anchor shot", hard: true },
  ],
};

export const RAW_QUERY = `SEQ(
  E1 { text:"man enters building", w:1.0 }
  BEFORE(max=3m)
  E2 { text:"talks to reporters", w:1.4, required:true, near:reporter }
  BEFORE(max=5m)
  E3 { text:"gets into car", w:1.0, spatial:person INSIDE car }
)
WHERE person.identity = SAME
  AND ocr ~ "parliament|senate" (soft)
  AND asr ~ "vote|announcement" (soft)
  AND NOT scene = "studio anchor"`;

const obj = (label: string, x: number, y: number, w: number, h: number): BBox => ({ label, x, y, w, h });

export const CANDIDATES: Candidate[] = [
  {
    id: "c1",
    rank: 1,
    video: { file: "CNN_2026-08-18_1400.mp4", channel: "CNN", duration: 1934 },
    score: 0.94,
    diff: "Best overall — all constraints satisfied",
    diffKind: "top",
    events: [
      {
        slot: "E1", start: 761, duration: 8, score: 0.91,
        scores: { event: 0.92, frame: 0.88, caption: 0.95, asr: 0.41 },
        bestFrameAt: 0.62, frameSource: "best-frame", keyframe: entrance,
        caption: "Man in dark suit climbs steps into parliament",
        captionFull: "A man in a dark suit walks up the stone steps and enters the main parliament entrance, unaccompanied, mid-afternoon light.",
        ocr: ["PARLIAMENT"],
        objects: [obj("person", 41, 28, 18, 52), obj("door", 40, 12, 20, 34), obj("steps", 4, 60, 92, 36)],
        modalities: ["V", "C", "T"],
      },
      {
        slot: "E2", start: 782, duration: 14, score: 0.96,
        scores: { event: 0.96, frame: 0.93, caption: 0.97, asr: 0.92, ocr: 0.68 },
        bestFrameAt: 0.35, frameSource: "keyframe", keyframe: reporters,
        caption: "Man approaches reporters outside entrance",
        captionFull: "The man stops in front of a scrum of about ten reporters holding microphones and answers questions outside the building entrance.",
        asr: "…decision will be announced tonight",
        asrFull: "We expect the vote today, and the decision will be announced tonight once the committee has finished its review.",
        ocr: ["NEWS 9", "LIVE"],
        objects: [obj("person", 38, 18, 22, 70), obj("reporter", 6, 22, 20, 74), obj("microphone", 26, 42, 32, 22)],
        modalities: ["V", "C", "A", "T", "O"],
      },
      {
        slot: "E3", start: 895, duration: 6, score: 0.89,
        scores: { event: 0.89, frame: 0.9, caption: 0.9 },
        bestFrameAt: 0.5, frameSource: "object-evidence", keyframe: car,
        caption: "Enters rear seat of black sedan, aide holds door",
        captionFull: "The same man ducks into the rear seat of a black sedan while an aide in a dark suit holds the door open on a tree-lined street.",
        objects: [obj("person", 40, 30, 20, 55), obj("car", 2, 20, 70, 74), obj("aide", 63, 12, 22, 84)],
        modalities: ["V", "C", "O"],
      },
    ],
  },
  {
    id: "c2",
    rank: 2,
    video: { file: "BBC_2026-08-18_1830.mp4", channel: "BBC", duration: 2712 },
    score: 0.91,
    diff: "Same sequence, different person (identity 0.58)",
    diffKind: "warn",
    events: [
      {
        slot: "E1", start: 502, duration: 11, score: 0.9,
        scores: { event: 0.9, frame: 0.86, caption: 0.92 },
        bestFrameAt: 0.44, frameSource: "keyframe", keyframe: entrance,
        caption: "Official walks up steps to columned building",
        captionFull: "An official in a grey suit walks up the steps of a columned government building past a security railing.",
        ocr: ["SENATE"],
        objects: [obj("person", 44, 30, 16, 50), obj("railing", 2, 48, 30, 34)],
        modalities: ["V", "C", "T"],
      },
      {
        slot: "E2", start: 519, duration: 22, score: 0.95,
        scores: { event: 0.95, frame: 0.92, caption: 0.94, asr: 0.73 },
        bestFrameAt: 0.2, frameSource: "best-frame", keyframe: reporters,
        caption: "Press scrum questions official on the pavement",
        captionFull: "A press scrum crowds around the official on the pavement; several microphones with network flags are pushed forward.",
        asr: "…no comment before the committee sits",
        asrFull: "I have no comment before the committee sits. You will hear from the office later this evening.",
        objects: [obj("person", 40, 16, 22, 72), obj("reporter", 70, 20, 24, 76), obj("microphone", 30, 40, 30, 24)],
        modalities: ["V", "C", "A"],
        flag: { kind: "warn", text: "face identity vs E1 = 0.58" },
      },
      {
        slot: "E3", start: 563, duration: 9, score: 0.86,
        scores: { event: 0.86, frame: 0.88, caption: 0.85 },
        bestFrameAt: 0.7, frameSource: "keyframe", keyframe: car,
        caption: "Gets into dark car at kerbside",
        captionFull: "He steps into a dark car waiting at the kerb; the door is closed by a security officer.",
        objects: [obj("person", 38, 32, 20, 52), obj("car", 4, 22, 68, 72)],
        modalities: ["V", "C", "O"],
      },
    ],
  },
  {
    id: "c3",
    rank: 3,
    video: { file: "CNN_2026-08-18_1400.mp4", channel: "CNN", duration: 1934 },
    score: 0.87,
    diff: "Reporter interaction occurs indoors",
    diffKind: "neutral",
    events: [
      {
        slot: "E1", start: 1263, duration: 7, score: 0.94,
        scores: { event: 0.94, frame: 0.91, caption: 0.93 },
        bestFrameAt: 0.3, frameSource: "keyframe", keyframe: entrance,
        caption: "Same man re-enters building via side steps",
        captionFull: "The same man re-enters the building using the side steps, carrying a folder under his arm.",
        ocr: ["PARLIAMENT"],
        objects: [obj("person", 43, 26, 17, 54), obj("folder", 50, 44, 8, 8)],
        modalities: ["V", "C", "T"],
      },
      {
        slot: "E2", start: 1305, duration: 31, score: 0.82,
        scores: { event: 0.82, frame: 0.79, caption: 0.86, asr: 0.88 },
        bestFrameAt: 0.55, frameSource: "best-frame", keyframe: indoorPress,
        caption: "Corridor interview with camera crews",
        captionFull: "In an interior corridor under fluorescent light, the man answers questions from two camera crews and a radio reporter.",
        asr: "…the vote is scheduled for four o'clock",
        asrFull: "The vote is scheduled for four o'clock. I will not speculate on the outcome before then.",
        objects: [obj("person", 33, 26, 22, 72), obj("camera", 70, 10, 28, 50), obj("reporter", 0, 22, 24, 76)],
        modalities: ["V", "C", "A"],
        flag: { kind: "warn", text: "scene: indoor, query implies outside" },
      },
      {
        slot: "E3", start: 1506, duration: 5, score: 0.91,
        scores: { event: 0.91, frame: 0.93, caption: 0.88 },
        bestFrameAt: 0.4, frameSource: "object-evidence", keyframe: car,
        caption: "Enters black sedan with aide",
        captionFull: "He gets into the same black sedan, aide holding the rear door; convoy vehicle visible behind.",
        objects: [obj("person", 40, 30, 20, 55), obj("car", 2, 20, 70, 74)],
        modalities: ["V", "C", "O"],
      },
    ],
  },
  {
    id: "c4",
    rank: 4,
    video: { file: "REUTERS_2026-08-17_0930.mp4", channel: "RTR", duration: 1487 },
    score: 0.85,
    diff: "Correct visuals, weak ASR support (0.31)",
    diffKind: "warn",
    events: [
      {
        slot: "E1", start: 322, duration: 10, score: 0.88,
        scores: { event: 0.88, frame: 0.85, caption: 0.9 },
        bestFrameAt: 0.5, frameSource: "keyframe", keyframe: entrance,
        caption: "Delegate enters ministry building",
        captionFull: "A delegate walks through the main door of the ministry building; two staff wait at the top of the steps.",
        objects: [obj("person", 45, 28, 15, 52), obj("door", 40, 12, 20, 34)],
        modalities: ["V", "C"],
      },
      {
        slot: "E2", start: 349, duration: 12, score: 0.9,
        scores: { event: 0.9, frame: 0.9, caption: 0.89, asr: 0.31 },
        bestFrameAt: 0.6, frameSource: "keyframe", keyframe: reporters,
        caption: "Brief doorstep with three reporters",
        captionFull: "A short doorstep exchange with three reporters; audio is dominated by street noise and no usable speech is transcribed.",
        asr: "[crowd noise, indistinct]",
        asrFull: "[crowd noise, indistinct] … (ASR confidence 0.31, 2.1s of speech detected)",
        objects: [obj("person", 38, 18, 22, 70), obj("microphone", 28, 44, 28, 20)],
        modalities: ["V", "C"],
        flag: { kind: "warn", text: "ASR 0.31 — no lexical support" },
      },
      {
        slot: "E3", start: 402, duration: 8, score: 0.78,
        scores: { event: 0.78, frame: 0.82, caption: 0.76 },
        bestFrameAt: 0.25, frameSource: "best-frame", keyframe: convoy,
        caption: "Walks toward waiting convoy at gate",
        captionFull: "He walks toward a waiting convoy at the gate; entering the vehicle is partly occluded by a police car.",
        objects: [obj("person", 6, 40, 8, 30), obj("car", 46, 44, 40, 34)],
        modalities: ["V", "C", "O"],
        flag: { kind: "warn", text: "E3 semantic 0.78 — entry occluded" },
      },
    ],
  },
  {
    id: "c5",
    rank: 5,
    video: { file: "CNN_2026-08-18_1400.mp4", channel: "CNN", duration: 1934 },
    score: 0.83,
    diff: "E2 occurs 4m12s later — exceeds ≤3m gap",
    diffKind: "bad",
    events: [
      {
        slot: "E1", start: 1720, duration: 9, score: 0.89,
        scores: { event: 0.89, frame: 0.87, caption: 0.9 },
        bestFrameAt: 0.5, frameSource: "keyframe", keyframe: entrance,
        caption: "Man enters building through main door",
        captionFull: "The man enters the building through the main door as staff hold it open.",
        ocr: ["PARLIAMENT"],
        objects: [obj("person", 42, 28, 18, 52)],
        modalities: ["V", "C", "T"],
      },
      {
        slot: "E2", start: 1972, duration: 18, score: 0.93,
        scores: { event: 0.93, frame: 0.9, caption: 0.92, asr: 0.79 },
        bestFrameAt: 0.45, frameSource: "keyframe", keyframe: reporters,
        caption: "Reporters question him after session",
        captionFull: "After the session the man is questioned again by reporters on the front steps.",
        asr: "…we have the numbers, I'm confident",
        asrFull: "We have the numbers, I'm confident. The result will be published straight after the count.",
        objects: [obj("person", 38, 18, 22, 70), obj("reporter", 6, 22, 20, 74)],
        modalities: ["V", "C", "A"],
        flag: { kind: "bad", text: "gap E1→E2 = 4m12s > 3m" },
      },
      {
        slot: "E3", start: 2098, duration: 7, score: 0.84,
        scores: { event: 0.84, frame: 0.86, caption: 0.83 },
        bestFrameAt: 0.5, frameSource: "keyframe", keyframe: car,
        caption: "Steps into sedan, door closed by aide",
        captionFull: "He steps into the sedan and the aide closes the door before the car pulls away.",
        objects: [obj("person", 40, 30, 20, 55), obj("car", 2, 20, 70, 74)],
        modalities: ["V", "C", "O"],
      },
    ],
  },
  {
    id: "c6",
    rank: 6,
    video: { file: "SKY_2026-08-16_2115.mp4", channel: "SKY", duration: 3126 },
    score: 0.79,
    diff: "E1 is an airport hall, not a building entrance",
    diffKind: "bad",
    events: [
      {
        slot: "E1", start: 604, duration: 15, score: 0.68,
        scores: { event: 0.68, frame: 0.71, caption: 0.64, ocr: 0.81 },
        bestFrameAt: 0.35, frameSource: "best-frame", keyframe: airport,
        caption: "Officials walk through airport terminal",
        captionFull: "A group of officials walks through an arrivals hall past overhead signage and check-in desks.",
        ocr: ["DUBLIN AIRPORT", "ARRIVALS"],
        objects: [obj("person", 2, 32, 22, 66), obj("sign", 22, 26, 26, 12)],
        modalities: ["V", "T"],
        flag: { kind: "bad", text: "scene mismatch: terminal ≠ building entry" },
      },
      {
        slot: "E2", start: 655, duration: 26, score: 0.86,
        scores: { event: 0.86, frame: 0.84, caption: 0.87, asr: 0.66 },
        bestFrameAt: 0.5, frameSource: "keyframe", keyframe: reporters,
        caption: "Press gaggle inside terminal concourse",
        captionFull: "A press gaggle forms in the concourse; the delegation stops briefly for questions before moving on.",
        asr: "…talks continue in the morning",
        asrFull: "Talks continue in the morning. We have made progress but nothing is agreed yet.",
        objects: [obj("person", 38, 18, 22, 70), obj("reporter", 68, 20, 26, 76)],
        modalities: ["V", "C", "A"],
      },
      {
        slot: "E3", start: 774, duration: 6, score: 0.83,
        scores: { event: 0.83, frame: 0.85, caption: 0.8 },
        bestFrameAt: 0.55, frameSource: "keyframe", keyframe: car,
        caption: "Delegation boards waiting cars",
        captionFull: "The delegation boards waiting cars outside the terminal exit doors.",
        objects: [obj("person", 40, 30, 20, 55), obj("car", 2, 20, 70, 74)],
        modalities: ["V", "C", "O"],
      },
    ],
  },
  {
    id: "c7",
    rank: 7,
    video: { file: "BBC_2026-08-18_1830.mp4", channel: "BBC", duration: 2712 },
    score: 0.76,
    diff: "Order inverted — car entry precedes reporters",
    diffKind: "bad",
    events: [
      {
        slot: "E1", start: 1503, duration: 8, score: 0.81,
        scores: { event: 0.81, frame: 0.8, caption: 0.82 },
        bestFrameAt: 0.4, frameSource: "keyframe", keyframe: entrance,
        caption: "Man exits building down the steps",
        captionFull: "The man walks down the steps away from the building doors, coat over one arm.",
        objects: [obj("person", 43, 28, 17, 52)],
        modalities: ["V", "C"],
        flag: { kind: "warn", text: "direction: exiting, not entering" },
      },
      {
        slot: "E2", start: 1710, duration: 19, score: 0.79,
        scores: { event: 0.79, frame: 0.77, caption: 0.81, asr: 0.55 },
        bestFrameAt: 0.5, frameSource: "keyframe", keyframe: indoorPress,
        caption: "Interview in lobby after car arrival",
        captionFull: "An interview takes place in the lobby after the car has already dropped him off, reversing the queried order.",
        asr: "…I'll answer that inside",
        asrFull: "I'll answer that inside. Let's do this properly in the briefing room.",
        objects: [obj("person", 33, 26, 22, 72), obj("camera", 70, 10, 28, 50)],
        modalities: ["V", "C", "A"],
        flag: { kind: "bad", text: "temporal order violated (E3 < E2)" },
      },
      {
        slot: "E3", start: 1644, duration: 6, score: 0.72,
        scores: { event: 0.72, frame: 0.75, caption: 0.7 },
        bestFrameAt: 0.5, frameSource: "keyframe", keyframe: convoy,
        caption: "Car arrives at gate, passenger exits",
        captionFull: "The car arrives at the gate and the passenger exits — the opposite action to the queried event.",
        objects: [obj("car", 46, 44, 40, 34)],
        modalities: ["V", "O"],
      },
    ],
  },
  {
    id: "c8",
    rank: 8,
    video: { file: "REUTERS_2026-08-17_0930.mp4", channel: "RTR", duration: 1487 },
    score: 0.71,
    diff: "E2 missing reporters — security staff only",
    diffKind: "bad",
    events: [
      {
        slot: "E1", start: 903, duration: 12, score: 0.84,
        scores: { event: 0.84, frame: 0.83, caption: 0.85 },
        bestFrameAt: 0.5, frameSource: "keyframe", keyframe: entrance,
        caption: "Aide enters ministry side entrance",
        captionFull: "An aide enters the ministry side entrance ahead of the delegation.",
        objects: [obj("person", 45, 28, 15, 52)],
        modalities: ["V", "C"],
      },
      {
        slot: "E2", start: 940, duration: 16, score: 0.61,
        scores: { event: 0.61, frame: 0.64, caption: 0.58 },
        bestFrameAt: 0.5, frameSource: "keyframe", keyframe: indoorPress,
        caption: "Talks to security staff in corridor",
        captionFull: "He talks to two uniformed security staff in a corridor; no press or microphones are detected.",
        objects: [obj("person", 33, 26, 22, 72)],
        modalities: ["V", "C"],
        flag: { kind: "bad", text: "no reporter/microphone objects found" },
      },
      {
        slot: "E3", start: 1080, duration: 7, score: 0.8,
        scores: { event: 0.8, frame: 0.81, caption: 0.79 },
        bestFrameAt: 0.5, frameSource: "keyframe", keyframe: convoy,
        caption: "Boards vehicle in courtyard at dusk",
        captionFull: "He boards a vehicle in the courtyard at dusk, headlights on.",
        objects: [obj("person", 6, 40, 8, 30), obj("car", 46, 44, 40, 34)],
        modalities: ["V", "C", "O"],
      },
    ],
  },
];

export const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export const gapLabel = (s: number) => {
  if (s < 0) return `-${gapLabel(-s)}`;
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return sec ? `${m}m${String(sec).padStart(2, "0")}` : `${m}m`;
};

export const gapsOf = (c: Candidate) => [
  c.events[1].start - (c.events[0].start + c.events[0].duration),
  c.events[2].start - (c.events[1].start + c.events[1].duration),
];

export const spanOf = (c: Candidate) => {
  const last = c.events[c.events.length - 1];
  return last.start + last.duration - c.events[0].start;
};

export const scoreTone = (v: number) => (v >= 0.88 ? "ok" : v >= 0.75 ? "warn" : "bad");
