import { CharStatus } from "./statuses";

// The score never says which letters matched, so players note their own
// deductions: tapping a letter on the board cycles its mark, which then
// colours that letter everywhere on the board and keyboard.
export type Marks = Record<string, CharStatus>;

const CYCLE: (CharStatus | undefined)[] = [
  undefined,
  "absent",
  "present",
  "correct",
];

const STATUSES = new Set<unknown>(CYCLE.filter(Boolean));

export const nextMark = (current?: CharStatus) =>
  CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];

// Marks with `letter` moved to its next state.
export const cycleMark = (marks: Marks, letter: string): Marks => {
  const next = nextMark(marks[letter]);
  const { [letter]: _previous, ...rest } = marks;
  return next ? { ...rest, [letter]: next } : rest;
};

export const isMarks = (value: unknown): value is Marks =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.entries(value).every(
    ([letter, status]) => /^[A-Z]$/.test(letter) && STATUSES.has(status),
  );
