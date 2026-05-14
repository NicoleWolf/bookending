// Per-chapter author notes, keyed by manuscript id → chapter number.
// Used as initial state; real API data overwrites if present.
export const AUTHOR_NOTES: Record<number, Record<number, string>> = {
  3: {
    1: "The opening 'conjecture' boundary is load-bearing — I want to know whether it reads as meaningful to someone coming in cold, or whether it needs more setup before Izel arrives at it.",
    2: "The compass-as-father's-compass detail is new to this draft. It may be doing too much. Worth noting if it lands or feels heavy.",
  },
  1: {
    1: "The light being 'wrong' is the first beat. I need to know whether readers clock the lighthouse as metaphor immediately (too early) or take it as purely literal. Please note your first instinct.",
    2: "The chest of letters is the structural hinge of Part 1. If it doesn't earn the reveal, the rest unravels. Please be specific about where you first suspected what was inside.",
    3: "Elspeth arrives late in a chapter that's doing a lot of other work. I'm unsure whether her introduction lands or gets lost.",
  },
  2: {
    1: "Adaeze's opening POV carries the whole contemporary thread. Does her voice feel distinct and specific, or does it read as generic literary-fiction interiority?",
    2: "The Bordeaux chapters are harder to calibrate for tonal distance. Too much historical texture and it becomes pastiche; too little and it's vague. Please note where the balance tips.",
  },
};


export const STAR_LABELS = ['', 'Did not finish', 'Had issues', 'Worth the time', 'Recommended', 'Exceptional'];

export const STANCE_ORDER = ['Enthralled', 'Engaged', 'Curious', 'Drifting', 'Lost'] as const;
export type Stance = typeof STANCE_ORDER[number];
export const STANCE_VALUE: Record<Stance, number> = {
  Enthralled: 4, Engaged: 3, Curious: 2, Drifting: 1, Lost: 0,
};
