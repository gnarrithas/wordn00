// A 2×2 square, read left to right and top to bottom: a white W, then the
// three hint colours. One black line outlines the square and divides its
// tiles. The title follows it.
const TILES = [
  { letter: "W", classes: "bg-white text-black border-r-2 border-b-2" },
  {
    letter: "N",
    classes:
      "bg-wordle-correct dark:bg-wordle-night-correct text-white border-b-2",
  },
  {
    letter: "0",
    classes:
      "bg-wordle-present dark:bg-wordle-night-present text-white border-r-2",
  },
  {
    letter: "0",
    classes: "bg-wordle-absent dark:bg-wordle-night-absent text-white",
  },
];

export const Logo = () => (
  <h1 className="flex grow min-w-0 items-center gap-2" aria-label="Wordn00">
    <div
      aria-hidden="true"
      className="grid grid-cols-2 shrink-0 border-2 border-black dark:border-white"
    >
      {TILES.map(({ letter, classes }, i) => (
        <div
          key={i}
          className={`w-5 h-5 text-xs sm:w-6 sm:h-6 sm:text-sm flex items-center justify-center font-bold border-black dark:border-white ${classes}`}
        >
          {letter}
        </div>
      ))}
    </div>
    <span
      aria-hidden="true"
      className="text-lg sm:text-2xl font-bold tracking-wider truncate"
    >
      WORDN00
    </span>
  </h1>
);
