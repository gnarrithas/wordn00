// Each tile flips for FLIP_MS; tiles start one after another, but long words
// squeeze the stagger so a whole row never takes much longer than a short one.
export const FLIP_MS = 350;
const MAX_STAGGER_MS = 120;
const MAX_TOTAL_STAGGER_MS = 600;

export const getRevealStaggerMs = (length: number) =>
  length <= 1
    ? 0
    : Math.min(MAX_STAGGER_MS, MAX_TOTAL_STAGGER_MS / (length - 1));

// Time from a row appearing until its last tile has finished flipping.
export const getRowRevealMs = (length: number) =>
  Math.max(0, length - 1) * getRevealStaggerMs(length) + FLIP_MS;

// A guess's score: three boxes, flipped like tiles.
export const SCORE_BOXES = 3;

// Time from a guess appearing until its score boxes have flipped in.
export const getGuessRevealMs = () => getRowRevealMs(SCORE_BOXES);

// End of game, as in Word500: once the last score is in (and, after a win,
// the cheer has been up this long), every tile on the board flips at once to
// its Wordle colour.
export const WIN_PAUSE_MS = 1500;

export const getBoardFlipStartMs = (isWin: boolean) =>
  getGuessRevealMs() + (isWin ? WIN_PAUSE_MS : 0);

export const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
