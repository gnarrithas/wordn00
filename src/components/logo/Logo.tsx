// The title as a 2×2 square, read left to right and top to bottom: a white W,
// then the three hint colours, each tile outlined.
const TILES = [
  { letter: "W", classes: "bg-white text-black" },
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

export const Logo = () => (
  <div className="flex grow min-w-0">
    <h1 className="grid grid-cols-2 gap-px" aria-label="Wordn00">
      {TILES.map(({ letter, classes }, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={`w-5 h-5 text-xs sm:w-6 sm:h-6 sm:text-sm flex items-center justify-center rounded font-bold border-2 border-black dark:border-white ${classes}`}
        >
          {letter}
        </div>
      ))}
    </h1>
  </div>
);
