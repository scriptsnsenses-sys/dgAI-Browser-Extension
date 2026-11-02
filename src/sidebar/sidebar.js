/* sidebar/sidebar.js — app shell, state, rendering. */
(function () {
  "use strict";
  const { h, clear } = window.DGAI_DOM;
  const C = window.DGAI_CONSTANTS || {};
  const MSG = C.MSG || {};
  const STORE = window.DGAI_STORE;

  const app = document.getElementById("app");

  // Header
  const logo = h("div", { class: "logo" }, h("svg", { viewBox: "0 0 24 24", fill: "none" }, h("circle", { cx: "12", cy: "12", r: "9", stroke: "currentColor", "stroke-width": "2" }), h("path", { d: "M8 12l3 3 5-6", stroke: "currentColor", "stroke-width": "2", fill: "none" })), "dgAI");
  const pageChip = h("div", { class: "page-chip", title: "" }, h("img", { src: "", alt: "" }), h("span", { class: "title" }, "No page"));
  const modelChip = h("button", { class: "model-chip" }, "mock");
  const themeBtn = h("button", { class: "icon-btn", "aria-label": "Theme" }, "◐");
  const settingsBtn = h("button", { class: "icon-btn", "aria-label": "Settings" }, "⚙");
  const header = h("div", { class: "header" }, logo, pageChip, h("div", { style: { flex: "1" } }), modelChip, themeBtn, settingsBtn);

  // Status strip
  const statusPill = h("span", { class: "status-pill readonly" }, h("span", { class: "dot" }), "Read-only");
  const statusLink = h("a", { href: "#" }, "Allow…");
  statusPill.appendChild(statusLink);
  const statusStrip = h("div", { class: "status-strip" }, statusPill);

  // Conversation
  const conversation = h("div", { class: "conversation" });
  const jumpPill = h("button", { class: "jump-pill", style: { display: "none" } }, "Jump to latest ↓");
  conversation.appendChild(jumpPill);

  // Composer
  let composer;
  // Settings drawer
  const drawer = window.DGAI_SETTINGS_DRAWER.create();
  app.style.position = "relative";
  app.appendChild(drawer);

  // Footer
  const footerDot = h("span", { class: "dot" });
  const footerModel = h("span", {}, "mock");
  const footerTokens = h("span", {}, "0 tokens");
  const footerLatency = h("span", {}, "—");
  const footer = h("div", { class: "footer" }, footerDot, footerModel, footerTokens, footerLatency);

  // Layout
  app.appendChild(header);
  app.appendChild(statusStrip);
  app.appendChild(conversation);
  composer = window.DGAI_COMPOSER.create(handleSend);
  app.appendChild(composer);
  app.appendChild(footer);

  // State
  let currentRunId = null;
  let toolCards = new Map();
  let assistantStream = null;
  let userScrolledUp = false;
  let lastFocus = null;

  conversation.addEventListener("scroll", function () {
    const nearBottom = conversation.scrollHeight - conversation.scrollTop - conversation.clientHeight < 40;
    userScrolledUp = !nearBottom;
    jumpPill.style.display = userScrolledUp ? "block" : "none";
  });
  jumpPill.addEventListener("click", function () { conversation.scrollTop = conversation.scrollHeight; userScrolledUp = false; jumpPill.style.display = "none"; });

  function scrollBottom() {
    if (!userScrolledUp) conversation.scrollTop = conversation.scrollHeight;
  }

  function handleSend(text) {
    // slash commands
    if (text.startsWith("/")) {
      const cmd = text.split(" ")[0];
      if (cmd === "/settings") { openSettings(); return; }
      // otherwise send as prompt with command hint
    }
    startRun(text);
  }

  function startRun(text) {
    const runId = "run_" + Date.now();
    currentRunId = runId;
    STORE.set({ run: { active: true, runId: runId, status: "running" } });
    composer._setStopMode(true);
    // user message
    conversation.appendChild(window.DGAI_MESSAGE.createUser(text));
    // clear empty state if present
    const empty = conversation.querySelector(".empty-state");
    if (empty) empty.remove();
    scrollBottom();

    // pending permission holder
    window._pendingPermissionResolver = null;

    browser.runtime.sendMessage({ type: MSG.USER_PROMPT, runId: runId, payload: { text: text } });
  }

  function stopRun() {
    if (currentRunId) browser.runtime.sendMessage({ type: MSG.CANCEL_RUN, runId: currentRunId, payload: {} });
  }
  composer._setStopMode(false);
  // wire stop button
  const sendBtn = composer.querySelector(".send-btn");
  sendBtn.addEventListener("click", function (e) {
    if (sendBtn.classList.contains("stop")) { e.stopImmediatePropagation(); stopRun(); }
  }, true);

  // Empty state
  function showEmpty() {
    if (conversation.querySelector(".empty-state")) return;
    const empty = h("div", { class: "empty-state" },
      h("div", { class: "logo" }, h("svg", { viewBox: "0 0 24 24", fill: "none", width: "24", height: "24" }, h("circle", { cx: "12", cy: "12", r: "9", stroke: "currentColor", "stroke-width": "2" }))),
      h("div", {}, "dgAI reads any page. It asks before it acts."),
      h("div", { class: "chips" },
        chip("Summarize this page", "Summarize this page"),
        chip("Fill out this form", "Fill out this form"),
        chip("Draft a reply to this thread", "Draft a reply to this thread")
      ),
      h("div", { style: { fontSize: "11px", color: "var(--text-faint)" } }, "dgAI can read any page. It asks before it acts.")
    );
    conversation.insertBefore(empty, jumpPill);
  }
  function chip(label, prompt) {
    const c = h("button", { class: "chip" }, label);
    c.addEventListener("click", function () { handleSend(prompt); });
    return c;
  }
  showEmpty();

  // Context quick actions
  function updateQuickActions(host, url) {
    let items = [
      { label: "Summarize page", prompt: "Summarize this page" },
      { label: "Extract table", prompt: "Extract the main table" },
      { label: "Find on page", prompt: "What is on this page?" }
    ];
    if (host && host.indexOf("mail.google") !== -1) {
      items = [
        { label: "Summarize thread", prompt: "Summarize this thread" },
        { label: "Draft reply", prompt: "Draft a reply to this thread" }
      ];
    }
    if (document && url) {}
    composer._setQuickActions(items);
  }

  // Message handling from background
  browser.runtime.onMessage.addListener(function (msg) {
    if (!msg || !msg.type) return;
    switch (msg.type) {
      case MSG.RUN_STARTED:
        break;
      case MSG.ASSISTANT_DELTA:
        if (!assistantStream) {
          assistantStream = window.DGAI_MESSAGE.createAssistant();
          conversation.appendChild(assistantStream.el);
        }
        // append token text by adding text node before caret
        const caret = assistantStream.caret;
        const tn = document.createTextNode(msg.payload.text || "");
        caret.parentNode.insertBefore(tn, caret);
        scrollBottom();
        break;
      case MSG.ASSISTANT_MESSAGE:
        if (assistantStream) {
          window.DGAI_MESSAGE.finalizeAssistant(assistantStream.body, assistantStream.caret, msg.payload.text || "");
          assistantStream = null;
        } else {
          const a = window.DGAI_MESSAGE.createAssistant();
          window.DGAI_MESSAGE.finalizeAssistant(a.body, a.caret, msg.payload.text || "");
          conversation.appendChild(a.el);
        }
        scrollBottom();
        break;
      case MSG.PLAN_UPDATED:
        // remove existing plan cards? append
        const pc = window.DGAI_PLANCARD.create(msg.payload.plan);
        conversation.appendChild(pc);
        scrollBottom();
        break;
      case MSG.TOOL_CALL:
        {
          const p = msg.payload;
          let card = toolCards.get(p.id);
          if (!card) {
            card = window.DGAI_TOOLCARD.create({ id: p.id, name: p.name, status: p.status, summary: p.summary, args: p.args });
            toolCards.set(p.id, card);
            conversation.appendChild(card);
          } else {
            card._update(p);
          }
          scrollBottom();
        }
        break;
      case MSG.PERMISSION_REQUEST:
        {
          const p = msg.payload;
          const card = window.DGAI_PERMISSIONCARD.create(p, function (scope) {
            // resolve
            if (scope) {
              browser.runtime.sendMessage({ type: MSG.APPROVE_PERMISSION, runId: msg.runId, payload: { requestId: p.requestId, scope: scope } });
            } else {
              browser.runtime.sendMessage({ type: MSG.DENY_PERMISSION, runId: msg.runId, payload: { requestId: p.requestId } });
            }
            // remove card
            card.remove();
            STORE.set({ pendingPermission: null });
          });
          conversation.appendChild(card);
          STORE.set({ pendingPermission: p });
          scrollBottom();
        }
        break;
      case MSG.RUN_FINISHED:
        STORE.set({ run: { active: false, runId: null, status: "finished" } });
        composer._setStopMode(false);
        currentRunId = null;
        assistantStream = null;
        toolCards = new Map();
        // aria-live announce final? skip
        break;
      case MSG.RUN_ERROR:
        window.DGAI_TOAST.show(msg.payload.message || "Error", "error");
        STORE.set({ run: { active: false, runId: null, status: "error" } });
        composer._setStopMode(false);
        currentRunId = null;
        assistantStream = null;
        break;
      case MSG.CONTEXT_UPDATED:
        {
          const p = msg.payload || {};
          STORE.set({ context: { url: p.url, title: p.title, host: p.host } });
          pageChip.title = p.title || "";
          const titleSpan = pageChip.querySelector(".title");
          if (titleSpan) titleSpan.textContent = (p.title || "").slice(0, 40) || "No page";
          const img = pageChip.querySelector("img");
          if (img && p.url) {
            try { img.src = new URL("/favicon.ico", p.url).href; } catch (e) {}
          }
          updateQuickActions(p.host || "", p.url || "");
          // status pill
          updateStatusPill(p.host || "");
        }
        break;
      case MSG.USAGE_UPDATED:
        {
          const p = msg.payload || {};
          const u = p.usage || {};
          STORE.set({ usage: { tokens: u.total || 0, model: p.model || "", latency: p.latency || 0 } });
          footerModel.textContent = p.model || "mock";
          footerTokens.textContent = (u.total || 0) + " tokens";
          modelChip.textContent = p.model || (STORE.get().settings && STORE.get().settings.model) || "mock";
        }
        break;
      case MSG.SETTINGS_RESULT:
        {
          const s = msg.payload;
          STORE.set({ settings: s });
          if (s) {
            modelChip.textContent = s.model || s.provider || "mock";
            footerModel.textContent = s.model || s.provider || "mock";
            applyThemeTri(s.theme || "system");
          }
        }
        break;
      case MSG.GRANTS_RESULT:
        break;
      case MSG.AUDIT_RESULT:
        break;
      case MSG.CONVERSATION_CLEARED:
        clearConversationUI();
        break;
      case MSG.FOCUS_COMPOSER:
        composer._textarea.focus();
        break;
    }
  });

  async function updateStatusPill(host) {
    if (!host) return;
    // check grant
    let granted = false;
    try {
      const r = await browser.runtime.sendMessage({ type: MSG.GET_SETTINGS, runId: null, payload: {} });
      const s = r && r.payload ? r.payload : r;
      const trusted = (s && s.trustedSites) || [];
      if (trusted.indexOf(host) !== -1) granted = true;
    } catch (e) {}
    // also session/forever unknown here; default readonly
    statusPill.className = "status-pill " + (granted ? "allowed" : "readonly");
    statusPill.firstChild.nextSibling; // dot
    // rebuild text
    // remove children except dot
    // simple: set text node
    const dot = statusPill.querySelector(".dot");
    statusPill.innerHTML = "";
    statusPill.appendChild(dot);
    statusPill.appendChild(document.createTextNode(granted ? ("Interaction allowed on " + host) : ("Read-only on " + host)));
    const link = h("a", { href: "#" }, "Allow…");
    link.addEventListener("click", function (e) { e.preventDefault(); // trigger permission by sending a dummy? just open settings
      openSettings();
    });
    statusPill.appendChild(link);
  }

  function applyThemeTri(t) {
    const resolved = (t === "system") ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : t;
    document.documentElement.dataset.theme = resolved;
  }

  // Theme button cycle
  themeBtn.addEventListener("click", async function () {
    const s = STORE.get().settings;
    const cur = (s && s.theme) || "system";
    const next = cur === "system" ? "light" : (cur === "light" ? "dark" : "system");
    await browser.runtime.sendMessage({ type: MSG.SET_SETTINGS, runId: null, payload: { theme: next } });
    const r = await browser.runtime.sendMessage({ type: MSG.GET_SETTINGS, runId: null, payload: {} });
    const ss = r && r.payload ? r.payload : r;
    STORE.set({ settings: ss });
    applyThemeTri(ss.theme);
  });

  modelChip.addEventListener("click", openSettings);
  settingsBtn.addEventListener("click", openSettings);

  function openSettings() {
    lastFocus = document.activeElement;
    drawer.open();
  }
  drawer.addEventListener && drawer.addEventListener("transitionend", function () {});
  // close on esc
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      openSettings();
      return;
    }
    if (e.key === "Escape" && drawer.classList.contains("open")) {
      drawer.close();
      if (lastFocus) lastFocus.focus();
    }
  });
  // detect close to restore focus: observe class
  const obs = new MutationObserver(function () {
    if (!drawer.classList.contains("open") && lastFocus) {
      // only restore if just closed; harmless
    }
  });
  obs.observe(drawer, { attributes: true, attributeFilter: ["class"] });

  function clearConversationUI() {
    while (conversation.firstChild) {
      if (conversation.firstChild === jumpPill) break;
      conversation.removeChild(conversation.firstChild);
    }
    toolCards = new Map();
    assistantStream = null;
    showEmpty();
  }

  // init settings
  (async function init() {
    const r = await browser.runtime.sendMessage({ type: MSG.GET_SETTINGS, runId: null, payload: {} });
    const s = r && r.payload ? r.payload : r;
    STORE.set({ settings: s });
    if (s) applyThemeTri(s.theme || "system");
    modelChip.textContent = (s && (s.model || s.provider)) || "mock";
    footerModel.textContent = (s && (s.model || s.provider)) || "mock";
    // context from active tab
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) {
        const t = tabs[0];
        browser.runtime.sendMessage({ type: MSG.CONTEXT_UPDATED, runId: null, payload: {} }); // noop? 
      }
    } catch (e) {}
  })();

  // request context updates periodically? rely on background tab activated. Also initial context via GET? We'll fetch active tab
  (async function ctxInit() {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) {
        const t = tabs[0];
        // simulate context updated locally
        const host = new URL(t.url).hostname;
        pageChip.title = t.title || "";
        const ts = pageChip.querySelector(".title");
        if (ts) ts.textContent = (t.title || "").slice(0, 40) || "No page";
        updateQuickActions(host, t.url);
        updateStatusPill(host);
      }
    } catch (e) {}
  })();

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    const s = STORE.get().settings;
    if (s && s.theme === "system") applyThemeTri("system");
  });
})();