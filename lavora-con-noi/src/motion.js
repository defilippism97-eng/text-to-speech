/* Società Dolce – "Lavora con noi" · livello di movimento
   Un solo filo narrativo in tutta la pagina: il tassello. Si incastra nella hero,
   ritorna come motivo nelle sezioni e si ricompone nella CTA finale.
   Con prefers-reduced-motion la pagina resta completa e ferma. */
(function () {
  "use strict";
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PIECE = "M0 0H38a12 12 0 1 0 24 0H100V38a12 12 0 1 1 0 24V100H0V62a12 12 0 1 0 0-24Z";
  var BLUES = ["#006CB4", "#6CA2D2", "#BACCE4", "#36549C"];
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function piece(fill, extra) { return '<path d="' + PIECE + '" fill="' + fill + '"' + (extra || "") + "/>"; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ------------------------------------------------------------ 1. Hero: i tasselli si aprono sulla foto
  function heroIntro() {
    var fig = $(".hero-media");
    if (!fig) return;
    var quad = [[0, 0, 0], [100, 0, 90], [0, 100, 270], [100, 100, 180]];
    var svg = '<svg class="hero-pieces" viewBox="-14 -14 228 228" preserveAspectRatio="none" aria-hidden="true">';
    quad.forEach(function (q, i) {
      svg += '<g class="hp hp-' + i + '"><g transform="translate(' + (q[0] + 50) + " " + (q[1] + 50) + ") rotate(" + q[2] + ') translate(-50 -50)">' + piece(BLUES[i]) + "</g></g>";
    });
    svg += "</svg>";
    fig.insertAdjacentHTML("beforeend", svg + '<span class="hero-light" aria-hidden="true"></span>');
    if (REDUCED) { fig.classList.add("is-open"); return; }
    // "click" dell'incastro, poi apertura
    setTimeout(function () { fig.classList.add("is-click"); }, 250);
    setTimeout(function () { fig.classList.add("is-open"); }, 700);
  }

  // titolo: parole che salgono in sequenza
  function splitWords(el, cls) {
    if (!el) return;
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            var s = document.createElement("span");
            s.className = cls; s.style.setProperty("--w", i++); s.textContent = w;
            frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.hasAttribute("data-icon")) walk(n);
      });
    })(el);
    return i;
  }

  // ------------------------------------------------------------ 2. Manifesto: le parole si accendono con lo scroll
  var manifestoWords = [];
  function manifestoSetup() {
    var t = $(".manifesto-title");
    if (!t) return;
    splitWords(t, "mw");
    manifestoWords = $$(".mw", t);
    t.classList.add("is-scrolly");
  }
  function manifestoUpdate(vh) {
    if (!manifestoWords.length) return;
    var t = manifestoWords[0].parentNode.closest(".manifesto-title");
    var r = t.getBoundingClientRect();
    var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
    var n = Math.round(p * manifestoWords.length);
    manifestoWords.forEach(function (w, i) { w.classList.toggle("on", i < n); });
  }

  // ------------------------------------------------------------ 3. Ticker: settori e professioni in movimento
  function ticker() {
    var host = $(".numbers .container");
    var D = window.SD_DATI;
    if (!host || !D) return;
    var settori = D.catalogo.settori.map(function (s) { return s.label; });
    var prof = D.catalogo.ruoli.filter(function (r) { return r.peso >= 7; }).map(function (r) { return r.nome.split(" – ")[0].split(" / ")[0]; });
    function row(words, dir) {
      var item = words.map(function (w) { return "<span>" + w + "</span><i aria-hidden=\"true\"></i>"; }).join("");
      return '<div class="tk-row ' + dir + '"><div class="tk-track">' + item + item + "</div></div>";
    }
    host.insertAdjacentHTML("beforeend", '<div class="ticker" aria-hidden="true">' + row(settori, "l") + row(prof, "r") + "</div>");
  }

  // ------------------------------------------------------------ 4. Orientamento: tasselli che fluttuano nel blu
  function ambientPieces() {
    var sec = $(".orient");
    if (!sec) return;
    var html = '<div class="ambient" aria-hidden="true">';
    var spots = [[4, 10, 70, 18, 0], [88, 6, 110, 26, -6], [70, 38, 56, 22, -3], [12, 55, 90, 30, -9], [92, 62, 64, 20, -12], [40, 4, 46, 24, -15], [55, 84, 80, 28, -4], [2, 88, 52, 19, -8]];
    spots.forEach(function (s, i) {
      html += '<svg class="amb" style="left:' + s[0] + "%;top:" + s[1] + "%;width:" + s[2] + "px;--dur:" + s[3] + "s;--del:" + s[4] + "s;--rot:" + (i * 37) + 'deg" viewBox="-14 -14 128 128">' + piece("currentColor") + "</svg>";
    });
    sec.insertAdjacentHTML("afterbegin", html + "</div>");
  }

  // ------------------------------------------------------------ 5. Crescita: la linea avanza con lo scroll
  function growthUpdate(vh) {
    var tl = $("#growth-panel .timeline");
    if (!tl) return;
    var r = tl.getBoundingClientRect();
    var p = clamp((vh * 0.8 - r.top) / (r.height + vh * 0.3), 0, 1);
    tl.style.setProperty("--p", p.toFixed(3));
    var steps = $$(".tl-step", tl);
    steps.forEach(function (s, i) { s.classList.toggle("is-on", p >= (i + 0.2) / steps.length); });
  }

  // ------------------------------------------------------------ 6. Formazione: card con luce che segue il puntatore
  function spotlight() {
    if (REDUCED || !window.matchMedia("(hover: hover)").matches) return;
    $$(".train-card, .value-card").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        c.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        c.style.setProperty("--rx", ((0.5 - y) * 6).toFixed(2) + "deg");
        c.style.setProperty("--ry", ((x - 0.5) * 8).toFixed(2) + "deg");
      });
      c.addEventListener("pointerleave", function () { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
    });
  }

  // ------------------------------------------------------------ 7. Storie: ogni mano della foto è una storia
  function storyCrops() {
    var img = $(".hero-media img");
    if (img) document.documentElement.style.setProperty("--hero-img", 'url("' + (img.currentSrc || img.src) + '")');
    var crops = ["42% 18%", "78% 30%", "48% 92%", "86% 78%", "60% 50%"];
    $$(".story-card").forEach(function (c, i) { c.style.setProperty("--crop", crops[i % crops.length]); c.classList.add("has-photo"); });
  }

  // ------------------------------------------------------------ 8. CTA finale: il tuo tassello si incastra
  function finalPuzzle() {
    var grid = $(".final-grid");
    if (!grid) return;
    var quad = [[0, 0, 0, "#6CA2D2"], [100, 0, 90, "#BACCE4"], [0, 100, 270, "#ffffff"], [100, 100, 180, "#F5A54A"]];
    var svg = '<svg class="final-puzzle" viewBox="-20 -20 240 240" aria-hidden="true">';
    quad.forEach(function (q, i) {
      svg += '<g class="fp fp-' + i + '"><g transform="translate(' + (q[0] + 50) + " " + (q[1] + 50) + ") rotate(" + q[2] + ') translate(-50 -50)">' + piece(q[3]) + "</g></g>";
    });
    grid.insertAdjacentHTML("afterbegin", svg + "</svg>");
    var sec = grid.closest(".final-cta");
    if (REDUCED || !("IntersectionObserver" in window)) { sec.classList.add("is-in"); return; }
    new IntersectionObserver(function (en, io) {
      en.forEach(function (e) { if (e.isIntersecting) { sec.classList.add("is-in"); io.disconnect(); } });
    }, { threshold: 0.45 }).observe(sec);
  }

  // ------------------------------------------------------------ barra di avanzamento + scroll legato
  function scrollLoop() {
    var bar = document.createElement("span");
    bar.className = "scroll-progress"; bar.setAttribute("aria-hidden", "true");
    var header = $(".site-header");
    if (header) header.appendChild(bar);
    var media = $(".hero-media");
    var ticking = false;
    function frame() {
      var vh = window.innerHeight, y = window.scrollY, max = document.documentElement.scrollHeight - vh;
      bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0).toFixed(4) + ")";
      if (!REDUCED) {
        if (media) media.style.setProperty("--sy", Math.min(y, vh).toFixed(0));
        manifestoUpdate(vh);
        growthUpdate(vh);
      }
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    window.addEventListener("resize", frame);
    // la timeline viene ridisegnata al cambio tab
    var gp = $("#growth-panel");
    if (gp && "MutationObserver" in window) new MutationObserver(function () { requestAnimationFrame(frame); }).observe(gp, { childList: true });
    frame();
  }

  // ------------------------------------------------------------ avvio
  heroIntro();
  if (!REDUCED) {
    splitWords($("#hero-title"), "hw");
    $("#hero-title").classList.add("is-split");
    manifestoSetup();
  }
  ticker();
  ambientPieces();
  spotlight();
  storyCrops();
  finalPuzzle();
  scrollLoop();
})();
