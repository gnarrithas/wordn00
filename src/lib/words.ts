import { MIN_GUESSES } from "../constants/settings";

const MS_IN_DAY = 86400000;
// Day 0 of the daily sequence: 9 November 2026 (months count from 0). Must
// match FIRST_DAY in scripts/shuffle_solutions.py.
const FIRST_DAY_UTC = Date.UTC(2026, 10, 9);

// The word lists are served as plain text from public/words/ and fetched at
// startup instead of being bundled into the JavaScript.
type WordLists = {
  solutions: string[];
  solutionSet: Set<string>;
  guessSet: Set<string>;
  shortest: number;
  longest: number;
  // Line N is day N's word. Deploys publish it daily, up to today (UTC) only.
  daily: string[];
};

let lists: WordLists | undefined;
let loading: Promise<void> | undefined;

const parseList = (text: string) =>
  text
    .split(/\r?\n/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 0);

// Installs the lists from their file contents (also used by tests). Without
// a daily list (development), days walk through the solutions in order.
export const setWordLists = (
  solutionsText: string,
  guessesText: string,
  dailyText?: string,
) => {
  const solutions = parseList(solutionsText);
  if (solutions.length === 0) {
    throw new Error("The solution list is empty");
  }
  let shortest = Infinity;
  let longest = 0;
  for (const word of solutions) {
    shortest = Math.min(shortest, word.length);
    longest = Math.max(longest, word.length);
  }
  const solutionSet = new Set(solutions);
  const daily = dailyText === undefined ? solutions : parseList(dailyText);
  // Also rejects an HTML page served in place of a missing file.
  if (daily.length === 0 || !daily.every((word) => solutionSet.has(word))) {
    throw new Error("The daily list is empty or not made of solutions");
  }
  lists = {
    solutions,
    solutionSet,
    guessSet: new Set(parseList(guessesText)),
    shortest,
    longest,
    daily,
  };
};

// BASE_URL always ends in "/", and every path starts with one.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const fetchText = async (path: string) => {
  const response = await fetch(`${BASE}${path}`);
  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status}`);
  }
  return response.text();
};

export const areWordsLoaded = () => lists !== undefined;

// Fetches both lists once; a failed load can be retried by calling it again.
export const loadWords = () => {
  if (!loading) {
    // Development has no daily list; production cannot work without one.
    loading = Promise.all([
      fetchText("/words/solutions.txt"),
      fetchText("/words/guesses.txt"),
      import.meta.env.DEV ? undefined : fetchText("/words/daily.txt"),
    ])
      .then(([solutions, guesses, daily]) =>
        setWordLists(solutions, guesses, daily),
      )
      .catch((err) => {
        loading = undefined;
        throw err;
      });
  }
  return loading;
};

const getLists = () => {
  if (!lists) {
    throw new Error("Word lists used before loadWords() finished");
  }
  return lists;
};

// Shortest and longest possible solution.
export const getSolutionLengthRange = () => {
  const { shortest, longest } = getLists();
  return { shortest, longest };
};

// Twice one less than the word's length; shorter words get a floor.
export const getMaxGuesses = (solution: string) =>
  Math.max(MIN_GUESSES, 2 * (solution.length - 1));

export const isWordInWordList = (word: string) => {
  const { solutionSet, guessSet } = getLists();
  const lower = word.toLowerCase();
  return solutionSet.has(lower) || guessSet.has(lower);
};

// Every possible answer, lower case.
export const getSolutions = (): readonly string[] => getLists().solutions;

export const isSolution = (word: string) =>
  getLists().solutionSet.has(word.toLowerCase());

// Days since the first day, by the earlier of the player's calendar date and
// the UTC date. Deploys publish words up to the UTC date only, so tomorrow's
// word is never public: the word changes at local midnight west of UTC, and
// at UTC midnight east of it. Clocks set before the first day get day 0, and
// clocks set past the last published day get that day.
export const getDayIndex = (now = new Date()) => {
  const local = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const utc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const day = Math.round((Math.min(local, utc) - FIRST_DAY_UTC) / MS_IN_DAY);
  return Math.min(Math.max(0, day), getLists().daily.length - 1);
};

export const getWordOfDay = (day = getDayIndex()) =>
  getLists().daily[day].toUpperCase();

export const getRandomWord = (exclude: string) => {
  const { solutions } = getLists();
  if (solutions.length < 2) {
    return solutions[0].toUpperCase();
  }
  let word = exclude;
  while (word === exclude) {
    word =
      solutions[Math.floor(Math.random() * solutions.length)].toUpperCase();
  }
  return word;
};
