import { ReactNode } from "react";
import classnames from "classnames";
import { KeyValue } from "../../lib/keyboard";
import { CharStatus } from "../../lib/statuses";

type Props = {
  children?: ReactNode;
  value: KeyValue;
  // Enter and Delete take one and a half letter widths.
  isWide?: boolean;
  status?: CharStatus;
  onClick: (value: KeyValue) => void;
};

export const Key = ({
  children,
  status,
  isWide = false,
  value,
  onClick,
}: Props) => {
  const classes = classnames(
    "flex items-center justify-center h-14 rounded mx-0.5 text-xs font-bold cursor-pointer select-none touch-manipulation hover:brightness-95 active:brightness-90",
    {
      "flex-1 max-w-[40px]": !isWide,
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
  const label =
    value === "ENTER"
      ? "Enter"
      : value === "DELETE"
        ? "Delete"
        : status
          ? `${value}, ${status}`
          : value;

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
