// jest-dom adds custom matchers for asserting on DOM nodes, such as
// expect(element).toBeInTheDocument().
import "@testing-library/jest-dom/vitest";

// headlessui's Dialog observes its panel; jsdom has no IntersectionObserver.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: IntersectionObserverStub,
});

// The daily word follows both local and UTC dates (getDayIndex), so tests run
// in UTC whatever the machine's zone; tests that need another zone set TZ.
process.env.TZ = "UTC";
