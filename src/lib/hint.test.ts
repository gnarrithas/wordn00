import { findHint, fitsScores } from "./hint";

const WORDS = ["crane", "class", "plumb", "champ", "cat", "catalog"];

test("only words that fit every earlier score are hinted", () => {
  // CHAMP vs CRANE: 2 correct, 0 present, 3 absent. CLASS and CRANE fit.
  const hints = new Set(
    [0, 0.49, 0.99].map((r) => findHint(["CHAMP"], "CRANE", WORDS, () => r)),
  );
  expect(hints).toEqual(new Set(["CLASS", "CRANE"]));
});

test("words already guessed are skipped", () => {
  expect(findHint(["CAT"], "CATALOG", ["cat", "catalog"])).toBe("CATALOG");
});

test("null when nothing fits", () => {
  expect(findHint(["CHAMP"], "CRANE", ["plumb"])).toBeNull();
});

test("a word fits when it would give every earlier guess its score", () => {
  // CHAMP vs CRANE: 2 correct, 0 present, 3 absent.
  expect(fitsScores("PLUMB", [], "CRANE")).toBe(true);
  expect(fitsScores("CLASS", ["CHAMP"], "CRANE")).toBe(true);
  expect(fitsScores("SCALP", ["CHAMP"], "CRANE")).toBe(false);
  expect(fitsScores("CLASS", ["CHAMP", "BRINE"], "CRANE")).toBe(false);
});

test("the length counts too", () => {
  // CAT vs CATALOG: 3 correct; CATS would also score 3 correct.
  expect(fitsScores("CATS", ["CAT"], "CATALOG")).toBe(true);
  // CATALOGS vs CATALOG: 7 correct, 1 absent; CATS would leave S present.
  expect(fitsScores("CATALOGUE", ["CATALOGS"], "CATALOG")).toBe(true);
  expect(fitsScores("CATS", ["CATALOGS"], "CATALOG")).toBe(false);
});
