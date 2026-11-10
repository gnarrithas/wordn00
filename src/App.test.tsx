import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { Mock } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import App from "./App";
import { trackEvent } from "./lib/analytics";
import { getMaxGuesses } from "./lib/words";

const wordFile = (name: string) =>
  readFileSync(join(__dirname, "../public/words", name), "utf8");
const WORD_FILES: Record<string, string> = {
  "/words/solutions.txt": wordFile("solutions.txt"),
  "/words/guesses.txt": wordFile("guesses.txt"),
};

vi.mock("./lib/analytics", () => ({ trackEvent: vi.fn() }));
const trackEventMock = trackEvent as Mock<typeof trackEvent>;
const eventsNamed = (name: string) =>
  trackEventMock.mock.calls.filter(([n]) => n === name).map(([, data]) => data);

vi.mock("./lib/words", async () => ({
  ...(await vi.importActual<typeof import("./lib/words")>("./lib/words")),
  getWordOfDay: () => "CAT",
  getRandomWord: () => "DOG",
}));

// Like a browser, keys go to the focused element and bubble to window.
const target = () => document.activeElement ?? document.body;

// A mouse click: pointer down, focus moves to the element, then click.
const mouseClick = (el: Element) =>
  act(() => {
    fireEvent.mouseDown(el);
    if (el instanceof HTMLElement) {
      el.focus();
    }
    fireEvent.mouseUp(el);
    fireEvent.click(el);
  });

const press = (key: string) => {
  const code =
    key === "Enter" || key === "Backspace"
      ? key
      : key === " "
        ? "Space"
        : `Key${key}`;
  act(() => {
    fireEvent.keyDown(target(), { key, code });
    fireEvent.keyUp(target(), { key, code });
  });
};

const type = (word: string) => word.split("").forEach((c) => press(c));

const submit = (word: string) => {
  type(word);
  press("Enter");
};

const board = () => screen.getByTestId("board");
// The board's letters, without the score digits.
const boardText = () => {
  const copy = board().cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[data-testid="score"]').forEach((el) => el.remove());
  return copy.textContent;
};
// A guess's whole row: its score boxes and its letters.
const guessRow = (name: string) =>
  screen.getByRole("group", { name }).parentElement;
// The input row disappears once the game is over.
const inputRow = () => screen.queryByRole("group", { name: "Current guess" });
const hints = () =>
  screen
    .queryAllByTestId("hint")
    .map((el) => el.textContent)
    .join("");

const loseGame = () => {
  for (let i = 0; i < getMaxGuesses("CAT"); i++) {
    submit("COT");
  }
};

// The visible toast; the screen-reader live region repeats its text.
const TOAST = { selector: '[aria-hidden="true"]' };
const toast = (text: string) => screen.getByText(text, TOAST);
const queryToast = (text: string) => screen.queryByText(text, TOAST);

const mockFetch = (fail = false) => {
  window.fetch = vi.fn((url: RequestInfo | URL) => {
    const body = WORD_FILES[String(url)];
    return Promise.resolve({
      ok: !fail && body !== undefined,
      status: fail ? 503 : 200,
      text: () => Promise.resolve(body ?? ""),
    } as Response);
  });
};

// Renders the app and waits for the word lists to arrive.
const renderGame = async () => {
  const result = render(<App />);
  await screen.findByTestId("board");
  return result;
};

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  document.documentElement.classList.remove("high-contrast");
  trackEventMock.mockClear();
  mockFetch();
});

afterEach(() => {
  act(() => {
    vi.runOnlyPendingTimers();
  });
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

test("renders the board and the letter count once the words load", async () => {
  render(<App />);
  expect(await screen.findByTestId("board")).toBeInTheDocument();
  expect(screen.getByText(/Total letters used/)).toHaveTextContent(
    "Total letters used: 0",
  );
  submit("COT");
  expect(screen.getByText(/Total letters used/)).toHaveTextContent(
    "Total letters used: 3",
  );
});

test("the input row keeps one empty box after five or more letters", async () => {
  await renderGame();
  const row = () => screen.getByRole("group", { name: "Current guess" });
  expect(row().children.length).toBe(5);
  type("ABCD");
  expect(row().children.length).toBe(5);
  expect(row().querySelector(".border-dashed")).toBeNull();
  type("E");
  expect(row().children.length).toBe(6);
  // Only the extra box past the fifth letter is dashed.
  expect(row().querySelectorAll(".border-dashed")).toHaveLength(1);
  expect(row().lastElementChild).toHaveClass("border-dashed");
  type("F");
  expect(row().children.length).toBe(7);
  press("Backspace");
  press("Backspace");
  expect(row().children.length).toBe(5);
  type("FGHIJKLMNOPQRSTUVWXYZ");
  // Capped at the maximum word length: no empty box once it is full.
  expect(row().children.length).toBe(20);
});

test("typing after a win changes nothing and the input row is gone", async () => {
  await renderGame();
  submit("CAT");
  const rowsAfterWin = board().children.length;
  type("DOG");
  expect(board()).not.toHaveTextContent("D");
  expect(board().children.length).toBe(rowsAfterWin);
  // The winning guess and seven placeholder rows; no input or dashed row.
  expect(rowsAfterWin).toBe(8);
});

test("production builds keep New word but hide Reveal", async () => {
  vi.stubEnv("DEV", false);
  await renderGame();
  expect(screen.getByText("New word")).toBeInTheDocument();
  expect(screen.queryByText("Reveal")).not.toBeInTheDocument();
  expect(screen.queryByText("Give up")).not.toBeInTheDocument();
});

test("Reveal shows the answer faded behind the typed letters", async () => {
  await renderGame();
  expect(screen.queryByText("Give up")).not.toBeInTheDocument();
  expect(hints()).toBe("");
  mouseClick(screen.getByText("Reveal"));
  expect(screen.getByText("Hide")).toHaveAttribute("aria-pressed", "true");
  expect(hints()).toBe("CAT");
  type("C");
  expect(hints()).toBe("AT");
  type("OTXY");
  expect(hints()).toBe("");
  press("Backspace");
  press("Backspace");
  // Revealing does not end the game.
  press("Enter");
  expect(screen.getByRole("group", { name: "Guess: COT" })).toBeInTheDocument();
  expect(inputRow()).toBeInTheDocument();
  expect(hints()).toBe("CAT");
  mouseClick(screen.getByText("Hide"));
  expect(hints()).toBe("");
});

test("a revealed answer longer than the row stretches it", async () => {
  await renderGame();
  mouseClick(screen.getByText("New word"));
  mouseClick(screen.getByText("Reveal"));
  // DOG is short; the row keeps its five boxes, hints in the first three.
  expect(inputRow()!.children).toHaveLength(5);
  expect(hints()).toBe("DOG");
});

test("New word never shows the new answer in the fading toast", async () => {
  await renderGame();
  loseGame();
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  expect(toast("The word was CAT")).toBeInTheDocument();
  fireEvent.click(screen.getByText("New word"));
  expect(queryToast("The word was DOG")).not.toBeInTheDocument();
  expect(toast("The word was CAT")).toBeInTheDocument();
});

test("a repeated invalid Enter keeps the toast up for 2s after the last press", async () => {
  await renderGame();
  type("ZZZ");
  press("Enter");
  act(() => {
    vi.advanceTimersByTime(1500);
  });
  press("Enter");
  act(() => {
    vi.advanceTimersByTime(1900);
  });
  expect(toast("Word not found")).toBeInTheDocument();
});

test("guesses shorter than three letters are not enough", async () => {
  await renderGame();
  type("CA");
  press("Enter");
  expect(toast("Not enough letters")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Not enough letters");
});

test("tiles, rows and keys have accessible names", async () => {
  await renderGame();
  submit("COT");
  expect(screen.getByRole("group", { name: "Guess: COT" })).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: "2 correct, 0 present, 1 absent" }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "C" })).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Enter" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "How to play" }),
  ).toBeInTheDocument();
});

const openSettings = () =>
  mouseClick(screen.getByRole("button", { name: "Settings" }));
const closeSettings = () =>
  mouseClick(screen.getByRole("button", { name: "Close" }));
const settingSwitch = (name: string) => screen.getByRole("switch", { name });

// Settings live in a dialog: open it, flip a switch, close it again.
const toggleSetting = (name: string) => {
  openSettings();
  mouseClick(settingSwitch(name));
  closeSettings();
};

test("settings start off and survive a reload", async () => {
  const { unmount } = await renderGame();
  openSettings();
  for (const name of [
    "Hard Mode",
    "Reveal Length",
    "High Contrast Mode",
    "Onscreen Keyboard Input Only",
  ]) {
    expect(settingSwitch(name)).toHaveAttribute("aria-checked", "false");
  }
  mouseClick(settingSwitch("Reveal Length"));
  closeSettings();
  unmount();
  await renderGame();
  openSettings();
  expect(settingSwitch("Reveal Length")).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("high contrast mode marks the page for the orange and blue palette", async () => {
  await renderGame();
  toggleSetting("High Contrast Mode");
  expect(document.documentElement).toHaveClass("high-contrast");
  toggleSetting("High Contrast Mode");
  expect(document.documentElement).not.toHaveClass("high-contrast");
});

test("onscreen keyboard input only ignores physical keys", async () => {
  await renderGame();
  toggleSetting("Onscreen Keyboard Input Only");
  type("COT");
  expect(boardText()).toBe("");
  ["C", "O", "T"].forEach((letter) =>
    mouseClick(screen.getByRole("button", { name: letter })),
  );
  expect(boardText()).toBe("COT");
});

test("the settings dialog switches the theme", async () => {
  await renderGame();
  openSettings();
  const toggle = settingSwitch("Dark Theme");
  const wasDark = document.documentElement.classList.contains("dark");
  expect(toggle).toHaveAttribute("aria-checked", String(wasDark));
  mouseClick(toggle);
  expect(document.documentElement.classList.contains("dark")).toBe(!wasDark);
  expect(toggle).toHaveAttribute("aria-checked", String(!wasDark));
});

const keyDown = (init: KeyboardEventInit) =>
  act(() => {
    fireEvent.keyDown(target(), init);
  });

test("holding Backspace keeps deleting", async () => {
  await renderGame();
  type("COT");
  keyDown({ key: "Backspace", code: "Backspace" });
  keyDown({ key: "Backspace", code: "Backspace", repeat: true });
  expect(boardText()).toBe("C");
});

test("numpad Enter submits, a held Enter does not", async () => {
  await renderGame();
  type("CAT");
  keyDown({ key: "Enter", code: "Enter", repeat: true });
  expect(inputRow()).toBeInTheDocument();
  keyDown({ key: "Enter", code: "NumpadEnter" });
  expect(inputRow()).not.toBeInTheDocument();
});

// The Settings dialog has a focusable Close button, so opening it moves focus
// away and closing it hands focus back to this button.
const settingsButton = () => screen.getByRole("button", { name: "Settings" });

const waitForModalTransition = () => {
  for (let i = 0; i < 5; i++) {
    act(() => {
      vi.advanceTimersByTime(500);
    });
  }
};

test("keys do nothing while a modal is open; Enter submits after a mouse close", async () => {
  await renderGame();
  type("CA");
  mouseClick(settingsButton());
  type("T");
  press("Enter");
  expect(boardText()).toBe("CA");
  mouseClick(document.querySelector('[id^="headlessui-dialog-overlay"]')!);
  waitForModalTransition();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.activeElement).toBe(settingsButton());
  type("T");
  press("Enter");
  expect(inputRow()).not.toBeInTheDocument();
});

test("Enter on a button reached with the keyboard is left to the button", async () => {
  await renderGame();
  type("CAT");
  mouseClick(settingsButton());
  press("Escape");
  waitForModalTransition();
  // Focus came back after a keyboard close, so Enter belongs to the button.
  expect(document.activeElement).toBe(settingsButton());
  press("Enter");
  expect(inputRow()).toBeInTheDocument();
});

test("Space never presses a mouse-clicked button again", async () => {
  await renderGame();
  const newWord = screen.getByText("New word");
  mouseClick(newWord);
  submit("COT");
  expect(document.activeElement).toBe(newWord);
  expect(fireEvent.keyDown(newWord, { key: " ", code: "Space" })).toBe(false);
  expect(fireEvent.keyUp(newWord, { key: " ", code: "Space" })).toBe(false);
  // It types a placeholder instead.
  expect(boardText()).toBe("COT_");
});

test("Space still presses a button reached with the keyboard", async () => {
  await renderGame();
  const newWord = screen.getByText("New word");
  press("Tab");
  act(() => newWord.focus());
  expect(fireEvent.keyDown(newWord, { key: " ", code: "Space" })).toBe(true);
  expect(fireEvent.keyUp(newWord, { key: " ", code: "Space" })).toBe(true);
  expect(boardText()).toBe("");
});

test("Space types a placeholder that blocks submitting", async () => {
  await renderGame();
  type("C");
  press(" ");
  type("T");
  expect(boardText()).toBe("C_T");
  press("Enter");
  expect(toast("Replace every _ first")).toBeInTheDocument();
  expect(boardText()).toBe("C_T");
  press("Backspace");
  press("Backspace");
  type("AT");
  press("Enter");
  expect(boardText()).toBe("CAT");
  expect(inputRow()).not.toBeInTheDocument();
});

test("Enter submits after clicking a button and typing", async () => {
  await renderGame();
  mouseClick(screen.getByText("New word"));
  expect(document.activeElement).toBe(screen.getByText("New word"));
  submit("CAT");
  expect(boardText()).toBe("CAT");
  expect(screen.getByText(/Total letters used/)).toHaveTextContent(
    "Total letters used: 3",
  );
});

test("listeners are attached once, not on every render", async () => {
  const add = vi.spyOn(window, "addEventListener");
  await renderGame();
  type("COT");
  expect(add.mock.calls.filter(([type]) => type === "keydown").length).toBe(1);
  add.mockRestore();
});

test("refreshing mid-game restores the board without a toast", async () => {
  const { unmount } = await renderGame();
  submit("COT");
  type("CA");
  unmount();
  await renderGame();
  expect(boardText()).toBe("COT");
  expect(inputRow()).toBeInTheDocument();
});

test("refreshing a finished game restores it with Share and no toast", async () => {
  const { unmount } = await renderGame();
  submit("COT");
  submit("CAT");
  act(() => {
    vi.runOnlyPendingTimers();
  });
  unmount();
  await renderGame();
  expect(boardText()).toBe("COTCAT");
  expect(inputRow()).not.toBeInTheDocument();
  expect(queryToast("Lucky")).not.toBeInTheDocument();
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  expect(queryToast("Lucky")).not.toBeInTheDocument();
  expect(screen.getByText("Share")).toBeInTheDocument();
});

test("a game saved on an earlier day gives way to today's word", async () => {
  vi.setSystemTime(new Date(2026, 10, 9, 23, 0));
  const { unmount } = await renderGame();
  submit("COT");
  unmount();
  vi.setSystemTime(new Date(2026, 10, 10, 0, 30));
  await renderGame();
  expect(boardText()).toBe("");
});

test("New word mid-daily: a reload returns to the unfinished daily", async () => {
  const { unmount } = await renderGame();
  submit("COT");
  mouseClick(screen.getByText("New word"));
  submit("DOG");
  unmount();
  await renderGame();
  expect(boardText()).toBe("COT");
  expect(inputRow()).toBeInTheDocument();
});

test("after the daily, a New word game survives a reload", async () => {
  const { unmount } = await renderGame();
  submit("CAT");
  act(() => {
    vi.runOnlyPendingTimers();
  });
  mouseClick(screen.getByText("New word"));
  submit("COT");
  unmount();
  await renderGame();
  expect(boardText()).toBe("COT");
  expect(inputRow()).toBeInTheDocument();
});

test("a New word game from an earlier day never comes back", async () => {
  vi.setSystemTime(new Date(2026, 10, 9, 12));
  const first = await renderGame();
  submit("CAT");
  act(() => {
    vi.runOnlyPendingTimers();
  });
  mouseClick(screen.getByText("New word"));
  submit("DOG");
  first.unmount();
  // The next day starts its daily word and drops the old New word game...
  vi.setSystemTime(new Date(2026, 10, 10, 12));
  const second = await renderGame();
  expect(boardText()).toBe("");
  submit("CAT");
  act(() => {
    vi.runOnlyPendingTimers();
  });
  second.unmount();
  // ...so finishing that daily shows its result, not the stale game.
  await renderGame();
  expect(boardText()).toBe("CAT");
  expect(inputRow()).not.toBeInTheDocument();
});

test("Share copies the day number (from 1), letter count and site link", async () => {
  vi.setSystemTime(new Date(2026, 10, 11, 12));
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: true,
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  await renderGame();
  submit("COT");
  submit("CAT");
  act(() => {
    vi.runOnlyPendingTimers();
  });
  await act(async () => {
    fireEvent.click(screen.getByText("Share"));
  });
  expect(writeText).toHaveBeenCalledWith(
    "Wordn00 3 · 6 letters\n\n🟩2 🟨0 🟥1\n🟩3 🟨0 🟥0\n\n" +
      new URL(import.meta.env.BASE_URL, window.location.origin).href,
  );
  delete (navigator as any).clipboard;
});

test("a saved word that left the solution list is discarded", async () => {
  window.localStorage.setItem(
    "game",
    JSON.stringify({
      solution: "QWXZ",
      guesses: ["COT"],
      isGameWon: false,
      isAnswerRevealed: false,
    }),
  );
  await renderGame();
  expect(boardText()).toBe("");
});

test("reveal length outlines a guess of the right length and announces it once", async () => {
  await renderGame();
  toggleSetting("Reveal Length");
  submit("CART");
  expect(guessRow("Guess: CART")).not.toHaveClass(
    "length-match",
  );
  submit("DOG");
  expect(guessRow("Guess: DOG (right length)")).toHaveClass(
    "length-match",
    "length-match-enter",
  );
  act(() => {
    vi.advanceTimersByTime(3000);
  });
  expect(toast("Right length! The word has 3 letters")).toBeInTheDocument();
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  submit("COT");
  act(() => {
    vi.advanceTimersByTime(3000);
  });
  expect(screen.getByRole("status")).not.toHaveTextContent("Right length");
});

test("reveal length dots the boxes past a short word once its length is revealed", async () => {
  const dotted = () => inputRow()!.querySelectorAll(".border-dotted").length;
  await renderGame();
  toggleSetting("Reveal Length");
  submit("CART");
  act(() => {
    vi.advanceTimersByTime(3000);
  });
  expect(dotted()).toBe(0);
  submit("DOG");
  // Not before the row has flipped.
  expect(dotted()).toBe(0);
  act(() => {
    vi.advanceTimersByTime(3000);
  });
  expect(dotted()).toBe(2);
});

test("without reveal length, nothing is outlined nor announced", async () => {
  await renderGame();
  submit("DOG");
  act(() => {
    vi.advanceTimersByTime(3000);
  });
  expect(guessRow("Guess: DOG")).not.toHaveClass(
    "length-match",
  );
  expect(queryToast("Right length! The word has 3 letters")).toBeNull();
  expect(inputRow()!.querySelectorAll(".border-dotted")).toHaveLength(0);
});

test("hard mode rejects guesses that ignore the hints", async () => {
  await renderGame();
  toggleSetting("Hard Mode");
  submit("COT");
  submit("DOG");
  expect(toast("Guess must fit the score of guess 1")).toBeInTheDocument();
  expect(boardText()).toBe("COTDOG");
  press("Backspace");
  press("Backspace");
  press("Backspace");
  submit("CUT");
  expect(boardText()).toBe("COTCUT");
});

test("hard mode cannot be turned on mid-round", async () => {
  await renderGame();
  submit("COT");
  openSettings();
  mouseClick(settingSwitch("Hard Mode"));
  expect(
    toast("Hard mode can only be enabled at the start of a round"),
  ).toBeInTheDocument();
  expect(settingSwitch("Hard Mode")).toHaveAttribute("aria-checked", "false");
  closeSettings();
  submit("DOG");
  expect(boardText()).toBe("COTDOG");
});

test("a won game reports its start and its end", async () => {
  await renderGame();
  submit("COT");
  expect(eventsNamed("game_start")).toEqual([{ length: 3 }]);
  expect(eventsNamed("game_end")).toEqual([]);
  submit("CAT");
  expect(eventsNamed("game_start")).toHaveLength(1);
  expect(eventsNamed("game_end")).toEqual([
    {
      outcome: "won",
      guesses: 2,
      length: 3,
      maxGuesses: getMaxGuesses("CAT"),
      seconds: 0,
      word: "CAT",
    },
  ]);
});

test("running out of guesses reports a loss", async () => {
  await renderGame();
  const max = getMaxGuesses("CAT");
  loseGame();
  expect(eventsNamed("game_end")).toEqual([
    expect.objectContaining({ outcome: "lost", guesses: max }),
  ]);
});

test("skipping is reported; an untouched board is not", async () => {
  await renderGame();
  mouseClick(screen.getByText("New word"));
  expect(trackEventMock).not.toHaveBeenCalled();

  submit("COT");
  submit("CAT");
  mouseClick(screen.getByText("New word"));
  expect(eventsNamed("game_end")).toEqual([
    expect.objectContaining({ outcome: "skipped", guesses: 2 }),
  ]);
});

test("game time caps idle gaps and survives a reload", async () => {
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  const { unmount } = await renderGame();
  act(() => {
    vi.advanceTimersByTime(30_000);
  });
  type("C");
  // A long pause counts as two minutes at most.
  act(() => {
    vi.advanceTimersByTime(60 * 60_000);
  });
  submit("OT");
  unmount();

  await renderGame();
  act(() => {
    vi.advanceTimersByTime(10_000);
  });
  submit("CAT");
  expect(eventsNamed("game_end")).toEqual([
    expect.objectContaining({ outcome: "won", seconds: 30 + 120 + 10 }),
  ]);
});

test("tapping a guessed letter cycles its mark on the board and keyboard", async () => {
  const { unmount } = await renderGame();
  submit("COT");
  const row = () => screen.getByRole("group", { name: "Guess: COT" });
  const tile = () => within(row()).getAllByRole("button")[0];
  const key = (name: string) =>
    screen
      .getAllByRole("button", { name })
      .filter((el) => !row().contains(el));
  expect(tile()).toHaveAccessibleName("C");
  mouseClick(tile());
  expect(tile()).toHaveAccessibleName("C, marked absent");
  expect(key("C, absent")).toHaveLength(1);
  mouseClick(tile());
  mouseClick(tile());
  expect(tile()).toHaveAccessibleName("C, marked correct");
  // Marks are saved with the game.
  unmount();
  await renderGame();
  expect(key("C, correct")).toHaveLength(1);
  mouseClick(tile());
  expect(key("C")).toHaveLength(1);
});

test("a won game's tiles are green and no longer markable", async () => {
  await renderGame();
  submit("CAT");
  const row = screen.getByRole("group", { name: "Guess: CAT" });
  expect(within(row).queryAllByRole("button")).toHaveLength(0);
  act(() => {
    vi.runOnlyPendingTimers();
  });
  expect(
    within(row).getByRole("img", { name: "C correct" }),
  ).toBeInTheDocument();
});

test("the end of a game turns the whole board to its Wordle colours", async () => {
  await renderGame();
  submit("ACT");
  // Marked as the player likes; the reveal replaces the marks.
  const earlier = screen.getByRole("group", { name: "Guess: ACT" });
  mouseClick(within(earlier).getByRole("button", { name: "T" }));
  submit("CAT");
  expect(
    within(earlier).getByRole("img", { name: "T absent" }),
  ).toBeInTheDocument();
  expect(within(earlier).queryByRole("img", { name: "A present" })).toBeNull();
  act(() => {
    vi.runOnlyPendingTimers();
  });
  for (const name of ["A present", "C present", "T correct"]) {
    expect(within(earlier).getByRole("img", { name })).toBeInTheDocument();
  }
});
