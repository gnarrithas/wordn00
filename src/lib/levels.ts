// Levels, as on Word500: each limits which solutions can be the answer.
// Guesses are never limited.
export type Level = "standard" | "standard-plus" | "advanced";

export type LevelInfo = {
  level: Level;
  name: string;
  // One line per rule, as shown in Settings.
  rules: string[];
};

export const LEVELS: readonly LevelInfo[] = [
  {
    level: "standard",
    name: "Standard",
    rules: ["No repeated letters", "No J, Q, X or Z"],
  },
  { level: "standard-plus", name: "Standard+", rules: ["No repeated letters"] },
  { level: "advanced", name: "Advanced", rules: ["Anything goes"] },
];

export const DEFAULT_LEVEL: Level = "standard";

// Must match LEVELS in scripts/shuffle_solutions.py.
const LEVEL_RULES: Record<Level, { repeats: boolean; banned: string }> = {
  standard: { repeats: false, banned: "jqxz" },
  "standard-plus": { repeats: false, banned: "" },
  advanced: { repeats: true, banned: "" },
};

// Letters no answer at the level can contain, upper case.
export const getExcludedLetters = (level: Level): ReadonlySet<string> =>
  new Set(LEVEL_RULES[level].banned.toUpperCase());

export const isLevel = (value: unknown): value is Level =>
  typeof value === "string" && value in LEVEL_RULES;

export const getLevelName = (level: Level) =>
  LEVELS.find((info) => info.level === level)!.name;

// Whether the level allows `word` as an answer.
export const fitsLevel = (word: string, level: Level) => {
  const lower = word.toLowerCase();
  const { repeats, banned } = LEVEL_RULES[level];
  if (!repeats && new Set(lower).size !== lower.length) {
    return false;
  }
  return ![...lower].some((letter) => banned.includes(letter));
};
