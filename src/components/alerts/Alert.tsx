import { Fragment } from "react";
import { Transition } from "@headlessui/react";

type Props = {
  isOpen: boolean;
  message: string;
};

// Wordle-style toast: a compact, bold, high-contrast pill over the top of the
// board, sized to its text.
export const Alert = ({ isOpen, message }: Props) => {
  return (
    <>
      {/* Always mounted, so screen readers announce text added to it; a live
          region that mounts together with its text is often missed. */}
      <div role="status" aria-live="polite" className="sr-only">
        {isOpen ? message : ""}
      </div>
      <Transition
        show={isOpen}
        as={Fragment}
        enter="ease-out duration-300 transition"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition ease-in duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          aria-hidden="true"
          className="fixed z-20 top-20 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded bg-black text-white dark:bg-white dark:text-black text-sm font-bold whitespace-nowrap pointer-events-none"
        >
          {message}
        </div>
      </Transition>
    </>
  );
};
