/* sidebar/lib/dom.js — h() helper, safe text insertion. */
(function () {
  "use strict";
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    attrs = attrs || {};
    for (const k in attrs) {
      if (k === "class") el.className = attrs[k];
      else if (k === "style" && typeof attrs[k] === "object") Object.assign(el.style, attrs[k]);
      else if (k.startsWith("on") && typeof attrs[k] === "function") el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (k === "html") { /* never allow raw html */ }
      else el.setAttribute(k, attrs[k]);
    }
    for (const c of children.flat()) {
      if (c == null) continue;
      if (typeof c === "string" || typeof c === "number") el.appendChild(document.createTextNode(String(c)));
      else if (c instanceof Node) el.appendChild(c);
    }
    return el;
  }
  function text(s) { return document.createTextNode(String(s == null ? "" : s)); }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  window.DGAI_DOM = { h, text, clear };
})();