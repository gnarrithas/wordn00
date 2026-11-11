import {
  cycleMark,
  getForcedAbsent,
  getKeyMark,
  getMark,
  isMarks,
  Marks,
  nextMark,
  upgradeMarks,
  withForcedAbsent,
} from "./marks";

test("marks cycle absent, present, correct, then clear", () => {
  expect(nextMark(undefined)).toBe("absent");
  expect(nextMark("absent")).toBe("present");
  expect(nextMark("present")).toBe("correct");
  expect(nextMark("correct")).toBeUndefined();
});

test("a tap colours only that tile", () => {
  // METH / SILHOUETTE: one hit each; the player picks which E counts.
  let marks = cycleMark({}, 1, 6);
  marks = cycleMark(marks, 1, 6);
  expect(getMark(marks, 1, 6)).toBe("present");
  expect(getMark(marks, 1, 9)).toBeUndefined();
  expect(getMark(marks, 0, 1)).toBeUndefined();
  marks = cycleMark(cycleMark(marks, 1, 6), 1, 6);
  expect(marks).toEqual({});
});

test("cycleMark leaves other tiles alone", () => {
  expect(cycleMark({ "0-0": "absent" }, 0, 1)).toEqual({
    "0-0": "absent",
    "0-1": "absent",
  });
});

test("a key shows the strongest mark among its letter's tiles", () => {
  const guesses = ["METH", "SILHOUETTE"];
  expect(getKeyMark({}, guesses, "E")).toBeUndefined();
  expect(getKeyMark({ "1-9": "absent" }, guesses, "E")).toBe("absent");
  const marks: Marks = { "1-9": "absent", "0-1": "present" };
  expect(getKeyMark(marks, guesses, "E")).toBe("present");
  expect(getKeyMark({ ...marks, "1-6": "correct" }, guesses, "E")).toBe(
    "correct",
  );
  expect(getKeyMark(marks, guesses, "M")).toBeUndefined();
});

test("isMarks accepts tile keys and old letter keys", () => {
  expect(isMarks({})).toBe(true);
  expect(isMarks({ "0-3": "present", "12-10": "absent" })).toBe(true);
  expect(isMarks({ A: "present", A3: "correct", B12: "correct" })).toBe(true);
  expect(isMarks({ A3: "present" })).toBe(false);
  expect(isMarks({ "0-123": "absent" })).toBe(false);
  expect(isMarks({ a: "present" })).toBe(false);
  expect(isMarks({ "0-0": "green" })).toBe(false);
  expect(isMarks([])).toBe(false);
  expect(isMarks(null)).toBe(false);
});

test("upgradeMarks spreads old letter marks onto their tiles", () => {
  expect(
    upgradeMarks(
      { C: "present", C0: "correct", A: "correct", T: "absent" },
      ["CAT", "ARC"],
    ),
  ).toEqual({
    "0-0": "correct",
    "0-1": "present",
    "0-2": "absent",
    "1-0": "present",
    "1-2": "present",
  });
  const marks = { "0-1": "absent" as const };
  expect(upgradeMarks(marks, ["CAT"])).toEqual(marks);
});

test("getForcedAbsent takes every letter of the all-red guesses only", () => {
  expect(getForcedAbsent(["DOG", "CAR", "MUD"], "CAT")).toEqual(
    new Set(["D", "O", "G", "M", "U"]),
  );
  expect(getForcedAbsent([], "CAT").size).toBe(0);
});

test("withForcedAbsent marks every tile of a forced letter red", () => {
  expect(
    withForcedAbsent(
      { "0-0": "present", "1-1": "correct" },
      ["DOG", "CAD"],
      new Set(["D", "O"]),
    ),
  ).toEqual({
    "0-0": "absent",
    "0-1": "absent",
    "1-1": "correct",
    "1-2": "absent",
  });
  const marks = { "0-0": "present" as const };
  expect(withForcedAbsent(marks, ["CAT"], new Set())).toBe(marks);
});
