import { Level } from "./levels";
import { isMarks, Marks, upgradeMarks } from "./marks";

// Game progress survives reloads. Storage can be unavailable (private mode,
// quota, disabled cookies); the game then simply starts fresh each visit.
export type SavedGame = {
  solution: string;
  guesses: string[];
  isGameWon: boolean;
  isAnswerRevealed: boolean;
  // Daily sequence index, or null for a New word game.
  day: number | null;
  // The player's own tile marks (see marks.ts).
  marks: Marks;
};

// The daily game and a New word game are kept apart, so playing a random
// word never overwrites today's progress or result; so are the levels.
// Advanced keeps the keys of the games saved before levels existed, which
// it plays the same words as.
const levelSuffix = (level: Level) => (level === "advanced" ? "" : `-${level}`);
const dailyKey = (level: Level) => `game${levelSuffix(level)}`;
const practiceKey = (level: Level) => `practice${levelSuffix(level)}`;

const isSavedGame = (value: unknown): value is SavedGame => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const game = value as Record<string, unknown>;
  return (
    typeof game.solution === "string" &&
    game.solution.length > 0 &&
    Array.isArray(game.guesses) &&
    game.guesses.every((guess) => typeof guess === "string") &&
    typeof game.isGameWon === "boolean" &&
    typeof game.isAnswerRevealed === "boolean" &&
    (game.day === null ||
      (typeof game.day === "number" && Number.isInteger(game.day))) &&
    (game.marks === undefined || isMarks(game.marks))
  );
};

const loadFrom = (key: string): SavedGame | null => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isSavedGame(parsed)) {
      console.warn("Ignoring malformed saved game");
      return null;
    }
    return {
      ...parsed,
      marks: upgradeMarks(parsed.marks ?? {}, parsed.guesses),
    };
  } catch (err) {
    console.warn("Could not load saved game", err);
    return null;
  }
};

export const loadDailyGame = (level: Level) => {
  const game = loadFrom(dailyKey(level));
  return game && game.day !== null ? game : null;
};

export const loadPracticeGame = (level: Level) => {
  const game = loadFrom(practiceKey(level));
  return game && game.day === null ? game : null;
};

export const saveGame = (game: SavedGame, level: Level) => {
  try {
    localStorage.setItem(
      game.day === null ? practiceKey(level) : dailyKey(level),
      JSON.stringify(game),
    );
  } catch (err) {
    console.warn("Could not save game", err);
  }
};

export const clearPracticeGame = (level: Level) => {
  try {
    localStorage.removeItem(practiceKey(level));
  } catch (err) {
    console.warn("Could not clear saved New word game", err);
  }
};
