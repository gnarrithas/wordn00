import { Marks } from "./marks";

// Undo and redo for the player's marks (tapping tiles, Clear). Kept for the
// current round only; a new word starts a fresh history.
export type MarksHistory = {
  past: Marks[];
  present: Marks;
  future: Marks[];
};

// Oldest steps are dropped beyond this.
const MAX_STEPS = 200;

export const startHistory = (marks: Marks): MarksHistory => ({
  past: [],
  present: marks,
  future: [],
});

// A new marks state; it discards anything that could have been redone.
export const recordMarks = (
  history: MarksHistory,
  next: Marks,
): MarksHistory =>
  next === history.present
    ? history
    : {
        past: [...history.past, history.present].slice(-MAX_STEPS),
        present: next,
        future: [],
      };

export const canUndo = (history: MarksHistory) => history.past.length > 0;

export const canRedo = (history: MarksHistory) => history.future.length > 0;

export const undoMarks = (history: MarksHistory): MarksHistory =>
  canUndo(history)
    ? {
        past: history.past.slice(0, -1),
        present: history.past[history.past.length - 1],
        future: [history.present, ...history.future],
      }
    : history;

export const redoMarks = (history: MarksHistory): MarksHistory =>
  canRedo(history)
    ? {
        past: [...history.past, history.present],
        present: history.future[0],
        future: history.future.slice(1),
      }
    : history;
