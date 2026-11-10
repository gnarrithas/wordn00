#!/usr/bin/env python3
import wordfreq
import sys


def main():
    assert len(sys.argv) == 4
    wordlist = sys.argv[1]
    output = sys.argv[2]
    freq_thresh = float(sys.argv[3])

    with open(wordlist, "r") as fin:
        words = [word.strip("\n") for word in fin.readlines()]

    final_list = []
    for word in words:
        freq = wordfreq.zipf_frequency(word, 'en')
        if freq >= freq_thresh:
            final_list.append(word)

    with open(output, "wt") as fout:
        fout.write("\n".join(final_list))


if __name__ == "__main__":
    main()
