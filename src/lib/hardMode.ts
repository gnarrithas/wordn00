import { ordinal } from "./ordinal";
import { getGuessStatuses } from "./statuses";

// Hard mode, as in Wordle: green letters stay in their spot and yellow
// letters must be reused. Returns the first broken rule, or null.
export const findHardModeViolation = (
  guess: string,
  guesses: string[],
  solution: string,
): string | null => {
  const fixed = new Map<number, string>();
  // Fewest copies of each letter the answer is known to contain.
  const required = new Map<string, number>();

  guesses.forEach((previous) => {
    const statuses = getGuessStatuses(previous, solution);
    const counts = new Map<string, number>();
    previous.split("").forEach((letter, i) => {
      if (statuses[i] === "correct") {
        fixed.set(i, letter);
      }
      if (statuses[i] !== "absent") {
        counts.set(letter, (counts.get(letter) ?? 0) + 1);
      }
    });
    counts.forEach((n, letter) =>
      required.set(letter, Math.max(required.get(letter) ?? 0, n)),
    );
  });

  const positions = Array.from(fixed.keys()).sort((a, b) => a - b);
  for (const i of positions) {
    if (guess[i] !== fixed.get(i)) {
      return `${ordinal(i + 1)} letter must be ${fixed.get(i)}`;
    }
  }
  for (const [letter, n] of Array.from(required)) {
    const have = guess.split("").filter((c) => c === letter).length;
    if (have < n) {
      return n === 1
        ? `Guess must contain ${letter}`
        : `Guess must contain ${n} ${letter}s`;
    }
  }
  return null;
};
