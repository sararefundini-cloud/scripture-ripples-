/* Scripture Ripples: the commonplace-book layer.
   A reader's commonplace book kept beside the pond: every link found between two stones
   is written into it, milestones are pressed as wax seals named for a verse, and the
   pond answers every touch (splash, ripple, light along a link, a frog with advice).
   It watches the app's own DOM and reads DATA; it never changes the graph data.
   Everything is saved only on this device (localStorage).
   To switch it off, remove the fun.css <link> and this <script> from app.html. */
(function commonplaceLayer() {
  "use strict";
  if (window.__srFx) return;
  window.__srFx = true;

  const doc = document;
  const reduced = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const KEY = "scripture-ripples.fun.v1";
  const SVGNS = "http://www.w3.org/2000/svg";

  // ---------- helpers ----------
  function el(tag, attrs, kids) {
    const node = doc.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") node.className = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(c => { if (c !== null && c !== undefined && c !== "") node.append(c); });
    return node;
  }
  function svgEl(tag, attrs) {
    const node = doc.createElementNS(SVGNS, tag);
    for (const k in attrs || {}) node.setAttribute(k, attrs[k]);
    return node;
  }
  const $ = id => doc.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const dayStr = d => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  const motionOK = () => !reduced.matches && typeof Element.prototype.animate === "function";
  function hash(text) { let h = 2166136261; for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---------- app data ----------
  const nodes = (typeof DATA !== "undefined" && DATA && DATA.nodes) || [];
  const edges = (typeof DATA !== "undefined" && DATA && DATA.edges) || [];
  const labelOf = n => String(n.label || n.id).split("\n")[0];
  const labelById = new Map(), idByLabel = new Map(), layerById = new Map();
  nodes.forEach(n => {
    const label = labelOf(n);
    labelById.set(n.id, label);
    layerById.set(n.id, n.layer);
    if (!idByLabel.has(label)) idByLabel.set(label, n.id);
  });
  const pairKey = (a, b) => [a, b].sort().join(" ↔ ");
  const allPairs = new Map();
  edges.forEach(e => {
    if (!e || !e.from || !e.to || e.from === e.to) return;
    const key = pairKey(labelById.get(e.from) || e.from, labelById.get(e.to) || e.to);
    if (!allPairs.has(key)) allPairs.set(key, { a: e.from, b: e.to });
  });
  const TOTAL_PAIRS = allPairs.size || 1;
  const TOTAL_STONES = nodes.length || 1;
  const KIND = { "word-match": "shared words", openbible: "OpenBible cross-reference", typological: "typology", structure: "structure" };
  function pairKinds(a, b) {
    const kinds = new Set();
    edges.forEach(e => { if ((e.from === a && e.to === b) || (e.from === b && e.to === a)) kinds.add(KIND[e.kind] || e.kind); });
    return [...kinds];
  }
  function versesOf(id) {
    const groups = (DATA && DATA.verses && DATA.verses[id] && DATA.verses[id].subgroups) || [];
    return groups.flatMap(g => g.verses || []);
  }
  const sharedCache = new Map();
  function sharedOf(a, b) {
    if (!DATA || !DATA.verses) return null;
    const key = pairKey(a, b);
    if (sharedCache.has(key)) return sharedCache.get(key);
    const other = new Set(versesOf(b).map(v => v.verse_id));
    const shared = versesOf(a).filter(v => other.has(v.verse_id));
    const out = { count: shared.length, first: shared[0] ? (shared[0].ref || shared[0].verse_id) : "" };
    sharedCache.set(key, out);
    return out;
  }
  function dailyNode() {
    return nodes.length ? nodes[hash(dayStr(new Date())) % nodes.length] : null;
  }

  // ---------- seals ----------
  const G = {
    stones: '<ellipse cx="12" cy="17.5" rx="7" ry="3"/><ellipse cx="11" cy="12" rx="5" ry="2.5"/><ellipse cx="12.5" cy="7.3" rx="3.2" ry="2"/>',
    waves: '<path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
    lines: '<path d="M5 7h14"/><path d="M5 12h10"/><path d="M5 17h14"/>',
    cord: '<path d="M3 7c4 0 5 10 9 10s5-10 9-10"/><path d="M3 17c4 0 5-10 9-10s5 10 9 10"/><path d="M3 12h18"/>',
    banks: '<path d="M4 4c-1 5 1 11 0 16"/><path d="M20 4c1 5-1 11 0 16"/><path d="M4 12c4-5 12-5 16 0"/>',
    seek: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="M14.6 14.6 20 20"/>',
    bread: '<path d="M5 12c0-3 3-5 7-5s7 2 7 5v1H5z"/><path d="M9 8.6v3.6M12 7.6v4.6M15 8.6v3.6"/><path d="M3 18c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/>',
    frog: '<circle cx="8" cy="8.5" r="2.6"/><circle cx="16" cy="8.5" r="2.6"/><path d="M4 13c1 4 4 6 8 6s7-2 8-6"/><path d="M8.5 15.2c2 1.1 5 1.1 7 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    basket: '<path d="M4 10h16l-2 9H6z"/><path d="M8 10c0-3 2-5 4-5s4 2 4 5"/><path d="M5 14.5h14M10 10l.5 9M14 10l-.5 9"/>',
    wall: '<rect x="3" y="14" width="8" height="5" rx="2"/><rect x="13" y="14" width="8" height="5" rx="2"/><rect x="8" y="8" width="8" height="5" rx="2"/>',
    net: '<path d="M3 8h18l-3 10H6z"/><path d="M9 8 8 18M15 8l1 10M4.5 13h15"/>',
    dawn: '<path d="M3 17h18"/><path d="M7 17a5 5 0 0 1 10 0"/><path d="M12 7v2.5M6 10.5l1.5 1.5M18 10.5 16.5 12"/>',
    horn: '<path d="M3 16c6 1 11-2 14-8"/><path d="M3 19c7 1 13-2 16-9"/><path d="M3 16v3"/><path d="M17 8l3-2.5M19 10l3-1"/>',
    book: '<path d="M3 5c3-1 6-1 9 1v13c-3-2-6-2-9-1z"/><path d="M21 5c-3-1-6-1-9 1v13c3-2 6-2 9-1z"/>'
  };
  const SEALS = [
    { id: "first-splash", name: "What Mean These Stones?", quote: "What mean ye by these stones?", ref: "Joshua 4:6", how: "Drop your first stone into the pond.", glyph: G.stones },
    { id: "first-ripple", name: "Deep Calleth unto Deep", quote: "Deep calleth unto deep at the noise of thy waterspouts", ref: "Psalm 42:7", how: "Find your first link between two stones.", glyph: G.waves },
    { id: "line", name: "Line upon Line", quote: "Line upon line, line upon line; here a little, and there a little", ref: "Isaiah 28:10", how: "Open the evidence for a link.", glyph: G.lines },
    { id: "chain-3", name: "A Threefold Cord", quote: "A threefold cord is not quickly broken.", ref: "Ecclesiastes 4:12", how: "Record three different links.", glyph: G.cord },
    { id: "bridge", name: "On This Side and On That", quote: "By the river upon the bank thereof, on this side and on that side", ref: "Ezekiel 47:12", how: "Link a stone from each bank.", glyph: G.banks },
    { id: "seek", name: "Seek, and Ye Shall Find", quote: "Seek, and ye shall find; knock, and it shall be opened unto you", ref: "Matthew 7:7", how: "Search the banks for a stone.", glyph: G.seek },
    { id: "skipper", name: "Cast Thy Bread", quote: "Cast thy bread upon the waters: for thou shalt find it after many days.", ref: "Ecclesiastes 11:1", how: "Skip a stone across the water.", glyph: G.bread },
    { id: "frog", name: "The Frogs Came Up", quote: "The frogs came up, and covered the land of Egypt.", ref: "Exodus 8:6", how: "Tap the frog on the lily pad.", glyph: G.frog },
    { id: "daily", name: "This Is the Day", quote: "This is the day which the LORD hath made", ref: "Psalm 118:24", how: "Drop the stone of the day into the pond.", glyph: G.sun },
    { id: "chain-12", name: "Twelve Baskets", quote: "They took up of the fragments that remained twelve baskets full.", ref: "Matthew 14:20", how: "Record twelve different links.", glyph: G.basket },
    { id: "collector", name: "Lively Stones", quote: "Ye also, as lively stones, are built up a spiritual house", ref: "1 Peter 2:5", how: "Handle twenty different stones.", glyph: G.wall },
    { id: "deep", name: "Launch Out into the Deep", quote: "Launch out into the deep, and let down your nets for a draught.", ref: "Luke 5:4", how: "Open the full pond graph.", glyph: G.net },
    { id: "faithful", name: "The Third Day", quote: "In the third day he will raise us up", ref: "Hosea 6:2", how: "Come back on three different days.", glyph: G.dawn },
    { id: "jubilee", name: "Jubilee", quote: "And ye shall hallow the fiftieth year", ref: "Leviticus 25:10", how: "Record fifty different links.", glyph: G.horn }
  ];
  const sealById = new Map(SEALS.map(s => [s.id, s]));

  (function waxDefs() {
    const holder = svgEl("svg", { width: "0", height: "0", "aria-hidden": "true", focusable: "false" });
    holder.style.position = "absolute";
    holder.innerHTML = '<defs><radialGradient id="fx-wax" cx="36%" cy="30%" r="78%">' +
      '<stop offset="0" stop-color="#cf5b3d"/><stop offset=".5" stop-color="#9b2f1e"/><stop offset="1" stop-color="#651c0f"/></radialGradient></defs>';
    doc.body.append(holder);
  })();
  function blobPath(seed) {
    const r = seeded(hash(seed)), pts = [], n = 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rad = 27 * (1 + (r() - 0.5) * 0.12 + (r() < 0.18 ? 0.08 : 0));
      pts.push([32 + Math.cos(a) * rad, 32 + Math.sin(a) * rad]);
    }
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    let d = "M" + mid(pts[n - 1], pts[0]).map(v => v.toFixed(1)).join(" ");
    for (let i = 0; i < n; i++) {
      const m = mid(pts[i], pts[(i + 1) % n]);
      d += " Q" + pts[i].map(v => v.toFixed(1)).join(" ") + " " + m.map(v => v.toFixed(1)).join(" ");
    }
    return d + "Z";
  }
  function sealSVG(seal, sealed) {
    const s = svgEl("svg", { viewBox: "0 0 64 64", class: "fx-seal" + (sealed ? "" : " fx-unsealed"), "aria-hidden": "true", focusable: "false" });
    if (sealed) {
      s.append(svgEl("path", { d: blobPath(seal.id), fill: "url(#fx-wax)" }));
      s.append(svgEl("circle", { cx: "32", cy: "32", r: "19.5", class: "fx-seal-ring" }));
      const shade = svgEl("g", { class: "fx-seal-glyph", transform: "translate(20.7 20.7)", style: "stroke:#5a180c;opacity:.7" });
      shade.innerHTML = seal.glyph;
      s.append(shade);
    } else {
      s.append(svgEl("circle", { cx: "32", cy: "32", r: "26", class: "fx-seal-ring" }));
    }
    const g = svgEl("g", { class: "fx-seal-glyph", transform: "translate(20 20)" });
    g.innerHTML = seal.glyph;
    s.append(g);
    return s;
  }
  function glyphSVG(markup, size) {
    const s = svgEl("svg", { viewBox: "0 0 24 24", width: String(size || 20), height: String(size || 20), fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" });
    s.innerHTML = markup;
    return s;
  }

  // ---------- saved progress ----------
  const fresh = () => ({ v: 2, stones: [], pairs: [], entries: {}, badges: [], days: 0, streak: 0, lastDay: "", sound: true, frog: 0, skips: 0 });
  let state = fresh();
  try { state = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* storage blocked */ }
  (function migrate() {
    ["stones", "pairs", "badges"].forEach(k => { if (!Array.isArray(state[k])) state[k] = []; });
    if (state.badges.includes("chain-5")) state.badges.push("chain-3");
    if (state.badges.includes("chain-15")) state.badges.push("chain-12");
    state.badges = [...new Set(state.badges)].filter(id => sealById.has(id));
    if (!state.entries || typeof state.entries !== "object") state.entries = {};
    state.pairs.forEach(k => { if (!state.entries[k] && allPairs.has(k)) state.entries[k] = { a: allPairs.get(k).a, b: allPairs.get(k).b, t: 0 }; });
    state.v = 2;
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  const returning = state.days > 0;
  (function countVisit() {
    const today = dayStr(new Date());
    if (state.lastDay !== today) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      state.streak = state.lastDay === dayStr(y) ? state.streak + 1 : 1;
      state.days += 1;
      state.lastDay = today;
    }
    save();
  })();

  // ---------- sound: synthesised, no files ----------
  let ctx = null, master = null;
  function audio() {
    if (!state.sound) return null;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.28; master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  function tone(type, f0, f1, dur, vol, delay) {
    const c = audio(); if (!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, freq, delay, type) {
    const c = audio(); if (!c) return;
    const t = c.currentTime + (delay || 0);
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = type || "bandpass"; f.frequency.value = freq; f.Q.value = 0.9; g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master); src.start(t);
  }
  function unlockAudio() {
    doc.removeEventListener("pointerdown", unlockAudio, true);
    doc.removeEventListener("keydown", unlockAudio, true);
    audio();
  }
  doc.addEventListener("pointerdown", unlockAudio, true);
  doc.addEventListener("keydown", unlockAudio, true);
  const sfx = {
    plop() { tone("sine", 560, 130, 0.17, 0.55); tone("sine", 980, 520, 0.08, 0.12, 0.05); noise(0.2, 0.35, 1700, 0.02); },
    plip() { tone("sine", 1250, 620, 0.07, 0.16); noise(0.05, 0.08, 3000); },
    chime() { tone("triangle", 659, 0, 0.55, 0.2); tone("triangle", 988, 0, 0.75, 0.18, 0.1); },
    stamp() { tone("sine", 120, 62, 0.22, 0.6, 0.16); noise(0.12, 0.45, 380, 0.16, "lowpass"); },
    croak() { [0, 0.2].forEach(d => { tone("sawtooth", 150, 92, 0.13, 0.11, d); tone("square", 75, 62, 0.13, 0.05, d); }); },
    hop(i) { tone("sine", 760 - i * 90, 320, 0.07, 0.22); noise(0.06, 0.12, 2600); },
    tick() { tone("sine", 880, 0, 0.06, 0.08); }
  };

  // ---------- slips: short notices pinned at the top ----------
  const slipHost = el("div", { id: "fx-slips", role: "status", "aria-live": "polite" });
  doc.body.append(slipHost);
  function slip(opts) {
    const s = el("button", { type: "button", class: "fx-slip" }, [
      opts.seals ? el("span", { class: "fx-seal-stack" }, opts.seals.slice(0, 3).map(seal => sealSVG(seal, true)))
        : el("span", { class: "fx-slip-mark", "aria-hidden": "true", text: opts.mark || "¶" }),
      el("span", null, [
        el("span", { class: "fx-slip-kicker", text: opts.kicker }),
        el("span", { class: "fx-slip-title", text: opts.title }),
        opts.meta ? el("span", { class: "fx-slip-meta", text: opts.meta }) : null
      ])
    ]);
    s.addEventListener("click", () => openBook());
    slipHost.append(s);
    while (slipHost.children.length > 3) slipHost.firstElementChild.remove();
    setTimeout(() => { s.classList.add("fx-out"); setTimeout(() => s.remove(), 320); }, opts.seals ? 5600 : 3400);
  }

  // ---------- milestones ----------
  const has = id => state.badges.includes(id);
  // Seals earned in one gesture (say, the first skip) are pressed together on one slip.
  let pendingSeals = [], sealTimer = 0;
  function award(id) {
    if (has(id) || !sealById.has(id)) return;
    state.badges.push(id);
    save();
    pendingSeals.push(sealById.get(id));
    clearTimeout(sealTimer);
    sealTimer = setTimeout(flushSeals, 700);
    refresh();
  }
  function flushSeals() {
    const list = pendingSeals;
    pendingSeals = [];
    if (!list.length) return;
    if (list.length === 1) {
      const s = list[0];
      slip({ seals: list, kicker: "Sealed", title: s.name, meta: "“" + s.quote + "” " + s.ref });
    } else {
      slip({ seals: list, kicker: list.length + " seals pressed", title: list.map(s => s.name).join(" · "), meta: "Their verses are in your commonplace book." });
    }
    sfx.stamp();
    const ribbon = doc.querySelector(".fx-ribbon");
    if (ribbon && motionOK()) { ribbon.classList.remove("fx-tug"); void ribbon.offsetWidth; ribbon.classList.add("fx-tug"); }
  }
  function noteStone(id) {
    if (!id || state.stones.includes(id)) return;
    state.stones.push(id);
    save();
    if (state.stones.length >= 20) award("collector");
    refresh();
  }
  function notePair(key, a, b) {
    const isNew = !state.pairs.includes(key);
    if (isNew) { state.pairs.push(key); state.entries[key] = { a, b, t: Date.now() }; save(); }
    award("first-ripple");
    if ((layerById.get(a) === "iam") !== (layerById.get(b) === "iam")) award("bridge");
    if (state.pairs.length >= 3) award("chain-3");
    if (state.pairs.length >= 12) award("chain-12");
    if (state.pairs.length >= 50) award("jubilee");
    refresh();
    return isNew;
  }

  const refreshers = [];
  function refresh() { refreshers.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } }); }
  function tallyList() {
    const dl = el("dl", { class: "fx-tally" });
    const row = (label, value, of) => el("div", null, [el("dt", { text: label }), el("dd", null, [String(value), of ? el("small", { text: " / " + of }) : null])]);
    const fill = () => dl.replaceChildren(
      row("Links recorded", state.pairs.length, TOTAL_PAIRS),
      row("Stones handled", state.stones.length, TOTAL_STONES),
      row("Seals", state.badges.length, SEALS.length),
      row(state.streak === 1 ? "Day running" : "Days running", state.streak)
    );
    fill();
    return { dl, fill };
  }

  // ---------- the mini-pond ----------
  const water = $("start-water");
  const linksEl = $("start-pond-links");
  const statusEl = $("start-pond-status");
  const resetBtn = $("start-reset");
  function rockButtons() { return doc.querySelectorAll("#start-pond .start-rock"); }
  function buttonFor(id) {
    const label = labelById.get(id);
    for (const b of rockButtons()) { const n = b.querySelector(".start-rock-name"); if (n && n.textContent === label) return b; }
    return null;
  }
  function idOfButton(b) { const n = b && b.querySelector(".start-rock-name"); return n ? idByLabel.get(n.textContent) : null; }
  function inWaterIds() {
    const ids = new Set();
    if (water) water.querySelectorAll(".start-rock[data-in-water='true']").forEach(b => { const id = idOfButton(b); if (id) ids.add(id); });
    return ids;
  }
  function centerIn(container, node) {
    const c = container.getBoundingClientRect(), r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2 - c.left, y: r.top + r.height / 2 - c.top };
  }
  function ringsAt(container, x, y, o) {
    if (!motionOK()) return;
    o = o || {};
    for (let i = 0; i < (o.count || 3); i++) {
      const ring = el("span", { class: "fx-fx fx-ring" + (o.small ? " fx-ring-small" : ""), "aria-hidden": "true" });
      ring.style.left = x + "px"; ring.style.top = y + "px";
      container.append(ring);
      ring.animate([
        { transform: "scale(.2)", opacity: 0 },
        { transform: "scale(.3)", opacity: 0.95, offset: 0.06 },
        { transform: "scale(" + (o.scale || 1.6) + ")", opacity: 0 }
      ], { duration: o.duration || 1000, delay: (o.delay || 0) + i * (o.gap || 150), easing: "cubic-bezier(.15,.6,.35,1)", fill: "both" }).onfinish = () => ring.remove();
    }
  }
  function dropletsAt(container, x, y) {
    if (!motionOK()) return;
    for (let i = 0; i < 9; i++) {
      const d = el("span", { class: "fx-fx fx-drop", "aria-hidden": "true" });
      d.style.left = x + "px"; d.style.top = y + "px";
      container.append(d);
      const a = rand(-Math.PI * 0.92, -Math.PI * 0.08), v = rand(22, 52), dx = Math.cos(a) * v, up = Math.sin(a) * v;
      d.animate([
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${dx * 0.65}px,${up}px) scale(1)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px,${up * 0.2 + 14}px) scale(.5)`, opacity: 0 }
      ], { duration: rand(560, 820), easing: "cubic-bezier(.2,.6,.4,1)" }).onfinish = () => d.remove();
    }
  }
  function lightBetween(container, from, to, duration, delay) {
    if (!motionOK()) return;
    const s = el("span", { class: "fx-fx fx-light", "aria-hidden": "true" });
    s.style.left = "0px"; s.style.top = "0px";
    container.append(s);
    const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2 - Math.min(36, Math.hypot(to.x - from.x, to.y - from.y) * 0.16);
    s.animate([
      { transform: `translate(${from.x}px,${from.y}px) scale(.5)`, opacity: 0 },
      { transform: `translate(${from.x}px,${from.y}px) scale(1)`, opacity: 1, offset: 0.08 },
      { transform: `translate(${mx}px,${my}px) scale(1.2)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${to.x}px,${to.y}px) scale(.9)`, opacity: 1, offset: 0.92 },
      { transform: `translate(${to.x}px,${to.y}px) scale(1.5)`, opacity: 0 }
    ], { duration: duration || 900, delay: delay || 0, easing: "ease-in-out", fill: "both" }).onfinish = () => s.remove();
  }
  function glow(button) {
    if (!button) return;
    button.classList.add("fx-glow");
    setTimeout(() => button.classList.remove("fx-glow"), 1400);
  }
  // The pond measures stones to draw lines; on a slowed device it can measure one mid-flight
  // and skip the line. Re-running the pond's own filter redraws them and changes nothing else.
  function redrawLines() { const s = $("start-search"); if (s) s.dispatchEvent(new Event("input")); }
  function afterDrop(node, fn) {
    const flights = typeof node.getAnimations === "function"
      ? node.getAnimations().filter(a => !(window.CSSAnimation && a instanceof CSSAnimation)).map(a => a.finished.catch(() => {}))
      : [];
    let done = false;
    const run = () => { if (!done) { done = true; fn(); } };
    Promise.all(flights).then(() => setTimeout(run, 30));
    setTimeout(run, 1500);
  }

  function setSky() {
    if (!water) return;
    const h = new Date().getHours();
    const phase = h >= 5 && h < 8 ? "fx-dawn" : h >= 17 && h < 20 ? "fx-dusk" : (h >= 20 || h < 5) ? "fx-night" : "";
    water.classList.remove("fx-dawn", "fx-dusk", "fx-night");
    if (phase) water.classList.add(phase);
  }

  function initMiniPond() {
    if (!water) return;
    water.append(
      el("div", { class: "fx-shimmer", "aria-hidden": "true" }),
      el("div", { class: "fx-sky", "aria-hidden": "true" }, [el("span", { class: "fx-moon" })]),
      el("div", { class: "fx-fish", "aria-hidden": "true" }),
      el("div", { class: "fx-fish fx-fish-shade", "aria-hidden": "true" })
    );
    setSky();
    setInterval(setSky, 10 * 60 * 1000);
    const setH = () => water.style.setProperty("--fx-h", water.clientHeight + "px");
    setH();
    if (typeof ResizeObserver === "function") new ResizeObserver(setH).observe(water);

    const daily = dailyNode();
    const dailyBtn = daily && buttonFor(daily.id);
    if (dailyBtn) {
      dailyBtn.classList.add("fx-today");
      dailyBtn.setAttribute("aria-label", (dailyBtn.getAttribute("aria-label") || labelById.get(daily.id)) + " (today’s stone)");
    }

    // A stone lands.
    new MutationObserver(records => records.forEach(r => r.addedNodes.forEach(node => {
      if (!(node instanceof HTMLElement) || !node.classList.contains("start-rock")) return;
      const id = idOfButton(node);
      noteStone(id);
      award("first-splash");
      if (daily && id === daily.id) award("daily");
      setTimeout(() => {
        if (node.parentElement !== water) return;
        const p = centerIn(water, node);
        ringsAt(water, p.x, p.y + 18);
        dropletsAt(water, p.x, p.y + 10);
      }, motionOK() ? 330 : 0);
      afterDrop(node, () => { if (node.parentElement === water) redrawLines(); });
      sfx.plop();
    }))).observe(water, { childList: true });

    // A link surfaces between stones.
    let known = new Set();
    if (linksEl) new MutationObserver(() => {
      const now = new Set([...linksEl.querySelectorAll("button")].map(b => b.textContent));
      const added = [...now].filter(t => !known.has(t));
      known = now;
      if (!added.length) return;
      const sealsBefore = state.badges.length;
      let lastNew = null;
      added.forEach((text, i) => {
        const parts = text.split(" ↔ ");
        if (parts.length !== 2) return;
        const a = idByLabel.get(parts[0]), b = idByLabel.get(parts[1]);
        if (notePair(pairKey(parts[0], parts[1]), a, b)) lastNew = { a, b };
        setTimeout(() => {
          const ba = buttonFor(a), bb = buttonFor(b);
          if (!ba || !bb || ba.parentElement !== water || bb.parentElement !== water) return;
          lightBetween(water, centerIn(water, ba), centerIn(water, bb), 900);
          glow(ba); glow(bb);
        }, 450 + i * 180);
      });
      setTimeout(sfx.chime, 420);
      if (statusEl) { statusEl.classList.remove("fx-found"); void statusEl.offsetWidth; statusEl.classList.add("fx-found"); }
      if (lastNew && state.badges.length === sealsBefore) {
        const kinds = pairKinds(lastNew.a, lastNew.b);
        slip({ kicker: "Recorded", title: labelById.get(lastNew.a) + " — " + labelById.get(lastNew.b),
          meta: (kinds.length ? kinds.join(", ") + " · " : "") + state.pairs.length + " of " + TOTAL_PAIRS + " links in your book" });
      }
    }).observe(linksEl, { childList: true });
    if (statusEl) new MutationObserver(() => {
      if (!statusEl.textContent.startsWith("A documented connection")) statusEl.classList.remove("fx-found");
    }).observe(statusEl, { childList: true, characterData: true, subtree: true });

    // Reading the evidence for a link.
    const pond = $("start-pond");
    if (pond) pond.addEventListener("click", e => {
      if (e.target.closest && e.target.closest("#start-pond-links button, .start-line-hit")) award("line");
    });

    // Searching the banks.
    const search = $("start-search");
    let seekTimer = 0;
    if (search) search.addEventListener("input", e => {
      if (!e.isTrusted) return;
      clearTimeout(seekTimer);
      seekTimer = setTimeout(() => {
        const q = search.value.trim().toLowerCase();
        if (q.length < 2) return;
        if ([...rockButtons()].some(b => !b.hidden && b.dataset.inWater !== "true" && b.textContent.toLowerCase().includes(q))) award("seek");
      }, 700);
    });

    // Touching the water: the frog, or a ripple where you touched.
    water.addEventListener("click", e => {
      const patch = e.target.closest && e.target.closest(".pond-patch");
      if (patch && patch.querySelector(".pond-frog")) { e.stopPropagation(); frogTalk(patch); return; }
      if (e.target !== water && !e.target.classList.contains("fx-shimmer") && !e.target.classList.contains("fx-sky")) return;
      const c = water.getBoundingClientRect();
      ringsAt(water, e.clientX - c.left, e.clientY - c.top, { count: 2, small: true, scale: 1.5, duration: 900, gap: 160 });
      sfx.plip();
    });
  }

  // ---------- the frog ----------
  let note = null;
  function closeNote() { if (note) { note.remove(); note = null; } }
  doc.addEventListener("click", e => { if (note && !note.contains(e.target) && !(e.target.closest && e.target.closest(".pond-patch"))) closeNote(); });
  const FROG_VERSES = [
    ["And Aaron stretched out his hand over the waters of Egypt; and the frogs came up, and covered the land of Egypt.", "Exodus 8:6"],
    ["Their land brought forth frogs in abundance, in the chambers of their kings.", "Psalm 105:30"]
  ];
  function hintPair() {
    const inWater = inWaterIds();
    const list = [...allPairs.entries()].filter(([k]) => !state.pairs.includes(k));
    const extend = list.filter(([, p]) => inWater.has(p.a) !== inWater.has(p.b));
    return pick(extend.length ? extend : list.length ? list : [...allPairs.entries()]);
  }
  function frogTalk(patch) {
    const frog = patch.querySelector(".pond-frog");
    if (frog && motionOK()) { frog.classList.remove("fx-hop"); void frog.offsetWidth; frog.classList.add("fx-hop"); }
    sfx.croak();
    state.frog += 1; save();
    award("frog");
    closeNote();
    note = el("div", { class: "fx-frog-note", role: "status" }, [el("span", { class: "fx-frog-who", text: "The frog says" })]);
    if (state.frog % 4 === 0) {
      const [text, ref] = pick(FROG_VERSES);
      note.append("A verse about my family.", el("em", { text: "“" + text + "”" }), el("cite", { text: ref + " (KJV)" }));
      const more = el("button", { type: "button", class: "fx-link", text: "A hint, please" });
      more.addEventListener("click", ev => { ev.stopPropagation(); frogTalk(patch); });
      note.append(el("div", { class: "fx-actions" }, [more]));
    } else {
      const entry = hintPair();
      if (!entry) return;
      const pair = entry[1];
      note.append("Try ", el("strong", { text: labelById.get(pair.a) }), " with ", el("strong", { text: labelById.get(pair.b) }), ".");
      const tryIt = el("button", { type: "button", class: "fx-btn", text: "Try it" });
      tryIt.addEventListener("click", ev => { ev.stopPropagation(); closeNote(); dropSequence([pair.a, pair.b]); });
      const another = el("button", { type: "button", class: "fx-link", text: "Another" });
      another.addEventListener("click", ev => { ev.stopPropagation(); frogTalk(patch); });
      note.append(el("div", { class: "fx-actions" }, [tryIt, another]));
    }
    const p = centerIn(water, patch);
    note.style.left = Math.max(8, p.x + 30) + "px";
    note.style.top = Math.max(8, p.y - 14) + "px";
    water.append(note);
    const wr = water.getBoundingClientRect(), nr = note.getBoundingClientRect();
    if (nr.right > wr.right - 8) note.style.left = Math.max(8, wr.width - nr.width - 8) + "px";
    if (nr.bottom > wr.bottom - 8) note.style.top = Math.max(8, wr.height - nr.height - 8) + "px";
  }

  // ---------- dropping stones for the reader ----------
  let busy = false, skipping = false;
  function dropSequence(ids) {
    if (busy) return;
    busy = true;
    const inWater = inWaterIds();
    const todo = ids.filter(id => !inWater.has(id));
    let i = 0;
    (function next() {
      if (i >= todo.length) { setTimeout(() => { busy = false; }, 200); return; }
      const b = buttonFor(todo[i++]);
      if (b && b.dataset.inWater !== "true") b.click();
      setTimeout(next, 650);
    })();
  }
  function skipStone(btn) {
    if (busy || skipping || !water) return;
    skipping = true;
    if (btn) btn.disabled = true;
    let inWater = inWaterIds();
    if (inWater.size >= 7 && resetBtn && !resetBtn.disabled) { resetBtn.click(); inWater = new Set(); }
    const entries = [...allPairs.entries()].filter(([, p]) => labelById.has(p.a) && labelById.has(p.b));
    const notBoth = entries.filter(([, p]) => !(inWater.has(p.a) && inWater.has(p.b)));
    const extend = notBoth.filter(([k, p]) => inWater.has(p.a) !== inWater.has(p.b) && !state.pairs.includes(k));
    const unseen = notBoth.filter(([k]) => !state.pairs.includes(k));
    const choice = pick(extend.length ? extend : unseen.length ? unseen : notBoth.length ? notBoth : entries);
    state.skips += 1; save();
    const finish = () => {
      skipping = false;
      if (choice) { award("skipper"); dropSequence([choice[1].a, choice[1].b]); }
      setTimeout(() => { if (btn) btn.disabled = false; }, 1500);
    };
    if (!motionOK()) { finish(); return; }
    const w = water.clientWidth, h = water.clientHeight, y = h * rand(0.45, 0.7), xs = [w * 0.22, w * 0.47, w * 0.7];
    const s = el("span", { class: "fx-fx fx-skipper", "aria-hidden": "true" });
    s.style.left = "0px"; s.style.top = "0px";
    water.append(s);
    const kf = [{ transform: `translate(-24px,${y - 60}px) rotate(0deg)`, offset: 0 }];
    let prev = -24;
    xs.forEach((x, i) => {
      const t = (i + 1) / (xs.length + 1);
      kf.push({ transform: `translate(${(prev + x) / 2}px,${y - 34 + i * 8}px) rotate(${(i + 1) * 240}deg)`, offset: t - 0.1 });
      kf.push({ transform: `translate(${x}px,${y}px) rotate(${(i + 1) * 360}deg)`, offset: t });
      prev = x;
    });
    kf.push({ transform: `translate(${w * 0.86}px,${y + 4}px) rotate(1500deg) scale(.6)`, opacity: 0, offset: 1 });
    const total = 1100;
    s.animate(kf, { duration: total, easing: "linear", fill: "both" }).onfinish = () => s.remove();
    xs.forEach((x, i) => setTimeout(() => { ringsAt(water, x, y + 4, { count: 2, small: true, scale: 1.2, duration: 700, gap: 110 }); sfx.hop(i); }, total * ((i + 1) / (xs.length + 1))));
    setTimeout(finish, total - 80);
  }
  function scrollToPond() {
    const target = doc.querySelector(".fx-pond-bar") || water;
    if (target) target.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
  }
  function setPairInPond(a, b) {
    if (book && book.open) book.close();
    if (inWaterIds().size && resetBtn && !resetBtn.disabled) resetBtn.click();
    scrollToPond();
    setTimeout(() => dropSequence([a, b]), reduced.matches ? 50 : 650);
  }

  // ---------- the home page ----------
  function initHome() {
    const title = $("start-pond-title");
    if (title && !title.parentElement.classList.contains("fx-title-row")) {
      const mark = svgEl("svg", { viewBox: "0 0 58 40", class: "fx-mark", "aria-hidden": "true", focusable: "false" });
      [[28, 13], [21, 9.5], [14, 6.2]].forEach(([rx, ry]) => mark.append(svgEl("ellipse", { cx: "29", cy: "24", rx: String(rx), ry: String(ry), class: "fx-ring", pathLength: "120" })));
      mark.append(svgEl("ellipse", { cx: "29", cy: "21.5", rx: "6.5", ry: "4.2", fill: "currentColor" }));
      const row = el("div", { class: "fx-title-row" });
      title.before(row);
      row.append(mark, title);
    }

    // Today's leaf: the stone of the day, one of its verses, and your tallies.
    const header = doc.querySelector(".start-pond-header");
    const daily = dailyNode();
    if (header && daily) {
      const date = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
      const verse = el("blockquote", { class: "fx-leaf-verse", hidden: "" });
      const dropIt = el("button", { type: "button", class: "fx-btn fx-btn-ink", text: "Drop today’s stone in" });
      dropIt.addEventListener("click", () => { scrollToPond(); setTimeout(() => dropSequence([daily.id]), reduced.matches ? 50 : 650); });
      const goDown = el("button", { type: "button", class: "fx-link", text: "Go down to the pond" });
      goDown.addEventListener("click", scrollToPond);
      const noteText = returning
        ? "Welcome back. " + (state.pairs.length
          ? "Your book holds " + state.pairs.length + (state.pairs.length === 1 ? " link" : " links") + "; " + (TOTAL_PAIRS - state.pairs.length) + " more wait in the water."
          : "No links in your book yet. Two stones are enough to begin.")
        : "Drop two stones into the water below. When Scripture links them, a line surfaces between them and the link is written into your commonplace book, under the red ribbon.";
      const tally = tallyList();
      refreshers.push(tally.fill);
      header.after(el("section", { class: "fx-leaf", "aria-label": "Today’s stone" }, [
        el("div", null, [
          el("p", { class: "fx-leaf-kicker", text: date + " · today’s stone" }),
          el("h2", { class: "fx-leaf-title", text: labelById.get(daily.id) }),
          el("p", { class: "fx-leaf-note", text: noteText }),
          verse,
          el("div", { class: "fx-actions" }, [dropIt, goDown])
        ]),
        tally.dl
      ]));
      const fillVerse = () => {
        const list = versesOf(daily.id).filter(v => v.text && v.text.length >= 30 && v.text.length <= 200);
        if (!list.length) return;
        const v = list[hash(dayStr(new Date()) + "·verse") % list.length];
        verse.replaceChildren("“" + v.text.trim() + "”", el("cite", { text: v.ref || v.verse_id }));
        verse.hidden = false;
      };
      if (typeof motifVersesReady !== "undefined" && motifVersesReady && typeof motifVersesReady.then === "function") motifVersesReady.then(fillVerse).catch(() => {});
      else fillVerse();
    }

    // The banner: a quiet link down to the pond beside "Start Exploring".
    const banner = doc.querySelector(".sr-main-product"), ready = $("start-ready-explore");
    if (banner && ready && !banner.querySelector(".fx-actions")) {
      const tryPond = el("button", { type: "button", class: "fx-link", text: "or try the small pond first" });
      tryPond.addEventListener("click", scrollToPond);
      const wrap = el("div", { class: "fx-actions" });
      ready.before(wrap);
      wrap.append(ready, tryPond);
    }

    // Above the pond: search, skip a stone, and how much of the pond you've charted.
    const search = doc.querySelector("#start-pond label.start-search");
    if (search && !doc.querySelector(".fx-pond-bar")) {
      const skip = el("button", { type: "button", class: "fx-btn", title: "Skip a stone across the water and drop in a linked pair", text: "Skip a stone" });
      skip.addEventListener("click", () => skipStone(skip));
      const label = el("span", { class: "fx-meter-label" });
      const fill = el("span", { class: "fx-meter-fill" });
      const meter = el("button", { type: "button", class: "fx-meter", "aria-haspopup": "dialog" }, [label, el("span", { class: "fx-meter-track", "aria-hidden": "true" }, [fill])]);
      meter.addEventListener("click", openBook);
      refreshers.push(() => {
        const n = state.pairs.length;
        label.replaceChildren(el("b", { text: String(n) }), " of " + TOTAL_PAIRS + " links recorded");
        fill.style.width = Math.min(100, n ? Math.max(3, (n / TOTAL_PAIRS) * 100) : 0) + "%";
        meter.setAttribute("aria-label", n + " of " + TOTAL_PAIRS + " links recorded. Open your commonplace book.");
      });
      const left = el("div", { class: "fx-pond-bar-left" });
      const bar = el("div", { class: "fx-pond-bar" }, [left, meter]);
      search.before(bar);
      left.append(search, skip);
    }

    // The ribbon bookmark.
    const inner = doc.querySelector("#start-pond .start-pond-inner");
    if (inner) {
      const count = el("span", { class: "fx-ribbon-count" });
      const ribbon = el("button", { type: "button", class: "fx-ribbon", "aria-haspopup": "dialog" }, [glyphSVG(G.book, 20), count]);
      ribbon.addEventListener("click", openBook);
      refreshers.push(() => {
        count.textContent = state.badges.length + "/" + SEALS.length;
        ribbon.setAttribute("aria-label", "Open your commonplace book: " + state.pairs.length + " links, " + state.badges.length + " of " + SEALS.length + " seals");
        ribbon.title = "Your commonplace book";
      });
      inner.prepend(ribbon);
    }
  }

  // ---------- the commonplace book ----------
  let book = null;
  function openBook() {
    if (!book) return;
    renderBook();
    if (typeof book.showModal === "function") { if (!book.open) book.showModal(); } else book.setAttribute("open", "");
  }
  function renderBook() {
    book.replaceChildren();
    const close = el("button", { type: "button", class: "fx-book-close", "aria-label": "Close the book", text: "×" });
    close.addEventListener("click", () => book.close());

    const seals = el("ul", { class: "fx-seals" });
    SEALS.forEach(s => {
      const got = has(s.id);
      seals.append(el("li", { class: got ? "" : "fx-locked" }, [
        sealSVG(s, got),
        el("strong", { text: s.name }),
        got ? el("q", { text: s.quote }) : el("small", { text: s.how }),
        got ? el("cite", { text: s.ref }) : null
      ]));
    });

    const ledger = el("ol", { class: "fx-ledger" });
    const keys = [...state.pairs].reverse();
    keys.slice(0, 60).forEach(k => {
      const entry = state.entries[k] || allPairs.get(k);
      if (!entry) return;
      const a = entry.a, b = entry.b;
      const kinds = pairKinds(a, b);
      const shared = sharedOf(a, b);
      const bits = [];
      if (kinds.length) bits.push(kinds.join(", "));
      if (shared && shared.count) bits.push(shared.count + (shared.count === 1 ? " shared verse" : " shared verses") + ", first " + shared.first);
      if (entry.t) bits.push(new Date(entry.t).toLocaleDateString(undefined, { day: "numeric", month: "short" }));
      const again = el("button", { type: "button", class: "fx-link", text: "Set in the pond" });
      again.addEventListener("click", () => setPairInPond(a, b));
      ledger.append(el("li", null, [
        el("span", { class: "fx-pair" }, [labelById.get(a) || a, el("i", { text: "&" }), labelById.get(b) || b]),
        again,
        el("span", { class: "fx-entry-meta", text: bits.join(" · ") })
      ]));
    });

    const sound = el("input", { type: "checkbox" });
    sound.checked = !!state.sound;
    sound.addEventListener("change", () => { state.sound = sound.checked; save(); if (state.sound) sfx.tick(); });
    const clear = el("button", { type: "button", class: "fx-link", text: "Clear the book" });
    clear.addEventListener("click", () => {
      if (!window.confirm("Clear your commonplace book? Its links, seals and tallies will be removed from this device.")) return;
      state = Object.assign(fresh(), { sound: state.sound, days: 1, streak: 1, lastDay: dayStr(new Date()) });
      save();
      refresh();
    });

    const tally = tallyList();
    book.append(
      el("div", { class: "fx-book-head" }, [
        el("div", null, [el("h2", { id: "fx-book-title", text: "Commonplace Book" }), el("p", { text: "Links you have found in the pond, and the seals you have earned. Kept only on this device." })]),
        close
      ]),
      el("div", { class: "fx-book-body" }, [
        tally.dl,
        el("h3", { text: "Seals" }), seals,
        el("h3", { text: "Links recorded" }),
        keys.length ? ledger : el("p", { class: "fx-ledger-empty", text: "Nothing written yet. Drop two stones that belong together and the link will be entered here, with the verses they share." }),
        keys.length > 60 ? el("p", { class: "fx-ledger-empty", text: "Showing the 60 most recent of " + keys.length + " links." }) : null,
        el("div", { class: "fx-book-foot" }, [el("label", null, [sound, "Pond sounds"]), clear])
      ])
    );
  }
  function initBook() {
    book = el("dialog", { id: "fx-book", class: "fx-book", "aria-labelledby": "fx-book-title" });
    doc.body.append(book);
    book.addEventListener("click", e => { if (e.target === book) book.close(); });
    refreshers.push(() => { if (book.open) renderBook(); });
  }

  // ---------- the full pond graph: ripples run out to connected stones ----------
  function initGraph() {
    const net = window.__iamNetwork, graph = $("graph");
    if (!net || !graph) return;
    const layer = el("div", { class: "fx-graph-fx", "aria-hidden": "true" });
    graph.append(layer);
    let frame = 0;
    let chimeTimer = 0;
    window.__iamStopPondRipple = () => {
      cancelAnimationFrame(frame);
      clearTimeout(chimeTimer);
      layer.replaceChildren();
    };
    window.__iamPlayPondRipple = id => {
      noteStone(id);
      sfx.plop();
      if (!motionOK()) return;
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          const width = layer.clientWidth, height = layer.clientHeight;
          if (!width || !height || !motionOK()) return;
          const lightweight = window.__iamLowPower;
          const nearby = lightweight ? [] : net.getConnectedNodes(id).filter(nodeId => !nodesDS.get(nodeId)?.hidden);
          const positions = net.getPositions([id, ...nearby]);
          if (!positions[id]) return;
          const origin = net.canvasToDOM(positions[id]);
          const inside = p => p.x > -20 && p.y > -20 && p.x < width + 20 && p.y < height + 20;
          if (!inside(origin)) return;
          ringsAt(layer, origin.x, origin.y, { count: lightweight ? 1 : 2, scale: 1.6, duration: 760 });
          const targets = nearby.flatMap(nodeId => {
            if (!positions[nodeId]) return [];
            const point = net.canvasToDOM(positions[nodeId]);
            return inside(point) ? [{ point, distance: Math.hypot(point.x - origin.x, point.y - origin.y) }] : [];
          }).sort((a, b) => a.distance - b.distance).slice(0, 6);
          targets.forEach(({ point, distance }, index) => {
            const travel = Math.min(650, 220 + distance);
            const delay = 90 + index * 24;
            lightBetween(layer, origin, point, travel, delay);
            ringsAt(layer, point.x, point.y, { count: 1, small: true, scale: 1.4, duration: 570, delay: delay + travel * 0.9 });
          });
          if (targets.length) chimeTimer = setTimeout(sfx.chime, 360);
        });
      });
    };
  }

  // ---------- full-graph header: instructions behind one button ----------
  function initHeaderHelp() {
    const leads = [...doc.querySelectorAll("header .lead.lead-long")];
    const actions = doc.querySelector("header .header-actions");
    if (!leads.length || !actions || $("fx-help-toggle")) return;
    leads.filter(p => !p.querySelector("a")).forEach(p => p.classList.add("fx-help-text")); // keep the OpenBible.info credit visible
    const btn = el("button", { type: "button", id: "fx-help-toggle", "aria-expanded": "false", text: "How to explore" });
    btn.addEventListener("click", () => btn.setAttribute("aria-expanded", String(doc.body.classList.toggle("fx-show-help"))));
    actions.prepend(el("span", { class: "verse-tools", id: "fx-help-wrap" }, [btn]));
  }

  function watchModes() {
    new MutationObserver(() => { if (!doc.body.classList.contains("start-pond-mode")) award("deep"); })
      .observe(doc.body, { attributes: true, attributeFilter: ["class"] });
  }

  // ---------- boot ----------
  try { initBook(); } catch (e) { console.warn("commonplace: book", e); }
  try { initHome(); } catch (e) { console.warn("commonplace: home", e); }
  try { initMiniPond(); } catch (e) { console.warn("commonplace: pond", e); }
  try { initGraph(); } catch (e) { console.warn("commonplace: graph", e); }
  try { initHeaderHelp(); } catch (e) { console.warn("commonplace: header", e); }
  try { watchModes(); } catch (e) { console.warn("commonplace: modes", e); }
  refresh();
  if (state.days >= 3) setTimeout(() => award("faithful"), 1200);
})();
