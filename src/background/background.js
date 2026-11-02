/* background/background.js — entry, lifecycle. */
(function (root) {
  "use strict";
  const C = root.DGAI_CONSTANTS;
  const MSG = C.MSG;

  browser.runtime.onMessage.addListener(function (msg, sender) {
    return Promise.resolve(root.DGAI_ROUTER.handle(msg, sender));
  });

  browser.browserAction.onClicked.addListener(function () {
    try { browser.sidebarAction.open(); } catch (e) {}
  });

  browser.runtime.onInstalled.addListener(function () {
    try {
      browser.menus.create({ id: "open-dgai", title: "Open dgAI sidebar", contexts: ["all"] });
    } catch (e) {}
  });

  browser.menus.onClicked.addListener(function (info) {
    if (info.menuItemId === "open-dgai") {
      try { browser.sidebarAction.open(); } catch (e) {}
    }
  });

  browser.commands.onCommand.addListener(function (cmd) {
    if (cmd === "focus_composer") {
      browser.runtime.sendMessage({ type: MSG.FOCUS_COMPOSER, runId: null, payload: {} });
    }
  });

  // tab context updates
  browser.tabs.onActivated.addListener(async function (info) {
    try {
      const tab = await browser.tabs.get(info.tabId);
      browser.runtime.sendMessage({ type: MSG.CONTEXT_UPDATED, runId: null, payload: { url: tab.url, title: tab.title, host: new URL(tab.url).hostname } });
    } catch (e) {}
  });
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));