import {
  cycleMark,
  getForcedAbsent,
  isMarks,
  nextMark,
  withForcedAbsent,
} from "./marks";

test("marks cycle absent, present, correct, then clear", () => {
  expect(nextMark(undefined)).toBe("absent");
  expect(nextMark("absent")).toBe("present");
  expect(nextMark("present")).toBe("correct");
  expect(nextMark("correct")).toBeUndefined();
});

test("cycleMark only touches the given letter and drops cleared marks", () => {
  expect(cycleMark({ A: "absent" }, "B")).toEqual({ A: "absent", B: "absent" });
  expect(cycleMark({ A: "correct", B: "absent" }, "A")).toEqual({
    B: "absent",
  });
});

test("isMarks accepts only uppercase letters with a known status", () => {
  expect(isMarks({})).toBe(true);
  expect(isMarks({ A: "present" })).toBe(true);
  expect(isMarks({ a: "present" })).toBe(false);
  expect(isMarks({ A: "green" })).toBe(false);
  expect(isMarks([])).toBe(false);
  expect(isMarks(null)).toBe(false);
});

test("getForcedAbsent takes every letter of the all-red guesses only", () => {
  expect(getForcedAbsent(["DOG", "CAR", "MUD"], "CAT")).toEqual(
    new Set(["D", "O", "G", "M", "U"]),
  );
  expect(getForcedAbsent([], "CAT").size).toBe(0);
});

test("withForcedAbsent marks forced letters red over the player's marks", () => {
  expect(
    withForcedAbsent({ D: "correct", C: "present" }, new Set(["D", "O"])),
  ).toEqual({ D: "absent", O: "absent", C: "present" });
  const marks = { C: "present" as const };
  expect(withForcedAbsent(marks, new Set())).toBe(marks);
});
