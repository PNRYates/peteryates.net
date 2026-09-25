/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Umami tracker, loaded from analytics.peteryates.net in production only.
// Call as `window.umami?.track(...)` so it no-ops in dev or behind ad blockers.
interface Window {
  umami?: { track: (event: string, data?: Record<string, string | number | boolean>) => void };
}
