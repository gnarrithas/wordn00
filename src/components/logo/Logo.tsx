import {
  BOUNCE_MS,
  FLIP_MS,
  getBounceStaggerMs,
  getRevealStaggerMs,
  getRowRevealMs,
} from "../../lib/reveal";

const LETTERS = "WORDN00".split("");
// Give the page a moment to paint before the tiles start flipping.
const START_MS = 300;

// The title as a row of tiles that flip from grey to green, then bounce,
// replaying the game's win animation on every page load.
export const Logo = () => {
  const revealStaggerMs = getRevealStaggerMs(LETTERS.length);
  const bounceStartMs = START_MS + getRowRevealMs(LETTERS.length);
  const bounceStaggerMs = getBounceStaggerMs(LETTERS.length);

  return (
    <h1 className="flex grow min-w-0" aria-label="Wordn00">
      {LETTERS.map((letter, i) => {
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
              className="logo-reveal w-4 h-4 text-[10px] sm:w-[30px] sm:h-[30px] sm:text-base mr-px flex items-center justify-center rounded bg-wordle-correct dark:bg-wordle-night-correct text-white font-bold"
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
  );
};
