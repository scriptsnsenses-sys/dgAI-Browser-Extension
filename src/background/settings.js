/* background/settings.js — persisted config (provider, theme, profile, etc). */
(function (root) {
  "use strict";
  const C = root.DGAI_CONSTANTS;
  const KEY = C.STORAGE.SETTINGS;
  const DEFAULTS = {
    provider: "mock",
    apiKey: "",
    baseUrl: "",
    model: "",
    endpointType: "chat_completions",
    customHeaders: "",
    temperature: 0.3,
    theme: "system",
    trustedSites: [],
    alwaysConfirmSensitive: true,
    profile: { name: "", email: "", phone: "", address: "" }
  };

  async function get() {
    const r = await browser.storage.local.get(KEY);
    const s = (r && r[KEY]) || {};
    return Object.assign({}, DEFAULTS, s, { profile: Object.assign({}, DEFAULTS.profile, s.profile || {}) });
  }
  async function set(patch) {
    const cur = await get();
    const next = Object.assign({}, cur, patch);
    if (patch.profile) next.profile = Object.assign({}, cur.profile, patch.profile);
    await browser.storage.local.set({ [KEY]: next });
    return next;
  }
  root.DGAI_SETTINGS = { get, set, DEFAULTS };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));