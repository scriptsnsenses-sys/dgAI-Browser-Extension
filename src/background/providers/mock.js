/* background/providers/mock.js — deterministic fake LLM for offline demo. */
(function (root) {
  "use strict";
  function create(settings) {
    return {
      id: "mock",
      label: "Mock (offline)",
      needsKey: false,
      async listModels() { return ["mock-1"]; },
      async *streamChat({ messages, tools, signal }) {
        // Inspect last user message
        const last = messages[messages.length - 1];
        const text = (last && last.content) ? String(last.content) : "";
        const lower = text.toLowerCase();
        const userMsg = messages.find(function (m) { return m.role === "user" && typeof m.content === "string" && m.content.indexOf("Page snapshot") === -1; });
        const userText = userMsg ? String(userMsg.content).toLowerCase() : "";
        if (hasToolResult) {
          if (userText.indexOf("summar") !== -1 || userText.indexOf("page") !== -1) {
            yield { type: "delta", text: "Here is a concise summary of the page based on its content." };
          } else if (userText.indexOf("fill") !== -1 || userText.indexOf("form") !== -1) {
            yield { type: "delta", text: "Done. I've filled the form fields using your profile." };
          } else if (userText.indexOf("table") !== -1) {
            yield { type: "delta", text: "I extracted the table above." };
          } else {
            yield { type: "delta", text: "Done." };
          }
          yield { type: "done", usage: { prompt: 120, completion: 40, total: 160 } };
          return;
        }
        // Decide tool usage
        if (lower.indexOf("fill") !== -1 || lower.indexOf("form") !== -1) {
          yield { type: "delta", text: "I'll inspect the form first. " };
          await delay(120, signal);
          yield { type: "tool", call: { id: "t1", name: "snapshot_form", args: {} } };
          await delay(60, signal);
          yield { type: "delta", text: "Now filling fields with your profile. " };
          await delay(120, signal);
          yield { type: "tool", call: { id: "t2", name: "type_text", args: { ref: "e5", value: "Demo User" } } };
          await delay(60, signal);
          yield { type: "done", usage: { prompt: 120, completion: 40, total: 160 } };
          return;
        }
        if (lower.indexOf("table") !== -1) {
          yield { type: "delta", text: "Extracting tables from the page. " };
          await delay(100, signal);
          yield { type: "tool", call: { id: "t1", name: "extract_table", args: {} } };
          await delay(60, signal);
          yield { type: "done", usage: { prompt: 80, completion: 30, total: 110 } };
          return;
        }
        // default: read page then summarize
        yield { type: "delta", text: "Let me read the page first. " };
        await delay(100, signal);
        yield { type: "tool", call: { id: "t1", name: "read_page", args: {} } };
        await delay(80, signal);
        yield { type: "delta", text: "Here is a concise summary of the page based on its content." };
        yield { type: "done", usage: { prompt: 200, completion: 60, total: 260 } };
      }
    };
  }
  function delay(ms, signal) {
    return new Promise(function (res, rej) {
      const t = setTimeout(res, ms);
      if (signal) signal.addEventListener("abort", function () { clearTimeout(t); rej(new Error("aborted")); }, { once: true });
    });
  }
  root.DGAI_MOCK = { create };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));