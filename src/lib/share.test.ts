import { copyText, getShareText, getSiteUrl } from "./share";

test("day index 0 is Wordn00 1; the header has only the letter count", () => {
  expect(getShareText(0, ["COT", "CAT"], "CAT")).toBe(
    "Wordn00 1 · 6 letters\n\n🟩2 🟨0 🟥1\n🟩3 🟨0 🟥0",
  );
});

test("large numbers get thousands separators", () => {
  expect(getShareText(1199, ["CAT"], "CAT").split("\n")[0]).toBe(
    "Wordn00 1,200 · 3 letters",
  );
});

test("a loss shows its rows the same way", () => {
  expect(getShareText(2, ["DOG"], "CAT")).toBe(
    "Wordn00 3 · 3 letters\n\n🟩0 🟨0 🟥3",
  );
});

test("a game off the daily sequence has no number", () => {
  expect(getShareText(null, ["CAT"], "CAT").split("\n")[0]).toBe(
    "Wordn00 · 3 letters",
  );
});

test("high contrast uses orange, blue and grey squares", () => {
  expect(getShareText(0, ["COT", "CAT"], "CAT", true)).toBe(
    "Wordn00 1 · 6 letters\n\n🟧2 🟦0 ⬜1\n🟧3 🟦0 ⬜0",
  );
});

test("a single letter is singular", () => {
  expect(getShareText(0, ["A"], "CAT").split("\n")[0]).toBe(
    "Wordn00 1 · 1 letter",
  );
});

test("a link, when given, is the last line after a blank one", () => {
  expect(
    getShareText(0, ["CAT"], "CAT", false, "https://example.com/wordn00/"),
  ).toBe(
    "Wordn00 1 · 3 letters\n\n🟩3 🟨0 🟥0\n\nhttps://example.com/wordn00/",
  );
});

test("the site link is the origin plus the base path", () => {
  expect(getSiteUrl()).toBe(
    new URL(import.meta.env.BASE_URL, window.location.origin).href,
  );
  expect(getSiteUrl()).toMatch(/^https?:\/\/[^/]+\/(.+\/)?$/);
});

describe("copyText", () => {
  const originalSecure = window.isSecureContext;
  afterEach(() => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: originalSecure,
    });
    delete (navigator as any).share;
    delete (navigator as any).clipboard;
    delete (document as any).execCommand;
  });

  const setSecure = (value: boolean) =>
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value,
    });

  test("copies even where a native share sheet exists", async () => {
    setSecure(true);
    const share = vi.fn().mockResolvedValue(undefined);
    (navigator as any).share = share;
    const writeText = vi.fn().mockResolvedValue(undefined);
    (navigator as any).clipboard = { writeText };
    await copyText("hi");
    expect(writeText).toHaveBeenCalledWith("hi");
    expect(share).not.toHaveBeenCalled();
  });

  test("uses the clipboard API in a secure context", async () => {
    setSecure(true);
    const writeText = vi.fn().mockResolvedValue(undefined);
    (navigator as any).clipboard = { writeText };
    await copyText("hi");
    expect(writeText).toHaveBeenCalledWith("hi");
  });

  test("falls back to execCommand over plain HTTP", async () => {
    setSecure(false);
    const execCommand = vi.fn().mockReturnValue(true);
    (document as any).execCommand = execCommand;
    await copyText("hi");
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });

  test("falls back to execCommand when the clipboard API refuses", async () => {
    setSecure(true);
    (navigator as any).clipboard = {
      writeText: vi.fn().mockRejectedValue(new Error("denied")),
    };
    const execCommand = vi.fn().mockReturnValue(true);
    (document as any).execCommand = execCommand;
    await copyText("hi");
    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  test("fails when no way of copying works", async () => {
    setSecure(false);
    (document as any).execCommand = vi.fn().mockReturnValue(false);
    await expect(copyText("hi")).rejects.toThrow();
  });
});
