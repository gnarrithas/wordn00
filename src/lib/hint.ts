import { findHardModeViolation } from "./hardMode";

// A word, picked at random from `candidates`, that would have given every
// earlier guess the score it got and has not been guessed yet. Null when
// nothing fits.
export const findHint = (
  guesses: string[],
  solution: string,
  candidates: readonly string[],
  random = Math.random,
): string | null => {
  const guessed = new Set(guesses);
  const fitting = candidates
    .map((word) => word.toUpperCase())
    .filter(
      (word) =>
        !guessed.has(word) &&
        findHardModeViolation(word, guesses, solution) === null,
    );
  return fitting.length === 0
    ? null
    : fitting[Math.floor(random() * fitting.length)];
};
