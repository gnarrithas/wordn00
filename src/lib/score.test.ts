import { getGuessStatuses, getScore, isSameScore } from "./score";

const score = (guess: string, solution: string) => {
  const { correct, present, absent } = getScore(guess, solution);
  return [correct, present, absent];
};

test("counts letters in place, elsewhere and missing", () => {
  expect(score("CRANE", "CRANE")).toEqual([5, 0, 0]);
  expect(score("NACRE", "CRANE")).toEqual([1, 4, 0]);
  expect(score("PLUMB", "CRANE")).toEqual([0, 0, 5]);
  expect(score("CHAMP", "CRANE")).toEqual([2, 0, 3]);
});

test("each copy of a letter in the word matches once", () => {
  // EERIE vs GEESE: the 2nd and 5th Es are in place, the 1st is elsewhere.
  expect(score("EERIE", "GEESE")).toEqual([2, 1, 2]);
  expect(score("EEEEE", "CRANE")).toEqual([1, 0, 4]);
  expect(score("ABBEY", "BOBBY")).toEqual([2, 1, 2]);
});

test("guesses and words of different lengths line up from the left", () => {
  expect(score("CAT", "CATALOG")).toEqual([3, 0, 0]);
  expect(score("CATALOG", "CAT")).toEqual([3, 0, 4]);
  expect(score("TAC", "CATALOG")).toEqual([1, 2, 0]);
});

test("the counts always add up to the guess length", () => {
  for (const [guess, solution] of [
    ["ABRACADABRA", "CANDELABRA"],
    ["XYZ", "AARDVARK"],
  ]) {
    const { correct, present, absent } = getScore(guess, solution);
    expect(correct + present + absent).toBe(guess.length);
  }
});

test("isSameScore compares all three counts", () => {
  expect(
    isSameScore(getScore("NACRE", "CRANE"), getScore("NACRE", "CRANE")),
  ).toBe(true);
  expect(
    isSameScore(getScore("NACRE", "CRANE"), getScore("NACRE", "CRATE")),
  ).toBe(false);
});

test("getGuessStatuses colours each letter as in Wordle", () => {
  expect(getGuessStatuses("WEARY", "TIGER")).toEqual([
    "absent",
    "present",
    "absent",
    "present",
    "absent",
  ]);
  // A letter in place claims its copy before an earlier misplaced one.
  expect(getGuessStatuses("EERIE", "THREE")).toEqual([
    "present",
    "absent",
    "correct",
    "absent",
    "correct",
  ]);
});

test("getGuessStatuses agrees with getScore for any lengths", () => {
  const pairs = [
    ["CAT", "CATALOG"],
    ["CATALOG", "CAT"],
    ["LEVEL", "EEL"],
    ["BANANA", "ANNAL"],
  ];
  for (const [guess, solution] of pairs) {
    const statuses = getGuessStatuses(guess, solution);
    const count = (s: string) => statuses.filter((x) => x === s).length;
    expect({
      correct: count("correct"),
      present: count("present"),
      absent: count("absent"),
    }).toEqual(getScore(guess, solution));
  }
});
