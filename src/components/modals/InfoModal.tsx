import { Fragment, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Cell } from "../grid/Cell";
import {
  MAX_WORD_LENGTH,
  MIN_GUESSES,
  MIN_WORD_LENGTH,
} from "../../constants/settings";
import { getMark, Marks } from "../../lib/marks";
import { getScore } from "../../lib/score";
import { ScoreBoxes } from "../grid/ScoreBoxes";
import { getSolutionLengthRange } from "../../lib/words";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
};

type ExampleProps = {
  guess: string;
  solution: string;
  marks?: Marks;
  children: ReactNode;
};

const Example = ({ guess, solution, marks = {}, children }: ExampleProps) => (
  <div>
    <div className="flex justify-center mb-1">
      <ScoreBoxes
        size="sm"
        isSticky={false}
        score={getScore(guess, solution)}
      />
      {guess.split("").map((letter, i) => (
        <Cell
          key={i}
          size="sm"
          value={letter}
          status={getMark(marks, letter, i)}
        />
      ))}
    </div>
    <p>{children}</p>
  </div>
);

export const InfoModal = ({ isOpen, handleClose }: Props) => {
  const { shortest, longest } = getSolutionLengthRange();
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-10 inset-0 overflow-y-auto"
        onClose={handleClose}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/55 backdrop-blur-[5px] transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-ui-surface border-[0.5px] border-ui-border rounded-card px-4 pt-5 pb-4 text-left overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)] transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
              <div>
                <div>
                  <Dialog.Title
                    as="h3"
                    className="text-center text-lg leading-6 font-bold text-ui-text"
                  >
                    How To Play
                  </Dialog.Title>
                  <div className="mt-2 space-y-3 text-sm font-normal text-ui-text">
                    <p>
                      Guess the hidden word. It has between {shortest} and{" "}
                      {longest} letters; guesses can have {MIN_WORD_LENGTH} to{" "}
                      {MAX_WORD_LENGTH}.
                    </p>
                    <p>
                      You get twice as many tries as the word has letters, minus
                      two, but at least {MIN_GUESSES}.
                    </p>
                    <p>
                      Each guess gets three numbers, shown before it: letters in
                      the right spot (green), letters in the word but in another
                      spot (yellow), and letters not in the word (red). They
                      never say which letters they are.
                    </p>

                    <h4 className="pt-1 font-bold text-ui-text">Examples</h4>

                    <Example guess="WEARY" solution="TIGER">
                      With the word <strong>TIGER</strong>: no letter is in the
                      right spot, two (<strong>E</strong> and <strong>R</strong>
                      ) are elsewhere, three are not in the word.
                    </Example>

                    <Example guess="CAT" solution="CATALOG">
                      All letters in place, but not a win: the word could be{" "}
                      <strong>CATALOG</strong>. Spots count from the left, so
                      try a longer guess to find out how it continues.
                    </Example>

                    <Example
                      guess="TRAIN"
                      solution="TIGER"
                      marks={{
                        T: "present",
                        T0: "correct",
                        R: "present",
                        A: "absent",
                      }}
                    >
                      Tap a letter on the board to note what you have worked
                      out: it cycles through red, yellow, green and back to
                      blank. Red, yellow and blank apply to the letter
                      everywhere on the board and keyboard; green only to that
                      spot. <strong>Clear</strong> removes every mark.
                    </Example>

                    <p>
                      <strong>Space</strong> (or <strong>-</strong>) types a
                      blank to fill in later. <strong>Hint</strong> types a word
                      that fits every score so far.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
