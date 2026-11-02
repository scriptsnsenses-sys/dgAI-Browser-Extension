/* shared/messages.js — message envelope helpers. */
(function (root) {
  "use strict";
  const C = root.DGAI_CONSTANTS;
  function envelope(type, runId, payload) {
    return { type: type, runId: runId || null, payload: payload || null, ts: Date.now() };
  }
  function isMessage(m) {
    return !!m && typeof m.type === "string";
  }
  root.DGAI_MESSAGES = { envelope, isMessage, MSG: C.MSG };
  if (typeof module !== "undefined") module.exports = root.DGAI_MESSAGES;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));