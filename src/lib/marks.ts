import { CharStatus } from "./statuses";
import { getScore } from "./score";

// The score never says which letters matched, so players note their own
// deductions by tapping letters on the board. Each tap colours only that
// tile: a letter can occur more than once, and which copy matched is up to
// the player (with one hit in SILHOUETTE, only one of its Es is yellow).
//
// Stored flat, so saved games stay plain JSON: "row-position" keys (both
// from 0, rows from the top, positions from the left) hold the tile's mark.
export type Marks = Record<string, CharStatus>;

const tileKey = (row: number, position: number) => `${row}-${position}`;
const TILE_KEY = /^(\d{1,2})-(\d{1,2})$/;

const CYCLE: (CharStatus | undefined)[] = [
  undefined,
  "absent",
  "present",
  "correct",
];

export const nextMark = (current?: CharStatus) =>
  CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];

// The colour of the tile at `position` in guess `row`.
export const getMark = (
  marks: Marks,
  row: number,
  position: number,
): CharStatus | undefined => marks[tileKey(row, position)];

// Strongest first: what a keyboard key shows when its tiles disagree.
const STRENGTH: CharStatus[] = ["correct", "present", "absent"];

// The colour of a keyboard key: the strongest mark on any tile of `letter`.
export const getKeyMark = (
  marks: Marks,
  guesses: string[],
  letter: string,
): CharStatus | undefined => {
  const found = new Set<CharStatus>();
  guesses.forEach((guess, row) =>
    guess.split("").forEach((l, position) => {
      const mark = l === letter ? getMark(marks, row, position) : undefined;
      if (mark) {
        found.add(mark);
      }
    }),
  );
  return STRENGTH.find((status) => found.has(status));
};

// Tapping a tile moves it to its next colour; no other tile changes.
export const cycleMark = (
  marks: Marks,
  row: number,
  position: number,
): Marks => {
  const key = tileKey(row, position);
  const next = nextMark(marks[key]);
  const result = { ...marks };
  if (next === undefined) {
    delete result[key];
  } else {
    result[key] = next;
  }
  return result;
};

// Saved games from before marks were per tile keyed them by letter ("C",
// red or yellow on every copy) or by letter and position ("C0", green there
// in every row).
const LEGACY_LETTER_KEY = /^[A-Z]$/;
const LEGACY_GREEN_KEY = /^([A-Z])(\d{1,2})$/;

export const isMarks = (value: unknown): value is Marks =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.entries(value).every(([key, status]) =>
    TILE_KEY.test(key) || LEGACY_LETTER_KEY.test(key)
      ? CYCLE.includes(status) && status !== undefined
      : LEGACY_GREEN_KEY.test(key) && status === "correct",
  );

// Spreads old letter marks onto the tiles they coloured. Whole-letter greens
// (from before green was per position) become yellow, all that is known.
export const upgradeMarks = (marks: Marks, guesses: string[]): Marks => {
  const result: Marks = {};
  Object.entries(marks).forEach(([key, status]) => {
    if (TILE_KEY.test(key)) {
      result[key] = status;
    }
  });
  guesses.forEach((guess, row) =>
    guess.split("").forEach((letter, position) => {
      const key = tileKey(row, position);
      if (key in result) {
        return;
      }
      const letterMark = marks[letter];
      const mark =
        marks[`${letter}${position}`] === "correct"
          ? "correct"
          : letterMark === "correct"
            ? "present"
            : letterMark;
      if (mark) {
        result[key] = mark;
      }
    }),
  );
  return result;
};

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

// The player's marks with every tile of a forced red letter red on top.
export const withForcedAbsent = (
  marks: Marks,
  guesses: string[],
  forced: Set<string>,
): Marks => {
  if (forced.size === 0) {
    return marks;
  }
  const result = { ...marks };
  guesses.forEach((guess, row) =>
    guess.split("").forEach((letter, position) => {
      if (forced.has(letter)) {
        result[tileKey(row, position)] = "absent";
      }
    }),
  );
  return result;
};
