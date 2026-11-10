// A 32px 2×2 icon in the old site's style, read left to right and top to
// bottom: a white tile, then bright green, yellow and red ones, with large
// black letters. Thin black lines outline the square and divide its tiles.
// The colours are fixed, like an image, so themes and high contrast mode
// leave them alone. The title follows it.
const TILES = [
  { letter: "W", classes: "bg-white border-r border-b" },
  { letter: "N", classes: "bg-[#27d43c] border-b" },
  { letter: "0", classes: "bg-[#e4e417] border-r" },
  { letter: "0", classes: "bg-[#ff3743]" },
];

export const Logo = () => (
  <h1 className="flex grow min-w-0 items-center gap-2" aria-label="Wordn00">
    <div
      aria-hidden="true"
      className="grid grid-cols-2 shrink-0 w-8 h-8 border border-black"
    >
      {TILES.map(({ letter, classes }, i) => (
        <div
          key={i}
          className={`flex items-center justify-center text-[13px] leading-none font-normal text-black border-black ${classes}`}
        >
          {letter}
        </div>
      ))}
    </div>
    <span aria-hidden="true" className="font-display text-[1.1rem] truncate">
      Wordn00
    </span>
  </h1>
);
