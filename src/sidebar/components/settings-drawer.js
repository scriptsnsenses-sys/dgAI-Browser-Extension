/* sidebar/components/settings-drawer.js */
(function () {
  "use strict";
  const { h } = window.DGAI_DOM;
  const MSG = (window.DGAI_CONSTANTS && window.DGAI_CONSTANTS.MSG) || {};

  async function send(type, payload) {
    return browser.runtime.sendMessage({ type: type, runId: null, payload: payload || null });
  }

  function createSettingsDrawer() {
    const back = h("button", { class: "icon-btn", "aria-label": "Back" }, "←");
    const title = h("h2", { style: { fontSize: "15px", margin: "0" } }, "Settings");
    const header = h("div", { class: "header" }, back, title);
    const body = h("div", { class: "body" });

    // Provider section
    const providerSelect = h("select", {});
    ["mock", "openai", "anthropic", "ollama", "nvidia", "custom"].forEach(function (p) { providerSelect.appendChild(h("option", { value: p }, p)); });
    const apiKey = h("input", { type: "password", placeholder: "API key" });
    const baseUrl = h("input", { type: "text", placeholder: "Base URL (optional)" });
    const model = h("input", { type: "text", placeholder: "Model" });
    const endpointType = h("select", {});
    ["chat_completions", "messages", "responses"].forEach(function (p) { endpointType.appendChild(h("option", { value: p }, p)); });
    const customHeaders = h("textarea", { placeholder: '{"X-Custom-Header":"value"} or Key: Value lines' });
    const providerSection = h("div", { class: "section" },
      h("h3", {}, "Provider"),
      field("Provider", providerSelect),
      field("API key", apiKey),
      field("Base URL", baseUrl),
      field("Model", model),
      field("Endpoint type", endpointType),
      field("Custom headers", customHeaders),
      field("Temperature", temp)
    );

    // Appearance
    const themeSeg = h("div", { style: { display: "flex", gap: "4px" } });
    ["system", "light", "dark"].forEach(function (t) {
      const b = h("button", { class: "btn" }, t);
      b.addEventListener("click", function () { applyTheme(t); save({ theme: t }); });
      themeSeg.appendChild(b);
    });
    const appearanceSection = h("div", { class: "section" }, h("h3", {}, "Appearance"), field("Theme", themeSeg));

    // Trusted sites
    const trustedList = h("div", {});
    const revokeAll = h("button", { class: "btn danger" }, "Revoke all");
    revokeAll.addEventListener("click", async function () {
      if (!confirm("Revoke all grants?")) return;
      await send(MSG.REVOKE_ALL_GRANTS, {});
      await loadGrants();
    });
    const trustedSection = h("div", { class: "section" }, h("h3", {}, "Interaction permissions"), trustedList, revokeAll);

    // Safety
    const sensitiveToggle = h("input", { type: "checkbox" });
    const safetySection = h("div", { class: "section" }, h("h3", {}, "Safety"), field("Always confirm sensitive actions", sensitiveToggle));

    // Profile
    const nameI = h("input", { type: "text" });
    const emailI = h("input", { type: "email" });
    const phoneI = h("input", { type: "tel" });
    const addrI = h("textarea", {});
    const profileSection = h("div", { class: "section" }, h("h3", {}, "Profile"),
      field("Name", nameI), field("Email", emailI), field("Phone", phoneI), field("Address", addrI));

    // Activity log
    const auditList = h("div", {});
    const copyAudit = h("button", { class: "btn" }, "Copy JSON");
    copyAudit.addEventListener("click", async function () {
      const r = await send(MSG.GET_AUDIT, {});
      const entries = (r && r.payload && r.payload.entries) || [];
      navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(entries, null, 2));
    });
    const auditSection = h("div", { class: "section" }, h("h3", {}, "Activity log"), auditList, copyAudit);

    // About
    const aboutSection = h("div", { class: "section" }, h("h3", {}, "About"), h("div", {}, "dgAI v0.1.0 — local-first by default."));

    body.appendChild(providerSection);
    body.appendChild(appearanceSection);
    body.appendChild(trustedSection);
    body.appendChild(safetySection);
    body.appendChild(profileSection);
    body.appendChild(auditSection);
    body.appendChild(aboutSection);

    const drawer = h("div", { class: "settings-drawer" }, header, body);

    async function load() {
      const r = await send(MSG.GET_SETTINGS, {});
      const s = r && r.payload ? r.payload : r;
      if (s) {
        providerSelect.value = s.provider || "mock";
        apiKey.value = s.apiKey || "";
        baseUrl.value = s.baseUrl || "";
        model.value = s.model || "";
        endpointType.value = s.endpointType || "chat_completions";
        customHeaders.value = s.customHeaders || "";
        temp.value = s.temperature != null ? s.temperature : 0.3;
        sensitiveToggle.checked = s.alwaysConfirmSensitive !== false;
        const p = s.profile || {};
        nameI.value = p.name || "";
        emailI.value = p.email || "";
        phoneI.value = p.phone || "";
        addrI.value = p.address || "";
        applyTheme(s.theme || "system");
      }
      await loadGrants();
      await loadAudit();
    }

    async function save(patch) {
      await send(MSG.SET_SETTINGS, patch);
    }

    function applyTheme(t) {
      document.documentElement.dataset.theme = resolveTheme(t);
      // store tri-state separately? settings stores theme tri-state; but dataset should be resolved. We'll keep tri-state in settings.theme and resolve.
    }

    function resolveTheme(t) {
      if (t === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return t;
    }

    async function loadGrants() {
      const r = await send(MSG.GET_GRANTS, {});
      const grants = (r && r.payload && r.payload.grants) || (r && r.grants) || [];
      while (trustedList.firstChild) trustedList.removeChild(trustedList.firstChild);
      grants.forEach(function (g) {
        const row = h("div", { class: "grant-row" },
          h("span", { class: "domain" }, g.host + " (" + g.scope + ")"),
          h("button", { class: "btn danger" }, "Revoke")
        );
        row.querySelector("button").addEventListener("click", async function () {
          await send(MSG.REVOKE_GRANT, { host: g.host });
          await loadGrants();
        });
        trustedList.appendChild(row);
      });
      if (!grants.length) trustedList.appendChild(h("div", { style: { fontSize: "11px", color: "var(--text-faint)" } }, "No grants."));
    }

    async function loadAudit() {
      const r = await send(MSG.GET_AUDIT, {});
      const entries = (r && r.payload && r.payload.entries) || (r && r.entries) || [];
      while (auditList.firstChild) auditList.removeChild(auditList.firstChild);
      entries.slice(-50).reverse().forEach(function (e) {
        const row = h("div", { class: "audit-entry" },
          h("span", { class: "ts" }, new Date(e.ts).toLocaleTimeString()),
          h("span", { class: "tool" }, e.tool),
          h("span", {}, e.domain),
          h("span", {}, e.outcome)
        );
        auditList.appendChild(row);
      });
    }

    // save on change
    providerSelect.addEventListener("change", function () { save({ provider: providerSelect.value }); });
    apiKey.addEventListener("change", function () { save({ apiKey: apiKey.value }); });
    baseUrl.addEventListener("change", function () { save({ baseUrl: baseUrl.value }); });
    model.addEventListener("change", function () { save({ model: model.value }); });
    endpointType.addEventListener("change", function () { save({ endpointType: endpointType.value }); });
    customHeaders.addEventListener("change", function () { save({ customHeaders: customHeaders.value }); });
    temp.addEventListener("change", function () { save({ temperature: parseFloat(temp.value) }); });
    sensitiveToggle.addEventListener("change", function () { save({ alwaysConfirmSensitive: sensitiveToggle.checked }); });
    nameI.addEventListener("change", function () { save({ profile: { name: nameI.value } }); });
    emailI.addEventListener("change", function () { save({ profile: { email: emailI.value } }); });
    phoneI.addEventListener("change", function () { save({ profile: { phone: phoneI.value } }); });
    addrI.addEventListener("change", function () { save({ profile: { address: addrI.value } }); });

    // theme system listener
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      // re-resolve if system
      send(MSG.GET_SETTINGS, {}).then(function (r) {
        const s = r && r.payload ? r.payload : r;
        if (s && s.theme === "system") applyTheme("system");
      });
    });

    drawer.open = function () { drawer.classList.add("open"); load(); };
    drawer.close = function () { drawer.classList.remove("open"); };
    back.addEventListener("click", function () { drawer.close(); });

    // expose
    drawer._load = load;
    return drawer;
  }

  function field(label, control) {
    return window.DGAI_DOM.h("div", { class: "field" }, window.DGAI_DOM.h("label", {}, label), control);
  }

  window.DGAI_SETTINGS_DRAWER = { create: createSettingsDrawer };
})();