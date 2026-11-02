/* background/providers/index.js — adapter factory. */
(function (root) {
  "use strict";
  function create(settings) {
    const id = settings.provider || "mock";
    if (id === "openai") return root.DGAI_OPENAI.create(settings);
    if (id === "anthropic") return root.DGAI_ANTHROPIC.create(settings);
    if (id === "ollama") return root.DGAI_OLLAMA.create(settings);
    if (id === "nvidia") return root.DGAI_NVIDIA.create(settings);
    if (id === "custom") return root.DGAI_CUSTOM.create(settings);
    return root.DGAI_MOCK.create(settings);
  }
  root.DGAI_PROVIDERS = { create };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));