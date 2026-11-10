import { findHint } from "./hint";

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
