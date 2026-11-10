import { cycleMark, isMarks, nextMark } from "./marks";

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
