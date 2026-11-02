/* content/forms.js — closed-loop form kit. */
(function () {
  "use strict";
  function snapshotForm() {
    return (window.DGAI_SNAPSHOT && window.DGAI_SNAPSHOT.build) ? window.DGAI_SNAPSHOT.build("form") : null;
  }

  function refEl(ref) {
    return window.__dgaiRefs ? window.__dgaiRefs.get(ref) : null;
  }

  function readField(el) {
    const invalid = (typeof el.checkValidity === "function") ? !el.checkValidity() : false;
    let error = null;
    if (el.getAttribute && el.getAttribute("aria-invalid") === "true") error = "invalid";
    if (invalid && el.validationMessage) error = el.validationMessage;
    // visible error nodes
    try {
      const parent = el.parentElement;
      if (parent) {
        const err = parent.querySelector(".error, .invalid-feedback, [role='alert']");
        if (err) error = (err.innerText || err.textContent || "").trim() || error;
      }
    } catch (e) {}
    return { ref: null, value: (el.value != null ? String(el.value) : ""), invalid: invalid, error: error };
  }

  async function applyActions(actions) {
    actions = actions || [];
    const results = [];
    for (const a of actions) {
      const el = refEl(a.ref);
      if (!el) { results.push({ ref: a.ref, ok: false, error: "not_found" }); continue; }
      if (el.tagName && el.tagName.toLowerCase() === "input" && (el.getAttribute("type") || "").toLowerCase() === "password") {
        results.push({ ref: a.ref, ok: false, error: "Passwords are protected" });
        continue;
      }
      try {
        const op = a.op;
        if (op === "type" || op === "type_text") window.DGAI_EVENTS.typeText(el, a.value);
        else if (op === "click") window.DGAI_EVENTS.click(el);
        else if (op === "select" || op === "select_option") window.DGAI_EVENTS.selectOption(el, a.value);
        else if (op === "check" || op === "set_checkbox") window.DGAI_EVENTS.setCheckbox(el, a.value !== false);
        else if (op === "focus") { try { el.focus(); } catch (e) {} }
        results.push({ ref: a.ref, ok: true });
      } catch (e) {
        results.push({ ref: a.ref, ok: false, error: String(e && e.message ? e.message : e) });
      }
    }
    // re-read DOM
    const snap = snapshotForm();
    // annotate actual values
    if (snap && Array.isArray(snap.forms)) {
      for (const f of snap.forms) {
        for (const fld of f.fields) {
          const el = refEl(fld.ref);
          if (el) {
            const r = readField(el);
            fld.value = r.value;
            fld.error = r.error;
          }
        }
      }
    }
    // newly revealed fields are already in snapshot
    return { ok: true, results: results, snapshot: snap };
  }

  window.DGAI_FORMS = { snapshotForm, applyActions, refEl };
})();