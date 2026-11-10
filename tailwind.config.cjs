module.exports = {
  // Dark mode is driven by a `dark` class on <html> (see src/lib/theme.ts).
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // NYT Wordle palette plus a red for absent letters; "night-*" entries
        // are the dark-mode colours. The hint colours are CSS variables (src/index.css) so high contrast
        // mode can swap them.
        wordle: {
          correct: "var(--wordle-correct)",
          present: "var(--wordle-present)",
          absent: "var(--wordle-absent)",
          empty: "#d3d6da", // empty tile border and unused keys
          filled: "#878a8c", // border of a typed, unchecked tile
          "night-bg": "#121213",
          "night-correct": "var(--wordle-night-correct)",
          "night-present": "var(--wordle-night-present)",
          "night-absent": "var(--wordle-night-absent)",
          "night-empty": "#3a3a3c",
          "night-filled": "#565758",
          "night-key": "#818384",
        },
      },
    },
  },
  plugins: [],
};
