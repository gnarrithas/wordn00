import { CharStatus } from "./statuses";
import { getScore } from "./score";

// The score never says which letters matched, so players note their own
// deductions by tapping letters on the board. Red and yellow are about a
// letter (it is not in the word / it is somewhere in it), so they colour
// every copy of it on the board and its keyboard key. Green is about a letter
// in one spot, so it only colours that letter at that position, in any row;
// the other copies stay yellow.
//
// Stored flat, so saved games stay plain JSON: a letter key ("C") holds its
// red or yellow mark, and a letter-and-position key ("C0", positions from the
// left starting at 0) marks it green there.
export type Marks = Record<string, CharStatus>;

const greenKey = (letter: string, position: number) => `${letter}${position}`;
const GREEN_KEY = /^([A-Z])\d{1,2}$/;

const CYCLE: (CharStatus | undefined)[] = [
  undefined,
  "absent",
  "present",
  "correct",
];

export const nextMark = (current?: CharStatus) =>
  CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];

// The colour of `letter` at `position` on the board.
export const getMark = (
  marks: Marks,
  letter: string,
  position: number,
): CharStatus | undefined =>
  marks[greenKey(letter, position)] === "correct" ? "correct" : marks[letter];

// The colour of a keyboard key: green once the letter is green anywhere.
export const getKeyMark = (
  marks: Marks,
  letter: string,
): CharStatus | undefined =>
  Object.keys(marks).some((key) => GREEN_KEY.exec(key)?.[1] === letter)
    ? "correct"
    : marks[letter];

const without = (marks: Marks, ...keys: string[]): Marks => {
  const result = { ...marks };
  keys.forEach((key) => delete result[key]);
  return result;
};

// Tapping `letter` at `position` moves that tile to its next colour: red and
// yellow change every copy of the letter; green only this spot, the others
// staying yellow. From green, the letter goes back to blank everywhere,
// green spots included.
export const cycleMark = (
  marks: Marks,
  letter: string,
  position: number,
): Marks => {
  const next = nextMark(getMark(marks, letter, position));
  if (next === "correct") {
    return {
      ...marks,
      [letter]: "present",
      [greenKey(letter, position)]: next,
    };
  }
  if (next === undefined) {
    return without(
      marks,
      ...Object.keys(marks).filter((key) => key[0] === letter),
    );
  }
  return { ...marks, [letter]: next };
};

export const isMarks = (value: unknown): value is Marks =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.entries(value).every(([key, status]) =>
    /^[A-Z]$/.test(key)
      ? CYCLE.includes(status) && status !== undefined
      : GREEN_KEY.test(key) && status === "correct",
  );

// Saved games from before green was per position marked whole letters
// green; those letters become yellow, which is all that is known.
export const upgradeMarks = (marks: Marks): Marks => {
  const result: Marks = {};
  Object.entries(marks).forEach(([key, status]) => {
    result[key] =
      /^[A-Z]$/.test(key) && status === "correct" ? "present" : status;
  });
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

// The player's marks with the forced red letters on top, green spots
// included.
export const withForcedAbsent = (marks: Marks, forced: Set<string>): Marks => {
  if (forced.size === 0) {
    return marks;
  }
  const result = without(
    marks,
    ...Object.keys(marks).filter((key) => forced.has(key[0])),
  );
  forced.forEach((letter) => {
    result[letter] = "absent";
  });
  return result;
};
