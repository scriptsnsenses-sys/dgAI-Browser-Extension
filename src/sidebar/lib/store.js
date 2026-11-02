/* sidebar/lib/store.js — reactive state. */
(function () {
  "use strict";
  const state = {
    theme: "system",
    settings: null,
    grants: [],
    conversation: [],
    run: { active: false, runId: null, status: "idle" },
    context: { url: "", title: "", host: "" },
    pendingPermission: null,
    usage: { tokens: 0, model: "", latency: 0 }
  };
  const listeners = new Set();
  function get() { return state; }
  function set(patch) {
    Object.assign(state, patch);
    for (const fn of listeners) try { fn(state); } catch (e) {}
  }
  function subscribe(fn) { listeners.add(fn); return function () { listeners.delete(fn); }; }
  window.DGAI_STORE = { get, set, subscribe, state };
})();