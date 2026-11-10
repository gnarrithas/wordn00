import {
  canRedo,
  canUndo,
  recordMarks,
  redoMarks,
  startHistory,
  undoMarks,
} from "./marksHistory";

test("undo and redo step through recorded marks", () => {
  let h = startHistory({});
  expect(canUndo(h)).toBe(false);
  h = recordMarks(h, { A: "absent" });
  h = recordMarks(h, { A: "present" });
  h = undoMarks(h);
  expect(h.present).toEqual({ A: "absent" });
  h = undoMarks(h);
  expect(h.present).toEqual({});
  expect(canUndo(h)).toBe(false);
  expect(undoMarks(h)).toBe(h);
  h = redoMarks(redoMarks(h));
  expect(h.present).toEqual({ A: "present" });
  expect(canRedo(h)).toBe(false);
  expect(redoMarks(h)).toBe(h);
});

test("a new change after undo drops the redo steps", () => {
  let h = recordMarks(startHistory({}), { A: "absent" });
  h = undoMarks(h);
  h = recordMarks(h, { B: "correct" });
  expect(canRedo(h)).toBe(false);
  expect(undoMarks(h).present).toEqual({});
});

test("recording the same state adds no step", () => {
  const h = startHistory({ A: "absent" });
  expect(recordMarks(h, h.present)).toBe(h);
});
