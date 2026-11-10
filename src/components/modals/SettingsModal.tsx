import { Fragment, ReactNode } from "react";
import { Dialog, Switch, Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";
import { SettingKey, Settings } from "../../lib/settings";
import { Theme } from "../../lib/theme";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  settings: Settings;
  onSettingChange: (key: SettingKey, value: boolean) => void;
  theme: Theme;
  onToggleTheme: () => void;
};

type ToggleProps = {
  label: string;
  description?: ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
};

const Toggle = ({ label, description, checked, onChange }: ToggleProps) => (
  <Switch.Group
    as="div"
    className="flex items-center justify-between gap-4 py-3"
  >
    <div>
      <Switch.Label className="text-sm font-semibold text-ui-text">
        {label}
      </Switch.Label>
      {description && (
        <Switch.Description className="text-xs font-normal text-ui-muted">
          {description}
        </Switch.Description>
      )}
    </div>
    <Switch
      checked={checked}
      onChange={onChange}
      className={`${
        checked ? "bg-wordle-correct dark:bg-wordle-night-correct" : "bg-ui-key"
      } relative inline-flex shrink-0 h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent`}
    >
      <span
        aria-hidden="true"
        className={`${
          checked ? "translate-x-6" : "translate-x-1"
        } inline-block h-4 w-4 mt-1 rounded-full bg-white transform transition-transform`}
      />
    </Switch>
  </Switch.Group>
);

export const SettingsModal = ({
  isOpen,
  handleClose,
  settings,
  onSettingChange,
  theme,
  onToggleTheme,
}: Props) => {
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
            <div className="relative inline-block align-bottom w-full bg-ui-surface border-[0.5px] border-ui-border rounded-card px-4 pt-5 pb-4 text-left overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)] transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:p-6">
              <button
                type="button"
                className="absolute top-2.5 right-2.5 flex items-center justify-center w-9 h-9 rounded-tile bg-ui-bg text-ui-text hover:bg-ui-tile focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent"
                aria-label="Close"
                onClick={handleClose}
              >
                <XIcon className="h-5 w-5" />
              </button>
              <Dialog.Title
                as="h3"
                className="text-center text-lg leading-6 font-bold text-ui-text"
              >
                Settings
              </Dialog.Title>

              <div className="mt-4 divide-y divide-ui-border">
                <Toggle
                  label="Hard Mode"
                  description="Every guess must fit the scores of the guesses before it"
                  checked={settings.hardMode}
                  onChange={(v) => onSettingChange("hardMode", v)}
                />
                <Toggle
                  label="Reveal Length"
                  description="Rings guesses that match the hidden word's length, announces the length the first time and then marks it with dotted boxes"
                  checked={settings.revealLength}
                  onChange={(v) => onSettingChange("revealLength", v)}
                />
                <Toggle
                  label="Dark Theme"
                  checked={theme === "dark"}
                  onChange={onToggleTheme}
                />
                <Toggle
                  label="High Contrast Mode"
                  description="Contrast and colorblindness improvements"
                  checked={settings.highContrast}
                  onChange={(v) => onSettingChange("highContrast", v)}
                />
                <Toggle
                  label="Onscreen Keyboard Input Only"
                  description="Ignore key input except from the onscreen keyboard. Most helpful for users using speech recognition or other assistive devices."
                  checked={settings.onscreenKeyboardOnly}
                  onChange={(v) => onSettingChange("onscreenKeyboardOnly", v)}
                />
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
