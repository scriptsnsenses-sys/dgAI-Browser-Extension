/* background/providers/ollama.js — local Ollama adapter (privacy-first). */
(function (root) {
  "use strict";
  function create(settings) {
    const base = (settings.baseUrl || "http://localhost:11434").replace(/\/$/, "");
    const model = settings.model || "llama3.1";
    return {
      id: "ollama",
      label: "Ollama (local)",
      needsKey: false,
      async listModels() {
        try {
          const r = await fetch(base + "/api/tags");
          const j = await r.json();
          return (j.models || []).map(function (m) { return m.name; });
        } catch (e) { return [model]; }
      },
      async *streamChat({ messages, tools, signal }) {
        const r = await fetch(base + "/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: model, messages: messages, stream: true, tools: tools && tools.length ? tools.map(function (t) { return { type: "function", function: { name: t.name, description: t.description, parameters: t.params } }; }) : undefined }),
          signal: signal
        });
        if (!r.ok) throw new Error("Ollama HTTP " + r.status);
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop();
          for (const line of lines) {
            const t = line.trim();
            if (!t) continue;
            let j;
            try { j = JSON.parse(t); } catch (e) { continue; }
            if (j.message && j.message.content) yield { type: "delta", text: j.message.content };
            if (j.message && Array.isArray(j.message.tool_calls)) {
              for (const tc of j.message.tool_calls) {
                yield { type: "tool", call: { id: "tc" + Date.now(), name: tc.function.name, args: tc.function.arguments || {} } };
              }
            }
            if (j.done) yield { type: "done", usage: { total: j.eval_count || 0 } };
          }
        }
      }
    };
  }
  root.DGAI_OLLAMA = { create };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));