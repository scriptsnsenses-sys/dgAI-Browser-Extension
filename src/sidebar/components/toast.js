/* sidebar/components/toast.js */
(function () {
  "use strict";
  const { h } = window.DGAI_DOM;
  let container = null;
  function ensure() {
    if (container) return container;
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
    return container;
  }
  function show(msg, kind) {
    const c = ensure();
    const t = h("div", { class: "toast" }, msg);
    if (kind) t.classList.add(kind);
    c.appendChild(t);
    setTimeout(function () { t.remove(); }, 4000);
  }
  window.DGAI_TOAST = { show };
})();