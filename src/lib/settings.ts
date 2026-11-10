import { DEFAULT_LEVEL, isLevel, Level } from "./levels";

// Player options from the settings dialog, each stored under its own key.
export type Settings = {
  // A guess with the answer's length is ringed and announced.
  revealLength: boolean;
  // Orange and blue instead of green and yellow, for colour vision deficiency.
  highContrast: boolean;
  // Physical keyboards are ignored; only the on-screen keys type.
  onscreenKeyboardOnly: boolean;
};

export type SettingKey = keyof Settings;

const STORAGE_KEYS: Record<SettingKey, string> = {
  revealLength: "revealLength",
  highContrast: "highContrast",
  onscreenKeyboardOnly: "onscreenKeyboardOnly",
};

const DEFAULTS: Settings = {
  revealLength: false,
  highContrast: false,
  onscreenKeyboardOnly: false,
};

// Before these toggles, one "mode" key held easy, medium or hard (a hard
// mode since dropped).
const LEGACY_MODE_KEY = "mode";

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`Could not load setting ${key}`, err);
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    // Storage can be unavailable (e.g. private mode); the setting still
    // applies for this visit.
    console.warn(`Could not save setting ${key}`, err);
  }
};

const fromLegacyMode = (): Partial<Settings> => {
  const legacy = readStorage(LEGACY_MODE_KEY);
  if (legacy === "easy") {
    return { revealLength: true };
  }
  return {};
};

export const loadSettings = (): Settings => {
  const legacy = fromLegacyMode();
  const settings = { ...DEFAULTS };
  (Object.keys(STORAGE_KEYS) as SettingKey[]).forEach((key) => {
    const stored = readStorage(STORAGE_KEYS[key]);
    if (stored === "true" || stored === "false") {
      settings[key] = stored === "true";
    } else if (legacy[key] !== undefined) {
      settings[key] = legacy[key] as boolean;
    }
  });
  return settings;
};

export const saveSetting = (key: SettingKey, value: boolean) => {
  writeStorage(STORAGE_KEYS[key], String(value));
};

const LEVEL_KEY = "level";

export const loadLevel = (): Level => {
  const stored = readStorage(LEVEL_KEY);
  return isLevel(stored) ? stored : DEFAULT_LEVEL;
};

export const saveLevel = (level: Level) => writeStorage(LEVEL_KEY, level);

// index.css swaps the tile colours when <html> has this class.
export const applyHighContrast = (on: boolean) => {
  document.documentElement.classList.toggle("high-contrast", on);
};
