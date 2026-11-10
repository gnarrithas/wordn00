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
};

type Props = {
  children?: ReactNode;
  value: KeyValue;
  // Enter and Delete take one and a half letter widths.
  isWide?: boolean;
  // The space bar spans the width of five letters.
  isSpace?: boolean;
  status?: CharStatus;
  onClick: (value: KeyValue) => void;
};

export const Key = ({
  children,
  status,
  isWide = false,
  isSpace = false,
  value,
  onClick,
}: Props) => {
  const classes = classnames(
    "flex items-center justify-center h-14 rounded mx-0.5 text-xs font-bold cursor-pointer select-none touch-manipulation hover:brightness-95 active:brightness-90",
    {
      "flex-1 max-w-[40px]": !isWide && !isSpace,
      "flex-[5] max-w-[208px]": isSpace,
      "flex-[1.5] max-w-[65px]": isWide,
      "bg-wordle-empty dark:bg-wordle-night-key dark:text-white": !status,
      "bg-wordle-absent dark:bg-wordle-night-absent text-white":
        status === "absent",
      "bg-wordle-correct dark:bg-wordle-night-correct text-white":
        status === "correct",
      "bg-wordle-present dark:bg-wordle-night-present text-white":
        status === "present",
    },
  );

  // Screen readers hear the letter's mark too, e.g. "A, correct".
  const label = KEY_LABELS[value] ?? (status ? `${value}, ${status}` : value);

  return (
    <button
      type="button"
      aria-label={label}
      className={classes}
      onClick={() => onClick(value)}
    >
      {children || value}
    </button>
  );
};
