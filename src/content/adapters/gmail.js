/* content/adapters/gmail.js — Gmail selectors (hints only). */
(function () {
  "use strict";
  window.DGAI_ADAPTERS = window.DGAI_ADAPTERS || {};
  window.DGAI_ADAPTERS.gmail = {
    name: "gmail",
    threadContainer: "div[role='main'] div.adn",
    messageBody: "div.a3s.aiL",
    composeBody: "div[aria-label='Message Body']",
    sendButton: "div[role='button'][aria-label*='Send']",
    subject: "input[name='subjectbox']"
  };
})();