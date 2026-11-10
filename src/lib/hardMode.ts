import { getScore, isSameScore } from "./score";

// Hard mode: every guess must still be a possible answer, i.e. it would have
// given each earlier guess the score that guess got. Returns the first broken
// rule, or null.
export const findHardModeViolation = (
  guess: string,
  guesses: string[],
  solution: string,
): string | null => {
  const index = guesses.findIndex(
    (previous) =>
      !isSameScore(getScore(previous, guess), getScore(previous, solution)),
  );
  return index === -1 ? null : `Guess must fit the score of guess ${index + 1}`;
};
