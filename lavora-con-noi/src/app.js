/* Società Dolce – "Lavora con noi" · prototipo
   Nessuna dipendenza. Dati: window.SD_DATI = { base, catalogo } (generati da build/build_data.py). */
(function () {
  "use strict";

  var DATI = window.SD_DATI;
  var BASE = DATI.base;
  var CAT = DATI.catalogo;
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------- icone
  var ICONS = {
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    sprout: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
    backpack: '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M8 10h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
    hands: '<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    home: '<path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
    bridge: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    spark: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    trend: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
    shuffle: '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/>',
    play: '<path d="m6 3 14 9-14 9V3z" fill="currentColor"/>',
    star4: '<path d="M12 2C12.6 8 16 11.4 22 12 16 12.6 12.6 16 12 22 11.4 16 8 12.6 2 12 8 11.4 11.4 8 12 2Z" fill="currentColor" stroke="none"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    grad: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/><path d="M22 10v6"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    stethoscope: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'
  };
  function svgIcon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
  }
  function icon(name) { return '<span data-icon="' + name + '" aria-hidden="true">' + svgIcon(name) + "</span>"; }
  function hydrateIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (n) {
      if (n.firstElementChild) return;
      n.innerHTML = svgIcon(n.getAttribute("data-icon"));
      n.setAttribute("aria-hidden", "true");
    });
  }

  // ---------------------------------------------------------------- util
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function byId(list) { var m = {}; list.forEach(function (x) { m[x.id] = x; }); return m; }
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage non disponibile */ } }
  };
  function track(evento, dati) {
    // Punto di aggancio per GA4 / Matomo (vedi specifiche tecniche).
    if (window.dataLayer) window.dataLayer.push(Object.assign({ event: "lcn_" + evento }, dati || {}));
  }

  var TITOLI = byId(CAT.titoli);
  var RUOLI = byId(CAT.ruoli);
  var SETTORI = byId(CAT.settori);
  var PROFILI = byId(CAT.profili);
  var PROV = BASE.province;
  var REGIONI = Array.from(new Set(Object.keys(PROV).map(function (p) { return PROV[p].regione; }))).sort();
  var AREA_ICON = { educativa: "users", assistenziale: "heart", sanitaria: "stethoscope", sociale: "bridge", servizi: "tool" };

  // ---------------------------------------------------------------- stato
  var saved = store.get("sd-lcn") || {};
  var state = {
    step: 1,
    profilo: saved.profilo || null,
    titoli: saved.titoli || [],
    settori: saved.settori || [],
    province: saved.province || [],
    ovunque: !!saved.ovunque
  };
  function persist() { store.set("sd-lcn", { profilo: state.profilo, titoli: state.titoli, settori: state.settori, province: state.province, ovunque: state.ovunque }); }

  // ---------------------------------------------------------------- matching
  function chiusura(ids) {
    var out = new Set();
    (function add(list) {
      list.forEach(function (id) {
        if (out.has(id)) return;
        out.add(id);
        add((CAT.implicazioni[id] || []));
      });
    })(ids);
    return out;
  }

  function regioniEffettive(servizio) {
    if (state.province.length && !state.ovunque) {
      var sel = new Set(state.province.map(function (p) { return PROV[p].regione; }));
      var r = servizio.regioni.filter(function (x) { return sel.has(x); });
      if (r.length) return r;
    }
    return servizio.regioni;
  }

  /** Requisiti di un ruolo in un servizio: base del catalogo + eccezione più specifica. */
  function requisiti(ruoloId, servizio) {
    var r = RUOLI[ruoloId];
    var out = { accettati: r.accettati, vicini: r.vicini || [], nota: r.nota || "", fonte: "" };
    var regs = regioniEffettive(servizio);
    var best = null, bestScore = -1;
    CAT.eccezioni.forEach(function (e) {
      if (e.ruolo !== ruoloId) return;
      var score = 0;
      if (e.settori) { if (e.settori.indexOf(servizio.settore) < 0) return; score++; }
      if (e.sottosettori) { if (e.sottosettori.indexOf(servizio.sottosettore) < 0) return; score++; }
      if (e.regioni) { if (!regs.every(function (x) { return e.regioni.indexOf(x) >= 0; })) return; score++; }
      if (score > bestScore) { best = e; bestScore = score; }
    });
    if (best) {
      if (best.accettati) out.accettati = best.accettati;
      if (best.vicini) out.vicini = best.vicini;
      if (best.nota) out.nota = best.nota;
      out.fonte = best.fonte || "";
    }
    return out;
  }

  /** Esito: ok | near | far | na | unknown */
  function valuta(ruoloId, servizio) {
    var req = requisiti(ruoloId, servizio);
    if (!req.accettati.length && !req.vicini.length) return { stato: "na", req: req };
    if (!state.titoli.length) return { stato: "unknown", req: req };
    var miei = chiusura(state.titoli);
    var ok = req.accettati.filter(function (t) { return miei.has(t); });
    if (ok.length) {
      var diretto = ok.some(function (t) { return state.titoli.indexOf(t) >= 0; });
      return { stato: "ok", diretto: diretto, titoli: ok, req: req };
    }
    for (var i = 0; i < req.vicini.length; i++) {
      var v = req.vicini[i];
      if (v.da.some(function (t) { return miei.has(t); })) return { stato: "near", vicino: v, req: req };
    }
    return { stato: "far", req: req };
  }

  function valutaServizio(s) {
    var ruoli = s.ruoli.map(function (r) { return { r: r, esito: valuta(r.id, s), meta: RUOLI[r.id] }; });
    var rank = { ok: 0, near: 1, unknown: 2, far: 3, na: 4 };
    ruoli.sort(function (a, b) {
      var d = rank[a.esito.stato] - rank[b.esito.stato];
      if (d) return d;
      if (a.esito.stato === "ok" && a.esito.diretto !== b.esito.diretto) return a.esito.diretto ? -1 : 1;
      return b.meta.peso - a.meta.peso;
    });
    var nOk = ruoli.filter(function (x) { return x.esito.stato === "ok"; });
    var nNear = ruoli.filter(function (x) { return x.esito.stato === "near"; }).length;
    var pesoOk = nOk.reduce(function (m, x) { return Math.max(m, x.meta.peso + (x.esito.diretto ? 5 : 0)); }, 0);
    return { servizio: s, ruoli: ruoli, ok: nOk.length, near: nNear, score: pesoOk * 10 + nOk.length * 3 + nNear };
  }

  function serviziFiltrati() {
    var bySet = BASE.servizi.filter(function (s) { return !state.settori.length || state.settori.indexOf(s.settore) >= 0; });
    var nota = "";
    var lista = bySet;
    if (state.province.length && !state.ovunque) {
      lista = bySet.filter(function (s) { return s.province.some(function (p) { return state.province.indexOf(p) >= 0; }); });
      if (!lista.length) {
        var regs = new Set(state.province.map(function (p) { return PROV[p].regione; }));
        lista = bySet.filter(function (s) { return s.regioni.some(function (r) { return regs.has(r); }); });
        nota = lista.length
          ? "Nelle province scelte non abbiamo ancora servizi di questo tipo: ti mostriamo quelli più vicini, nella stessa regione."
          : "Nei territori scelti non abbiamo ancora servizi di questo tipo: ti mostriamo tutte le opportunità del settore.";
        if (!lista.length) lista = bySet;
      }
    }
    var valutati = lista.map(valutaServizio).sort(function (a, b) { return b.score - a.score; });
    return { lista: valutati, nota: nota };
  }

  // ---------------------------------------------------------------- illustrazioni
  var PIECE = "M0 0H38a12 12 0 1 0 24 0H100V38a12 12 0 1 1 0 24V100H0V62a12 12 0 1 0 0-24Z";
  function pieces(seed, opacity) {
    // composizione astratta di tasselli (motivo del logo)
    var rnd = mulberry(seed);
    var out = '<svg class="pieces" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
    var fills = ["#ffffff", "#BACCE4", "#6CA2D2", "#ffffff"];
    for (var i = 0; i < 6; i++) {
      var x = 160 + rnd() * 240, y = -30 + rnd() * 200, s = 0.35 + rnd() * 0.55, rot = Math.round(rnd() * 4) * 90 + (rnd() * 16 - 8);
      out += '<path d="' + PIECE + '" transform="translate(' + x.toFixed(0) + " " + y.toFixed(0) + ") rotate(" + rot.toFixed(0) + ") scale(" + s.toFixed(2) + ')" fill="' + fills[i % 4] + '" opacity="' + (opacity || 0.28) + '"/>';
    }
    return out + "</svg>";
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) + 1; }

  // ---------------------------------------------------------------- hero: rete di persone
  function heroNet() {
    var svg = $("#hero-net");
    if (!svg) return;
    var rnd = mulberry(7), nodes = [], cx = 260, cy = 260;
    for (var i = 0; i < 26; i++) {
      var ang = rnd() * Math.PI * 2, rad = 70 + Math.pow(rnd(), 0.8) * 180;
      nodes.push({ x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad, r: 5 + rnd() * 7 });
    }
    var links = [];
    nodes.forEach(function (n, i) {
      var near = nodes.map(function (m, j) { return { j: j, d: Math.hypot(m.x - n.x, m.y - n.y) }; }).filter(function (o) { return o.j !== i; }).sort(function (a, b) { return a.d - b.d; }).slice(0, 2);
      near.forEach(function (o) { if (o.j > i) links.push([i, o.j, o.d]); });
      if (rnd() > 0.55) links.push([i, -1, Math.hypot(n.x - cx, n.y - cy)]);
    });
    var html = "";
    links.forEach(function (l, k) {
      var a = nodes[l[0]], b = l[1] < 0 ? { x: cx, y: cy } : nodes[l[1]];
      html += '<line class="net-link" x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" style="--len:' + Math.ceil(l[2]) + ";--d:" + (0.3 + k * 0.035).toFixed(2) + 's"/>';
    });
    nodes.forEach(function (n, k) {
      var d = (0.1 + k * 0.05).toFixed(2);
      var fill = k % 5 === 0 ? "#F5A54A" : (k % 3 === 0 ? "#6CA2D2" : "#006CB4");
      html += '<g class="net-node" style="--d:' + d + 's"><circle class="halo" cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="' + (n.r + 6).toFixed(1) + '"/>' +
        '<circle cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="' + n.r.toFixed(1) + '" fill="' + fill + '"/></g>';
      if (k % 6 === 0) html += '<circle class="net-pulse" cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="' + (n.r + 4).toFixed(1) + '" style="--d:' + (1.8 + k * 0.2).toFixed(2) + 's"/>';
    });
    // tasselli centrali: da individui a comunità
    var pc = [["#006CB4", -58, -58, 0], ["#6CA2D2", 4, -58, 90], ["#BACCE4", -58, 4, 270], ["#36549C", 4, 4, 180]];
    pc.forEach(function (p, k) {
      html += '<g class="net-piece" style="--d:' + (1.6 + k * 0.22).toFixed(2) + 's"><path d="' + PIECE + '" fill="' + p[0] + '" transform="translate(' + (cx + p[1] + 27) + " " + (cy + p[2] + 27) + ") rotate(" + p[3] + ") translate(-27 -27) scale(.54)\"/></g>";
    });
    svg.innerHTML = html;
  }

  // ---------------------------------------------------------------- statistiche
  function stats() {
    var st = BASE.statistiche;
    var items = [
      { v: 30, suf: "+", l: "anni nei servizi alla persona" },
      { v: st.tipologieServizio, l: "tipologie di servizio" },
      { v: st.professioni, l: "professioni diverse" },
      { v: st.settori, l: "settori di intervento" },
      { v: st.province, l: "province" },
      { v: st.regioni, l: "regioni" }
    ];
    var ul = $("[data-stats]");
    ul.innerHTML = items.map(function (it) { return '<li class="reveal"><b data-count="' + it.v + '" data-suf="' + (it.suf || "") + '">0' + (it.suf || "") + "</b><span>" + esc(it.l) + "</span></li>"; }).join("");
    $("[data-stats-inline]").innerHTML =
      "<li><b>" + st.tipologieServizio + "</b> tipologie di servizio</li><li><b>" + st.professioni + "</b> professioni</li><li><b>" + st.regioni + "</b> regioni</li>";
  }
  function countUp(el) {
    var target = +el.getAttribute("data-count"), suf = el.getAttribute("data-suf") || "";
    if (REDUCED) { el.textContent = target + suf; return; }
    var t0 = null;
    function f(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + suf;
      if (p < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }

  // ---------------------------------------------------------------- wizard
  var STEPS = [
    { n: 1, lbl: "Chi sei" },
    { n: 2, lbl: "Formazione" },
    { n: 3, lbl: "Ambito" },
    { n: 4, lbl: "Territorio" },
    { n: 5, lbl: "Risultati" }
  ];
  function canGo(n) {
    if (n <= 1) return true;
    if (n === 2) return !!state.profilo;
    if (n === 3) return !!state.profilo;
    if (n === 4) return !!state.profilo;
    return !!state.profilo;
  }
  function renderProgress() {
    $(".progress").innerHTML = STEPS.map(function (s) {
      var cls = s.n < state.step ? "is-done" : s.n === state.step ? "is-current" : "";
      return '<li class="' + cls + '"><button type="button" data-goto="' + s.n + '" ' + (canGo(s.n) && s.n !== state.step ? "" : "disabled") + ' aria-current="' + (s.n === state.step ? "step" : "false") + '">' +
        '<span class="bar"></span><span class="lbl">' + s.n + ". " + s.lbl + '</span><span class="visually-hidden">Passo ' + s.n + " di 5: " + s.lbl + "</span></button></li>";
    }).join("");
  }

  function goTo(n, opts) {
    opts = opts || {};
    var back = n < state.step;
    state.step = n;
    persist();
    renderProgress();
    if (n === 5) {
      renderResults();
      track("step_risultati", { profilo: state.profilo, titoli: state.titoli.join("|"), settori: state.settori.join("|"), province: state.province.join("|") });
      return;
    }
    $("#risultati").hidden = true;
    var stage = $("#wizard-stage");
    stage.innerHTML = '<div class="step-panel' + (back ? " is-back" : "") + '">' + stepHTML(n) + "</div>";
    hydrateIcons(stage);
    bindStep(n);
    track("step_" + n);
    if (!opts.silent) {
      var h = $(".step-title", stage);
      if (h) h.focus({ preventScroll: true });
      var wz = $("#wizard");
      if (wz.getBoundingClientRect().top < 0) wz.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
    }
  }

  function navHTML(n, nextLabel, disabled) {
    return '<div class="step-nav">' +
      (n > 1 ? '<button type="button" class="btn btn-ghost" data-prev>' + icon("arrow-left") + " Indietro</button>" : '<span></span>') +
      '<span class="spacer"></span>' +
      (n === 2 || n === 3 || n === 4 ? '<button type="button" class="btn-text" data-skip>Salta questa domanda</button>' : "") +
      '<button type="button" class="btn btn-primary" data-next ' + (disabled ? "disabled" : "") + ">" + nextLabel + " " + icon("arrow-right") + "</button></div>";
  }

  function stepHTML(n) {
    if (n === 1) {
      return '<p class="step-count">Passo 1 di 4</p><h3 class="step-title" tabindex="-1">Chi sei oggi?</h3>' +
        '<p class="step-desc">Scegli la descrizione più vicina al momento in cui ti trovi adesso. Non c\'è una risposta giusta.</p>' +
        '<div class="options" role="radiogroup" aria-label="Chi sei oggi">' +
        CAT.profili.map(function (p) {
          return '<button type="button" class="option" role="radio" aria-checked="' + (state.profilo === p.id) + '" data-profilo="' + p.id + '">' +
            '<span><span class="o-label">' + esc(p.label) + '</span><span class="o-hint">' + esc(p.hint) + '</span></span><span class="o-check">' + icon("check") + "</span></button>";
        }).join("") + "</div>" + navHTML(1, "Continua", !state.profilo);
    }
    if (n === 2) {
      var quick = ["obbligo", "diploma", "diploma_sociale", "oss", "studente_l19", "l19", "snt1", "psicologo", "l39"];
      return '<p class="step-count">Passo 2 di 4</p><h3 class="step-title" tabindex="-1">Cosa studi o in cosa sei formato/a?</h3>' +
        '<p class="step-desc">Cerca il tuo titolo di studio, la tua qualifica o la professione. Puoi indicarne più di uno: lo useremo per capire a quali ruoli puoi già candidarti e cosa ti manca per gli altri.</p>' +
        '<div class="combo"><label for="titolo-input">Titolo di studio, qualifica o professione</label>' +
        '<div class="combo-field">' + icon("search") + '<input id="titolo-input" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="titolo-list" autocomplete="off" placeholder="Es. OSS, Scienze dell\'educazione, infermiere…"></div>' +
        '<ul class="listbox" id="titolo-list" role="listbox" hidden></ul>' +
        '<p class="combo-help">Non trovi il tuo titolo? Scegli quello più simile: lo verificheremo insieme al colloquio.</p></div>' +
        '<ul class="chips" id="titolo-chips" aria-label="Titoli selezionati"></ul>' +
        '<div class="quick"><h4>Scelte rapide</h4><div class="quick-list">' +
        quick.map(function (id) { return '<button type="button" class="pill-toggle" data-quick="' + id + '" aria-pressed="' + (state.titoli.indexOf(id) >= 0) + '">' + esc(shortTitle(id)) + "</button>"; }).join("") +
        "</div></div>" + navHTML(2, "Continua", false);
    }
    if (n === 3) {
      return '<p class="step-count">Passo 3 di 4</p><h3 class="step-title" tabindex="-1">In quale ambito vorresti fare la differenza?</h3>' +
        '<p class="step-desc">La relazione con le persone è il cuore di ciò che facciamo. Puoi sceglierne più di uno.</p>' +
        '<div class="sector-grid">' + CAT.settori.map(function (s, i) {
          var n = BASE.servizi.filter(function (x) { return x.settore === s.id; }).length;
          return '<button type="button" class="sector-card" style="--i:' + i + ";--tone:" + s.tono + '" aria-pressed="' + (state.settori.indexOf(s.id) >= 0) + '" data-settore="' + s.id + '">' +
            '<span class="sector-art">' + pieces(hash(s.id)) + '<span class="s-icon">' + icon(s.icona) + '</span></span><span class="o-check">' + icon("check") + "</span>" +
            '<span class="sector-body"><h3>' + esc(s.label) + "</h3><p>" + esc(s.impatto) + '</p><span class="s-meta">' + n + (n === 1 ? " servizio" : " servizi") + "</span></span></button>";
        }).join("") + "</div>" + navHTML(3, "Continua", false);
    }
    if (n === 4) {
      return '<p class="step-count">Passo 4 di 4</p><h3 class="step-title" tabindex="-1">Dove vorresti lavorare?</h3>' +
        '<p class="step-desc">Tocca le province sulla mappa o scegli un\'intera regione. Il numero indica i servizi presenti per gli ambiti che hai scelto.</p>' +
        '<div class="geo"><div class="map-wrap" id="map"></div><div class="geo-side" id="geo-side"></div></div>' + navHTML(4, "Mostra i servizi", false);
    }
    return "";
  }

  function shortTitle(id) {
    var map = { obbligo: "Licenza media", diploma: "Diploma superiore", diploma_sociale: "Diploma socio-sanitario / Scienze umane", oss: "Qualifica OSS", studente_l19: "Studio Scienze dell'educazione", l19: "Laurea L-19", snt1: "Infermiere/a", psicologo: "Psicologo/a", l39: "Assistente sociale" };
    return map[id] || TITOLI[id].label;
  }

  function bindStep(n) {
    var stage = $("#wizard-stage");
    var next = $("[data-next]", stage), prev = $("[data-prev]", stage), skip = $("[data-skip]", stage);
    if (prev) prev.addEventListener("click", function () { goTo(n - 1); });
    if (next) next.addEventListener("click", function () { goTo(n + 1); });
    if (skip) skip.addEventListener("click", function () {
      if (n === 2) state.titoli = [];
      if (n === 3) state.settori = [];
      if (n === 4) { state.province = []; state.ovunque = true; }
      goTo(n + 1);
    });

    if (n === 1) {
      $$("[data-profilo]", stage).forEach(function (b, i, all) {
        b.addEventListener("click", function () {
          state.profilo = b.getAttribute("data-profilo");
          all.forEach(function (x) { x.setAttribute("aria-checked", x === b); });
          next.disabled = false;
          persist(); renderProgress();
          setTimeout(function () { if (state.step === 1) goTo(2); }, REDUCED ? 0 : 380);
        });
        b.addEventListener("keydown", function (e) {
          var k = e.key, j = null;
          if (k === "ArrowDown" || k === "ArrowRight") j = (i + 1) % all.length;
          if (k === "ArrowUp" || k === "ArrowLeft") j = (i - 1 + all.length) % all.length;
          if (j !== null) { e.preventDefault(); all[j].focus(); }
        });
      });
    }
    if (n === 2) bindCombo();
    if (n === 3) {
      $$("[data-settore]", stage).forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-settore"), i = state.settori.indexOf(id);
          if (i >= 0) state.settori.splice(i, 1); else state.settori.push(id);
          b.setAttribute("aria-pressed", i < 0);
          persist();
        });
      });
    }
    if (n === 4) renderMap();
  }

  // ---- combobox titoli
  function bindCombo() {
    var input = $("#titolo-input"), list = $("#titolo-list"), active = -1, items = [];
    renderChips();
    function search(q) {
      var nq = norm(q.trim());
      var res = CAT.titoli.filter(function (t) {
        if (state.titoli.indexOf(t.id) >= 0) return false;
        if (!nq) return true;
        return norm(t.label).indexOf(nq) >= 0 || t.sinonimi.some(function (s) { return norm(s).indexOf(nq) >= 0 || nq.indexOf(norm(s)) >= 0; });
      });
      return res.slice(0, 8);
    }
    function open(q) {
      items = search(q);
      active = items.length ? 0 : -1;
      list.innerHTML = items.length
        ? items.map(function (t, i) { return '<li role="option" id="opt-' + t.id + '" data-id="' + t.id + '" aria-selected="' + (i === active) + '">' + esc(t.label) + "<small>" + esc(t.gruppo) + "</small></li>"; }).join("")
        : '<li class="empty" role="option" aria-disabled="true">Nessun risultato: prova con un\'altra parola (es. "educatore", "OSS", "laurea")</li>';
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      input.setAttribute("aria-activedescendant", active >= 0 ? "opt-" + items[active].id : "");
    }
    function close() { list.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); }
    function highlight() {
      $$("li[role=option]", list).forEach(function (li, i) { li.setAttribute("aria-selected", i === active); if (i === active) li.scrollIntoView({ block: "nearest" }); });
      input.setAttribute("aria-activedescendant", active >= 0 && items[active] ? "opt-" + items[active].id : "");
    }
    function choose(id) { addTitolo(id); input.value = ""; close(); input.focus(); }
    input.addEventListener("input", function () { open(input.value); });
    input.addEventListener("focus", function () { open(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); if (list.hidden) open(input.value); else if (items.length) { active = (active + 1) % items.length; highlight(); } }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (items.length) { active = (active - 1 + items.length) % items.length; highlight(); } }
      else if (e.key === "Enter") { if (!list.hidden && active >= 0 && items[active]) { e.preventDefault(); choose(items[active].id); } }
      else if (e.key === "Escape") { close(); }
    });
    list.addEventListener("mousedown", function (e) { var li = e.target.closest("li[data-id]"); if (li) { e.preventDefault(); choose(li.getAttribute("data-id")); } });
    input.addEventListener("blur", function () { setTimeout(close, 120); });
    $$("[data-quick]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-quick");
        if (state.titoli.indexOf(id) >= 0) removeTitolo(id); else addTitolo(id);
      });
    });
  }
  function addTitolo(id) { if (state.titoli.indexOf(id) < 0) state.titoli.push(id); persist(); renderChips(); track("titolo_aggiunto", { titolo: id }); }
  function removeTitolo(id) { state.titoli = state.titoli.filter(function (x) { return x !== id; }); persist(); renderChips(); }
  function renderChips() {
    var ul = $("#titolo-chips");
    if (!ul) return;
    ul.innerHTML = state.titoli.map(function (id) {
      return '<li class="chip">' + esc(TITOLI[id].label) + '<button type="button" data-remove="' + id + '" aria-label="Rimuovi ' + esc(TITOLI[id].label) + '">' + icon("x") + "</button></li>";
    }).join("");
    $$("[data-remove]", ul).forEach(function (b) { b.addEventListener("click", function () { removeTitolo(b.getAttribute("data-remove")); var i = $("#titolo-input"); if (i) i.focus(); }); });
    $$("[data-quick]").forEach(function (b) { b.setAttribute("aria-pressed", state.titoli.indexOf(b.getAttribute("data-quick")) >= 0); });
  }

  // ---- mappa
  function renderMap() {
    var wrap = $("#map"), side = $("#geo-side");
    var keys = Object.keys(PROV);
    var lons = keys.map(function (k) { return PROV[k].lon * Math.cos(45 * Math.PI / 180); }), lats = keys.map(function (k) { return PROV[k].lat; });
    var minX = Math.min.apply(null, lons), maxX = Math.max.apply(null, lons), minY = Math.min.apply(null, lats), maxY = Math.max.apply(null, lats);
    var W = 400, H = 310, pad = 46;
    function proj(k) {
      var x = PROV[k].lon * Math.cos(45 * Math.PI / 180), y = PROV[k].lat;
      return { x: pad + (x - minX) / (maxX - minX) * (W - 2 * pad), y: pad + (maxY - y) / (maxY - minY) * (H - 2 * pad) };
    }
    var NUDGE = { VA: [-13, 5], CO: [11, -7], RO: [7, -9], FE: [-3, 7], BO: [6, 7], MO: [-8, -2] }; // evita sovrapposizioni dei bottoni (44px)
    var pos = {}; keys.forEach(function (k) { var p = proj(k), n = NUDGE[k] || [0, 0]; pos[k] = { x: p.x + n[0], y: p.y + n[1] }; });
    var conta = {};
    BASE.servizi.forEach(function (s) {
      if (state.settori.length && state.settori.indexOf(s.settore) < 0) return;
      s.province.forEach(function (p) { conta[p] = (conta[p] || 0) + 1; });
    });
    var colors = { "Emilia-Romagna": "#BACCE4", "Lombardia": "#D7E3F3", "Veneto": "#C9D8EE" };
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" aria-hidden="true">';
    REGIONI.forEach(function (r) {
      var pts = keys.filter(function (k) { return PROV[k].regione === r; }).map(function (k) { return [pos[k].x, pos[k].y]; });
      var hull = convexHull(pts);
      var d = hull.length > 2 ? "M" + hull.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L") + "Z" : "M" + hull.map(function (p) { return p[0] + " " + p[1]; }).join("L");
      svg += '<path class="region-blob" d="' + d + '" fill="' + colors[r] + '" stroke="' + colors[r] + '" stroke-width="64" stroke-linejoin="round" stroke-linecap="round"/>';
      var c = pts.reduce(function (a, p) { return [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length]; }, [0, 0]);
      var lp = { "Lombardia": pos.MI && pos.CR ? [pos.MI.x - 6, pos.CR.y + 14] : c, "Veneto": pos.VI ? [pos.VI.x + 4, pos.VI.y - 30] : c, "Emilia-Romagna": [c[0] + 10, c[1] + 54] }[r] || c;
      svg += '<text class="region-label" x="' + lp[0].toFixed(0) + '" y="' + lp[1].toFixed(0) + '" text-anchor="middle">' + esc(r) + "</text>";
    });
    svg += "</svg>";
    var btns = keys.map(function (k) {
      var p = pos[k], on = state.province.indexOf(k) >= 0;
      return '<button type="button" class="prov-btn" style="left:' + (p.x / W * 100).toFixed(2) + "%;top:" + (p.y / H * 100).toFixed(2) + '%" aria-pressed="' + on + '" data-prov="' + k + '" aria-label="' + esc(PROV[k].nome) + ", " + (conta[k] || 0) + ' servizi">' + k +
        (conta[k] ? '<span class="cnt" aria-hidden="true">' + conta[k] + "</span>" : "") + "</button>";
    }).join("");
    wrap.innerHTML = svg + btns;
    side.innerHTML = '<h4 id="reg-h">Regioni</h4><div class="prov-list" role="group" aria-labelledby="reg-h">' +
      REGIONI.map(function (r) {
        var ps = keys.filter(function (k) { return PROV[k].regione === r; });
        var all = ps.every(function (k) { return state.province.indexOf(k) >= 0; });
        return '<button type="button" class="pill-toggle" data-reg="' + esc(r) + '" aria-pressed="' + all + '">' + esc(r) + "</button>";
      }).join("") + "</div>" +
      '<h4 id="prov-h">Province</h4><div class="prov-list" role="group" aria-labelledby="prov-h">' +
      keys.slice().sort(function (a, b) { return PROV[a].nome.localeCompare(PROV[b].nome); }).map(function (k) {
        return '<button type="button" class="pill-toggle" data-prov="' + k + '" aria-pressed="' + (state.province.indexOf(k) >= 0) + '">' + esc(PROV[k].nome) + "</button>";
      }).join("") + "</div>" +
      '<div class="geo-anywhere"><button type="button" class="option" data-ovunque aria-pressed="' + state.ovunque + '"><span><span class="o-label">Sono disponibile a spostarmi</span><span class="o-hint">Mostrami tutte le sedi</span></span><span class="o-check">' + icon("check") + "</span></button></div>";
    function sync() { renderMap(); }
    $$("[data-prov]", $("#wizard-stage")).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-prov"), i = state.province.indexOf(k);
        if (i >= 0) state.province.splice(i, 1); else state.province.push(k);
        state.ovunque = false; persist(); sync();
        var again = $('[data-prov="' + k + '"].' + (b.classList.contains("prov-btn") ? "prov-btn" : "pill-toggle")); if (again) again.focus();
      });
    });
    $$("[data-reg]", side).forEach(function (b) {
      b.addEventListener("click", function () {
        var r = b.getAttribute("data-reg"), ps = keys.filter(function (k) { return PROV[k].regione === r; });
        var all = ps.every(function (k) { return state.province.indexOf(k) >= 0; });
        if (all) state.province = state.province.filter(function (k) { return ps.indexOf(k) < 0; });
        else ps.forEach(function (k) { if (state.province.indexOf(k) < 0) state.province.push(k); });
        state.ovunque = false; persist(); sync();
        var again = $('[data-reg="' + r + '"]'); if (again) again.focus();
      });
    });
    $("[data-ovunque]", side).addEventListener("click", function () {
      state.ovunque = !state.ovunque;
      if (state.ovunque) state.province = [];
      persist(); sync();
      var again = $("[data-ovunque]"); if (again) again.focus();
    });
  }
  function convexHull(points) {
    if (points.length < 3) return points;
    var p = points.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cross(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lo = [], up = [];
    p.forEach(function (pt) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], pt) <= 0) lo.pop(); lo.push(pt); });
    p.slice().reverse().forEach(function (pt) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], pt) <= 0) up.pop(); up.push(pt); });
    up.pop(); lo.pop();
    return lo.concat(up);
  }

  // ---------------------------------------------------------------- risultati (step 5)
  function riepilogo() {
    var tags = [];
    tags.push('<button type="button" class="tag" data-goto="1">Tu: <b>' + esc(state.profilo ? PROFILI[state.profilo].label : "—") + "</b></button>");
    tags.push('<button type="button" class="tag" data-goto="2">Formazione: <b>' + esc(state.titoli.length ? state.titoli.map(shortTitle).join(", ") : "non indicata") + "</b></button>");
    tags.push('<button type="button" class="tag" data-goto="3">Ambiti: <b>' + esc(state.settori.length ? state.settori.map(function (s) { return SETTORI[s].label; }).join(", ") : "tutti") + "</b></button>");
    tags.push('<button type="button" class="tag" data-goto="4">Dove: <b>' + esc(state.ovunque || !state.province.length ? "ovunque" : state.province.map(function (p) { return PROV[p].nome; }).join(", ")) + "</b></button>");
    return '<div class="summary" aria-label="Le tue risposte (tocca per modificare)">' + tags.join("") + "</div>";
  }

  function renderResults() {
    var sec = $("#risultati"), root = $("#results-root");
    var res = serviziFiltrati();
    $("#wizard-stage").innerHTML = '<div class="step-panel"><p class="step-count">Fatto!</p><h3 class="step-title" tabindex="-1">Abbiamo trovato ' + res.lista.length + (res.lista.length === 1 ? " servizio" : " servizi") + ' per te.</h3><p class="step-desc">Scorri per scoprirli: per ognuno ti raccontiamo il contesto, le persone che incontrerai e le professioni che ci lavorano.</p>' +
      '<div class="step-nav"><button type="button" class="btn btn-ghost" data-prev>' + icon("arrow-left") + ' Modifica le risposte</button><span class="spacer"></span><a class="btn btn-primary" href="#risultati">Vedi i servizi ' + icon("arrow-right") + "</a></div></div>";
    $("[data-prev]", $("#wizard-stage")).addEventListener("click", function () { goTo(4); });

    var totOk = res.lista.reduce(function (a, x) { return a + (x.ok ? 1 : 0); }, 0);
    var html = '<div class="results-head"><div><p class="eyebrow">Passo 5 · I tuoi risultati</p><h2 id="risultati-title" tabindex="-1">Ecco i servizi in cui potresti lavorare</h2>' +
      '<p class="section-lead" style="margin:0">' + (state.titoli.length
        ? (totOk ? "In <b>" + totOk + "</b> di questi c'è già almeno un ruolo per cui hai i requisiti. Negli altri ti mostriamo come arrivarci."
          : "Per ora non risulti avere tutti i requisiti per questi ruoli, ma per molti esiste una strada: aprili per scoprire cosa ti manca e come ottenerlo.")
        : "Non hai indicato un titolo di studio: apri un servizio per scoprire le professioni e i requisiti, oppure torna al passo 2.") + "</p></div>" + riepilogo() + "</div>";
    if (res.nota) html += '<p class="result-note">' + esc(res.nota) + "</p>";
    html += '<div class="service-grid">' + res.lista.map(serviceCard).join("") + "</div>";
    root.innerHTML = html;
    hydrateIcons(root);
    sec.hidden = false;
    $$("[data-goto]", root).forEach(function (b) { b.addEventListener("click", function () { goTo(+b.getAttribute("data-goto")); $("#orientati").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" }); }); });
    $$("[data-open]", root).forEach(function (b) { b.addEventListener("click", function () { openService(b.getAttribute("data-open"), b); }); });
    requestAnimationFrame(function () {
      sec.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
      $("#risultati-title").focus({ preventScroll: true });
    });
  }

  function badgeFor(v) {
    if (!state.titoli.length) return "";
    if (v.ok) return '<span class="svc-badge">' + icon("check") + (v.ok === 1 ? "1 ruolo per te" : v.ok + " ruoli per te") + "</span>";
    if (v.near) return '<span class="svc-badge near">' + icon("rocket") + "Raggiungibile con un percorso</span>";
    return '<span class="svc-badge far">' + icon("info") + "Scopri i requisiti</span>";
  }

  function serviceCard(v, i) {
    var s = v.servizio, set = SETTORI[s.settore];
    var roles = v.ruoli.slice(0, 4).map(function (x) {
      var cls = x.esito.stato === "ok" ? "ok" : x.esito.stato === "near" ? "near" : "";
      return '<li class="role-dot ' + cls + '">' + esc(x.meta.nome.split(" – ")[0].split(" / ")[0]) + "</li>";
    }).join("") + (v.ruoli.length > 4 ? '<li class="role-dot">+' + (v.ruoli.length - 4) + "</li>" : "");
    return '<article class="service-card" style="--i:' + Math.min(i, 8) + '">' +
      '<div class="sector-art" style="--tone:' + set.tono + '">' + pieces(hash(s.id)) + '<span class="s-icon">' + icon(set.icona) + "</span>" + badgeFor(v) + "</div>" +
      '<div class="service-body"><p class="svc-sector">' + esc(set.label) + (s.sottosettore ? " · " + esc(s.sottosettore) : "") + "</p>" +
      "<h3>" + esc(s.nome) + "</h3>" +
      '<ul class="svc-meta"><li>' + icon("pin") + esc(s.localita) + "</li>" + (s.orario ? "<li>" + icon("clock") + esc(s.orario) + "</li>" : "") + "</ul>" +
      '<p class="svc-desc">' + esc(s.descrizione) + "</p>" +
      '<ul class="svc-roles" aria-label="Professioni nel servizio">' + roles + "</ul>" +
      '<button type="button" class="btn btn-primary" data-open="' + s.id + '">Scopri il servizio ' + icon("arrow-right") + "</button></div></article>";
  }

  // ---------------------------------------------------------------- dettaglio servizio (step 5.1 / 5.2)
  var lastFocus = null;
  function openService(id, trigger) {
    var s = BASE.servizi.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    lastFocus = trigger || document.activeElement;
    var v = valutaServizio(s), set = SETTORI[s.settore];
    var areaBest = v.ruoli[0] ? v.ruoli[0].meta.area : "educativa";
    var path = CAT.percorsiCrescita[areaBest];
    var ambiente = [s.orario, /resid|h24|comunit/i.test(s.nome + s.nomeOriginale) ? "Servizio residenziale, aperto tutto l'anno" : (/diurn|centro/i.test(s.nome) ? "Servizio diurno" : "Servizio territoriale")].filter(Boolean).join(" · ");
    var html = '<div class="sheet-hero" style="--tone:' + set.tono + '">' + pieces(hash(s.id) + 3, 0.5) +
      '<button type="button" class="sheet-close" data-close aria-label="Chiudi">' + icon("x") + "</button>" +
      '<p class="svc-sector">' + esc(set.label) + (s.sottosettore ? " · " + esc(s.sottosettore) : "") + "</p>" +
      '<h2 id="sheet-title">' + esc(s.nome) + "</h2>" +
      '<ul class="svc-meta"><li>' + icon("pin") + esc(s.localita) + "</li>" + (s.orario ? "<li>" + icon("clock") + esc(s.orario) + "</li>" : "") + "</ul></div>" +
      '<div class="sheet-body">' +
      '<div class="story-grid">' +
      '<div class="story wide"><h4>' + icon("info") + "Il contesto</h4><p>" + esc(s.descrizione) + "</p>" + (s.descrizioneProvvisoria ? '<span class="prov-flag">Testo provvisorio: descrizione da completare nella base informativa</span>' : "") + "</div>" +
      '<div class="story"><h4>' + icon("users") + "Le persone che incontri</h4><p>" + esc(set.persone) + "</p></div>" +
      '<div class="story"><h4>' + icon("heart") + "L'impatto che generi</h4><p>" + esc(set.impatto) + "</p></div>" +
      '<div class="story"><h4>' + icon("home") + "L'ambiente di lavoro</h4><p>" + esc(ambiente) + ". Lavori in un'équipe multiprofessionale con coordinamento dedicato.</p></div>" +
      '<div class="story"><h4>' + icon("trend") + "Dove puoi crescere</h4><ul class=\"mini-path\">" + path.tappe.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>" +
      "</div>" +
      '<div class="roles-title"><h3>Le professionalità di questo servizio</h3>' +
      (state.titoli.length ? '<div class="legend"><span class="role-dot ok">Hai i requisiti</span><span class="role-dot near">Ti manca qualcosa</span><span class="role-dot">Altri requisiti</span></div>' : "") + "</div>" +
      '<div class="role-list">' + v.ruoli.map(function (x, i) { return roleCard(x, s, v, i === 0); }).join("") + "</div>" +
      "</div>";
    var sheet = $("#sheet"), inner = $("#sheet-inner"), bd = $("#sheet-backdrop");
    inner.innerHTML = html;
    hydrateIcons(inner);
    sheet.hidden = false; bd.hidden = false;
    sheet.scrollTop = 0;
    document.body.style.overflow = "hidden";
    $("[data-close]", inner).focus();
    bindSheet(s, v);
    if (location.hash !== "#servizio-" + s.id) setHash("#servizio-" + s.id);
    track("apri_servizio", { servizio: s.id });
  }
  function closeService(fromPop) {
    var sheet = $("#sheet");
    if (sheet.hidden) return;
    sheet.hidden = true; $("#sheet-backdrop").hidden = true;
    document.body.style.overflow = "";
    if (!fromPop && location.hash.indexOf("#servizio-") === 0) setHash("#risultati");
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  function roleCard(x, s, v, expanded) {
    var m = x.meta, e = x.esito, rid = s.id + "-" + m.id;
    var st = {
      ok: [icon("check") + "Hai i requisiti", "ok"],
      near: [icon("rocket") + "Ti manca qualche requisito", "near"],
      far: [icon("info") + "Requisiti diversi dal tuo profilo", ""],
      unknown: [icon("info") + "Indica il tuo titolo per verificare", ""],
      na: [icon("info") + "Non previsto in questa regione", ""]
    }[e.stato];
    var consul = x.r.consulenza ? " · spesso in consulenza" : "";
    return '<article class="role-card ' + st[1] + '">' +
      '<button type="button" class="role-head" aria-expanded="' + !!expanded + '" aria-controls="rd-' + rid + '" data-role>' +
      '<span class="role-avatar">' + icon(AREA_ICON[m.area] || "users") + "</span>" +
      '<span><span class="role-status ' + st[1] + '">' + st[0] + "</span><h4>" + esc(m.nome) + "</h4><p>" + esc(CAT.percorsiCrescita[m.area].label) + esc(consul) + (x.r.turni.length ? " · " + esc(x.r.turni[0].split("\n")[0]) : "") + '</p><span class="role-toggle">' + (expanded ? "Nascondi" : "Scopri il ruolo") + " " + icon("chevron") + "</span></span></button>" +
      '<div class="role-detail" id="rd-' + rid + '" ' + (expanded ? "" : "hidden") + ">" +
      '<div class="full"><p style="margin:0">' + esc(m.sintesi) + "</p></div>" +
      "<div><h5>Competenze</h5><ul class=\"skill-list\">" + m.competenze.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>" +
      "<div><h5>Percorso di crescita</h5><ul class=\"mini-path\">" + CAT.percorsiCrescita[m.area].tappe.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="full">' + matchBlock(x, s, v) + "</div>" +
      '<div class="full"><details class="req"><summary>Requisiti ufficiali per questo servizio</summary>' +
      (x.r.requisitiMatrice.length ? x.r.requisitiMatrice.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") : "<p>Da completare nella base informativa.</p>") +
      (e.req.nota ? "<p><b>Nota:</b> " + esc(e.req.nota) + "</p>" : "") + "</details></div>" +
      '<div class="full refer"><p>' + icon("send") + " Conosci qualcuno adatto a questo ruolo?</p><button type=\"button\" class=\"btn-text\" data-segnala=\"" + m.id + '">Segnala una persona</button></div>' +
      "</div></article>";
  }

  function matchBlock(x, s, v) {
    var e = x.esito, m = x.meta;
    if (e.stato === "ok") {
      return '<div class="match ok"><h5>' + icon("check") + "Hai già i requisiti</h5>" +
        "<p>Il tuo profilo è coerente con questo ruolo" + (e.diretto ? "" : " (grazie al tuo titolo di studio)") + ". Puoi candidarti subito.</p>" +
        '<div class="match-actions"><button type="button" class="btn btn-ok" data-offerte="' + m.id + '">Vedi le offerte aperte ' + icon("arrow-right") + '</button><button type="button" class="btn btn-ghost" data-candida="' + m.id + '">Candidatura spontanea</button></div></div>';
    }
    if (e.stato === "near") {
      var vic = e.vicino;
      var ponte = vic.ponte && v.ruoli.filter(function (y) { return y.meta.id === vic.ponte && y.esito.stato === "ok"; })[0];
      return '<div class="match near"><h5>' + icon("rocket") + "Ti manca qualche requisito: ecco come arrivarci</h5>" +
        "<p><b>Cosa manca:</b> " + esc(vic.manca) + ".</p>" +
        '<ul class="gap-list">' + vic.percorsi.map(function (pid) { var p = CAT.percorsiFormativi[pid]; return '<li class="gap-item"><b>' + esc(p.titolo) + "</b><small>" + esc(p.durata) + "</small><span>" + esc(p.testo) + "</span></li>"; }).join("") + "</ul>" +
        (ponte ? "<p><b>Intanto puoi iniziare come " + esc(ponte.meta.nome) + "</b>: hai già i requisiti e lavori nello stesso servizio mentre ti formi.</p>" : "") +
        '<div class="match-actions"><button type="button" class="btn btn-primary" data-percorso="' + m.id + '">Voglio saperne di più ' + icon("arrow-right") + "</button>" +
        (ponte ? '<button type="button" class="btn btn-ghost" data-offerte="' + ponte.meta.id + '">Offerte come ' + esc(ponte.meta.nome.split(" / ")[0]) + "</button>" : "") + "</div></div>";
    }
    if (e.stato === "na") {
      return '<div class="match na"><p style="margin:0">' + esc(e.req.nota || "In questa regione il ruolo non è conteggiato negli standard del servizio.") + "</p></div>";
    }
    if (e.stato === "unknown") {
      return '<div class="match far"><p>Dicci cosa hai studiato e ti diciamo subito se puoi candidarti.</p><button type="button" class="btn btn-ghost" data-goto2>Indica il tuo titolo</button></div>';
    }
    var req = e.req.accettati.map(function (t) { return TITOLI[t] ? TITOLI[t].label : t; });
    return '<div class="match far"><h5>' + icon("grad") + "Per questo ruolo serve</h5><p>" + esc(req.join(" · ")) + ".</p>" +
      '<div class="match-actions"><button type="button" class="btn btn-ghost" data-percorso="' + m.id + '">Chiedi un orientamento</button></div></div>';
  }

  function bindSheet(s, v) {
    var inner = $("#sheet-inner");
    $("[data-close]", inner).addEventListener("click", function () { closeService(); });
    $$("[data-role]", inner).forEach(function (b) {
      b.addEventListener("click", function () {
        var open = b.getAttribute("aria-expanded") === "true", d = document.getElementById(b.getAttribute("aria-controls"));
        b.setAttribute("aria-expanded", !open); d.hidden = open;
        $(".role-toggle", b).innerHTML = (open ? "Scopri il ruolo" : "Nascondi") + " " + icon("chevron");
      });
    });
    function ctx(rid) { return { servizio: s, ruolo: RUOLI[rid] }; }
    $$("[data-offerte]", inner).forEach(function (b) { b.addEventListener("click", function () { openModal("offerte", ctx(b.getAttribute("data-offerte"))); }); });
    $$("[data-candida]", inner).forEach(function (b) { b.addEventListener("click", function () { openModal("candida", ctx(b.getAttribute("data-candida"))); }); });
    $$("[data-percorso]", inner).forEach(function (b) { b.addEventListener("click", function () { openModal("percorso", ctx(b.getAttribute("data-percorso"))); }); });
    $$("[data-segnala]", inner).forEach(function (b) { b.addEventListener("click", function () { openModal("segnala", ctx(b.getAttribute("data-segnala"))); }); });
    $$("[data-goto2]", inner).forEach(function (b) { b.addEventListener("click", function () { closeService(); goTo(2); $("#orientati").scrollIntoView(); }); });
  }

  // ---------------------------------------------------------------- modali
  function openModal(tipo, c) {
    c = c || {};
    var dlg = $("#modal"), inner = $("#modal-inner");
    var ruolo = c.ruolo, s = c.servizio;
    var ctxLine = ruolo ? esc(ruolo.nome) + (s ? " · " + esc(s.nome) + " · " + esc(s.localita) : "") : "";
    var html = '<button type="button" class="sheet-close" data-mclose aria-label="Chiudi">' + icon("x") + "</button>";
    if (tipo === "offerte") {
      var q = new URLSearchParams({ ruolo: ruolo ? ruolo.id : "", provincia: (s ? s.province : state.province).join(","), settore: s ? s.settore : state.settori.join(",") }).toString();
      html += '<h2 id="modal-title">Offerte aperte</h2>' +
        "<p>Nella versione in produzione questo pulsante apre il portale delle candidature con i filtri già impostati:</p>" +
        '<p class="form-summary"><code>/offerte?' + esc(q) + "</code></p>" +
        "<p>Se non ci sono posizioni aperte in questo momento, proponiamo la candidatura spontanea per lo stesso ruolo e territorio.</p>" +
        '<div class="match-actions"><button type="button" class="btn btn-primary" data-switch="candida">Candidatura spontanea ' + icon("arrow-right") + "</button></div>";
    } else if (tipo === "candida" || tipo === "spontanea" || tipo === "percorso") {
      var titolo = tipo === "percorso" ? "Parliamo del tuo percorso" : "Candidatura spontanea";
      var intro = tipo === "percorso"
        ? "Ti ricontattiamo per orientarti sui percorsi formativi e sui ruoli ponte con cui puoi iniziare a lavorare con noi."
        : "Lasciaci i tuoi riferimenti e il CV: allegheremo le risposte che hai dato nel percorso.";
      html += '<h2 id="modal-title">' + titolo + "</h2><p>" + intro + "</p>" +
        '<form class="form" novalidate data-form="' + tipo + '">' +
        (ctxLine ? '<p class="form-summary">' + ctxLine + "</p>" : "") +
        field("nome", "Nome e cognome", "text", "name") + field("email", "Email", "email", "email") + field("tel", "Telefono", "tel", "tel") +
        (tipo !== "percorso" ? '<div class="field"><label for="f-cv">CV (PDF, max 5 MB)</label><input id="f-cv" name="cv" type="file" accept=".pdf,.doc,.docx"></div>' : "") +
        '<label class="check"><input type="checkbox" name="privacy" required> <span>Ho letto l\'informativa privacy e acconsento al trattamento dei dati per finalità di selezione.</span></label>' +
        '<div class="field" data-err-privacy hidden><span class="err" style="display:block">Serve il consenso per procedere.</span></div>' +
        '<button type="submit" class="btn btn-primary btn-lg">Invia ' + icon("arrow-right") + "</button></form>";
    } else if (tipo === "segnala") {
      html += '<h2 id="modal-title">Segnala una persona</h2><p>Conosci qualcuno che starebbe bene con noi? Raccontacelo: la contatteremo solo se ha già dato il suo consenso.</p>' +
        '<form class="form" novalidate data-form="segnala">' + (ctxLine ? '<p class="form-summary">Ruolo: ' + ctxLine + "</p>" : "") +
        field("nome", "Il tuo nome", "text", "name") + field("email", "La tua email", "email", "email") +
        field("pnome", "Nome della persona che segnali", "text", "off") + field("pcontatto", "Email o telefono della persona", "text", "off") +
        '<label class="check"><input type="checkbox" name="privacy" required> <span>Confermo che la persona è d\'accordo a essere contattata da Società Dolce.</span></label>' +
        '<div class="field" data-err-privacy hidden><span class="err" style="display:block">Serve la conferma per procedere.</span></div>' +
        '<button type="submit" class="btn btn-primary btn-lg">Invia la segnalazione ' + icon("send") + "</button></form>";
    }
    inner.innerHTML = html;
    hydrateIcons(inner);
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }
    $("[data-mclose]", inner).addEventListener("click", closeModal);
    var sw = $("[data-switch]", inner);
    if (sw) sw.addEventListener("click", function () { openModal(sw.getAttribute("data-switch"), c); });
    var form = $("form", inner);
    if (form) {
      var first = $("input", form); if (first) first.focus();
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var ok = true;
        $$(".field", form).forEach(function (f) {
          var inp = $("input", f); if (!inp || inp.type === "file") return;
          var bad = !inp.value.trim() || (inp.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value));
          f.classList.toggle("has-err", bad); inp.setAttribute("aria-invalid", bad);
          if (bad) ok = false;
        });
        var priv = $("input[name=privacy]", form), pe = $("[data-err-privacy]", form);
        pe.hidden = priv.checked; if (!priv.checked) ok = false;
        if (!ok) { var firstBad = $("[aria-invalid=true]", form) || priv; firstBad.focus(); return; }
        track("invio_" + tipo, { ruolo: ruolo ? ruolo.id : "", servizio: s ? s.id : "" });
        inner.innerHTML = '<button type="button" class="sheet-close" data-mclose aria-label="Chiudi">' + icon("x") + '</button><div class="success"><div class="big">' + icon("check") + '</div><h2 id="modal-title">Grazie!</h2><p>' +
          (tipo === "segnala" ? "Abbiamo ricevuto la tua segnalazione. Ti terremo aggiornato/a." : "Abbiamo ricevuto la tua richiesta. Ti risponderemo entro 10 giorni lavorativi.") +
          '</p><p class="form-summary">Prototipo: nessun dato è stato inviato o salvato.</p></div>';
        $("[data-mclose]", inner).addEventListener("click", closeModal);
        $("[data-mclose]", inner).focus();
      });
    }
  }
  function field(name, label, type, ac) {
    return '<div class="field"><label for="f-' + name + '">' + label + '</label><input id="f-' + name + '" name="' + name + '" type="' + type + '" autocomplete="' + ac + '" required><span class="err">Campo obbligatorio' + (type === "email" ? " (inserisci un'email valida)" : "") + "</span></div>";
  }
  function closeModal() { var d = $("#modal"); if (d.close) d.close(); else d.removeAttribute("open"); }

  // ---------------------------------------------------------------- crescita, formazione, storie
  function renderGrowth() {
    var keys = Object.keys(CAT.percorsiCrescita), tabs = $("#growth-tabs"), panel = $("#growth-panel");
    tabs.innerHTML = keys.map(function (k, i) { return '<button type="button" class="tab" role="tab" id="tab-' + k + '" aria-controls="growth-panel" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-tab="' + k + '">' + esc(CAT.percorsiCrescita[k].label) + "</button>"; }).join("");
    function show(k) {
      var p = CAT.percorsiCrescita[k];
      panel.setAttribute("aria-labelledby", "tab-" + k);
      panel.classList.remove("is-visible");
      panel.innerHTML = '<div class="tl-track" aria-hidden="true"><span></span></div><ol class="timeline" style="--n:' + p.tappe.length + '">' + p.tappe.map(function (t, i) { return '<li class="tl-step" style="--i:' + i + '"><span class="n">' + (i + 1) + "</span><h3>" + esc(t) + "</h3></li>"; }).join("") + "</ol>" +
        '<p class="growth-note">' + icon("info") + "<span>" + esc(p.note) + "</span></p>";
      requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.add("is-visible"); }); });
    }
    var btns = $$("[data-tab]", tabs);
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () { btns.forEach(function (x) { x.setAttribute("aria-selected", x === b); x.tabIndex = x === b ? 0 : -1; }); show(b.getAttribute("data-tab")); });
      b.addEventListener("keydown", function (e) {
        var j = e.key === "ArrowRight" ? (i + 1) % btns.length : e.key === "ArrowLeft" ? (i - 1 + btns.length) % btns.length : null;
        if (j !== null) { e.preventDefault(); btns[j].focus(); btns[j].click(); }
      });
    });
    show(keys[0]);
  }
  function renderTraining() {
    $("#training-grid").innerHTML = CAT.formazione.map(function (f) { return '<article class="train-card reveal"><span class="value-icon" data-icon="' + f.icona + '"></span><h3>' + esc(f.titolo) + "</h3><p>" + esc(f.testo) + "</p></article>"; }).join("");
  }
  function renderStories() {
    // incipit di esempio: da sostituire con le frasi reali dei video
    var st = [
      { r: "Educatrice", s: "Nidi e servizi 0-6 · Bologna", q: "Il primo giorno una bambina mi ha preso per mano e non mi ha più lasciata.", c: ["#F5A54A", "#FDEBD7", "#006CB4"] },
      { r: "OSS", s: "Strutture per anziani", q: "Pensavo fosse solo assistenza. Poi ho imparato i nomi, le storie, le canzoni preferite.", c: ["#8DA6D8", "#E4ECF7", "#36549C"] },
      { r: "Educatore", s: "Accoglienza adulti senza dimora", q: "La prima notte in accoglienza ho capito che ascoltare è già un intervento.", c: ["#2E7D5B", "#E2F3EA", "#F5A54A"] },
      { r: "Infermiera", s: "Residenze per la disabilità", q: "Qui la cura non è solo una terapia: è una relazione che costruisci ogni giorno.", c: ["#006CB4", "#BACCE4", "#F5A54A"] },
      { r: "Mediatore interculturale", s: "Territori per il Reinserimento", q: "Parlo quattro lingue, ma la più importante l'ho imparata qui: quella della fiducia.", c: ["#7C6FB0", "#ECE9F8", "#6CA2D2"] }
    ];
    $("#stories-track").innerHTML = st.map(function (x, k) {
      return '<button type="button" class="story-card" style="--tone:' + x.c[0] + ";--tone-2:" + x.c[1] + '" aria-label="Video testimonianza: ' + esc(x.r) + ", " + esc(x.s) + ' (segnaposto)">' +
        storyPieces(x.c, k) +
        '<span class="play">' + icon("play") + "</span><q>" + esc(x.q) + "</q><small>" + esc(x.r) + " · " + esc(x.s) + '</small><span class="ph">Video da girare</span></button>';
    }).join("");
  }
  function storyPieces(c, k) {
    // 3 tasselli per card, colori e disposizione diversi per ognuna
    var layouts = [
      [[62, 24, 0, 1.0], [118, 70, 90, .7], [36, 92, 180, .55]],
      [[96, 20, 270, .85], [46, 64, 0, .75], [120, 104, 90, .5]],
      [[40, 30, 90, .9], [110, 46, 180, .65], [72, 108, 0, .6]],
      [[100, 36, 180, .95], [40, 78, 270, .6], [118, 112, 0, .5]],
      [[56, 18, 0, .8], [120, 60, 270, .8], [50, 100, 90, .55]]
    ][k % 5];
    var fills = [c[1], "#ffffff", c[2]];
    var out = '<svg class="story-pieces" viewBox="0 0 200 200" aria-hidden="true">';
    layouts.forEach(function (l, i) {
      out += '<path d="' + PIECE + '" fill="' + fills[i] + '" transform="translate(' + l[0] + " " + l[1] + ") rotate(" + l[2] + " 50 50) scale(" + l[3] + ')" opacity="' + (i === 1 ? .9 : 1) + '"/>';
    });
    return out + "</svg>";
  }

  // ---------------------------------------------------------------- effetti globali
  function observe() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach(function (n) { n.classList.add("is-visible"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-visible");
        $$("[data-count]", en.target).forEach(countUp);
        if (en.target.matches("[data-count]")) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach(function (n) { io.observe(n); });
    // nav attiva
    var links = $$(".main-nav a");
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) links.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["perche", "orientati", "crescita", "formazione", "storie"].forEach(function (id) { var s = document.getElementById(id); if (s) io2.observe(s); });
  }
  function parallax() {
    if (REDUCED) return;
    var els = $$("[data-parallax]"), ticking = false, header = $(".site-header");
    window.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        els.forEach(function (el) { el.style.transform = "translate3d(0," + (y * +el.getAttribute("data-parallax")).toFixed(1) + "px,0)"; });
        header.classList.toggle("is-scrolled", y > 8);
        ticking = false;
      });
    }, { passive: true });
  }

  function globalActions() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("[data-action]");
      if (!a) return;
      var act = a.getAttribute("data-action");
      if (act === "offerte") { e.preventDefault(); openModal("offerte", {}); }
      if (act === "spontanea") openModal("spontanea", {});
      if (act === "segnala") openModal("segnala", {});
      if (act === "start") { track("cta_inizia"); }
      closeMenu();
    });
    $(".progress").addEventListener("click", function (e) { var b = e.target.closest("[data-goto]"); if (b && !b.disabled) goTo(+b.getAttribute("data-goto")); });
    $("#sheet-backdrop").addEventListener("click", function () { closeService(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("#sheet").hidden && !$("#modal").open) closeService();
      if (e.key === "Tab" && !$("#sheet").hidden && !$("#modal").open) trapFocus(e, $("#sheet"));
    });
    window.addEventListener("popstate", routeFromHash);
    var tg = $(".menu-toggle"), mn = $("#mobile-nav");
    tg.addEventListener("click", function () { var open = tg.getAttribute("aria-expanded") === "true"; tg.setAttribute("aria-expanded", !open); mn.hidden = open; });
    $$("a", mn).forEach(function (a) { a.addEventListener("click", closeMenu); });
    function closeMenu() { tg.setAttribute("aria-expanded", "false"); mn.hidden = true; }
  }
  function setHash(h) {
    // deep link condivisibile: solo lettere, cifre e trattini (es. #servizio-csrd-...-bo)
    try { history.pushState(null, "", h); } catch (err) { /* frame senza history: si ignora */ }
  }
  function trapFocus(e, root) {
    var f = $$('button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])', root).filter(function (n) { return !n.disabled && n.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function routeFromHash() {
    var h = location.hash;
    if (h.indexOf("#servizio-") === 0) {
      if (state.step !== 5) { state.step = 5; renderProgress(); renderResults(); }
      openService(h.slice(10));
    } else closeService(true);
  }

  // ---------------------------------------------------------------- avvio
  document.documentElement.classList.remove("no-js");
  document.documentElement.lang = "it";
  hydrateIcons();
  heroNet();
  stats();
  renderTraining();
  renderStories();
  renderGrowth();
  hydrateIcons();
  goTo(1, { silent: true });
  observe();
  parallax();
  globalActions();
  if (location.hash.indexOf("#servizio-") === 0) routeFromHash();

  // esposto per test e per la documentazione
  window.SD_LCN = { state: state, valuta: valuta, requisiti: requisiti, serviziFiltrati: serviziFiltrati, goTo: goTo, openService: openService };
})();
