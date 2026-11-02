/* sidebar/components/message.js */
(function () {
  "use strict";
  const { h } = window.DGAI_DOM;
  const MD = window.DGAI_MARKDOWN;
  function createUser(text) {
    return h("div", { class: "message user" },
      h("div", { class: "bubble" }, text)
    );
  }
  function createAssistant() {
    const body = h("div", { class: "body" });
    const caret = h("span", { class: "caret" });
    const el = h("div", { class: "message assistant" },
      h("div", { class: "avatar" }),
      body
    );
    body.appendChild(caret);
    return { el: el, body: body, caret: caret };
  }
  function finalizeAssistant(body, caret, text) {
    if (caret && caret.parentNode) caret.parentNode.removeChild(caret);
    body.innerHTML = ""; // sanitize via markdown renderer returns safe html
    const div = h("div", { class: "markdown" });
    div.innerHTML = MD.render(text);
    // copy buttons for code blocks
    div.querySelectorAll("pre").forEach(function (pre) {
      const btn = h("button", { class: "icon-btn", style: { position: "absolute", top: "4px", right: "4px" } }, "Copy");
      // simple
      pre.style.position = "relative";
      btn.addEventListener("click", function () {
        const code = pre.querySelector("code");
        if (code) navigator.clipboard && navigator.clipboard.writeText(code.textContent);
      });
      pre.appendChild(btn);
    });
    body.appendChild(div);
  }
  window.DGAI_MESSAGE = { createUser, createAssistant, finalizeAssistant };
})();