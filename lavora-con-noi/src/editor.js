/* Società Dolce – "Lavora con noi" · versione di revisione dei testi
   Attiva solo con window.SD_EDITOR = true (dist/lavora-con-noi.editor.html).
   Ogni testo della pagina si può correggere nel punto in cui compare: la proposta viene salvata
   con il suo contesto (sezione › settore › territorio › servizio › mansione) nel database condiviso
   della pagina (capability `db`), applicata in anteprima per tutti ed esportabile in CSV/JSON.

   Con window.SD_EDITOR_MODE = "locale" (versione da pubblicare su un sito qualsiasi, es. Netlify)
   le proposte restano nel browser di chi le scrive (localStorage) e si esportano in un file da inviare
   per email: stessa interfaccia, stesso modello dati, nessun account richiesto.

   Collezioni:
     modifiche/<id>   la proposta in vigore per un testo (id = hash di contesto + testo originale)
     registro/<auto>  ogni salvataggio e ripristino, per lo storico                              */
(function () {
  "use strict";
  if (!window.SD_EDITOR) return;

  var CTX = ["sezione", "passo", "settore", "territorio", "servizio", "mansione", "percorso", "area", "storia", "finestra"];
  var CTX_LABEL = { sezione: "Sezione", passo: "Passo", settore: "Settore", territorio: "Territorio", servizio: "Servizio", mansione: "Mansione", percorso: "Percorso di crescita", area: "Area formativa", storia: "Storia", finestra: "Finestra" };
  var FMT = "strong,b,em,i,u,br,code,span.hl";
  var SKIP = "script,style,svg,noscript,textarea,input,select,option,.ed-ui,[aria-hidden='true'] svg";

  var LOCALE = window.SD_EDITOR_MODE === "locale";
  // condivisa (claude.ai): flusso di approvazione · locale: priorità indicata da chi propone
  var STATI = LOCALE ? { opzionale: "Opzionale", importante: "Importante" } : { proposta: "Proposta", rivedere: "Da rivedere", approvata: "Approvata" };
  var STATO_BASE = LOCALE ? "opzionale" : "proposta";
  var STATO_NOME = LOCALE ? "Priorità" : "Stato";
  var EMAIL = window.SD_EDITOR_EMAIL || "marco.defilippis@societadolce.it";
  var db = null, user = null, downloads = null;
  var canWrite = false, myId = null;
  var overrides = {};          // id -> documento in modifiche
  var editMode = false, showOriginal = false;
  var names = {};               // id utente -> nome
  var statusMsg = "Collegamento al salvataggio condiviso…";

  // ------------------------------------------------------------ utilità
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function norm(t) { return String(t).replace(/\s+/g, " ").trim(); }
  function hash(str) { // FNV-1a a 2 x 32 bit -> 16 cifre esadecimali
    var h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x5bd1e995;
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
      h2 = Math.imul(h2 ^ c, 2246822519) >>> 0;
    }
    return ("0000000" + h1.toString(16)).slice(-8) + ("0000000" + h2.toString(16)).slice(-8);
  }
  function quando(iso) {
    try { return new Date(iso).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso || ""; }
  }
  function nome(id) { return id ? (names[id] || "Collega") : "—"; }
  async function risolviNomi(ids) {
    if (!user || !user.profiles) return;
    var mancanti = ids.filter(function (id) { return id && !(id in names); });
    if (!mancanti.length) return;
    try {
      var ps = await user.profiles(mancanti);
      mancanti.forEach(function (id) { names[id] = (ps && ps[id] && ps[id].name) || "Collega"; });
    } catch (e) { /* i nomi restano generici */ }
  }

  // ------------------------------------------------------------ archivio locale (versione «locale»)
  var LS_KEY = "sd-lcn-revisione-testi-v1";
  var local = null;
  function creaArchivioLocale() {
    var mem = null, persistente = true;
    try { mem = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { mem = null; }
    if (!mem || typeof mem !== "object" || !mem.docs) mem = { docs: {}, autore: "", daEsportare: false, ultimoExport: "" };
    function salvaMem() { try { localStorage.setItem(LS_KEY, JSON.stringify(mem)); persistente = true; } catch (e) { persistente = false; } }
    salvaMem();
    var subs = [];
    var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
    var snapDoc = function (id, data) { return { id: id, exists: !!data, data: function () { return data && clone(data); }, metadata: { fromCache: false, hasPendingWrites: false } }; };
    function notifica() { salvaMem(); subs.forEach(function (f) { f(); }); }
    function coll(path) {
      function chiavi() { return Object.keys(mem.docs).filter(function (k) { return k.indexOf(path + "/") === 0; }); }
      function query(filtri, ordine, lim) {
        var q = {
          where: function (f, op, v) { return query(filtri.concat([[f, op, v]]), ordine, lim); },
          orderBy: function (f, d) { return query(filtri, [f, d || "asc"], lim); },
          limit: function (n) { return query(filtri, ordine, n); },
          get: function () {
            var ks = chiavi().filter(function (k) { return filtri.every(function (w) { return w[1] !== "==" || mem.docs[k][w[0]] === w[2]; }); });
            if (ordine) ks.sort(function (a, b) { var x = mem.docs[a][ordine[0]] || "", y = mem.docs[b][ordine[0]] || ""; return (x > y ? 1 : x < y ? -1 : 0) * (ordine[1] === "desc" ? -1 : 1); });
            var docs = ks.slice(0, lim).map(function (k) { return snapDoc(k.slice(path.length + 1), mem.docs[k]); });
            return Promise.resolve({ docs: docs, size: docs.length, empty: !docs.length, docChanges: function () { return []; }, metadata: { fromCache: false, hasPendingWrites: false } });
          },
          onSnapshot: function (next) { var run = function () { q.get().then(next); }; subs.push(run); run(); return function () { subs = subs.filter(function (f) { return f !== run; }); }; },
        };
        return q;
      }
      var q = query([], null, 1000);
      q.path = path;
      q.doc = function (id) {
        return {
          id: id, path: path + "/" + id,
          get: function () { return Promise.resolve(snapDoc(id, mem.docs[path + "/" + id])); },
          set: function (d) { mem.docs[path + "/" + id] = clone(d); notifica(); return Promise.resolve(); },
          delete: function () { delete mem.docs[path + "/" + id]; notifica(); return Promise.resolve(); },
        };
      };
      q.add = function (d) { var id = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); mem.docs[path + "/" + id] = clone(d); notifica(); return Promise.resolve({ id: id }); };
      return q;
    }
    return {
      mem: mem, salvaMem: salvaMem, persistente: function () { return persistente; },
      caps: {
        db: { collection: coll },
        user: { id: function () { return Promise.resolve(mem.autore || null); }, can: function () { return Promise.resolve(true); }, profiles: function (ids) { var o = {}; ids.forEach(function (i) { o[i] = { id: i, name: i }; }); return Promise.resolve(o); } },
        downloads: {
          save: function (r) {
            var blob = new Blob([r.data], { type: /\.json$/.test(r.filename) ? "application/json" : "text/csv;charset=utf-8" });
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob); a.download = r.filename; a.className = "ed-ui"; a.hidden = true;
            document.body.appendChild(a); a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
            return Promise.resolve({ status: "saved" });
          },
        },
      },
    };
  }
  if (LOCALE) local = creaArchivioLocale();
  function segnaDaEsportare() { if (!local) return; local.mem.daEsportare = true; local.salvaMem(); refreshBar(); }
  function segnaEsportato() { if (!local) return; local.mem.daEsportare = false; local.mem.ultimoExport = new Date().toISOString(); local.salvaMem(); refreshBar(); }
  // avviso se si lascia la pagina con proposte non esportate
  window.addEventListener("beforeunload", function (e) {
    if (local && local.mem.daEsportare) { e.preventDefault(); e.returnValue = ""; return ""; }
  });

  // ------------------------------------------------------------ unità di testo
  function ownText(el) {
    var out = "";
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3) out += n.nodeValue;
      else if (n.nodeType === 1 && n.matches(FMT)) out += n.tagName === "BR" ? " " : n.textContent;
      else if (n.nodeType === 1) out += " ";
    });
    return norm(out);
  }
  function hasOwnText(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.trim()) return true;
      if (n.nodeType === 1 && n.matches(FMT) && n.tagName !== "BR" && n.textContent.trim()) return true;
    }
    return false;
  }
  function skippable(el) { return !el || el.nodeType !== 1 || !!el.closest(SKIP) || el.closest("svg"); }
  function isUnit(el) {
    if (skippable(el) || !hasOwnText(el)) return false;
    if (el.matches(FMT) && el.parentElement && hasOwnText(el.parentElement)) return false; // fa parte del testo del genitore
    return true;
  }
  function unitFor(node) {
    var el = node && node.nodeType === 3 ? node.parentElement : node;
    while (el && el !== document.body) {
      if (skippable(el)) return null;
      if (hasOwnText(el)) {
        while (el.matches(FMT) && el.parentElement && hasOwnText(el.parentElement)) el = el.parentElement;
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }
  function ctxOf(el) {
    var c = {}, servizioId = "";
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      CTX.forEach(function (f) { if (!(f in c) && n.hasAttribute("data-ctx-" + f)) c[f] = n.getAttribute("data-ctx-" + f); });
      if (!servizioId && n.hasAttribute("data-ctx-servizio-id")) servizioId = n.getAttribute("data-ctx-servizio-id");
    }
    return { ctx: c, servizioId: servizioId };
  }
  function ctxLabel(c) {
    return CTX.filter(function (f) { return c[f]; }).map(function (f) { return c[f]; }).join(" › ");
  }
  function tipoElemento(el) {
    var t = el.tagName;
    if (/^H[1-6]$/.test(t)) return "Titolo";
    if (t === "BUTTON" || t === "A") return "Pulsante o link";
    if (t === "LI") return "Voce di elenco";
    if (t === "LABEL") return "Etichetta";
    if (t === "Q") return "Citazione";
    if (t === "SUMMARY") return "Intestazione espandibile";
    if (t === "P") return "Paragrafo";
    return "Testo breve";
  }
  // testo originale dell'unità (anche quando mostra una proposta)
  function origOf(el) {
    var cur = ownText(el);
    if (el.dataset.edOrig != null) {
      if (cur === el.dataset.edApplied || cur === el.dataset.edOrig) return el.dataset.edOrig;
      // la pagina ha riscritto l'elemento: l'originale è il nuovo testo
      delete el.dataset.edOrig; delete el.dataset.edApplied; el.__edHTML = null;
      el.classList.remove("ed-changed");
    }
    return cur;
  }
  function info(el) {
    var orig = origOf(el), c = ctxOf(el);
    var key = JSON.stringify([CTX.map(function (f) { return c.ctx[f] || ""; }), orig]);
    return { el: el, orig: orig, ctx: c.ctx, servizioId: c.servizioId, key: key, id: "t" + hash(key), label: ctxLabel(c.ctx), elemento: tipoElemento(el) };
  }
  function replaceOwn(el, text) {
    var own = [];
    el.childNodes.forEach(function (n) { if (n.nodeType === 3 || (n.nodeType === 1 && n.matches(FMT))) own.push(n); });
    var t = document.createTextNode(text);
    var firstText = own.filter(function (n) { return n.nodeType !== 3 || n.nodeValue.trim(); })[0] || own[0];
    if (firstText) el.insertBefore(t, firstText); else el.appendChild(t);
    own.forEach(function (n) { if (n.parentNode === el) el.removeChild(n); });
    // spazio tra il testo e un'eventuale icona che segue
    if (t.nextSibling && t.nextSibling.nodeType === 1) t.nodeValue = text + " ";
  }

  // ------------------------------------------------------------ anteprima delle proposte
  var applying = false;
  function applyTo(el) {
    var i = info(el);
    var o = overrides[i.id];
    el.dataset.edId = i.id;
    var vuoi = o && !showOriginal && norm(o.testo) !== i.orig ? o.testo : null;
    if (vuoi != null) {
      if (el.dataset.edApplied !== vuoi) {
        if (el.dataset.edOrig == null) { el.__edHTML = el.innerHTML; el.dataset.edOrig = i.orig; }
        replaceOwn(el, vuoi);
        el.dataset.edApplied = vuoi;
      }
      el.classList.add("ed-changed");
      el.classList.toggle("ed-ok", o.stato === "approvata");
      el.classList.toggle("ed-imp", o.stato === "importante");
    } else {
      if (el.dataset.edOrig != null) {
        if (el.__edHTML != null) el.innerHTML = el.__edHTML; else replaceOwn(el, el.dataset.edOrig);
        delete el.dataset.edOrig; delete el.dataset.edApplied; el.__edHTML = null;
      }
      el.classList.remove("ed-changed", "ed-ok", "ed-imp");
    }
    el.classList.toggle("ed-pending", !!(o && showOriginal));
  }
  function applyAll(root) {
    applying = true;
    var r = root || document.body;
    var list = [r].concat(Array.prototype.slice.call(r.querySelectorAll("*")));
    list.forEach(function (el) { if (isUnit(el)) applyTo(el); });
    applying = false;
  }
  var pending = false;
  function scheduleApply() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; applyAll(); });
  }
  new MutationObserver(function (muts) {
    if (applying) return;
    for (var i = 0; i < muts.length; i++) {
      var t = muts[i].target;
      if (t.nodeType === 1 && t.closest(".ed-ui")) continue;
      if (t.nodeType === 3 && t.parentElement && t.parentElement.closest(".ed-ui")) continue;
      scheduleApply(); return;
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  // ------------------------------------------------------------ interfaccia
  var ui = document.createElement("div");
  ui.className = "ed-ui";
  var strip = document.createElement("div");
  strip.className = "ed-ui ed-strip"; strip.setAttribute("role", "note");
  strip.innerHTML = LOCALE
    ? "<b>Revisione dei testi.</b> Attiva «Modifica testi», clicca un testo e scrivi la tua proposta: resta salvata in questo browser. Quando hai finito premi «Esporta» e invia il file a <b>" + EMAIL + "</b>. Per usare la pagina disattiva la modalità (tasto E); anche senza modalità, Alt+clic su un testo lo apre in modifica."
    : "<b>Revisione dei testi.</b> Attiva «Modifica testi», clicca un testo e scrivi la tua proposta: viene salvata nel suo contesto, la vedono tutti e si esporta in Excel. Per usare la pagina disattiva la modalità (tasto E); anche senza modalità, Alt+clic su un testo lo apre in modifica.";
  document.body.insertBefore(strip, document.body.firstChild);
  ui.innerHTML =
    '<div class="ed-bar" role="toolbar" aria-label="Revisione dei testi">' +
      '<button type="button" class="ed-btn ed-main" data-ed="mode" aria-pressed="false">✎ <span>Modifica testi</span></button>' +
      '<button type="button" class="ed-btn" data-ed="view" aria-pressed="false" title="Confronta con i testi originali"><span>Vedi originale</span></button>' +
      '<button type="button" class="ed-btn" data-ed="list"><span>Proposte</span> <b class="ed-count">0</b></button>' +
      '<button type="button" class="ed-btn" data-ed="export"><span>Esporta</span></button>' +
      '<span class="ed-status" aria-live="polite"></span>' +
    "</div>" +
    '<div class="ed-ui ed-pop" role="dialog" aria-modal="false" aria-labelledby="ed-pop-title" hidden></div>' +
    '<aside class="ed-ui ed-panel" role="dialog" aria-labelledby="ed-panel-title" hidden></aside>' +
    '<div class="ed-toast" role="status" aria-live="polite" hidden></div>';
  document.body.appendChild(ui);
  var bar = $(".ed-bar", ui), pop = $(".ed-pop", ui), panel = $(".ed-panel", ui), toast = $(".ed-toast", ui);

  // finestre <dialog> aperte: il resto della pagina non riceve clic, quindi la barra le segue
  function ospita() {
    var aperto = Array.prototype.slice.call(document.querySelectorAll("dialog[open]")).pop();
    var dest = aperto || document.body;
    if (ui.parentNode !== dest) dest.appendChild(ui);
  }
  var obsDialog = new MutationObserver(ospita);
  document.querySelectorAll("dialog").forEach(function (d) { obsDialog.observe(d, { attributes: true, attributeFilter: ["open"] }); });
  function setStatus(t) { statusMsg = t; var n = $(".ed-status", ui); if (n) n.textContent = t; }
  function showToast(t) {
    toast.textContent = t; toast.hidden = false;
    clearTimeout(showToast.t); showToast.t = setTimeout(function () { toast.hidden = true; }, 3200);
  }
  function refreshBar() {
    $('[data-ed="mode"]', bar).setAttribute("aria-pressed", editMode);
    $('[data-ed="view"]', bar).setAttribute("aria-pressed", showOriginal);
    $('[data-ed="view"] span', bar).textContent = showOriginal ? "Vedi proposte" : "Vedi originale";
    $(".ed-count", bar).textContent = Object.keys(overrides).length;
    if (local) {
      var da = local.mem.daEsportare;
      $('[data-ed="export"]', bar).classList.toggle("ed-attn", da);
      setStatus(da ? "Proposte non ancora esportate" : (local.mem.ultimoExport ? "Esportate il " + quando(local.mem.ultimoExport) : ""));
    }
    document.body.classList.toggle("ed-on", editMode);
  }
  function toggleMode(v) {
    editMode = v == null ? !editMode : v;
    refreshBar();
    showToast(editMode ? "Modalità modifica attiva: clicca un testo." : "Modalità navigazione: puoi usare la pagina normalmente.");
  }

  bar.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ed]");
    if (!b) return;
    var a = b.getAttribute("data-ed");
    if (a === "mode") toggleMode();
    if (a === "view") { showOriginal = !showOriginal; refreshBar(); applyAll(); }
    if (a === "list") openPanel();
    if (a === "export") openExport();
  });
  document.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input,textarea,select,[contenteditable]")) return;
    if ((e.key === "e" || e.key === "E") && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggleMode(); }
    if (e.key === "Escape" && !pop.hidden) closePop();
  });

  // evidenziazione al passaggio
  var hovered = null;
  document.addEventListener("pointerover", function (e) {
    if (!editMode && !e.altKey) { if (hovered) hovered.classList.remove("ed-hover"); hovered = null; return; }
    var u = unitFor(e.target);
    if (u === hovered) return;
    if (hovered) hovered.classList.remove("ed-hover");
    hovered = u;
    if (u) u.classList.add("ed-hover");
  });
  // clic: in modalità modifica (o con Alt) apre la finestra invece di eseguire l'azione
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(".ed-ui")) return;
    if (!editMode && !e.altKey) return;
    var u = unitFor(e.target);
    if (!u) return;
    e.preventDefault(); e.stopPropagation();
    openPop(u);
  }, true);

  // ------------------------------------------------------------ finestra di modifica
  var current = null;
  function daProposta(id) {
    var o = overrides[id];
    return o ? { el: null, orig: o.originale, ctx: o.ctx || {}, servizioId: o.servizioId || "", key: o.k, id: id, label: o.contesto || "", elemento: o.elemento || "Testo" } : null;
  }
  function openPop(el, idProposta) {
    var i = el ? info(el) : daProposta(idProposta);
    if (!i) return;
    var o = overrides[i.id];
    current = i;
    document.querySelectorAll(".ed-target").forEach(function (n) { n.classList.remove("ed-target"); });
    if (el) el.classList.add("ed-target");
    var formattato = !!(el && el.querySelector(FMT.split(",").filter(function (s) { return s !== "br"; }).join(",")));
    var chips = CTX.filter(function (f) { return i.ctx[f]; }).map(function (f) { return '<li><span>' + CTX_LABEL[f] + "</span>" + esc(i.ctx[f]) + "</li>"; }).join("");
    pop.innerHTML =
      '<div class="ed-pop-head"><h2 id="ed-pop-title">' + (o ? "Modifica la proposta" : "Modifica testo") + '</h2><button type="button" class="ed-x" data-pop="close" aria-label="Chiudi">×</button></div>' +
      '<ul class="ed-ctx">' + chips + '<li><span>Elemento</span>' + esc(i.elemento) + "</li></ul>" +
      '<p class="ed-lab">Testo originale</p><blockquote class="ed-orig">' + esc(i.orig) + "</blockquote>" +
      (o ? '<p class="ed-meta">Proposta attuale di <b data-uid="' + esc(o.autore) + '">' + esc(nome(o.autore)) + "</b> · " + esc(quando(o.quando)) + ' · <span class="ed-stato ed-' + esc(o.stato || STATO_BASE) + '">' + esc(STATI[o.stato] || STATI[STATO_BASE]) + "</span></p>" : "") +
      '<label class="ed-lab" for="ed-text">La tua proposta</label>' +
      '<textarea id="ed-text" rows="4">' + esc(o ? o.testo : i.orig) + "</textarea>" +
      (formattato ? '<p class="ed-hint">Il testo originale ha parti evidenziate: nell\'anteprima la proposta appare come testo semplice.</p>' : "") +
      '<div class="ed-row"><div><label class="ed-lab" for="ed-nota">Nota per chi rivede (facoltativa)</label><input id="ed-nota" type="text" value="' + esc(o ? o.nota || "" : "") + '" placeholder="Es. dato da verificare con il coordinatore"></div>' +
      '<div><label class="ed-lab" for="ed-stato">' + STATO_NOME + '</label><select id="ed-stato">' + Object.keys(STATI).map(function (k) { return '<option value="' + k + '"' + ((o ? o.stato || STATO_BASE : STATO_BASE) === k ? " selected" : "") + ">" + STATI[k] + "</option>"; }).join("") + "</select></div></div>" +
      (local && !local.mem.autore ? '<label class="ed-lab" for="ed-autore">Il tuo nome e cognome</label><input id="ed-autore" type="text" autocomplete="name" placeholder="Compare nel file che invierai"><p class="ed-hint">Lo chiediamo solo la prima volta: serve a riconoscere le tue proposte nel file esportato.</p>' : "") +
      (canWrite ? "" : '<p class="ed-hint ed-warn">' + esc(db ? "Puoi vedere le proposte ma non salvarne: serve il ruolo Contributor o superiore sulla pagina." : "Il salvataggio condiviso non è disponibile in questa vista: apri la pagina su claude.ai con il tuo account.") + "</p>") +
      '<div class="ed-actions">' +
        '<button type="button" class="ed-btn ed-main" data-pop="save"' + (canWrite ? "" : " disabled") + ">" + (o ? "Salva le modifiche" : "Salva proposta") + "</button>" +
        (o ? '<button type="button" class="ed-btn ed-danger" data-pop="revert"' + (canWrite ? "" : " disabled") + ' title="Cancella la proposta e torna al testo originale">Elimina proposta</button>' : "") +
        '<button type="button" class="ed-btn ed-ghost" data-pop="close">Annulla</button>' +
      "</div>" +
      '<div class="ed-hist"><p class="ed-lab">Storico di questo testo</p><ol class="ed-hist-list"><li class="ed-muted">' + (db ? "Caricamento…" : "Non disponibile") + "</li></ol></div>";
    var dlg = el ? el.closest("dialog[open]") : null;
    (dlg || ui).appendChild(pop);
    pop.hidden = false;
    var ta = $("#ed-text", pop);
    if ($("#ed-autore", pop)) { $("#ed-autore", pop).focus(); } else ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
    if (o) risolviNomi([o.autore]).then(function () { var b = $("[data-uid]", pop); if (b) b.textContent = nome(o.autore); });
    caricaStorico(i.id);
  }
  function closePop() {
    pop.hidden = true; current = null;
    if (pop.parentNode !== ui) ui.appendChild(pop);
    document.querySelectorAll(".ed-target").forEach(function (n) { n.classList.remove("ed-target"); });
  }
  pop.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pop]");
    if (!b) return;
    var a = b.getAttribute("data-pop");
    if (a === "close") closePop();
    if (a === "save") salva();
    if (a === "revert") ripristina();
  });
  async function caricaStorico(id) {
    var ol = $(".ed-hist-list", pop);
    if (!db) return;
    try {
      var snap = await db.collection("registro").where("k", "==", id).orderBy("quando", "desc").limit(20).get();
      if (!current || current.id !== id) return;
      var rows = snap.docs.map(function (d) { return d.data(); });
      await risolviNomi(rows.map(function (r) { return r.autore; }));
      ol.innerHTML = rows.length ? rows.map(function (r) {
        return "<li><b>" + esc(nome(r.autore)) + "</b> · " + esc(quando(r.quando)) + " · " + (r.azione === "ripristino" ? "ha ripristinato l'originale" : "ha proposto: <q>" + esc(r.dopo) + "</q>") + (r.nota ? ' <span class="ed-muted">(' + esc(r.nota) + ")</span>" : "") + "</li>";
      }).join("") : '<li class="ed-muted">Nessuna modifica finora.</li>';
    } catch (e) { ol.innerHTML = '<li class="ed-muted">Storico non disponibile.</li>'; }
  }
  function erroreScrittura(e) {
    if (e && e.code === "invalid_argument") { canWrite = false; showToast("Non hai i permessi per salvare: serve il ruolo Contributor o superiore."); }
    else if (e && e.code === "quota_exceeded") showToast("Spazio di salvataggio esaurito: esporta le proposte e chiedi di archiviare lo storico.");
    else showToast("Salvataggio non riuscito, riprova tra poco.");
  }
  async function salva() {
    if (!current || !db || !canWrite) return;
    var i = current, testo = norm($("#ed-text", pop).value), nota = norm($("#ed-nota", pop).value), stato = $("#ed-stato", pop).value;
    if (!testo) { showToast("Il testo non può essere vuoto."); return; }
    if (local && !local.mem.autore) {
      var nomeAutore = norm(($("#ed-autore", pop) || {}).value || "");
      if (!nomeAutore) { showToast("Scrivi il tuo nome e cognome prima di salvare."); $("#ed-autore", pop).focus(); return; }
      local.mem.autore = nomeAutore; local.salvaMem(); myId = nomeAutore;
    }
    if (testo === i.orig) return ripristina();
    var prima = overrides[i.id] ? overrides[i.id].testo : i.orig, now = new Date().toISOString();
    var doc = { k: i.key, ctx: i.ctx, contesto: i.label, elemento: i.elemento, servizioId: i.servizioId || "", originale: i.orig, testo: testo, nota: nota, stato: stato, autore: myId || "", quando: now };
    var btn = $('[data-pop="save"]', pop); btn.disabled = true; btn.textContent = "Salvataggio…";
    try {
      await db.collection("modifiche").doc(i.id).set(doc);
      try { await db.collection("registro").add({ k: i.id, contesto: i.label, originale: i.orig, prima: prima, dopo: testo, nota: nota, stato: stato, autore: myId || "", quando: now, azione: "modifica" }); } catch (e) { /* lo storico è accessorio */ }
      overrides[i.id] = doc; applyAll(); segnaDaEsportare(); refreshBar();
      closePop(); showToast(local ? "Proposta salvata in questo browser. Ricordati di esportarla." : "Proposta salvata.");
    } catch (e) { btn.disabled = false; btn.textContent = "Salva proposta"; erroreScrittura(e); }
  }
  async function ripristina() {
    if (!current || !db || !canWrite) return;
    var i = current, o = overrides[i.id];
    if (!o) { closePop(); return; }
    try {
      await db.collection("modifiche").doc(i.id).delete();
      try { await db.collection("registro").add({ k: i.id, contesto: i.label, originale: i.orig, prima: o.testo, dopo: i.orig, nota: "", stato: "", autore: myId || "", quando: new Date().toISOString(), azione: "ripristino" }); } catch (e) { /* accessorio */ }
      delete overrides[i.id]; applyAll(); segnaDaEsportare(); refreshBar();
      closePop(); showToast("Proposta eliminata: torna il testo originale.");
    } catch (e) { erroreScrittura(e); }
  }

  // ------------------------------------------------------------ elenco delle proposte
  var filtro = { q: "", stato: "" };
  function elenco() {
    return Object.keys(overrides).map(function (id) { return Object.assign({ id: id }, overrides[id]); })
      .sort(function (a, b) { return (a.contesto || "").localeCompare(b.contesto || "") || (a.originale || "").localeCompare(b.originale || ""); });
  }
  async function openPanel() {
    panel.hidden = false;
    renderPanel();
    await risolviNomi(elenco().map(function (r) { return r.autore; }));
    renderPanel();
  }
  function renderPanel() {
    if (panel.hidden) return;
    var q = filtro.q.toLowerCase();
    var rows = elenco().filter(function (r) {
      if (filtro.stato && (r.stato || STATO_BASE) !== filtro.stato) return false;
      return !q || [r.contesto, r.originale, r.testo, r.nota].join(" ").toLowerCase().indexOf(q) >= 0;
    });
    var gruppi = {};
    rows.forEach(function (r) { var g = (r.ctx && (r.ctx.servizio ? r.ctx.settore + " › " + r.ctx.servizio : r.ctx.sezione)) || "Altro"; (gruppi[g] = gruppi[g] || []).push(r); });
    var keepQ = document.activeElement && document.activeElement.id === "ed-q";
    panel.innerHTML =
      '<div class="ed-pop-head"><h2 id="ed-panel-title">Proposte (' + Object.keys(overrides).length + ')</h2><button type="button" class="ed-x" data-pl="close" aria-label="Chiudi">×</button></div>' +
      '<div class="ed-row"><div><label class="ed-lab" for="ed-q">Cerca</label><input id="ed-q" type="search" value="' + esc(filtro.q) + '" placeholder="Servizio, mansione, testo…"></div>' +
      '<div><label class="ed-lab" for="ed-f">' + STATO_NOME + '</label><select id="ed-f"><option value="">Tutti</option>' + Object.keys(STATI).map(function (k) { return '<option value="' + k + '"' + (filtro.stato === k ? " selected" : "") + ">" + STATI[k] + "</option>"; }).join("") + "</select></div></div>" +
      (rows.length ? Object.keys(gruppi).sort().map(function (g) {
        return '<section class="ed-group"><h3>' + esc(g) + "</h3>" + gruppi[g].map(function (r) {
          return '<article class="ed-item"><p class="ed-item-ctx">' + esc(r.contesto) + "</p>" +
            '<p class="ed-was">' + esc(r.originale) + '</p><p class="ed-now">' + esc(r.testo) + "</p>" +
            (r.nota ? '<p class="ed-item-nota">Nota: ' + esc(r.nota) + "</p>" : "") +
            '<p class="ed-meta"><span class="ed-stato ed-' + esc(r.stato || STATO_BASE) + '">' + esc(STATI[r.stato] || STATI[STATO_BASE]) + "</span> " + esc(nome(r.autore)) + " · " + esc(quando(r.quando)) +
            "</p>" +
            '<div class="ed-item-actions"><button type="button" class="ed-link" data-go="' + esc(r.id) + '">Vai al testo</button>' +
            (canWrite ? '<button type="button" class="ed-link" data-mod="' + esc(r.id) + '">Modifica</button><button type="button" class="ed-link ed-link-danger" data-del="' + esc(r.id) + '">Elimina</button>' : "") +
            "</div></article>";
        }).join("") + "</section>";
      }).join("") : '<p class="ed-muted">' + (Object.keys(overrides).length ? "Nessuna proposta corrisponde ai filtri." : "Ancora nessuna proposta. Attiva «Modifica testi» e clicca un testo della pagina.") + "</p>");
    if (keepQ) { var qi = $("#ed-q", panel); qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); }
  }
  panel.addEventListener("input", function (e) {
    if (e.target.id === "ed-q") { filtro.q = e.target.value; renderPanel(); }
    if (e.target.id === "ed-f") { filtro.stato = e.target.value; renderPanel(); }
  });
  panel.addEventListener("click", function (e) {
    if (e.target.closest('[data-pl="close"]')) { panel.hidden = true; return; }
    var go = e.target.closest("[data-go]");
    if (go) vaiA(go.getAttribute("data-go"));
    var mod = e.target.closest("[data-mod]");
    if (mod) openPop(null, mod.getAttribute("data-mod"));
    var del = e.target.closest("[data-del]");
    if (del) {
      // doppio clic di conferma, senza finestre del browser
      if (del.dataset.armed !== "1") {
        del.dataset.armed = "1"; del.textContent = "Conferma eliminazione"; del.classList.add("ed-armed");
        setTimeout(function () { if (document.contains(del)) { del.dataset.armed = ""; del.textContent = "Elimina"; del.classList.remove("ed-armed"); } }, 4000);
        return;
      }
      var p = daProposta(del.getAttribute("data-del"));
      if (p) { current = p; ripristina(); }
    }
  });
  function trova(id) { return document.querySelector('[data-ed-id="' + id + '"]'); }
  function vaiA(id) {
    var r = overrides[id];
    var el = trova(id);
    function flash(n) {
      panel.hidden = true;
      n.scrollIntoView({ behavior: "smooth", block: "center" });
      n.classList.add("ed-flash"); setTimeout(function () { n.classList.remove("ed-flash"); }, 1800);
    }
    if (el && el.offsetParent !== null) return flash(el);
    if (r && r.servizioId && window.SD_LCN && window.SD_LCN.openService) {
      window.SD_LCN.openService(r.servizioId);
      setTimeout(function () {
        applyAll();
        var n = trova(id);
        if (n) { n.closest(".role-card") && n.closest(".role-card").querySelector("[data-role][aria-expanded='false']") && n.offsetParent === null && n.closest(".role-card").querySelector("[data-role]").click(); setTimeout(function () { flash(trova(id) || n); }, 120); }
        else showToast("Apri la card della mansione nella scheda per vedere il testo.");
      }, 450);
      return;
    }
    showToast(r && r.ctx && r.ctx.passo ? "Il testo è in «" + r.ctx.passo + "»: percorri l'orientamento fino a quel passo." : "Il testo non è visibile ora: apri la sezione o la finestra in cui compare.");
  }

  // ------------------------------------------------------------ export
  function csvCell(v) { v = v == null ? "" : String(v); return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function righeExport() {
    return elenco().map(function (r) {
      var c = r.ctx || {};
      return { "ID testo": r.id, Sezione: c.sezione || "", Passo: c.passo || "", Settore: c.settore || "", Territorio: c.territorio || "", Servizio: c.servizio || "", Mansione: c.mansione || "",
        "Altro contesto": [c.percorso, c.area, c.storia, c.finestra].filter(Boolean).join(" · "), Elemento: r.elemento || "",
        "Testo originale": r.originale, "Testo proposto": r.testo, Nota: r.nota || "", [STATO_NOME]: STATI[r.stato] || STATI[STATO_BASE], Autore: nome(r.autore), "Ultima modifica": r.quando || "" };
    });
  }
  function toCsv(rows) {
    if (!rows.length) return "";
    var cols = Object.keys(rows[0]);
    return "﻿" + [cols.join(";")].concat(rows.map(function (r) { return cols.map(function (c) { return csvCell(r[c]); }).join(";"); })).join("\r\n");
  }
  function oggi() { return new Date().toISOString().slice(0, 10); }
  async function salvaFile(filename, data) {
    if (!downloads) { showToast("Il download non è disponibile in questa vista."); return; }
    try { await downloads.save({ filename: filename, data: data }); showToast(local ? "File scaricato: ora invialo a " + EMAIL : "File pronto: " + filename); return true; }
    catch (e) { if (e && e.code !== "declined") showToast("Download non riuscito (" + (e.code || "errore") + ")."); return false; }
  }
  function openExport() {
    panel.hidden = false;
    if (local) return openExportLocale();
    panel.innerHTML =
      '<div class="ed-pop-head"><h2 id="ed-panel-title">Esporta le proposte</h2><button type="button" class="ed-x" data-pl="close" aria-label="Chiudi">×</button></div>' +
      '<p>Le proposte in vigore sono <b>' + Object.keys(overrides).length + "</b>. Il file Excel ha una riga per testo con sezione, settore, territorio, servizio, mansione, testo originale e testo proposto.</p>" +
      '<div class="ed-actions ed-col">' +
        '<button type="button" class="ed-btn ed-main" data-ex="csv">Proposte per Excel (CSV)</button>' +
        '<button type="button" class="ed-btn" data-ex="storico">Storico completo delle modifiche (CSV)</button>' +
        '<button type="button" class="ed-btn" data-ex="json">Proposte in formato dati (JSON)</button>' +
      "</div>" +
      '<p class="ed-hint">Le proposte restano salvate anche sulla pagina: Claude può leggerle direttamente e applicarle alla matrice e ai contenuti del sito.</p>';
  }
  function openExportLocale() {
    var n = Object.keys(overrides).length, m = local.mem;
    var oggetto = "Proposte testi Lavora con noi" + (m.autore ? " – " + m.autore : "");
    var corpo = "Ciao Marco,\n\nin allegato il file con le mie proposte di modifica ai testi della pagina Lavora con noi.\n\n" + (m.autore || "");
    panel.innerHTML =
      '<div class="ed-pop-head"><h2 id="ed-panel-title">Esporta e invia le proposte</h2><button type="button" class="ed-x" data-pl="close" aria-label="Chiudi">×</button></div>' +
      (m.autore ? '<p class="ed-meta">Proposte di <b>' + esc(m.autore) + '</b> <button type="button" class="ed-link" data-ex="nome">cambia nome</button></p>' : "") +
      '<ol class="ed-steps">' +
        "<li><b>Scarica il file</b> con le tue " + n + (n === 1 ? " proposta" : " proposte") + ": si apre con Excel e ha una riga per testo, con il contesto, il testo originale e quello proposto.</li>" +
        '<li><b>Invialo per email</b> a <span class="ed-mail">' + esc(EMAIL) + '</span>, come allegato.</li>' +
      "</ol>" +
      '<div class="ed-actions ed-col">' +
        '<button type="button" class="ed-btn ed-main" data-ex="csv"' + (n ? "" : " disabled") + ">1. Scarica il file per Excel (CSV)</button>" +
        '<a class="ed-btn" href="mailto:' + esc(EMAIL) + "?subject=" + encodeURIComponent(oggetto) + "&body=" + encodeURIComponent(corpo) + '">2. Scrivi la mail a Marco</a>' +
        '<button type="button" class="ed-btn ed-ghost" data-ex="copia">Copia l\'indirizzo email</button>' +
      "</div>" +
      '<p class="ed-hint">Il pulsante «Scrivi la mail» apre il tuo programma di posta: ricordati di allegare il file scaricato. Se non si apre, copia l\'indirizzo e scrivi la mail come al solito.</p>' +
      (m.ultimoExport ? '<p class="ed-hint">Ultimo file scaricato: ' + esc(quando(m.ultimoExport)) + (m.daEsportare ? " · <b>ci sono modifiche successive non ancora esportate</b>" : "") + "</p>" : "") +
      '<details class="ed-more"><summary>Altre opzioni</summary>' +
        '<div class="ed-actions ed-col"><button type="button" class="ed-btn" data-ex="storico">Storico delle mie modifiche (CSV)</button>' +
        '<button type="button" class="ed-btn" data-ex="json">Proposte in formato dati (JSON)</button>' +
        '<button type="button" class="ed-btn ed-danger" data-ex="svuota"' + (n ? "" : " disabled") + ">Svuota le mie proposte (dopo averle inviate)</button></div>" +
        '<p class="ed-hint">Le proposte restano solo in questo browser e su questo computer: se cambi dispositivo o cancelli i dati di navigazione non le ritrovi. Esportale prima.' + (local.persistente() ? "" : " <b>Attenzione: questo browser non permette di salvarle, esportale prima di chiudere la pagina.</b>") + "</p>" +
      "</details>";
  }
  var svuotaArmato = false;
  panel.addEventListener("click", async function (e) {
    var b = e.target.closest("[data-ex]");
    if (!b) return;
    var t = b.getAttribute("data-ex");
    if (local && t === "copia") {
      try { await navigator.clipboard.writeText(EMAIL); showToast("Indirizzo copiato: " + EMAIL); }
      catch (err) { showToast("Copia non riuscita: l'indirizzo è " + EMAIL); }
      return;
    }
    if (local && t === "nome") {
      var nuovo = norm(window.prompt ? (window.prompt("Il tuo nome e cognome", local.mem.autore) || "") : "");
      if (nuovo) { local.mem.autore = nuovo; local.salvaMem(); myId = nuovo; openExportLocale(); }
      return;
    }
    if (local && t === "svuota") {
      if (!svuotaArmato) { svuotaArmato = true; b.textContent = "Conferma: cancella tutte le mie proposte"; b.classList.add("ed-armed"); setTimeout(function () { svuotaArmato = false; if (document.contains(b)) { b.textContent = "Svuota le mie proposte (dopo averle inviate)"; b.classList.remove("ed-armed"); } }, 5000); return; }
      svuotaArmato = false;
      Object.keys(local.mem.docs).forEach(function (k) { if (k.indexOf("modifiche/") === 0) delete local.mem.docs[k]; });
      local.mem.daEsportare = false; local.salvaMem();
      overrides = {}; applyAll(); refreshBar(); openExportLocale(); showToast("Proposte cancellate da questo browser.");
      return;
    }
    await risolviNomi(elenco().map(function (r) { return r.autore; }));
    var chi = local && local.mem.autore ? "-" + local.mem.autore.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "";
    if (t === "csv") {
      var rows = righeExport(); if (!rows.length) return showToast("Non ci sono ancora proposte da esportare.");
      if (await salvaFile("proposte-testi-lavora-con-noi" + chi + "-" + oggi() + ".csv", toCsv(rows))) { segnaEsportato(); if (local) openExportLocale(); }
    }
    if (t === "json") { if (await salvaFile("proposte-testi-lavora-con-noi" + chi + "-" + oggi() + ".json", JSON.stringify(elenco(), null, 2))) segnaEsportato(); }
    if (t === "storico") {
      if (!db) return showToast("Storico non disponibile in questa vista.");
      try {
        var snap = await db.collection("registro").orderBy("quando", "asc").limit(1000).get();
        var rs = snap.docs.map(function (d) { return d.data(); });
        await risolviNomi(rs.map(function (r) { return r.autore; }));
        if (!rs.length) return showToast("Lo storico è vuoto.");
        salvaFile("storico-testi-lavora-con-noi-" + oggi() + ".csv", toCsv(rs.map(function (r) {
          return { Quando: r.quando, Autore: nome(r.autore), Azione: r.azione === "ripristino" ? "Ripristino" : "Modifica", Contesto: r.contesto, "Testo originale": r.originale, Prima: r.prima, Dopo: r.dopo, Nota: r.nota || "", [STATO_NOME]: STATI[r.stato] || "" };
        })));
      } catch (err) { showToast("Storico non disponibile."); }
    }
  });

  // ------------------------------------------------------------ collegamento ai dati condivisi
  refreshBar(); setStatus(statusMsg);
  applyAll();
  (async function () {
    var c = local ? { use: function (n) { return Promise.resolve(local.caps[n] || null); } } : (window.claude && window.claude.use ? window.claude : null);
    if (!c) { setStatus("Anteprima locale: per salvare apri la pagina su claude.ai."); return; }
    var res = await Promise.all([c.use("db"), c.use("user"), c.use("downloads")]);
    db = res[0]; user = res[1]; downloads = res[2];
    if (!db) { setStatus("Salvataggio condiviso non disponibile: accedi a claude.ai per proporre modifiche."); return; }
    if (user) {
      try { myId = await user.id(); } catch (e) { myId = null; }
      var w = null; try { w = await user.can("data.write"); } catch (e) { w = null; }
      canWrite = w !== false;
    } else canWrite = true;
    var timer = setTimeout(function () { setStatus("Le proposte non sono ancora raggiungibili: potrebbero non essere aggiornate."); }, 10000);
    db.collection("modifiche").onSnapshot(function (snap) {
      if (!snap.metadata.fromCache) clearTimeout(timer);
      var next = {};
      snap.docs.forEach(function (d) { var v = d.data(); if (v && v.testo) next[d.id] = v; });
      overrides = next;
      if (!local) setStatus(canWrite ? "" : "Sola lettura: serve il ruolo Contributor per salvare.");
      refreshBar(); applyAll(); renderPanel();
    }, function () {
      clearTimeout(timer);
      setStatus("Le proposte non sono raggiungibili in questa vista.");
    });
  })();

  window.SD_EDIT = { applyAll: applyAll, info: function (el) { return info(el); }, overrides: function () { return overrides; } };
})();
