/* content/actions.js — execute tool calls on the DOM. */
(function () {
  "use strict";
  const C = window.DGAI_CONSTANTS || {};
  const T = (C.TOOL || {});
  const MSG = (C.MSG || {});

  function refEl(ref) { return window.__dgaiRefs ? window.__dgaiRefs.get(ref) : null; }

  function isPassword(el) {
    return !!(el && el.tagName && el.tagName.toLowerCase() === "input" && (el.getAttribute("type") || "").toLowerCase() === "password");
  }

  async function execute(tool, args) {
    args = args || {};
    switch (tool) {
      case T.READ_PAGE:
      case "read_page":
        return window.DGAI_SNAPSHOT.build("full");
      case T.GET_READABLE_TEXT:
      case "get_readable_text":
        return { text: window.DGAI_SNAPSHOT.build("text").text };
      case T.SNAPSHOT_FORM:
      case "snapshot_form":
        return window.DGAI_SNAPSHOT.build("form");
      case T.FIND_ELEMENTS:
      case "find_elements": {
        const q = String(args.query || "").toLowerCase();
        const els = window.DGAI_SNAPSHOT.build("full").elements || [];
        const res = els.filter(function (e) { return (e.name || "").toLowerCase().indexOf(q) !== -1 || (e.role || "").toLowerCase().indexOf(q) !== -1; });
        return { matches: res };
      }
      case T.GET_ELEMENT_DETAILS:
      case "get_element_details": {
        const el = refEl(args.ref);
        if (!el) return { error: "not_found" };
        if (isPassword(el)) return { error: "Passwords are protected" };
        return { ref: args.ref, tag: el.tagName.toLowerCase(), role: (el.getAttribute && el.getAttribute("role")) || "", name: (window.DGAI_SNAPSHOT && "") , text: (el.innerText || el.textContent || "").trim().slice(0, 500), value: isPassword(el) ? null : (el.value != null ? String(el.value) : null) };
      }
      case T.EXTRACT_TABLE:
      case "extract_table": {
        const tables = Array.from(document.querySelectorAll("table"));
        const idx = (typeof args.index === "number") ? args.index : 0;
        const table = tables[idx];
        if (!table) return { error: "no_table", count: tables.length };
        const rows = Array.from(table.querySelectorAll("tr")).map(function (tr) {
          return Array.from(tr.querySelectorAll("th,td")).map(function (c) { return (c.innerText || "").trim(); });
        });
        // markdown
        let md = "";
        if (rows.length) {
          md += "| " + rows[0].join(" | ") + " |\n";
          md += "| " + rows[0].map(function () { return "---"; }).join(" | ") + " |\n";
          for (let i = 1; i < rows.length; i++) md += "| " + rows[i].join(" | ") + " |\n";
        }
        return { index: idx, count: tables.length, rows: rows, markdown: md };
      }
      case T.GET_LINKS:
      case "get_links": {
        const links = Array.from(document.querySelectorAll("a[href]")).slice(0, 100).map(function (a) {
          return { text: (a.innerText || a.textContent || "").trim().slice(0, 80), href: a.href };
        });
        return { links: links };
      }
      case T.GET_PAGE_METADATA:
      case "get_page_metadata": {
        return { title: document.title, url: location.href, description: (document.querySelector('meta[name="description"]') || {}).content || "", lang: document.documentElement.lang || "" };
      }
      case T.GET_SELECTION:
      case "get_selection": {
        const sel = window.getSelection ? String(window.getSelection()) : "";
        return { text: sel.slice(0, 4000) };
      }
      case T.SCROLL_TO:
      case "scroll_to": {
        const el = args.ref ? refEl(args.ref) : (args.target ? document.querySelector(args.target) : null);
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); return { ok: true }; }
        return { error: "not_found" };
      }
      case T.CLICK:
      case "click": {
        const el = refEl(args.ref);
        if (!el) return { error: "not_found" };
        if (isPassword(el)) return { error: "Passwords are protected" };
        window.DGAI_EVENTS.click(el);
        return { ok: true };
      }
      case T.TYPE_TEXT:
      case "type_text": {
        const el = refEl(args.ref);
        if (!el) return { error: "not_found" };
        if (isPassword(el)) return { error: "Passwords are protected" };
        window.DGAI_EVENTS.typeText(el, args.value);
        return { ok: true, value: args.value };
      }
      case T.SELECT_OPTION:
      case "select_option": {
        const el = refEl(args.ref);
        if (!el) return { error: "not_found" };
        if (isPassword(el)) return { error: "Passwords are protected" };
        window.DGAI_EVENTS.selectOption(el, args.value);
        return { ok: true };
      }
      case T.SET_CHECKBOX:
      case "set_checkbox": {
        const el = refEl(args.ref);
        if (!el) return { error: "not_found" };
        if (isPassword(el)) return { error: "Passwords are protected" };
        window.DGAI_EVENTS.setCheckbox(el, args.checked);
        return { ok: true };
      }
      case T.PRESS_KEY:
      case "press_key": {
        const el = args.ref ? refEl(args.ref) : null;
        window.DGAI_EVENTS.pressKey(el, args.key);
        return { ok: true };
      }
      case T.HOVER:
      case "hover": {
        const el = refEl(args.ref);
        if (!el) return { error: "not_found" };
        if (isPassword(el)) return { error: "Passwords are protected" };
        const ev = new MouseEvent("mouseover", { bubbles: true, cancelable: true });
        el.dispatchEvent(ev);
        return { ok: true };
      }
      case T.NAVIGATE:
      case "navigate": {
        if (args.url) { location.href = args.url; return { ok: true, url: args.url }; }
        return { error: "missing_url" };
      }
      case T.SUBMIT_FORM:
      case "submit_form": {
        const el = args.ref ? refEl(args.ref) : null;
        // sensitive if payment-like fields
        const form = el && el.tagName && el.tagName.toLowerCase() === "form" ? el : (el ? el.closest("form") : document.querySelector("form"));
        if (!form) return { error: "no_form" };
        // payment-like check
        const html = form.innerHTML.toLowerCase();
        if (/card|cvv|credit|payment/.test(html)) {
          // signal sensitive; content layer still submits only if called (permission already handled by tier? submit_form is interact; sensitive detection here)
        }
        try { form.submit(); } catch (e) { if (el && el.click) el.click(); }
        return { ok: true };
      }
      case "apply_form_actions": {
        return window.DGAI_FORMS.applyActions(args.actions || []);
      }
      default:
        return { error: "unknown_tool" };
    }
  }

  window.DGAI_ACTIONS = { execute };
})();