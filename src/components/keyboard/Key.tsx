import { ReactNode } from "react";
import classnames from "classnames";
import { KeyValue } from "../../lib/keyboard";
import { CharStatus } from "../../lib/statuses";

const KEY_LABELS: Partial<Record<KeyValue, string>> = {
  ENTER: "Enter",
  DELETE: "Delete",
  SPACE: "Space (blank letter)",
  HINT: "Hint",
  CLEAR: "Clear marks",
  UNDO: "Undo mark change",
  REDO: "Redo mark change",
};

type Props = {
  children?: ReactNode;
  value: KeyValue;
  // Enter and Delete take one and a half letter widths.
  isWide?: boolean;
  // The space bar spans the width of five letters.
  isSpace?: boolean;
  status?: CharStatus;
  // A letter already guessed: dimmed, as in Word500, unless marked.
  isUsed?: boolean;
  // Greyed out and inert, e.g. Undo with nothing to undo.
  isDisabled?: boolean;
  onClick: (value: KeyValue) => void;
};

export const Key = ({
  children,
  status,
  isWide = false,
  isSpace = false,
  isUsed = false,
  isDisabled = false,
  value,
  onClick,
}: Props) => {
  const classes = classnames(
    "flex items-center justify-center h-12 sm:h-14 rounded-tile m-0.5 font-bold uppercase cursor-pointer select-none touch-manipulation transition hover:brightness-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent",
    {
      "flex-1 max-w-[46px] text-base": !isWide && !isSpace,
      // Word labels are smaller than letters; SPACE is spaced out.
      "flex-[5] max-w-[240px] text-xs tracking-[2px]": isSpace,
      "flex-[1.5] max-w-[72px] text-xs": isWide,
      "bg-ui-key text-ui-text": !status && !isUsed,
      "bg-ui-key-used text-ui-key-used-text": !status && isUsed,
      "opacity-40 cursor-default pointer-events-none": isDisabled,
      "bg-wordle-absent dark:bg-wordle-night-absent text-white":
        status === "absent",
      "bg-wordle-correct dark:bg-wordle-night-correct text-white":
        status === "correct",
      "bg-wordle-present dark:bg-wordle-night-present text-white":
        status === "present",
    },
  );

  // Screen readers hear the letter's mark, else whether it was guessed.
  const label =
    KEY_LABELS[value] ??
    (status ? `${value}, ${status}` : isUsed ? `${value}, used` : value);

  return (
    <button
      type="button"
      aria-label={label}
      className={classes}
      disabled={isDisabled}
      onClick={() => onClick(value)}
    >
      {children || value}
    </button>
  );
};
