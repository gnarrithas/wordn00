// Optional Umami analytics. In production the app asks the server for
// /stats/config.json; only when that names a website does it load the Umami
// tracker from /stats/script.js (same origin, so the CSP needs no change).
// Everywhere else (development, tests, a plain `docker run` without the
// compose stack, ad blockers) every call here is a silent no-op.

export type EventData = Record<string, string | number | boolean>;

type Umami = { track: (name: string, data?: EventData) => unknown };

declare global {
  interface Window {
    umami?: Umami;
  }
}

// BASE_URL ends in "/", so these stay under the app's base path.
const CONFIG_URL = `${import.meta.env.BASE_URL}stats/config.json`;
const SCRIPT_URL = `${import.meta.env.BASE_URL}stats/script.js`;
// Events fired before the tracker loads wait here; the cap bounds memory if
// it never does.
const MAX_QUEUED = 50;

type State = "idle" | "loading" | "ready" | "disabled";

let state: State = "idle";
let queue: { name: string; data?: EventData }[] = [];

const send = (name: string, data?: EventData) => {
  try {
    window.umami?.track(name, data);
  } catch (err) {
    console.warn("Analytics event failed", err);
  }
};

// Quiet when analytics is simply not set up; warns when setup looks broken.
const disable = (reason: string, warn = false) => {
  state = "disabled";
  queue = [];
  if (warn) {
    console.warn(`Analytics disabled: ${reason}`);
  }
};

const isWebsiteId = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);

const fetchWebsiteId = async (): Promise<string | null> => {
  const response = await fetch(CONFIG_URL, { cache: "no-cache" });
  if (!response.ok) {
    return null;
  }
  const config: unknown = await response.json();
  const websiteId =
    typeof config === "object" && config !== null
      ? (config as Record<string, unknown>).websiteId
      : undefined;
  return isWebsiteId(websiteId) ? websiteId : null;
};

const loadTracker = (websiteId: string) => {
  const script = document.createElement("script");
  script.defer = true;
  script.src = SCRIPT_URL;
  script.dataset.websiteId = websiteId;
  script.onload = () => {
    if (!window.umami) {
      return disable("tracker loaded without window.umami", true);
    }
    state = "ready";
    const pending = queue;
    queue = [];
    pending.forEach(({ name, data }) => send(name, data));
  };
  // Usually an ad blocker; nothing to warn about.
  script.onerror = () => disable("tracker script failed to load");
  document.head.appendChild(script);
};

// Starts loading the tracker once; later calls do nothing.
export const initAnalytics = () => {
  if (state !== "idle") {
    return;
  }
  if (!import.meta.env.PROD) {
    return disable("not a production build");
  }
  state = "loading";
  fetchWebsiteId().then(
    (websiteId) =>
      websiteId ? loadTracker(websiteId) : disable("no website configured"),
    // The config route is missing or returned something else (e.g. the app
    // shell): analytics simply stays off.
    () => disable("no analytics config"),
  );
};

export const trackEvent = (name: string, data?: EventData) => {
  if (state === "ready") {
    send(name, data);
  } else if (state === "loading" && queue.length < MAX_QUEUED) {
    queue.push({ name, data });
  }
};

// Test hook: forget all state, as on a fresh page load.
export const resetAnalyticsForTests = () => {
  state = "idle";
  queue = [];
};
