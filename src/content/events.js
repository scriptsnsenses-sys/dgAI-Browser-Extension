/* content/events.js — trusted-event simulator. */
(function () {
  "use strict";
  function dispatch(el, type, init) {
    try { el.dispatchEvent(new (window.PointerEvent || MouseEvent)(type, Object.assign({ bubbles: true, cancelable: true, composed: true }, init || {}))); } catch (e) {
      try { el.dispatchEvent(new MouseEvent(type, Object.assign({ bubbles: true, cancelable: true, composed: true }, init || {}))); } catch (e2) {}
    }
  }

  function click(el) {
    if (!el) return false;
    dispatch(el, "pointerover");
    dispatch(el, "pointerenter");
    dispatch(el, "mouseover");
    dispatch(el, "mouseenter");
    dispatch(el, "pointermove");
    dispatch(el, "mousemove");
    dispatch(el, "pointerdown");
    dispatch(el, "mousedown");
    try { el.focus && el.focus(); } catch (e) {}
    dispatch(el, "pointerup");
    dispatch(el, "mouseup");
    dispatch(el, "click");
    return true;
  }

  function typeText(el, value) {
    if (!el) return false;
    if (el.tagName && el.tagName.toLowerCase() === "input" && (el.getAttribute("type") || "").toLowerCase() === "password") {
      throw new Error("Passwords are protected");
    }
    click(el);
    // native setter
    const proto = el.tagName.toLowerCase() === "textarea" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value");
    if (setter && setter.set) setter.set.call(el, value);
    else el.value = value;
    dispatch(el, "input");
    dispatch(el, "change");
    return true;
  }

  function selectOption(el, value) {
    if (!el) return false;
    const opt = Array.from(el.options || []).find(function (o) { return o.value === value || o.textContent.trim() === value; });
    if (opt) el.value = opt.value;
    dispatch(el, "change");
    return true;
  }

  function setCheckbox(el, checked) {
    if (!el) return false;
    if (el.checked !== checked) click(el);
    el.checked = checked;
    dispatch(el, "change");
    return true;
  }

  function pressKey(el, key) {
    const target = el || document.activeElement || document.body;
    const ev = new KeyboardEvent("keydown", { key: key, bubbles: true, cancelable: true, composed: true });
    target.dispatchEvent(ev);
    const ev2 = new KeyboardEvent("keyup", { key: key, bubbles: true, cancelable: true, composed: true });
    target.dispatchEvent(ev2);
    return true;
  }

  window.DGAI_EVENTS = { click, typeText, selectOption, setCheckbox, pressKey };
})();