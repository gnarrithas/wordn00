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

test("red and yellow mark every copy of a letter", () => {
  let marks = cycleMark({}, "C", 0);
  expect(getMark(marks, "C", 3)).toBe("absent");
  marks = cycleMark(marks, "C", 0);
  expect(getMark(marks, "C", 3)).toBe("present");
  expect(getKeyMark(marks, "C")).toBe("present");
});

test("green marks one spot only, leaving the other copies yellow", () => {
  let marks: Marks = { C: "present" };
  marks = cycleMark(marks, "C", 0);
  expect(getMark(marks, "C", 0)).toBe("correct");
  expect(getMark(marks, "C", 2)).toBe("present");
  expect(getKeyMark(marks, "C")).toBe("correct");
  // A yellow copy elsewhere turns green on its own.
  marks = cycleMark(marks, "C", 2);
  expect(getMark(marks, "C", 0)).toBe("correct");
  expect(getMark(marks, "C", 2)).toBe("correct");
  expect(getMark(marks, "C", 1)).toBe("present");
  // Back to blank: that spot, and the plain copies; the other green stays.
  marks = cycleMark(marks, "C", 0);
  expect(getMark(marks, "C", 0)).toBeUndefined();
  expect(getMark(marks, "C", 1)).toBeUndefined();
  expect(getMark(marks, "C", 2)).toBe("correct");
});

test("cycleMark leaves other letters alone", () => {
  expect(cycleMark({ A: "absent" }, "B", 1)).toEqual({
    A: "absent",
    B: "absent",
  });
});

test("isMarks accepts letters and green spots with a known status", () => {
  expect(isMarks({})).toBe(true);
  expect(isMarks({ A: "present", A3: "correct", B12: "correct" })).toBe(true);
  expect(isMarks({ A3: "present" })).toBe(false);
  expect(isMarks({ A123: "correct" })).toBe(false);
  expect(isMarks({ a: "present" })).toBe(false);
  expect(isMarks({ A: "green" })).toBe(false);
  expect(isMarks([])).toBe(false);
  expect(isMarks(null)).toBe(false);
});

test("upgradeMarks turns old whole-letter greens yellow", () => {
  expect(upgradeMarks({ A: "correct", B: "absent", C2: "correct" })).toEqual({
    A: "present",
    B: "absent",
    C2: "correct",
  });
});

test("getForcedAbsent takes every letter of the all-red guesses only", () => {
  expect(getForcedAbsent(["DOG", "CAR", "MUD"], "CAT")).toEqual(
    new Set(["D", "O", "G", "M", "U"]),
  );
  expect(getForcedAbsent([], "CAT").size).toBe(0);
});

test("withForcedAbsent marks forced letters red over the player's marks", () => {
  expect(
    withForcedAbsent(
      { D: "present", D1: "correct", C: "present" },
      new Set(["D", "O"]),
    ),
  ).toEqual({ D: "absent", O: "absent", C: "present" });
  const marks = { C: "present" as const };
  expect(withForcedAbsent(marks, new Set())).toBe(marks);
});
