/* content/content.js — listener, injection point. */
(function () {
  "use strict";
  const C = window.DGAI_CONSTANTS || {};
  const MSG = (C.MSG || {});

  function send(type, payload) {
    try { browser.runtime.sendMessage({ type: type, runId: null, payload: payload }); } catch (e) {}
  }

  // announce ready
  setTimeout(function () { send(MSG.CONTENT_READY || "content_ready", { url: location.href, title: document.title }); }, 0);

  browser.runtime.onMessage.addListener(function (msg, sender) {
    if (!msg || !msg.type) return;
    const type = msg.type;
    if (type === (MSG.SNAPSHOT_REQUEST || "snapshot_request")) {
      const kind = (msg.payload && msg.payload.kind) || "full";
      const snap = window.DGAI_SNAPSHOT.build(kind);
      return Promise.resolve({ type: MSG.SNAPSHOT_RESULT || "snapshot_result", runId: msg.runId, payload: snap });
    }
    if (type === (MSG.EXECUTE_ACTION || "execute_action")) {
      const p = msg.payload || {};
      const res = window.DGAI_ACTIONS.execute(p.tool, p.args || {});
      return Promise.resolve({ type: MSG.ACTION_RESULT || "action_result", runId: msg.runId, payload: res });
    }
    if (type === (MSG.PING || "ping")) {
      return Promise.resolve({ ok: true });
    }
    return undefined;
  });
})();