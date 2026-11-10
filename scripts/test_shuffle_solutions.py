#!/usr/bin/env python3
"""Pins the shuffle: a change here would reorder every deployed daily word."""

import datetime as dt
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import shuffle_solutions as s

WORDS = ["delta", "alpha", "Charlie", "bravo", "echo", "foxtrot", "golf", "hotel"]


class ShuffleTest(unittest.TestCase):
    def test_stream_is_hmac_sha256_counter_mode(self):
        # First value cross-checked with: openssl dgst -sha256 -mac HMAC.
        stream = s.ByteStream(b"test-seed")
        self.assertEqual(
            [stream.next_u64() for _ in range(3)],
            [11957243613851627194, 3755087740879313799, 18115887728204555026],
        )

    def test_golden_order(self):
        self.assertEqual(
            s.shuffle(WORDS, "test-seed"),
            ["alpha", "foxtrot", "delta", "bravo", "golf", "echo", "hotel", "charlie"],
        )

    def test_input_order_case_and_duplicates_do_not_matter(self):
        messy = list(reversed(WORDS)) + ["  ALPHA ", "", "echo"]
        self.assertEqual(s.shuffle(messy, "test-seed"), s.shuffle(WORDS, "test-seed"))

    def test_seed_changes_the_order(self):
        self.assertNotEqual(s.shuffle(WORDS, "test-seed"), s.shuffle(WORDS, "other"))

    def test_below_rejects_non_positive_and_stays_in_range(self):
        stream = s.ByteStream(b"x")
        with self.assertRaises(ValueError):
            stream.below(0)
        self.assertTrue(all(0 <= stream.below(7) < 7 for _ in range(1000)))

    def test_empty_seed_is_refused(self):
        with self.assertRaises(ValueError):
            s.shuffle(WORDS, "")

    def test_daily_words_stop_at_today(self):
        order = s.shuffle(WORDS, "test-seed")
        first = s.FIRST_DAY
        self.assertEqual(s.daily_words(WORDS, "test-seed", first), order[:1])
        later = first + dt.timedelta(days=3)
        self.assertEqual(s.daily_words(WORDS, "test-seed", later), order[:4])
        # Before the first day, still day 0.
        early = first - dt.timedelta(days=30)
        self.assertEqual(s.daily_words(WORDS, "test-seed", early), order[:1])

    def test_daily_words_wrap_past_the_end(self):
        order = s.shuffle(WORDS, "test-seed")
        day_9 = s.FIRST_DAY + dt.timedelta(days=9)
        self.assertEqual(
            s.daily_words(WORDS, "test-seed", day_9), order + order[:2]
        )

    def test_main_writes_the_daily_list_and_requires_the_seed(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "solutions.txt"
            output = Path(tmp) / "out" / "daily.txt"
            source.write_text("\n".join(WORDS))
            args = [str(source), str(output), "--today", "2026-11-10"]
            with mock.patch.dict(os.environ, {s.SEED_ENV: ""}):
                self.assertEqual(s.main(args), 1)
            self.assertFalse(output.exists())
            with mock.patch.dict(os.environ, {s.SEED_ENV: "test-seed"}):
                self.assertEqual(s.main(args), 0)
            expected = s.shuffle(WORDS, "test-seed")[:2]
            self.assertEqual(output.read_text(), "\n".join(expected) + "\n")
            # The source list is left alone.
            self.assertEqual(source.read_text(), "\n".join(WORDS))


if __name__ == "__main__":
    unittest.main()
