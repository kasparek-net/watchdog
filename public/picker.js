(function () {
  "use strict";

  // Highlight + click-to-pick selector inside iframe.
  // Sends { type:'pick', selector, text } to parent via postMessage.

  const HIGHLIGHT_CLASS = "__wd_hover__";
  const PICKED_CLASS = "__wd_picked__";

  const style = document.createElement("style");
  style.textContent =
    "." + HIGHLIGHT_CLASS + "{outline:2px solid #ef4444 !important;outline-offset:1px;cursor:crosshair !important;background:rgba(239,68,68,0.08) !important}" +
    "." + PICKED_CLASS + "{outline:2px solid #10b981 !important;outline-offset:1px}" +
    "html,body{cursor:crosshair !important}" +
    "a{pointer-events:none !important}";
  document.documentElement.appendChild(style);

  let last = null;
  let picked = null;

  function clear(el) {
    if (el && el.classList) el.classList.remove(HIGHLIGHT_CLASS);
  }

  document.addEventListener(
    "mouseover",
    function (e) {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t === picked) return;
      if (last && last !== t) clear(last);
      t.classList.add(HIGHLIGHT_CLASS);
      last = t;
    },
    true
  );

  document.addEventListener(
    "mouseout",
    function (e) {
      const t = e.target;
      if (t instanceof Element && t !== picked) clear(t);
    },
    true
  );

  document.addEventListener(
    "click",
    function (e) {
      e.preventDefault();
      e.stopPropagation();
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (picked) picked.classList.remove(PICKED_CLASS);
      clear(t);
      t.classList.add(PICKED_CLASS);
      picked = t;
      const selector = uniqueSelector(t);
      const text = (t.textContent || "").replace(/\s+/g, " ").trim().slice(0, 200);
      try {
        window.parent.postMessage(
          { type: "wd:pick", selector: selector, text: text },
          "*"
        );
      } catch (_) {}
    },
    true
  );

  function uniqueSelector(el) {
    if (!(el instanceof Element)) return "";
    if (el.id && /^[A-Za-z][\w-]*$/.test(el.id)) {
      const sel = "#" + el.id;
      if (document.querySelectorAll(sel).length === 1) return sel;
    }
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      let part = node.tagName.toLowerCase();
      if (node.id && /^[A-Za-z][\w-]*$/.test(node.id)) {
        part += "#" + node.id;
        parts.unshift(part);
        const s = parts.join(" > ");
        if (document.querySelectorAll(s).length === 1) return s;
        node = node.parentElement;
        continue;
      }
      const cls = (node.className && typeof node.className === "string")
        ? node.className.trim().split(/\s+/).filter(function (c) {
            return c && c !== HIGHLIGHT_CLASS && c !== PICKED_CLASS && /^[A-Za-z_][\w-]*$/.test(c);
          })
        : [];
      if (cls.length) part += "." + cls.slice(0, 2).join(".");
      const parent = node.parentElement;
      if (parent) {
        const same = Array.prototype.filter.call(parent.children, function (c) {
          return c.tagName === node.tagName;
        });
        if (same.length > 1) {
          const idx = same.indexOf(node) + 1;
          part += ":nth-of-type(" + idx + ")";
        }
      }
      parts.unshift(part);
      const s = parts.join(" > ");
      try {
        if (document.querySelectorAll(s).length === 1) return s;
      } catch (_) {}
      node = node.parentElement;
    }
    return parts.join(" > ");
  }

  try {
    window.parent.postMessage({ type: "wd:ready" }, "*");
  } catch (_) {}
})();
