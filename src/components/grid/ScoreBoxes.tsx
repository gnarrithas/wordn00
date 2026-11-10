import classnames from "classnames";
import { FLIP_MS, getRevealStaggerMs, SCORE_BOXES } from "../../lib/reveal";
import { Score } from "../../lib/score";
import { STATUS_CLASSES } from "./Cell";

type Props = {
  // Omit for the empty boxes of rows not guessed yet.
  score?: Score;
  // When set, the boxes flip in starting after this many ms.
  revealDelayMs?: number;
  size?: "md" | "sm";
  // Dashed borders for the extra row that hints the board can grow.
  isDashed?: boolean;
  // Off for the help text, which never scrolls sideways.
  isSticky?: boolean;
};

const ORDER: (keyof Score)[] = ["correct", "present", "absent"];

// Wide enough for two digits; as tall as the letter tiles.
const SIZES = {
  md: "w-9 h-11 text-lg sm:w-11 sm:h-14 sm:text-2xl",
  sm: "w-8 h-10 text-lg",
};

// A guess's score, shown before its letters so every row's score lines up.
// Sticky, so it stays in view while a long row is scrolled sideways.
export const ScoreBoxes = ({
  score,
  revealDelayMs,
  size = "md",
  isDashed = false,
  isSticky = true,
}: Props) => {
  const staggerMs = getRevealStaggerMs(SCORE_BOXES);
  return (
    <div
      className={classnames("flex shrink-0 pr-1.5", {
        "sticky left-0 z-10 bg-white dark:bg-wordle-night-bg": isSticky,
      })}
      role={score ? "img" : undefined}
      aria-label={
        score
          ? `${score.correct} correct, ${score.present} present, ${score.absent} absent`
          : undefined
      }
      data-testid="score"
    >
      {ORDER.map((key, i) => {
        const delayMs =
          revealDelayMs === undefined
            ? undefined
            : revealDelayMs + i * staggerMs;
        return (
          <div
            key={key}
            aria-hidden="true"
            className={classnames(
              "shrink-0 border-2 flex items-center justify-center mx-0.5 font-bold rounded tabular-nums",
              SIZES[size],
              // Always in their colours; rows not guessed yet just have no
              // digits, and the dashed row is faded.
              STATUS_CLASSES[key],
              isDashed ? "border-dashed opacity-40" : "border-solid",
              { "score-reveal": delayMs !== undefined },
            )}
            style={
              delayMs === undefined
                ? undefined
                : {
                    animationDuration: `${FLIP_MS}ms, ${FLIP_MS / 2}ms`,
                    // Same timing as a tile flip; only the digit is hidden.
                    animationDelay: `${delayMs}ms, ${delayMs}ms`,
                  }
            }
          >
            {score?.[key]}
          </div>
        );
      })}
    </div>
  );
};
