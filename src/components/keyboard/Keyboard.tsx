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

export const Keyboard = ({
  onChar,
  onDelete,
  onEnter,
  onHint,
  onClearMarks,
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
    return onChar(value);
  };

  // The window listener is attached once and always calls the latest props.
  const latestRef = useRef({
    onChar,
    onDelete,
    onEnter,
    isInputDisabled,
    isPhysicalKeyboardIgnored,
  });
  const focusedByKeyboardRef = useRef<() => boolean>(() => false);
  latestRef.current = {
    onChar,
    onDelete,
    onEnter,
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
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }
      const active = document.activeElement;
      if (isTextField(active)) {
        return;
      }
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
        {[..."ASDFGHJKL"].map(letterKey)}
      </div>
      <div className="flex justify-center">
        <Key isWide value="ENTER" onClick={onClick}>
          Enter
        </Key>
        {[..."ZXCVBNM"].map(letterKey)}
        <Key isWide value="DELETE" onClick={onClick}>
          Delete
        </Key>
      </div>
      <div className="flex justify-center">
        <Key isWide value="HINT" onClick={onClick}>
          Hint
        </Key>
        <Key isSpace value="SPACE" onClick={onClick}>
          SPACE
        </Key>
        <Key isWide value="CLEAR" onClick={onClick}>
          Clear
        </Key>
      </div>
    </div>
  );
};
