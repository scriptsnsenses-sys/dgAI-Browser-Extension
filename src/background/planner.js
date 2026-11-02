/* background/planner.js — plan-before-act helpers. */
(function (root) {
  "use strict";
  function createPlan(goal) {
    const steps = [];
    const g = String(goal || "").toLowerCase();
    if (g.indexOf("fill") !== -1) { steps.push("Inspect form fields"); steps.push("Fill fields from profile"); steps.push("Review and submit"); }
    else if (g.indexOf("reply") !== -1 || g.indexOf("draft") !== -1) { steps.push("Read thread"); steps.push("Draft reply"); steps.push("Insert draft"); }
    else if (g.indexOf("meeting") !== -1 || g.indexOf("calendar") !== -1) { steps.push("Open calendar"); steps.push("Extract next meeting"); }
    else { steps.push("Read page"); steps.push("Answer request"); }
    return { goal: goal, steps: steps.map(function (s, i) { return { id: i, text: s, status: "pending" }; }), current: 0 };
  }
  function setStep(plan, index, status) {
    if (!plan || !plan.steps[index]) return plan;
    plan.steps[index].status = status;
    return plan;
  }
  root.DGAI_PLANNER = { createPlan, setStep };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));