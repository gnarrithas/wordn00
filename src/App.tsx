import { CogIcon, QuestionMarkCircleIcon } from "@heroicons/react/outline";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "./components/alerts/Alert";
import { Grid } from "./components/grid/Grid";
import { Keyboard } from "./components/keyboard/Keyboard";
import { Logo } from "./components/logo/Logo";
import { InfoModal } from "./components/modals/InfoModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import {
  MAX_WORD_LENGTH,
  MIN_WORD_LENGTH,
  PLACEHOLDER,
} from "./constants/settings";
import {
  isWordInWordList,
  getWordOfDay,
  getDayIndex,
  getRandomWord,
  getMaxGuesses,
  isSolution,
  getSolutions,
  areWordsLoaded,
  loadWords,
} from "./lib/words";
import {
  clearPracticeGame,
  loadDailyGame,
  loadPracticeGame,
  SavedGame,
  saveGame,
} from "./lib/storage";
import {
  applyHighContrast,
  loadLevel,
  loadSettings,
  saveLevel,
  saveSetting,
  SettingKey,
  Settings,
} from "./lib/settings";
import { getExcludedLetters, Level } from "./lib/levels";
import { trackEvent } from "./lib/analytics";
import {
  GameTimer,
  loadActiveMs,
  pauseTimer,
  recordAction,
  resumeTimer,
  saveActiveMs,
  startTimer,
} from "./lib/gameTimer";
import { getTheme, setTheme, Theme, watchSystemTheme } from "./lib/theme";
import { copyText, countLetters, getShareText, getSiteUrl } from "./lib/share";
import { getWinMessage } from "./lib/winMessage";
import {
  FLIP_MS,
  getBoardFlipStartMs,
  getGuessRevealMs,
  prefersReducedMotion,
} from "./lib/reveal";
import {
  cycleMark,
  getForcedAbsent,
  Marks,
  withForcedAbsent,
} from "./lib/marks";
import {
  canRedo,
  canUndo,
  MarksHistory,
  recordMarks,
  redoMarks,
  startHistory,
  undoMarks,
} from "./lib/marksHistory";
import { findHint } from "./lib/hint";

const ANSWER_TOAST_MS = 5000;
const WIN_TOAST_MS = 2000;
const ERROR_TOAST_MS = 2000;
const SHARE_LABEL_MS = 2000;
const LENGTH_TOAST_MS = 3000;

// Header controls: flat key-coloured buttons on the header card.
const HEADER_CONTROL_CLASSES =
  "shrink-0 flex items-center justify-center h-9 sm:h-10 rounded-tile bg-ui-key text-ui-text transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent";
const HEADER_BUTTON_CLASSES = `${HEADER_CONTROL_CLASSES} whitespace-nowrap px-2.5 text-sm font-bold`;
const HEADER_ICON_CLASSES = `${HEADER_CONTROL_CLASSES} w-9 sm:w-10`;
// The green call to action (Share, Try again), with a darker bottom edge.
const PRIMARY_BUTTON_CLASSES =
  "px-6 py-2 text-sm font-bold rounded-tile text-white bg-wordle-correct shadow-[inset_0_-4px_0_rgba(0,0,0,0.15)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent";

type GameOutcome = "won" | "lost" | "skipped";

// The game to resume. An unfinished (or unstarted) daily word comes first, and
// a new day or a redeploy that moved today's word starts the day's word
// afresh; any saved New word game is then dropped. Once today's word is
// finished, a New word game in progress carries on. Each level has its own.
const loadRestorableGame = (level: Level): SavedGame | null => {
  const saved = loadDailyGame(level);
  const daily =
    saved &&
    isSolution(saved.solution, level) &&
    saved.day === getDayIndex() &&
    saved.solution === getWordOfDay(level, saved.day)
      ? saved
      : null;
  const practice = loadPracticeGame(level);
  if (
    daily &&
    (daily.isGameWon || daily.isAnswerRevealed) &&
    practice &&
    isSolution(practice.solution, level)
  ) {
    return practice;
  }
  clearPracticeGame(level);
  return daily;
};

function Game() {
  const [level, setLevel] = useState(loadLevel);
  const [initialGame] = useState(() => loadRestorableGame(level));
  const isRestoredGameOver = Boolean(
    initialGame && (initialGame.isGameWon || initialGame.isAnswerRevealed),
  );
  // Index in the daily sequence; null for a New word game.
  const [day, setDay] = useState<number | null>(() =>
    initialGame ? initialGame.day : getDayIndex(),
  );
  const [solution, setSolution] = useState(
    () => initialGame?.solution ?? getWordOfDay(level, day ?? 0),
  );
  const [guesses, setGuesses] = useState<string[]>(
    () => initialGame?.guesses ?? [],
  );
  const [currentGuess, setCurrentGuess] = useState("");
  // The player's marks, with undo and redo.
  const [marksHistory, setMarksHistory] = useState<MarksHistory>(() =>
    startHistory(initialGame?.marks ?? {}),
  );
  const marks = marksHistory.present;
  const [isGameWon, setIsGameWon] = useState(
    () => initialGame?.isGameWon ?? false,
  );
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(
    () => initialGame?.isAnswerRevealed ?? false,
  );
  // A finished game restored from storage shows its result without toasts.
  const skipEndToastRef = useRef(isRestoredGameOver);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // Dev only: the answer shows faded in the input row.
  const [isSolutionShown, setIsSolutionShown] = useState(false);
  // The answer as it was when revealed, so a fading toast never shows the
  // next word after New word.
  const [revealedAnswer, setRevealedAnswer] = useState(() =>
    initialGame?.isAnswerRevealed ? initialGame.solution : "",
  );

  const [settings, setSettings] = useState<Settings>(() => {
    const loaded = loadSettings();
    applyHighContrast(loaded.highContrast);
    return loaded;
  });
  const [theme, setThemeState] = useState<Theme>(getTheme);
  useEffect(() => watchSystemTheme(setThemeState), []);
  const [shareLabel, setShareLabel] = useState("Share");
  // End of game: the board shows the player's marks, flips over, then shows
  // every letter's Wordle colour. Share waits until it has.
  const [boardPhase, setBoardPhase] = useState<
    "marks" | "flipping" | "revealed"
  >(isRestoredGameOver ? "revealed" : "marks");
  const isEndAnimationDone = boardPhase === "revealed";
  const isBoardTurning = boardPhase !== "marks";
  // One toast at a time; a closing toast keeps its text while it fades out.
  const [toast, setToast] = useState({ message: "", isOpen: false });
  const toastTimerRef = useRef<number>();
  const shareTimerRef = useRef<number>();
  const lengthToastTimerRef = useRef<number>();
  // Active play time; an unfinished restored game continues its saved total.
  const gameTimerRef = useRef<GameTimer>();
  if (gameTimerRef.current === undefined) {
    gameTimerRef.current = startTimer(
      Date.now(),
      initialGame && !isRestoredGameOver ? loadActiveMs(solution) : 0,
    );
  }

  const showToast = useCallback((message: string, ms: number) => {
    window.clearTimeout(toastTimerRef.current);
    setToast({ message, isOpen: true });
    toastTimerRef.current = window.setTimeout(
      () => setToast((t) => ({ ...t, isOpen: false })),
      ms,
    );
  }, []);

  const hideToast = useCallback(() => {
    window.clearTimeout(toastTimerRef.current);
    setToast((t) => ({ ...t, isOpen: false }));
  }, []);

  useEffect(() => {
    saveGame(
      { solution, guesses, isGameWon, isAnswerRevealed, day, marks },
      level,
    );
  }, [solution, guesses, isGameWon, isAnswerRevealed, day, marks, level]);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimerRef.current);
      window.clearTimeout(shareTimerRef.current);
      window.clearTimeout(lengthToastTimerRef.current);
    },
    [],
  );

  const maxGuesses = getMaxGuesses(solution);
  const isGameOver = isGameWon || isAnswerRevealed;
  const lettersUsed = countLetters(guesses);

  const updateGameTimer = (update: (timer: GameTimer) => GameTimer) => {
    const timer = update(gameTimerRef.current ?? startTimer(Date.now()));
    gameTimerRef.current = timer;
    saveActiveMs(solution, timer.activeMs);
    return timer;
  };

  // Each player action extends the active time of an unfinished game.
  const notePlayerAction = () =>
    updateGameTimer((timer) => recordAction(timer, Date.now()));

  // Hidden-tab time never counts towards the game.
  const isGameOverRef = useRef(isGameOver);
  isGameOverRef.current = isGameOver;
  const updateGameTimerRef = useRef(updateGameTimer);
  updateGameTimerRef.current = updateGameTimer;
  useEffect(() => {
    const onVisibilityChange = () => {
      if (isGameOverRef.current) {
        return;
      }
      const now = Date.now();
      updateGameTimerRef.current((timer) =>
        document.visibilityState === "hidden"
          ? pauseTimer(timer, now)
          : resumeTimer(timer, now),
      );
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const trackGameEnd = (outcome: GameOutcome, guessCount: number) => {
    const { activeMs } = notePlayerAction();
    trackEvent("game_end", {
      outcome,
      guesses: guessCount,
      length: solution.length,
      level,
      maxGuesses,
      seconds: Math.round(activeMs / 1000),
      word: solution,
    });
  };

  // Cheer once the winning score is in; the board flips a little later.
  useEffect(() => {
    if (!isGameWon || skipEndToastRef.current) {
      return;
    }
    const revealMs = prefersReducedMotion() ? 0 : getGuessRevealMs();
    const message = getWinMessage(guesses.length, maxGuesses);
    const timer = setTimeout(() => showToast(message, WIN_TOAST_MS), revealMs);
    return () => clearTimeout(timer);
    // Only (re)schedule when the game is won, not on later guess changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameWon]);

  // Guesses whose score reveal has finished.
  const [revealedCount, setRevealedCount] = useState(guesses.length);
  // Reveal Length: once a revealed guess has the word's length, later rows
  // mark it.
  const knownLength =
    settings.revealLength &&
    guesses.slice(0, revealedCount).some((g) => g.length === solution.length)
      ? solution.length
      : undefined;
  // Keys of letters already guessed are dimmed, as soon as Enter is pressed.
  const usedLetters = useMemo(() => new Set(guesses.join("")), [guesses]);
  // Letters of all-red guesses, marked red by the game once the score is in.
  const forcedAbsent = useMemo(
    () => getForcedAbsent(guesses.slice(0, revealedCount), solution),
    [guesses, revealedCount, solution],
  );
  const shownMarks = useMemo(
    () => withForcedAbsent(marks, forcedAbsent),
    [marks, forcedAbsent],
  );

  useEffect(() => {
    if (guesses.length <= revealedCount) {
      // A new word cleared the board: reset straight away.
      setRevealedCount(guesses.length);
      return;
    }
    const timer = setTimeout(
      () => setRevealedCount(guesses.length),
      prefersReducedMotion() ? 0 : getGuessRevealMs(),
    );
    return () => clearTimeout(timer);
  }, [guesses, revealedCount]);

  // The end-of-game board flip, as in Word500. A finished game restored from
  // storage is already turned over.
  useEffect(() => {
    if (!isGameOver) {
      setBoardPhase("marks");
      return;
    }
    if (skipEndToastRef.current || prefersReducedMotion()) {
      setBoardPhase("revealed");
      return;
    }
    const startMs = getBoardFlipStartMs(isGameWon);
    const flipTimer = setTimeout(() => setBoardPhase("flipping"), startMs);
    const doneTimer = setTimeout(
      () => setBoardPhase("revealed"),
      startMs + FLIP_MS,
    );
    return () => {
      clearTimeout(flipTimer);
      clearTimeout(doneTimer);
    };
  }, [isGameOver, isGameWon]);

  // The answer appears as the board turns over.
  useEffect(() => {
    if (isAnswerRevealed && isBoardTurning && !skipEndToastRef.current) {
      showToast(`The word was ${revealedAnswer}`, ANSWER_TOAST_MS);
    }
  }, [isAnswerRevealed, isBoardTurning, revealedAnswer, showToast]);

  const onChar = (value: string) => {
    if (isGameOver) {
      return;
    }
    notePlayerAction();
    setCurrentGuess((guess) =>
      guess.length < MAX_WORD_LENGTH ? `${guess}${value}` : guess,
    );
  };

  const onDelete = () => {
    if (isGameOver) {
      return;
    }
    notePlayerAction();
    setCurrentGuess((guess) => guess.slice(0, -1));
  };

  const onEnter = () => {
    if (isGameOver) {
      return;
    }
    notePlayerAction();

    if (currentGuess.includes(PLACEHOLDER)) {
      return showToast(`Replace every ${PLACEHOLDER} first`, ERROR_TOAST_MS);
    }

    if (currentGuess.length < MIN_WORD_LENGTH) {
      return showToast("Not enough letters", ERROR_TOAST_MS);
    }

    if (!isWordInWordList(currentGuess)) {
      return showToast("Word not found", ERROR_TOAST_MS);
    }

    const guess = currentGuess;
    setCurrentGuess("");
    setGuesses((prev) => [...prev, guess]);
    if (guesses.length === 0) {
      trackEvent("game_start", { length: solution.length, level });
    }

    if (guess === solution) {
      trackGameEnd("won", guesses.length + 1);
      setIsGameWon(true);
    } else if (guesses.length + 1 >= maxGuesses) {
      trackGameEnd("lost", guesses.length + 1);
      // Out of guesses: the board turns over with the answer toast.
      setRevealedAnswer(solution);
      setIsAnswerRevealed(true);
    } else if (
      settings.revealLength &&
      guess.length === solution.length &&
      !guesses.some((g) => g.length === solution.length)
    ) {
      // Announce the first guess of the right length once its row is shown.
      window.clearTimeout(lengthToastTimerRef.current);
      lengthToastTimerRef.current = window.setTimeout(
        () =>
          showToast(
            `Right length! The word has ${solution.length} letters`,
            LENGTH_TOAST_MS,
          ),
        prefersReducedMotion() ? 0 : getGuessRevealMs(),
      );
    }
  };

  const onMark = (letter: string, position: number) => {
    if (isGameOver || forcedAbsent.has(letter)) {
      return;
    }
    notePlayerAction();
    setMarksHistory((h) =>
      recordMarks(h, cycleMark(h.present, letter, position)),
    );
  };

  const onHint = () => {
    if (isGameOver) {
      return;
    }
    if (guesses.length === 0) {
      return showToast("Make a guess first", ERROR_TOAST_MS);
    }
    notePlayerAction();
    const hint = findHint(guesses, solution, getSolutions(level));
    if (hint) {
      setCurrentGuess(hint);
    }
  };

  const onClearMarks = () => {
    if (isGameOver) {
      return;
    }
    notePlayerAction();
    // Clearing nothing adds no undo step.
    setMarksHistory((h) =>
      Object.keys(h.present).length === 0 ? h : recordMarks(h, {}),
    );
  };

  // Marks are fixed once the game is over, undo included.
  const onUndoMarks = () => {
    if (isGameOver) {
      return;
    }
    notePlayerAction();
    setMarksHistory(undoMarks);
  };

  const onRedoMarks = () => {
    if (isGameOver) {
      return;
    }
    notePlayerAction();
    setMarksHistory(redoMarks);
  };

  const onSettingChange = (key: SettingKey, value: boolean) => {
    if (key === "highContrast") {
      applyHighContrast(value);
    }
    saveSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onNewWord = () => {
    // Abandoning a game that has guesses counts as a skip; an untouched board
    // was never started.
    if (!isGameOver && guesses.length > 0) {
      trackGameEnd("skipped", guesses.length);
    }
    const nextSolution = getRandomWord(solution, level);
    gameTimerRef.current = startTimer(Date.now());
    saveActiveMs(nextSolution, 0);
    skipEndToastRef.current = false;
    hideToast();
    window.clearTimeout(shareTimerRef.current);
    window.clearTimeout(lengthToastTimerRef.current);
    setShareLabel("Share");
    setSolution(nextSolution);
    setDay(null);
    setGuesses([]);
    setMarksHistory(startHistory({}));
    setCurrentGuess("");
    setIsGameWon(false);
    setIsAnswerRevealed(false);
  };

  // Each level keeps its own game: switching resumes that level's game as a
  // reload would, or starts its daily word.
  const onLevelChange = (next: Level) => {
    if (next === level) {
      return;
    }
    saveLevel(next);
    const game = loadRestorableGame(next);
    const nextDay = game ? game.day : getDayIndex();
    const nextSolution = game?.solution ?? getWordOfDay(next, nextDay ?? 0);
    const isOver = Boolean(game && (game.isGameWon || game.isAnswerRevealed));
    gameTimerRef.current = startTimer(
      Date.now(),
      game && !isOver ? loadActiveMs(nextSolution) : 0,
    );
    skipEndToastRef.current = isOver;
    hideToast();
    window.clearTimeout(shareTimerRef.current);
    window.clearTimeout(lengthToastTimerRef.current);
    setShareLabel("Share");
    setLevel(next);
    setSolution(nextSolution);
    setDay(nextDay);
    setGuesses(game?.guesses ?? []);
    // Restored rows show their scores at once, without the reveal.
    setRevealedCount(game?.guesses.length ?? 0);
    setMarksHistory(startHistory(game?.marks ?? {}));
    setCurrentGuess("");
    setIsGameWon(game?.isGameWon ?? false);
    setIsAnswerRevealed(game?.isAnswerRevealed ?? false);
    setRevealedAnswer(game?.isAnswerRevealed ? nextSolution : "");
    setBoardPhase(isOver ? "revealed" : "marks");
  };

  const onToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  const onShare = async () => {
    trackEvent("share", { won: isGameWon, length: solution.length, level });
    const text = getShareText(
      day,
      level,
      guesses,
      solution,
      settings.highContrast,
      getSiteUrl(),
    );
    let label = "Copied!";
    try {
      await copyText(text);
    } catch (err) {
      console.error("Could not copy share text", err);
      label = "Copy failed";
    }
    setShareLabel(label);
    window.clearTimeout(shareTimerRef.current);
    shareTimerRef.current = window.setTimeout(
      () => setShareLabel("Share"),
      SHARE_LABEL_MS,
    );
  };

  return (
    <div className="app-height flex flex-col pt-1.5 pb-2 sm:pt-3 sm:pb-4 max-w-7xl mx-auto sm:px-6 lg:px-8">
      <Alert message={toast.message} isOpen={toast.isOpen} />
      <div className="flex shrink-0 w-[calc(100%-8px)] sm:w-[calc(100%-20px)] max-w-[500px] mx-auto items-center gap-1.5 h-[50px] sm:h-14 mb-3 px-2 sm:px-2.5 bg-ui-surface border-[0.5px] border-ui-border rounded-card">
        <Logo />
        <button
          type="button"
          className={HEADER_BUTTON_CLASSES}
          onClick={onNewWord}
        >
          New word
        </button>
        {import.meta.env.DEV && (
          <button
            type="button"
            className={HEADER_BUTTON_CLASSES}
            onClick={() => setIsSolutionShown((shown) => !shown)}
            aria-pressed={isSolutionShown}
          >
            {isSolutionShown ? "Hide" : "Reveal"}
          </button>
        )}
        <button
          type="button"
          className={HEADER_ICON_CLASSES}
          aria-label="How to play"
          onClick={() => setIsInfoModalOpen(true)}
        >
          <QuestionMarkCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          type="button"
          className={HEADER_ICON_CLASSES}
          aria-label="Settings"
          onClick={() => setIsSettingsModalOpen(true)}
        >
          <CogIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>
      <p className="text-center text-sm text-ui-muted">
        Total letters used: <span className="font-bold">{lettersUsed}</span>
      </p>
      <Grid
        guesses={guesses}
        currentGuess={currentGuess}
        solution={solution}
        maxGuesses={maxGuesses}
        boardReveal={boardPhase === "marks" ? undefined : boardPhase}
        isGameOver={isGameOver}
        highlightLength={settings.revealLength}
        hint={import.meta.env.DEV && isSolutionShown ? solution : undefined}
        knownLength={knownLength}
        marks={shownMarks}
        lockedLetters={forcedAbsent}
        onMark={onMark}
      />
      {/* Always rendered so the board and keyboard do not jump when it appears. */}
      <button
        type="button"
        className={`${isEndAnimationDone ? "" : "invisible "}shrink-0 mx-auto ${PRIMARY_BUTTON_CLASSES}`}
        onClick={onShare}
        disabled={!isEndAnimationDone}
      >
        {shareLabel}
      </button>
      {/* mt-auto pins the keyboard toward the bottom; pt-10 keeps a gap when the page is short. */}
      <div className="mt-auto pt-4 sm:pt-10">
        <Keyboard
          onChar={onChar}
          onDelete={onDelete}
          onEnter={onEnter}
          onHint={onHint}
          onClearMarks={onClearMarks}
          onUndo={onUndoMarks}
          onRedo={onRedoMarks}
          canUndo={!isGameOver && canUndo(marksHistory)}
          canRedo={!isGameOver && canRedo(marksHistory)}
          marks={shownMarks}
          usedLetters={usedLetters}
          excludedLetters={getExcludedLetters(level)}
          isPhysicalKeyboardIgnored={settings.onscreenKeyboardOnly}
          isInputDisabled={isInfoModalOpen || isSettingsModalOpen}
        />
      </div>
      <InfoModal
        isOpen={isInfoModalOpen}
        handleClose={() => setIsInfoModalOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        handleClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSettingChange={onSettingChange}
        level={level}
        onLevelChange={onLevelChange}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </div>
  );
}

type LoadState = "loading" | "ready" | "error";

// Fetches the word lists, then starts the game.
function App() {
  const [loadState, setLoadState] = useState<LoadState>(() =>
    areWordsLoaded() ? "ready" : "loading",
  );

  const load = useCallback(() => {
    setLoadState("loading");
    loadWords().then(
      () => setLoadState("ready"),
      (err) => {
        console.error("Could not load the word lists", err);
        setLoadState("error");
      },
    );
  }, []);

  useEffect(() => {
    if (!areWordsLoaded()) {
      load();
    }
  }, [load]);

  if (loadState === "ready") {
    return <Game />;
  }
  return (
    <div className="app-height flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div>
        <Logo />
      </div>
      {loadState === "loading" ? (
        <p className="text-sm text-ui-muted">Loading words…</p>
      ) : (
        <>
          <p role="alert" className="text-sm font-bold">
            Could not load the word list. Check your connection and try again.
          </p>
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASSES}
            onClick={load}
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}

export default App;
