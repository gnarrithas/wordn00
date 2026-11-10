import unittest

from prune_solutions import prune


class PruneTest(unittest.TestCase):
    def dropped(self, words):
        return prune(words)[1]

    def test_drops_forms_of_other_solutions(self):
        words = [
            "coffin", "coffins", "box", "boxes", "pony", "ponies", "elf",
            "elves", "quick", "quickly", "happy", "happily", "basic",
            "basically", "simple", "simply", "kind", "kindness", "happiness",
        ]
        self.assertEqual(
            set(self.dropped(words)),
            {"coffins", "boxes", "ponies", "elves", "quickly", "happily",
             "basically", "simply", "kindness", "happiness"},
        )

    def test_keeps_words_whose_base_is_not_a_solution(self):
        self.assertEqual(self.dropped(["physics", "scissors", "gravely"]), {})

    def test_keeps_lookalikes(self):
        words = ["apple", "apply", "bell", "belly", "new", "news", "busy",
                 "business", "glass", "bus", "basis"]
        self.assertEqual(self.dropped(words), {})

    def test_keeps_order(self):
        kept, _ = prune(["zebra", "cat", "cats", "ant"])
        self.assertEqual(kept, ["zebra", "cat", "ant"])


if __name__ == "__main__":
    unittest.main()
