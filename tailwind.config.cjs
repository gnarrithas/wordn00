module.exports = {
  // Dark mode is driven by a `dark` class on <html> (see src/lib/theme.ts).
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Self-hosted through @fontsource (src/index.tsx); the CSP allows no
        // font CDNs.
        sans: ['"Source Sans 3"', "system-ui", "-apple-system", "sans-serif"],
        display: ["Bungee", "sans-serif"],
      },
      borderRadius: {
        tile: "5px",
        card: "10px",
      },
      colors: {
        // Surfaces and text of the dark, card-based look; CSS variables
        // (src/index.css) so each theme sets its own values.
        ui: {
          bg: "var(--ui-bg)",
          surface: "var(--ui-surface)",
          tile: "var(--ui-tile)",
          filled: "var(--ui-filled)",
          key: "var(--ui-key)",
          text: "var(--ui-text)",
          muted: "var(--ui-muted)",
          border: "var(--ui-border)",
          edge: "var(--ui-edge)",
          accent: "var(--ui-accent)",
        },
        // NYT Wordle palette plus a red for absent letters; "night-*" entries
        // are the dark-mode colours. The hint colours are CSS variables (src/index.css) so high contrast
        // mode can swap them.
        wordle: {
          correct: "var(--wordle-correct)",
          present: "var(--wordle-present)",
          absent: "var(--wordle-absent)",
          "night-correct": "var(--wordle-night-correct)",
          "night-present": "var(--wordle-night-present)",
          "night-absent": "var(--wordle-night-absent)",
        },
      },
    },
  },
  plugins: [],
};
