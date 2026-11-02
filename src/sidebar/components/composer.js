/* sidebar/components/composer.js */
(function () {
  "use strict";
  const { h } = window.DGAI_DOM;
  function createComposer(onSend) {
    const textarea = h("textarea", { rows: "1", placeholder: "Ask dgAI…" });
    const sendBtn = h("button", { class: "send-btn", "aria-label": "Send" }, "↑");
    const quick = h("div", { class: "quick-actions" });
    const inputRow = h("div", { class: "input-row" }, textarea, sendBtn);
    const cmdMenu = h("div", { class: "cmd-menu", style: { display: "none" } });
    const root = h("div", { class: "composer" }, quick, inputRow, cmdMenu);

    const commands = ["/summarize", "/fill", "/extract", "/read", "/settings"];
    function showCmds(filter) {
      // clear
      while (cmdMenu.firstChild) cmdMenu.removeChild(cmdMenu.firstChild);
      const items = commands.filter(function (c) { return c.indexOf(filter) === 0; });
      if (!items.length || !filter.startsWith("/")) { cmdMenu.style.display = "none"; return; }
      cmdMenu.style.display = "block";
      items.forEach(function (c) {
        const item = h("div", { class: "item" }, c);
        item.addEventListener("click", function () { textarea.value = c + " "; textarea.focus(); cmdMenu.style.display = "none"; });
        cmdMenu.appendChild(item);
      });
    }
    textarea.addEventListener("input", function () {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 140) + "px";
      const v = textarea.value;
      const last = v.split(/\s/).pop();
      showCmds(last);
    });
    function send() {
      const v = textarea.value.trim();
      if (!v) return;
      textarea.value = "";
      textarea.style.height = "auto";
      cmdMenu.style.display = "none";
      onSend(v);
    }
    sendBtn.addEventListener("click", function () {
      if (sendBtn.classList.contains("stop")) return; // handled outside
      send();
    });
    textarea.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });
    function setQuickActions(items) {
      while (quick.firstChild) quick.removeChild(quick.firstChild);
      items.forEach(function (it) {
        const chip = h("button", { class: "chip" }, it.label);
        chip.addEventListener("click", function () { onSend(it.prompt); });
        quick.appendChild(chip);
      });
    }
    function setStopMode(on) {
      if (on) { sendBtn.classList.add("stop"); sendBtn.textContent = "■"; }
      else { sendBtn.classList.remove("stop"); sendBtn.textContent = "↑"; }
    }
    root._textarea = textarea;
    root._setQuickActions = setQuickActions;
    root._setStopMode = setStopMode;
    return root;
  }
  window.DGAI_COMPOSER = { create: createComposer };
})();