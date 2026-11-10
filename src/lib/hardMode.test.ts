import { findHardModeViolation } from "./hardMode";

const check = (guess: string, guesses: string[], solution = "CRANE") =>
  findHardModeViolation(guess, guesses, solution);

test("no previous guesses: anything goes", () => {
  expect(check("PLUMB", [])).toBeNull();
});

test("green letters must stay in place", () => {
  // C and A are green in CHAMP vs CRANE.
  expect(check("CLASP", ["CHAMP"])).toBeNull();
  expect(check("SCALP", ["CHAMP"])).toBe("1st letter must be C");
  expect(check("CLOTH", ["CHAMP"])).toBe("3rd letter must be A");
});

test("a green past the end of a shorter guess rejects it", () => {
  expect(check("CRA", ["CRANES"])).toBe("4th letter must be N");
});

test("yellow letters must be reused", () => {
  // E, N and R are yellow in ENTRY vs CRANE.
  expect(check("RANGE", ["ENTRY"])).toBeNull();
  expect(check("SPOIL", ["ENTRY"])).toBe("Guess must contain E");
});

test("repeated hints require repeated letters", () => {
  // EERIE vs GEESE: the 2nd and 5th Es are green, the 1st is yellow.
  expect(check("EXTRA", ["EERIE"], "GEESE")).toBe("2nd letter must be E");
  expect(check("SEEDS", ["ELDER"], "GEESE")).toBeNull();
  expect(check("SEDAN", ["ELDER"], "GEESE")).toBe("Guess must contain 2 Es");
});

test("absent letters may be guessed again", () => {
  expect(check("PLUMB", ["PLUMS"])).toBeNull();
});
