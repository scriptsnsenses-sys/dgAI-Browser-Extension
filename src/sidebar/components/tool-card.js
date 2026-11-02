/* sidebar/components/tool-card.js */
(function () {
  "use strict";
  const { h } = window.DGAI_DOM;
  function createToolCard(info) {
    const dot = h("span", { class: "dot" });
    const name = h("span", { class: "name mono" }, info.name || "");
    const summary = h("span", { class: "summary" }, info.summary || "");
    const time = h("span", { class: "time" }, "");
    const chev = h("span", { class: "chev" }, "›");
    const header = h("div", { class: "row" }, dot, name, summary, time, chev);
    const details = h("div", { class: "details", style: { display: "none" } }, "");
    const denied = h("div", { class: "tone", style: { display: "none" } }, "You denied this action. ");
    const retry = h("a", { href: "#" }, "Retry with permission");
    denied.appendChild(retry);
    const card = h("div", { class: "tool-card" }, header, details, denied);
    let open = false;
    let start = Date.now();
    function setStatus(status) {
      dot.className = "dot " + (status || "");
      if (status === "running") { dot.classList.add("running"); start = Date.now(); }
      if (status === "ok" || status === "error" || status === "denied") {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1) + "s";
        time.textContent = elapsed;
      }
    }
    function setDetails(obj) {
      try { details.textContent = JSON.stringify(obj, null, 2); } catch (e) { details.textContent = String(obj); }
    }
    header.addEventListener("click", function () {
      open = !open;
      card.classList.toggle("open", open);
      details.style.display = open ? "block" : "none";
    });
    retry.addEventListener("click", function (e) { e.preventDefault(); /* hook */ });
    setStatus(info.status || "pending");
    if (info.args) setDetails({ args: info.args });
    card._update = function (payload) {
      if (payload.status) setStatus(payload.status);
      if (payload.summary) summary.textContent = payload.summary;
      if (payload.result != null) {
        setDetails({ args: payload.args, result: payload.result });
      }
      if (payload.status === "denied") {
        denied.style.display = "block";
        card.classList.add("denied");
      }
    };
    return card;
  }
  window.DGAI_TOOLCARD = { create: createToolCard };
})();