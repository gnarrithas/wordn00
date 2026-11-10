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
  // Makes the tile a button, e.g. to cycle its letter's mark.
  onClick?: () => void;
};

export const CELL_SIZES = {
  md: "w-11 h-11 text-xl sm:w-14 sm:h-14 sm:text-2xl",
  sm: "w-10 h-10 text-xl",
};

// Tile colours by status; score boxes use the same palette.
export const STATUS_CLASSES: Record<CharStatus, string> = {
  absent:
    "bg-wordle-absent dark:bg-wordle-night-absent text-white border-wordle-absent dark:border-wordle-night-absent",
  correct:
    "bg-wordle-correct dark:bg-wordle-night-correct text-white border-wordle-correct dark:border-wordle-night-correct",
  present:
    "bg-wordle-present dark:bg-wordle-night-present text-white border-wordle-present dark:border-wordle-night-present",
};

export const Cell = ({
  value,
  status,
  revealDelayMs,
  size = "md",
  isDashed = false,
  isDotted = false,
  hint,
  onClick,
}: Props) => {
  const isRevealing = revealDelayMs !== undefined;
  const classes = classnames(
    "shrink-0 border-2 flex items-center justify-center mx-0.5 font-bold rounded",
    CELL_SIZES[size],
    status && STATUS_CLASSES[status],
    {
      "border-dashed": isDashed,
      "border-dotted": isDotted && !isDashed,
      "border-solid": !isDashed && !isDotted,
      "bg-white dark:bg-wordle-night-bg border-wordle-empty dark:border-wordle-night-empty":
        !status && !value,
      "bg-white dark:bg-wordle-night-bg border-wordle-filled dark:border-wordle-night-filled":
        !status && value,
      "cursor-pointer select-none touch-manipulation hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500":
        onClick,
      "cell-reveal": isRevealing,
    },
  );
  const style = isRevealing
    ? {
        animationDuration: `${FLIP_MS}ms, ${FLIP_MS / 2}ms`,
        animationDelay: `${revealDelayMs}ms, ${revealDelayMs}ms`,
      }
    : undefined;
  const content =
    value ??
    (hint && (
      <span className="opacity-25" data-testid="hint">
        {hint}
      </span>
    ));

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        style={style}
        aria-label={`${value}${status ? `, marked ${status}` : ""}`}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }
  return (
    <div
      className={classes}
      style={style}
      // A coloured tile reads as e.g. "C correct".
      role={status ? "img" : undefined}
      aria-label={status && value ? `${value} ${status}` : undefined}
    >
      {content}
    </div>
  );
};
