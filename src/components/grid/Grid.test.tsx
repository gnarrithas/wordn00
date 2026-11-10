import { cleanup, render, screen } from "@testing-library/react";
import { Grid } from "./Grid";

const renderGrid = (guessCount: number, maxGuesses: number) =>
  render(
    <Grid
      guesses={Array(guessCount).fill("ABCDEFG")}
      currentGuess=""
      solution="ZYXWVUT"
      maxGuesses={maxGuesses}
      isGameWon={false}
      isGameOver={false}
    />,
  );

const rows = () => Array.from(screen.getByTestId("board").children);
// A row is its score boxes, then its letter tiles.
const tiles = (row: Element) => Array.from(row.lastElementChild!.children);
const isDashedRow = (row: Element) =>
  row.querySelectorAll(".border-solid, .border-dotted").length === 0 &&
  row.querySelectorAll(".border-dashed").length > 0;

const renderOver = () =>
  render(
    <Grid
      guesses={Array(8).fill("ABCDEFG")}
      currentGuess=""
      solution="ZYXWVUT"
      maxGuesses={8}
      isGameWon={false}
      isGameOver
    />,
  );

// Eight rows plus the dashed row until guesses outgrow them.
test.each([
  [0, 10, 9],
  [6, 10, 9],
  [7, 10, 9],
  [8, 10, 10],
  [0, 8, 9],
  [6, 8, 9],
])(
  "%i guesses of %i: %i rows, exactly one dashed, at the bottom",
  (guessCount, maxGuesses, rowCount) => {
    renderGrid(guessCount, maxGuesses);
    expect(rows()).toHaveLength(rowCount);
    expect(rows().filter(isDashedRow)).toHaveLength(1);
    expect(isDashedRow(rows()[rowCount - 1])).toBe(true);
  },
);

test.each([
  [9, 10],
  [7, 8],
])("no dashed row on the last allowed guess (%i of %i)", (count, max) => {
  renderGrid(count, max);
  expect(rows()).toHaveLength(max);
  expect(rows().some(isDashedRow)).toBe(false);
});

test("no dashed row once the game is over", () => {
  renderOver();
  expect(rows()).toHaveLength(8);
  expect(rows().some(isDashedRow)).toBe(false);
});

describe("known length markers", () => {
  const borders = (row: Element) =>
    tiles(row).map((c) =>
      c.classList.contains("border-dotted")
        ? "."
        : c.classList.contains("border-dashed")
          ? "-"
          : "o",
    );
  const renderKnown = (
    solution: string,
    currentGuess: string,
    knownLength?: number,
  ) =>
    render(
      <Grid
        guesses={["ABC"]}
        currentGuess={currentGuess}
        solution={solution}
        maxGuesses={9}
        isGameWon={false}
        isGameOver={false}
        knownLength={knownLength}
      />,
    );

  test("a longer word dots boxes 6 to its length in later rows", () => {
    renderKnown("ZYXWVUTS", "", 8);
    const [, current, empty] = rows();
    expect(borders(current).join("")).toBe("ooooo...");
    expect(borders(empty).join("")).toBe("ooooo...");
  });

  test("typed letters fill the dotted boxes; the grow box stays dashed", () => {
    renderKnown("ZYXWVUTS", "ABCDEF", 8);
    expect(borders(rows()[1]).join("")).toBe("oooooo..");
    cleanup();
    renderKnown("ZYXWVUTS", "ABCDEFGH", 8);
    expect(borders(rows()[1]).join("")).toBe("oooooooo-");
  });

  test("a shorter word dots the boxes past its end, up to five", () => {
    renderKnown("ZYX", "", 3);
    const [, current, empty] = rows();
    expect(borders(current).join("")).toBe("ooo..");
    expect(borders(empty).join("")).toBe("ooo..");
  });

  test("a five-letter word and an unknown length dot nothing", () => {
    renderKnown("ZYXWV", "", 5);
    expect(borders(rows()[2]).join("")).toBe("ooooo");
    cleanup();
    renderKnown("ZYXWVUTS", "");
    expect(borders(rows()[2]).join("")).toBe("ooooo");
  });

  test("the dashed row stays dashed and spans the length", () => {
    renderKnown("ZYXWVUTS", "", 8);
    const last = rows()[rows().length - 1];
    expect(borders(last).join("")).toBe("--------");
  });
});
