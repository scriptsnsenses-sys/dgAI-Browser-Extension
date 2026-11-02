/* background/permissions.js — per-domain grant store + gating. */
(function (root) {
  "use strict";
  const C = root.DGAI_CONSTANTS;
  const STORAGE = C.STORAGE;
  const SCOPE = C.SCOPE;
  const sessionGrants = new Map(); // host -> {tools}

  async function loadGrants() {
    const r = await browser.storage.local.get(STORAGE.GRANTS);
    return (r && r[STORAGE.GRANTS]) || {};
  }
  async function saveGrants(g) {
    await browser.storage.local.set({ [STORAGE.GRANTS]: g });
  }

  async function isGranted(host, toolName, tier) {
    if (tier !== C.TIER.INTERACT && tier !== C.TIER.SENSITIVE) return true;
    if (tier === C.TIER.SENSITIVE) return false; // always per-action
    // trusted sites
    const s = await root.DGAI_SETTINGS.get();
    const trusted = (s.trustedSites || []);
    if (trusted.indexOf(host) !== -1) return true;
    // session
    const sg = sessionGrants.get(host);
    if (sg && (sg.tools.indexOf("*") !== -1 || sg.tools.indexOf(toolName) !== -1)) return true;
    // persisted
    const g = await loadGrants();
    const entry = g[host];
    if (!entry) return false;
    if (entry.scope === SCOPE.SESSION) {
      // session grants should not persist; treat persisted session as expired on reload, but in-memory handles
      return false;
    }
    if (entry.tools && (entry.tools.indexOf("*") !== -1 || entry.tools.indexOf(toolName) !== -1)) return true;
    return false;
  }

  async function grant(host, scope, tools) {
    tools = tools || ["*"];
    if (scope === SCOPE.SESSION) {
      sessionGrants.set(host, { scope, tools, grantedAt: Date.now() });
      return;
    }
    const g = await loadGrants();
    g[host] = { scope, tools, grantedAt: Date.now() };
    await saveGrants(g);
  }
  async function revoke(host) {
    sessionGrants.delete(host);
    const g = await loadGrants();
    delete g[host];
    await saveGrants(g);
  }
  async function revokeAll() {
    sessionGrants.clear();
    await saveGrants({});
  }
  async function listGrants() {
    const g = await loadGrants();
    const out = [];
    for (const host in g) out.push(Object.assign({ host: host, session: false }, g[host]));
    for (const [host, v] of sessionGrants.entries()) out.push(Object.assign({ host: host, session: true }, v));
    return out;
  }

  // trusted sites helpers stored in settings.trustedSites
  async function addTrusted(host) {
    const s = await root.DGAI_SETTINGS.get();
    const list = s.trustedSites || [];
    if (list.indexOf(host) === -1) list.push(host);
    await root.DGAI_SETTINGS.set({ trustedSites: list });
  }
  async function removeTrusted(host) {
    const s = await root.DGAI_SETTINGS.get();
    const list = (s.trustedSites || []).filter(function (h) { return h !== host; });
    await root.DGAI_SETTINGS.set({ trustedSites: list });
  }

  root.DGAI_PERMISSIONS = { isGranted, grant, revoke, revokeAll, listGrants, addTrusted, removeTrusted, sessionGrants };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));