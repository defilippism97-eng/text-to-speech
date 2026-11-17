// Test della versione di revisione dei testi (dist/lavora-con-noi.editor.html) con un finto
// window.claude (db in memoria, user, downloads). Verifica salvataggio, contesto, anteprima,
// confronto con l'originale, ripristino, modali ed export CSV.
// Uso: NODE_PATH=$(npm root -g) node build/test_editor.mjs [cartella-screenshot]
import { createRequire } from "module";
import path from "path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const shots = process.argv[2];

const MOCK = `
(() => {
  const store = {}; const subs = [];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const snapDoc = (id, data) => ({ id, exists: !!data, data: () => data && clone(data), metadata: { fromCache: false, hasPendingWrites: false } });
  const notify = () => subs.forEach(s => s());
  function coll(path) {
    const docs = () => Object.keys(store).filter(k => k.startsWith(path + "/") && k.split("/").length === path.split("/").length + 1);
    const query = (filters = [], order = null, lim = 1000) => ({
      where: (f, op, v) => query(filters.concat([[f, op, v]]), order, lim),
      orderBy: (f, d = "asc") => query(filters, [f, d], lim),
      limit: (n) => query(filters, order, n),
      get: async () => {
        let ks = docs().filter(k => filters.every(([f, op, v]) => op === "==" ? store[k][f] === v : true));
        if (order) ks.sort((a, b) => (store[a][order[0]] > store[b][order[0]] ? 1 : -1) * (order[1] === "desc" ? -1 : 1));
        const d = ks.slice(0, lim).map(k => snapDoc(k.split("/").pop(), store[k]));
        return { docs: d, size: d.length, empty: !d.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } };
      },
      onSnapshot(next) { const run = async () => next(await this.get()); subs.push(run); run(); return () => {}; },
    });
    const q = query();
    return Object.assign(q, {
      path,
      doc: (id) => ({ id, path: path + "/" + id,
        get: async () => snapDoc(id, store[path + "/" + id]),
        set: async (d) => { store[path + "/" + id] = clone(d); notify(); },
        update: async (d) => { Object.assign(store[path + "/" + id], clone(d)); notify(); },
        delete: async () => { delete store[path + "/" + id]; notify(); } }),
      add: async (d) => { const id = "r" + Math.random().toString(36).slice(2); store[path + "/" + id] = clone(d); notify(); return { id }; },
    });
  }
  window.__saved = [];
  const caps = {
    db: { collection: coll, doc: (p) => coll(p.split("/").slice(0, -1).join("/")).doc(p.split("/").pop()) },
    user: { id: async () => "u-test", can: async () => true, isOwner: async () => true, canEdit: async () => true, profiles: async (ids) => Object.fromEntries(ids.map(i => [i, { id: i, name: "Maria Rossi" }])) },
    downloads: { save: async (r) => { window.__saved.push(r); return { status: "saved" }; } },
  };
  window.__store = store;
  window.claude = { use: (n) => new Promise(r => setTimeout(() => r(caps[n] || null), 50)) };
})();`;

const browser = await chromium.launch();
const errors = [];
const ok = [];
const nb = (t) => t.replace(/\s+/g, " ");
const check = (cond, msg) => { if (cond) ok.push(msg); else errors.push("FALLITO: " + msg); };
for (const [name, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(name + " JS: " + e.message));
  await ctx.addInitScript(MOCK);
  await page.goto("file://" + path.join(root, "dist/lavora-con-noi.editor.html"));
  await page.waitForTimeout(800);
  check(await page.locator(".ed-bar").isVisible(), name + ": barra di revisione visibile");

  // 1. titolo della hero
  await page.keyboard.press("e");
  await page.click("#hero-title");
  await page.waitForSelector(".ed-pop:not([hidden])");
  const chips = await page.locator(".ed-ctx").innerText();
  check(chips.includes("Apertura"), name + ": contesto della hero = Apertura");
  if (shots && name === "desktop") await page.screenshot({ path: path.join(shots, "ed-1-pop.png") });
  await page.fill("#ed-text", "Scopri chi puoi diventare con Società Dolce.");
  await page.fill("#ed-nota", "Prova di revisione");
  await page.click('[data-pop="save"]');
  await page.waitForTimeout(300);
  const h1 = await page.locator("#hero-title").innerText();
  check(h1.includes("con Società Dolce"), name + ": anteprima della proposta nel titolo");
  check(await page.locator("#hero-title.ed-changed").count() === 1, name + ": titolo evidenziato come modificato");

  // 2. confronto con l'originale
  await page.click('[data-ed="view"]'); await page.waitForTimeout(200);
  check(nb(await page.locator("#hero-title").innerText()).includes("in Società Dolce"), name + ": «Vedi originale» mostra il testo originale");
  await page.click('[data-ed="view"]'); await page.waitForTimeout(200);

  // 3. una mansione nella scheda di un servizio
  await page.keyboard.press("e"); // navigazione
  await page.evaluate(() => { window.SD_LCN.state.titoli = ["l19"]; window.SD_LCN.goTo(5); });
  await page.waitForTimeout(400);
  await page.locator("[data-open]").first().click();
  await page.waitForSelector("#sheet:not([hidden])");
  await page.keyboard.press("e");
  const sintesi = page.locator(".role-card .role-detail:not([hidden]) .full p").first();
  await sintesi.click();
  await page.waitForSelector(".ed-pop:not([hidden])");
  const c2 = await page.locator(".ed-ctx").innerText();
  check(c2.includes("Scheda servizio") && c2.toLowerCase().includes("mansione") && c2.toLowerCase().includes("servizio"), name + ": contesto completo (scheda › settore › territorio › servizio › mansione)");
  await page.fill("#ed-text", "Testo di prova per la sintesi del ruolo in questo servizio.");
  await page.click('[data-pop="save"]'); await page.waitForTimeout(300);
  check((await sintesi.innerText()).includes("Testo di prova"), name + ": anteprima nella card della mansione");
  if (shots && name === "desktop") await page.screenshot({ path: path.join(shots, "ed-2-scheda.png") });
  // la scheda si richiude e riapre: la proposta torna
  await page.keyboard.press("e");
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  await page.locator("[data-open]").first().click(); await page.waitForTimeout(500);
  check((await page.locator(".role-card .role-detail:not([hidden]) .full p").first().innerText()).includes("Testo di prova"), name + ": la proposta resta dopo aver riaperto la scheda");
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);

  // 4. testo in un modulo (dialog)
  await page.evaluate(() => document.querySelector('[data-action="spontanea"]').click());
  await page.waitForTimeout(300);
  await page.click('#modal [data-ed="mode"]'); // la barra è dentro la finestra aperta
  await page.locator('#modal label[for="f-nome"]').click();
  await page.waitForTimeout(200);
  check(await page.locator("#modal .ed-pop:not([hidden])").count() === 1, name + ": la finestra di modifica si apre anche sopra un modulo");
  check((await page.locator(".ed-ctx").innerText()).includes("Candidatura spontanea"), name + ": contesto del modulo");
  if (shots && name === "desktop") await page.screenshot({ path: path.join(shots, "ed-modale.png") });
  await page.click('#modal .ed-pop [data-pop="close"]');
  await page.click('#modal [data-ed="mode"]');
  await page.evaluate(() => document.getElementById("modal").close());
  await page.waitForTimeout(150);
  check(await page.evaluate(() => document.querySelector(".ed-bar").closest("dialog") === null), name + ": la barra torna nella pagina alla chiusura della finestra");

  // 5. elenco ed export
  await page.click('[data-ed="list"]'); await page.waitForTimeout(200);
  check(await page.locator(".ed-item").count() === 2, name + ": elenco con 2 proposte");
  if (shots && name === "desktop") await page.screenshot({ path: path.join(shots, "ed-3-elenco.png") });
  await page.click('[data-pl="close"]');
  await page.click('[data-ed="export"]'); await page.click('[data-ex="csv"]'); await page.waitForTimeout(300);
  const saved = await page.evaluate(() => window.__saved.map(s => ({ f: s.filename, d: s.data })));
  check(saved.length === 1 && saved[0].f.endsWith(".csv"), name + ": export CSV");
  const csv = saved[0] ? saved[0].d : "";
  check(csv.includes("Testo originale;Testo proposto") && csv.includes("Maria Rossi") && csv.includes("Prova di revisione"), name + ": CSV con colonne, autore e nota");
  const righe = csv.split("\r\n");
  check(righe.length === 3, name + ": CSV con intestazione + 2 righe");
  await page.click('[data-pl="close"]');

  // 6. ripristino dell'originale
  await page.evaluate(() => { window.scrollTo(0, 0); document.activeElement && document.activeElement.blur(); });
  if (await page.getAttribute('[data-ed="mode"]', "aria-pressed") !== "true") await page.click('[data-ed="mode"]');
  await page.click("#hero-title");
  await page.click('[data-pop="revert"]'); await page.waitForTimeout(300);
  check(nb(await page.locator("#hero-title").innerText()).includes("in Società Dolce"), name + ": ripristino del testo originale");
  check(await page.evaluate(() => Object.keys(window.__store).filter(k => k.startsWith("registro/")).length) === 3, name + ": storico con 3 voci (2 modifiche + 1 ripristino)");
  if (shots) await page.screenshot({ path: path.join(shots, `ed-4-${name}.png`) });
  await ctx.close();
}
await browser.close();
console.log(ok.map(m => "✓ " + m).join("\n"));
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`\n${ok.length} controlli superati`);
