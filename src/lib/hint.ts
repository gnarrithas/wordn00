import { getScore, isSameScore } from "./score";

// Whether `word` could still be the answer: it would have given every earlier
// guess the score that guess got.
export const fitsScores = (word: string, guesses: string[], solution: string) =>
  guesses.every((previous) =>
    isSameScore(getScore(previous, word), getScore(previous, solution)),
  );

// A word, picked at random from `candidates`, that fits every earlier score
// and has not been guessed yet. Null when nothing fits.
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
      (word) => !guessed.has(word) && fitsScores(word, guesses, solution),
    );
  return fitting.length === 0
    ? null
    : fitting[Math.floor(random() * fitting.length)];
};
