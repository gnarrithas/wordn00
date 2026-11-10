import { setTheme, watchSystemTheme } from "./theme";

type Listener = (e: MediaQueryListEvent) => void;

const mockSystemTheme = () => {
  const listeners: Listener[] = [];
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: (_: string, l: Listener) => listeners.push(l),
    removeEventListener: vi.fn(),
  });
  return (dark: boolean) =>
    listeners.forEach((l) => l({ matches: dark } as MediaQueryListEvent));
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  document.head.innerHTML = '<meta name="theme-color" content="#ffffff" />';
});

const themeColor = () =>
  document.querySelector('meta[name="theme-color"]')?.getAttribute("content");

test("follows the system theme while no theme is stored", () => {
  const emit = mockSystemTheme();
  const onChange = vi.fn();
  watchSystemTheme(onChange);
  emit(true);
  expect(onChange).toHaveBeenLastCalledWith("dark");
  expect(document.documentElement).toHaveClass("dark");
  expect(themeColor()).toBe("#121213");
});

test("ignores the system theme once the player picks one", () => {
  const emit = mockSystemTheme();
  const onChange = vi.fn();
  watchSystemTheme(onChange);
  setTheme("light");
  emit(true);
  expect(onChange).not.toHaveBeenCalled();
  expect(document.documentElement).not.toHaveClass("dark");
  expect(themeColor()).toBe("#ffffff");
});
