import { readFileSync } from "fs";
import { join } from "path";
import {
  getDayIndex,
  getMaxGuesses,
  getRandomWord,
  getSolutionLengthRange,
  getSolutions,
  getWordOfDay,
  isSolution,
  isWordInWordList,
  setWordLists,
} from "./words";
import { fitsLevel } from "./levels";

const read = (name: string) =>
  readFileSync(join(__dirname, "../../public/words", name), "utf8");
const solutionsText = read("solutions.txt");
const WORDS = solutionsText.split("\n").filter(Boolean);

beforeAll(() => setWordLists(solutionsText, read("guesses.txt")));

// Local dates, in whichever zone the test sets.
const at = (y: number, m: number, d: number, h = 12) =>
  new Date(y, m - 1, d, h);

// Node re-reads TZ whenever it changes.
const ORIGINAL_TZ = process.env.TZ;
const inZone = (tz: string, check: () => void) => {
  process.env.TZ = tz;
  try {
    check();
  } finally {
    process.env.TZ = ORIGINAL_TZ;
  }
};

test("9 November 2026 is day 0 and each day adds one", () => {
  inZone("UTC", () => {
    expect(getDayIndex(at(2026, 11, 9, 0))).toBe(0);
    expect(getDayIndex(at(2026, 11, 9, 23))).toBe(0);
    expect(getDayIndex(at(2026, 11, 10, 0))).toBe(1);
    expect(getDayIndex(at(2027, 1, 1))).toBe(53);
    expect(getDayIndex(at(2030, 2, 21))).toBe(1200);
  });
  // Across a daylight-saving change the count stays whole days.
  inZone("America/New_York", () => {
    expect(getDayIndex(at(2027, 4, 1))).toBe(143);
  });
});

test("west of UTC the word changes at local midnight", () => {
  inZone("America/Los_Angeles", () => {
    // 08:00 UTC on the 10th, still the 9th locally.
    expect(getDayIndex(at(2026, 11, 9, 0))).toBe(0);
    expect(getDayIndex(at(2026, 11, 9, 23))).toBe(0);
    expect(getDayIndex(at(2026, 11, 10, 0))).toBe(1);
  });
});

test("east of UTC the word changes at UTC midnight, never sooner", () => {
  inZone("Pacific/Kiritimati", () => {
    // UTC+14: 10 November local is still 9 November UTC until 14:00.
    expect(getDayIndex(at(2026, 11, 10, 0))).toBe(0);
    expect(getDayIndex(at(2026, 11, 10, 13))).toBe(0);
    expect(getDayIndex(at(2026, 11, 10, 14))).toBe(1);
  });
});

test("a clock set before the first day gets day 0", () => {
  expect(getDayIndex(at(2021, 6, 1))).toBe(0);
});

test("without daily lists, day N plays the level's solution N", () => {
  expect(getWordOfDay("advanced", 0)).toBe(WORDS[0].toUpperCase());
  expect(getWordOfDay("advanced", 1)).toBe(WORDS[1].toUpperCase());
  const standard = WORDS.filter((w) => fitsLevel(w, "standard"));
  expect(getWordOfDay("standard", 0)).toBe(standard[0].toUpperCase());
});

test("each level's answers follow its rules", () => {
  expect(fitsLevel("CRANE", "standard")).toBe(true);
  expect(fitsLevel("JUMBO", "standard")).toBe(false);
  expect(fitsLevel("JUMBO", "standard-plus")).toBe(true);
  expect(fitsLevel("APPLE", "standard-plus")).toBe(false);
  expect(fitsLevel("JAZZY", "advanced")).toBe(true);
  expect(getSolutions("advanced")).toHaveLength(WORDS.length);
  expect(getSolutions("standard").every((w) => fitsLevel(w, "standard"))).toBe(
    true,
  );
  expect(getSolutions("standard-plus").length).toBeGreaterThan(
    getSolutions("standard").length,
  );
  expect(isSolution("apple", "advanced")).toBe(true);
  expect(isSolution("apple", "standard-plus")).toBe(false);
  for (let i = 0; i < 20; i++) {
    expect(fitsLevel(getRandomWord("", "standard"), "standard")).toBe(true);
  }
});

const daily = (standard: string, standardPlus: string, advanced: string) => ({
  standard,
  "standard-plus": standardPlus,
  advanced,
});

describe("with a published daily list", () => {
  afterAll(() => setWordLists(solutionsText, read("guesses.txt")));

  test("day N plays line N, and days past the list stay on its last line", () => {
    setWordLists(
      solutionsText,
      "",
      daily("cat\ndog\n", "crane\njumbo\n", "apple\npizza\n"),
    );
    expect(getWordOfDay("standard", 0)).toBe("CAT");
    expect(getWordOfDay("standard-plus", 0)).toBe("CRANE");
    expect(getWordOfDay("advanced", 0)).toBe("APPLE");
    inZone("UTC", () => {
      expect(getDayIndex(at(2026, 11, 10))).toBe(1);
      expect(getDayIndex(at(2027, 6, 1))).toBe(1);
      expect(getWordOfDay("advanced", getDayIndex(at(2027, 6, 1)))).toBe(
        "PIZZA",
      );
    });
  });

  test("days stop at the shortest level list", () => {
    setWordLists(solutionsText, "", daily("cat\ndog\n", "crane\n", "apple\n"));
    inZone("UTC", () => {
      expect(getDayIndex(at(2027, 6, 1))).toBe(0);
    });
  });

  test("a daily list that is empty, not solutions, or off its level is refused", () => {
    const ok = "cat\n";
    expect(() => setWordLists(solutionsText, "", daily("", ok, ok))).toThrow();
    expect(() =>
      setWordLists(solutionsText, "", daily(ok, "<!doctype html>", ok)),
    ).toThrow();
    // APPLE repeats a letter, so it can never be a Standard answer.
    expect(() =>
      setWordLists(solutionsText, "", daily("apple\n", ok, ok)),
    ).toThrow();
  });
});

test("production loads the daily list; development does not fetch it", async () => {
  const fetched: string[] = [];
  const respond = (url: RequestInfo | URL) => {
    fetched.push(String(url));
    const body = String(url).includes("/daily-") ? "dog\n" : "cat\ndog\n";
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(body),
    } as Response);
  };
  const original = window.fetch;
  window.fetch = vi.fn(respond);
  try {
    vi.stubEnv("DEV", false);
    vi.resetModules();
    const prod = await import("./words");
    await prod.loadWords();
    expect(fetched).toEqual(
      expect.arrayContaining([
        "/words/daily-standard.txt",
        "/words/daily-standard-plus.txt",
        "/words/daily-advanced.txt",
      ]),
    );
    expect(prod.getWordOfDay("standard", 0)).toBe("DOG");

    fetched.length = 0;
    vi.stubEnv("DEV", true);
    vi.resetModules();
    const dev = await import("./words");
    await dev.loadWords();
    expect(fetched.some((url) => url.includes("/daily-"))).toBe(false);
    expect(dev.getWordOfDay("standard", 0)).toBe("CAT");
  } finally {
    window.fetch = original;
    vi.unstubAllEnvs();
  }
});

test("lookups are case-insensitive and cover both lists", () => {
  expect(isWordInWordList("CAT")).toBe(true);
  expect(isWordInWordList("aah")).toBe(true);
  expect(isWordInWordList("QWXZ")).toBe(false);
});

test("the length range comes from the level's solutions", () => {
  expect(getSolutionLengthRange()).toEqual({ shortest: 3, longest: 18 });
  expect(getSolutionLengthRange("standard")).toEqual({
    shortest: 3,
    longest: 12,
  });
});

test("max guesses are 2 × (length - 1), at least 8", () => {
  expect(getMaxGuesses("CAT")).toBe(8);
  expect(getMaxGuesses("CRANE")).toBe(8);
  expect(getMaxGuesses("PLANETS")).toBe(12);
  expect(getMaxGuesses("ABBREVIATION")).toBe(22);
});
