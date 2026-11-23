/* SPDX-License-Identifier: MIT
   switcher.js: the w0ts project switcher, the same on every page of every w0ts site.
   A caret after the title in the title bar (header.site .titlebar > h1) opens "Switch project": a search field and the
   w0ts projects (https://w0ts.github.io/projects.json: name, url, tagline, accent), the current one ticked, the w0ts home
   at the end. Keyboard: Enter or Space opens, typing filters, Up/Down move, Enter opens the project, Escape closes.
   A page adds one line:  <script src="https://w0ts.github.io/site-style/switcher.js" defer></script>
   (data-projects="URL" on that tag reads another list, for tests). With no network the caret still opens and says so. */
(function () {
  "use strict";
  var script = document.currentScript;
  var LIST = (script && script.getAttribute("data-projects")) || "https://w0ts.github.io/projects.json";
  var HOME = "https://w0ts.github.io/";

  var CSS = [
    ".w0ts-sw { position: relative; display: inline-block; vertical-align: middle; margin-left: 6px; }",
    ".w0ts-sw > button { font: inherit; font-size: 0.6em; line-height: 1; color: inherit; background: transparent; border: 0;",
    "  border-radius: 6px; padding: 4px 6px; min-height: 0; cursor: pointer; display: inline-flex; align-items: center; }",
    ".w0ts-sw > button:hover, .w0ts-sw > button[aria-expanded=\"true\"] { background: color-mix(in srgb, currentColor 14%, transparent); }",
    ".w0ts-sw > button:focus-visible { outline: 2px solid currentColor; outline-offset: 1px; }",
    ".w0ts-sw > button svg { display: block; }",
    ".w0ts-sw-pop { position: absolute; z-index: 50; top: calc(100% + 10px); left: -8px; width: min(360px, calc(100vw - 32px));",
    "  background: var(--panel, #fff); color: var(--ink, #1d1d1b); border: 1px solid var(--line, #dddbd3); border-radius: var(--r, 8px);",
    "  box-shadow: 0 8px 28px rgba(0,0,0,.18); padding: 8px; font: 14px/1.35 var(--font-ui, system-ui, sans-serif); text-align: left;",
    "  -webkit-user-select: none; user-select: none; }",
    ".w0ts-sw-pop[hidden] { display: none; }",
    ".w0ts-sw-pop h2 { font-size: 14px; font-weight: 600; margin: 2px 4px 8px; color: var(--ink, #1d1d1b); }",
    ".w0ts-sw-pop input { font: inherit; width: 100%; box-sizing: border-box; min-height: 34px; padding: 6px 10px; margin: 0 0 6px;",
    "  color: var(--ink, #1d1d1b); background: var(--bg, #f6f5f1); border: 1px solid var(--line, #dddbd3); border-radius: 6px; }",
    ".w0ts-sw-pop input:focus { outline: 2px solid var(--accent-text, #247570); outline-offset: 0; }",
    ".w0ts-sw-pop ul { list-style: none; margin: 0; padding: 0; max-height: min(60vh, 420px); overflow-y: auto; }",
    ".w0ts-sw-pop li { margin: 0; border-top: 1px solid var(--line, #dddbd3); }",
    ".w0ts-sw-pop li:first-child { border-top: 0; }",
    ".w0ts-sw-pop a { display: grid; grid-template-columns: 16px 12px 1fr; gap: 0 8px; align-items: center; padding: 7px 6px;",
    "  border-radius: 6px; color: inherit; text-decoration: none; }",
    ".w0ts-sw-pop a:hover, .w0ts-sw-pop a.on { background: var(--hover, rgba(0,0,0,.06)); }",
    ".w0ts-sw-pop .sw-tick { grid-row: 1 / span 2; font-size: 13px; color: var(--ink, #1d1d1b); text-align: center; }",
    ".w0ts-sw-pop .sw-dot { grid-row: 1 / span 2; width: 12px; height: 12px; border-radius: 3px; }",
    ".w0ts-sw-pop .sw-name { font-weight: 600; }",
    ".w0ts-sw-pop .sw-tag { grid-column: 3; font-size: 12px; color: var(--dim, #6b6a64); }",
    ".w0ts-sw-pop .sw-home { border-top: 1px solid var(--line, #dddbd3); margin-top: 6px; padding-top: 4px; }",
    ".w0ts-sw-pop .sw-home a { grid-template-columns: 1fr; color: var(--dim, #6b6a64); font-size: 13px; }",
    ".w0ts-sw-pop .sw-none { padding: 8px 6px; color: var(--dim, #6b6a64); }"
  ].join("\n");

  var CARET = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4.4 6.2a.75.75 0 0 1 1.06 0L8 8.74l2.54-2.54a.75.75 0 1 1 1.06 1.06L8.53 10.33a.75.75 0 0 1-1.06 0L4.4 7.26a.75.75 0 0 1 0-1.06z"/></svg>';

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text) { e.textContent = text; }
    return e;
  }

  function current(projects) {
    /* the project whose site path starts this page's path (by path, so a copy of the site served elsewhere still works) */
    var here = location.pathname.toLowerCase();
    var best = null;
    projects.forEach(function (p) {
      var path = new URL(p.url, location.href).pathname.toLowerCase();
      if (path !== "/" && here.indexOf(path) === 0 && (!best || path.length > best.path)) { best = { p: p, path: path.length }; }
    });
    return best && best.p;
  }

  /* the caret goes right after the title's last word, both in a no-wrap span, so a wrapping title never leaves the caret
     alone on a line; a title ending in an element (an icon) gets the caret after it */
  function attach(h1, wrap) {
    var last = h1.lastChild;
    while (last && last.nodeType === 3 && !last.nodeValue.trim()) { last = last.previousSibling; }
    if (last && last.nodeType === 3) {
      var text = last.nodeValue.replace(/\s+$/, "");
      var cut = text.search(/\S+$/);
      var tail = el("span", { "style": "white-space: nowrap" });
      tail.appendChild(document.createTextNode(text.slice(cut)));
      tail.appendChild(wrap);
      last.nodeValue = text.slice(0, cut);
      h1.insertBefore(tail, last.nextSibling);
    } else {
      h1.appendChild(wrap);
    }
  }

  function init() {
    var h1 = document.querySelector("header.site .titlebar > h1");
    if (!h1 || h1.querySelector(".w0ts-sw")) { return; }
    var style = el("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var wrap = el("span", { "class": "w0ts-sw" });
    var btn = el("button", { "type": "button", "aria-haspopup": "dialog", "aria-expanded": "false", "aria-label": "Switch project", "title": "Switch project" });
    btn.innerHTML = CARET;
    var pop = el("div", { "class": "w0ts-sw-pop", "role": "dialog", "aria-label": "Switch project", "hidden": "" });
    var input = el("input", { "type": "search", "placeholder": "Search projects", "aria-label": "Search projects", "autocomplete": "off", "spellcheck": "false" });
    var list = el("ul", { "role": "listbox", "aria-label": "Projects" });
    var home = el("div", { "class": "sw-home" });
    var homeLink = el("a", { "href": HOME }, "All w0ts projects");
    home.appendChild(homeLink);
    pop.appendChild(el("h2", {}, "Switch project"));
    pop.appendChild(input);
    pop.appendChild(list);
    pop.appendChild(home);
    wrap.appendChild(btn);
    wrap.appendChild(pop);
    attach(h1, wrap);

    var projects = null, failed = false, active = -1;

    function links() { return Array.prototype.slice.call(list.querySelectorAll("a")); }

    function mark(i) {
      var a = links();
      a.forEach(function (x, j) { x.classList.toggle("on", j === i); });
      active = i;
      if (a[i]) { a[i].scrollIntoView({ block: "nearest" }); }
    }

    function render() {
      list.textContent = "";
      if (!projects) {
        list.appendChild(el("li", { "class": "sw-none" }, failed ? "The project list could not be loaded." : "Loading…"));
        return;
      }
      var q = input.value.trim().toLowerCase();
      var cur = current(projects);
      var shown = projects.filter(function (p) { return !q || (p.name + " " + p.tagline).toLowerCase().indexOf(q) >= 0; });
      if (!shown.length) { list.appendChild(el("li", { "class": "sw-none" }, "No project matches.")); }
      shown.forEach(function (p) {
        var li = el("li", { "role": "option", "aria-selected": String(p === cur) });
        var a = el("a", { "href": p.url });
        if (p === cur) { a.setAttribute("aria-current", "page"); }
        a.appendChild(el("span", { "class": "sw-tick", "aria-hidden": "true" }, p === cur ? "✓" : ""));
        var dot = el("span", { "class": "sw-dot", "aria-hidden": "true" });
        dot.style.background = p.accent;
        a.appendChild(dot);
        a.appendChild(el("span", { "class": "sw-name" }, p.name));
        a.appendChild(el("span", { "class": "sw-tag" }, p.tagline));
        li.appendChild(a);
        list.appendChild(li);
      });
      mark(q && shown.length ? 0 : -1);
    }

    function load() {
      if (projects || failed) { return; }
      fetch(LIST, { cache: "no-cache" }).then(function (r) {
        if (!r.ok) { throw new Error(r.status); }
        return r.json();
      }).then(function (data) {
        projects = (Array.isArray(data) ? data : []).filter(function (p) { return p && p.name && p.url; });
        render();
      }).catch(function () { failed = true; render(); });
    }

    function place() {
      /* below the caret, shifted left as needed so the panel stays inside the window (8 px margin) */
      pop.style.left = "-8px";
      var r = pop.getBoundingClientRect();
      var over = r.right - (document.documentElement.clientWidth - 8);
      if (over > 0) { pop.style.left = (-8 - Math.min(over, r.left - 8)) + "px"; }
    }

    function open() {
      pop.hidden = false;
      place();
      btn.setAttribute("aria-expanded", "true");
      input.value = "";
      render();
      load();
      input.focus();
    }

    function close(back) {
      pop.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      if (back) { btn.focus(); }
    }

    btn.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); if (pop.hidden) { open(); } else { close(true); } });
    pop.addEventListener("click", function (e) { e.stopPropagation(); });
    input.addEventListener("input", render);
    pop.addEventListener("keydown", function (e) {
      var a = links();
      if (e.key === "Escape") { e.preventDefault(); close(true); }
      else if (e.key === "ArrowDown") { e.preventDefault(); mark(Math.min(a.length - 1, active + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); mark(Math.max(0, active - 1)); }
      else if (e.key === "Enter" && document.activeElement === input && a[Math.max(0, active)]) { e.preventDefault(); location.href = a[Math.max(0, active)].href; }
    });
    document.addEventListener("click", function () { if (!pop.hidden) { close(false); } });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !pop.hidden) { close(true); } });
    btn.addEventListener("mouseenter", load);    /* (fetch early: the list is there when it opens) */
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); } else { init(); }
}());
