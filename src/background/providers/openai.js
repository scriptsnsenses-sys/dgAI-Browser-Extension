/* background/providers/openai.js — OpenAI-compatible adapter (works with custom base URL). */
(function (root) {
  "use strict";
  function create(settings) {
    const apiKey = settings.apiKey || "";
    const base = (settings.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = settings.model || "gpt-4o-mini";
    return {
      id: "openai",
      label: "OpenAI",
      needsKey: true,
      async listModels() {
        try {
          const r = await fetch(base + "/models", { headers: apiKey ? { "Authorization": "Bearer " + apiKey } : {} });
          const j = await r.json();
          return (j.data || []).map(function (m) { return m.id; });
        } catch (e) { return [model]; }
      },
      async *streamChat({ messages, tools, signal }) {
        const body = {
          model: model,
          messages: messages,
          tools: tools && tools.length ? tools.map(toOpenAITool) : undefined,
          stream: true,
          temperature: typeof settings.temperature === "number" ? settings.temperature : 0.3
        };
        const r = await fetch(base + "/chat/completions", {
          method: "POST",
          headers: Object.assign({ "Content-Type": "application/json" }, apiKey ? { "Authorization": "Bearer " + apiKey } : {}),
          body: JSON.stringify(body),
          signal: signal
        });
        if (!r.ok) { throw new Error("OpenAI HTTP " + r.status); }
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        const toolAcc = {};
        let usage = null;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop();
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const data = t.slice(5).trim();
            if (data === "[DONE]") continue;
            let j;
            try { j = JSON.parse(data); } catch (e) { continue; }
            if (j.usage) usage = j.usage;
            const choice = j.choices && j.choices[0];
            if (!choice) continue;
            const delta = choice.delta || {};
            if (delta.content) yield { type: "delta", text: delta.content };
            if (Array.isArray(delta.tool_calls)) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index || 0;
                if (!toolAcc[idx]) toolAcc[idx] = { id: tc.id || ("tc" + idx), name: "", args: "" };
                if (tc.id) toolAcc[idx].id = tc.id;
                if (tc.function && tc.function.name) toolAcc[idx].name = tc.function.name;
                if (tc.function && tc.function.arguments) toolAcc[idx].args += tc.function.arguments;
              }
            }
          }
        }
        for (const idx in toolAcc) {
          const t = toolAcc[idx];
          let args = {};
          try { args = JSON.parse(t.args || "{}"); } catch (e) { args = {}; }
          yield { type: "tool", call: { id: t.id, name: t.name, args: args } };
        }
        yield { type: "done", usage: usage || { total: 0 } };
      }
    };
  }
  function toOpenAITool(t) {
    return { type: "function", function: { name: t.name, description: t.description, parameters: t.params } };
  }
  root.DGAI_OPENAI = { create };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));