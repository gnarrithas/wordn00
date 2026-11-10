import {
  applyHighContrast,
  loadLevel,
  loadSettings,
  saveLevel,
  saveSetting,
} from "./settings";

beforeEach(() => localStorage.clear());

test("every setting is off by default", () => {
  expect(loadSettings()).toEqual({
    revealLength: false,
    highContrast: false,
    onscreenKeyboardOnly: false,
  });
});

test("settings survive a reload", () => {
  saveSetting("highContrast", true);
  saveSetting("onscreenKeyboardOnly", true);
  expect(loadSettings()).toMatchObject({
    highContrast: true,
    onscreenKeyboardOnly: true,
    revealLength: false,
  });
});

test("junk in storage falls back to the default", () => {
  localStorage.setItem("highContrast", "maybe");
  expect(loadSettings().highContrast).toBe(false);
});

test("the old easy mode carries over; the old hard mode is dropped", () => {
  localStorage.setItem("mode", "easy");
  expect(loadSettings().revealLength).toBe(true);
  localStorage.setItem("mode", "hard");
  expect(loadSettings()).toEqual({
    revealLength: false,
    highContrast: false,
    onscreenKeyboardOnly: false,
  });
});

test("the level starts at Standard and survives a reload", () => {
  expect(loadLevel()).toBe("standard");
  saveLevel("advanced");
  expect(loadLevel()).toBe("advanced");
  localStorage.setItem("level", "nightmare");
  expect(loadLevel()).toBe("standard");
});

test("high contrast is a class on <html>", () => {
  applyHighContrast(true);
  expect(document.documentElement).toHaveClass("high-contrast");
  applyHighContrast(false);
  expect(document.documentElement).not.toHaveClass("high-contrast");
});
