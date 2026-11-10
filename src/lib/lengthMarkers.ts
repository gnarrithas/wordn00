import { MIN_ROW_CELLS } from "../constants/settings";

// Once Reveal Length has found the word's length, rows after that guess dot
// the boxes where it differs from the usual five: boxes 6 to the length for a
// longer word, or the boxes past the end of a shorter one.

// Boxes an empty row shows.
export const getRowCells = (knownLength?: number) =>
  Math.max(MIN_ROW_CELLS, knownLength ?? 0);

// Whether the box at 0-based `index` is dotted.
export const isLengthMarker = (index: number, knownLength?: number) => {
  if (knownLength === undefined) {
    return false;
  }
  return knownLength > MIN_ROW_CELLS
    ? index >= MIN_ROW_CELLS && index < knownLength
    : index >= knownLength && index < MIN_ROW_CELLS;
};
