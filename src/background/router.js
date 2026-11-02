/* background/router.js — single message bus. */
(function (root) {
  "use strict";
  const C = root.DGAI_CONSTANTS;
  const MSG = C.MSG;

  function handle(msg, sender) {
    if (!msg || !msg.type) return;
    const runId = msg.runId;
    switch (msg.type) {
      case MSG.USER_PROMPT:
        root.DGAI_AGENT.run(msg.payload && msg.payload.text, runId || ("run_" + Date.now()));
        return { ok: true };
      case MSG.CANCEL_RUN:
        root.DGAI_AGENT.cancel(runId);
        return { ok: true };
      case MSG.APPROVE_PERMISSION:
        root.DGAI_AGENT.resolvePermission(msg.payload.requestId, { approved: true, scope: msg.payload.scope || C.SCOPE.ONCE, reason: "approved" });
        return { ok: true };
      case MSG.DENY_PERMISSION:
        root.DGAI_AGENT.resolvePermission(msg.payload.requestId, { approved: false, reason: msg.payload.reason || "User denied this action." });
        return { ok: true };
      case MSG.GET_SETTINGS:
        return root.DGAI_SETTINGS.get().then(function (s) { return { type: MSG.SETTINGS_RESULT, runId: runId, payload: s }; });
      case MSG.SET_SETTINGS:
        return root.DGAI_SETTINGS.set(msg.payload || {}).then(function (s) { return { type: MSG.SETTINGS_RESULT, runId: runId, payload: s }; });
      case MSG.GET_GRANTS:
        return root.DGAI_PERMISSIONS.listGrants().then(function (g) {
          return { type: MSG.GRANTS_RESULT, runId: runId, payload: { grants: g, trusted: null } };
        });
      case MSG.REVOKE_GRANT:
        return root.DGAI_PERMISSIONS.revoke(msg.payload.host).then(function () { return { ok: true }; });
      case MSG.REVOKE_ALL_GRANTS:
        return root.DGAI_PERMISSIONS.revokeAll().then(function () { return { ok: true }; });
      case MSG.GET_AUDIT:
        return root.DGAI_AUDIT.list().then(function (a) { return { type: MSG.AUDIT_RESULT, runId: runId, payload: { entries: a } }; });
      case MSG.CLEAR_CONVERSATION:
        root.DGAI_AGENT.conversation.length = 0;
        return { type: MSG.CONVERSATION_CLEARED, runId: runId, payload: {} };
      case MSG.CONTENT_READY:
      case MSG.SNAPSHOT_RESULT:
      case MSG.ACTION_RESULT:
        // content responses are awaited via sendMessage promises; nothing to do
        return { ok: true };
      default:
        return { ok: false, error: "unknown_message" };
    }
  }

  root.DGAI_ROUTER = { handle };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));