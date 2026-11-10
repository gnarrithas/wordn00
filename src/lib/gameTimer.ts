// Active play time for the current game. Time only counts between player
// actions, each gap capped at IDLE_CAP_MS, and never while the tab is hidden,
// so a game left open overnight does not report ten hours.
//
// The total is stored with its solution so reloading mid-game keeps it.

export const IDLE_CAP_MS = 2 * 60 * 1000;

export type GameTimer = {
  activeMs: number;
  // When the last action happened; null while paused (tab hidden).
  lastActionAt: number | null;
};

export const startTimer = (now: number, activeMs = 0): GameTimer => ({
  activeMs,
  lastActionAt: now,
});

export const recordAction = (timer: GameTimer, now: number): GameTimer => {
  const gap =
    timer.lastActionAt === null
      ? 0
      : Math.min(Math.max(now - timer.lastActionAt, 0), IDLE_CAP_MS);
  return { activeMs: timer.activeMs + gap, lastActionAt: now };
};

export const pauseTimer = (timer: GameTimer, now: number): GameTimer => ({
  ...recordAction(timer, now),
  lastActionAt: null,
});

export const resumeTimer = (timer: GameTimer, now: number): GameTimer => ({
  ...timer,
  lastActionAt: now,
});

const STORAGE_KEY = "gameTimer";

type SavedTimer = { solution: string; activeMs: number };

const isSavedTimer = (value: unknown): value is SavedTimer => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const saved = value as Record<string, unknown>;
  return (
    typeof saved.solution === "string" &&
    typeof saved.activeMs === "number" &&
    Number.isFinite(saved.activeMs) &&
    saved.activeMs >= 0
  );
};

// The stored active time for this solution, or 0 if none was stored.
export const loadActiveMs = (solution: string): number => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return 0;
    }
    const saved: unknown = JSON.parse(raw);
    return isSavedTimer(saved) && saved.solution === solution
      ? saved.activeMs
      : 0;
  } catch (err) {
    console.warn("Could not load game timer", err);
    return 0;
  }
};

export const saveActiveMs = (solution: string, activeMs: number) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ solution, activeMs }));
  } catch (err) {
    console.warn("Could not save game timer", err);
  }
};
