import { getRowCells, isLengthMarker } from "../../lib/lengthMarkers";
import { Cell } from "./Cell";

type Props = {
  // Dashed borders for the extra row that hints the board can grow.
  isDashed?: boolean;
  // The word's length once Reveal Length has found it (see lengthMarkers.ts).
  knownLength?: number;
};

export const EmptyRow = ({ isDashed = false, knownLength }: Props) => {
  const emptyCells = Array.from(Array(getRowCells(knownLength)));

  return (
    <div className="flex mb-1">
      {emptyCells.map((_, i) => (
        <Cell
          key={i}
          isDashed={isDashed}
          isDotted={isLengthMarker(i, knownLength)}
        />
      ))}
    </div>
  );
};
