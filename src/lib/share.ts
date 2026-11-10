import { getLevelName, Level } from "./levels";
import { getScore, Score } from "./score";

const EMOJI: Record<keyof Score, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "🟥",
};

// High contrast mode's colours (see index.css): orange, blue and grey.
const HIGH_CONTRAST_EMOJI: Record<keyof Score, string> = {
  correct: "🟧",
  present: "🟦",
  absent: "⬜",
};

const SCORE_ORDER: (keyof Score)[] = ["correct", "present", "absent"];

export const countLetters = (guesses: string[]) =>
  guesses.reduce((total, guess) => total + guess.length, 0);

// Result: "Wordn00 <number> · <level> · <letters>", then each guess's
// score, e.g.
// "🟩2 🟨1 🟥2". The
// guess count and limit are left out: the limit gives away the word's length.
// Numbers start at 1 for day index 0; games off the daily sequence (dev New
// word) have none.
export const getShareText = (
  day: number | null,
  level: Level,
  guesses: string[],
  solution: string,
  highContrast = false,
  url?: string,
) => {
  const emoji = highContrast ? HIGH_CONTRAST_EMOJI : EMOJI;
  const rows = guesses.map((guess) => {
    const score = getScore(guess, solution);
    return SCORE_ORDER.map((key) => `${emoji[key]}${score[key]}`).join(" ");
  });
  const letters = countLetters(guesses);
  const title =
    day === null ? "Wordn00" : `Wordn00 ${(day + 1).toLocaleString("en-US")}`;
  const header = `${title} · ${getLevelName(level)} · ${letters} ${
    letters === 1 ? "letter" : "letters"
  }`;
  const footer = url ? ["", url] : [];
  return [header, "", ...rows, ...footer].join("\n");
};

// The site root as served (e.g. https://user.github.io/wordn00/), so the
// shared link follows the deployment without hardcoding it.
export const getSiteUrl = () =>
  new URL(import.meta.env.BASE_URL, window.location.origin).href;

// Copies through a temporary textarea: the only option outside secure
// contexts (e.g. plain HTTP on a LAN address), where navigator.clipboard is
// missing.
const copyWithTextarea = (text: string) => {
  const previousFocus = document.activeElement;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  try {
    textarea.select();
    if (!document.execCommand("copy")) {
      throw new Error("execCommand('copy') was refused");
    }
  } finally {
    document.body.removeChild(textarea);
    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
  }
};

// Always the clipboard, never the system share sheet (which Windows and
// mobile browsers open for navigator.share). The clipboard API needs a secure
// context and can be refused; the textarea copy covers both cases.
export const copyText = async (text: string) => {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (err) {
      console.warn("Clipboard API refused, copying another way", err);
    }
  }
  copyWithTextarea(text);
};
