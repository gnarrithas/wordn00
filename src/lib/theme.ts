// Light/dark theme. Tailwind's `dark:` classes and the CSS variables in
// index.css key off a `dark` class on <html>. public/index.html sets that class
// and the theme-color meta before React loads (stored choice, else the system
// setting) to avoid a flash; keep the colours below in sync with it.
export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const THEME_COLORS: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#121213", // wordle-night-bg
};
const DARK_QUERY = "(prefers-color-scheme: dark)";

export const getTheme = (): Theme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
};

const hasStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark";
  } catch {
    return false;
  }
};

export const setTheme = (theme: Theme) => {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (err) {
    // Storage can be unavailable (e.g. private mode); the toggle still works
    // for this visit.
    console.warn("Could not save theme preference", err);
  }
};

// Follows live system theme changes until the player picks a theme. Returns
// an unsubscribe function.
export const watchSystemTheme = (onChange: (theme: Theme) => void) => {
  const query = window.matchMedia?.(DARK_QUERY);
  if (!query) {
    return () => {};
  }
  const listener = (e: MediaQueryListEvent) => {
    if (hasStoredTheme()) {
      return;
    }
    const theme = e.matches ? "dark" : "light";
    applyTheme(theme);
    onChange(theme);
  };
  // Safari before 14 only has the deprecated addListener.
  if (query.addEventListener) {
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }
  query.addListener(listener);
  return () => query.removeListener(listener);
};
