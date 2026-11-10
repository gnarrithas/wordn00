import { CharStatus } from "../../lib/statuses";
import classnames from "classnames";
import { FLIP_MS } from "../../lib/reveal";

type Props = {
  value?: string;
  status?: CharStatus;
  // When set, the tile plays the flip reveal starting after this many ms.
  revealDelayMs?: number;
  // "sm" for the smaller example tiles in the help text.
  size?: "md" | "sm";
  // Dashed border for the extra box that hints the row can grow.
  isDashed?: boolean;
  // Dotted border marking where the known word length differs from five.
  isDotted?: boolean;
  // Faded letter shown while the box is empty.
  hint?: string;
};

export const Cell = ({
  value,
  status,
  revealDelayMs,
  size = "md",
  isDashed = false,
  isDotted = false,
  hint,
}: Props) => {
  const isRevealing = revealDelayMs !== undefined;
  const classes = classnames(
    "shrink-0 border-2 flex items-center justify-center mx-0.5 font-bold rounded",
    {
      "w-14 h-14 text-2xl sm:w-16 sm:h-16 sm:text-3xl": size === "md",
      "w-10 h-10 text-xl": size === "sm",
      "border-dashed": isDashed,
      "border-dotted": isDotted && !isDashed,
      "border-solid": !isDashed && !isDotted,
      "bg-white dark:bg-wordle-night-bg border-wordle-empty dark:border-wordle-night-empty":
        !status && !value,
      "bg-white dark:bg-wordle-night-bg border-wordle-filled dark:border-wordle-night-filled":
        !status && value,
      "bg-wordle-absent dark:bg-wordle-night-absent text-white border-wordle-absent dark:border-wordle-night-absent":
        status === "absent",
      "bg-wordle-correct dark:bg-wordle-night-correct text-white border-wordle-correct dark:border-wordle-night-correct":
        status === "correct",
      "bg-wordle-present dark:bg-wordle-night-present text-white border-wordle-present dark:border-wordle-night-present":
        status === "present",
      "cell-reveal": isRevealing,
    },
  );
  const style = isRevealing
    ? {
        animationDuration: `${FLIP_MS}ms, ${FLIP_MS / 2}ms`,
        animationDelay: `${revealDelayMs}ms, ${revealDelayMs}ms`,
      }
    : undefined;

  return (
    <div
      className={classes}
      style={style}
      // A revealed tile reads as e.g. "C correct".
      role={status ? "img" : undefined}
      aria-label={status && value ? `${value} ${status}` : undefined}
    >
      {value ??
        (hint && (
          <span className="opacity-25" data-testid="hint">
            {hint}
          </span>
        ))}
    </div>
  );
};
