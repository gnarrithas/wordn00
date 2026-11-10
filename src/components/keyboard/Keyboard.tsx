import { useEffect, useRef } from "react";
import { PLACEHOLDER } from "../../constants/settings";
import { KeyValue } from "../../lib/keyboard";
import { Marks } from "../../lib/marks";
import { Key } from "./Key";

type Props = {
  onChar: (value: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  // Types a word that fits every score so far.
  onHint: () => void;
  // Removes every letter mark.
  onClearMarks: () => void;
  // Step back and forth through mark changes; the flags enable the keys.
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  // The player's letter marks colour the keys.
  marks: Marks;
  // Letters already guessed, dimmed unless marked.
  usedLetters?: Set<string>;
  // While a modal is open, physical keys must not reach the game.
  isInputDisabled?: boolean;
  // Onscreen Keyboard Input Only: physical keys never type.
  isPhysicalKeyboardIgnored?: boolean;
};

const isTextField = (el: Element | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

const isControl = (el: Element | null) =>
  el instanceof HTMLElement && el.matches("button, a[href]");

// Keys that move focus around the page. Typing letters does not count, so a
// button clicked with the mouse stays "mouse-focused" while the player types.
const NAVIGATION_KEYS = new Set([
  "Tab",
  "Escape",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

// Half a key of empty space, as in Word500's layout, so rows two and three
// sit indented under the top row.
const Gap = () => (
  <div aria-hidden="true" className="flex-[0.5] max-w-[23px] m-0.5" />
);

// A U-turn arrow pointing left (undo); mirrored, it is redo.
const UndoArrow = ({ className = "" }: { className?: string }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-5 h-5 ${className}`}
  >
    <path d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
  </svg>
);

export const Keyboard = ({
  onChar,
  onDelete,
  onEnter,
  onHint,
  onClearMarks,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  marks: charStatuses,
  usedLetters = new Set(),
  isInputDisabled = false,
  isPhysicalKeyboardIgnored = false,
}: Props) => {
  const onClick = (value: KeyValue) => {
    if (value === "ENTER") {
      return onEnter();
    }
    if (value === "DELETE") {
      return onDelete();
    }
    if (value === "SPACE") {
      return onChar(PLACEHOLDER);
    }
    if (value === "HINT") {
      return onHint();
    }
    if (value === "CLEAR") {
      return onClearMarks();
    }
    if (value === "UNDO") {
      return onUndo();
    }
    if (value === "REDO") {
      return onRedo();
    }
    return onChar(value);
  };

  // The window listener is attached once and always calls the latest props.
  const latestRef = useRef({
    onChar,
    onDelete,
    onEnter,
    onUndo,
    onRedo,
    isInputDisabled,
    isPhysicalKeyboardIgnored,
  });
  const focusedByKeyboardRef = useRef<() => boolean>(() => false);
  latestRef.current = {
    onChar,
    onDelete,
    onEnter,
    onUndo,
    onRedo,
    isInputDisabled,
    isPhysicalKeyboardIgnored,
  };

  // A control the player reached with the keyboard keeps its own Enter
  // activation. One focused by a click or tap (or given focus back after a
  // modal was closed with the mouse) does not, so Enter still submits the
  // guess. Chrome's :focus-visible cannot tell these apart: it turns on for a
  // clicked button as soon as any key is typed.
  useEffect(() => {
    let lastInput: "pointer" | "keyboard" = "pointer";
    let focusedByKeyboard = false;
    const onPointerDown = () => {
      lastInput = "pointer";
    };
    const onNavigationKey = (e: KeyboardEvent) => {
      if (NAVIGATION_KEYS.has(e.key)) {
        lastInput = "keyboard";
      }
    };
    // Mouse-focused controls are marked so index.css can hide the focus
    // ring Chrome would otherwise show once the player starts typing.
    const onFocusIn = (e: FocusEvent) => {
      focusedByKeyboard = lastInput === "keyboard";
      if (e.target instanceof HTMLElement) {
        e.target.toggleAttribute("data-mouse-focus", !focusedByKeyboard);
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (e.target instanceof HTMLElement) {
        e.target.removeAttribute("data-mouse-focus");
      }
    };
    // Space types a placeholder, so it must not also press a mouse-focused
    // button (e.g. New word) again; buttons reached by keyboard keep it.
    // Browsers press on keyup, so both events are cancelled, even while
    // input is disabled.
    const onSpace = (e: KeyboardEvent) => {
      if (
        (e.key === " " || e.code === "Space") &&
        isControl(document.activeElement) &&
        !focusedByKeyboard
      ) {
        e.preventDefault();
      }
    };
    focusedByKeyboardRef.current = () => focusedByKeyboard;
    // Capture phase, so this runs before focus moves and before any handler
    // that might stop the event.
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onNavigationKey, true);
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    document.addEventListener("keydown", onSpace, true);
    document.addEventListener("keyup", onSpace, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("keydown", onNavigationKey, true);
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      document.removeEventListener("keydown", onSpace, true);
      document.removeEventListener("keyup", onSpace, true);
    };
  }, []);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const latest = latestRef.current;
      if (
        latest.isInputDisabled ||
        latest.isPhysicalKeyboardIgnored ||
        isTextField(document.activeElement)
      ) {
        return;
      }
      // Undo: Ctrl/Cmd+Z. Redo: Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y.
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "z" || key === "y") {
          e.preventDefault();
          if (key === "z" && !e.shiftKey) {
            latest.onUndo();
          } else {
            latest.onRedo();
          }
        }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      const active = document.activeElement;
      if (e.code === "Enter" || e.code === "NumpadEnter" || e.key === "Enter") {
        if (e.repeat || (isControl(active) && focusedByKeyboardRef.current())) {
          return;
        }
        // Keep a mouse-focused button from also activating.
        e.preventDefault();
        latest.onEnter();
      } else if (e.key === "-") {
        // Hyphen is the other placeholder key, as in Word500.
        latest.onChar(PLACEHOLDER);
      } else if (e.code === "Space" || e.key === " ") {
        // A control reached by keyboard keeps Space for its own activation.
        if (isControl(active) && focusedByKeyboardRef.current()) {
          return;
        }
        // Also keeps the page from scrolling.
        e.preventDefault();
        latest.onChar(PLACEHOLDER);
      } else if (e.code === "Backspace" || e.key === "Backspace") {
        // Repeats are allowed so holding Backspace keeps deleting.
        latest.onDelete();
      } else {
        const key = e.key.toUpperCase();
        if (key.length === 1 && key >= "A" && key <= "Z") {
          latest.onChar(key);
        }
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, []);

  const letterKey = (letter: string) => (
    <Key
      key={letter}
      value={letter as KeyValue}
      onClick={onClick}
      status={charStatuses[letter]}
      isUsed={usedLetters.has(letter)}
    />
  );

  return (
    // A raised panel, like the header card.
    <div className="w-[calc(100%-8px)] sm:w-[calc(100%-20px)] max-w-[520px] mx-auto p-1 bg-ui-surface border-[0.5px] border-ui-border rounded-card">
      <div className="flex justify-center">
        {[..."QWERTYUIOP"].map(letterKey)}
      </div>
      <div className="flex justify-center">
        <Gap />
        {[..."ASDFGHJKL"].map(letterKey)}
        <Gap />
      </div>
      <div className="flex justify-center">
        <Gap />
        {[..."ZXCVBNM"].map(letterKey)}
        <Key isWide value="DELETE" onClick={onClick}>
          Delete
        </Key>
        <Gap />
      </div>
      <div className="flex justify-center">
        <Key value="UNDO" onClick={onClick} isDisabled={!canUndo}>
          <UndoArrow />
        </Key>
        <Key value="REDO" onClick={onClick} isDisabled={!canRedo}>
          <UndoArrow className="-scale-x-100" />
        </Key>
        <Key isWide value="CLEAR" onClick={onClick}>
          Clear
        </Key>
        <Key isWide value="HINT" onClick={onClick}>
          Hint
        </Key>
        <Key isSpace value="SPACE" onClick={onClick}>
          SPACE
        </Key>
        <Key isWide value="ENTER" onClick={onClick}>
          Enter
        </Key>
      </div>
    </div>
  );
};
