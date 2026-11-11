import classnames from "classnames";
import { CSSProperties, useState } from "react";
import { getMark, Marks } from "../../lib/marks";
import { getGuessRevealMs } from "../../lib/reveal";
import { getGuessStatuses, getScore } from "../../lib/score";
import { Cell } from "./Cell";
import { ScoreBoxes } from "./ScoreBoxes";

type Props = {
  guess: string;
  solution: string;
  // Delay before this row starts revealing; omit to show it already revealed.
  revealDelayMs?: number;
  // Game over: the tiles show their Wordle colours instead of the marks.
  isRevealed?: boolean;
  // ...and flip over to them now.
  isFlipping?: boolean;
  // Reveal Length: the guess has the answer's length.
  isLengthMatch?: boolean;
  // This guess's index on the board, which its tile marks are keyed by.
  row?: number;
  // The player's tile marks colour the tiles.
  marks?: Marks;
  // Tapping a tile cycles its mark; omit once the game is over.
  onMark?: (row: number, position: number) => void;
  // Letters that cannot be re-marked (see getForcedAbsent).
  lockedLetters?: Set<string>;
};

export const CompletedRow = ({
  guess,
  solution,
  revealDelayMs,
  isRevealed = false,
  isFlipping = false,
  isLengthMatch = false,
  row = 0,
  marks = {},
  onMark,
  lockedLetters,
}: Props) => {
  const score = getScore(guess, solution);
  // Freeze the delay at mount: changing animation-delay mid-flight would
  // restart or skip the animation on later re-renders.
  const [startMs] = useState(revealDelayMs);
  const statuses = isRevealed ? getGuessStatuses(guess, solution) : undefined;
  const outlineStartMs = (startMs ?? 0) + getGuessRevealMs();
  // A row that just arrived pops its Reveal Length outline in once it has
  // been revealed; a restored row shows it straight away.
  const isEntering = isLengthMatch && startMs !== undefined;

  return (
    <div
      // w-max: hug this row's tiles instead of stretching to the widest row,
      // so the Reveal Length outline stays the guess's own size.
      className={classnames("flex w-max mb-1", {
        "length-match": isLengthMatch,
        "length-match-enter": isEntering,
      })}
      style={
        isEntering
          ? ({
              "--length-match-delay": `${outlineStartMs}ms`,
            } as CSSProperties)
          : undefined
      }
    >
      <ScoreBoxes score={score} revealDelayMs={startMs} />
      <div
        className="flex"
        role="group"
        aria-label={`Guess: ${guess}${isLengthMatch ? " (right length)" : ""}`}
      >
        {guess.split("").map((letter, i) => (
          <Cell
            key={i}
            value={letter}
            status={statuses ? statuses[i] : getMark(marks, row, i)}
            // The whole board flips at once, from the marks to the answer.
            revealDelayMs={isFlipping ? 0 : undefined}
            fromStatus={getMark(marks, row, i)}
            onClick={
              onMark && !lockedLetters?.has(letter)
                ? () => onMark(row, i)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
};
