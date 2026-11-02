/* sidebar/lib/markdown.js — tiny safe subset renderer. */
(function () {
  "use strict";
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function renderInline(s) {
    s = escapeHtml(s);
    // inline code
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    // bold
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // italic
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    // links
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_m, text, url) {
      if (!/^https?:/i.test(url)) return text;
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
    });
    return s;
  }

  function render(md) {
    md = String(md || "");
    const lines = md.split("\n");
    let html = "";
    let i = 0;
    let inCode = false;
    let codeBuf = [];
    let listType = null;
    function closeList() { if (listType) { html += "</" + listType + ">"; listType = null; } }
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim().startsWith("```")) {
        if (inCode) {
          html += '<pre><code>' + escapeHtml(codeBuf.join("\n")) + '</code></pre>';
          codeBuf = []; inCode = false;
        } else {
          closeList();
          inCode = true;
        }
        i++; continue;
      }
      if (inCode) { codeBuf.push(line); i++; continue; }
      const t = line.trim();
      if (t === "") { closeList(); i++; continue; }
      // headings
      const hm = t.match(/^(#{1,3})\s+(.*)$/);
      if (hm) { closeList(); const lvl = hm[1].length; html += "<h" + (lvl + 2) + ">" + renderInline(hm[2]) + "</h" + (lvl + 2) + ">"; i++; continue; }
      // blockquote
      if (t.startsWith(">")) { closeList(); html += "<blockquote>" + renderInline(t.slice(1).trim()) + "</blockquote>"; i++; continue; }
      // table
      if (t.includes("|") && i + 1 < lines.length && /^\|?\s*[-:| ]+\|?$/.test(lines[i+1].trim())) {
        closeList();
        const parseRow = (r) => r.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(s => s.trim());
        const header = parseRow(t);
        i += 2;
        html += "<table><thead><tr>" + header.map(c => "<th>" + renderInline(c) + "</th>").join("") + "</tr></thead><tbody>";
        while (i < lines.length && lines[i].trim().includes("|")) {
          const row = parseRow(lines[i]);
          html += "<tr>" + row.map(c => "<td>" + renderInline(c) + "</td>").join("") + "</tr>";
          i++;
        }
        html += "</tbody></table>";
        continue;
      }
      // list
      const ulm = t.match(/^[-*]\s+(.*)$/);
      const olm = t.match(/^\d+\.\s+(.*)$/);
      if (ulm || olm) {
        const type = ulm ? "ul" : "ol";
        if (listType !== type) { closeList(); html += "<" + type + ">"; listType = type; }
        html += "<li>" + renderInline((ulm || olm)[1]) + "</li>";
        i++; continue;
      }
      closeList();
      html += "<p>" + renderInline(t) + "</p>";
      i++;
    }
    closeList();
    if (inCode) html += '<pre><code>' + escapeHtml(codeBuf.join("\n")) + '</code></pre>';
    return html;
  }
  window.DGAI_MARKDOWN = { render, escapeHtml };
})();