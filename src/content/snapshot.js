/* content/snapshot.js — accessible page snapshot + ref IDs. */
(function () {
  "use strict";
  if (window.__DGAI_SNAPSHOT_LOADED) return;
  window.__DGAI_SNAPSHOT_LOADED = true;

  const MAX_ELEMENTS = (window.DGAI_CONSTANTS && window.DGAI_CONSTANTS.MAX_ELEMENTS) || 300;
  const TEXT_CAP = (window.DGAI_CONSTANTS && window.DGAI_CONSTANTS.SNAPSHOT_TEXT_CAP) || 8000;

  window.__dgaiRefs = new Map();
  let refCounter = 0;

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) === 0) return false;
    return true;
  }

  function roleOf(el) {
    if (el.getAttribute && el.getAttribute("role")) return el.getAttribute("role");
    const tag = el.tagName ? el.tagName.toLowerCase() : "";
    const map = { a: "link", button: "button", input: "textbox", textarea: "textbox", select: "combobox", img: "img", h1: "heading", h2: "heading", h3: "heading" };
    if (tag === "input") {
      const t = (el.getAttribute("type") || "text").toLowerCase();
      if (t === "checkbox") return "checkbox";
      if (t === "radio") return "radio";
      if (t === "submit" || t === "button") return "button";
      if (t === "password") return "textbox";
    }
    return map[tag] || tag;
  }

  function nameOf(el) {
    if (!el) return "";
    if (el.getAttribute) {
      const al = el.getAttribute("aria-label");
      if (al) return al;
      const labelledby = el.getAttribute("aria-labelledby");
      if (labelledby) {
        const t = document.getElementById(labelledby);
        if (t) return (t.innerText || t.textContent || "").trim();
      }
    }
    const tag = el.tagName ? el.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || tag === "select") {
      // label
      if (el.id) {
        const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
        if (l) return (l.innerText || "").trim();
      }
      if (el.placeholder) return el.placeholder;
    }
    if (tag === "img") return el.alt || "";
    const txt = (el.innerText || el.textContent || "").trim();
    return txt.slice(0, 80);
  }

  function assignRef(el) {
    const r = "e" + (++refCounter);
    window.__dgaiRefs.set(r, el);
    return r;
  }

  function redactValue(el) {
    const tag = el.tagName ? el.tagName.toLowerCase() : "";
    const type = (el.getAttribute && el.getAttribute("type")) || "";
    if (tag === "input" && type.toLowerCase() === "password") return null;
    if (typeof el.value === "string" && el.value.length > 200) return el.value.slice(0, 200);
    return (el.value != null) ? String(el.value) : null;
  }

  function buildElements() {
    const candidates = Array.from(document.querySelectorAll("a,button,input,textarea,select,[role],h1,h2,h3,summary,details"));
    const out = [];
    for (const el of candidates) {
      if (out.length >= MAX_ELEMENTS) break;
      if (!isVisible(el)) continue;
      const ref = assignRef(el);
      const r = el.getBoundingClientRect();
      out.push({
        ref: ref,
        role: roleOf(el),
        name: nameOf(el),
        tag: el.tagName ? el.tagName.toLowerCase() : "",
        value: redactValue(el),
        disabled: !!el.disabled,
        visible: true,
        bbox: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]
      });
    }
    return out;
  }

  function buildForms() {
    const forms = Array.from(document.querySelectorAll("form"));
    return forms.map(function (f, i) {
      const fields = [];
      const inputs = Array.from(f.querySelectorAll("input,textarea,select"));
      for (const el of inputs) {
        const ref = assignRef(el);
        const label = nameOf(el);
        const type = (el.getAttribute && el.getAttribute("type")) || (el.tagName.toLowerCase() === "select" ? "select" : "text");
        let options = null;
        if (el.tagName.toLowerCase() === "select") {
          options = Array.from(el.options || []).map(function (o) { return { value: o.value, label: o.textContent.trim() }; });
        }
        fields.push({ ref: ref, label: label, type: type, value: redactValue(el), required: !!el.required, options: options, error: null });
      }
      return { ref: "f" + (i + 1), name: f.getAttribute("name") || f.getAttribute("aria-label") || ("Form " + (i + 1)), fields: fields };
    });
  }

  function readableText() {
    const t = (document.body && document.body.innerText) ? document.body.innerText : "";
    return t.replace(/\s+/g, " ").trim().slice(0, TEXT_CAP);
  }

  window.DGAI_SNAPSHOT = {
    build: function (kind) {
      window.__dgaiRefs = new Map();
      refCounter = 0;
      const base = {
        url: location.href,
        title: document.title,
        host: location.hostname,
        viewport: { w: window.innerWidth, h: window.innerHeight }
      };
      if (kind === "text") {
        const t = readableText();
        return Object.assign(base, { text: t, truncated: t.length >= TEXT_CAP, elements: [], forms: [] });
      }
      if (kind === "form") {
        return Object.assign(base, { text: "", truncated: false, elements: buildElements(), forms: buildForms() });
      }
      const t = readableText();
      return Object.assign(base, { text: t, truncated: t.length >= TEXT_CAP, elements: buildElements(), forms: buildForms() });
    }
  };
})();