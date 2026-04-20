(function () {
  "use strict";

  const HOVER = "__wd_hover__";
  const PICKED = "__wd_picked__";

  const style = document.createElement("style");
  style.textContent = `
    .${HOVER} { outline: 2px solid #ef4444 !important; outline-offset: 1px; cursor: crosshair !important; background: rgba(239,68,68,0.06) !important; }
    .${PICKED} { outline: 3px solid #10b981 !important; outline-offset: 2px; }
    html, body { cursor: crosshair !important; }
    a, button { pointer-events: none !important; }
    #__wd_bar__ {
      position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%);
      z-index: 2147483647; cursor: default !important;
      background: #0a0a0a; color: #fff; font: 13px/1.4 -apple-system, system-ui, sans-serif;
      padding: 10px 14px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.4);
      display: flex; align-items: center; gap: 10px; max-width: calc(100vw - 32px);
    }
    #__wd_bar__ * { cursor: default !important; pointer-events: auto !important; }
    #__wd_bar__ .__wd_text { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.85; font-family: ui-monospace, monospace; font-size: 12px; }
    #__wd_bar__ button {
      background: rgba(255,255,255,0.1); color: #fff; border: 0; border-radius: 6px;
      padding: 6px 10px; font-size: 12px; font-weight: 500; cursor: pointer !important;
    }
    #__wd_bar__ button:hover { background: rgba(255,255,255,0.2); }
    #__wd_bar__ button:disabled { opacity: 0.4; cursor: not-allowed !important; }
    #__wd_bar__ .__wd_use { background: #10b981; }
    #__wd_bar__ .__wd_use:hover { background: #059669; }
  `;
  document.documentElement.appendChild(style);

  function makeButton(cls, label, title) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    if (title) b.title = title;
    b.disabled = true;
    return b;
  }

  const bar = document.createElement("div");
  bar.id = "__wd_bar__";
  const labelEl = document.createElement("span");
  labelEl.className = "__wd_label";
  labelEl.textContent = "Klikni na element ↓";
  const textEl = document.createElement("span");
  textEl.className = "__wd_text";
  const upBtn = makeButton("__wd_up", "↑ Rodič", "Vyber nadřazený element");
  const downBtn = makeButton("__wd_down", "↓ Dítě", "Vyber dceřiný element");
  const useBtn = makeButton("__wd_use", "✓ Použít");
  bar.appendChild(labelEl);
  bar.appendChild(textEl);
  bar.appendChild(upBtn);
  bar.appendChild(downBtn);
  bar.appendChild(useBtn);
  document.body.appendChild(bar);

  let hovered = null;
  let picked = null;
  let lastChild = null;

  function isBar(el) {
    return el && (el.id === "__wd_bar__" || (el.closest && el.closest("#__wd_bar__")));
  }

  function setHover(el, on) {
    if (!el || !el.classList) return;
    if (on) el.classList.add(HOVER);
    else el.classList.remove(HOVER);
  }

  function setPicked(el) {
    if (picked) picked.classList.remove(PICKED);
    picked = el;
    if (el) {
      el.classList.add(PICKED);
      el.classList.remove(HOVER);
    }
    updateBar();
  }

  function updateBar() {
    if (!picked) {
      labelEl.textContent = "Klikni na element ↓";
      textEl.textContent = "";
      upBtn.disabled = true;
      downBtn.disabled = true;
      useBtn.disabled = true;
      return;
    }
    const sel = uniqueSelector(picked);
    const text = (picked.textContent || "").replace(/\s+/g, " ").trim();
    labelEl.textContent = "✓ Vybráno";
    textEl.textContent = text.slice(0, 80) + (text.length > 80 ? "…" : "");
    textEl.title = sel + "\n" + text.slice(0, 300);
    upBtn.disabled = !canGoUp(picked);
    downBtn.disabled = !lastChild || !picked.contains(lastChild) || picked === lastChild;
    useBtn.disabled = false;
  }

  function canGoUp(el) {
    const p = el.parentElement;
    return !!(p && p !== document.documentElement && p !== document.body);
  }

  document.addEventListener("mouseover", function (e) {
    const t = e.target;
    if (!(t instanceof Element) || isBar(t)) return;
    if (t === picked) return;
    if (hovered && hovered !== t) setHover(hovered, false);
    setHover(t, true);
    hovered = t;
  }, true);

  document.addEventListener("mouseout", function (e) {
    const t = e.target;
    if (t instanceof Element && t !== picked && !isBar(t)) setHover(t, false);
  }, true);

  document.addEventListener("click", function (e) {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (isBar(t)) return;
    e.preventDefault();
    e.stopPropagation();
    setPicked(t);
    lastChild = t;
  }, true);

  upBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (picked && canGoUp(picked)) {
      lastChild = picked;
      setPicked(picked.parentElement);
    }
  });

  downBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (picked && lastChild && picked.contains(lastChild) && picked !== lastChild) {
      let cur = lastChild;
      while (cur.parentElement && cur.parentElement !== picked) cur = cur.parentElement;
      setPicked(cur);
    }
  });

  useBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (!picked) return;
    const selector = uniqueSelector(picked);
    const text = (picked.textContent || "").replace(/\s+/g, " ").trim().slice(0, 200);
    try {
      window.parent.postMessage({ type: "wd:pick", selector: selector, text: text }, "*");
    } catch (_) {}
  });

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
            return c && c !== HOVER && c !== PICKED && /^[A-Za-z_][\w-]*$/.test(c);
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

  try { window.parent.postMessage({ type: "wd:ready" }, "*"); } catch (_) {}
})();
