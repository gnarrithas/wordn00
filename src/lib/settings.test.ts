import { applyHighContrast, loadSettings, saveSetting } from "./settings";

beforeEach(() => localStorage.clear());

test("every setting is off by default", () => {
  expect(loadSettings()).toEqual({
    hardMode: false,
    revealLength: false,
    highContrast: false,
    onscreenKeyboardOnly: false,
  });
});

test("settings survive a reload", () => {
  saveSetting("hardMode", true);
  saveSetting("onscreenKeyboardOnly", true);
  expect(loadSettings()).toMatchObject({
    hardMode: true,
    onscreenKeyboardOnly: true,
    revealLength: false,
  });
});

test("junk in storage falls back to the default", () => {
  localStorage.setItem("highContrast", "maybe");
  expect(loadSettings().highContrast).toBe(false);
});

test("the old easy and hard modes carry over", () => {
  localStorage.setItem("mode", "easy");
  expect(loadSettings()).toMatchObject({ revealLength: true, hardMode: false });
  localStorage.setItem("mode", "hard");
  expect(loadSettings()).toMatchObject({ revealLength: false, hardMode: true });
  saveSetting("hardMode", false);
  expect(loadSettings().hardMode).toBe(false);
});

test("high contrast is a class on <html>", () => {
  applyHighContrast(true);
  expect(document.documentElement).toHaveClass("high-contrast");
  applyHighContrast(false);
  expect(document.documentElement).not.toHaveClass("high-contrast");
});
