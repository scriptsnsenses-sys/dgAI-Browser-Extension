/* content/adapters/calendar.js — Calendar selectors (hints only). */
(function () {
  "use strict";
  window.DGAI_ADAPTERS = window.DGAI_ADAPTERS || {};
  window.DGAI_ADAPTERS.calendar = {
    name: "calendar",
    eventTitle: "[role='dialog'] input[aria-label*='title'], input[aria-label*='Title']",
    time: "[role='dialog'] input[aria-label*='time'], input[aria-label*='Time']",
    attendees: "[role='dialog'] div[aria-label*='guest'], div[aria-label*='Guest']",
    description: "[role='dialog'] div[aria-label*='description'], textarea[aria-label*='description']"
  };
})();