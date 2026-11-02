/* sidebar/components/permission-card.js */
(function () {
  "use strict";
  const { h } = window.DGAI_DOM;
  function createPermissionCard(data, onDecision) {
    const shield = h("span", { class: "shield" }, "🛡");
    const title = h("span", {}, "Permission needed");
    const domain = h("span", { class: "domain mono" }, data.host || "");
    const header = h("div", { class: "header" }, shield, title, domain);
    const summary = h("div", { class: "summary" }, data.summary || "");
    const diff = h("div", { class: "diff" });
    if (data.args && data.args.value != null) {
      const cur = h("span", { class: "current" }, "(current)");
      const nw = h("span", { class: "new" }, String(data.args.value));
      diff.appendChild(cur); diff.appendChild(document.createTextNode(" → ")); diff.appendChild(nw);
    }
    const risk = h("span", { class: "risk " + String(data.risk || "medium").toLowerCase() }, data.risk || "Medium");
    const allowOnce = h("button", { class: "btn primary" }, "Allow once");
    const allowSite = h("button", { class: "btn" }, "Allow on this site");
    const deny = h("button", { class: "btn ghost danger" }, "Deny");
    const actions = h("div", { class: "actions" }, allowOnce, allowSite, deny);
    const caption = h("div", { class: "caption" }, "dgAI can always read pages. This controls whether it can act on this site.");
    const card = h("div", { class: "permission-card", tabindex: "-1" }, header, risk, summary, diff, actions, caption);

    allowOnce.addEventListener("click", function () { onDecision("once"); });
    allowSite.addEventListener("click", function () { onDecision("session"); });
    deny.addEventListener("click", function () { onDecision(null); });

    // keyboard
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); onDecision("once"); }
      if (e.key === "Escape") { e.preventDefault(); onDecision(null); }
    });
    setTimeout(function () { card.focus(); }, 50);
    return card;
  }
  window.DGAI_PERMISSIONCARD = { create: createPermissionCard };
})();