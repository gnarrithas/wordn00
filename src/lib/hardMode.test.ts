import { findHardModeViolation } from "./hardMode";

const check = (guess: string, guesses: string[], solution = "CRANE") =>
  findHardModeViolation(guess, guesses, solution);

test("no previous guesses: anything goes", () => {
  expect(check("PLUMB", [])).toBeNull();
});

test("a guess that would give every earlier guess its score is allowed", () => {
  // CHAMP vs CRANE: 2 correct, 0 present, 3 absent.
  expect(check("CRANE", ["CHAMP"])).toBeNull();
  expect(check("CLASS", ["CHAMP"])).toBeNull();
});

test("the first earlier guess it contradicts is named", () => {
  expect(check("SCALP", ["CHAMP"])).toBe("Guess must fit the score of guess 1");
  expect(check("CLASS", ["CHAMP", "BRINE"])).toBe(
    "Guess must fit the score of guess 2",
  );
});

test("the length counts too", () => {
  // CAT vs CATALOG: 3 correct; CATS would also score 3 correct.
  expect(check("CATS", ["CAT"], "CATALOG")).toBeNull();
  // CATALOGS vs CATALOG: 7 correct, 1 absent; CATS would leave S present.
  expect(check("CATALOGUE", ["CATALOGS"], "CATALOG")).toBeNull();
  expect(check("CATS", ["CATALOGS"], "CATALOG")).toBe(
    "Guess must fit the score of guess 1",
  );
});
