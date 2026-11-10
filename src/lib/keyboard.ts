import { CharValue } from "./statuses";

export type KeyValue =
  CharValue | "ENTER" | "DELETE" | "SPACE" | "HINT" | "CLEAR" | "UNDO" | "REDO";

type ShortcutEvent = Pick<
  KeyboardEvent,
  "key" | "code" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey"
>;

// Apple devices (Mac, iPad, iPhone with a keyboard) use Cmd for shortcuts;
// everything else uses Ctrl.
export const isApplePlatform = (nav: Navigator = navigator) => {
  const platform =
    (nav as Navigator & { userAgentData?: { platform?: string } }).userAgentData
      ?.platform ||
    nav.platform ||
    nav.userAgent;
  return /mac|iphone|ipad|ipod/i.test(platform);
};

// The letter a shortcut was typed with. Layouts without Latin letters (e.g.
// Cyrillic) report their own character in `key`, so fall back to the
// physical key there, as browsers do for their own undo.
const shortcutLetter = (e: ShortcutEvent) =>
  /^[a-z]$/i.test(e.key)
    ? e.key.toLowerCase()
    : /^Key([A-Z])$/.exec(e.code)?.[1].toLowerCase();

// The platform's usual undo and redo shortcuts: Cmd+Z and Shift+Cmd+Z on
// Apple devices; Ctrl+Z, Ctrl+Y and Ctrl+Shift+Z elsewhere.
export const getUndoShortcut = (
  e: ShortcutEvent,
  isApple: boolean,
): "undo" | "redo" | null => {
  const isCommand = isApple ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
  if (!isCommand || e.altKey) {
    return null;
  }
  const letter = shortcutLetter(e);
  if (letter === "z") {
    return e.shiftKey ? "redo" : "undo";
  }
  if (letter === "y" && !isApple && !e.shiftKey) {
    return "redo";
  }
  return null;
};

// How the shortcuts are written on this platform, for tooltips.
export const getUndoShortcutLabels = (isApple: boolean) =>
  isApple ? { undo: "⌘Z", redo: "⇧⌘Z" } : { undo: "Ctrl+Z", redo: "Ctrl+Y" };
