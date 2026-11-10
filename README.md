# Wordn00

A word-guessing game in the style of Wordle, with one twist: the hidden word
can be anywhere from 3 to 18 letters long, and its length is part of the
puzzle.

## How it differs from Wordle

- **Secret length.** Guesses can be 3–20 letters and must be in the word list.
  Each letter is coloured against the same position of the hidden word,
  counting from the left, so an all-green short guess may just be a prefix.
- **More tries for long words.** You get 6 tries, or one more than the word's
  length if that is larger. The board grows a row at a time, so a 7th row
  tells you the word has at least 6 letters.
- **Letters used.** Every guessed letter counts towards a secondary score.
  Fewer tries is good; fewer letters is a bonus.
- **Unlimited play.** The first game each day uses the daily word; **New
  word** starts a random one and **Give up** reveals the answer. Progress is
  kept in the browser across reloads.
- **Spoiler-free sharing.** **Share** copies (or, on mobile, shares) the emoji
  grid with the try count and letters used. The guess limit is left out
  because it would give away the length.

## Development

Requires Node.js 20 or newer.

```sh
npm install     # install dependencies
npm start       # dev server on http://localhost:3000
npm test        # run the tests in watch mode (Vitest)
npm run build   # type-check and build into build/
npm run preview # serve the production build locally
```

The word lists live in `public/words/` (`solutions.txt` and `guesses.txt`, one
lowercase word per line) and are fetched at startup. `filter.py` filters a
source list by word frequency (`wordfreq` package):

```sh
python3 filter.py <input.txt> <output.txt> <min-zipf-frequency>
```

`scripts/prune_solutions.py` then drops plurals and -ly/-ness forms of other
solutions; they stay valid guesses:

```sh
python3 scripts/prune_solutions.py public/words/solutions.txt [--dry-run]
```

## Deployment

`deploy/` contains a Dockerfile that builds the app and serves it with nginx.
See [deploy/README.md](deploy/README.md).

## Credits

Based on an open-source React clone of
[Wordle](https://www.nytimes.com/games/wordle/index.html). Not affiliated with
The New York Times. Licensed under the terms in [LICENSE](LICENSE).
