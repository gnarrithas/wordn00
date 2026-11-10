/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages serves the project under /<repo>/; the deploy workflow sets
  // BASE_PATH. Everywhere else the app lives at the site root.
  base: process.env.BASE_PATH || "/",
  plugins: [react()],
  server: { port: 3000 },
  preview: { port: 3000 },
  build: {
    // Same output directory as Create React App, which deploy/ expects.
    outDir: "build",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    // Node 25+ ships its own localStorage global, which hides jsdom's.
    execArgv: ["--no-experimental-webstorage"],
  },
});
