import { MAX_WORD_LENGTH, MIN_ROW_CELLS } from "../../constants/settings";
import { getRowCells, isLengthMarker } from "../../lib/lengthMarkers";
import { Cell } from "./Cell";

type Props = {
  guess: string;
  // Faded letters for the boxes not typed yet, by position.
  hint?: string;
  // The word's length once Reveal Length has found it (see lengthMarkers.ts).
  knownLength?: number;
};

export const CurrentRow = ({ guess, hint = "", knownLength }: Props) => {
  const splitGuess = guess.split("");
  // Always keep one empty box after the last letter (up to the maximum word
  // length), so typing past five letters visibly grows the row.
  // A hint, or a known length, also stretches the row to that length.
  const emptyCount = Math.max(
    getRowCells(knownLength) - splitGuess.length,
    splitGuess.length < MAX_WORD_LENGTH ? 1 : 0,
    hint.length - splitGuess.length,
  );
  const emptyCells = Array.from(Array(emptyCount));

  return (
    <div className="flex mb-1" role="group" aria-label="Current guess">
      {splitGuess.map((letter, i) => (
        <Cell key={i} value={letter} />
      ))}
      {emptyCells.map((_, i) => {
        const index = splitGuess.length + i;
        const isDotted = isLengthMarker(index, knownLength);
        return (
          <Cell
            key={`empty-${i}`}
            // Dotted length markers take precedence over the grow hint.
            isDashed={!isDotted && splitGuess.length >= MIN_ROW_CELLS}
            isDotted={isDotted}
            hint={hint[index]}
          />
        );
      })}
    </div>
  );
};
