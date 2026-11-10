#!/usr/bin/env python3
"""Drop plurals and -ly/-ness forms from the solution list.

A word is dropped when it is an inflected or derived form of another
solution: "coffins" (coffin), "quickly" (quick), "kindness" (kind). The base
must itself be a solution, so words used only in the plural ("physics",
"scissors") stay. KEEP lists words the suffix rules would wrongly treat as
derived ("apply", "belly", "business").

Dropped words stay valid guesses: guesses.txt already holds every solution.
"""

import argparse
import logging
import sys
from pathlib import Path

log = logging.getLogger("prune_solutions")

# Words that look derived but are words in their own right.
KEEP = frozenset(
    """
    ally apply assembly belly bubbly bully burly business comply cuddly curly
    dally dolly early elderly family filly grizzly harness holly homely imply
    multiply news odds orderly prickly rally reply sully supply tally
    wilderness witness wobbly
    """.split()
)

MIN_STEM = 3


def plural_bases(word):
    """Singular forms a plural could come from."""
    if not word.endswith("s") or word.endswith(("ss", "us", "is")):
        return []
    bases = [word[:-1]]
    if word.endswith("es"):
        bases.append(word[:-2])
    if word.endswith("ies"):
        bases.append(word[:-3] + "y")
    if word.endswith("ves"):
        bases += [word[:-3] + "f", word[:-3] + "fe"]
    return bases


def ly_bases(word):
    """Adjectives an -ly adverb could come from."""
    if not word.endswith("ly"):
        return []
    bases = [word[:-2]]  # quickly, solely
    if word.endswith("ily"):
        bases.append(word[:-3] + "y")  # happily
    if word.endswith("ally"):
        bases.append(word[:-4])  # basically
    if word.endswith(("bly", "ply", "tly", "dly", "gly")):
        bases.append(word[:-1] + "e")  # probably, simply, gently, idly, singly
    return bases


def ness_bases(word):
    """Adjectives a -ness noun could come from."""
    if not word.endswith("ness"):
        return []
    bases = [word[:-4]]  # kindness
    if word.endswith("iness"):
        bases.append(word[:-5] + "y")  # happiness
    return bases


def derived_from(word, solutions):
    """The solution `word` derives from, or None."""
    if word in KEEP:
        return None
    for rule in (plural_bases, ly_bases, ness_bases):
        for base in rule(word):
            if len(base) >= MIN_STEM and base != word and base in solutions:
                return base
    return None


def prune(words):
    """(kept words in input order, {dropped word: base})."""
    solutions = set(words)
    kept, dropped = [], {}
    for word in words:
        base = derived_from(word, solutions)
        if base is None:
            kept.append(word)
        else:
            dropped[word] = base
    return kept, dropped


def parse_args(argv):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("path", type=Path, help="solution list, rewritten in place")
    parser.add_argument(
        "--dry-run", action="store_true", help="only report what would be dropped"
    )
    return parser.parse_args(argv)


def main(argv=None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    args = parse_args(argv)
    try:
        lines = args.path.read_text(encoding="utf-8").splitlines()
    except OSError as err:
        log.error("cannot read %s: %s", args.path, err)
        return 1
    words = [line.strip().lower() for line in lines if line.strip()]
    if not words:
        log.error("%s has no words", args.path)
        return 1
    kept, dropped = prune(words)
    log.info("dropping %d of %d words", len(dropped), len(words))
    if args.dry_run:
        for word, base in dropped.items():
            print(f"{word}\t{base}")
        return 0
    try:
        args.path.write_text("\n".join(kept) + "\n", encoding="utf-8")
    except OSError as err:
        log.error("cannot write %s: %s", args.path, err)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
