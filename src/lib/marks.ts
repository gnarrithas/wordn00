import { CharStatus } from "./statuses";
import { getScore } from "./score";

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

// As in Word500, a guess scored all red proves none of its letters is in the
// word: the game marks them red itself. Those marks are derived from the
// guesses, so Clear cannot remove them and the player cannot cycle them.
export const getForcedAbsent = (
  guesses: string[],
  solution: string,
): Set<string> => {
  const letters = new Set<string>();
  for (const guess of guesses) {
    const { correct, present } = getScore(guess, solution);
    if (correct === 0 && present === 0) {
      guess.split("").forEach((letter) => letters.add(letter));
    }
  }
  return letters;
};

// The player's marks with the forced red letters on top.
export const withForcedAbsent = (marks: Marks, forced: Set<string>): Marks => {
  if (forced.size === 0) {
    return marks;
  }
  const result = { ...marks };
  forced.forEach((letter) => {
    result[letter] = "absent";
  });
  return result;
};
