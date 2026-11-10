import { CharStatus } from "./statuses";

// A guess is scored with three counts instead of coloured tiles:
// - correct: letters in the same position of the hidden word, counting from
//   the left (positions past the end of either word never match);
// - present: other letters the hidden word has, each of its copies used once;
// - absent: the rest of the guess.
export type Score = { correct: number; present: number; absent: number };

export const getScore = (guess: string, solution: string): Score => {
  let correct = 0;
  // Unmatched letters left over on each side, by letter.
  const guessLeft = new Map<string, number>();
  const solutionLeft = new Map<string, number>();
  const bump = (map: Map<string, number>, letter: string) =>
    map.set(letter, (map.get(letter) ?? 0) + 1);

  for (let i = 0; i < Math.max(guess.length, solution.length); i++) {
    if (i < guess.length && guess[i] === solution[i]) {
      correct++;
      continue;
    }
    if (i < guess.length) {
      bump(guessLeft, guess[i]);
    }
    if (i < solution.length) {
      bump(solutionLeft, solution[i]);
    }
  }

  let present = 0;
  guessLeft.forEach((n, letter) => {
    present += Math.min(n, solutionLeft.get(letter) ?? 0);
  });
  return { correct, present, absent: guess.length - correct - present };
};

export const isSameScore = (a: Score, b: Score) =>
  a.correct === b.correct && a.present === b.present && a.absent === b.absent;

// The end-of-game reveal: each letter of a guess coloured as in Wordle, with
// the same matching rules as getScore. Letters in place are correct; the
// others are present while the hidden word has unmatched copies left,
// claimed left to right, and absent after that.
export const getGuessStatuses = (
  guess: string,
  solution: string,
): CharStatus[] => {
  const solutionLeft = new Map<string, number>();
  for (let i = 0; i < solution.length; i++) {
    if (guess[i] !== solution[i]) {
      solutionLeft.set(solution[i], (solutionLeft.get(solution[i]) ?? 0) + 1);
    }
  }
  return guess.split("").map((letter, i) => {
    if (letter === solution[i]) {
      return "correct";
    }
    const left = solutionLeft.get(letter) ?? 0;
    if (left > 0) {
      solutionLeft.set(letter, left - 1);
      return "present";
    }
    return "absent";
  });
};
