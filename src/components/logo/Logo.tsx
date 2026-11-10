import {
  BOUNCE_MS,
  FLIP_MS,
  getBounceStaggerMs,
  getRevealStaggerMs,
  getRowRevealMs,
} from "../../lib/reveal";

// A 2×2 square, read left to right and top to bottom: a white W, then the
// three hint colours.
const TILES = [
  {
    letter: "W",
    classes:
      "bg-white text-black border-2 border-wordle-filled dark:border-wordle-night-filled",
  },
  {
    letter: "N",
    classes: "bg-wordle-correct dark:bg-wordle-night-correct text-white",
  },
  {
    letter: "0",
    classes: "bg-wordle-present dark:bg-wordle-night-present text-white",
  },
  {
    letter: "0",
    classes: "bg-wordle-absent dark:bg-wordle-night-absent text-white",
  },
];
// Give the page a moment to paint before the tiles start flipping.
const START_MS = 300;

// The title as tiles that flip from grey to their colours, then bounce,
// replaying the game's win animation on every page load.
export const Logo = () => {
  const revealStaggerMs = getRevealStaggerMs(TILES.length);
  const bounceStartMs = START_MS + getRowRevealMs(TILES.length);
  const bounceStaggerMs = getBounceStaggerMs(TILES.length);

  return (
    <div className="flex grow min-w-0">
      <h1 className="grid grid-cols-2 gap-px" aria-label="Wordn00">
        {TILES.map(({ letter, classes }, i) => {
          const revealDelayMs = START_MS + i * revealStaggerMs;
          return (
            <div
              key={i}
              aria-hidden="true"
              className="cell-bounce"
              style={{
                animationDuration: `${BOUNCE_MS}ms`,
                animationDelay: `${bounceStartMs + i * bounceStaggerMs}ms`,
              }}
            >
              <div
                className={`logo-reveal w-5 h-5 text-xs sm:w-6 sm:h-6 sm:text-sm flex items-center justify-center rounded font-bold ${classes}`}
                style={{
                  animationDuration: `${FLIP_MS}ms, ${FLIP_MS / 2}ms`,
                  animationDelay: `${revealDelayMs}ms, ${revealDelayMs}ms`,
                }}
              >
                {letter}
              </div>
            </div>
          );
        })}
      </h1>
    </div>
  );
};
