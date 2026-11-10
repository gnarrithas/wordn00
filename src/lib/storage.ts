// Game progress survives reloads. Storage can be unavailable (private mode,
// quota, disabled cookies); the game then simply starts fresh each visit.
export type SavedGame = {
  solution: string;
  guesses: string[];
  isGameWon: boolean;
  isAnswerRevealed: boolean;
  // Daily sequence index, or null for a New word game.
  day: number | null;
};

// The daily game and a New word game are kept apart, so playing a random
// word never overwrites today's progress or result.
const DAILY_KEY = "game";
const PRACTICE_KEY = "practice";

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
      (typeof game.day === "number" && Number.isInteger(game.day)))
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
    return parsed;
  } catch (err) {
    console.warn("Could not load saved game", err);
    return null;
  }
};

export const loadDailyGame = () => {
  const game = loadFrom(DAILY_KEY);
  return game && game.day !== null ? game : null;
};

export const loadPracticeGame = () => {
  const game = loadFrom(PRACTICE_KEY);
  return game && game.day === null ? game : null;
};

export const saveGame = (game: SavedGame) => {
  try {
    localStorage.setItem(
      game.day === null ? PRACTICE_KEY : DAILY_KEY,
      JSON.stringify(game),
    );
  } catch (err) {
    console.warn("Could not save game", err);
  }
};

export const clearPracticeGame = () => {
  try {
    localStorage.removeItem(PRACTICE_KEY);
  } catch (err) {
    console.warn("Could not clear saved New word game", err);
  }
};
