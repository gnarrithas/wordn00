import classnames from "classnames";
import { CSSProperties, useState } from "react";
import { Marks } from "../../lib/marks";
import {
  BOUNCE_MS,
  getBounceStaggerMs,
  getGuessRevealMs,
  getRevealStaggerMs,
} from "../../lib/reveal";
import { getScore } from "../../lib/score";
import { Cell } from "./Cell";
import { ScoreBoxes } from "./ScoreBoxes";

type Props = {
  guess: string;
  solution: string;
  // Delay before this row starts revealing; omit to show it already revealed.
  revealDelayMs?: number;
  // The winning guess: its tiles turn green and bounce.
  isWinningRow?: boolean;
  // Reveal Length: the guess has the answer's length.
  isLengthMatch?: boolean;
  // The player's letter marks colour the tiles.
  marks?: Marks;
  // Tapping a tile cycles its letter's mark; omit once the game is over.
  onMark?: (letter: string) => void;
};

export const CompletedRow = ({
  guess,
  solution,
  revealDelayMs,
  isWinningRow = false,
  isLengthMatch = false,
  marks = {},
  onMark,
}: Props) => {
  const score = getScore(guess, solution);
  // Freeze the delay at mount: changing animation-delay mid-flight would
  // restart or skip the animation on later re-renders.
  const [startMs] = useState(revealDelayMs);
  const staggerMs = getRevealStaggerMs(guess.length);
  const bounceStartMs =
    (startMs ?? 0) + getGuessRevealMs(guess.length, isWinningRow);
  const bounceStaggerMs = getBounceStaggerMs(guess.length);
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
              "--length-match-delay": `${bounceStartMs}ms`,
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
          // The bounce lives on a wrapper so its transform does not replace
          // the tile's own flip animation.
          <div
            key={i}
            className={isWinningRow ? "cell-bounce" : undefined}
            style={
              isWinningRow
                ? {
                    animationDuration: `${BOUNCE_MS}ms`,
                    animationDelay: `${bounceStartMs + i * bounceStaggerMs}ms`,
                  }
                : undefined
            }
          >
            <Cell
              value={letter}
              status={isWinningRow ? "correct" : marks[letter]}
              // Only the winning row's letters flip; the others keep the
              // player's marks.
              revealDelayMs={
                isWinningRow && startMs !== undefined
                  ? startMs + i * staggerMs
                  : undefined
              }
              onClick={onMark && (() => onMark(letter))}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
