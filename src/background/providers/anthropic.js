/* background/providers/anthropic.js — Anthropic Messages API adapter. */
(function (root) {
  "use strict";
  function create(settings) {
    const apiKey = settings.apiKey || "";
    const base = (settings.baseUrl || "https://api.anthropic.com").replace(/\/$/, "");
    const model = settings.model || "claude-3-5-sonnet-latest";
    return {
      id: "anthropic",
      label: "Anthropic",
      needsKey: true,
      async listModels() { return [model]; },
      async *streamChat({ messages, tools, signal }) {
        // Convert messages: system extracted
        const system = messages.filter(function (m) { return m.role === "system"; }).map(function (m) { return m.content; }).join("\n");
        const msgs = messages.filter(function (m) { return m.role !== "system"; }).map(function (m) {
          if (m.role === "tool") return { role: "user", content: [{ type: "tool_result", tool_use_id: m.tool_call_id, content: m.content }] };
          if (m.tool_calls) {
            return { role: "assistant", content: m.tool_calls.map(function (tc) { return { type: "tool_use", id: tc.id, name: tc.name, input: tc.args }; }) };
          }
          return { role: m.role, content: m.content };
        });
        const body = {
          model: model,
          max_tokens: 1024,
          system: system,
          messages: msgs,
          tools: tools && tools.length ? tools.map(function (t) { return { name: t.name, description: t.description, input_schema: t.params }; }) : undefined,
          stream: true
        };
        const r = await fetch(base + "/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify(body),
          signal: signal
        });
        if (!r.ok) throw new Error("Anthropic HTTP " + r.status);
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let currentTool = null;
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
            if (!data) continue;
            let j;
            try { j = JSON.parse(data); } catch (e) { continue; }
            if (j.type === "content_block_start" && j.content_block && j.content_block.type === "tool_use") {
              currentTool = { id: j.content_block.id, name: j.content_block.name, args: "" };
            } else if (j.type === "content_block_delta") {
              if (j.delta && j.delta.type === "text_delta") yield { type: "delta", text: j.delta.text };
              if (j.delta && j.delta.type === "input_json_delta" && currentTool) currentTool.args += j.delta.partial_json || "";
            } else if (j.type === "content_block_stop") {
              if (currentTool) {
                let args = {};
                try { args = JSON.parse(currentTool.args || "{}"); } catch (e) { args = {}; }
                yield { type: "tool", call: { id: currentTool.id, name: currentTool.name, args: args } };
                currentTool = null;
              }
            } else if (j.type === "message_stop") {
              yield { type: "done", usage: { total: 0 } };
            }
          }
        }
      }
    };
  }
  root.DGAI_ANTHROPIC = { create };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));