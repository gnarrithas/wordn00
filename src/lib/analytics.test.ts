import { initAnalytics, resetAnalyticsForTests, trackEvent } from "./analytics";

const WEBSITE_ID = "0b6c2e0e-3f7e-4c3a-9a51-2f4e8f1d7c11";

const respondWith = (body: unknown, ok = true) => {
  window.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      json: () =>
        typeof body === "string"
          ? Promise.reject(new SyntaxError("not JSON"))
          : Promise.resolve(body),
    } as Response),
  );
};

const trackerScript = () =>
  document.head.querySelector<HTMLScriptElement>(
    'script[src="/stats/script.js"]',
  );

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  resetAnalyticsForTests();
  document.head.innerHTML = "";
  delete window.umami;
  vi.stubEnv("PROD", true);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

test("queued events are sent once the tracker loads", async () => {
  respondWith({ websiteId: WEBSITE_ID });
  initAnalytics();
  trackEvent("game_start", { length: 3 });
  await flush();

  const script = trackerScript();
  expect(script?.dataset.websiteId).toBe(WEBSITE_ID);
  const track = vi.fn();
  window.umami = { track };
  script?.onload?.(new Event("load"));
  expect(track).toHaveBeenCalledWith("game_start", { length: 3 });

  trackEvent("share", { won: true });
  expect(track).toHaveBeenLastCalledWith("share", { won: true });
});

test.each([
  ["the app shell instead of JSON", "<!doctype html>", true],
  ["a 404", {}, false],
  ["no website id", { websiteId: "" }, true],
  ["a malformed website id", { websiteId: "x" }, true],
])("no tracker loads for %s", async (_name, body, ok) => {
  respondWith(body, ok);
  initAnalytics();
  trackEvent("game_start", { length: 3 });
  await flush();
  expect(trackerScript()).toBeNull();
});

test("a blocked tracker drops queued and later events", async () => {
  respondWith({ websiteId: WEBSITE_ID });
  initAnalytics();
  trackEvent("game_start", { length: 3 });
  await flush();
  trackerScript()?.onerror?.(new Event("error"));
  const track = vi.fn();
  window.umami = { track };
  trackEvent("share", { won: true });
  expect(track).not.toHaveBeenCalled();
});

test("development builds never fetch the config", () => {
  vi.stubEnv("PROD", false);
  window.fetch = vi.fn();
  initAnalytics();
  expect(window.fetch).not.toHaveBeenCalled();
});
