/* background/audit.js — append-only action log. */
(function (root) {
  "use strict";
  const C = root.DGAI_CONSTANTS;
  const KEY = C.STORAGE.AUDIT;
  const CAP = C.AUDIT_CAP;

  function redact(v) {
    try {
      const s = JSON.stringify(v);
      return JSON.parse(s.replace(/[A-Za-z0-9+/_-]{40,}\.{0,3}[A-Za-z0-9+/_-]{0,}/g, "[REDACTED]"));
    } catch (e) { return v; }
  }

  async function append(entry) {
    const r = await browser.storage.local.get(KEY);
    const list = (r && r[KEY]) || [];
    list.push(Object.assign({ ts: Date.now() }, entry, { args: redact(entry.args), result: redact(entry.result) }));
    while (list.length > CAP) list.shift();
    await browser.storage.local.set({ [KEY]: list });
  }
  async function list() {
    const r = await browser.storage.local.get(KEY);
    return (r && r[KEY]) || [];
  }
  async function clear() {
    await browser.storage.local.set({ [KEY]: [] });
  }
  root.DGAI_AUDIT = { append, list, clear };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));