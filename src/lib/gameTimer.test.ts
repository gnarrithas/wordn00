import {
  IDLE_CAP_MS,
  loadActiveMs,
  pauseTimer,
  recordAction,
  resumeTimer,
  saveActiveMs,
  startTimer,
} from "./gameTimer";

beforeEach(() => window.localStorage.clear());

test("actions add the time since the previous one", () => {
  let timer = startTimer(1000);
  timer = recordAction(timer, 4000);
  timer = recordAction(timer, 4500);
  expect(timer).toEqual({ activeMs: 3500, lastActionAt: 4500 });
});

test("idle gaps are capped and clock skew adds nothing", () => {
  let timer = startTimer(0, 100);
  timer = recordAction(timer, IDLE_CAP_MS * 10);
  expect(timer.activeMs).toBe(100 + IDLE_CAP_MS);
  timer = recordAction(timer, 0);
  expect(timer.activeMs).toBe(100 + IDLE_CAP_MS);
});

test("hidden time is not counted", () => {
  let timer = startTimer(0);
  timer = pauseTimer(timer, 5000);
  expect(timer).toEqual({ activeMs: 5000, lastActionAt: null });
  // An action while paused (should not happen) adds nothing.
  expect(recordAction(timer, 9000).activeMs).toBe(5000);
  timer = resumeTimer(timer, 100_000);
  timer = recordAction(timer, 101_000);
  expect(timer.activeMs).toBe(6000);
});

test("the saved total belongs to one solution", () => {
  saveActiveMs("CAT", 4200);
  expect(loadActiveMs("CAT")).toBe(4200);
  expect(loadActiveMs("DOG")).toBe(0);
});

test("malformed saved totals are ignored", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  for (const raw of ["{", "null", '{"solution":"CAT","activeMs":-1}']) {
    window.localStorage.setItem("gameTimer", raw);
    expect(loadActiveMs("CAT")).toBe(0);
  }
  warn.mockRestore();
});
