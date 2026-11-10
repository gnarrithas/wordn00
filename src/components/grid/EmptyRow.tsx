import { getRowCells, isLengthMarker } from "../../lib/lengthMarkers";
import { Cell } from "./Cell";
import { ScoreBoxes } from "./ScoreBoxes";

type Props = {
  // Dashed borders for the extra row that hints the board can grow.
  isDashed?: boolean;
  // The word's length once Reveal Length has found it (see lengthMarkers.ts).
  knownLength?: number;
};

export const EmptyRow = ({ isDashed = false, knownLength }: Props) => {
  const emptyCells = Array.from(Array(getRowCells(knownLength)));

  return (
    <div className="flex w-max mb-1">
      <ScoreBoxes isDashed={isDashed} />
      <div className="flex">
        {emptyCells.map((_, i) => (
          <Cell
            key={i}
            isDashed={isDashed}
            isDotted={isLengthMarker(i, knownLength)}
          />
        ))}
      </div>
    </div>
  );
};
