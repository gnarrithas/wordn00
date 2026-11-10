import { useCallback, useEffect, useRef } from "react";
import { MIN_GUESSES } from "../../constants/settings";
import { Marks } from "../../lib/marks";
import { CompletedRow } from "./CompletedRow";
import { CurrentRow } from "./CurrentRow";
import { EmptyRow } from "./EmptyRow";

type Props = {
  guesses: string[];
  currentGuess: string;
  solution: string;
  maxGuesses: number;
  isGameOver: boolean;
  // End of game: the tiles flip over to their Wordle colours, then stay so.
  boardReveal?: "flipping" | "revealed";
  // Reveal Length: outline the guesses that have the answer's length.
  highlightLength?: boolean;
  // Dev only: letters shown faded in the input row's empty boxes.
  hint?: string;
  // The word's length once Reveal Length has found it: later rows mark it.
  knownLength?: number;
  // The player's letter marks, and how tapping a letter changes them.
  marks?: Marks;
  onMark?: (letter: string) => void;
};

export const Grid = ({
  guesses,
  currentGuess,
  solution,
  maxGuesses,
  isGameOver,
  boardReveal,
  highlightLength = false,
  hint,
  knownLength,
  marks,
  onMark,
}: Props) => {
  const showCurrentRow = !isGameOver && guesses.length < maxGuesses;
  // The board always starts MIN_GUESSES rows tall; longer words with extra guesses
  // grow it one row at a time as those guesses are used.
  const empties = Array.from(
    Array(Math.max(0, MIN_GUESSES - guesses.length - (showCurrentRow ? 1 : 0))),
  );
  // A dashed row closes the board while a guess after the current one is
  // still possible, hinting that the board can grow. Once the empty rows run
  // out it sits right after the input row.
  const showDashedRow = showCurrentRow && guesses.length + 1 < maxGuesses;
  const isDashedRowNext = showDashedRow && empties.length === 0;
  const scrollRef = useRef<HTMLDivElement>(null);
  // Only rows added since the last render play the reveal animation.
  const prevCountRef = useRef(guesses.length);
  const firstNewRow = Math.min(prevCountRef.current, guesses.length);

  useEffect(() => {
    prevCountRef.current = guesses.length;
  }, [guesses.length]);
  const rowsRef = useRef<HTMLDivElement>(null);

  // Keep the active row (or the last row once the board is full) in view,
  // and, while typing a long guess, the empty box after its newest letter.
  const scrollToActive = useCallback(() => {
    const container = scrollRef.current;
    const rows = rowsRef.current?.children;
    if (!container || !rows || rows.length === 0) {
      return;
    }
    const row = rows[Math.min(guesses.length, rows.length - 1)] as HTMLElement;
    // Bring the dashed row after the input row into view too.
    const lastRow = (
      isDashedRowNext ? (row.nextElementSibling ?? row) : row
    ) as HTMLElement;
    const rowBottom = lastRow.offsetTop + lastRow.offsetHeight;
    container.scrollTop = Math.max(0, rowBottom - container.clientHeight);

    if (!showCurrentRow || currentGuess.length === 0) {
      return;
    }
    // A row is its score boxes, then its letter tiles.
    const [score, letters] = Array.from(row.children) as HTMLElement[];
    const cell = (letters?.children[currentGuess.length] ??
      letters?.children[currentGuess.length - 1]) as HTMLElement | undefined;
    if (!cell) {
      return;
    }
    // Positions relative to the scroll container (the offsetParent). The
    // sticky score boxes cover the row's left edge.
    const cellLeft = cell.offsetLeft;
    const cellRight = cellLeft + cell.offsetWidth;
    const scoreWidth = score?.offsetWidth ?? 0;
    if (cellRight > container.scrollLeft + container.clientWidth) {
      container.scrollLeft = cellRight - container.clientWidth;
    } else if (cellLeft - scoreWidth < container.scrollLeft) {
      container.scrollLeft = Math.max(0, cellLeft - scoreWidth);
    }
  }, [guesses.length, currentGuess.length, showCurrentRow, isDashedRowNext]);

  useEffect(() => {
    scrollToActive();
    window.addEventListener("resize", scrollToActive);
    return () => window.removeEventListener("resize", scrollToActive);
  }, [scrollToActive]);

  return (
    // min-h-0 lets the board shrink to the space left above the keyboard,
    // so it only scrolls once the rows no longer fit on screen.
    <div className="flex flex-col min-h-0 pb-2 sm:pb-6">
      <div
        ref={scrollRef}
        // Scrollable, so keyboard users can focus it to scroll; name it.
        tabIndex={0}
        role="region"
        aria-label="Board"
        // Top padding keeps the first row clear of the header.
        className="board-scroll relative min-h-0 overflow-auto pt-6"
      >
        {/* px-1 leaves room for the Reveal Length outline around a row. */}
        <div ref={rowsRef} data-testid="board" className="w-max mx-auto px-1">
          {guesses.map((guess, i) => (
            <CompletedRow
              key={i}
              guess={guess}
              solution={solution}
              revealDelayMs={i >= firstNewRow ? 0 : undefined}
              isRevealed={boardReveal !== undefined}
              isFlipping={boardReveal === "flipping"}
              isLengthMatch={
                highlightLength &&
                guess !== solution &&
                guess.length === solution.length
              }
              marks={marks}
              onMark={isGameOver ? undefined : onMark}
            />
          ))}
          {showCurrentRow && (
            <CurrentRow
              guess={currentGuess}
              hint={hint}
              knownLength={knownLength}
            />
          )}
          {empties.map((_, i) => (
            <EmptyRow key={i} knownLength={knownLength} />
          ))}
          {showDashedRow && <EmptyRow isDashed knownLength={knownLength} />}
        </div>
      </div>
    </div>
  );
};
