import { Fragment } from "react";
import { Transition } from "@headlessui/react";

type Props = {
  isOpen: boolean;
  message: string;
};

// A frosted pill over the header, sized to its text.
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
          className="fixed z-20 top-5 left-1/2 transform -translate-x-1/2 max-w-[calc(100vw-16px)] truncate px-7 py-2.5 rounded-full bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border-[0.5px] border-ui-edge text-ui-text text-sm font-semibold shadow-lg pointer-events-none"
        >
          {message}
        </div>
      </Transition>
    </>
  );
};
