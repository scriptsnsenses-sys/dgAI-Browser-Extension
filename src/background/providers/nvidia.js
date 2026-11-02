/* background/providers/nvidia.js — NVIDIA Integrate API (OpenAI-compatible). */
(function (root) {
  "use strict";
  function create(settings) {
    const apiKey = settings.apiKey || "";
    const base = (settings.baseUrl || "https://integrate.api.nvidia.com/v1").replace(/\/$/, "");
    const model = settings.model || "meta/llama-3.1-8b-instruct";
    // reuse openai implementation by delegating
    const impl = root.DGAI_OPENAI.create(Object.assign({}, settings, { baseUrl: base, model: model }));
    impl.id = "nvidia";
    impl.label = "NVIDIA";
    return impl;
  }
  root.DGAI_NVIDIA = { create };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));