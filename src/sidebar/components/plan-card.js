/* sidebar/components/plan-card.js */
(function () {
  "use strict";
  const { h } = window.DGAI_DOM;
  function createPlanCard(plan) {
    const title = h("div", { class: "title" }, "Plan");
    const ul = h("ul", { class: "steps" });
    (plan.steps || []).forEach(function (s) {
      const icon = h("span", { class: "icon" });
      const li = h("li", { class: "step " + (s.status || "pending") }, icon, s.text);
      ul.appendChild(li);
    });
    const done = (plan.steps || []).filter(function (s) { return s.status === "done"; }).length;
    const summary = h("div", { class: "collapsed-summary" }, done + " of " + (plan.steps || []).length + " steps done");
    const card = h("div", { class: "plan-card" }, title, ul, summary);
    return card;
  }
  window.DGAI_PLANCARD = { create: createPlanCard };
})();