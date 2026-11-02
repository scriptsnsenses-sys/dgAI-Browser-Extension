/* shared/schema.js — page snapshot and action schemas (documentation + validators). */
(function (root) {
  "use strict";
  function validateSnapshot(s) {
    return s && typeof s.url === "string" && typeof s.host === "string" && Array.isArray(s.elements);
  }
  function validateAction(a) {
    return a && typeof a.ref === "string" && typeof a.op === "string";
  }
  root.DGAI_SCHEMA = { validateSnapshot, validateAction };
  if (typeof module !== "undefined") module.exports = root.DGAI_SCHEMA;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));