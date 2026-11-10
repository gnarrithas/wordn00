# Wordn00

A word-guessing game in the style of Word500 (Wordle with counts instead of
coloured tiles), stretched like Wordler: the hidden word can be anywhere from
3 to 18 letters long, and its length is part of the puzzle.

## How it plays

- **Counts, not colours.** Each guess gets three numbers, shown in boxes
  before the word so they line up from row to row: letters in the right spot
  (green), letters in the word but elsewhere (yellow), and letters not in the
  word (red). The boxes fit two digits.
- **Secret length.** Guesses can be 3–20 letters and must be in the word list.
  Spots count from the left of the hidden word, so an all-green short guess
  may just be a prefix.
- **More tries for long words.** You get 2 × (length − 1) tries, but at
  least 8. The board grows a row at a time.
- **Your own notes.** Tap a guessed letter to cycle its mark (red, yellow,
  green, blank); marks colour that letter on the board and keyboard.
- **Hard mode.** Every guess must fit the scores of the guesses before it.
- **Letters used.** Every guessed letter counts towards a secondary score.
- **Unlimited play.** The first game each day uses the daily word; **New
  word** starts a random one. Progress, marks included, is kept in the
  browser across reloads.
- **Spoiler-free sharing.** **Share** copies each guess's three counts with
  the letters used.

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

Derived from Wordler, itself based on an open-source React clone of
[Wordle](https://www.nytimes.com/games/wordle/index.html). Not affiliated with
The New York Times or Word500. Licensed under the terms in [LICENSE](LICENSE).
