// Each tile flips for FLIP_MS; tiles start one after another, but long words
// squeeze the stagger so a whole row never takes much longer than a short one.
export const FLIP_MS = 650;
const MAX_STAGGER_MS = 325;
const MAX_TOTAL_STAGGER_MS = 1625;

export const getRevealStaggerMs = (length: number) =>
  length <= 1
    ? 0
    : Math.min(MAX_STAGGER_MS, MAX_TOTAL_STAGGER_MS / (length - 1));

// Winning-row celebration: tiles hop one after another once the reveal ends.
export const BOUNCE_MS = 1000;
const MAX_BOUNCE_STAGGER_MS = 100;
const MAX_TOTAL_BOUNCE_STAGGER_MS = 500;

export const getBounceStaggerMs = (length: number) =>
  length <= 1
    ? 0
    : Math.min(
        MAX_BOUNCE_STAGGER_MS,
        MAX_TOTAL_BOUNCE_STAGGER_MS / (length - 1),
      );

// Time from a row appearing until its last tile has finished flipping.
export const getRowRevealMs = (length: number) =>
  Math.max(0, length - 1) * getRevealStaggerMs(length) + FLIP_MS;

// Time from the winning row's reveal ending until its last tile stops bouncing.
export const getRowBounceMs = (length: number) =>
  Math.max(0, length - 1) * getBounceStaggerMs(length) + BOUNCE_MS;

export const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
