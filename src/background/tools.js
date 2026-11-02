/* background/tools.js — tool registry + JSON schemas + handlers. */
(function (root) {
  "use strict";
  const C = root.DGAI_CONSTANTS;
  const T = C.TOOL;
  const TIER = C.TIER;

  function sendToTab(tabId, msg) {
    return browser.tabs.sendMessage(tabId, msg);
  }

  function humanSummary(name, args) {
    args = args || {};
    switch (name) {
      case T.READ_PAGE: return "Read the current page";
      case T.GET_READABLE_TEXT: return "Extract readable text";
      case T.SNAPSHOT_FORM: return "Inspect form fields";
      case T.FIND_ELEMENTS: return "Find elements: " + (args.query || "");
      case T.GET_ELEMENT_DETAILS: return "Get details for " + (args.ref || "");
      case T.EXTRACT_TABLE: return "Extract table" + (args.index != null ? " #" + args.index : "");
      case T.GET_LINKS: return "Collect page links";
      case T.GET_PAGE_METADATA: return "Read page metadata";
      case T.GET_SELECTION: return "Read selected text";
      case T.SCROLL_TO: return "Scroll to " + (args.ref || args.target || "");
      case T.CLICK: return "Click " + (args.ref || "");
      case T.TYPE_TEXT: return "Type '" + String(args.value || "").slice(0, 40) + "' into " + (args.ref || "");
      case T.SELECT_OPTION: return "Select '" + (args.value || "") + "' in " + (args.ref || "");
      case T.SET_CHECKBOX: return (args.checked ? "Check" : "Uncheck") + " " + (args.ref || "");
      case T.PRESS_KEY: return "Press " + (args.key || "");
      case T.HOVER: return "Hover " + (args.ref || "");
      case T.NAVIGATE: return "Navigate to " + (args.url || "");
      case T.SUBMIT_FORM: return "Submit form " + (args.ref || "");
      case T.OPEN_LINK_IN_NEW_TAB: return "Open link in new tab";
      case T.UPLOAD_FILE: return "Upload file (sensitive)";
      case T.DOWNLOAD_FILE: return "Download file (sensitive)";
      default: return name;
    }
  }

  // risk level for permission card
  function riskFor(name, tier) {
    if (tier === TIER.SENSITIVE) return "High";
    if (name === T.CLICK || name === T.SCROLL_TO || name === T.HOVER) return "Low";
    return "Medium";
  }

  const defs = [];
  function def(name, tier, params, handler) {
    defs.push({ name: name, description: name.replace(/_/g, " "), tier: tier, params: params, handler: handler, humanSummary: function (a) { return humanSummary(name, a); }, risk: function (a) { return riskFor(name, tier); } });
  }

  const obj = (props) => ({ type: "object", properties: props, additionalProperties: false });
  const str = (d) => ({ type: "string", description: d });
  const bool = (d) => ({ type: "boolean", description: d });
  const num = (d) => ({ type: "number", description: d });

  // read tools
  def(T.READ_PAGE, TIER.READ, obj({}), async function (ctx) {
    return sendToTab(ctx.tabId, { type: C.MSG.SNAPSHOT_REQUEST, runId: ctx.runId, payload: { kind: "full" } });
  });
  def(T.GET_READABLE_TEXT, TIER.READ, obj({}), async function (ctx) {
    return sendToTab(ctx.tabId, { type: C.MSG.SNAPSHOT_REQUEST, runId: ctx.runId, payload: { kind: "text" } });
  });
  def(T.SNAPSHOT_FORM, TIER.READ, obj({}), async function (ctx) {
    return sendToTab(ctx.tabId, { type: C.MSG.SNAPSHOT_REQUEST, runId: ctx.runId, payload: { kind: "form" } });
  });
  def(T.FIND_ELEMENTS, TIER.READ, obj({ query: str("text/role query"), role: str("optional role filter") }), async function (ctx, args) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.FIND_ELEMENTS, args: args } });
  });
  def(T.GET_ELEMENT_DETAILS, TIER.READ, obj({ ref: str("element ref") }), async function (ctx, args) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.GET_ELEMENT_DETAILS, args: args } });
  });
  def(T.EXTRACT_TABLE, TIER.READ, obj({ index: num("table index (0-based)") }), async function (ctx, args) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.EXTRACT_TABLE, args: args } });
  });
  def(T.GET_LINKS, TIER.READ, obj({}), async function (ctx) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.GET_LINKS, args: {} } });
  });
  def(T.GET_PAGE_METADATA, TIER.READ, obj({}), async function (ctx) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.GET_PAGE_METADATA, args: {} } });
  });
  def(T.GET_SELECTION, TIER.READ, obj({}), async function (ctx) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.GET_SELECTION, args: {} } });
  });
  def(T.SCROLL_TO, TIER.READ, obj({ ref: str("element ref"), target: str("selector/text") }), async function (ctx, args) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.SCROLL_TO, args: args } });
  });

  // interact tools
  def(T.CLICK, TIER.INTERACT, obj({ ref: str("element ref") }), async function (ctx, args) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.CLICK, args: args } });
  });
  def(T.TYPE_TEXT, TIER.INTERACT, obj({ ref: str("element ref"), value: str("text to type") }), async function (ctx, args) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.TYPE_TEXT, args: args } });
  });
  def(T.SELECT_OPTION, TIER.INTERACT, obj({ ref: str("element ref"), value: str("option value/label") }), async function (ctx, args) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.SELECT_OPTION, args: args } });
  });
  def(T.SET_CHECKBOX, TIER.INTERACT, obj({ ref: str("element ref"), checked: bool("checked state") }), async function (ctx, args) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.SET_CHECKBOX, args: args } });
  });
  def(T.PRESS_KEY, TIER.INTERACT, obj({ key: str("key name"), ref: str("optional element ref") }), async function (ctx, args) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.PRESS_KEY, args: args } });
  });
  def(T.HOVER, TIER.INTERACT, obj({ ref: str("element ref") }), async function (ctx, args) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.HOVER, args: args } });
  });
  def(T.NAVIGATE, TIER.INTERACT, obj({ url: str("url to navigate to") }), async function (ctx, args) {
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.NAVIGATE, args: args } });
  });
  def(T.SUBMIT_FORM, TIER.INTERACT, obj({ ref: str("form ref") }), async function (ctx, args) {
    // sensitive if payment-like fields present; content layer decides and throws marker
    return sendToTab(ctx.tabId, { type: C.MSG.EXECUTE_ACTION, runId: ctx.runId, payload: { tool: T.SUBMIT_FORM, args: args } });
  });
  def(T.OPEN_LINK_IN_NEW_TAB, TIER.INTERACT, obj({ url: str("url") }), async function (ctx, args) {
    const tab = await browser.tabs.create({ url: args.url, active: false });
    return { ok: true, tabId: tab.id };
  });

  // sensitive
  def(T.UPLOAD_FILE, TIER.SENSITIVE, obj({ ref: str("input ref"), path: str("file path") }), async function (ctx, args) {
    return { error: "not_supported", message: "File uploads to third parties are out of scope." };
  });
  def(T.DOWNLOAD_FILE, TIER.SENSITIVE, obj({ url: str("url") }), async function (ctx, args) {
    return { ok: false, message: "Download requires confirmation; not implemented in MVP." };
  });

  function get(name) { return defs.find(function (d) { return d.name === name; }); }
  function all() { return defs.slice(); }
  function toolSchemas() {
    return defs.map(function (d) {
      return { name: d.name, description: d.description || d.name, tier: d.tier, params: d.params };
    });
  }

  root.DGAI_TOOLS = { defs, get, all, toolSchemas, humanSummary, riskFor };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));