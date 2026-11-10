import {
  getUndoShortcut,
  getUndoShortcutLabels,
  isApplePlatform,
} from "./keyboard";

const press = (key: string, mods: Partial<KeyboardEvent> = {}) => ({
  key,
  code: /^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : "",
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

test("Apple devices undo with Cmd+Z and redo with Shift+Cmd+Z", () => {
  expect(getUndoShortcut(press("z", { metaKey: true }), true)).toBe("undo");
  expect(
    getUndoShortcut(press("Z", { metaKey: true, shiftKey: true }), true),
  ).toBe("redo");
  // Ctrl is not the command key there, and Cmd+Y is not redo.
  expect(getUndoShortcut(press("z", { ctrlKey: true }), true)).toBeNull();
  expect(getUndoShortcut(press("y", { metaKey: true }), true)).toBeNull();
});

test("other platforms undo with Ctrl+Z and redo with Ctrl+Y or Ctrl+Shift+Z", () => {
  expect(getUndoShortcut(press("z", { ctrlKey: true }), false)).toBe("undo");
  expect(getUndoShortcut(press("y", { ctrlKey: true }), false)).toBe("redo");
  expect(
    getUndoShortcut(press("Z", { ctrlKey: true, shiftKey: true }), false),
  ).toBe("redo");
  // The Windows or Super key is not the command key.
  expect(getUndoShortcut(press("z", { metaKey: true }), false)).toBeNull();
});

test("shortcuts need exactly the command key and a Z or Y", () => {
  expect(getUndoShortcut(press("z"), false)).toBeNull();
  expect(
    getUndoShortcut(press("z", { ctrlKey: true, altKey: true }), false),
  ).toBeNull();
  expect(
    getUndoShortcut(press("z", { metaKey: true, ctrlKey: true }), true),
  ).toBeNull();
  expect(getUndoShortcut(press("x", { ctrlKey: true }), false)).toBeNull();
});

test("non-Latin layouts use the physical Z and Y keys", () => {
  expect(
    getUndoShortcut({ ...press("я", { ctrlKey: true }), code: "KeyZ" }, false),
  ).toBe("undo");
  expect(
    getUndoShortcut({ ...press("н", { ctrlKey: true }), code: "KeyY" }, false),
  ).toBe("redo");
  // A Latin layout with Z elsewhere (AZERTY) goes by the letter typed.
  expect(
    getUndoShortcut({ ...press("z", { ctrlKey: true }), code: "KeyW" }, false),
  ).toBe("undo");
});

test("isApplePlatform recognises Macs, iPads and iPhones", () => {
  const nav = (platform: string, userAgent = "") =>
    ({ platform, userAgent }) as Navigator;
  expect(isApplePlatform(nav("MacIntel"))).toBe(true);
  expect(isApplePlatform(nav("iPhone"))).toBe(true);
  expect(isApplePlatform(nav("Win32"))).toBe(false);
  expect(isApplePlatform(nav("Linux x86_64"))).toBe(false);
  expect(
    isApplePlatform({
      platform: "",
      userAgentData: { platform: "macOS" },
    } as unknown as Navigator),
  ).toBe(true);
  expect(isApplePlatform(nav("", "Mozilla/5.0 (iPad; CPU OS 17_0)"))).toBe(
    true,
  );
});

test("tooltips name the platform's shortcuts", () => {
  expect(getUndoShortcutLabels(true)).toEqual({ undo: "⌘Z", redo: "⇧⌘Z" });
  expect(getUndoShortcutLabels(false)).toEqual({
    undo: "Ctrl+Z",
    redo: "Ctrl+Y",
  });
});
