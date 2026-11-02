/* background/providers/custom.js — user-defined provider (OpenAI/Anthropic/Responses). */
(function (root) {
  "use strict";
  const C = (root.DGAI_CONSTANTS || {});
  function joinUrl(base, path) {
    base = String(base || "").trim().replace(/\/$/, "");
    path = String(path || "").trim();
    if (base.endsWith("/v1") && path.startsWith("/v1/")) base = base.slice(0, -3);
    if (base.endsWith(path)) return base;
    return base + path;
  }
  function parseHeaders(s) {
    if (!s) return {};
    if (typeof s === "object") return s;
    try { return JSON.parse(s); } catch (e) {}
    const out = {};
    String(s).split(/\n/).forEach(function (line) {
      const i = line.indexOf(":");
      if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
    return out;
  }
  function pathFor(type) {
    if (type === "messages") return "/v1/messages";
    if (type === "responses") return "/v1/responses";
    return "/v1/chat/completions";
  }

  function create(settings) {
    const s = settings || {};
    const custom = s.custom || {};
    const baseUrl = custom.baseUrl || s.baseUrl || "";
    const endpointType = custom.endpointType || s.endpointType || "chat_completions";
    const model = custom.model || s.model || "";
    const apiKey = (custom.apiKey != null ? custom.apiKey : s.apiKey) || "";
    const headersIn = custom.headers != null ? custom.headers : s.customHeaders;
    const customHeaders = parseHeaders(headersIn);
    const path = pathFor(endpointType);

    return {
      id: "custom",
      label: "Custom",
      needsKey: false,
      async listModels() { return model ? [model] : []; },
      async *streamChat({ messages, tools, signal }) {
        const url = joinUrl(baseUrl, path);
        const headers = Object.assign({ "Content-Type": "application/json" }, customHeaders);
        if (endpointType === "messages") {
          if (apiKey && !headers["x-api-key"]) headers["x-api-key"] = apiKey;
          if (!headers["anthropic-version"]) headers["anthropic-version"] = "2023-06-01";
        } else {
          if (apiKey && !headers["Authorization"]) headers["Authorization"] = "Bearer " + apiKey;
        }

        if (endpointType === "messages") {
          // Anthropic-style
          const system = messages.filter(function (m) { return m.role === "system"; }).map(function (m) { return m.content; }).join("\n");
          const msgs = messages.filter(function (m) { return m.role !== "system"; }).map(function (m) {
            if (m.role === "tool") return { role: "user", content: [{ type: "tool_result", tool_use_id: m.tool_call_id, content: m.content }] };
            if (m.tool_calls) return { role: "assistant", content: m.tool_calls.map(function (tc) { return { type: "tool_use", id: tc.id, name: tc.name, input: tc.args }; }) };
            return { role: m.role, content: m.content };
          });
          const body = { model: model, max_tokens: 1024, system: system, messages: msgs, stream: true };
          const r = await fetch(url, { method: "POST", headers: headers, body: JSON.stringify(body), signal: signal });
          if (!r.ok) throw new Error("Custom HTTP " + r.status);
          const reader = r.body.getReader();
          const dec = new TextDecoder();
          let buf = "";
          let currentTool = null;
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n"); buf = lines.pop();
            for (const line of lines) {
              const t = line.trim();
              if (!t.startsWith("data:")) continue;
              const data = t.slice(5).trim();
              if (!data) continue;
              let j; try { j = JSON.parse(data); } catch (e) { continue; }
              if (j.type === "content_block_start" && j.content_block && j.content_block.type === "tool_use") currentTool = { id: j.content_block.id, name: j.content_block.name, args: "" };
              else if (j.type === "content_block_delta") {
                if (j.delta && j.delta.type === "text_delta") yield { type: "delta", text: j.delta.text };
                if (j.delta && j.delta.type === "input_json_delta" && currentTool) currentTool.args += j.delta.partial_json || "";
              } else if (j.type === "content_block_stop") {
                if (currentTool) {
                  let args = {}; try { args = JSON.parse(currentTool.args || "{}"); } catch (e) { args = {}; }
                  yield { type: "tool", call: { id: currentTool.id, name: currentTool.name, args: args } };
                  currentTool = null;
                }
              } else if (j.type === "message_stop") yield { type: "done", usage: { total: 0 } };
            }
          }
          return;
        }

        if (endpointType === "responses") {
          const body = { model: model, input: messages.map(function (m) { return { role: m.role, content: m.content }; }), stream: true };
          const r = await fetch(url, { method: "POST", headers: headers, body: JSON.stringify(body), signal: signal });
          if (!r.ok) throw new Error("Custom HTTP " + r.status);
          const reader = r.body.getReader();
          const dec = new TextDecoder();
          let buf = "";
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n"); buf = lines.pop();
            for (const line of lines) {
              const t = line.trim();
              if (!t.startsWith("data:")) continue;
              const data = t.slice(5).trim();
              if (!data || data === "[DONE]") continue;
              let j; try { j = JSON.parse(data); } catch (e) { continue; }
              if (j.type === "response.output_text.delta" && j.delta) yield { type: "delta", text: j.delta };
              if (j.type === "response.completed") yield { type: "done", usage: { total: (j.response && j.response.usage && j.response.usage.total_tokens) || 0 } };
            }
          }
          return;
        }

        // chat_completions (default)
        const body = { model: model, messages: messages, stream: true, temperature: typeof s.temperature === "number" ? s.temperature : 0.3 };
        const r = await fetch(url, { method: "POST", headers: headers, body: JSON.stringify(body), signal: signal });
        if (!r.ok) throw new Error("Custom HTTP " + r.status);
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        const toolAcc = {};
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop();
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const data = t.slice(5).trim();
            if (data === "[DONE]") continue;
            let j; try { j = JSON.parse(data); } catch (e) { continue; }
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
          let args = {}; try { args = JSON.parse(t.args || "{}"); } catch (e) { args = {}; }
          yield { type: "tool", call: { id: t.id, name: t.name, args: args } };
        }
        yield { type: "done", usage: { total: 0 } };
      }
    };
  }

  root.DGAI_CUSTOM = { create };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));